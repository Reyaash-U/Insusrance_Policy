import mongoose from "mongoose";

// ─── Fraud Rules Registry ────────────────────────────────────
// Each rule name here maps to a check in fraud.service.js

export const FRAUD_RULES = Object.freeze({
  MULTIPLE_CLAIMS_SHORT_WINDOW : "multiple_claims_short_window",   // >2 claims in 30 days
  EXPIRED_POLICY               : "expired_policy",                 // claim after policy end
  WAITING_PERIOD_VIOLATION     : "waiting_period_violation",       // claim before waiting period ends
  HIGH_CLAIM_AMOUNT            : "high_claim_amount",              // claim > 80% of max coverage
  CLAIM_EXCEEDS_COVERAGE       : "claim_exceeds_coverage",         // claim > remaining coverage
  DUPLICATE_INCIDENT_DATE      : "duplicate_incident_date",        // same incident date submitted before
  RAPID_SEQUENTIAL_CLAIMS      : "rapid_sequential_claims",        // new claim while another is under review
});

// ─── FraudLog Schema ─────────────────────────────────────────

const fraudLogSchema = new mongoose.Schema(
  {
    claim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: [true, "Claim reference is required."],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer reference is required."],
    },
    purchasedPolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchasedPolicy",
      required: true,
    },

    // ─── Detection Results ────────────────────────────────
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    triggeredRules: {
      type: [String],
      enum: {
        values: Object.values(FRAUD_RULES),
        message: "Invalid fraud rule.",
      },
      default: [],
    },
    ruleDetails: [
      {
        rule: { type: String, required: true },
        description: { type: String, required: true },
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          required: true,
        },
        scoreContribution: { type: Number, required: true },
        _id: false,
      },
    ],
    isFlagged: {
      type: Boolean,
      required: true,
    },

    // ─── Resolution ───────────────────────────────────────
    resolution: {
      type: String,
      enum: {
        values: ["pending", "cleared", "confirmed_fraud", "escalated"],
        message: "Resolution must be one of: pending, cleared, confirmed_fraud, escalated.",
      },
      default: "pending",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────

fraudLogSchema.index({ claim: 1 }, { unique: true }); // One log per claim
fraudLogSchema.index({ customer: 1 });
fraudLogSchema.index({ isFlagged: 1, resolution: 1 });
fraudLogSchema.index({ riskScore: -1 });
fraudLogSchema.index({ createdAt: -1 });

const FraudLog = mongoose.model("FraudLog", fraudLogSchema);
export default FraudLog;
