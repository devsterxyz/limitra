import { describe, expect, it } from "vitest"
import { createRateLimiter } from "../src/rate-limiter/factory.js"
import { FixedWindowLimiter } from "../src/rate-limiter/fixed-window.js"
import { SlidingWindowLimiter } from "../src/rate-limiter/sliding-window.js"
import { TokenBucketLimiter } from "../src/rate-limiter/token-bucket.js"
import { getRateLimitConfig } from "../src/rate-limiter/config.js"

describe("Rate Limiter Factory", () => {
  it("creates a Fixed Window limiter", () => {
    process.env.RATE_LIMIT_ALGORITHM="fixed"
    const config = getRateLimitConfig()
    const limiter = createRateLimiter(config)
    expect(limiter).toBeInstanceOf(FixedWindowLimiter)
  })

  it("creates a Sliding Window limiter", () => {
    process.env.RATE_LIMIT_ALGORITHM="sliding"
    const config = getRateLimitConfig()
    const limiter = createRateLimiter(config)
    expect(limiter).toBeInstanceOf(SlidingWindowLimiter)
  })

  it("creates a Token Bucket limiter", () => {
    process.env.RATE_LIMIT_ALGORITHM="token-bucket"
    const config = getRateLimitConfig()
    const limiter = createRateLimiter(config)
    expect(limiter).toBeInstanceOf(TokenBucketLimiter)
  })

  it("throws an error for an unsupported algorithm", () => {
    expect(() => {createRateLimiter("banana" as any)}).toThrow(Error)
  })
})