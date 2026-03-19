import Notification from "../models/Notification.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { emitToUser } from "../services/socket.service.js";
import { SOCKET_EVENTS } from "../config/socket.js";

/**
 * GET /api/notifications
 * Protected — returns the current user's notifications (paginated).
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const {
    page   = 1,
    limit  = 20,
    unread,          // "true" → only unread
    type,
  } = req.query;

  const filter = { recipient: req.user._id };
  if (unread === "true")  filter.isRead = false;
  if (type)               filter.type   = type;

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("sender", "firstName lastName avatar"),

    Notification.countDocuments(filter),

    Notification.getUnreadCount(req.user._id.toString()),
  ]);

  return sendSuccess(res, 200, "Notifications retrieved.", notifications, {
    page:        Number(page),
    limit:       Number(limit),
    total,
    totalPages:  Math.ceil(total / Number(limit)),
    unreadCount,
  });
});

/**
 * GET /api/notifications/unread-count
 * Protected — lightweight endpoint for polling or initial badge load.
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.getUnreadCount(req.user._id.toString());
  return sendSuccess(res, 200, "Unread count retrieved.", { unreadCount: count });
});

/**
 * PATCH /api/notifications/:notificationId/read
 * Protected — marks a single notification as read.
 */
export const markOneAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.markAsRead(
    req.params.notificationId,
    req.user._id.toString()
  );

  if (!notification) {
    return sendError(res, 404, "Notification not found or already read.");
  }

  // Push updated unread count in real-time
  const unreadCount = await Notification.getUnreadCount(req.user._id.toString());
  emitToUser(
    req.user._id.toString(),
    SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT,
    unreadCount
  );

  return sendSuccess(res, 200, "Notification marked as read.", notification);
});

/**
 * PATCH /api/notifications/read-all
 * Protected — marks all unread notifications for the current user as read.
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.markAllAsRead(req.user._id.toString());

  // Push zero count in real-time
  emitToUser(req.user._id.toString(), SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT, 0);

  return sendSuccess(res, 200, "All notifications marked as read.", {
    modifiedCount: result.modifiedCount,
  });
});

/**
 * DELETE /api/notifications/:notificationId
 * Protected — soft-deletes a single notification (hides from user).
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, recipient: req.user._id },
    { isDeleted: true },
    { new: true }
  );

  if (!notification) {
    return sendError(res, 404, "Notification not found.");
  }

  return sendSuccess(res, 200, "Notification deleted.");
});

/**
 * DELETE /api/notifications
 * Protected — soft-deletes ALL notifications for the current user.
 */
export const clearAllNotifications = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id },
    { isDeleted: true }
  );

  return sendSuccess(res, 200, "All notifications cleared.");
});

// ─── Admin ────────────────────────────────────────────────────

/**
 * POST /api/notifications/broadcast
 * Admin only — sends a system notification to all users in a role.
 * Body: { role, title, message, link?, priority? }
 */
export const broadcastToRole = asyncHandler(async (req, res) => {
  const { role, title, message, link, priority = "normal" } = req.body;

  const validRoles = ["customer", "agent", "adjuster", "admin"];
  if (!validRoles.includes(role)) {
    return sendError(res, 400, `Role must be one of: ${validRoles.join(", ")}.`);
  }

  if (!title || !message) {
    return sendError(res, 400, "title and message are required.");
  }

  // Import User model lazily to avoid circular deps
  const User = (await import("../models/User.model.js")).default;
  const users = await User.find({ role, isActive: true }).select("_id");

  if (!users.length) {
    return sendError(res, 404, `No active users found with role '${role}'.`);
  }

  // Create notifications in bulk
  const docs = users.map((u) => ({
    recipient: u._id,
    sender:    req.user._id,
    type:      "account_verified", // Closest generic type; extend NOTIFICATION_TYPES for "system_broadcast"
    title,
    message,
    link:      link || null,
    priority,
    channels:  { inApp: true, email: false },
  }));

  await Notification.insertMany(docs);

  // Emit real-time to the role room
  const io = (await import("../config/socket.js")).getIO();
  io.to(`role:${role}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, {
    type:      "system_broadcast",
    title,
    message,
    link:      link || null,
    priority,
    createdAt: new Date(),
  });

  return sendSuccess(res, 200, `Broadcast sent to ${users.length} user(s) with role '${role}'.`, {
    recipientCount: users.length,
  });
});
