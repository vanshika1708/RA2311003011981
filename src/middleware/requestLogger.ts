import { Request, Response, NextFunction } from "express";
import { Log } from "../utils/logger";

/**
 * Request/Response logging middleware
 * Logs all incoming requests and outgoing responses
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const method = req.method;
  const path = req.path;
  const ip = req.ip;

  // Log incoming request
  Log("backend", "debug", "middleware", `Incoming ${method} ${path}`, {
    ip,
    userAgent: req.get("user-agent"),
  });

  // Capture the original res.json function
  const originalJson = res.json.bind(res);

  // Override res.json to log response
  res.json = function (data: unknown) {
    const statusCode = res.statusCode;
    const duration = Date.now() - startTime;

    Log("backend", "debug", "middleware", `Response ${method} ${path} ${statusCode}`, {
      duration: `${duration}ms`,
      statusCode,
    });

    return originalJson(data);
  };

  next();
}

/**
 * Error handling middleware
 * Catches and formats all errors
 */
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const method = req.method;
  const path = req.path;

  // Determine error details
  let statusCode = 500;
  let errorMessage = "Internal server error";
  let errorCode = "INTERNAL_ERROR";

  if (err instanceof Error) {
    errorMessage = err.message;

    // Check if it's our custom AppError
    if ("statusCode" in err) {
      statusCode = (err as any).statusCode;
      errorCode = (err as any).code || errorCode;
    }
  }

  Log("backend", "error", "middleware", `Error ${method} ${path}`, {
    statusCode,
    error: errorMessage,
    code: errorCode,
  });

  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString(),
    code: errorCode,
  });
}
