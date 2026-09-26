import redis from "../redis/client.js"
import type { RateLimitConfig } from "./config.js"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import type { RateLimiter, RateLimitResult } from "./types.js"

const tokenBucketScript = readFileSync(
  fileURLToPath(
    new URL("./scripts/token-bucket.lua", import.meta.url)
  ),
  "utf8"
)

export class TokenBucketLimiter implements RateLimiter {
  constructor(private config: RateLimitConfig) {

  }
  async check(ip: string): Promise<RateLimitResult> {
    const capacity = this.config.limit
    const refillRate = this.config.refillRate
    const requestCost = this.config.requestCost

    const key = `rate-limit:token:${ip}`

    const currentTime = Date.now()

    const result = await redis.eval(tokenBucketScript, {
      keys: [key],
      arguments: [
        String(currentTime),
        String(capacity),
        String(refillRate),
        String(requestCost),
      ],
    });

    const [allowedFlag, remaining, retryAfter] = result as [number, string | number, number?]

    const normalizedRemaining = Math.floor(Number(remaining))

    const response: RateLimitResult = {
      allowed: allowedFlag === 1,
      remaining: normalizedRemaining,
      limit: this.config.limit,
    }

    if (allowedFlag !== 1 && retryAfter !== undefined) {
      response.reset = retryAfter
    }

    return response
  }
}
