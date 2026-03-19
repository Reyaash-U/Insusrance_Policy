import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import NeonButton from "../../components/common/NeonButton.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { fromNow } from "../../utils/formatDate.js";
import { STATUS_BADGE_CLASS, STATUS_LABELS } from "../../utils/roleHelpers.js";
import { AlertTriangle, CheckCircle, Flag } from "lucide-react";

const ReviewClaims = () => {
  const [claims,  setClaims]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState({ status: "", flagged: "", page: 1 });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/claims/adjuster/queue", {
        params: { ...filter, limit: 20 },
      });
      setClaims(data.data);
    } catch { toast.error("Failed to load claims."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Review Claims</h1>
        <p className="text-gray-400 text-sm mt-1">{claims.length} claim(s) in your queue</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filter.status} onChange={(e) => setFilter((p) => ({ ...p, status: e.target.value, page: 1 }))}
          className="input-neon max-w-[180px] text-sm">
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
        </select>
        <button onClick={() => setFilter((p) => ({ ...p, flagged: p.flagged ? "" : "true", page: 1 }))}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            filter.flagged ? "bg-red-50 border border-red-500/40 text-red-500" : "glass-light border border-gray-200 text-gray-600"
          }`}
        ><Flag size={12} /> Flagged Only</button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : claims.length === 0 ? (
        <GlassCard className="text-center py-16">
          <CheckCircle size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600">No claims matching filters.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {claims.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link to={`/adjuster/claims/${c._id}`}>
                <GlassCard padding="p-4" hover glow={c.fraudCheck?.isFlagged ? "red" : "none"} className="group">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {c.fraudCheck?.isFlagged && <span className="badge badge-flagged flex items-center gap-1"><AlertTriangle size={10} /> Fraud Risk</span>}
                        <span className="text-teal-600 font-mono text-xs">{c.claimNumber}</span>
                        <span className={`badge ${STATUS_BADGE_CLASS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                      </div>
                      <p className="text-gray-800 text-sm font-medium">{c.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {c.customer?.firstName} {c.customer?.lastName} · {c.policy?.name} · {fromNow(c.createdAt)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1">
                      <p className="text-blue-500 font-bold">{formatCurrency(c.claimAmount)}</p>
                      {c.fraudCheck?.riskScore >= 40 && (
                        <p className="text-red-500 text-xs">Risk Score: {c.fraudCheck.riskScore}</p>
                      )}
                    </div>
                    <span className="text-gray-400 group-hover:text-gray-800 transition-colors text-sm">→</span>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewClaims;
