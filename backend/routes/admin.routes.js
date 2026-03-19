import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  getPlatformStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
} from "../controllers/admin.controller.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, authorize("admin"));

router.get("/stats",                  getPlatformStats);
router.get("/users",                  getAllUsers);
router.get("/users/:id",              getUserById);
router.patch("/users/:id/role",       updateUserRole);
router.patch("/users/:id/toggle-status", toggleUserStatus);

export default router;
