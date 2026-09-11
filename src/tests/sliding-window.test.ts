import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import redis, {
  connectRedis,
  disconnectRedis,
} from "../redis/client.js";

import { checkSlidingWindow } from "../rate-limiter/sliding-window.js";

describe("Sliding Window Rate Limiter", () => {
  beforeAll(async () => {
    await connectRedis();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  beforeEach(async () => {
    await redis.flushDb();
  });

  it("allows requests within the limit", async () => {
    const ip = "test-ip";

    const result = await checkSlidingWindow(ip);

    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1);
    expect(result.remaining).toBe(9);
  });
});