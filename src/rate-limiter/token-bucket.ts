import redis from "../redis/client.js"
import { RATE_LIMIT } from "./config.js"

export async function checkTokenBucket(ip: string) {
  const capacity = RATE_LIMIT
  const refillRate = 1

  const key = `rate-limit:token:${ip}`

  const currentTime = Date.now()
  const bucket = await redis.hGetAll(key)

  if (!bucket.tokens || !bucket.lastRefill) {
    await redis.hSet(key, {
      tokens: String(capacity - 1),
      lastRefill: String(currentTime),
    })

    return {
      allowed: true,
      remaining: capacity - 1,
    }
  }

  const tokens = Number(bucket.tokens)
  const lastRefill = Number(bucket.lastRefill)

  const elapsed = currentTime - lastRefill

  const tokensToAdd = elapsed / 1000 * refillRate

  const refilledTokens = Math.min(
    capacity,
    tokens + tokensToAdd
  )

  if (refilledTokens < 1) {
    await redis.hSet(key, {
      tokens: String(refilledTokens),
      lastRefill: String(currentTime),
    })

    return {
      allowed: false,
      remaining: 0,
    }
  }

  const remainingTokens = refilledTokens - 1;
  await redis.hSet(key, {
    tokens: String(remainingTokens),
    lastRefill: String(currentTime),
  })
  return {
    allowed: true,
    remaining: Math.floor(remainingTokens),
  }

}