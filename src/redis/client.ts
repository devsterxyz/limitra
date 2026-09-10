import { createClient } from "redis";

const redis = createClient({
  url: "redis://localhost:6379",
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