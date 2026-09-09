import redis from "../redis/client.js";

export async function checkRateLimit(ip: string) {
  const rateLimit = 10
  const windowSize = 60

  const curretWindow = Math.floor(Date.now() / 1000 / windowSize)

  const key = `rate-limit:${ip}:${curretWindow}`

  const currReqCount = Number(await redis.get(key))

  if(currReqCount >= rateLimit){
    return {
      allowed: false,
      count: currReqCount,
    }
  }

  const newCount = await redis.incr(key);

  if(newCount === 1){
    const currentSecond = Math.floor(Date.now() / 1000);
    const secondsIntoWindow = currentSecond % windowSize;
    const secondsRemaining = windowSize - secondsIntoWindow;
    await redis.expire(key, secondsRemaining);
  }
  return {
    allowed: true,
    count: newCount,
  }
}