// ============================================================
// Auth & Token Types
// ============================================================
export interface AuthCredentials {
  email: string;
  rollNo: string;
  clientID: string;
  clientSecret: string;
}

export interface RegisterResponse {
  clientID: string;
  clientSecret: string;
}

export interface TokenResponse {
  success: boolean;
  data: {
    token: string;
  };
  timestamp: string;
}

export interface JWTPayload {
  clientID: string;
  email: string;
  iat: number;
  exp: number;
}

// ============================================================
// Depot & Vehicle Types
// ============================================================
export interface Depot {
  depotId: string;
  depotName: string;
  availableHours: number;
  location?: string;
}

export interface Vehicle {
  vehicleId: string;
  vehicleName: string;
  depotId: string;
  status?: string;
}

export interface MaintenanceTask {
  taskId: string;
  vehicleId: string;
  vehicleName: string;
  taskName: string;
  duration: number;
  impactScore: number;
  depotId: string;
}

// ============================================================
// Knapsack Algorithm Types
// ============================================================
export interface KnapsackItem {
  id: string;
  weight: number;
  value: number;
  data: MaintenanceTask;
}

export interface KnapsackResult {
  selectedIndices: number[];
  totalValue: number;
  totalWeight: number;
}

// ============================================================
// Schedule Types
// ============================================================
export interface SelectedTask {
  taskId: string;
  vehicleId: string;
  vehicleName: string;
  taskName: string;
  duration: number;
  impactScore: number;
}

export interface SkippedTask {
  taskId: string;
  vehicleId: string;
  vehicleName: string;
  taskName: string;
  duration: number;
  impactScore: number;
  reason?: string;
}

export interface DepotSchedule {
  depotId: string;
  depotName: string;
  availableHours: number;
  usedHours: number;
  totalImpactScore: number;
  efficiency: string;
  selectedTasks: SelectedTask[];
  skippedTasks: SkippedTask[];
}

export interface ScheduleSummary {
  totalDepots: number;
  totalTasksScheduled: number;
  totalImpactAchieved: number;
}

export interface AllDepotsScheduleResponse {
  success: boolean;
  data: {
    summary: ScheduleSummary;
    depotSchedules: DepotSchedule[];
  };
  timestamp: string;
}

export interface SingleDepotScheduleResponse {
  success: boolean;
  data: DepotSchedule;
  timestamp: string;
}

// ============================================================
// API Response Types
// ============================================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: string;
}

export interface HealthCheckResponse {
  success: boolean;
  status: string;
  uptime: number;
  timestamp: string;
}

// ============================================================
// Logging Types
// ============================================================
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type Stack = "backend" | "frontend" | "database";

export interface LogEntry {
  stack: Stack;
  level: LogLevel;
  package: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Error Types
// ============================================================
export interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
  code?: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}
