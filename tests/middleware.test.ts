import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import redis, { connectRedis, disconnectRedis } from "../src/redis/client.js"
import createApp from "../src/app.js"
import { createRateLimiter } from "../src/rate-limiter/factory.js"

describe("Rate Limit Middleware", () => {
  beforeAll(async () => {
    await connectRedis()
  })
  const limiter = createRateLimiter("fixed")
  const app = createApp(limiter)

  afterAll(async () => {
    await disconnectRedis()
  })

  beforeEach(async () => {
    await redis.flushDb()
  })

  it("returns rate limit headers", async () => {
    const response = await request(app).get("/api/test")

    expect(response.status).toBe(200)
    expect(response.headers["x-ratelimit-limit"]).toBe("10")
    expect(response.headers["x-ratelimit-remaining"]).toBeDefined()
  })

  it("rejects requests after the rate limit", async () => {
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
  })
})