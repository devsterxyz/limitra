import type { RateLimiterAlgorithm } from "./types.js"

export interface RateLimitConfig{
  algorithm: RateLimiterAlgorithm
  limit: number
  windowSize: number
  refillRate: number
  requestCost: number
}

const DEFAULT_RATE_LIMIT = 10
const DEFAULT_WINDOW_SIZE = 60
const DEFAULT_REFILL_RATE = 1
const DEFAULT_REQUEST_COST = 1

export function getRateLimiterAlgorithm(): RateLimiterAlgorithm{
  const algorithm = process.env.RATE_LIMIT_ALGORITHM ?? "fixed"

  if(algorithm !== "fixed" && algorithm !== "sliding" && algorithm !== "token-bucket"){
    throw new Error(`Invalid RATE_LIMIT_ALGORITHM: ${algorithm}`)
  }
  return algorithm
}

function getPositiveNumber(name: string,value: string | undefined,defaultValue: number): number{
  const parsed = Number(value ?? defaultValue)

  if (!Number.isFinite(parsed) || parsed <= 0){
    throw new Error(`Invalid ${name}: must be a number greater than 0`)
  }

  return parsed
}

function getPositiveInteger(name: string, value: string | undefined,defaultValue: number): number{
  const parsed = getPositiveNumber(name, value, defaultValue)

  if (!Number.isInteger(parsed)){
    throw new Error(`Invalid ${name}: must be a positive integer`)
  }

  return parsed
}

export function getRateLimitConfig(): RateLimitConfig {
  const limit = getPositiveInteger("RATE_LIMIT", process.env.RATE_LIMIT, DEFAULT_RATE_LIMIT)

  const windowSize = getPositiveInteger("WINDOW_SIZE", process.env.WINDOW_SIZE, DEFAULT_WINDOW_SIZE)

  const refillRate = getPositiveNumber("REFILL_RATE", process.env.REFILL_RATE, DEFAULT_REFILL_RATE)

  const requestCost = getPositiveNumber("REQUEST_COST", process.env.REQUEST_COST, DEFAULT_REQUEST_COST)

  if(requestCost > limit){
    throw new Error("Invalid REQUEST_COST: must not be greater than RATE_LIMIT")
  }

  return {
    algorithm: getRateLimiterAlgorithm(),
    limit,
    windowSize,
    refillRate,
    requestCost,
  }
}