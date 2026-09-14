export interface RateLimitResult {
  allowed: boolean;
  count?: number;
  remaining: number;
  reset?: number;
}

export interface RateLimiter {
  check(ip: string): Promise<RateLimitResult>;
}