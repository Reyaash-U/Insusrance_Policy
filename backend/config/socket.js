import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/generateToken.js";
import logger from "../utils/logger.js";

let io;

// ─── Socket Event Constants ───────────────────────────────────
// Single source of truth — import this in both server and client.

export const SOCKET_EVENTS = Object.freeze({
  // Connection lifecycle
  CONNECT:              "connect",
  DISCONNECT:           "disconnect",
  ERROR:                "error",

  // Room management (client → server)
  JOIN_USER_ROOM:       "join:user",
  JOIN_ROLE_ROOM:       "join:role",
  LEAVE_ROOM:           "leave:room",

  // Notifications (server → client)
  NOTIFICATION_NEW:         "notification:new",
  NOTIFICATION_UNREAD_COUNT: "notification:unread_count",

  // Claim events (server → client)
  CLAIM_NEW:            "claim:new",           // Broadcast to adjusters
  CLAIM_STATUS_UPDATE:  "claim:status_update", // Sent to claim owner
  CLAIM_ASSIGNED:       "claim:assigned",      // Sent to adjuster

  // Fraud events (server → client)
  FRAUD_FLAGGED:        "fraud:flagged",       // Broadcast to admin/adjuster
  FRAUD_RESOLVED:       "fraud:resolved",      // Broadcast to admin

  // Policy events (server → client)
  POLICY_PURCHASED:     "policy:purchased",

  // Admin broadcast (server → role room)
  ADMIN_ALERT:          "admin:alert",

  // Ping / health (client → server)
  PING:                 "ping",
  PONG:                 "pong",
});

// ─── Socket Auth Middleware ───────────────────────────────────

/**
 * Verifies the JWT on each socket connection.
 * Token may be supplied via:
 *   1. socket.handshake.auth.token   (preferred)
 *   2. socket.handshake.headers.authorization  ("Bearer <token>")
 *
 * Attaches decoded payload to socket.user = { userId, role }.
 * Rejects the connection if the token is missing or invalid.
 */
const socketAuthMiddleware = (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    if (!token) {
      const authHeader = socket.handshake.headers?.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return next(new Error("AUTH_MISSING: No token provided."));
    }

    const decoded = verifyAccessToken(token);
    socket.user   = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new Error("AUTH_EXPIRED: Token has expired."));
    }
    return next(new Error("AUTH_INVALID: Invalid token."));
  }
};

// ─── Socket Event Handlers ────────────────────────────────────

const registerSocketHandlers = (socket) => {
  const { userId, role } = socket.user;

  // Auto-join the user's personal room on connect
  socket.join(`user:${userId}`);
  logger.info(`Socket [${socket.id}] connected — user:${userId} role:${role}`);

  // ── Room management ──────────────────────────────────────
  socket.on(SOCKET_EVENTS.JOIN_ROLE_ROOM, (requestedRole) => {
    // Only allow joining your own role room
    if (requestedRole === role) {
      socket.join(`role:${requestedRole}`);
      logger.info(`Socket [${socket.id}] joined role:${requestedRole}`);
    } else {
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: `Cannot join role room '${requestedRole}' — your role is '${role}'.`,
      });
    }
  });

  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (room) => {
    socket.leave(room);
    logger.info(`Socket [${socket.id}] left room: ${room}`);
  });

  // ── Ping / health ────────────────────────────────────────
  socket.on(SOCKET_EVENTS.PING, () => {
    socket.emit(SOCKET_EVENTS.PONG, { timestamp: Date.now() });
  });

  // ── Disconnect ───────────────────────────────────────────
  socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
    logger.info(`Socket [${socket.id}] disconnected — user:${userId} — reason: ${reason}`);
  });

  // ── Error ────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.ERROR, (err) => {
    logger.error(`Socket error [${socket.id}]: ${err?.message || err}`);
  });
};

// ─── Init ─────────────────────────────────────────────────────

/**
 * Initialises Socket.io, wires auth middleware, and registers handlers.
 * Must be called once in server.js after the HTTP server is created.
 *
 * @param {http.Server} httpServer
 * @returns {Server} Configured Socket.io instance
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",").map((o) => o.trim()),
      methods:     ["GET", "POST"],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
    // Limit payload size to prevent abuse
    maxHttpBufferSize: 1e6, // 1 MB
  });

  // Attach JWT auth middleware to every socket
  io.use(socketAuthMiddleware);

  io.on("connection", registerSocketHandlers);

  logger.info("Socket.io initialised.");
  return io;
};

/**
 * Returns the active Socket.io instance.
 * Throws if called before initSocket().
 */
export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialised. Call initSocket() first.");
  return io;
};

/**
 * Returns the count of currently connected sockets in a room.
 * @param {string} room
 * @returns {Promise<number>}
 */
export const getRoomSize = async (room) => {
  if (!io) return 0;
  const sockets = await io.in(room).allSockets();
  return sockets.size;
};
