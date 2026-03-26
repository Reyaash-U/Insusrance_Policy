import Policy from "../models/Policy.model.js";
import PurchasedPolicy from "../models/PurchasedPolicy.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { uploadPolicyThumbnail } from "../services/upload.service.js";
import { notify } from "../services/socket.service.js";
import { NOTIFICATION_TYPES } from "../models/Notification.model.js";

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Build the premium calculation for a purchase request.
 * Formula: ((basePremium * ageFactor * riskFactor) + (assetValue * assetValueRate) + addOnsTotal)
 */
const calculatePremium = (policy, { customerAge, riskLevel, assetValue, selectedAddOns = [] }) => {
  // Age bracket multipliers
  const ageBrackets = [
    { max: 25, multiplier: 1.2 },
    { max: 35, multiplier: 1.0 },
    { max: 45, multiplier: 1.1 },
    { max: 55, multiplier: 1.25 },
    { max: 65, multiplier: 1.45 },
    { max: Infinity, multiplier: 1.7 },
  ];
  const bracket = ageBrackets.find((b) => customerAge <= b.max);
  const ageMult = bracket ? bracket.multiplier : 1.0;

  const riskMultipliers = { low: 0.9, medium: 1.0, high: 1.4 };
  const riskMult = riskMultipliers[riskLevel] || 1.0;

  const basePart      = policy.basePremium * ageMult * riskMult * (policy.ageFactor || 1);
  const assetPart     = assetValue * (policy.assetValueRate || 0);

  // Resolve selected add-on names against the policy's availableAddOns
  const resolvedAddOns = [];
  let addOnsTotal = 0;

  for (const selectedName of selectedAddOns) {
    const addOn = policy.availableAddOns.find(
      (a) => a.name.toLowerCase() === selectedName.toLowerCase()
    );
    if (addOn) {
      const contribution = policy.basePremium * addOn.extraPremiumRate;
      addOnsTotal += contribution;
      resolvedAddOns.push({
        name:               addOn.name,
        extraPremiumRate:   addOn.extraPremiumRate,
        premiumContribution: parseFloat(contribution.toFixed(2)),
      });
    }
  }

  const monthlyPremium = parseFloat((basePart + assetPart + addOnsTotal).toFixed(2));
  const totalPremium   = parseFloat((monthlyPremium * policy.durationMonths).toFixed(2));

  return {
    premiumDetails: {
      basePremium:              policy.basePremium,
      ageFactor:                ageMult,
      riskFactor:               riskMult,
      assetValueRate:           policy.assetValueRate || 0,
      addOnsTotal:              parseFloat(addOnsTotal.toFixed(2)),
      calculatedMonthlyPremium: monthlyPremium,
      totalPremiumPaid:         totalPremium,
    },
    resolvedAddOns,
  };
};

// ─── Public Controllers ───────────────────────────────────────

/**
 * GET /api/policies
 * Public — browse all active policies with filtering, sorting, pagination
 */
