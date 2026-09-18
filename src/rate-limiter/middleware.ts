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

    try{
      const result = await limiter.check(ip)

      res.set("X-RateLimit-Remaining", String(result.remaining))

      res.set("X-RateLimit-Limit", String(result.limit))

      if(result.reset !== undefined){
        res.set("X-RateLimit-Reset", String(result.reset))
      }

      if(!result.allowed){
        if(result.reset !== undefined){
          res.set("Retry-After", String(result.reset))
        }
        return res
          .status(429)
          .json({
            message: "Too many requests",
          })
      }

      next()
    }
    catch(error){
      next(error)
    }
  }
}