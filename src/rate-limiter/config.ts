import type { RateLimiterAlgorithm } from "./types.js"

export interface RateLimitConfig {
  algorithm: RateLimiterAlgorithm
  limit: number
  windowSize: number
  refillRate: number
  requestCost: number
}

export function getRateLimiterAlgorithm(): RateLimiterAlgorithm {
  const algorithm = process.env.RATE_LIMIT_ALGORITHM ?? "fixed"

  if(algorithm !== "fixed" && algorithm !== "sliding" && algorithm !== "token-bucket"){
    throw new Error(
      `Invalid RATE_LIMIT_ALGORITHM: ${algorithm}`
    );
  }

  return algorithm
}

export function getRateLimitConfig(): RateLimitConfig {
  const algorithm = getRateLimiterAlgorithm()

  return {
    algorithm,
    limit: RATE_LIMIT,
    windowSize: WINDOW_SIZE,
    refillRate: REFILL_RATE,
    requestCost: REQUEST_COST
  }
}

export const RATE_LIMIT = 10
export const WINDOW_SIZE = 60
export const REFILL_RATE = 1
export const REQUEST_COST = 1