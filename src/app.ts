import express from "express";
import type { RateLimiter } from "./rate-limiter/types.js";
import { createRateLimitMiddleware } from "./rate-limiter/middleware.js";
import { errorHandler } from "./middleware/error-handler.js";


function createApp(
  fixedLimiter: RateLimiter,
  slidingLimiter: RateLimiter,
  tokenBucketLimiter: RateLimiter,
){
  const app = express()

  const fixedMiddleware = createRateLimitMiddleware(fixedLimiter)
  const slidingMiddleware = createRateLimitMiddleware(slidingLimiter)
  const tokenBucketMiddleware = createRateLimitMiddleware(tokenBucketLimiter)

  app.get("/", (_req, res) => {
    res.json({
      message: "Rate limiter API is running",
    })
  })

  app.get("/api/test/fixed", fixedMiddleware, (_req, res) => {
    res.json({
      message: "Request allowed",
      algorithm: "fixed",
    })
  })

  app.get("/api/test/sliding", slidingMiddleware, (_req, res) => {
    res.json({
      message: "Request allowed",
      algorithm: "sliding",
    })
  })

  app.get("/api/test/token-bucket", tokenBucketMiddleware, (_req, res) => {
    res.json({
      message: "Request allowed",
      algorithm: "token-bucket",
    })
  })

  app.use(errorHandler)
  return app
}

export default createApp