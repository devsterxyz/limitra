import redis from "../redis/client.js"

export async function checkSlidingWindow(ip: string) {
  const rateLimit = 10
  const windowSize = 60

  const key = `rate-limit:sliding:${ip}`

  const currentTime = Date.now();
  const windowStart = currentTime - windowSize * 1000

  await redis.zRemRangeByScore(key, 0, windowStart)

  const requestCount = await redis.zCount(key, windowStart, currentTime)

  if (requestCount >= rateLimit) {
    return {
      allowed: false,
      count: requestCount,
      remaining: 0,
    };
  }

  const requestId = `${currentTime}-${Math.random()}`;
  await redis.zAdd(key, {
    score: currentTime,
    value: requestId,
  });

  return {
    allowed: true,
    count: requestCount + 1,
    remaining: rateLimit - (requestCount + 1),
  };
}