import mongoose from "mongoose";

// ─── Sub-schemas ────────────────────────────────────────────

const coverageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Coverage name is required."],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    limit: {
      type: Number,
      required: [true, "Coverage limit is required."],
      min: [0, "Coverage limit cannot be negative."],
    },
  },
  { _id: false }
);

const addOnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    extraPremiumRate: {
      // percentage added on top of base premium e.g. 0.05 = 5%
      type: Number,
      required: true,
      min: [0, "Extra premium rate cannot be negative."],
      max: [1, "Extra premium rate cannot exceed 100%."],
    },
  },
  { _id: false }
);

// ─── Policy Schema ───────────────────────────────────────────

const policySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Policy name is required."],
      trim: true,
      unique: true,
      minlength: [3, "Policy name must be at least 3 characters."],
      maxlength: [120, "Policy name cannot exceed 120 characters."],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Policy category is required."],
      enum: {
        values: ["health", "auto", "home", "life", "travel", "business", "other"],
        message: "Category must be one of: health, auto, home, life, travel, business, other.",
      },
    },
    description: {
      type: String,
      required: [true, "Policy description is required."],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters."],
    },
    coverages: {
      type: [coverageSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "A policy must have at least one coverage item.",
      },
    },
    availableAddOns: {
      type: [addOnSchema],
      default: [],
    },

    // ─── Premium Calculation Base Rates ───────────────────
    basePremium: {
      // Flat minimum premium (USD/month)
      type: Number,
      required: [true, "Base premium is required."],
      min: [0, "Base premium cannot be negative."],
    },
    ageFactor: {
      // Multiplier applied per age bracket (configured in premium service)
      type: Number,
      default: 1.0,
      min: [0.1, "Age factor must be at least 0.1."],
    },
    riskFactor: {
      // Multiplier for high/medium/low risk profiles
      type: Number,
      default: 1.0,
      min: [0.1, "Risk factor must be at least 0.1."],
    },
    assetValueRate: {
      // Rate applied to asset value e.g. 0.002 = 0.2% of asset value added to premium
      type: Number,
      default: 0,
      min: [0, "Asset value rate cannot be negative."],
    },

    // ─── Policy Terms ─────────────────────────────────────
    durationMonths: {
      // How long one purchased instance of this policy lasts
      type: Number,
      required: [true, "Policy duration is required."],
      min: [1, "Duration must be at least 1 month."],
      max: [360, "Duration cannot exceed 360 months (30 years)."],
    },
    maxClaimAmount: {
      type: Number,
      required: [true, "Maximum claim amount is required."],
      min: [1, "Max claim amount must be positive."],
    },
    deductible: {
      // Amount the customer pays before insurance kicks in
      type: Number,
      default: 0,
      min: [0, "Deductible cannot be negative."],
    },
    waitingPeriodDays: {
      // Days after purchase before claims can be filed
      type: Number,
      default: 0,
      min: [0, "Waiting period cannot be negative."],
    },

    // ─── Eligibility ──────────────────────────────────────
    minAge: {
      type: Number,
      default: 18,
      min: [0, "Minimum age cannot be negative."],
    },
    maxAge: {
      type: Number,
      default: 99,
    },

    // ─── Meta ─────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ────────────────────────────────────────────────

policySchema.virtual("monthlyPremiumDisplay").get(function () {
  if (this.basePremium == null) return null;
  return `₹${this.basePremium.toFixed(2)}/month`;
});

policySchema.virtual("totalCoverageLimit").get(function () {
  if (!this.coverages) return 0;
  return this.coverages.reduce((sum, c) => sum + c.limit, 0);
});

// ─── Indexes ─────────────────────────────────────────────────

policySchema.index({ category: 1, isActive: 1 });
policySchema.index({ slug: 1 });
policySchema.index({ isFeatured: -1, createdAt: -1 });
policySchema.index({ name: "text", description: "text", tags: "text" });

// ─── Pre-save: Auto-generate slug ────────────────────────────

policySchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }
  next();
});

const Policy = mongoose.model("Policy", policySchema);
export default Policy;
