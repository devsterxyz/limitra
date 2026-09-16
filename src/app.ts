import express from "express";
import type { RateLimiter } from "./rate-limiter/types.js";
import { createRateLimitMiddleware } from "./rate-limiter/middleware.js";


function createApp(limiter: RateLimiter){
  const app = express()
  const rateLimitMiddleware = createRateLimitMiddleware(limiter)

  app.get("/", (_req, res) => {
    res.json({
      message: "Rate limiter API is running",
    })
  })

  app.get("/api/test", rateLimitMiddleware, (_req, res) => {
    res.json({
      message: "Request allowed"
    })
  })
  return app
}

export default createApp