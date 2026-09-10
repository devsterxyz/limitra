import express from "express";
import { rateLimiter } from "./rate-limiter/middleware.js";

const app = express();

app.get("/", (_req, res) => {
  res.json({
    message: "Rate limiter API is running",
  });
});

app.get("/api/test", rateLimiter, (_req, res) => {
  res.json({
    message: "Request allowed"
  });
});

export default app;