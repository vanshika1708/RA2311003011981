import { Log } from "../utils/logger";
import { knapsackSolver } from "../utils/knapsack";
import { depotRepository } from "../repository/depot.repository";
import { vehicleRepository } from "../repository/vehicle.repository";
import {
  Depot,
  MaintenanceTask,
  KnapsackItem,
  DepotSchedule,
  SelectedTask,
  SkippedTask,
  ScheduleSummary,
  AllDepotsScheduleResponse,
  SingleDepotScheduleResponse,
  AppError,
} from "../types";

/**
 * Scheduler Service - Business logic for maintenance scheduling
 * Orchestrates depot/vehicle data fetching and knapsack optimization
 */
class SchedulerService {
  /**
   * Get optimal schedule for ALL depots
   */
  async scheduleAllDepots(token: string): Promise<AllDepotsScheduleResponse> {
    try {
      Log("backend", "info", "service", "Starting schedule for all depots");

      // Fetch all depots and tasks in parallel
      const [depots, allTasks] = await Promise.all([
        depotRepository.getAllDepots(token),
        vehicleRepository.getAllTasks(token),
      ]);

      Log("backend", "info", "service", `Fetched ${depots.length} depots and ${allTasks.length} tasks`);

      // Schedule each depot
      const depotSchedules = await Promise.all(
        depots.map((depot) => this.scheduleDepot(depot, allTasks))
      );

      // Calculate summary
      const summary = this.calculateSummary(depotSchedules);

      Log("backend", "info", "service", "Scheduling complete for all depots", {
        totalDepots: depots.length,
        totalTasksScheduled: summary.totalTasksScheduled,
        totalImpact: summary.totalImpactAchieved,
      });

      return {
        success: true,
        data: {
          summary,
          depotSchedules,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Log("backend", "error", "service", `Failed to schedule all depots: ${message}`);
      throw new AppError(500, `Scheduling failed: ${message}`, "SCHEDULE_FAILED");
    }
  }

  /**
   * Get optimal schedule for a single depot
   */
  async scheduleDepot(depotIdOrObj: string | Depot, token?: string): Promise<DepotSchedule | SingleDepotScheduleResponse> {
    try {
      let depot: Depot;

      // Handle both direct depot object or ID + token
      if (typeof depotIdOrObj === "string") {
        if (!token) {
          throw new Error("Token required when fetching by depot ID");
        }
        Log("backend", "info", "service", `Getting schedule for depot: ${depotIdOrObj}`);
        depot = await depotRepository.getDepotById(depotIdOrObj, token);

        const tasks = await vehicleRepository.getTasksByDepot(depotIdOrObj, token);
        const schedule = this.optimizeDepotSchedule(depot, tasks);

        return {
          success: true,
          data: schedule,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Direct depot object (called internally from scheduleAllDepots)
        depot = depotIdOrObj;
        // Tasks should be provided as part of the scheduling context
        // This is for internal use, so we just return the schedule
        const tasks: MaintenanceTask[] = [];
        return this.optimizeDepotSchedule(depot, tasks);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const depotId = typeof depotIdOrObj === "string" ? depotIdOrObj : depotIdOrObj.depotId;
      Log(
        "backend",
        "error",
        "service",
        `Failed to schedule depot ${depotId}: ${message}`
      );
      throw new AppError(500, `Depot scheduling failed: ${message}`, "DEPOT_SCHEDULE_FAILED");
    }
  }

  /**
   * Internal: Optimize a single depot's schedule
   * This is called either directly (when fetching single depot) or as part of batch processing
   */
  private optimizeDepotSchedule(depot: Depot, tasks: MaintenanceTask[]): DepotSchedule {
    Log("backend", "info", "service", `Optimizing schedule for depot: ${depot.depotId}`, {
      availableHours: depot.availableHours,
      taskCount: tasks.length,
    });

    // Filter tasks for this depot
    const depotTasks = tasks.filter((task) => task.depotId === depot.depotId);

    // Convert tasks to knapsack items
    const items: KnapsackItem[] = depotTasks.map((task) => ({
      id: task.taskId,
      weight: task.duration,
      value: task.impactScore,
      data: task,
    }));

    // Solve knapsack problem
    const solution = knapsackSolver.solve(items, depot.availableHours);

    // Build selected and skipped tasks
    const selectedIndices = new Set(solution.selectedIndices);
    const selectedTasks: SelectedTask[] = [];
    const skippedTasks: SkippedTask[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (selectedIndices.has(i)) {
        selectedTasks.push({
          taskId: item.data.taskId,
          vehicleId: item.data.vehicleId,
          vehicleName: item.data.vehicleName,
          taskName: item.data.taskName,
          duration: item.data.duration,
          impactScore: item.data.impactScore,
        });
      } else {
        skippedTasks.push({
          taskId: item.data.taskId,
          vehicleId: item.data.vehicleId,
          vehicleName: item.data.vehicleName,
          taskName: item.data.taskName,
          duration: item.data.duration,
          impactScore: item.data.impactScore,
        });
      }
    }

    // Calculate efficiency
    const efficiency =
      depot.availableHours > 0
        ? (
            (solution.totalWeight / depot.availableHours) *
            100
          ).toFixed(1)
        : "0.0";

    const schedule: DepotSchedule = {
      depotId: depot.depotId,
      depotName: depot.depotName,
      availableHours: depot.availableHours,
      usedHours: solution.totalWeight,
      totalImpactScore: solution.totalValue,
      efficiency: `${efficiency}%`,
      selectedTasks,
      skippedTasks,
    };

    Log("backend", "info", "service", `Depot ${depot.depotId} optimized`, {
      selectedTasks: selectedTasks.length,
      skippedTasks: skippedTasks.length,
      usedHours: solution.totalWeight,
      impact: solution.totalValue,
    });

    return schedule;
  }

  /**
   * Calculate summary across all depot schedules
   */
  private calculateSummary(depotSchedules: DepotSchedule[]): ScheduleSummary {
    const summary = {
      totalDepots: depotSchedules.length,
      totalTasksScheduled: depotSchedules.reduce(
        (sum, schedule) => sum + schedule.selectedTasks.length,
        0
      ),
      totalImpactAchieved: depotSchedules.reduce(
        (sum, schedule) => sum + schedule.totalImpactScore,
        0
      ),
    };

    Log("backend", "info", "service", "Schedule summary calculated", summary);

    return summary;
  }
}

export const schedulerService = new SchedulerService();
