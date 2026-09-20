import redis from "../redis/client.js"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import type { RateLimitConfig } from "./config.js"
import type { RateLimiter, RateLimitResult } from "./types.js";

const fixedWindowScript = readFileSync(
  fileURLToPath(new URL("./scripts/fixed-window.lua", import.meta.url)),
  "utf8"
)



export class FixedWindowLimiter implements RateLimiter {
  constructor(private config: RateLimitConfig) {

  }
  async check(ip: string): Promise<RateLimitResult>{

    const currentWindow = Math.floor(Date.now() / 1000 / this.config.windowSize)

    const key = `rate-limit:${ip}:${currentWindow}`

    const currentSecond = Math.floor(Date.now() / 1000)
    const secondsIntoWindow = currentSecond % this.config.windowSize
    const secondsRemaining = this.config.windowSize - secondsIntoWindow

    const currReqCount = Number(
      await redis.eval(fixedWindowScript, {
        keys: [key],
        arguments: [String(secondsRemaining)],
      })
    )

    const remainingReq = Math.max(0, this.config.limit - currReqCount);

    const resetTime = await redis.ttl(key)

    if(currReqCount > this.config.limit){
      return {
        allowed: false,
        remaining: remainingReq,
        reset: resetTime,
        limit: this.config.limit,
      }
    }

    return {
      allowed: true,
      remaining: remainingReq,
      reset: resetTime,
      limit: this.config.limit,
    }
  }
}

