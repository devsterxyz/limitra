import express from "express";
import { createRateLimiter } from "./rate-limiter/factory.js"
import { createRateLimitMiddleware } from "./rate-limiter/middleware.js"

const app = express();
const limiter = createRateLimiter("token-bucket");
const rateLimitMiddleware = createRateLimitMiddleware(limiter);

app.get("/", (_req, res) => {
  res.json({
    message: "Rate limiter API is running",
  });
});

app.get("/api/test", rateLimitMiddleware, (_req, res) => {
  res.json({
    message: "Request allowed"
  });
});

export default app;