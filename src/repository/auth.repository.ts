import axios, { AxiosInstance } from "axios";
import { Log } from "../utils/logger";
import { config } from "../config";
import { AuthCredentials, RegisterResponse, TokenResponse, AppError } from "../types";

/**
 * Repository for authentication API calls
 * Handles /register and /auth endpoints
 */
class AuthRepository {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: config.timeouts.api,
    });
  }

  /**
   * Register and get clientID/Secret
   */
  async register(
    email: string,
    rollNo: string
  ): Promise<RegisterResponse> {
    try {
      Log("backend", "info", "repository", "Calling /register endpoint", {
        email,
        rollNo,
      });

      const response = await this.client.post<RegisterResponse>(
        config.apis.register(),
        { email, rollNo }
      );

      Log("backend", "info", "repository", "Register successful", {
        clientID: response.data.clientID,
      });

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Log("backend", "error", "repository", `Register failed: ${message}`);
      throw new AppError(500, `Failed to register: ${message}`, "REGISTER_FAILED");
    }
  }

  /**
   * Get JWT token using credentials
   */
  async getToken(credentials: AuthCredentials): Promise<string> {
    try {
      Log("backend", "info", "repository", "Calling /auth endpoint");

      const response = await this.client.post<TokenResponse>(
        config.apis.auth(),
        credentials
      );

      if (!response.data.success || !response.data.data.token) {
        throw new Error("Invalid token response");
      }

      Log("backend", "info", "repository", "Token obtained successfully");

      return response.data.data.token;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Log("backend", "error", "repository", `Get token failed: ${message}`);
      throw new AppError(401, `Failed to get token: ${message}`, "TOKEN_FAILED");
    }
  }
}

export const authRepository = new AuthRepository();
