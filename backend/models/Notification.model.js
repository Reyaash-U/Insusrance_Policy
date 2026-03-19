import mongoose from "mongoose";

// ─── Notification Types ──────────────────────────────────────
// Each type maps to a distinct UI treatment on the frontend.

export const NOTIFICATION_TYPES = Object.freeze({
  // Claim lifecycle
  CLAIM_SUBMITTED:      "claim_submitted",
  CLAIM_UNDER_REVIEW:   "claim_under_review",
  CLAIM_APPROVED:       "claim_approved",
  CLAIM_REJECTED:       "claim_rejected",
  CLAIM_WITHDRAWN:      "claim_withdrawn",
  CLAIM_FLAGGED:        "claim_flagged",          // Fraud flag

  // Policy
  POLICY_PURCHASED:     "policy_purchased",
  POLICY_EXPIRING_SOON: "policy_expiring_soon",   // Scheduled reminder
  POLICY_EXPIRED:       "policy_expired",
  POLICY_CANCELLED:     "policy_cancelled",

  // Account
  ACCOUNT_VERIFIED:     "account_verified",
  PASSWORD_CHANGED:     "password_changed",
  ROLE_CHANGED:         "role_changed",

  // Admin / Agent
  NEW_CLAIM_ASSIGNED:   "new_claim_assigned",
  USER_REGISTERED:      "user_registered",        // Admin alert
  FRAUD_ALERT:          "fraud_alert",            // Admin / adjuster alert
});

// ─── Notification Schema ─────────────────────────────────────

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification recipient is required."],
    },

    // Optionally track who/what triggered the notification
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      required: [true, "Notification type is required."],
      enum: {
        values: Object.values(NOTIFICATION_TYPES),
        message: "Invalid notification type.",
      },
    },

    title: {
      type: String,
      required: [true, "Notification title is required."],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters."],
    },

    message: {
      type: String,
      required: [true, "Notification message is required."],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters."],
    },

    // ─── Read State ───────────────────────────────────────
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },

    // ─── Deep Link ────────────────────────────────────────
    // Frontend uses this to navigate the user to the relevant resource.
    link: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Polymorphic Resource Reference ───────────────────
    // Allows the notification to point at any model (Claim, Policy, etc.)
    resource: {
      resourceType: {
        type: String,
        enum: ["Claim", "Policy", "PurchasedPolicy", "User", null],
        default: null,
      },
      resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    // ─── Delivery Channels ────────────────────────────────
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      emailSentAt: {
        type: Date,
        default: null,
      },
    },

    // ─── Priority ─────────────────────────────────────────
    priority: {
      type: String,
      enum: {
        values: ["low", "normal", "high", "urgent"],
        message: "Priority must be one of: low, normal, high, urgent.",
      },
      default: "normal",
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

// ─── Indexes ─────────────────────────────────────────────────

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });
// TTL index — auto-delete read notifications after 90 days
notificationSchema.index(
  { readAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, partialFilterExpression: { isRead: true } }
);

// ─── Query Middleware ─────────────────────────────────────────

notificationSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// ─── Static Methods ───────────────────────────────────────────

/**
 * Creates and saves a notification document.
 * Called by socket.service.js or controllers.
 *
 * @param {object} opts
 * @param {string}   opts.recipientId
 * @param {string}   opts.type         - NOTIFICATION_TYPES value
 * @param {string}   opts.title
 * @param {string}   opts.message
 * @param {string}   [opts.link]
 * @param {string}   [opts.priority]   - "low" | "normal" | "high" | "urgent"
 * @param {string}   [opts.senderId]
 * @param {object}   [opts.resource]   - { resourceType, resourceId }
 * @param {object}   [opts.channels]   - { inApp, email }
 * @returns {Promise<Document>}
 */
notificationSchema.statics.createNotification = async function (opts) {
  const {
    recipientId,
    senderId = null,
    type,
    title,
    message,
    link = null,
    priority = "normal",
    resource = { resourceType: null, resourceId: null },
    channels = { inApp: true, email: false },
  } = opts;

  return this.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    link,
    priority,
    resource,
    channels,
  });
};

/**
 * Marks one notification as read.
 * @param {string} notificationId
 * @param {string} userId - Must match recipient to prevent cross-user access.
 */
notificationSchema.statics.markAsRead = async function (notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

/**
 * Marks all unread notifications for a user as read.
 * @param {string} userId
 */
notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

/**
 * Returns the unread count for a user (lightweight — no full doc fetch).
 * @param {string} userId
 * @returns {Promise<number>}
 */
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
