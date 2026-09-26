import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import redis, { connectRedis, disconnectRedis } from "../src/redis/client.js"
import createApp from "../src/app.js"
import { createRateLimiter } from "../src/rate-limiter/factory.js"
import type { RateLimiter } from "../src/rate-limiter/types.js"
import { getRateLimitConfig } from "../src/rate-limiter/config.js"

function createTestApp() {
  const config = getRateLimitConfig()
  const fixedLimiter = createRateLimiter({ ...config, algorithm: "fixed" })
  const slidingLimiter = createRateLimiter({ ...config, algorithm: "sliding" })
  const tokenBucketLimiter = createRateLimiter({ ...config, algorithm: "token-bucket" })
  return createApp(fixedLimiter, slidingLimiter, tokenBucketLimiter)
}

describe("Rate Limit Middleware", () => {
  beforeAll(async () => {
    await connectRedis()
  })

  afterAll(async () => {
    await disconnectRedis()
  })

  beforeEach(async () => {
    await redis.flushDb()
  })

  it.each([
    ["fixed",        "/api/test/fixed"],
    ["sliding",      "/api/test/sliding"],
    ["token-bucket", "/api/test/token-bucket"],
  ])("returns rate limit headers for %s", async (_algorithm, route) => {
    const app = createTestApp()
    const response = await request(app).get(route)

    expect(response.status).toBe(200)
    expect(response.headers["x-ratelimit-limit"]).toBe("10")
    expect(response.headers["x-ratelimit-remaining"]).toBeDefined()
    expect(response.headers["retry-after"]).toBeUndefined()
  })

  it("rejects requests after the rate limit (fixed window)", async () => {
    const app = createTestApp()
    const responses: request.Response[] = []
    for (let i = 0; i < 11; i++) {
      responses.push(await request(app).get("/api/test/fixed"))
    }

    for (let i = 0; i < 10; i++) {
      expect(responses[i]?.status).toBe(200)
      expect(responses[i]?.headers["x-ratelimit-limit"]).toBe("10")
      expect(responses[i]?.headers["x-ratelimit-remaining"]).toBeDefined()
    }

    expect(responses[10]?.status).toBe(429)
    expect(responses[10]?.headers["x-ratelimit-limit"]).toBe("10")
    expect(responses[10]?.headers["x-ratelimit-remaining"]).toBeDefined()
    expect(responses[10]?.headers["retry-after"]).toBeDefined()
    expect(Number(responses[10]?.headers["retry-after"])).toBeGreaterThan(0)
    expect(Number(responses[10]?.headers["retry-after"])).toBeLessThanOrEqual(60)
  })

  it("rejects requests after the rate limit (sliding window)", async () => {
    const app = createTestApp()
    const responses: request.Response[] = []
    for (let i = 0; i < 11; i++) {
      responses.push(await request(app).get("/api/test/sliding"))
    }

    for (let i = 0; i < 10; i++) {
      expect(responses[i]?.status).toBe(200)
      expect(responses[i]?.headers["x-ratelimit-limit"]).toBe("10")
      expect(responses[i]?.headers["x-ratelimit-remaining"]).toBeDefined()
    }

    expect(responses[10]?.status).toBe(429)
    expect(responses[10]?.headers["x-ratelimit-limit"]).toBe("10")
    expect(responses[10]?.headers["x-ratelimit-remaining"]).toBeDefined()
    expect(responses[10]?.headers["retry-after"]).toBeDefined()
  })

  it("rejects requests after the rate limit (token bucket)", async () => {
    const app = createTestApp()
    const responses: request.Response[] = []
    for (let i = 0; i < 11; i++) {
      responses.push(await request(app).get("/api/test/token-bucket"))
    }

    for (let i = 0; i < 10; i++) {
      expect(responses[i]?.status).toBe(200)
      expect(responses[i]?.headers["x-ratelimit-limit"]).toBe("10")
      expect(responses[i]?.headers["x-ratelimit-remaining"]).toBeDefined()
    }

    expect(responses[10]?.status).toBe(429)
    expect(responses[10]?.headers["x-ratelimit-limit"]).toBe("10")
    expect(responses[10]?.headers["x-ratelimit-remaining"]).toBeDefined()
    expect(responses[10]?.headers["retry-after"]).toBeDefined()
  })

  it("returns 503 when the rate limiter fails", async () => {
    const fakeLimiter: RateLimiter = {
      check: async (_ip: string) => {
        throw new Error("Redis unavailable")
      }
    }

    const app = createApp(fakeLimiter, fakeLimiter, fakeLimiter)

    const response = await request(app).get("/api/test/fixed")

    expect(response.status).toBe(503)
    expect(response.body.message).toBe("Internal server error")
  })
})