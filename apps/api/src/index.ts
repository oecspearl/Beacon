import "dotenv/config";

import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { logger } from "./config/logger.js";
import apiRouter from "./routes/index.js";
import { setupSocketIO } from "./socket/index.js";
import { startPeriodicChecks } from "./services/escalation.js";

// ---------------------------------------------------------------------------
// Express application
// ---------------------------------------------------------------------------

const app: Express = express();

// --- Security & parsing middleware -----------------------------------------
app.use(
  helmet({
    contentSecurityPolicy:
      config.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https://*.basemaps.cartocdn.com",
                "https://*.openstreetmap.org",
              ],
              connectSrc: ["'self'", "wss:", "ws:"],
              fontSrc: ["'self'", "data:"],
              workerSrc: ["'self'", "blob:"],
            },
          }
        : false,
  }),
);
app.use(
  cors({
    origin: config.CORS_ORIGINS,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Request logging -------------------------------------------------------
app.use((req, _res, next) => {
  logger.info(
    { method: req.method, url: req.url, ip: req.ip },
    "Incoming request",
  );
  next();
});

// --- API routes ------------------------------------------------------------
app.use("/api/v1", apiRouter);

// --- Serve dashboard static files in production ----------------------------
if (config.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dashboardDist = path.resolve(__dirname, "../../dashboard/dist");

  app.use(express.static(dashboardDist));

  // SPA fallback: serve index.html for any non-API route
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dashboardDist, "index.html"));
  });
}

// --- 404 handler (API routes only in production, all routes in dev) --------
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// --- Global error handler --------------------------------------------------
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error({ err }, "Unhandled error");
    res.status(500).json({ error: "Internal server error" });
  },
);

// ---------------------------------------------------------------------------
// HTTP + Socket.IO server
// ---------------------------------------------------------------------------

const server = http.createServer(app);
setupSocketIO(server);

// ---------------------------------------------------------------------------
// Start periodic background tasks
// ---------------------------------------------------------------------------

const stopChecks = startPeriodicChecks(5 * 60 * 1000); // every 5 minutes

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received, closing server");

  stopChecks();

  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ---------------------------------------------------------------------------
// Listen
// ---------------------------------------------------------------------------

server.listen(config.PORT, "0.0.0.0", () => {
  logger.info(
    {
      port: config.PORT,
      env: config.NODE_ENV,
      cors: config.CORS_ORIGINS,
    },
    `Beacon API server listening on port ${config.PORT}`,
  );
});

export { app, server };
