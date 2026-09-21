import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import redis, { connectRedis, disconnectRedis } from "../src/redis/client.js"
import createApp from "../src/app.js"
import { createRateLimiter } from "../src/rate-limiter/factory.js"
import type { RateLimiter, RateLimiterAlgorithm } from "../src/rate-limiter/types.js"
import { getRateLimitConfig } from "../src/rate-limiter/config.js"

function createTestApp(algorithm: RateLimiterAlgorithm) {
  process.env.RATE_LIMIT_ALGORITHM = algorithm
  const config = getRateLimitConfig()
  const limiter = createRateLimiter(config)
  const app = createApp(limiter)
  return app
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

  it.each(["fixed", "sliding", "token-bucket"])("returns rate limit headers for %s", async (algorithm) => {
    const app = createTestApp(algorithm as RateLimiterAlgorithm)
    const response = await request(app).get("/api/test")

    expect(response.status).toBe(200)
    expect(response.headers["x-ratelimit-limit"]).toBe("10")
    expect(response.headers["x-ratelimit-remaining"]).toBeDefined()
    expect(response.headers["retry-after"]).toBeUndefined()
  })

  it("rejects requests after the rate limit", async () => {
    const app = createTestApp("fixed")
    const response:request.Response[] = [];
    for(let i=0; i<11; i++){
      response.push(await request(app).get("/api/test"))
    }

    for(let i=0; i<10; i++){
      expect(response[i]?.status).toBe(200)
      expect(response[i]?.headers["x-ratelimit-limit"]).toBe("10")
      expect(response[i]?.headers["x-ratelimit-remaining"]).toBeDefined()
    }

    expect(response[10]?.status).toBe(429)
    expect(response[10]?.headers["x-ratelimit-limit"]).toBe("10")
    expect(response[10]?.headers["x-ratelimit-remaining"]).toBeDefined()
    expect(response[10]?.headers["retry-after"]).toBeDefined()
    expect(Number(response[10]?.headers["retry-after"])).toBeGreaterThan(0)
    expect(Number(response[10]?.headers["retry-after"])).toBeLessThanOrEqual(60)
  })

  it("returns 503 when the rate limiter fails", async () => {
    const fakeLimiter: RateLimiter = {
      check: async (ip: string) => {
        throw new Error("Redis unavailable")
      }
    }

    const app = createApp(fakeLimiter)

    const response = await request(app).get("/api/test")

    expect(response.status).toBe(503)
    expect(response.body.message).toBe("Internal server error")
  })
})