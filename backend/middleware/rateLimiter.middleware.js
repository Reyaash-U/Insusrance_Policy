import rateLimit from "express-rate-limit";
import { sendError } from "../utils/apiResponse.js";

const createLimiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => sendError(res, 429, message),
  });

// Strict limiter for auth routes (login, register, forgot-password)
export const authLimiter = createLimiter(
  15,
  20,
  "Too many authentication attempts. Please try again after 15 minutes."
);

// General API limiter applied globally
export const globalLimiter = createLimiter(
  10,
  200,
  "Too many requests from this IP. Please try again after 10 minutes."
);

// Strict limiter for file uploads
export const uploadLimiter = createLimiter(
  60,
  30,
  "Upload limit reached. Please try again after an hour."
);
