import axios, { AxiosInstance } from "axios";
import { Log } from "../utils/logger";
import { config } from "../config";
import { Depot, AppError } from "../types";

/**
 * Repository for depot data API calls
 * Handles /depots endpoint
 */
class DepotRepository {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: config.timeouts.api,
    });
  }

  /**
   * Fetch all depots
   */
  async getAllDepots(token: string): Promise<Depot[]> {
    try {
      Log("backend", "info", "repository", "Fetching all depots");

      const response = await this.client.get<{ data: Depot[] }>(
        config.apis.depots(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const depots = response.data.data || [];
      Log("backend", "info", "repository", `Fetched ${depots.length} depots`);

      return depots;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Log("backend", "error", "repository", `Failed to fetch depots: ${message}`);
      throw new AppError(500, `Failed to fetch depots: ${message}`, "DEPOTS_FETCH_FAILED");
    }
  }

  /**
   * Fetch a single depot by ID
   */
  async getDepotById(depotId: string, token: string): Promise<Depot> {
    try {
      Log("backend", "info", "repository", `Fetching depot: ${depotId}`);

      const response = await this.client.get<{ data: Depot }>(
        `${config.apis.depots()}/${depotId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Log("backend", "info", "repository", `Fetched depot: ${depotId}`);

      return response.data.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Log("backend", "error", "repository", `Failed to fetch depot ${depotId}: ${message}`);
      throw new AppError(500, `Failed to fetch depot: ${message}`, "DEPOT_FETCH_FAILED");
    }
  }
}

export const depotRepository = new DepotRepository();
