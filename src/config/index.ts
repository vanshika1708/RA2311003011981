import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // Base URL for external APIs
  baseUrl: process.env.BASE_URL || "http://localhost:8000",

  // Auth
  auth: {
    email: process.env.EMAIL || "",
    rollNo: process.env.ROLL_NO || "",
    clientID: process.env.CLIENT_ID || "",
    clientSecret: process.env.CLIENT_SECRET || "",
    jwtSecret: process.env.JWT_SECRET || "default-secret-change-in-production",
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    enableRemote: process.env.ENABLE_REMOTE_LOGGING !== "false",
    remoteApi: process.env.REMOTE_LOG_API || "http://localhost:8000/logs",
  },

  // Timeouts (in ms)
  timeouts: {
    api: parseInt(process.env.API_TIMEOUT || "10000", 10),
  },

  // API Endpoints (derived from BASE_URL)
  apis: {
    register: () => `${config.baseUrl}/register`,
    auth: () => `${config.baseUrl}/auth`,
    depots: () => `${config.baseUrl}/depots`,
    vehicles: () => `${config.baseUrl}/vehicles`,
    logs: () => `${config.baseUrl}/logs`,
  },
};

// Validate required environment variables
function validateConfig(): void {
  const required = ["EMAIL", "ROLL_NO", "CLIENT_ID", "CLIENT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `[WARN] Missing environment variables: ${missing.join(", ")}`
    );
    console.warn(
      "[WARN] Please copy .env.example to .env and fill in the required values"
    );
  }
}

validateConfig();
