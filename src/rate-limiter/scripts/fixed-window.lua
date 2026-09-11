local key = KEYS[1]
local window = ARGV[1]

local count = redis.call("INCR", key)

if count == 1 then
  redis.call("EXPIRE", key, window)
end

return count