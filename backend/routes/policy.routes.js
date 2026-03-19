import { Router } from "express";
import {
  getAllPolicies,
  getPolicyById,
  getPolicyBySlug,
  calculatePremiumPreview,
  purchasePolicy,
  getMyPolicies,
  getMyPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  adminGetAllPolicies,
  adminGetPurchasedPolicies,
} from "../controllers/policy.controller.js";
import { protect }    from "../middleware/auth.middleware.js";
import { authorize }  from "../middleware/role.middleware.js";
import validate       from "../middleware/validate.middleware.js";
import { uploadPolicyThumbnail } from "../middleware/upload.middleware.js";
import { uploadLimiter }         from "../middleware/rateLimiter.middleware.js";
import {
  createPolicyValidator,
  updatePolicyValidator,
  policyQueryValidator,
  purchasePolicyValidator,
  calculatePremiumValidator,
} from "../validators/policy.validator.js";

const router = Router();

// ─── Public (specific routes BEFORE /:id) ────────────────────
router.get("/",            policyQueryValidator, validate, getAllPolicies);
router.get("/slug/:slug",  getPolicyBySlug);

// ─── Customer ─────────────────────────────────────────────────
router.get("/my-policies",                       protect, authorize("customer"), getMyPolicies);
router.get("/my-policies/:purchasedPolicyId",    protect, getMyPolicyById);

router.post(
  "/calculate-premium",
  protect,
  authorize("customer"),
  calculatePremiumValidator,
  validate,
  calculatePremiumPreview
);

router.post(
  "/purchase",
  protect,
  authorize("customer"),
  purchasePolicyValidator,
  validate,
  purchasePolicy
);

// ─── Admin ────────────────────────────────────────────────────
router.get("/admin/all",       protect, authorize("admin"),          adminGetAllPolicies);
router.get("/admin/purchased", protect, authorize("admin", "agent"), adminGetPurchasedPolicies);

// ─── Wildcard (must be last) ──────────────────────────────────
router.get("/:id", getPolicyById);

router.post(
  "/",
  protect,
  authorize("admin"),
  uploadLimiter,
  uploadPolicyThumbnail,
  createPolicyValidator,
  validate,
  createPolicy
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  uploadPolicyThumbnail,
  updatePolicyValidator,
  validate,
  updatePolicy
);

router.delete("/:id", protect, authorize("admin"), deletePolicy);

export default router;
