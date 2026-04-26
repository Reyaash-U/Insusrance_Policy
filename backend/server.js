import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";

import connectDB from "./config/db.js";
import { initGridFS } from "./config/gridfs.js";
import { initSocket } from "./config/socket.js";
import { globalLimiter } from "./middleware/rateLimiter.middleware.js";
import errorHandler from "./middleware/errorHandler.middleware.js";
import logger from "./utils/logger.js";

// ─── Route imports ─────────────────────────────────────────
import authRoutes          from "./routes/auth.routes.js";
import policyRoutes        from "./routes/policy.routes.js";
import claimRoutes         from "./routes/claim.routes.js";
import fraudRoutes         from "./routes/fraud.routes.js";
import notificationRoutes  from "./routes/notification.routes.js";
import uploadRoutes        from "./routes/upload.routes.js";
import adminRoutes        from "./routes/admin.routes.js";
import { serveFile }      from "./controllers/upload.controller.js";

// ─── App & Server ──────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ─── Connect Database ──────────────────────────────────────
await connectDB();

// ─── Initialize GridFS (must run after DB connects) ────────
initGridFS();

// ─── Initialize Socket.io ──────────────────────────────────
initSocket(httpServer);

// ─── CORS ──────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin '${origin}' not allowed.`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Security Headers ──────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow Cloudinary images
  })
);

// ─── Cookie Parser ─────────────────────────────────────────
app.use(cookieParser());

// ─── Body Parsers ──────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Sanitize NoSQL Injection ──────────────────────────────
app.use(mongoSanitize());

// ─── HTTP Request Logger ───────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(
    morgan("dev", {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
} else {
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

// ─── Global Rate Limiter ───────────────────────────────────
app.use("/api", globalLimiter);

// ─── Health Check ──────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    success: true,
    message: "Insurance API is running.",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────
app.use("/api/auth",           authRoutes);
app.use("/api/policies",       policyRoutes);
app.use("/api/claims",         claimRoutes);
app.use("/api/fraud",          fraudRoutes);
app.use("/api/notifications",  notificationRoutes);
app.use("/api/upload",         uploadRoutes);
app.use("/api/admin",         adminRoutes);

// ─── Public File Serving (GridFS) ──────────────────────────
app.get("/api/files/:id", serveFile);

// ─── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: [${req.method}] ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// ─── Graceful Shutdown ─────────────────────────────────────
const shutdown = (signal) => {
  logger.warn(`${signal} received. Shutting down gracefully...`);
  httpServer.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  httpServer.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

export default app;
