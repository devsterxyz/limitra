import redis from "../redis/client.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { RATE_LIMIT, WINDOW_SIZE } from "./config.js";

const slidingWindowScript = readFileSync(
  fileURLToPath(
    new URL("./scripts/sliding-window.lua", import.meta.url)
  ),
  "utf8"
);

export async function checkSlidingWindow(ip: string) {

  const key = `rate-limit:sliding:${ip}`;

  const currentTime = Date.now();
  const windowStart = currentTime - WINDOW_SIZE * 1000;

  const requestId = randomUUID();

  const result = await redis.eval(slidingWindowScript, {
    keys: [key],
    arguments: [
      String(windowStart),
      String(currentTime),
      String(RATE_LIMIT),
      requestId,
    ],
  });

  const [allowedFlag, count] = result as [number, number];

  const allowed = allowedFlag === 1;

  return {
    allowed,
    count,
    remaining: Math.max(0, RATE_LIMIT - count),
  };
}