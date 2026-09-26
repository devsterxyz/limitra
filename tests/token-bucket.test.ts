import { beforeAll, afterAll, beforeEach, describe, expect, it, } from "vitest"
import redis, { connectRedis, disconnectRedis, } from "../src/redis/client.js"
import { TokenBucketLimiter } from "../src/rate-limiter/token-bucket.js"
import { getRateLimitConfig } from "../src/rate-limiter/config.js"


describe("Token Bucket Rate Limiter", () => {
  const config = getRateLimitConfig()
  const limiter = new TokenBucketLimiter(config);
  beforeAll(async () => {
    await connectRedis()
  });

  afterAll(async () => {
    await disconnectRedis()
  });

  beforeEach(async () => {
    await redis.flushDb()
  });

  it("allows the first request", async () => {
    const ip = "test-ip"
    const result = await limiter.check(ip)

    expect(result?.allowed).toBe(true)
    expect(result?.remaining).toBe(9)
  })

  it("allows 10 requests from the full bucket", async () => {
    const ip = "test-ip"
    let result

    for(let i = 0; i < 10; i++){
      result = await limiter.check(ip)
    }

    expect(result?.allowed).toBe(true)
    expect(result?.remaining).toBe(0)
  })

  it("rejects when the bucket is empty", async () => {
    const ip = "test-ip";

    for(let i = 0; i < 10; i++){
      await limiter.check(ip)
    }

    const result = await limiter.check(ip)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.reset).toBeGreaterThan(0)
  })

  it("refills tokens over time", async () => {
    const ip = "refill-test"
    const key = `rate-limit:token:${ip}`

    const twoSecondsAgo = Date.now() - 2000

    await redis.hSet(key, {
      tokens: "0",
      lastRefill: String(twoSecondsAgo),
    })

    const result = await limiter.check(ip)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(1)
  })

  it("allows a request once one second has refilled one token", async () => {
    const ip = "one-second-refill-test"
    const key = `rate-limit:token:${ip}`

    await redis.hSet(key, {
      tokens: "0",
      lastRefill: String(Date.now() - 1000),
    })

    const result = await limiter.check(ip)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
  })

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
  })

  it("returns retry time when the bucket is empty", async () => {
    const ip = "retry-test"
    const key = `rate-limit:token:${ip}`

    const now = Date.now()

    await redis.hSet(key, {
      tokens: "0",
      lastRefill: String(now),
    })

    const result = await limiter.check(ip)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.reset).toBe(1)
  })
})
