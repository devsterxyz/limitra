local key = KEYS[1]

local windowStart = tonumber(ARGV[1])
local currentTime = tonumber(ARGV[2])
local rateLimit = tonumber(ARGV[3])
local requestId = ARGV[4]
local windowSize = tonumber(ARGV[5])

redis.call("ZREMRANGEBYSCORE", key, 0, windowStart)

local count = redis.call(
  "ZCOUNT",
  key,
  windowStart,
  currentTime
)

if count >= rateLimit then
  local oldestRequest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")

  local retryAfter = windowSize

  if #oldestRequest > 0 then
    local oldestTimestamp = tonumber(oldestRequest[2])
    retryAfter = math.ceil(
      (oldestTimestamp + windowSize - currentTime) / 1000
    )
  end

  return {0, count, retryAfter}
end

redis.call("ZADD", key, currentTime, requestId)

return {1, count + 1, 0}