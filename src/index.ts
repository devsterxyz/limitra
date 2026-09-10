import { connectRedis } from "./redis/client.js";
import app from "./app.js";

const PORT = 3000;

await connectRedis();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});