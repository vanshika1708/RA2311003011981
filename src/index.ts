import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { Log } from "./utils/logger";
import { config } from "./config";

// Middleware
import { authMiddleware, requestLoggerMiddleware, errorHandlerMiddleware } from "./middleware";

// Handlers
import { registerHandler, getTokenHandler } from "./handler/auth.handler";
import {
  scheduleAllHandler,
  scheduleDepotHandler,
  healthHandler,
} from "./handler/scheduler.handler";

// Types
import { AppError } from "./types";

const app: Express = express();

// ============================================================
// Middleware Setup
// ============================================================

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors());

// Request logging
app.use(requestLoggerMiddleware);

// ============================================================
// Routes
// ============================================================

// Health check (public, no auth required)
app.get("/health", healthHandler);

// Auth routes (public, no auth required)
app.post("/auth/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await registerHandler(req, res);
  } catch (error) {
    next(error);
  }
});

app.post("/auth/token", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getTokenHandler(req, res);
  } catch (error) {
    next(error);
  }
});

// Scheduler routes (protected, auth required)
app.get(
  "/schedule/all",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await scheduleAllHandler(req, res);
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/schedule/:depotId",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await scheduleDepotHandler(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// Error Handling
// ============================================================

app.use(errorHandlerMiddleware);

// ============================================================
// 404 Handler
// ============================================================

app.use((req: Request, res: Response) => {
  Log("backend", "warn", "app", `Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: "Route not found",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// Start Server
// ============================================================

const PORT = config.port;

app.listen(PORT, () => {
  Log("backend", "info", "app", `Server started on port ${PORT}`, {
    nodeEnv: config.nodeEnv,
    baseUrl: config.baseUrl,
  });
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  Log("backend", "info", "app", "SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  Log("backend", "info", "app", "SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Uncaught exception handler
process.on("uncaughtException", (error) => {
  Log("backend", "fatal", "app", `Uncaught exception: ${error.message}`, {
    stack: error.stack,
  });
  process.exit(1);
});

export default app;
