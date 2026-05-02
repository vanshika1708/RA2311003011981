import { Request, Response } from "express";
import { Log } from "../utils/logger";
import { schedulerService } from "../service/scheduler.service";
import { extractToken } from "../middleware/auth";
import { AppError, HealthCheckResponse } from "../types";

/**
 * Scheduler Handler - HTTP request/response handling for scheduling
 * Parses requests, calls service, returns formatted responses
 */

/**
 * GET /schedule/all
 * Get optimal schedule for all depots
 * Protected: Requires Bearer token
 */
export async function scheduleAllHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    Log("backend", "info", "handler", "Schedule all depots request");

    const token = extractToken(req);
    if (!token) {
      throw new AppError(401, "Missing authorization token", "AUTH_ERROR");
    }

    const response = await schedulerService.scheduleAllDepots(token);

    res.status(200).json(response);
  } catch (error) {
    Log("backend", "error", "handler", `Schedule all handler error: ${error}`);
    throw error;
  }
}

/**
 * GET /schedule/:depotId
 * Get optimal schedule for a single depot
 * Protected: Requires Bearer token
 */
export async function scheduleDepotHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { depotId } = req.params;

    Log("backend", "info", "handler", `Schedule depot request: ${depotId}`);

    if (!depotId) {
      throw new AppError(400, "Missing depotId parameter", "VALIDATION_ERROR");
    }

    const token = extractToken(req);
    if (!token) {
      throw new AppError(401, "Missing authorization token", "AUTH_ERROR");
    }

    const response = await schedulerService.scheduleDepot(depotId, token);

    res.status(200).json(response);
  } catch (error) {
    Log("backend", "error", "handler", `Schedule depot handler error: ${error}`);
    throw error;
  }
}

/**
 * GET /health
 * Service health check endpoint
 * Public: No authentication required
 */
export function healthHandler(req: Request, res: Response): void {
  Log("backend", "debug", "handler", "Health check request");

  const uptime = process.uptime();

  const response: HealthCheckResponse = {
    success: true,
    status: "healthy",
    uptime,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}
