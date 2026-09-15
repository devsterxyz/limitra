export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  reset?: number;
  limit: number;
}

export type RateLimiterAlgorithm =
  | "fixed"
  | "sliding"
  | "token-bucket"

export interface RateLimiter {
  check(ip: string): Promise<RateLimitResult>;
}

