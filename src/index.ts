import redis from "./redis/client.js";
import { checkRateLimit } from "./rate-limiter/fixed-window.js";

await redis.connect();

const ip = "192.168.1.10";

for (let i = 1; i <= 12; i++) {
  const result = await checkRateLimit(ip);

  console.log(`Request ${i}:`, result);
}