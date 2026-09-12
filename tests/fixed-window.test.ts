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

  it("sets an expiration on the rate limit key", async () => {
    const ip = "test-ip"
    await checkRateLimit(ip)
    const currentWindow = Math.floor(Date.now() / 1000 / 60);
    const key = `rate-limit:${ip}:${currentWindow}`;
    const ttl = Number(await redis.ttl(key))
    

    expect(ttl).toBeGreaterThan(0)
    expect(ttl).toBeLessThanOrEqual(60)
  })

  it("handles concurrent requests", async () => {
    const ip = "concurrent-test";

    const results = await Promise.all(
      Array.from({ length: 100 }, () => checkRateLimit(ip))
    );

    const allowed = results.filter((result) => result.allowed);
    const rejected = results.filter((result) => !result.allowed);

    console.log("Allowed:", allowed.length);
    console.log("Rejected:", rejected.length);

    expect(allowed.length).toBe(10);
    expect(rejected.length).toBe(90);

    const keys = await redis.keys("rate-limit:*");

    console.log("Keys:", keys);

    for (const key of keys) {
      const ttl = await redis.ttl(key);
      console.log("Key:", key, "TTL:", ttl);
    }
  });
});
