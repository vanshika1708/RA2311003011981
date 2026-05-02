import { LogLevel, Stack, LogEntry } from "../types";
import axios from "axios";

/**
 * Mandatory Logger utility used by all layers.
 * Logs to both console (local) and remote API (fire-and-forget).
 */
class Logger {
  private remoteLogEndpoint: string;
  private enableRemoteLogging: boolean;

  constructor() {
    this.remoteLogEndpoint =
      process.env.REMOTE_LOG_API || "http://localhost:8000/logs";
    this.enableRemoteLogging = process.env.ENABLE_REMOTE_LOGGING !== "false";
  }

  /**
   * Main logging function - mandatory for all layers
   *
   * @param stack - "backend" | "frontend" | "database"
   * @param level - "debug" | "info" | "warn" | "error" | "fatal"
   * @param pkg - Package/module name (e.g., "service", "repository", "handler")
   * @param message - Log message
   * @param metadata - Optional additional data to log
   */
  log(
    stack: Stack,
    level: LogLevel,
    pkg: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      stack,
      level,
      package: pkg,
      message,
      timestamp,
      metadata,
    };

    // 1. Always log to console (local)
    this.logToConsole(logEntry);

    // 2. Fire-and-forget remote logging (non-blocking)
    if (this.enableRemoteLogging) {
      this.logToRemote(logEntry).catch(() => {
        // Silent fail - don't crash if remote logging fails
        // This intentional error suppression ensures logging never disrupts business logic
      });
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.stack}] [${entry.level.toUpperCase()}] [${entry.package}]`;
    const message = entry.metadata
      ? `${entry.message} ${JSON.stringify(entry.metadata)}`
      : entry.message;

    const logFn = this.getLevelFunction(entry.level);
    logFn(`${prefix} ${message}`);
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    try {
      await axios.post(this.remoteLogEndpoint, entry, {
        timeout: 5000,
      });
    } catch {
      // Silent error - remote logging failure should never propagate
    }
  }

  private getLevelFunction(
    level: LogLevel
  ): (...args: unknown[]) => void {
    switch (level) {
      case "debug":
        return console.debug;
      case "info":
        return console.info;
      case "warn":
        return console.warn;
      case "error":
        return console.error;
      case "fatal":
        return console.error;
      default:
        return console.log;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Convenience wrapper for the mandatory Log() function signature
 * Usage: Log("backend", "info", "service", "Message", metadata?)
 */
export function Log(
  stack: Stack,
  level: LogLevel,
  pkg: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  logger.log(stack, level, pkg, message, metadata);
}
