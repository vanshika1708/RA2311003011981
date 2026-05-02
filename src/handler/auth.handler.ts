import { Request, Response } from "express";
import { Log } from "../utils/logger";
import { authService } from "../service/auth.service";
import { AppError, ApiResponse } from "../types";

/**
 * Auth Handler - HTTP request/response handling for authentication
 * Parses requests, calls service, returns formatted responses
 */

/**
 * POST /auth/register
 * Register new user and get token
 */
export async function registerHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email, rollNo } = req.body;

    Log("backend", "info", "handler", "Register request", { email, rollNo });

    if (!email || !rollNo) {
      throw new AppError(400, "Missing required fields: email, rollNo", "VALIDATION_ERROR");
    }

    const token = await authService.registerAndGetToken(email, rollNo);

    const response: ApiResponse<{ token: string }> = {
      success: true,
      data: { token },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    Log("backend", "error", "handler", `Register handler error: ${error}`);
    throw error;
  }
}

/**
 * POST /auth/token
 * Get JWT token using credentials from .env
 */
export async function getTokenHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    Log("backend", "info", "handler", "Get token request");

    const token = await authService.getToken();

    const response: ApiResponse<{ token: string }> = {
      success: true,
      data: { token },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    Log("backend", "error", "handler", `Get token handler error: ${error}`);
    throw error;
  }
}
