import FraudLog from "../models/FraudLog.model.js";
import Claim from "../models/Claim.model.js";
import PurchasedPolicy from "../models/PurchasedPolicy.model.js";
import { runFraudChecks, applyFraudCheck } from "../services/fraud.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { notify, emitToRole } from "../services/socket.service.js";
import { NOTIFICATION_TYPES } from "../models/Notification.model.js";

/**
 * GET /api/fraud/logs
 * Admin — paginated list of all fraud logs
 */
export const getFraudLogs = asyncHandler(async (req, res) => {
  const {
    page       = 1,
    limit      = 20,
    resolution,
    isFlagged,
    minScore,
    sortBy     = "riskScore",
    order      = "desc",
  } = req.query;

  const filter = {};
  if (resolution)               filter.resolution = resolution;
  if (isFlagged !== undefined)  filter.isFlagged  = isFlagged === "true";
  if (minScore)                 filter.riskScore  = { $gte: Number(minScore) };

  const skip      = (Number(page) - 1) * Number(limit);
  const sortOrder = order === "asc" ? 1 : -1;

  const [logs, total] = await Promise.all([
    FraudLog.find(filter)
      .populate("claim",    "claimNumber title claimAmount status incidentDate")
      .populate("customer", "firstName lastName email")
      .populate("resolvedBy", "firstName lastName")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    FraudLog.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "Fraud logs retrieved.", logs, {
    page:       Number(page),
    limit:      Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  });
});

/**
 * GET /api/fraud/logs/:claimId
 * Admin / Adjuster — fraud log for a specific claim
 */
export const getFraudLogByClaim = asyncHandler(async (req, res) => {
  const log = await FraudLog.findOne({ claim: req.params.claimId })
    .populate("claim",      "claimNumber title claimAmount status")
    .populate("customer",   "firstName lastName email")
    .populate("resolvedBy", "firstName lastName");

  if (!log) return sendError(res, 404, "Fraud log not found for this claim.");
  return sendSuccess(res, 200, "Fraud log retrieved.", log);
});

/**
 * PATCH /api/fraud/logs/:logId/resolve
 * Admin / Adjuster — update the resolution of a fraud log
 * Body: { resolution: "cleared" | "confirmed_fraud" | "escalated", resolutionNote }
 */
export const resolveFraudLog = asyncHandler(async (req, res) => {
  const { resolution, resolutionNote } = req.body;

  const validResolutions = ["cleared", "confirmed_fraud", "escalated"];
  if (!validResolutions.includes(resolution)) {
    return sendError(res, 400, `Resolution must be one of: ${validResolutions.join(", ")}.`);
  }

  const log = await FraudLog.findById(req.params.logId);
  if (!log) return sendError(res, 404, "Fraud log not found.");

  if (log.resolution !== "pending") {
    return sendError(res, 409, "This fraud log has already been resolved.");
  }

  log.resolution     = resolution;
  log.resolvedBy     = req.user._id;
  log.resolvedAt     = new Date();
  log.resolutionNote = resolutionNote || "";
  await log.save();

  // If confirmed as fraud — reject the claim automatically
  if (resolution === "confirmed_fraud") {
    const claim = await Claim.findById(log.claim);
    if (claim && !["approved", "rejected", "withdrawn"].includes(claim.status)) {
      claim.status          = "rejected";
      claim.rejectionReason = `Claim rejected due to confirmed fraud detection. ${resolutionNote || ""}`.trim();
      claim.resolvedAt      = new Date();
      claim.statusHistory.push({
        status:    "rejected",
        changedBy: req.user._id,
        note:      "Auto-rejected: confirmed fraud.",
        timestamp: new Date(),
      });
      await claim.save({ validateBeforeSave: false });

      // Notify customer
      await notify({
        recipientId: claim.customer.toString(),
        type:        NOTIFICATION_TYPES.CLAIM_REJECTED,
        title:       "Claim Rejected",
        message:     `Your claim ${claim.claimNumber} has been rejected following a fraud review.`,
        link:        `/my-claims/${claim._id}`,
        priority:    "urgent",
        resource:    { resourceType: "Claim", resourceId: claim._id },
      });
    }
  }

  // Notify all admins of the resolution
  emitToRole("admin", "fraud:resolved", {
    logId:      log._id,
    claimId:    log.claim,
    resolution,
    resolvedBy: req.user.fullName,
  });

  return sendSuccess(res, 200, "Fraud log resolved.", log);
});

/**
 * POST /api/fraud/recheck/:claimId
 * Admin / Adjuster — manually re-run fraud checks on a claim
 */
export const recheckFraud = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.claimId);
  if (!claim) return sendError(res, 404, "Claim not found.");

  if (["approved", "rejected", "withdrawn"].includes(claim.status)) {
    return sendError(res, 400, "Cannot recheck a resolved or withdrawn claim.");
  }

  const purchasedPolicy = await PurchasedPolicy.findById(claim.purchasedPolicy);
  if (!purchasedPolicy) return sendError(res, 404, "Purchased policy not found.");

  const updatedClaim = await applyFraudCheck(claim, purchasedPolicy);

  // If newly flagged, notify admin team
  if (updatedClaim.fraudCheck.isFlagged) {
    emitToRole("admin", "fraud:flagged", {
      claimId:     updatedClaim._id,
      claimNumber: updatedClaim.claimNumber,
      riskScore:   updatedClaim.fraudCheck.riskScore,
      flags:       updatedClaim.fraudCheck.flags,
    });
  }

  return sendSuccess(res, 200, "Fraud recheck complete.", {
    claimId:    updatedClaim._id,
    fraudCheck: updatedClaim.fraudCheck,
  });
});

/**
 * GET /api/fraud/stats
 * Admin — aggregate fraud statistics
 */
export const getFraudStats = asyncHandler(async (req, res) => {
  const [overview, ruleBreakdown, riskDistribution, recentTrend] = await Promise.all([
    // Overview totals
    FraudLog.aggregate([
      {
        $group: {
          _id:              null,
          totalLogs:        { $sum: 1 },
          flaggedLogs:      { $sum: { $cond: ["$isFlagged", 1, 0] } },
          avgRiskScore:     { $avg: "$riskScore" },
          confirmedFraud:   { $sum: { $cond: [{ $eq: ["$resolution", "confirmed_fraud"] }, 1, 0] } },
          pendingReview:    { $sum: { $cond: [{ $eq: ["$resolution", "pending"] }, 1, 0] } },
        },
      },
    ]),

    // Which fraud rules trigger most often
    FraudLog.aggregate([
      { $unwind: "$triggeredRules" },
      { $group: { _id: "$triggeredRules", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Risk score distribution buckets
    FraudLog.aggregate([
      {
        $bucket: {
          groupBy: "$riskScore",
          boundaries: [0, 20, 40, 60, 80, 101],
          default: "other",
          output: { count: { $sum: 1 } },
        },
      },
    ]),

    // Monthly fraud flag trend (last 6 months)
    FraudLog.aggregate([
      {
        $match: {
          isFlagged: true,
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id:   { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  return sendSuccess(res, 200, "Fraud statistics retrieved.", {
    overview:         overview[0] || {},
    ruleBreakdown,
    riskDistribution,
    recentTrend,
  });
});
