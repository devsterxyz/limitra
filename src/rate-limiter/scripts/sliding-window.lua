local key = KEYS[1]

local windowStart = tonumber(ARGV[1])
local currentTime = tonumber(ARGV[2])
local rateLimit = tonumber(ARGV[3])
local requestId = ARGV[4]

redis.call("ZREMRANGEBYSCORE", key, 0, windowStart)

local count = redis.call(
  "ZCOUNT",
  key,
  windowStart,
  currentTime
)

if count >= rateLimit then
  return {0, count}
end

redis.call(
  "ZADD",
  key,
  currentTime,
  requestId
)

return {1, count + 1}