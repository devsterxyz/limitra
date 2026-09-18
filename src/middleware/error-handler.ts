import type { Request, Response, NextFunction } from "express";


export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(error)
    return res
      .status(503)
      .json({
        message: "Internal server error",
      })
}