import { createContext, useContext, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useSocket, SOCKET_EVENTS } from "./SocketContext.jsx";
import api from "../api/axios.js";

const NotificationContext = createContext(null);

// Priority → toast variant map
const PRIORITY_MAP = { low: "blank", normal: "blank", high: "success", urgent: "error" };

export const NotificationProvider = ({ children }) => {
  const { on }              = useSocket();
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount,   setUnreadCount]     = useState(0);
  const [isLoading,     setIsLoading]       = useState(false);

  // ── Fetch initial notifications ────────────────────────────
  const fetchNotifications = useCallback(async (params = {}) => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/notifications", { params: { limit: 20, ...params } });
      setNotifications(data.data);
      setUnreadCount(data.meta?.unreadCount ?? 0);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Socket listeners ───────────────────────────────────────
  useEffect(() => {
    const unsubNew = on(SOCKET_EVENTS.NOTIFICATION_NEW, (notif) => {
      // Prepend to list and bump badge immediately — don't wait for the
      // separate NOTIFICATION_UNREAD_COUNT event to keep UI in sync.
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);

      // Show toast for high/urgent
      if (["high", "urgent"].includes(notif.priority)) {
        toast[notif.priority === "urgent" ? "error" : "success"](notif.message, {
          duration: notif.priority === "urgent" ? 7000 : 5000,
        });
      }
    });

    const unsubCount = on(SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT, (count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubNew();
      unsubCount();
    };
  }, [on]);

  // ── Actions ────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch { /* noop */ }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* noop */ }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch { /* noop */ }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
};
