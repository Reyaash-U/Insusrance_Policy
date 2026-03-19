import { verifyAccessToken } from "../utils/generateToken.js";
import User from "../models/User.model.js";
import { sendError } from "../utils/apiResponse.js";

/**
 * Protects routes by verifying the JWT.
 * Accepts token from Authorization header (Bearer) OR httpOnly cookie.
 * Attaches the full user document to req.user.
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization header
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    // 2. Fallback to cookie
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return sendError(res, 401, "Access denied. No token provided.");
    }

    // 3. Verify token
    const decoded = verifyAccessToken(token);

    // 4. Fetch user (ensure they still exist and are active)
    const user = await User.findById(decoded.userId).select(
      "-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil"
    );

    if (!user) {
      return sendError(res, 401, "The user associated with this token no longer exists.");
    }

    if (!user.isActive) {
      return sendError(res, 403, "Your account has been deactivated. Please contact support.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Your session has expired. Please log in again.");
    }
    if (error.name === "JsonWebTokenError") {
      return sendError(res, 401, "Invalid token. Please log in again.");
    }
    next(error);
  }
};

/**
 * Optional auth — attaches user if token is valid, but does NOT block the request.
 * Useful for public routes that show extra info to logged-in users.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select("-password");
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch {
    // Silently ignore invalid/expired token for optional auth
  }
  next();
};
