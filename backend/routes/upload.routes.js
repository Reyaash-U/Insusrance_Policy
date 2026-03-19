import { Router } from "express";
import {
  uploadUserAvatar,
  deleteUpload,
} from "../controllers/upload.controller.js";
import { protect }    from "../middleware/auth.middleware.js";
import { authorize }  from "../middleware/role.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";
import { uploadLimiter } from "../middleware/rateLimiter.middleware.js";

const router = Router();

// All routes below require authentication
router.use(protect);

// ─── Avatar ───────────────────────────────────────────────────
router.patch(
  "/avatar",
  uploadLimiter,
  uploadAvatar,        // multer parses multipart
  uploadUserAvatar     // saves to GridFS, updates User.avatar
);

// ─── Admin manual delete ──────────────────────────────────────
router.delete(
  "/",
  authorize("admin"),
  deleteUpload
);

export default router;
