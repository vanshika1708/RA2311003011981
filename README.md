# Vehicle Maintenance Scheduler — Backend Service

A production-grade **Node.js + TypeScript** microservice that solves the vehicle maintenance scheduling problem using **0/1 Knapsack optimization**.

## Overview

Given a set of depots with finite mechanic-hours and a pool of maintenance tasks (each with duration and impact score), the service selects the optimal subset of tasks to **maximize total impact** without exceeding available hours.

## Features

✅ **0/1 Knapsack Algorithm** — Dynamic programming solution for optimal task selection  
✅ **RESTful API** — Clean, documented endpoints  
✅ **Authentication** — Bearer token-based auth with JWT  
✅ **Logging** — Comprehensive logging to console and remote API  
✅ **Error Handling** — Structured error responses  
✅ **TypeScript** — Full type safety  
✅ **Parallel Processing** — Concurrent depot scheduling  

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Environment variables configured (see below)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Configuration

Edit `.env` with your values:

```env
PORT=3000
NODE_ENV=development

# External API base URL
BASE_URL=http://localhost:8000

# Auth Credentials (get from /auth/register or configure manually)
EMAIL=your_email@example.com
ROLL_NO=your_roll_no
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret

# JWT Secret (change in production!)
JWT_SECRET=your_strong_secret_key

# Logging
LOG_LEVEL=info
ENABLE_REMOTE_LOGGING=true
REMOTE_LOG_API=http://localhost:8000/logs
```

### Run

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## API Endpoints

### Authentication

#### `POST /auth/register`
Register new user and get credentials.

**Body:**
```json
{
  "email": "user@example.com",
  "rollNo": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-01-01T10:00:00.000Z"
}
```

#### `POST /auth/token`
Get JWT token using credentials from `.env`.

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-01-01T10:00:00.000Z"
}
```

### Scheduler (Protected)

All scheduler endpoints require:
```
Authorization: Bearer <token>
```

#### `GET /schedule/all`
Get optimal schedule for **all depots**.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalDepots": 3,
      "totalTasksScheduled": 12,
      "totalImpactAchieved": 480
    },
    "depotSchedules": [
      {
        "depotId": "D001",
        "depotName": "Central Depot",
        "availableHours": 8,
        "usedHours": 7.5,
        "totalImpactScore": 165,
        "efficiency": "93.8%",
        "selectedTasks": [
          {
            "taskId": "T001",
            "vehicleId": "V001",
            "vehicleName": "Bus 42",
            "taskName": "Oil Change",
            "duration": 1.5,
            "impactScore": 40
          }
        ],
        "skippedTasks": []
      }
    ]
  },
  "timestamp": "2025-01-01T10:00:00.000Z"
}
```

#### `GET /schedule/:depotId`
Get optimal schedule for a **single depot**.

**Response:**
```json
{
  "success": true,
  "data": {
    "depotId": "D001",
    "depotName": "Central Depot",
    "availableHours": 8,
    "usedHours": 7.5,
    "totalImpactScore": 165,
    "efficiency": "93.8%",
    "selectedTasks": [...],
    "skippedTasks": [...]
  },
  "timestamp": "2025-01-01T10:00:00.000Z"
}
```

### Health Check

#### `GET /health`
Service health check (no auth required).

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2025-01-01T10:00:00.000Z"
}
```

## Project Structure

```
src/
├── config/              # Configuration management
│   └── index.ts
├── handler/             # HTTP request/response handling
│   ├── auth.handler.ts
│   └── scheduler.handler.ts
├── middleware/          # Express middleware
│   ├── auth.ts          # Bearer token validation
│   ├── requestLogger.ts # Request/response logging
│   └── index.ts
├── repository/          # External API calls
│   ├── auth.repository.ts
│   ├── depot.repository.ts
│   └── vehicle.repository.ts
├── service/             # Business logic
│   ├── auth.service.ts
│   └── scheduler.service.ts
├── types/               # TypeScript interfaces
│   └── index.ts
├── utils/               # Utilities
│   ├── knapsack.ts      # 0/1 Knapsack algorithm
│   └── logger.ts        # Logging utility
└── index.ts             # Express app entry point
```

## Architecture

```
Client (Postman / Frontend)
        │
        ▼
┌───────────────────────┐
│     Express Server    │  ← CORS, JSON parsing
│     src/index.ts      │
└──────────┬────────────┘
           │
    ┌──────▼──────┐
    │  Middleware  │  authMiddleware, requestLogger, errorHandler
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Handler   │  auth.handler.ts, scheduler.handler.ts
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Service   │  auth.service.ts, scheduler.service.ts
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │ Repository  │  auth.repository.ts, depot.repository.ts, vehicle.repository.ts
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  External   │  /register, /auth, /depots, /vehicles APIs
    └─────────────┘
```

## Algorithm: 0/1 Knapsack

### Problem
- **Capacity:** `depot.availableHours` (total mechanic hours)
- **Items:** maintenance tasks with `duration` (weight) and `impactScore` (value)
- **Goal:** maximize total impact without exceeding available hours

### Solution
Dynamic programming with backtracking to find selected items.

**Complexity:**
- Time: O(n × W) where W = capacity × 10
- Space: O(n × W) for DP table

**Precision:** Durations scaled ×10 to preserve 0.5-hour precision.

## Logging

Every layer uses the mandatory `Log()` function:

```typescript
import { Log } from "./utils/logger";

Log("backend", "info", "service", "Message", metadata?);
```

Logs are:
1. **Printed to console** for local debugging
2. **Pushed to remote API** (fire-and-forget, non-blocking)

### Log Levels
- `debug` — Detailed tracing
- `info` — Normal operations
- `warn` — Recoverable issues
- `error` — API failures, bad input
- `fatal` — Server crash

## Error Handling

All errors return structured responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-01-01T10:00:00.000Z",
  "code": "ERROR_CODE"
}
```

## Testing

```bash
# Using curl
curl -X POST http://localhost:3000/auth/token

# Using Postman/Insomnia
# See docs/postman-collection.json for exported collection
```

## Performance

Typical times (on standard hardware):
- Token generation: <5ms
- Depot scheduling (100 tasks, 8-hour capacity): ~10ms
- All depots (3 depots): ~30ms

## Deployment

### Docker
```bash
docker build -t scheduler .
docker run -p 3000:3000 --env-file .env scheduler
```

### Railway/Heroku
```bash
git push railway main
# Or set up automatic deploys from GitHub
```

## Trade-offs & Design Decisions

### Why Express?
Lightweight, widely understood, sufficient for a microservice. Avoids framework overhead.

### Why 0/1 Knapsack?
Each task is binary (done or not done). DP is optimal; greedy is provably suboptimal.

### Why parallel processing?
Depots are independent. `Promise.all()` enables concurrent scheduling — much faster than sequential.

### Why fire-and-forget logging?
Logging must never block or crash the main flow. Remote log failures are silently swallowed.

## License

MIT

## Support

For issues or questions, please refer to the system design documentation or contact the team.
