import type { Request, Response, NextFunction } from "express";
import { checkRateLimit } from "./fixed-window.js";

export async function rateLimiter(req: Request, res: Response, next: NextFunction){
  const ip = req.ip;
  if(!ip){
    return res.json({
      "message": "ip not provided"
    })
  }
  const result = await checkRateLimit(ip);
  res.set("X-RateLimit-Limit", "10");
  res.set("X-RateLimit-Remaining", String(result.remaining));
  res.set("X-RateLimit-Reset", String(result.reset));
  if(!result.allowed){
    return res
      .status(429)
      .json({
        "message": "Too many requests "
      })
  }
  next()
}