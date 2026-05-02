import jwt from "jsonwebtoken";
import { Log } from "../utils/logger";
import { config } from "../config";
import { authRepository } from "../repository/auth.repository";
import { AuthCredentials, JWTPayload, AppError } from "../types";

/**
 * Auth Service - Business logic for authentication
 * Orchestrates auth flow, token generation, and validation
 */
class AuthService {
  /**
   * Register new user and get token
   */
  async registerAndGetToken(email: string, rollNo: string): Promise<string> {
    try {
      Log("backend", "info", "service", "Registering new user", { email, rollNo });

      // Call register API
      const registerResponse = await authRepository.register(email, rollNo);

      Log("backend", "info", "service", "User registered successfully");

      // Create credentials with registered values
      const credentials: AuthCredentials = {
        email,
        rollNo,
        clientID: registerResponse.clientID,
        clientSecret: registerResponse.clientSecret,
      };

      // Get token with credentials
      const token = await this.getToken(credentials);

      return token;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Log("backend", "error", "service", `Registration failed: ${message}`);
      throw new AppError(500, `Registration failed: ${message}`, "REGISTRATION_FAILED");
    }
  }

  /**
   * Get JWT token using credentials from .env
   */
  async getToken(credentials?: AuthCredentials): Promise<string> {
    try {
      Log("backend", "info", "service", "Getting authentication token");

      // Use provided credentials or fall back to .env
      const authCreds = credentials || {
        email: config.auth.email,
        rollNo: config.auth.rollNo,
        clientID: config.auth.clientID,
        clientSecret: config.auth.clientSecret,
      };

      // Validate credentials
      if (
        !authCreds.email ||
        !authCreds.rollNo ||
        !authCreds.clientID ||
        !authCreds.clientSecret
      ) {
        throw new Error("Missing required auth credentials");
      }

      // Call external auth API
      const token = await authRepository.getToken(authCreds);

      Log("backend", "info", "service", "Token obtained successfully");

      return token;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Log("backend", "error", "service", `Failed to get token: ${message}`);
      throw new AppError(401, `Failed to get token: ${message}`, "TOKEN_ERROR");
    }
  }

  /**
   * Generate JWT token for internal use
   * Used for creating tokens for client responses
   */
  generateJWT(clientID: string, email: string, expiresIn: string = "24h"): string {
    try {
      Log("backend", "debug", "service", "Generating JWT", { clientID });

      const payload: Omit<JWTPayload, "iat" | "exp"> = {
        clientID,
        email,
      };

      const token = jwt.sign(payload, config.auth.jwtSecret, { expiresIn });

      Log("backend", "debug", "service", "JWT generated successfully");

      return token;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Log("backend", "error", "service", `JWT generation failed: ${message}`);
      throw new AppError(500, `JWT generation failed: ${message}`, "JWT_ERROR");
    }
  }

  /**
   * Verify JWT token
   */
  verifyJWT(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid token";
      throw new AppError(401, `Token verification failed: ${message}`, "JWT_VERIFY_ERROR");
    }
  }
}

export const authService = new AuthService();
