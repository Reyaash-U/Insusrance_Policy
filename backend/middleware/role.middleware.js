import { sendError } from "../utils/apiResponse.js";

/**
 * Restricts access to users with one of the specified roles.
 * Must be used AFTER the `protect` middleware.
 *
 * Usage: router.get("/admin-only", protect, authorize("admin"), handler)
 *        router.get("/staff",       protect, authorize("admin", "agent"), handler)
 *
 * @param {...string} roles - Allowed role strings
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required.");
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. This action requires one of the following roles: ${roles.join(", ")}.`
      );
    }

    next();
  };
};

/**
 * Allows access only to the resource owner OR an admin.
 * Expects req.params.userId or a userId field to check against req.user._id.
 *
 * @param {string} paramField - The param field name that holds the target userId (default: "userId")
 */
export const ownerOrAdmin = (paramField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required.");
    }

    const targetId = req.params[paramField];
    const requesterId = req.user._id.toString();
    const isOwner = targetId && requesterId === targetId.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return sendError(res, 403, "Access denied. You can only access your own resources.");
    }

    next();
  };
};
