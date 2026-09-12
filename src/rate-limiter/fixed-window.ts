import redis from "../redis/client.js"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { RATE_LIMIT, WINDOW_SIZE } from "./config.js";

const fixedWindowScript = readFileSync(
  fileURLToPath(new URL("./scripts/fixed-window.lua", import.meta.url)),
  "utf8"
)

export async function checkRateLimit(ip: string) {

  const currentWindow = Math.floor(Date.now() / 1000 / WINDOW_SIZE)

  const key = `rate-limit:${ip}:${currentWindow}`

  const currentSecond = Math.floor(Date.now() / 1000)
  const secondsIntoWindow = currentSecond % WINDOW_SIZE
  const secondsRemaining = WINDOW_SIZE - secondsIntoWindow

  const currReqCount = Number(
    await redis.eval(fixedWindowScript, {
      keys: [key],
      arguments: [String(secondsRemaining)],
    })
  )

  const remainingReq = Math.max(0, RATE_LIMIT - currReqCount);

  const resetTime = await redis.ttl(key)

  if(currReqCount > RATE_LIMIT){
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