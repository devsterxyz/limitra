/// <reference types="node" />

import { beforeEach, describe, expect, it } from "vitest";
import { getRateLimiterAlgorithm } from "../src/rate-limiter/config";


describe("Rate Limiter Configuration", () => {
  beforeEach(() => {
    delete process.env.RATE_LIMIT_ALGORITHM
  })

  it("uses fixed as the default algorithm", () => {
    const algorithm = getRateLimiterAlgorithm()

    expect(algorithm).toBe("fixed")
  })

  it("accepts fixed window algorithm", () => {
    process.env.RATE_LIMIT_ALGORITHM = "fixed"

    const algorithm = getRateLimiterAlgorithm()

    expect(algorithm).toBe("fixed")
  })

  it("accepts sliding window algorithm", () => {
    process.env.RATE_LIMIT_ALGORITHM = "sliding"

    const algorithm = getRateLimiterAlgorithm()

    expect(algorithm).toBe("sliding")
  })

  it("accepts token bucket algorithm", () => {
    process.env.RATE_LIMIT_ALGORITHM = "token-bucket"

    const algorithm = getRateLimiterAlgorithm()

    expect(algorithm).toBe("token-bucket")
  })

  it("rejects an invalid algorithm", () => {
    process.env.RATE_LIMIT_ALGORITHM = "banana"

    expect(() => { getRateLimiterAlgorithm()}).toThrow(Error)
  })
})