export const getAllPolicies = asyncHandler(async (req, res) => {
  const {
    page     = 1,
    limit    = 12,
    category,
    search,
    sortBy   = "createdAt",
    order    = "desc",
    featured,
  } = req.query;

  const filter = { isActive: true };
  if (category)          filter.category = category;
  if (featured === "true") filter.isFeatured = true;
  if (search) {
    filter.$text = { $search: search };
  }

  const skip      = (Number(page) - 1) * Number(limit);
  const sortOrder = order === "asc" ? 1 : -1;
  const sortField = sortBy === "price" ? "basePremium" : sortBy;

  const [policies, total] = await Promise.all([
    Policy.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .select("-createdBy -__v"),
    Policy.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "Policies retrieved.", policies, {
    page:       Number(page),
    limit:      Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  });
});

/**
 * GET /api/policies/:id
 * Public
 */
export const getPolicyById = asyncHandler(async (req, res) => {
  const policy = await Policy.findOne({ _id: req.params.id, isActive: true }).populate(
    "createdBy",
    "firstName lastName"
  );
  if (!policy) return sendError(res, 404, "Policy not found.");
  return sendSuccess(res, 200, "Policy retrieved.", policy);
});

/**
 * GET /api/policies/slug/:slug
 * Public
 */
export const getPolicyBySlug = asyncHandler(async (req, res) => {
  const policy = await Policy.findOne({ slug: req.params.slug, isActive: true });
  if (!policy) return sendError(res, 404, "Policy not found.");
  return sendSuccess(res, 200, "Policy retrieved.", policy);
});

// ─── Premium Calculator ───────────────────────────────────────

/**
 * POST /api/policies/calculate-premium
 * Protected — Customer
 */
export const calculatePremiumPreview = asyncHandler(async (req, res) => {
  const { policyId, customerAge, riskLevel, assetValue, selectedAddOns } = req.body;

  const policy = await Policy.findOne({ _id: policyId, isActive: true });
  if (!policy) return sendError(res, 404, "Policy not found.");

  // Age eligibility check
  if (customerAge < policy.minAge || customerAge > policy.maxAge) {
    return sendError(
      res,
      400,
      `This policy is available for customers aged ${policy.minAge}–${policy.maxAge}.`
    );
  }

  const { premiumDetails, resolvedAddOns } = calculatePremium(policy, {
    customerAge,
    riskLevel,
    assetValue,
    selectedAddOns,
  });

  return sendSuccess(res, 200, "Premium calculated.", {
    policy: { _id: policy._id, name: policy.name, category: policy.category, durationMonths: policy.durationMonths },
    premiumDetails,
    resolvedAddOns,
  });
});

// ─── Purchase Policy ─────────────────────────────────────────

/**
 * POST /api/policies/purchase
 * Protected — Customer
 */
export const purchasePolicy = asyncHandler(async (req, res) => {
  const {
    policyId,
    customerAge,
    riskLevel,
    assetValue,
    selectedAddOns = [],
    startDate,
    paymentReference,
  } = req.body;

  const customerId = req.user._id;

  const policy = await Policy.findOne({ _id: policyId, isActive: true });
  if (!policy) return sendError(res, 404, "Policy not found or no longer available.");

  if (customerAge < policy.minAge || customerAge > policy.maxAge) {
    return sendError(
      res,
      400,
      `You must be between ${policy.minAge} and ${policy.maxAge} years old to purchase this policy.`
    );
  }

  // Prevent duplicate active purchase of the same policy
  const existing = await PurchasedPolicy.findOne({
    customer: customerId,
    policy:   policyId,
    status:   "active",
  });
  if (existing) {
    return sendError(res, 409, "You already have an active policy of this type.");
  }

  const { premiumDetails, resolvedAddOns } = calculatePremium(policy, {
    customerAge,
    riskLevel,
    assetValue,
    selectedAddOns,
  });

  const start            = new Date(startDate);
  const end              = new Date(start);
  end.setMonth(end.getMonth() + policy.durationMonths);

  const waitingMs        = (policy.waitingPeriodDays || 0) * 24 * 60 * 60 * 1000;
  const claimsAllowedFrom = new Date(start.getTime() + waitingMs);

  const purchased = await PurchasedPolicy.create({
    policy:          policy._id,
    customer:        customerId,
    policySnapshot: {
      name:              policy.name,
      category:          policy.category,
      maxClaimAmount:    policy.maxClaimAmount,
      deductible:        policy.deductible        ?? 0,
      waitingPeriodDays: policy.waitingPeriodDays ?? 0,
      durationMonths:    policy.durationMonths,
    },
    customerAge,
    riskLevel,
    assetValue,
    selectedAddOns:          resolvedAddOns,
    premiumDetails,
    startDate:               start,
    endDate:                 end,
    claimsAllowedFrom,
    remainingCoverageAmount: policy.maxClaimAmount,
    paymentReference:        paymentReference || null,
  });

  // Real-time notification
  await notify({
    recipientId: customerId.toString(),
    type:        NOTIFICATION_TYPES.POLICY_PURCHASED,
    title:       "Policy Purchased Successfully",
    message:     `Your ${policy.name} policy is now active from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}.`,
    link:        `/my-policies/${purchased._id}`,
    priority:    "normal",
    resource:    { resourceType: "PurchasedPolicy", resourceId: purchased._id },
  });

  return sendSuccess(res, 201, "Policy purchased successfully.", purchased);
});

// ─── Customer's Own Policies ──────────────────────────────────

/**
 * GET /api/policies/my-policies
 * Protected — Customer
 */
export const getMyPolicies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const filter = { customer: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [policies, total] = await Promise.all([
    PurchasedPolicy.find(filter)
      .populate("policy", "name category thumbnailUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PurchasedPolicy.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "Your policies retrieved.", policies, {
    page:       Number(page),
    limit:      Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  });
});

/**
 * GET /api/policies/my-policies/:purchasedPolicyId
 * Protected — Customer (owner) or Admin
 */
export const getMyPolicyById = asyncHandler(async (req, res) => {
  const { purchasedPolicyId } = req.params;

  const filter = { _id: purchasedPolicyId };
  // Non-admins can only see their own
  if (req.user.role !== "admin") filter.customer = req.user._id;

  const purchased = await PurchasedPolicy.findOne(filter).populate(
    "policy",
    "name category description coverages availableAddOns"
  );

  if (!purchased) return sendError(res, 404, "Purchased policy not found.");
  return sendSuccess(res, 200, "Purchased policy retrieved.", purchased);
});

// ─── Admin Controllers ────────────────────────────────────────

/**
 * POST /api/policies
 * Admin only
 */
export const createPolicy = asyncHandler(async (req, res) => {
  const policyData = { ...req.body, createdBy: req.user._id };

  // Handle thumbnail upload if file provided
  if (req.file) {
    const { url } = await uploadPolicyThumbnail(req.file.buffer, req.file.mimetype);
    policyData.thumbnailUrl = url;
  }

  const policy = await Policy.create(policyData);
  return sendSuccess(res, 201, "Policy created successfully.", policy);
});

/**
 * PUT /api/policies/:id
 * Admin only
 */
export const updatePolicy = asyncHandler(async (req, res) => {
  const policy = await Policy.findById(req.params.id);
  if (!policy) return sendError(res, 404, "Policy not found.");

  if (req.file) {
    const { url } = await uploadPolicyThumbnail(req.file.buffer, req.file.mimetype, req.params.id);
    req.body.thumbnailUrl = url;
  }

  Object.assign(policy, req.body);
  await policy.save();

  return sendSuccess(res, 200, "Policy updated successfully.", policy);
});

/**
 * DELETE /api/policies/:id
 * Admin only — soft delete (set isActive = false)
 */
export const deletePolicy = asyncHandler(async (req, res) => {
  const policy = await Policy.findById(req.params.id);
  if (!policy) return sendError(res, 404, "Policy not found.");

  // Check if any active purchased policies depend on this
  const activeCount = await PurchasedPolicy.countDocuments({
    policy: policy._id,
    status: "active",
  });

  if (activeCount > 0) {
    return sendError(
      res,
      409,
      `Cannot delete policy — ${activeCount} customer(s) have active subscriptions. Deactivate the policy instead.`
    );
  }

  policy.isActive = false;
  await policy.save();

  return sendSuccess(res, 200, "Policy deactivated successfully.");
});

/**
 * GET /api/policies/admin/all
 * Admin only — all policies including inactive
 */
export const adminGetAllPolicies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, isActive } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (isActive !== undefined && isActive !== "") filter.isActive = isActive === "true";

  const skip = (Number(page) - 1) * Number(limit);

  const [policies, total] = await Promise.all([
    Policy.find(filter)
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Policy.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "All policies retrieved.", policies, {
    page:       Number(page),
    limit:      Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  });
});

/**
 * GET /api/policies/admin/purchased
 * Admin — all purchased policies across all customers
 */
export const adminGetPurchasedPolicies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, customerId } = req.query;

  const filter = {};
  if (status)     filter.status = status;
  if (customerId) filter.customer = customerId;

  const skip = (Number(page) - 1) * Number(limit);

  const [policies, total] = await Promise.all([
    PurchasedPolicy.find(filter)
      .populate("customer", "firstName lastName email")
      .populate("policy",   "name category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PurchasedPolicy.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "Purchased policies retrieved.", policies, {
    page:       Number(page),
    limit:      Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  });
});
