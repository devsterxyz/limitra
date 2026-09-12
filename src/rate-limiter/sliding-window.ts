import redis from "../redis/client.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const slidingWindowScript = readFileSync(
  fileURLToPath(
    new URL("./scripts/sliding-window.lua", import.meta.url)
  ),
  "utf8"
);

export async function checkSlidingWindow(ip: string) {
  const rateLimit = 10;
  const windowSize = 60;

  const key = `rate-limit:sliding:${ip}`;

  const currentTime = Date.now();
  const windowStart = currentTime - windowSize * 1000;

  const requestId = randomUUID();

  const result = await redis.eval(slidingWindowScript, {
    keys: [key],
    arguments: [
      String(windowStart),
      String(currentTime),
      String(rateLimit),
      requestId,
    ],
  });

  const [allowedFlag, count] = result as [number, number];

  const allowed = allowedFlag === 1;

  return {
    allowed,
    count,
    remaining: Math.max(0, rateLimit - count),
  };
}