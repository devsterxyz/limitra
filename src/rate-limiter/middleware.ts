import type { Request, Response, NextFunction } from "express"
import type { RateLimiter } from "./types.js"

export function createRateLimitMiddleware(limiter: RateLimiter){
  return async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction){
    const ip = req.ip

    if(!ip){
      return res.status(400).json({
        message: "IP address not available",
      })
    }
    const result = await limiter.check(ip)

    res.set("X-RateLimit-Remaining", String(result.remaining))

    res.set("X-RateLimit-Limit", String(result.limit))

    if(result.count !== undefined){
      res.set("X-RateLimit-Count", String(result.count))
    }

    if(result.reset !== undefined){
      res.set("X-RateLimit-Reset", String(result.reset))
    }

    if(!result.allowed){
      res.set("Retry-After", String(result.reset ?? 0))
      return res
        .status(429)
        .json({
          message: "Too many requests",
        })
    }

    next()
  }
}