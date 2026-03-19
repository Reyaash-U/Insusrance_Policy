import { Router } from "express";
import {
  getMyNotifications,
  getUnreadCount,
  markOneAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  broadcastToRole,
} from "../controllers/notification.controller.js";
import { protect }   from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

// All notification routes require authentication
router.use(protect);

// ─── User ─────────────────────────────────────────────────────
router.get(    "/",                                getMyNotifications);
router.get(    "/unread-count",                    getUnreadCount);
router.patch(  "/read-all",                        markAllAsRead);
router.delete( "/",                                clearAllNotifications);
router.patch(  "/:notificationId/read",            markOneAsRead);
router.delete( "/:notificationId",                 deleteNotification);

// ─── Admin ────────────────────────────────────────────────────
router.post(
  "/broadcast",
  authorize("admin"),
  broadcastToRole
);

export default router;
