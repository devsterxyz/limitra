import redis from "./redis/client.js";

await redis.connect();

await redis.set("hello", "from TypeScript");

const value = await redis.get("hello");

console.log(value);

// console.log("Connected to Redis!");