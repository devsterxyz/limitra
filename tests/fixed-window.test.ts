import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest"

import redis, {connectRedis, disconnectRedis} from "../src/redis/client.js"

import { checkRateLimit } from "../src/rate-limiter/fixed-window.js"

describe("Fixed Window Rate Limiter", () => {
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

    const result = await checkRateLimit(ip)

    expect(result.allowed).toBe(true)
    expect(result.count).toBe(1)
    expect(result.remaining).toBe(9)
  });

  it("allows 10 req within the limit", async() => {
    const ip = "test-ip"
    let result
    for(let i=0; i<10; i++){
      result = await checkRateLimit(ip)
    }
    expect(result?.allowed).toBe(true)
    expect(result?.count).toBe(10)
    expect(result?.remaining).toBe(0)
  })

  it("rejects the 11th request", async() => {
    const ip = "test-ip"
    let result
    for(let i=0; i<11; i++){
      result = await checkRateLimit(ip)
    }
    expect(result?.allowed).toBe(false)
    expect(result?.count).toBe(11)
    expect(result?.remaining).toBe(0)
  })
});
