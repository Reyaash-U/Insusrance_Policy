import { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "../store/authSlice.js";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Mirror of backend SOCKET_EVENTS
export const SOCKET_EVENTS = Object.freeze({
  NOTIFICATION_NEW:          "notification:new",
  NOTIFICATION_UNREAD_COUNT: "notification:unread_count",
  CLAIM_NEW:                 "claim:new",
  CLAIM_STATUS_UPDATE:       "claim:status_update",
  CLAIM_ASSIGNED:            "claim:assigned",
  FRAUD_FLAGGED:             "fraud:flagged",
  FRAUD_RESOLVED:            "fraud:resolved",
  POLICY_PURCHASED:          "policy:purchased",
  ADMIN_ALERT:               "admin:alert",
  PING:                      "ping",
  PONG:                      "pong",
});

export const SocketProvider = ({ children }) => {
  const socketRef      = useRef(null);
  const [connected, setConnected] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user            = useSelector(selectUser);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    // Create socket connection with JWT auth
    const socket = io(SOCKET_URL, {
      auth:            { token },
      transports:      ["websocket", "polling"],
      reconnection:    true,
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
      timeout:         10000,
    });

    socket.on("connect", () => {
      setConnected(true);
      // Join role room after connect
      socket.emit("join:role", user.role);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
      setConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, user]);

  /**
   * Subscribe to a socket event. Returns an unsubscribe function.
   * Stable across renders (useCallback with no deps).
   * Captures the socket instance at call time so the cleanup removes the
   * correct listener even if the socket ref has since changed.
   *
   * Usage: useEffect(() => on(SOCKET_EVENTS.CLAIM_STATUS_UPDATE, handler), [on]);
   */
  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    socket?.on(event, handler);
    return () => socket?.off(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, on, off, emit }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
};
