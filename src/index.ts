import "dotenv/config"
import { connectRedis, disconnectRedis } from "./redis/client.js"
import { getRateLimitConfig } from "./rate-limiter/config.js"
import { createRateLimiter } from "./rate-limiter/factory.js"
import createApp from "./app.js"

const PORT = 3000

await connectRedis()

const baseConfig = getRateLimitConfig()

const fixedLimiter = createRateLimiter({ ...baseConfig, algorithm: "fixed" })
const slidingLimiter = createRateLimiter({ ...baseConfig, algorithm: "sliding" })
const tokenBucketLimiter = createRateLimiter({ ...baseConfig, algorithm: "token-bucket" })

const app = createApp(fixedLimiter, slidingLimiter, tokenBucketLimiter)

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

async function shutdown() {
  await new Promise<void>((resolve) => {
    server.close(() => {
      resolve()
    })
  })

  await disconnectRedis()

  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)