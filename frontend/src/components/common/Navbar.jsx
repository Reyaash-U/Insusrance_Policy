import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser, selectUser } from "../../store/authSlice.js";
import { useNotifications } from "../../context/NotificationContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import NotificationDropdown from "../notifications/NotificationDropdown.jsx";
import { Bell, ChevronDown, LogOut, Wifi, WifiOff } from "lucide-react";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector(selectUser);
  const { unreadCount } = useNotifications();
  const { connected }   = useSocket();

  const [showNotifs,  setShowNotifs]  = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  const roleColors = {
    admin:    "text-red-500",
    adjuster: "text-amber-500",
    agent:    "text-teal-500",
    customer: "text-purple-500",
  };

  const roleAvatarGrad = {
    admin:    "from-red-400    to-rose-500",
    adjuster: "from-amber-400  to-orange-500",
    agent:    "from-teal-400   to-cyan-500",
    customer: "from-purple-400 to-blue-500",
  };

  return (
    <header className="px-6 py-3 flex items-center justify-between z-40 relative"
      style={{
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(99,102,241,0.1)",
        boxShadow: "0 1px 12px rgba(99,102,241,0.06)",
      }}>

      <div />

      {/* Right */}
      <div className="flex items-center gap-3">

        {/* Notification Bell */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => { setShowNotifs((p) => !p); setShowProfile(false); }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
            style={{ border: "1px solid rgba(99,102,241,0.12)" }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </motion.button>
          <AnimatePresence>
            {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} />}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { setShowProfile((p) => !p); setShowNotifs(false); }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all"
            style={{ border: "1px solid rgba(99,102,241,0.12)" }}
          >
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${roleAvatarGrad[user?.role] || "from-purple-400 to-blue-500"} flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-sm`}>
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`
              }
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-gray-800 text-xs font-semibold leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className={`text-[10px] font-semibold capitalize leading-none mt-0.5 ${roleColors[user?.role]}`}>
                {user?.role}
              </p>
            </div>
            <ChevronDown size={12} className="text-gray-400" />
          </motion.button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.13 }}
                className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden z-50"
                style={{
                  background: "rgba(255,255,255,0.97)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(99,102,241,0.12)",
                  boxShadow: "0 8px 32px rgba(99,102,241,0.12)",
                }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
