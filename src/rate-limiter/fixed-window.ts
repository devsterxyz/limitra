import redis from "../redis/client.js"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const fixedWindowScript = readFileSync(
  fileURLToPath(new URL("./scripts/fixed-window.lua", import.meta.url)),
  "utf8"
)

export async function checkRateLimit(ip: string) {
  const rateLimit = 10
  const windowSize = 60

  const currentWindow = Math.floor(Date.now() / 1000 / windowSize)

  const key = `rate-limit:${ip}:${currentWindow}`

  const currentSecond = Math.floor(Date.now() / 1000)
  const secondsIntoWindow = currentSecond % windowSize
  const secondsRemaining = windowSize - secondsIntoWindow

  const currReqCount = Number(
    await redis.eval(fixedWindowScript, {
      keys: [key],
      arguments: [String(secondsRemaining)],
    })
  )

  const remainingReq = Math.max(0, rateLimit - currReqCount);

  const resetTime = await redis.ttl(key)

  if(currReqCount > rateLimit){
    return {
      allowed: false,
      count: currReqCount,
      remaining: remainingReq,
      reset: resetTime
    }
  }

  return {
    allowed: true,
    count: currReqCount,
    remaining: remainingReq,
    reset: resetTime
  }
}