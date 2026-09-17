import "dotenv/config"
import { connectRedis } from "./redis/client.js"
import { getRateLimiterAlgorithm } from "./rate-limiter/config.js"
import { createRateLimiter } from "./rate-limiter/factory.js"
import createApp from "./app.js"

const PORT = 3000

await connectRedis()

const algorithm = getRateLimiterAlgorithm()
const limiter = createRateLimiter(algorithm)

const app = createApp(limiter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})