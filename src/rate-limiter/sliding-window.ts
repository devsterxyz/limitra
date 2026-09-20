import redis from "../redis/client.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { RateLimitConfig } from "./config.js"
import type { RateLimiter, RateLimitResult } from "./types.js";

const slidingWindowScript = readFileSync(
  fileURLToPath(
    new URL("./scripts/sliding-window.lua", import.meta.url)
  ),
  "utf8"
);


export class SlidingWindowLimiter implements RateLimiter {
  constructor(private config: RateLimitConfig) {

  }
  async check(ip: string): Promise<RateLimitResult> {
    const key = `rate-limit:sliding:${ip}`

    const currentTime = Date.now()
    const windowStart = currentTime - this.config.windowSize * 1000

    const requestId = randomUUID()

    const result = await redis.eval(slidingWindowScript, {
      keys: [key],
      arguments: [
        String(windowStart),
        String(currentTime),
        String(this.config.limit),
        requestId,
        String(this.config.windowSize * 1000)
      ],
    })

    const [allowedFlag, count, retryAfter] = result as [number, number, number]
    const response: RateLimitResult = {
      allowed: allowedFlag === 1,
      remaining: Math.max(0, this.config.limit - count),
      limit: this.config.limit,
    }
    
    if (allowedFlag !== 1) {
      response.reset = retryAfter
    } 

    return response
  }
} 