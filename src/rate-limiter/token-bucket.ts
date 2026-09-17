import redis from "../redis/client.js"
import { RATE_LIMIT } from "./config.js"
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
  async check(ip: string): Promise<RateLimitResult> {
    const capacity = RATE_LIMIT
    const refillRate = 1
    const requestCost = 1

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

    const [allowedFlag, remaining] = result as [number, number]

    const normalizedRemaining = Math.floor(remaining)

    return {
      allowed: allowedFlag === 1,
      remaining: normalizedRemaining,
      limit: RATE_LIMIT,
    }
  }
}