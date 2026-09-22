import "dotenv/config"
import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL ? process.env.REDIS_URL : "redis://localhost:6379",
});

redis.on("error", (error) => {
  console.error("Redis Client Error", error);
});

export async function connectRedis() {
  await redis.connect()
}

export async function disconnectRedis() {
  await redis.disconnect()
}

export default redis;