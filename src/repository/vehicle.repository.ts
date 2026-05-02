import axios, { AxiosInstance } from "axios";
import { Log } from "../utils/logger";
import { config } from "../config";
import { MaintenanceTask, AppError } from "../types";

/**
 * Repository for vehicle/maintenance data API calls
 * Handles /vehicles endpoint
 */
class VehicleRepository {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: config.timeouts.api,
    });
  }

  /**
   * Fetch all maintenance tasks for vehicles
   */
  async getAllTasks(token: string): Promise<MaintenanceTask[]> {
    try {
      Log("backend", "info", "repository", "Fetching all maintenance tasks");

      const response = await this.client.get<{ data: MaintenanceTask[] }>(
        config.apis.vehicles(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const tasks = response.data.data || [];
      Log("backend", "info", "repository", `Fetched ${tasks.length} maintenance tasks`);

      return tasks;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Log("backend", "error", "repository", `Failed to fetch tasks: ${message}`);
      throw new AppError(500, `Failed to fetch tasks: ${message}`, "TASKS_FETCH_FAILED");
    }
  }

  /**
   * Fetch maintenance tasks for a specific depot
   */
  async getTasksByDepot(depotId: string, token: string): Promise<MaintenanceTask[]> {
    try {
      Log("backend", "info", "repository", `Fetching tasks for depot: ${depotId}`);

      const response = await this.client.get<{ data: MaintenanceTask[] }>(
        config.apis.vehicles(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            depotId,
          },
        }
      );

      const tasks = response.data.data || [];
      Log("backend", "info", "repository", `Fetched ${tasks.length} tasks for depot ${depotId}`);

      return tasks;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Log(
        "backend",
        "error",
        "repository",
        `Failed to fetch tasks for depot ${depotId}: ${message}`
      );
      throw new AppError(
        500,
        `Failed to fetch depot tasks: ${message}`,
        "DEPOT_TASKS_FETCH_FAILED"
      );
    }
  }
}

export const vehicleRepository = new VehicleRepository();
