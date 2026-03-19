import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Sector,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import { formatCurrency, formatNumber } from "../../utils/formatCurrency.js";
import { ClipboardList, AlertTriangle, AlertCircle, Lock, Users, Shield, Flag, TrendingUp } from "lucide-react";

const COLORS = ["#6366f1","#8b5cf6","#14b8a6","#10b981","#f59e0b","#ef4444"];
const GRAD_PAIRS = [
  ["#6366f1","#818cf8"],
  ["#8b5cf6","#a78bfa"],
  ["#3b82f6","#60a5fa"],
  ["#14b8a6","#2dd4bf"],
  ["#f59e0b","#fbbf24"],
  ["#ef4444","#f87171"],
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-xs shadow-2xl"
      style={{ background: "rgba(255,255,255,1)", border: "1px solid rgba(99,102,241,0.25)", minWidth: 140 }}>
      <p className="text-gray-500 mb-2 font-bold uppercase tracking-wide text-[10px]">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}</span>
          <span className="font-bold text-gray-900 ml-auto pl-3">
            {typeof p.value === "number" && p.value > 999 ? `₹${formatNumber(p.value)}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* Animated active slice for donut chart */
const ActiveSlice = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 3} outerRadius={outerRadius + 10}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.15} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1e1b4b" fontWeight="800" fontSize={22}>{value}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7280" fontSize={11} fontWeight="500" textTransform="capitalize">
        {payload.name}
      </text>
    </g>
  );
};

const METRIC_STYLES = [
  { gradient: "from-blue-400 to-indigo-500",   shadow: "rgba(59,130,246,0.25)"   },
  { gradient: "from-red-400 to-rose-500",       shadow: "rgba(239,68,68,0.25)"    },
  { gradient: "from-amber-400 to-orange-500",   shadow: "rgba(245,158,11,0.25)"   },
  { gradient: "from-purple-400 to-violet-500",  shadow: "rgba(139,92,246,0.25)"   },
];

const AdminDashboard = () => {
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [activeSlice,  setActiveSlice]  = useState(0);

  useEffect(() => {
    api.get("/claims/admin/stats")
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error("Failed to load analytics."))
      .finally(() => setLoading(false));
  }, []);

  const onPieEnter = useCallback((_, index) => setActiveSlice(index), []);

  const statusData = stats?.statusBreakdown?.map((s) => ({
    name:   s._id?.replace(/_/g, " ") || "unknown",
    value:  s.count,
    amount: s.totalAmount,
  })) || [];

  const monthlyData = stats?.monthlyVolume?.map((m) => ({
    name:   `${m._id.year}-${String(m._id.month).padStart(2,"0")}`,
    claims: m.count,
    amount: m.totalAmount,
  })) || [];

  const topMetrics = [
    { label: "Total Claims",    val: stats?.statusBreakdown?.reduce((s,b) => s+b.count,0) || 0, Icon: ClipboardList,  link: "/admin/claims"  },
    { label: "Fraud Flagged",   val: stats?.fraudStats?.flaggedCount || 0,                        Icon: AlertTriangle,  link: "/admin/fraud"   },
    { label: "Avg Risk Score",  val: `${(stats?.fraudStats?.avgRiskScore || 0).toFixed(0)}/100`,  Icon: AlertCircle,    link: "/admin/fraud"   },
    { label: "Confirmed Fraud", val: 0,                                                            Icon: Lock,           link: "/admin/fraud"   },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: "'Syne', sans-serif" }}>Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide analytics and operations</p>
      </motion.div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topMetrics.map(({ label, val, Icon, link }, i) => (
          <Link key={label} to={link}>
            <GlassCard delay={i * 0.05} tilt hover padding="p-5" className="group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {loading ? <span className="skeleton h-8 w-12 inline-block rounded-lg" /> : val}
                  </p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${METRIC_STYLES[i].gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                  style={{ boxShadow: `0 6px 18px ${METRIC_STYLES[i].shadow}` }}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Charts row — area + donut */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Monthly area chart (3/5) */}
        <GlassCard delay={0.2} padding="p-5" className="lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-gray-700 font-bold text-sm">Monthly Claim Volume</h2>
            <span className="flex items-center gap-1 text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
              <TrendingUp size={12} /> Trend
            </span>
          </div>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradClaims" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#14b8a6" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(99,102,241,0.07)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af", paddingTop: 8 }} />
                <Area type="monotone" dataKey="claims" stroke="#6366f1" fill="url(#gradClaims)"
                  strokeWidth={2.5} dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} name="Claims" />
                <Area type="monotone" dataKey="amount" stroke="#14b8a6" fill="url(#gradAmount)"
                  strokeWidth={2} strokeDasharray="5 3"
                  dot={{ fill: "#14b8a6", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} name="Amount (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        {/* Status donut (2/5) */}
        <GlassCard delay={0.25} padding="p-5" className="lg:col-span-2">
          <h2 className="text-gray-700 font-bold text-sm mb-4">Claims by Status</h2>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <defs>
                    {COLORS.map((c, i) => (
                      <radialGradient key={i} id={`pieGrad${i}`} cx="50%" cy="30%" r="70%">
                        <stop offset="0%"   stopColor={GRAD_PAIRS[i]?.[1] || c} />
                        <stop offset="100%" stopColor={GRAD_PAIRS[i]?.[0] || c} />
                      </radialGradient>
                    ))}
                  </defs>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={72}
                    dataKey="value" paddingAngle={3}
                    activeIndex={activeSlice} activeShape={<ActiveSlice />}
                    onMouseEnter={onPieEnter}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={`url(#pieGrad${i % COLORS.length})`} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full grid grid-cols-2 gap-x-4 gap-y-1.5">
                {statusData.map((s, i) => (
                  <button key={s.name} onClick={() => setActiveSlice(i)}
                    className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1 transition-colors ${activeSlice === i ? "bg-gray-100" : "hover:bg-gray-50"}`}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-500 capitalize truncate flex-1">{s.name}</span>
                    <span className="text-gray-800 font-bold ml-auto">{s.value}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Gradient bar chart — full width */}
      <GlassCard delay={0.3} padding="p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-gray-700 font-bold text-sm">Claim Amount by Month</h2>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg font-medium">All amounts in ₹</span>
        </div>
        {loading ? <div className="skeleton h-52 rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 12, left: 8, bottom: 0 }} barCategoryGap="40%">
              <defs>
                {monthlyData.map((_, i) => (
                  <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={GRAD_PAIRS[i % GRAD_PAIRS.length][1]} stopOpacity={1} />
                    <stop offset="100%" stopColor={GRAD_PAIRS[i % GRAD_PAIRS.length][0]} stopOpacity={0.85} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(99,102,241,0.07)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} width={52} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)", radius: 8 }} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} name="Amount (₹)" maxBarSize={80}>
                {monthlyData.map((_, i) => (
                  <Cell key={i} fill={`url(#barGrad${i})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </GlassCard>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Manage Users",  to: "/admin/users",    Icon: Users,         gradient: "from-blue-400 to-indigo-500",   shadow: "rgba(99,102,241,0.2)"  },
          { label: "All Policies",  to: "/admin/policies", Icon: Shield,        gradient: "from-purple-400 to-violet-500", shadow: "rgba(139,92,246,0.2)"  },
          { label: "All Claims",    to: "/admin/claims",   Icon: ClipboardList, gradient: "from-teal-400 to-cyan-500",     shadow: "rgba(20,184,166,0.2)"  },
          { label: "Fraud Logs",    to: "/admin/fraud",    Icon: Flag,          gradient: "from-red-400 to-rose-500",      shadow: "rgba(239,68,68,0.2)"   },
        ].map((a, i) => (
          <Link key={a.to} to={a.to}>
            <GlassCard delay={0.35 + i * 0.05} padding="p-4" className="text-center group hover:shadow-lg">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-110 transition-transform`}
                style={{ boxShadow: `0 6px 18px ${a.shadow}` }}>
                <a.Icon size={18} className="text-white" />
              </div>
              <p className="text-gray-500 text-xs font-semibold group-hover:text-gray-700 transition-colors">{a.label}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
