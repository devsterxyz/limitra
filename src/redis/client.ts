import { createClient } from "redis";

const redis = createClient({
  url: "redis://localhost:6379",
});

redis.on("error", (error) => {
  console.error("Redis Client Error", error);
});

export default redis;