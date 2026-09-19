import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getRateLimiterAlgorithm } from "../src/rate-limiter/config";


describe("Rate Limit Middleware", () => {
  beforeEach(() => {
    delete process.env.RATE_LIMIT_ALGORITHM
  })

  it("uses fixed as the default algorithm", async() => {
    delete process.env.RATE_LIMIT_ALGORITHM

    const algorithm = getRateLimiterAlgorithm()

    expect(algorithm).toBe("fixed")
  })

  it("accepts fixed window algorithm", async() => {
    process.env.RATE_LIMIT_ALGORITHM = "fixed"

    const algorithm = getRateLimiterAlgorithm()

    expect(algorithm).toBe("fixed")
  })

  it("accepts sliding window algorithm", async() => {
    process.env.RATE_LIMIT_ALGORITHM = "sliding"

    const algorithm = getRateLimiterAlgorithm()

    expect(algorithm).toBe("sliding")
  })

  it("accepts token bucket algorithm", async() => {
    process.env.RATE_LIMIT_ALGORITHM = "token-bucket"

    const algorithm = getRateLimiterAlgorithm()

    expect(algorithm).toBe("token-bucket")
  })

  it("rejects an invalid algorithm", async() => {
    process.env.RATE_LIMIT_ALGORITHM = "banana"

    expect(() => { getRateLimiterAlgorithm()}).toThrow(Error)
  })
})