import User from "../models/User.model.js";
import Claim from "../models/Claim.model.js";
import Policy from "../models/Policy.model.js";
import PurchasedPolicy from "../models/PurchasedPolicy.model.js";
import FraudLog from "../models/FraudLog.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// ─── Platform Stats ────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Admin only
 */
export const getPlatformStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    usersByRole,
    totalClaims,
    claimsByStatus,
    totalPolicies,
    totalPurchased,
    fraudFlagged,
  ] = await Promise.all([
    User.countDocuments(),
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    Claim.countDocuments(),
    Claim.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Policy.countDocuments({ isActive: true }),
    PurchasedPolicy.countDocuments({ status: "active" }),
    FraudLog.countDocuments({ isFlagged: true }),
  ]);

  return sendSuccess(res, 200, "Platform stats fetched.", {
    totalUsers,
    usersByRole,
    totalClaims,
    claimsByStatus,
    totalPolicies,
    totalPurchased,
    fraudFlagged,
  });
});

// ─── User Management ──────────────────────────────────────────

/**
 * GET /api/admin/users
 * Admin only — paginated with optional search
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { search = "", role = "", page = 1, limit = 50 } = req.query;

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName:  { $regex: search, $options: "i" } },
      { email:     { $regex: search, $options: "i" } },
    ];
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .select("-password -emailVerificationToken -passwordResetToken");

  return sendSuccess(res, 200, "Users fetched.", users, {
    total,
    page:  Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

/**
 * GET /api/admin/users/:id
 * Admin only
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password -emailVerificationToken -passwordResetToken");
  if (!user) return sendError(res, 404, "User not found.");
  return sendSuccess(res, 200, "User fetched.", user);
});

/**
 * PATCH /api/admin/users/:id/role
 * Admin only — update role
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ["customer", "agent", "adjuster", "admin"];
  if (!validRoles.includes(role)) {
    return sendError(res, 400, `Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  // Prevent demoting yourself
  if (req.params.id === req.user._id.toString()) {
    return sendError(res, 403, "You cannot change your own role.");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) return sendError(res, 404, "User not found.");
  return sendSuccess(res, 200, `User role updated to '${role}'.`, user);
});

/**
 * PATCH /api/admin/users/:id/toggle-status
 * Admin only — activate / deactivate
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return sendError(res, 403, "You cannot deactivate your own account.");
  }

  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, "User not found.");

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(
    res,
    200,
    `User ${user.isActive ? "activated" : "deactivated"} successfully.`,
    { _id: user._id, isActive: user.isActive }
  );
});
