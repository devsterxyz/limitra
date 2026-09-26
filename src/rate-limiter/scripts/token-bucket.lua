local key = KEYS[1]

local currentTime = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local refillRate = tonumber(ARGV[3])
local requestCost = tonumber(ARGV[4])

local tokens = redis.call("HGET", key, "tokens")
local lastRefill = redis.call("HGET", key, "lastRefill")

if not tokens or not lastRefill then
  local remaining = capacity - requestCost

  redis.call(
    "HSET",
    key,
    "tokens",
    remaining,
    "lastRefill",
    currentTime
  )

  return {1, remaining}
end

tokens = tonumber(tokens)
lastRefill = tonumber(lastRefill)

local elapsed = currentTime - lastRefill

-- Date.now() is supplied by the application process.  Do not let a small
-- backwards clock adjustment remove tokens from an existing bucket.
elapsed = math.max(0, elapsed)

local tokensToAdd = (elapsed / 1000) * refillRate

local refilledTokens = math.min(
  capacity,
  tokens + tokensToAdd
)

if refilledTokens < requestCost then
  redis.call(
    "HSET",
    key,
    "tokens",
    refilledTokens,
    "lastRefill",
    currentTime
  )
  
  local tokenNeeded = requestCost - refilledTokens
  local retryAfter = math.ceil(tokenNeeded / refillRate)

  -- Redis serializes Lua numbers in an array as integers. Return the token
  -- count as a string so the caller can retain the fractional refill amount.
  return {0, tostring(refilledTokens), retryAfter}
end

local remaining = refilledTokens - requestCost

redis.call(
  "HSET",
  key,
  "tokens",
  remaining,
  "lastRefill",
  currentTime
)

-- See the matching rejected response above: retaining the fraction makes the
-- remaining-token header accurately show refill progress.
return {1, tostring(remaining)}
