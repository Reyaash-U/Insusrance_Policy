import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import NeonButton from "../../components/common/NeonButton.jsx";
import { fromNow } from "../../utils/formatDate.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { Flag, Clock, Lock, AlertCircle, Shield, AlertTriangle, X } from "lucide-react";
import BackButton from "../../components/common/BackButton.jsx";

/* ── Risk Meter ───────────────────────────────────────────────── */
const RiskMeter = ({ score }) => {
  const color = score >= 60 ? "bg-red-500" : score >= 40 ? "bg-amber-500" : "bg-emerald-500";
  const textColor = score >= 60 ? "text-red-500" : score >= 40 ? "text-amber-500" : "text-emerald-500";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Risk Score</span>
        <span className={`font-bold ${textColor}`}>{score}/100</span>
      </div>
      <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

/* ── Resolve Modal ────────────────────────────────────────────── */
const ResolveModal = ({ log, onClose, onResolved }) => {
  const [resolution, setResolution] = useState("confirmed_fraud");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/fraud/logs/${log._id}/resolve`, { resolution, note });
      toast.success("Fraud log resolved.");
      onResolved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Resolution failed.");
    } finally { setSaving(false); }
  };

  const options = [
    { val: "confirmed_fraud",  label: "Confirmed Fraud",  color: "red",    desc: "Fraudulent activity confirmed. Reject claim." },
    { val: "false_positive",   label: "False Positive",   color: "green",  desc: "Investigation shows no fraud. Clear the flag." },
    { val: "under_investigation", label: "Under Investigation", color: "amber", desc: "Keep flagged while investigation continues." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard padding="p-6" glow="purple">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold gradient-text">Resolve Fraud Log</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800"><X size={18} /></button>
          </div>

          <div className="mb-4 p-3 rounded-xl glass-light border border-gray-200 text-xs">
            <p className="text-gray-400">Claim</p>
            <p className="text-gray-800 font-mono mt-0.5">{log.claim?.claimNumber || "—"}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              {options.map((o) => (
                <button
                  key={o.val}
                  type="button"
                  onClick={() => setResolution(o.val)}
                  className={`w-full p-3 rounded-xl text-left text-sm border transition-all ${
                    resolution === o.val
                      ? `border-neon-${o.color}/40 bg-neon-${o.color}/10 text-gray-800`
                      : "border-gray-200 glass-light text-gray-600 hover:border-white/15"
                  }`}
                >
                  <p className="font-medium">{o.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{o.desc}</p>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Resolution Note</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add investigation notes…"
                className="input-neon resize-none text-sm"
              />
            </div>

            <div className="flex gap-3">
              <NeonButton type="submit" variant="purple" fullWidth loading={saving}>
                Submit Resolution
              </NeonButton>
              <NeonButton type="button" variant="ghost" onClick={onClose}>Cancel</NeonButton>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
};

/* ── Fraud Log Card ───────────────────────────────────────────── */
const FraudCard = ({ log, i, onResolve, onRecheck }) => {
  const [expanded, setExpanded] = useState(false);
  const [rechecking, setRechecking] = useState(false);

  const handleRecheck = async (e) => {
    e.stopPropagation();
    setRechecking(true);
    try {
      await onRecheck(log.claim?._id);
    } finally { setRechecking(false); }
  };

  const resolutionBadge = {
    pending:              { cls: "badge-submitted",    label: "Pending" },
    confirmed_fraud:      { cls: "badge-rejected",     label: "Confirmed Fraud" },
    false_positive:       { cls: "badge-active",       label: "False Positive" },
    under_investigation:  { cls: "badge-under-review", label: "Investigating" },
  };
  const rb = resolutionBadge[log.resolution] || resolutionBadge.pending;

  return (
    <motion.div
      key={log._id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
    >
      <GlassCard
        padding="p-4"
        glow={log.isFlagged ? (log.riskScore >= 60 ? "red" : "amber") : "none"}
        className="cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Summary row */}
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {log.isFlagged && (
                <span className="badge badge-flagged flex items-center gap-1"><AlertTriangle size={10} /> Flagged</span>
              )}
              <span className={`badge ${rb.cls}`}>{rb.label}</span>
              <span className="text-teal-600 font-mono text-xs">{log.claim?.claimNumber || "—"}</span>
            </div>

            <p className="text-gray-800 font-medium text-sm truncate">
              {log.claim?.title || "Untitled Claim"}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              {log.customer?.firstName} {log.customer?.lastName}
              {log.claim?.claimAmount && ` · ${formatCurrency(log.claim.claimAmount)}`}
              {" · "}{fromNow(log.createdAt)}
            </p>
          </div>

          <div className="w-36 flex-shrink-0">
            <RiskMeter score={log.riskScore} />
          </div>

          <div className="flex-shrink-0 flex gap-2" onClick={(e) => e.stopPropagation()}>
            {log.resolution === "pending" && (
              <>
                <NeonButton variant="purple" size="sm" onClick={() => onResolve(log)}>
                  Resolve
                </NeonButton>
                <NeonButton variant="ghost" size="sm" loading={rechecking} onClick={handleRecheck}>
                  Recheck
                </NeonButton>
              </>
            )}
            {log.claim?._id && (
              <Link to={`/adjuster/claims/${log.claim._id}`} onClick={(e) => e.stopPropagation()}>
                <NeonButton variant="cyan" size="sm">View Claim</NeonButton>
              </Link>
            )}
          </div>

          <span className="text-gray-400 text-sm transition-transform" style={{ transform: expanded ? "rotate(90deg)" : "none" }}>›</span>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                {log.ruleDetails?.length > 0 ? (
                  <>
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Triggered Rules ({log.ruleDetails.length})</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {log.ruleDetails.map((r, idx) => (
                        <div key={idx} className={`p-3 rounded-xl text-xs border ${
                          r.severity === "critical" ? "border-red-500/30 bg-red-50" :
                          r.severity === "high"     ? "border-amber-500/30 bg-amber-500/8" :
                          "border-gray-200 glass-light"
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-gray-800 font-medium capitalize">{r.rule.replace(/_/g, " ")}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              r.severity === "critical" ? "bg-red-50 text-red-500" :
                              r.severity === "high"     ? "bg-amber-500/20 text-amber-500" :
                              "bg-white/10 text-gray-400"
                            }`}>{r.severity}</span>
                          </div>
                          <p className="text-gray-400">{r.description}</p>
                          <p className="text-blue-500 mt-1 font-semibold">+{r.scoreContribution} pts</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400 text-xs">No specific rules triggered.</p>
                )}

                {log.resolution !== "pending" && log.resolutionNote && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-emerald-500 text-xs font-medium">Resolution Note</p>
                    <p className="text-gray-600 text-xs mt-1">{log.resolutionNote}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
};

/* ── Main Page ────────────────────────────────────────────────── */
const FraudLogs = () => {
  const [logs,     setLogs]     = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState({ resolution: "pending", isFlagged: "" });
  const [resolveTarget, setResolveTarget] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/fraud/logs", { params: { ...filter, limit: 50 } }),
      api.get("/fraud/stats"),
    ])
      .then(([logsRes, statsRes]) => {
        setLogs(logsRes.data.data || []);
        setStats(statsRes.data.data);
      })
      .catch(() => toast.error("Failed to load fraud data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleRecheck = async (claimId) => {
    try {
      await api.post(`/fraud/recheck/${claimId}`);
      toast.success("Fraud check re-run.");
      load();
    } catch { toast.error("Recheck failed."); }
  };

  const handleResolved = () => {
    setResolveTarget(null);
    load();
  };

  const statCards = [
    { label: "Total Flagged",    val: stats?.flaggedCount     || 0, Icon: Flag,          color: "red"    },
    { label: "Pending Review",   val: stats?.pendingCount     || 0, Icon: Clock,         color: "amber"  },
    { label: "Confirmed Fraud",  val: stats?.confirmedCount   || 0, Icon: Lock,          color: "purple" },
    { label: "Avg Risk Score",   val: stats ? `${(stats.avgRiskScore || 0).toFixed(0)}/100` : "—", Icon: AlertCircle, color: "blue" },
  ];

  return (
    <>
      <AnimatePresence>
        {resolveTarget && (
          <ResolveModal
            log={resolveTarget}
            onClose={() => setResolveTarget(null)}
            onResolved={handleResolved}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6 max-w-7xl mx-auto">
        <BackButton />
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold gradient-text">Fraud Logs</h1>
          <p className="text-gray-400 text-sm mt-1">AI-powered rule-based fraud detection results</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, val, Icon, color }, i) => (
            <GlassCard key={label} glow={color} delay={i * 0.05} padding="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {loading ? <span className="skeleton h-7 w-10 inline-block rounded" /> : val}
                  </p>
                </div>
                <Icon size={20} className="text-gray-300" />
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select value={filter.resolution} onChange={(e) => setFilter((p) => ({ ...p, resolution: e.target.value }))}
            className="input-neon max-w-[180px] text-sm">
            <option value=""              style={{ background: "#ffffff", color: "#1e1b4b" }}>All Resolutions</option>
            <option value="pending"       style={{ background: "#ffffff", color: "#1e1b4b" }}>Pending</option>
            <option value="confirmed_fraud" style={{ background: "#ffffff", color: "#1e1b4b" }}>Confirmed Fraud</option>
            <option value="false_positive"  style={{ background: "#ffffff", color: "#1e1b4b" }}>False Positive</option>
            <option value="under_investigation" style={{ background: "#ffffff", color: "#1e1b4b" }}>Investigating</option>
          </select>
          <button
            onClick={() => setFilter((p) => ({ ...p, isFlagged: p.isFlagged ? "" : "true" }))}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              filter.isFlagged
                ? "bg-red-50 border border-red-500/40 text-red-500"
                : "glass-light border border-gray-200 text-gray-600"
            }`}
          ><Flag size={12} /> Flagged Only</button>
        </div>

        {/* Log list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : logs.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Shield size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600">No fraud logs matching filters.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {logs.map((log, i) => (
              <FraudCard
                key={log._id}
                log={log}
                i={i}
                onResolve={setResolveTarget}
                onRecheck={handleRecheck}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FraudLogs;
