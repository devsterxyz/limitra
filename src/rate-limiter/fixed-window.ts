import redis from "../redis/client.js";

export async function checkRateLimit(ip: string) {
  const rateLimit = 10
  const windowSize = 60

  const currentWindow = Math.floor(Date.now() / 1000 / windowSize)

  const key = `rate-limit:${ip}:${currentWindow}`

  const currReqCount = Number(await redis.incr(key))

  const remainingReq = Math.max(0, rateLimit - currReqCount)


  if(currReqCount === 1){
    const currentSecond = Math.floor(Date.now() / 1000);
    const secondsIntoWindow = currentSecond % windowSize;
    const secondsRemaining = windowSize - secondsIntoWindow;
    await redis.expire(key, secondsRemaining);
  }

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