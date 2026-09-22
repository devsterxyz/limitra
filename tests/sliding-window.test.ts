import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest"
import redis, { connectRedis, disconnectRedis, } from "../src/redis/client.js"
import { SlidingWindowLimiter } from "../src/rate-limiter/sliding-window.js"
import { getRateLimitConfig } from "../src/rate-limiter/config.js"


describe("Sliding Window Rate Limiter", () => {
  const config = getRateLimitConfig()
  const limiter = new SlidingWindowLimiter(config)
  beforeAll(async () => {
    await connectRedis()
  });

  afterAll(async () => {
    await disconnectRedis()
  });

  beforeEach(async () => {
    await redis.flushDb()
  });

  it("allows requests within the limit", async () => {
    const ip = "test-ip"

    const result = await limiter.check(ip)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
  });

  it("allows 10 requests within the limit", async () => {
    const ip = "test-ip"

    let result;

    for (let i = 0; i < 10; i++) {
      result = await limiter.check(ip)
    }

    expect(result?.allowed).toBe(true)
    expect(result?.remaining).toBe(0)
  });

  it("rejects the 11th request", async () => {
    const ip = "test-ip"

    let result;

    for (let i = 0; i < 11; i++) {
      result = await limiter.check(ip)
    }

    expect(result?.allowed).toBe(false)
    expect(result?.remaining).toBe(0)
    expect(result?.reset).toBeGreaterThan(0)
    expect(result?.reset).toBeLessThanOrEqual(config.windowSize)
  });

  it("handles concurrent requests", async () => {
    const ip = "concurrent-test"

    const results = await Promise.all(
      Array.from({ length: 100 }, () => limiter.check(ip)))

    const allowed = results.filter(
      (result) => result.allowed
    )

    const rejected = results.filter(
      (result) => !result.allowed
    )

    console.log("Allowed:", allowed.length)
    console.log("Rejected:", rejected.length)

    expect(allowed.length).toBe(10)
    expect(rejected.length).toBe(90)
  });

  it("ignores requests outside the sliding window", async () => {
    const ip = "expired-test"
    const key = `rate-limit:sliding:${ip}`

    const oldTimestamp = Date.now() - 61_000

    await redis.zAdd(key, {
      score: oldTimestamp,
      value: "old-request",
    });

    const result = await limiter.check(ip)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
  })
})