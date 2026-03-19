import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNotifications } from "../../context/NotificationContext.jsx";
import { formatDistanceToNow } from "date-fns";
import {
  FileText, Search, CheckCircle, XCircle, AlertOctagon, Shield,
  Clock, Ban, Pin, AlertTriangle, PartyPopper, Lock, Bell
} from "lucide-react";

const typeIcons = {
  claim_submitted:      FileText,
  claim_under_review:   Search,
  claim_approved:       CheckCircle,
  claim_rejected:       XCircle,
  claim_flagged:        AlertOctagon,
  policy_purchased:     Shield,
  policy_expiring_soon: Clock,
  policy_expired:       Ban,
  new_claim_assigned:   Pin,
  fraud_alert:          AlertTriangle,
  account_verified:     PartyPopper,
  password_changed:     Lock,
  default:              Bell,
};

const typeColors = {
  claim_approved:       "text-emerald-500 bg-emerald-50",
  claim_rejected:       "text-red-500 bg-red-50",
  claim_flagged:        "text-red-500 bg-red-50",
  fraud_alert:          "text-amber-500 bg-amber-50",
  policy_expiring_soon: "text-amber-500 bg-amber-50",
  policy_expired:       "text-gray-400 bg-gray-100",
  default:              "text-purple-500 bg-purple-50",
};

const NotificationDropdown = ({ onClose }) => {
  const ref = useRef(null);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, fetchNotifications } =
    useNotifications();

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.14 }}
      className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50"
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(99,102,241,0.12)",
        boxShadow: "0 12px 40px rgba(99,102,241,0.12), 0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-gray-500" />
          <span className="text-gray-800 text-sm font-bold">Notifications</span>
          {unreadCount > 0 && (
            <span className="badge badge-submitted text-[9px]">{unreadCount} new</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead}
            className="text-[11px] text-purple-500 hover:text-blue-500 font-semibold transition-colors">
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: "rgba(139,92,246,0.15)", borderTopColor: "#8b5cf6" }} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-gray-400">
            <Bell size={28} className="text-gray-200" />
            <p className="text-xs font-medium">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const IconComp = typeIcons[n.type] || typeIcons.default;
            const colorClass = typeColors[n.type] || typeColors.default;
            return (
              <button key={n._id} onClick={() => markAsRead(n._id)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-purple-50/40" : ""}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
                  <IconComp size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${n.isRead ? "text-gray-500" : "text-gray-800"}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                )}
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default NotificationDropdown;
