import mongoose from "mongoose";

// ─── Sub-schemas ────────────────────────────────────────────

const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    fileId: {
      // GridFS ObjectId — used for deletion and serving
      type: mongoose.Schema.Types.ObjectId,
    },
    resourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      required: true,
    },
    originalName: {
      type: String,
      trim: true,
      default: "",
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const fraudCheckSchema = new mongoose.Schema(
  {
    riskScore: {
      // 0–100; higher = more suspicious
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    flags: {
      // Array of triggered rule names
      type: [String],
      default: [],
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    checkedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNote: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

// ─── Claim Schema ────────────────────────────────────────────

const claimSchema = new mongoose.Schema(
  {
    claimNumber: {
      // Human-readable reference e.g. CLM-2026-000042
      type: String,
      unique: true,
      trim: true,
    },
    purchasedPolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchasedPolicy",
      required: [true, "Purchased policy reference is required."],
    },
    policy: {
      // Denormalized for fast queries — the base policy this claim is against
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      required: [true, "Policy reference is required."],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer reference is required."],
    },
    adjuster: {
      // Assigned claims adjuster
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─── Incident Details ─────────────────────────────────
    title: {
      type: String,
      required: [true, "Claim title is required."],
      trim: true,
      minlength: [5, "Title must be at least 5 characters."],
      maxlength: [150, "Title cannot exceed 150 characters."],
    },
    description: {
      type: String,
      required: [true, "Claim description is required."],
      trim: true,
      minlength: [20, "Description must be at least 20 characters."],
      maxlength: [5000, "Description cannot exceed 5000 characters."],
    },
    incidentDate: {
      type: Date,
      required: [true, "Incident date is required."],
    },
    incidentLocation: {
      address: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "" },
      coordinates: {
        // [longitude, latitude] — GeoJSON
        type: [Number],
        default: undefined,
      },
    },

    // ─── Financials ───────────────────────────────────────
    claimAmount: {
      type: Number,
      required: [true, "Claim amount is required."],
      min: [1, "Claim amount must be at least $1."],
    },
    approvedAmount: {
      // Set by adjuster on approval
      type: Number,
      default: null,
    },
    deductibleApplied: {
      type: Number,
      default: 0,
    },
    finalPayoutAmount: {
      // approvedAmount - deductibleApplied
      type: Number,
      default: null,
    },

    // ─── Status Lifecycle ─────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ["submitted", "under_review", "approved", "rejected", "withdrawn"],
        message:
          "Status must be one of: submitted, under_review, approved, rejected, withdrawn.",
      },
      default: "submitted",
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    // ─── Adjuster Decision ────────────────────────────────
    adjusterNote: {
      type: String,
      trim: true,
      default: "",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },

    // ─── Attachments ──────────────────────────────────────
    attachments: {
      type: [attachmentSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "A claim cannot have more than 10 attachments.",
      },
    },

    // ─── Fraud Detection ──────────────────────────────────
    fraudCheck: {
      type: fraudCheckSchema,
      default: () => ({}),
    },

    // ─── Soft delete ──────────────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ────────────────────────────────────────────────

claimSchema.virtual("isResolved").get(function () {
  return ["approved", "rejected", "withdrawn"].includes(this.status);
});

claimSchema.virtual("daysSinceSubmission").get(function () {
  const diff = Date.now() - this.createdAt.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// ─── Indexes ─────────────────────────────────────────────────

claimSchema.index({ customer: 1, status: 1 });
claimSchema.index({ purchasedPolicy: 1 });
claimSchema.index({ adjuster: 1, status: 1 });
claimSchema.index({ claimNumber: 1 });
claimSchema.index({ createdAt: -1 });
claimSchema.index({ "fraudCheck.isFlagged": 1 });
claimSchema.index({ incidentDate: -1 });

// ─── Pre-save: Generate claimNumber & initial statusHistory ──

claimSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Generate sequential claim number: CLM-YYYY-XXXXXX
    const year = new Date().getFullYear();
    const count = await mongoose.model("Claim").countDocuments();
    this.claimNumber = `CLM-${year}-${String(count + 1).padStart(6, "0")}`;

    // Seed status history with initial submission entry
    this.statusHistory.push({
      status: "submitted",
      changedBy: this.customer,
      note: "Claim submitted by customer.",
      timestamp: new Date(),
    });
  }
  next();
});

// ─── Query Middleware: Exclude soft-deleted docs by default ──

claimSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const Claim = mongoose.model("Claim", claimSchema);
export default Claim;
