import { getIO, SOCKET_EVENTS } from "../config/socket.js";
import Notification from "../models/Notification.model.js";
import logger from "../utils/logger.js";

// ─── Notification + Real-Time Emit ───────────────────────────

/**
 * Creates a Notification document and emits it in real-time to the
 * recipient's personal Socket.io room.
 *
 * This is the primary function that ALL controllers should call when
 * they need to alert a user. It handles both persistence and delivery.
 *
 * @param {object}  opts
 * @param {string}  opts.recipientId
 * @param {string}  opts.type          - NOTIFICATION_TYPES value
 * @param {string}  opts.title
 * @param {string}  opts.message
 * @param {string}  [opts.link]        - Frontend route to navigate to
 * @param {string}  [opts.priority]    - "low"|"normal"|"high"|"urgent"
 * @param {string}  [opts.senderId]
 * @param {object}  [opts.resource]    - { resourceType, resourceId }
 * @param {object}  [opts.channels]    - { inApp, email }
 * @returns {Promise<Document|null>}   - Notification document, or null on failure
 */
export const notify = async (opts) => {
  try {
    // 1. Persist to database
    const notification = await Notification.createNotification(opts);

    // 2. Get current unread count for badge update
    const unreadCount = await Notification.getUnreadCount(opts.recipientId);

    // 3. Emit real-time events to recipient's room
    const io = getIO();
    const room = `user:${opts.recipientId}`;

    io.to(room).emit(SOCKET_EVENTS.NOTIFICATION_NEW, {
      _id:       notification._id,
      type:      notification.type,
      title:     notification.title,
      message:   notification.message,
      link:      notification.link       ?? null,
      priority:  notification.priority,
      resource:  notification.resource   ?? null,
      isRead:    false,
      createdAt: notification.createdAt,
    });

    io.to(room).emit(SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT, unreadCount);

    logger.info(
      `[notify] → user:${opts.recipientId} | type:${opts.type} | title:"${opts.title}"`
    );

    return notification;
  } catch (error) {
    // Notification failure MUST NOT propagate to the caller.
    // Business operations (claim submit, etc.) should never fail because of this.
    logger.error(`[notify] failed for user ${opts.recipientId}: ${error.message}`);
    return null;
  }
};

// ─── Bulk Notify ──────────────────────────────────────────────

/**
 * Sends the same notification to multiple recipients.
 * Useful for admin broadcasts (e.g. system maintenance alert).
 *
 * @param {string[]} recipientIds
 * @param {object}   baseOpts - opts without recipientId
 * @returns {Promise<void>}
 */
export const notifyMany = async (recipientIds, baseOpts) => {
  await Promise.allSettled(
    recipientIds.map((id) => notify({ ...baseOpts, recipientId: id }))
  );
};

// ─── Role Room Emitters ───────────────────────────────────────

/**
 * Emits a Socket.io event to all connected users in a role room.
 * Does NOT create a Notification document — use for transient UI events.
 *
 * @param {string} role     - "admin" | "adjuster" | "agent" | "customer"
 * @param {string} event    - SOCKET_EVENTS value
 * @param {object} payload
 */
export const emitToRole = (role, event, payload) => {
  try {
    getIO().to(`role:${role}`).emit(event, payload);
    logger.info(`[emitToRole] role:${role} | event:${event}`);
  } catch (error) {
    logger.error(`[emitToRole] failed — role:${role} event:${event}: ${error.message}`);
  }
};

/**
 * Emits a Socket.io event to a specific user's personal room.
 * Does NOT create a Notification document.
 *
 * @param {string} userId
 * @param {string} event
 * @param {object} payload
 */
export const emitToUser = (userId, event, payload) => {
  try {
    getIO().to(`user:${userId}`).emit(event, payload);
    logger.info(`[emitToUser] user:${userId} | event:${event}`);
  } catch (error) {
    logger.error(`[emitToUser] failed — user:${userId} event:${event}: ${error.message}`);
  }
};

/**
 * Broadcasts a Socket.io event to ALL connected clients.
 * Admin use only (e.g. system announcements).
 *
 * @param {string} event
 * @param {object} payload
 */
export const broadcast = (event, payload) => {
  try {
    getIO().emit(event, payload);
    logger.info(`[broadcast] event:${event}`);
  } catch (error) {
    logger.error(`[broadcast] failed — event:${event}: ${error.message}`);
  }
};

// ─── Claim-Specific Helpers ───────────────────────────────────

/**
 * Emits a real-time claim status update to the claim owner
 * and a broadcast to all adjusters/admins.
 *
 * @param {object} claim   - Claim document
 * @param {string} newStatus
 */
export const emitClaimStatusUpdate = (claim, newStatus) => {
  const customerId = claim.customer.toString();

  // Notify claim owner
  emitToUser(customerId, SOCKET_EVENTS.CLAIM_STATUS_UPDATE, {
    claimId:     claim._id,
    claimNumber: claim.claimNumber,
    status:      newStatus,
    updatedAt:   new Date(),
  });

  // Keep adjuster/admin dashboards in sync
  emitToRole("adjuster", SOCKET_EVENTS.CLAIM_STATUS_UPDATE, {
    claimId:     claim._id,
    claimNumber: claim.claimNumber,
    status:      newStatus,
  });
};

/**
 * Emits a new-claim alert to all connected adjusters and admins.
 *
 * @param {object} claim   - Newly created Claim document
 * @param {object} customer - User who submitted
 */
export const emitNewClaimAlert = (claim, customer) => {
  const payload = {
    claimId:     claim._id,
    claimNumber: claim.claimNumber,
    customerName: `${customer.firstName} ${customer.lastName}`,
    amount:      claim.claimAmount,
    isFlagged:   claim.fraudCheck?.isFlagged ?? false,
    riskScore:   claim.fraudCheck?.riskScore ?? 0,
    submittedAt: claim.createdAt,
  };

  emitToRole("adjuster", SOCKET_EVENTS.CLAIM_NEW, payload);
  emitToRole("admin",    SOCKET_EVENTS.CLAIM_NEW, payload);
};

/**
 * Emits a fraud flag alert to admins and adjusters.
 *
 * @param {object} claim
 */
export const emitFraudAlert = (claim) => {
  const payload = {
    claimId:     claim._id,
    claimNumber: claim.claimNumber,
    riskScore:   claim.fraudCheck?.riskScore,
    flags:       claim.fraudCheck?.flags,
    flaggedAt:   new Date(),
  };

  emitToRole("admin",    SOCKET_EVENTS.FRAUD_FLAGGED, payload);
  emitToRole("adjuster", SOCKET_EVENTS.FRAUD_FLAGGED, payload);
};
