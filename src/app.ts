import express from "express";
import type { RateLimiter } from "./rate-limiter/types.js";
import { createRateLimitMiddleware } from "./rate-limiter/middleware.js";
import { errorHandler } from "./middleware/error-handler.js";


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

  app.use(errorHandler)
  return app
}

export default createApp