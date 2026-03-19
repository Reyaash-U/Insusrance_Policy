import { Router } from "express";
import {
  getFraudLogs,
  getFraudLogByClaim,
  resolveFraudLog,
  recheckFraud,
  getFraudStats,
} from "../controllers/fraud.controller.js";
import { protect }   from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

// All fraud routes require authentication
router.use(protect);

// ─── Admin + Adjuster ─────────────────────────────────────────
router.get(  "/logs",               authorize("admin", "adjuster"), getFraudLogs);
router.get(  "/logs/claim/:claimId",authorize("admin", "adjuster"), getFraudLogByClaim);
router.post( "/recheck/:claimId",   authorize("admin", "adjuster"), recheckFraud);
router.get(  "/stats",              authorize("admin"),              getFraudStats);

// ─── Admin only ───────────────────────────────────────────────
router.patch("/logs/:logId/resolve", authorize("admin", "adjuster"), resolveFraudLog);

export default router;
