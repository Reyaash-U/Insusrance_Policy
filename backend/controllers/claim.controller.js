import Claim from "../models/Claim.model.js";
import PurchasedPolicy from "../models/PurchasedPolicy.model.js";
import User from "../models/User.model.js";
import FraudLog from "../models/FraudLog.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { uploadMultipleFiles, deleteMultipleFiles } from "../services/upload.service.js";
import { applyFraudCheck } from "../services/fraud.service.js";
import { notify, emitToRole } from "../services/socket.service.js";
import { NOTIFICATION_TYPES } from "../models/Notification.model.js";

// ─── Submit Claim ─────────────────────────────────────────────

/**
 * POST /api/claims
 * Protected — Customer
 */
export const submitClaim = asyncHandler(async (req, res) => {
  const { purchasedPolicyId, title, description, incidentDate, claimAmount, incidentLocation } =
    req.body;

  const customerId = req.user._id;

  // 1. Validate the purchased policy belongs to this customer and is active
  const purchasedPolicy = await PurchasedPolicy.findOne({
    _id:      purchasedPolicyId,
    customer: customerId,
    status:   "active",
  });

  if (!purchasedPolicy) {
    return sendError(res, 404, "Active purchased policy not found.");
  }

  // 2. Policy expiry guard
  if (purchasedPolicy.endDate < new Date()) {
    return sendError(res, 400, "Your policy has expired. Claims cannot be submitted.");
  }

  // 3. Waiting period guard
  if (new Date() < purchasedPolicy.claimsAllowedFrom) {
    const allowed = purchasedPolicy.claimsAllowedFrom.toLocaleDateString();
    return sendError(res, 400, `Claims can only be submitted after ${allowed} (waiting period).`);
  }

  // 4. Remaining coverage guard
  if (claimAmount > purchasedPolicy.remainingCoverageAmount) {
    return sendError(
      res,
      400,
      `Claim amount ($${claimAmount}) exceeds your remaining coverage ($${purchasedPolicy.remainingCoverageAmount}).`
    );
  }

  // 5. Max claim amount guard
  if (claimAmount > purchasedPolicy.policySnapshot.maxClaimAmount) {
    return sendError(
      res,
      400,
      `Claim amount exceeds the policy maximum of $${purchasedPolicy.policySnapshot.maxClaimAmount}.`
    );
  }

  // 6. Upload attachments to Cloudinary
  let attachments = [];
  if (req.files && req.files.length > 0) {
    attachments = await uploadMultipleFiles(
      req.files,
      `insurance/claims/${purchasedPolicyId}`
    );
  }

  // 7. Create claim document
  const claim = await Claim.create({
    purchasedPolicy: purchasedPolicy._id,
    policy:          purchasedPolicy.policy,
    customer:        customerId,
    title,
    description,
    incidentDate:    new Date(incidentDate),
    incidentLocation: incidentLocation || {},
    claimAmount:     parseFloat(claimAmount),
    attachments,
  });

  // 8. Run fraud detection asynchronously (non-blocking to response)
  applyFraudCheck(claim, purchasedPolicy).catch((err) => {
    console.error("Background fraud check failed:", err.message);
  });

  // 9. Notify customer
  await notify({
    recipientId: customerId.toString(),
    type:        NOTIFICATION_TYPES.CLAIM_SUBMITTED,
    title:       "Claim Submitted",
    message:     `Your claim "${title}" (#${claim.claimNumber}) has been submitted and is under review.`,
    link:        `/my-claims/${claim._id}`,
    priority:    "normal",
    resource:    { resourceType: "Claim", resourceId: claim._id },
  });

  // 10. Alert all adjusters of a new claim
  emitToRole("adjuster", "claim:new", {
    claimId:     claim._id,
    claimNumber: claim.claimNumber,
    customer:    req.user.fullName,
    amount:      claim.claimAmount,
  });

  return sendSuccess(res, 201, "Claim submitted successfully.", claim);
});

// ─── Get Customer's Own Claims ────────────────────────────────

/**
 * GET /api/claims/my-claims
 * Protected — Customer
 */
export const getMyClaims = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, sortBy = "createdAt", order = "desc" } = req.query;

  const filter    = { customer: req.user._id };
  if (status) filter.status = status;

  const skip      = (Number(page) - 1) * Number(limit);
  const sortOrder = order === "asc" ? 1 : -1;

  const [claims, total] = await Promise.all([
    Claim.find(filter)
      .populate("purchasedPolicy", "policySnapshot startDate endDate")
      .populate("policy",          "name category")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    Claim.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "Your claims retrieved.", claims, {
    page:       Number(page),
    limit:      Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  });
});

/**
 * GET /api/claims/my-claims/:claimId
 * Protected — Customer (owner) or Admin/Adjuster
 */
