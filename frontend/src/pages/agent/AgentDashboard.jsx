import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import NeonButton from "../../components/common/NeonButton.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { fromNow } from "../../utils/formatDate.js";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/authSlice.js";
import {
  Heart, Car, Home, Leaf, Plane, Building2, Shield, CheckCircle,
  Coins, Users, ClipboardList,
} from "lucide-react";

const CATEGORY_ICON_MAP = { health: Heart, auto: Car, home: Home, life: Leaf, travel: Plane, business: Building2 };
const CatIcon = ({ cat, size = 18 }) => { const I = CATEGORY_ICON_MAP[cat] || Shield; return <I size={size} className="text-gray-500" />; };
const CATEGORY_COLORS = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: "rgba(255,255,255,1)", border: "1px solid rgba(99,102,241,0.2)", minWidth: 110 }}>
      <p className="text-gray-600 mb-1 capitalize font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-bold text-gray-900">
          <span style={{ color: p.color }}>{p.name}</span>: {p.value}
        </p>
      ))}
    </div>
  );
};

const AgentDashboard = () => {
  const user = useSelector(selectUser);
  const [policies,   setPolicies]   = useState([]);
  const [purchased,  setPurchased]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/policies", { params: { isActive: true, limit: 100 } }),
      api.get("/policies/admin/purchased", { params: { limit: 50 } }),
    ])
      .then(([polRes, purRes]) => {
        setPolicies(polRes.data.data || []);
        setPurchased(purRes.data.data || []);
      })
      .catch(() => toast.error("Failed to load data."))
      .finally(() => setLoading(false));
  }, []);

  /* ── Derived stats ─────────────────────────────────────────── */
  const totalPolicies   = policies.length;
  const activePurchased = purchased.filter((p) => p.status === "active").length;
  const totalPremium    = purchased
    .filter((p) => p.status === "active")
    .reduce((s, p) => s + (p.premiumDetails?.calculatedMonthlyPremium || 0), 0);

  // Category breakdown from active policies
  const categoryMap = {};
  policies.forEach((p) => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap).map(([cat, count]) => ({ name: cat, count }));

  // Recent purchases (last 5)
  const recentPurchases = [...purchased]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const statCards = [
    { label: "Active Policies",      val: totalPolicies,                                   Icon: Shield,       glow: "blue"   },
    { label: "Active Subscriptions", val: activePurchased,                                 Icon: CheckCircle,  glow: "green"  },
    { label: "Monthly Premium Pool", val: formatCurrency(totalPremium),                    Icon: Coins,        glow: "cyan"   },
    { label: "Total Customers",      val: new Set(purchased.map((p) => p.customer)).size,  Icon: Users,        glow: "purple" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Agent Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Welcome back, <span className="text-gray-800">{user?.firstName}</span> · Policy sales and portfolio overview
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, val, Icon, glow }, i) => (
          <GlassCard key={label} glow={glow} delay={i * 0.05} tilt hover padding="p-5" className="group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {loading ? <span className="skeleton h-7 w-14 inline-block rounded" /> : val}
                </p>
              </div>
              <Icon size={22} className="text-gray-300 group-hover:scale-110 transition-transform" />
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category breakdown bar chart */}
        <GlassCard delay={0.2} padding="p-5">
          <h2 className="text-gray-800 font-semibold text-sm mb-5">Policies by Category</h2>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : categoryData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No policies available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4,4,0,0]} name="Policies">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        {/* Recent Purchases */}
        <GlassCard delay={0.25} padding="p-5">
          <h2 className="text-gray-800 font-semibold text-sm mb-5">Recent Purchases</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : recentPurchases.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No purchases yet.</p>
          ) : (
            <div className="space-y-2">
              {recentPurchases.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl glass-light border border-gray-200 hover:border-white/10 transition-all"
                >
                  <CatIcon cat={p.policySnapshot?.category} size={18} />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-xs font-medium truncate">
                      {p.policySnapshot?.name || "Policy"}
                    </p>
                    <p className="text-gray-400 text-[10px]">
                      {p.customer?.firstName} {p.customer?.lastName} · {fromNow(p.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-blue-500 text-xs font-bold">
                      {formatCurrency(p.premiumDetails?.calculatedMonthlyPremium || 0)}<span className="text-gray-400 font-normal">/mo</span>
                    </p>
                    <span className={`badge text-[9px] ${p.status === "active" ? "badge-active" : "badge-rejected"}`}>
                      {p.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Available Policies Catalog */}
      <GlassCard delay={0.3} padding="p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-gray-800 font-semibold text-sm">Available Policy Catalog</h2>
          <p className="text-gray-400 text-xs">{totalPolicies} active policies</p>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1,2,3].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
          </div>
        ) : policies.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No active policies in catalog.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {policies.slice(0, 9).map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className="p-4 rounded-xl glass-light border border-gray-200 hover:border-gray-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <CatIcon cat={p.category} size={20} />
                  <span className="text-blue-500 text-xs font-bold">
                    {formatCurrency(p.basePremium)}<span className="text-gray-400 font-normal">/mo</span>
                  </span>
                </div>
                <p className="text-gray-800 text-sm font-medium leading-tight">{p.name}</p>
                <p className="text-gray-400 text-[10px] capitalize mt-1">{p.category} · up to {formatCurrency(p.maxClaimAmount)}</p>
                <div className="mt-2 flex items-center gap-1 flex-wrap">
                  {(p.tags || []).slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full glass-light border border-gray-200 text-gray-400 capitalize">{tag}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {policies.length > 9 && (
          <p className="text-gray-400 text-xs text-center mt-4">
            Showing 9 of {policies.length} policies.
          </p>
        )}
      </GlassCard>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Browse All Policies", to: "/policies",    Icon: Shield,       glow: "blue"   },
          { label: "View Subscriptions",  to: "#",            Icon: ClipboardList, glow: "cyan"  },
          { label: "Customer List",       to: "/admin/users", Icon: Users,         glow: "purple" },
        ].map((a, i) => (
          <Link key={a.label} to={a.to}>
            <GlassCard glow={a.glow} delay={0.4 + i * 0.05} padding="p-4" className="text-center group">
              <a.Icon size={24} className="text-gray-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-gray-600 text-xs group-hover:text-gray-800 transition-colors">{a.label}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AgentDashboard;
