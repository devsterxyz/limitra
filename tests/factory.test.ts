import { describe, expect, it } from "vitest"
import { createRateLimiter } from "../src/rate-limiter/factory.js"
import { FixedWindowLimiter } from "../src/rate-limiter/fixed-window.js"
import { SlidingWindowLimiter } from "../src/rate-limiter/sliding-window.js"
import { TokenBucketLimiter } from "../src/rate-limiter/token-bucket.js"

describe("Rate Limiter Factory", () => {
  it("creates a Fixed Window limiter", () => {
    const limiter = createRateLimiter("fixed")
    expect(limiter).toBeInstanceOf(FixedWindowLimiter)
  })

  it("creates a Sliding Window limiter", () => {
    const limiter = createRateLimiter("sliding")
    expect(limiter).toBeInstanceOf(SlidingWindowLimiter)
  })

  it("creates a Token Bucket limiter", () => {
    const limiter = createRateLimiter("token-bucket")
    expect(limiter).toBeInstanceOf(TokenBucketLimiter)
  })
})