export const getClaimById = asyncHandler(async (req, res) => {
  const { claimId } = req.params;

  const filter = { _id: claimId };
  if (!["admin", "adjuster", "agent"].includes(req.user.role)) {
    filter.customer = req.user._id;
  }

  const claim = await Claim.findOne(filter)
    .populate("customer",        "firstName lastName email phone")
    .populate("adjuster",        "firstName lastName email")
    .populate("purchasedPolicy", "policySnapshot startDate endDate premiumDetails")
    .populate("policy",          "name category maxClaimAmount deductible");

  if (!claim) return sendError(res, 404, "Claim not found.");

  // Attach fraud log if admin/adjuster
  let fraudLog = null;
  if (["admin", "adjuster"].includes(req.user.role)) {
    fraudLog = await FraudLog.findOne({ claim: claim._id }).populate(
      "resolvedBy",
      "firstName lastName"
    );
  }

  return sendSuccess(res, 200, "Claim retrieved.", { claim, fraudLog });
});

/**
 * DELETE /api/claims/:claimId (withdraw)
 * Protected — Customer. Only allowed while status is "submitted".
 */
export const withdrawClaim = asyncHandler(async (req, res) => {
  const claim = await Claim.findOne({
    _id:      req.params.claimId,
    customer: req.user._id,
    status:   "submitted",
  });

  if (!claim) {
    return sendError(
      res,
      404,
      "Claim not found or cannot be withdrawn. Only claims in 'submitted' status can be withdrawn."
    );
  }

  // Delete attachments from GridFS
  await deleteMultipleFiles(claim.attachments);

  // Update status
  claim.status = "withdrawn";
  claim.statusHistory.push({
    status:    "withdrawn",
    changedBy: req.user._id,
    note:      req.body.reason || "Withdrawn by customer.",
    timestamp: new Date(),
  });
  await claim.save({ validateBeforeSave: false });

  return sendSuccess(res, 200, "Claim withdrawn successfully.");
});

// ─── Adjuster Controllers ─────────────────────────────────────

/**
 * GET /api/claims/adjuster/queue
 * Protected — Adjuster, Admin
 * Returns all claims assigned to this adjuster OR unassigned submitted claims.
 */
export const getAdjusterQueue = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, status, flagged } = req.query;

  const filter = {
    $or: [
      { adjuster: req.user._id },
      { adjuster: null, status: "submitted" },
    ],
  };
  if (status)           filter.status = status;
  if (flagged === "true") filter["fraudCheck.isFlagged"] = true;

  const skip = (Number(page) - 1) * Number(limit);

  const [claims, total] = await Promise.all([
    Claim.find(filter)
      .populate("customer", "firstName lastName email")
      .populate("policy",   "name category")
      .sort({ "fraudCheck.isFlagged": -1, createdAt: 1 }) // Flagged first, oldest first
      .skip(skip)
      .limit(Number(limit)),
    Claim.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "Adjuster queue retrieved.", claims, {
    page:       Number(page),
    limit:      Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  });
});

/**
 * PATCH /api/claims/:claimId/assign
 * Protected — Admin only
 */
export const assignAdjuster = asyncHandler(async (req, res) => {
  const { adjusterId } = req.body;

  const adjuster = await User.findOne({ _id: adjusterId, role: "adjuster", isActive: true });
  if (!adjuster) return sendError(res, 404, "Adjuster not found or inactive.");

  const claim = await Claim.findById(req.params.claimId);
  if (!claim) return sendError(res, 404, "Claim not found.");

  if (["approved", "rejected", "withdrawn"].includes(claim.status)) {
    return sendError(res, 400, "Cannot reassign a resolved claim.");
  }

  claim.adjuster = adjusterId;
  await claim.save({ validateBeforeSave: false });

  // Notify adjuster
  await notify({
    recipientId: adjusterId,
    type:        NOTIFICATION_TYPES.NEW_CLAIM_ASSIGNED,
    title:       "New Claim Assigned",
    message:     `Claim ${claim.claimNumber} has been assigned to you for review.`,
    link:        `/adjuster/claims/${claim._id}`,
    priority:    "high",
    resource:    { resourceType: "Claim", resourceId: claim._id },
  });

  return sendSuccess(res, 200, "Adjuster assigned successfully.", { claimId: claim._id, adjuster: adjusterId });
});

/**
 * PATCH /api/claims/:claimId/review
 * Protected — Adjuster, Admin
 * Transitions: submitted→under_review, under_review→approved/rejected
 */
