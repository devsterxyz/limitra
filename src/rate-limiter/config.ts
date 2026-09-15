import type { RateLimiterAlgorithm } from "./types.js"

export function getRateLimiterAlgorithm(): RateLimiterAlgorithm {
  const algorithm = process.env.RATE_LIMIT_ALGORITHM ?? "fixed"

  if(algorithm !== "fixed" && algorithm !== "sliding" && algorithm !== "token-bucket"){
    throw new Error(
      `Invalid RATE_LIMIT_ALGORITHM: ${algorithm}`
    );
  }

  return algorithm
}

export const RATE_LIMIT = 10
export const WINDOW_SIZE = 60