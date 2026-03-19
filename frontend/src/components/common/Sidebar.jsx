import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/authSlice.js";
import {
  LayoutDashboard, ShoppingBag, FileText, PlusCircle, ClipboardList,
  Users, Shield, AlertTriangle, ChevronLeft, Briefcase, Search
} from "lucide-react";

const NAV_ITEMS = {
  customer: [
    { label: "Dashboard",    path: "/dashboard",    Icon: LayoutDashboard },
    { label: "Browse Plans", path: "/policies",     Icon: ShoppingBag },
    { label: "My Policies",  path: "/my-policies",  Icon: Shield },
    { label: "Submit Claim", path: "/submit-claim", Icon: PlusCircle },
    { label: "My Claims",    path: "/my-claims",    Icon: ClipboardList },
  ],
  agent: [
    { label: "Dashboard", path: "/agent/dashboard", Icon: LayoutDashboard },
  ],
  adjuster: [
    { label: "Dashboard",     path: "/adjuster/dashboard", Icon: LayoutDashboard },
    { label: "Review Claims", path: "/adjuster/claims",    Icon: Search },
  ],
  admin: [
    { label: "Dashboard",  path: "/admin/dashboard", Icon: LayoutDashboard },
    { label: "Users",      path: "/admin/users",     Icon: Users },
    { label: "Policies",   path: "/admin/policies",  Icon: Shield },
    { label: "Claims",     path: "/admin/claims",    Icon: ClipboardList },
    { label: "Fraud Logs", path: "/admin/fraud",     Icon: AlertTriangle },
  ],
};

const roleGradient = {
  admin:    "from-red-500    to-rose-600",
  adjuster: "from-amber-500  to-orange-500",
  agent:    "from-teal-500   to-cyan-600",
  customer: "from-purple-500 to-blue-500",
};

const roleBg = {
  admin:    "bg-red-50    text-red-600",
  adjuster: "bg-amber-50  text-amber-600",
  agent:    "bg-teal-50   text-teal-600",
  customer: "bg-purple-50 text-purple-600",
};

const Sidebar = () => {
  const user     = useSelector(selectUser);
  const [collapsed, setCollapsed] = useState(false);
  const items    = NAV_ITEMS[user?.role] || [];
  const gradient = roleGradient[user?.role] || roleGradient.customer;

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 230 }}
      transition={{ duration: 0.18, ease: "easeInOut" }}
      className="flex-shrink-0 flex flex-col z-40 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        borderRight: "1px solid rgba(99,102,241,0.1)",
        boxShadow: "2px 0 20px rgba(99,102,241,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
          <span className="text-white font-bold text-sm">IX</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="font-bold text-gray-800 text-lg tracking-tight"
              style={{ fontFamily: "'Syne', 'Inter', sans-serif" }}
            >
              InsureX
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {items.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-100 shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon size={17} className="relative z-10 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="relative z-10 truncate"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Role badge + collapse */}
      <div className="p-3" style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}>
        {!collapsed && user && (
          <div className={`text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-lg mb-2 text-center ${roleBg[user.role]}`}>
            {user.role}
          </div>
        )}
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all text-xs"
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronLeft size={15} />
          </motion.span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