export const reviewClaim = asyncHandler(async (req, res) => {
  const { status, adjusterNote, approvedAmount, rejectionReason, deductibleApplied = 0 } =
    req.body;

  const claim = await Claim.findById(req.params.claimId);
  if (!claim) return sendError(res, 404, "Claim not found.");

  // Adjuster permission rule:
  // - Can review only their own assigned claims.
  // - Can take an unassigned submitted claim only when moving it to under_review.
  if (req.user.role === "adjuster") {
    const isAssignedToSelf = claim.adjuster?.toString() === req.user._id.toString();
    const isUnassigned = !claim.adjuster;
    const canTakeOwnership =
      isUnassigned && claim.status === "submitted" && status === "under_review";

    if (!isAssignedToSelf && !canTakeOwnership) {
      return sendError(res, 403, "This claim is not assigned to you.");
    }

    if (canTakeOwnership) {
      claim.adjuster = req.user._id;
    }
  }

  // Status transition validation
  const allowedTransitions = {
    submitted:    ["under_review"],
    under_review: ["approved", "rejected"],
  };

  const allowed = allowedTransitions[claim.status] || [];
  if (!allowed.includes(status)) {
    return sendError(
      res,
      400,
      `Cannot transition from '${claim.status}' to '${status}'. Allowed: ${allowed.join(", ") || "none"}.`
    );
  }

  // Apply changes
  claim.status       = status;
  claim.adjusterNote = adjusterNote || claim.adjusterNote;

  if (status === "approved") {
    const deductible  = parseFloat(deductibleApplied) || claim.purchasedPolicy?.policySnapshot?.deductible || 0;
    const approved    = parseFloat(approvedAmount);
    const payout      = Math.max(0, approved - deductible);

    claim.approvedAmount      = approved;
    claim.deductibleApplied   = deductible;
    claim.finalPayoutAmount   = parseFloat(payout.toFixed(2));
    claim.resolvedAt          = new Date();

    // Update purchased policy coverage counters
    await PurchasedPolicy.findByIdAndUpdate(claim.purchasedPolicy, {
      $inc: {
        totalClaimsCount:      1,
        totalClaimedAmount:    approved,
        remainingCoverageAmount: -approved,
      },
    });
  }

  if (status === "rejected") {
    claim.rejectionReason = rejectionReason;
    claim.resolvedAt      = new Date();
  }

  if (status === "under_review" && !claim.adjuster && req.user.role === "adjuster") {
    claim.adjuster = req.user._id;
  }

  // Append to status history
  claim.statusHistory.push({
    status,
    changedBy: req.user._id,
    note:      adjusterNote || "",
    timestamp: new Date(),
  });

  await claim.save({ validateBeforeSave: false });

  // Map status to notification type
  const notifTypeMap = {
    under_review: NOTIFICATION_TYPES.CLAIM_UNDER_REVIEW,
    approved:     NOTIFICATION_TYPES.CLAIM_APPROVED,
    rejected:     NOTIFICATION_TYPES.CLAIM_REJECTED,
  };

  const notifMessages = {
    under_review: `Your claim ${claim.claimNumber} is now under review by our team.`,
    approved:     `Great news! Your claim ${claim.claimNumber} has been approved. Payout: $${claim.finalPayoutAmount}.`,
    rejected:     `Your claim ${claim.claimNumber} was rejected. Reason: ${rejectionReason}`,
  };

  // Notify customer
  const customerId = claim.customer.toString();
  await notify({
    recipientId: customerId,
    type:        notifTypeMap[status],
    title:       `Claim ${status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}`,
    message:     notifMessages[status],
    link:        `/my-claims/${claim._id}`,
    priority:    status === "approved" ? "high" : "normal",
    resource:    { resourceType: "Claim", resourceId: claim._id },
  });

  // Emit real-time status update to the customer
  const { emitToUser } = await import("../services/socket.service.js");
  emitToUser(customerId, "claim:status_update", {
    claimId:     claim._id,
    claimNumber: claim.claimNumber,
    status,
  });

  return sendSuccess(res, 200, `Claim status updated to '${status}'.`, claim);
});

// ─── Admin Controllers ────────────────────────────────────────

/**
 * GET /api/claims/admin/all
 * Admin only
 */
export const adminGetAllClaims = asyncHandler(async (req, res) => {
  const {
    page     = 1,
    limit    = 20,
    status,
    flagged,
    customerId,
    policyId,
    sortBy   = "createdAt",
    order    = "desc",
  } = req.query;

  const filter = {};
  if (status)             filter.status = status;
  if (flagged === "true") filter["fraudCheck.isFlagged"] = true;
  if (customerId)         filter.customer = customerId;
  if (policyId)           filter.policy   = policyId;

  const skip      = (Number(page) - 1) * Number(limit);
  const sortOrder = order === "asc" ? 1 : -1;

  const [claims, total] = await Promise.all([
    Claim.find(filter)
      .populate("customer",  "firstName lastName email")
      .populate("adjuster",  "firstName lastName")
      .populate("policy",    "name category")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    Claim.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "All claims retrieved.", claims, {
    page:       Number(page),
    limit:      Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  });
});

/**
 * GET /api/claims/admin/stats
 * Admin — claims analytics
 */
export const getClaimStats = asyncHandler(async (req, res) => {
  const [statusBreakdown, fraudStats, monthlyVolume] = await Promise.all([
    // Status counts
    Claim.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$claimAmount" } } },
    ]),

    // Fraud overview
    Claim.aggregate([
      {
        $group: {
          _id:          null,
          totalClaims:  { $sum: 1 },
          flaggedCount: { $sum: { $cond: ["$fraudCheck.isFlagged", 1, 0] } },
          avgRiskScore: { $avg: "$fraudCheck.riskScore" },
        },
      },
    ]),

    // Monthly submission volume (last 6 months)
    Claim.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id:         { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count:       { $sum: 1 },
          totalAmount: { $sum: "$claimAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  return sendSuccess(res, 200, "Claim statistics retrieved.", {
    statusBreakdown,
    fraudStats:    fraudStats[0] || {},
    monthlyVolume,
  });
});
