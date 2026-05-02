import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Log } from "../utils/logger";
import { config } from "../config";
import { JWTPayload, AppError } from "../types";

/**
 * Extend Express Request to include decoded JWT payload
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Bearer token validation middleware
 * Extracts and verifies JWT from Authorization header
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      Log("backend", "warn", "middleware", "Missing Authorization header", {
        path: req.path,
      });
      res.status(401).json({
        success: false,
        error: "Missing Authorization header",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      Log("backend", "warn", "middleware", "Invalid Authorization header format", {
        path: req.path,
      });
      res.status(401).json({
        success: false,
        error: "Invalid Authorization header format",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = parts[1];

    // Verify JWT
    const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
    req.user = decoded;

    Log("backend", "debug", "middleware", "Token validated", {
      clientID: decoded.clientID,
    });

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid token";
    Log("backend", "warn", "middleware", `Token validation failed: ${message}`);
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Extract token from request (helper function)
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;

  return parts[1];
}
