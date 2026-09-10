import redis from "./redis/client.js";
import app from "./app.js";

const PORT = 3000;

await redis.connect();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});