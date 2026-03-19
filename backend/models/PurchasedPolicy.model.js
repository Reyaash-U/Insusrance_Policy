import mongoose from "mongoose";

// ─── Sub-schemas ────────────────────────────────────────────

const selectedAddOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    extraPremiumRate: { type: Number, required: true },
    premiumContribution: { type: Number, required: true }, // USD added to monthly premium
  },
  { _id: false }
);

const premiumSnapshotSchema = new mongoose.Schema(
  {
    basePremium: { type: Number, required: true },
    ageFactor: { type: Number, required: true },
    riskFactor: { type: Number, required: true },
    assetValueRate: { type: Number, required: true },
    addOnsTotal: { type: Number, default: 0 },
    calculatedMonthlyPremium: { type: Number, required: true },
    totalPremiumPaid: { type: Number, required: true }, // monthly × duration
  },
  { _id: false }
);

// ─── PurchasedPolicy Schema ──────────────────────────────────

const purchasedPolicySchema = new mongoose.Schema(
  {
    policy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      required: [true, "Policy reference is required."],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer reference is required."],
    },
    agent: {
      // The agent who facilitated the purchase (optional)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─── Policy Snapshot ──────────────────────────────────
    // Store a snapshot of the policy name/category at purchase time
    // so that historical records remain accurate if the policy changes.
    policySnapshot: {
      name: { type: String, required: true },
      category: { type: String, required: true },
      maxClaimAmount: { type: Number, required: true },
      deductible: { type: Number, required: true },
      waitingPeriodDays: { type: Number, required: true },
      durationMonths: { type: Number, required: true },
    },

    // ─── Customer Inputs at Purchase Time ────────────────
    customerAge: {
      type: Number,
      required: [true, "Customer age is required."],
      min: [0, "Age cannot be negative."],
      max: [120, "Age cannot exceed 120."],
    },
    riskLevel: {
      type: String,
      required: [true, "Risk level is required."],
      enum: {
        values: ["low", "medium", "high"],
        message: "Risk level must be low, medium, or high.",
      },
    },
    assetValue: {
      type: Number,
      required: [true, "Asset value is required."],
      min: [0, "Asset value cannot be negative."],
    },
    selectedAddOns: {
      type: [selectedAddOnSchema],
      default: [],
    },

    // ─── Premium ──────────────────────────────────────────
    premiumDetails: {
      type: premiumSnapshotSchema,
      required: true,
    },

    // ─── Policy Dates ─────────────────────────────────────
    startDate: {
      type: Date,
      required: [true, "Start date is required."],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required."],
    },
    claimsAllowedFrom: {
      // startDate + waitingPeriodDays
      type: Date,
      required: true,
    },

    // ─── Status ───────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ["active", "expired", "cancelled", "suspended"],
        message: "Status must be one of: active, expired, cancelled, suspended.",
      },
      default: "active",
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─── Claims Tracking ──────────────────────────────────
    totalClaimsCount: {
      type: Number,
      default: 0,
    },
    totalClaimedAmount: {
      type: Number,
      default: 0,
    },
    remainingCoverageAmount: {
      type: Number,
      required: true,
    },

    // ─── Payment Reference ────────────────────────────────
    paymentReference: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ────────────────────────────────────────────────

purchasedPolicySchema.virtual("isExpired").get(function () {
  return this.endDate < new Date();
});

purchasedPolicySchema.virtual("isWithinWaitingPeriod").get(function () {
  return new Date() < this.claimsAllowedFrom;
});

purchasedPolicySchema.virtual("daysRemaining").get(function () {
  const diff = this.endDate - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

purchasedPolicySchema.virtual("utilizationPercent").get(function () {
  const max = this.policySnapshot.maxClaimAmount;
  if (!max) return 0;
  return Math.min(100, ((this.totalClaimedAmount / max) * 100).toFixed(1));
});

// ─── Indexes ─────────────────────────────────────────────────

purchasedPolicySchema.index({ customer: 1, status: 1 });
purchasedPolicySchema.index({ policy: 1 });
purchasedPolicySchema.index({ endDate: 1 });
purchasedPolicySchema.index({ agent: 1 });
purchasedPolicySchema.index({ createdAt: -1 });

// ─── Pre-save: Auto-set claimsAllowedFrom & remainingCoverage ─

purchasedPolicySchema.pre("save", function (next) {
  if (this.isNew) {
    const waitingMs =
      (this.policySnapshot.waitingPeriodDays || 0) * 24 * 60 * 60 * 1000;
    this.claimsAllowedFrom = new Date(this.startDate.getTime() + waitingMs);
    this.remainingCoverageAmount = this.policySnapshot.maxClaimAmount;
  }
  next();
});

const PurchasedPolicy = mongoose.model("PurchasedPolicy", purchasedPolicySchema);
export default PurchasedPolicy;
