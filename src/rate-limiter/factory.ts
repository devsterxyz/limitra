import type { RateLimiter } from "./types.js"
import { FixedWindowLimiter } from "./fixed-window.js"
import { SlidingWindowLimiter } from "./sliding-window.js"
import { TokenBucketLimiter } from "./token-bucket.js"  

export type RateLimiterAlgorithm =
  | "fixed"
  | "sliding"
  | "token-bucket"

export function createRateLimiter(algorithm: RateLimiterAlgorithm): RateLimiter{
  switch(algorithm){
    case "fixed":
      return new FixedWindowLimiter()

    case "sliding":
      return new SlidingWindowLimiter()

    case "token-bucket":
      return new TokenBucketLimiter()

    default:
      throw new Error(`Unsupported rate limiter: ${algorithm}`)
  }
}