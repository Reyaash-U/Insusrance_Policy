import { Router } from "express";
import {
  submitClaim,
  getMyClaims,
  getClaimById,
  withdrawClaim,
  getAdjusterQueue,
  assignAdjuster,
  reviewClaim,
  adminGetAllClaims,
  getClaimStats,
} from "../controllers/claim.controller.js";
import { protect }   from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import validate      from "../middleware/validate.middleware.js";
import { uploadClaimFiles } from "../middleware/upload.middleware.js";
import { uploadLimiter }    from "../middleware/rateLimiter.middleware.js";
import {
  submitClaimValidator,
  reviewClaimValidator,
  claimQueryValidator,
  assignAdjusterValidator,
} from "../validators/claim.validator.js";

const router = Router();

// ─── Customer ─────────────────────────────────────────────────

// Submit a new claim (with optional file attachments)
router.post(
  "/",
  protect,
  authorize("customer"),
  uploadLimiter,
  uploadClaimFiles,        // multer parses multipart/form-data
  submitClaimValidator,
  validate,
  submitClaim
);

router.get(
  "/my-claims",
  protect,
  authorize("customer"),
  claimQueryValidator,
  validate,
  getMyClaims
);

router.delete(
  "/:claimId/withdraw",
  protect,
  authorize("customer"),
  withdrawClaim
);

// ─── Adjuster / Admin ─────────────────────────────────────────

router.get(
  "/adjuster/queue",
  protect,
  authorize("adjuster", "admin"),
  claimQueryValidator,
  validate,
  getAdjusterQueue
);

router.patch(
  "/:claimId/review",
  protect,
  authorize("adjuster", "admin"),
  reviewClaimValidator,
  validate,
  reviewClaim
);

// ─── Admin ────────────────────────────────────────────────────

router.patch(
  "/:claimId/assign",
  protect,
  authorize("admin"),
  assignAdjusterValidator,
  validate,
  assignAdjuster
);

router.get(
  "/admin/all",
  protect,
  authorize("admin"),
  claimQueryValidator,
  validate,
  adminGetAllClaims
);

router.get(
  "/admin/stats",
  protect,
  authorize("admin", "adjuster"),
  getClaimStats
);

// ─── Shared (owner + staff) ───────────────────────────────────

router.get(
  "/:claimId",
  protect,
  authorize("customer", "adjuster", "agent", "admin"),
  getClaimById
);

export default router;
