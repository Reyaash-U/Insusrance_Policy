import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { fromNow } from "../../utils/formatDate.js";
import { STATUS_BADGE_CLASS, STATUS_LABELS } from "../../utils/roleHelpers.js";
import { Flag, AlertTriangle } from "lucide-react";

const AllClaims = () => {
  const [claims,  setClaims]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState({ status:"", flagged:"" });

  useEffect(() => {
    setLoading(true);
    api.get("/claims/admin/all", { params: { ...filter, limit: 50 } })
      .then(({ data }) => setClaims(data.data))
      .catch(() => toast.error("Failed to load claims."))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">All Claims</h1>
        <p className="text-gray-400 text-sm mt-1">{claims.length} claims</p>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        <select value={filter.status} onChange={(e) => setFilter((p) => ({ ...p, status: e.target.value }))}
          className="input-neon max-w-[180px] text-sm">
          <option value="">All Statuses</option>
          {["submitted","under_review","approved","rejected","withdrawn"].map((s) => (
            <option key={s} value={s} style={{ background: "#ffffff", color: "#1e1b4b" }}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button onClick={() => setFilter((p) => ({ ...p, flagged: p.flagged ? "" : "true" }))}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            filter.flagged ? "bg-red-50 border border-red-500/40 text-red-500" : "glass-light border border-gray-200 text-gray-600"
          }`}><Flag size={12} /> Flagged Only</button>
      </div>

      <GlassCard padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Claim #","Title","Customer","Amount","Status","Risk","Filed"].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-gray-400 text-xs font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? [1,2,3,4,5].map((i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="skeleton h-8 rounded-lg" /></td></tr>
              )) : claims.map((c, i) => (
                <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-white/60 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/adjuster/claims/${c._id}`} className="text-teal-600 font-mono text-xs hover:text-blue-500">{c.claimNumber}</Link>
                  </td>
                  <td className="px-5 py-3 text-gray-800 max-w-[180px] truncate">{c.title}</td>
                  <td className="px-5 py-3 text-gray-600 text-xs">{c.customer?.firstName} {c.customer?.lastName}</td>
                  <td className="px-5 py-3 text-blue-500 font-semibold">{formatCurrency(c.claimAmount)}</td>
                  <td className="px-5 py-3"><span className={`badge ${STATUS_BADGE_CLASS[c.status]}`}>{STATUS_LABELS[c.status]}</span></td>
                  <td className="px-5 py-3">
                    {c.fraudCheck?.isFlagged
                      ? <span className="flex items-center gap-1 text-red-500 text-xs font-semibold"><AlertTriangle size={11} /> {c.fraudCheck.riskScore}</span>
                      : <span className="text-gray-400 text-xs">{c.fraudCheck?.riskScore || 0}</span>
                    }
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{fromNow(c.createdAt)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default AllClaims;
