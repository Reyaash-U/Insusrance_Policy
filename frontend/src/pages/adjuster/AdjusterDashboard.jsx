import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/authSlice.js";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import NeonButton from "../../components/common/NeonButton.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { fromNow } from "../../utils/formatDate.js";
import { STATUS_BADGE_CLASS, STATUS_LABELS } from "../../utils/roleHelpers.js";
import { ClipboardList, Search, CheckCircle, AlertTriangle } from "lucide-react";

const AdjusterDashboard = () => {
  const user  = useSelector(selectUser);
  const [queue,   setQueue]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState({ total: 0, assigned: 0, resolved: 0, flagged: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          api.get("/claims/adjuster/queue", { params: { limit: 10 } }),
          api.get("/claims/admin/stats"),
        ]);
        setQueue(qRes.data.data);
        const bd = sRes.data.data.statusBreakdown;
        const getCount = (s) => bd.find((b) => b._id === s)?.count || 0;
        setStats({
          total:    bd.reduce((s, b) => s + b.count, 0),
          assigned: getCount("under_review"),
          resolved: getCount("approved") + getCount("rejected"),
          flagged:  sRes.data.data.fraudStats?.flaggedCount || 0,
        });
      } catch { toast.error("Failed to load dashboard."); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Adjuster Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back, {user?.firstName}</p>
        </div>
        <Link to="/adjuster/claims"><NeonButton variant="cyan">View Full Queue →</NeonButton></Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Claims",   val: stats.total,    Icon: ClipboardList,  glow: "blue"  },
          { label: "Under Review",   val: stats.assigned, Icon: Search,         glow: "amber" },
          { label: "Resolved",       val: stats.resolved, Icon: CheckCircle,    glow: "green" },
          { label: "Fraud Flagged",  val: stats.flagged,  Icon: AlertTriangle,  glow: "red"   },
        ].map(({ label, val, Icon, glow }, i) => (
          <GlassCard key={label} glow={glow} delay={i * 0.05} tilt padding="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{loading ? "—" : val}</p>
              </div>
              <Icon size={22} className="text-gray-300" />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Queue */}
      <GlassCard padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-800 font-semibold">Claims Queue</h2>
          <span className="text-gray-400 text-xs">Flagged claims shown first</span>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
        ) : queue.length === 0 ? (
          <div className="text-center py-10"><CheckCircle size={36} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-400 text-sm">Queue is clear!</p></div>
        ) : (
          <div className="space-y-2">
            {queue.map((c, i) => (
              <Link key={c._id} to={`/adjuster/claims/${c._id}`}>
                <motion.div
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:bg-gray-50 cursor-pointer ${
                    c.fraudCheck?.isFlagged ? "border-red-200 bg-red-50" : "border-gray-200 glass-light"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {c.fraudCheck?.isFlagged && <AlertTriangle size={13} className="text-red-500" />}
                      <span className="text-teal-600 font-mono text-xs">{c.claimNumber}</span>
                      <span className={`badge ${STATUS_BADGE_CLASS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                    </div>
                    <p className="text-gray-800 text-sm font-medium truncate">{c.title}</p>
                    <p className="text-gray-400 text-xs">{c.customer?.firstName} {c.customer?.lastName} · {fromNow(c.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-blue-500 font-semibold">{formatCurrency(c.claimAmount)}</p>
                    {c.fraudCheck?.riskScore > 0 && (
                      <p className={`text-xs mt-0.5 ${c.fraudCheck.riskScore >= 60 ? "text-red-500" : c.fraudCheck.riskScore >= 40 ? "text-amber-500" : "text-gray-400"}`}>
                        Risk: {c.fraudCheck.riskScore}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">→</span>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default AdjusterDashboard;
