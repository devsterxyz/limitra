import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest"
import redis, { connectRedis, disconnectRedis } from "../src/redis/client.js"
import { FixedWindowLimiter } from "../src/rate-limiter/fixed-window.js"
import { getRateLimitConfig } from "../src/rate-limiter/config.js"

describe("Fixed Window Rate Limiter", () => {
  const config = getRateLimitConfig()
  const limiter = new FixedWindowLimiter(config)
  beforeAll(async () => {
    await connectRedis()
  })

  afterAll(async () => {
    await disconnectRedis()
  })

  beforeEach(async () => {
    await redis.flushDb()
  })

  it("allows requests within the limit", async () => {
    const ip = "test-ip"
    const result = await limiter.check(ip)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it("allows 10 requests within the limit", async () => {
    const ip = "test-ip"
    let result

    for(let i = 0; i < 10; i++){
      result = await limiter.check(ip)
    }

    expect(result?.allowed).toBe(true)
    expect(result?.remaining).toBe(0)
  })

  it("rejects the 11th request", async () => {
    const ip = "test-ip"
    let result

    for(let i = 0; i < 11; i++){
      result = await limiter.check(ip)
    }

    expect(result?.allowed).toBe(false)
    expect(result?.remaining).toBe(0)
  })

  it("sets an expiration on the rate limit key", async () => {
    const ip = "test-ip"

    await limiter.check(ip)

    const currentWindow = Math.floor(Date.now() / 1000 / 60)
    const key = `rate-limit:${ip}:${currentWindow}`

    const ttl = Number(await redis.ttl(key))

    expect(ttl).toBeGreaterThan(0)
    expect(ttl).toBeLessThanOrEqual(60)
  })

  it("handles concurrent requests", async () => {
    const ip = "concurrent-test"

    const results = await Promise.all(
      Array.from({ length: 100 }, () => limiter.check(ip))
    )

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
})