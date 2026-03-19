import logger from "../utils/logger.js";
import { sendError } from "../utils/apiResponse.js";

/**
 * Global Express error-handling middleware.
 * Must be registered LAST in server.js (after all routes).
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File too large. Maximum upload size is 10MB.";
  }

  logger.error(`[${req.method}] ${req.originalUrl} → ${statusCode}: ${message}`, {
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  return sendError(
    res,
    statusCode,
    message,
    process.env.NODE_ENV === "development" ? err.stack : null
  );
};

export default errorHandler;
