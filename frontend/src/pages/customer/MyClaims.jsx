import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchMyClaims, selectClaims, selectClaimLoading } from "../../store/claimSlice.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import NeonButton from "../../components/common/NeonButton.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate, fromNow } from "../../utils/formatDate.js";
import { STATUS_BADGE_CLASS, STATUS_LABELS } from "../../utils/roleHelpers.js";
import api from "../../api/axios.js";
import { AlertTriangle, ClipboardList, Image, Video, FileText } from "lucide-react";
import BackButton from "../../components/common/BackButton.jsx";

const STATUSES = ["all","submitted","under_review","approved","rejected","withdrawn"];

const Timeline = ({ history }) => (
  <div className="space-y-3 mt-4">
    {history.map((h, i) => (
      <div key={i} className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${
            h.status === "approved" ? "bg-emerald-500" :
            h.status === "rejected" ? "bg-red-500"   :
            h.status === "under_review" ? "bg-amber-500" : "bg-blue-500"
          }`} />
          {i < history.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
        </div>
        <div className="pb-3 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${STATUS_BADGE_CLASS[h.status]}`}>{STATUS_LABELS[h.status]}</span>
            <span className="text-gray-400 text-[10px]">{fromNow(h.timestamp)}</span>
          </div>
          {h.note && <p className="text-gray-400 text-xs mt-1 italic">"{h.note}"</p>}
        </div>
      </div>
    ))}
  </div>
);

const ClaimCard = ({ claim, onWithdraw }) => {
  const [expanded, setExpanded] = useState(false);
  const isFlagged = claim.fraudCheck?.isFlagged;

  return (
    <GlassCard
      padding="p-5"
      glow={isFlagged ? "red" : claim.status === "approved" ? "green" : claim.status === "rejected" ? "none" : "blue"}
      hover
      className="cursor-pointer"
      onClick={() => setExpanded((p) => !p)}
    >
      {/* Main row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-teal-600 font-mono text-xs">{claim.claimNumber}</span>
            <span className={`badge ${STATUS_BADGE_CLASS[claim.status]}`}>{STATUS_LABELS[claim.status]}</span>
            {isFlagged && <span className="badge badge-flagged flex items-center gap-1"><AlertTriangle size={10} /> Flagged</span>}
          </div>
          <h3 className="text-gray-800 font-semibold text-sm truncate">{claim.title}</h3>
          <p className="text-gray-400 text-xs mt-0.5">{fromNow(claim.createdAt)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-blue-500 font-bold text-lg">{formatCurrency(claim.claimAmount)}</p>
          {claim.approvedAmount != null && (
            <p className="text-emerald-500 text-xs">Approved: {formatCurrency(claim.approvedAmount)}</p>
          )}
          <p className={`text-xs mt-1 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>▾</p>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <hr className="divider my-4" />

            <div className="grid sm:grid-cols-2 gap-3 text-xs mb-4">
              {[
                { label: "Incident Date",  val: formatDate(claim.incidentDate) },
                { label: "Policy",         val: claim.policy?.name || "—" },
                { label: "Deductible",     val: formatCurrency(claim.deductibleApplied || 0) },
                { label: "Payout",         val: claim.finalPayoutAmount != null ? formatCurrency(claim.finalPayoutAmount) : "Pending" },
              ].map(({ label, val }) => (
                <div key={label} className="glass-light border border-gray-200 rounded-xl p-2.5">
                  <p className="text-gray-400 text-[10px] uppercase">{label}</p>
                  <p className="text-gray-800 font-medium mt-0.5">{val}</p>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <p className="text-gray-400 text-xs mb-1">Description</p>
              <p className="text-gray-600 text-xs leading-relaxed">{claim.description}</p>
            </div>

            {claim.adjusterNote && (
              <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 mb-4">
                <p className="text-teal-600 text-[10px] uppercase tracking-wider mb-1">Adjuster Note</p>
                <p className="text-gray-600 text-xs">{claim.adjusterNote}</p>
              </div>
            )}

            {claim.rejectionReason && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
                <p className="text-red-500 text-[10px] uppercase tracking-wider mb-1">Rejection Reason</p>
                <p className="text-gray-600 text-xs">{claim.rejectionReason}</p>
              </div>
            )}

            {/* Attachments */}
            {claim.attachments?.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-2">Attachments ({claim.attachments.length})</p>
                <div className="flex flex-wrap gap-2">
                  {claim.attachments.map((a, i) => (
                    <a key={i} href={a.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg glass-light border border-gray-200 text-teal-600 hover:border-teal-600/40 transition-all">
                      {a.resourceType === "image" ? <Image size={12} /> : a.resourceType === "video" ? <Video size={12} /> : <FileText size={12} />}
                      {a.originalName?.slice(0, 20) || "File"}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Status timeline */}
            {claim.statusHistory?.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs mb-1">Status Timeline</p>
                <Timeline history={claim.statusHistory} />
              </div>
            )}

            {/* Withdraw */}
            {claim.status === "submitted" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <NeonButton variant="danger" size="sm" onClick={() => onWithdraw(claim._id)}>
                  Withdraw Claim
                </NeonButton>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

const MyClaims = () => {
  const dispatch  = useDispatch();
  const claims    = useSelector(selectClaims);
  const isLoading = useSelector(selectClaimLoading);
  const [status, setStatus] = useState("all");

  useEffect(() => { dispatch(fetchMyClaims({ limit: 50 })); }, [dispatch]);

  const filtered = status === "all" ? claims : claims.filter((c) => c.status === status);

  const handleWithdraw = async (claimId) => {
    if (!window.confirm("Are you sure you want to withdraw this claim?")) return;
    try {
      await api.delete(`/claims/${claimId}/withdraw`);
      toast.success("Claim withdrawn.");
      dispatch(fetchMyClaims({ limit: 50 }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to withdraw claim.");
    }
  };

  const stats = {
    total:    claims.length,
    approved: claims.filter((c) => c.status === "approved").length,
    pending:  claims.filter((c) => ["submitted","under_review"].includes(c.status)).length,
    totalPaid:claims.filter((c) => c.finalPayoutAmount).reduce((s,c) => s + c.finalPayoutAmount, 0),
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <BackButton />
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">My Claims</h1>
        <p className="text-gray-400 text-sm mt-1">{claims.length} total claims</p>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Claims",   val: stats.total,    color: "text-blue-500" },
          { label: "Approved",       val: stats.approved, color: "text-emerald-500" },
          { label: "In Progress",    val: stats.pending,  color: "text-amber-500" },
          { label: "Total Paid Out", val: formatCurrency(stats.totalPaid), color: "text-teal-600" },
        ].map(({ label, val, color }, i) => (
          <GlassCard key={label} delay={i * 0.05} padding="p-4">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider">{label}</p>
            <p className={`${color} font-bold text-xl mt-1`}>{val}</p>
          </GlassCard>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
              status === s
                ? "bg-purple-100 border border-purple-400 text-purple-500 shadow-sm"
                : "glass-light border border-gray-200 text-gray-600 hover:border-white/15"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s] || s}
            {s !== "all" && (
              <span className="ml-1.5 text-gray-400">
                ({claims.filter((c) => c.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Claims list */}
      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <GlassCard className="text-center py-16">
          <ClipboardList size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-gray-800 font-semibold mb-2">No claims found</h3>
          <p className="text-gray-400 text-sm">
            {status === "all" ? "You haven't filed any claims yet." : `No ${STATUS_LABELS[status] || status} claims.`}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filtered.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ClaimCard claim={c} onWithdraw={handleWithdraw} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClaims;
