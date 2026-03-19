import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import NeonButton from "../../components/common/NeonButton.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate, fromNow } from "../../utils/formatDate.js";
import { STATUS_BADGE_CLASS, STATUS_LABELS } from "../../utils/roleHelpers.js";
import Loader from "../../components/common/Loader.jsx";
import { AlertTriangle, Video, FileText, CheckCircle, XCircle, ClipboardList } from "lucide-react";

const RiskMeter = ({ score }) => {
  const color = score >= 60 ? "bg-red-500" : score >= 40 ? "bg-amber-500" : "bg-emerald-500";
  const label = score >= 60 ? "High Risk" : score >= 40 ? "Medium Risk" : "Low Risk";
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Risk Score</span>
        <span className={score >= 60 ? "text-red-500" : score >= 40 ? "text-amber-500" : "text-emerald-500"}>{score}/100 · {label}</span>
      </div>
      <div className="h-2 bg-white/70 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

const ClaimDetail = () => {
  const { claimId }   = useParams();
  const navigate      = useNavigate();
  const [data, setData]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]   = useState({ status: "", approvedAmount: "", deductibleApplied: "", adjusterNote: "", rejectionReason: "" });

  useEffect(() => {
    api.get(`/claims/${claimId}`)
      .then(({ data: res }) => {
        setData(res.data);
        const c = res.data.claim;
        setForm((p) => ({ ...p, deductibleApplied: c.purchasedPolicy?.policySnapshot?.deductible || 0 }));
      })
      .catch(() => toast.error("Failed to load claim."))
      .finally(() => setLoading(false));
  }, [claimId]);

  const handleReview = async () => {
    if (!form.status) { toast.error("Select a decision."); return; }
    if (form.status === "approved" && !form.approvedAmount) { toast.error("Enter approved amount."); return; }
    if (form.status === "rejected" && !form.adjusterNote)   { toast.error("Provide rejection reason."); return; }
    setSubmitting(true);
    try {
      await api.patch(`/claims/${claimId}/review`, {
        status:           form.status,
        approvedAmount:   form.approvedAmount ? Number(form.approvedAmount) : undefined,
        deductibleApplied:Number(form.deductibleApplied) || 0,
        adjusterNote:     form.adjusterNote,
        rejectionReason:  form.status === "rejected" ? form.adjusterNote : undefined,
      });
      toast.success(`Claim ${form.status === "approved" ? "approved" : form.status === "rejected" ? "rejected" : "moved to review"} successfully!`);
      navigate("/adjuster/claims");
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader size="lg" text="Loading claim…" /></div>;
  if (!data)   return <div className="text-center py-20 text-gray-400">Claim not found.</div>;

  const { claim, fraudLog } = data;
  const isResolved = ["approved","rejected","withdrawn"].includes(claim.status);
  const canReview  = !isResolved;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-gray-400 text-xs hover:text-gray-600 mb-2 flex items-center gap-1">← Back</button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-800">{claim.title}</h1>
            <span className={`badge ${STATUS_BADGE_CLASS[claim.status]}`}>{STATUS_LABELS[claim.status]}</span>
            {claim.fraudCheck?.isFlagged && <span className="badge badge-flagged flex items-center gap-1"><AlertTriangle size={10} /> Fraud Flagged</span>}
          </div>
          <p className="text-teal-600 font-mono text-sm mt-1">{claim.claimNumber}</p>
        </div>
        <p className="text-3xl font-bold text-blue-500">{formatCurrency(claim.claimAmount)}</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Claim details */}
        <div className="lg:col-span-2 space-y-5">
          <GlassCard padding="p-5">
            <h2 className="text-gray-800 font-semibold text-sm mb-4">Claim Details</h2>
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              {[
                { label: "Incident Date",   val: formatDate(claim.incidentDate) },
                { label: "Submitted",       val: fromNow(claim.createdAt) },
                { label: "Policy",          val: claim.policy?.name || "—" },
                { label: "Category",        val: claim.policy?.category || "—" },
                { label: "Location",        val: [claim.incidentLocation?.city, claim.incidentLocation?.country].filter(Boolean).join(", ") || "Not provided" },
                { label: "Deductible",      val: formatCurrency(claim.purchasedPolicy?.policySnapshot?.deductible || 0) },
              ].map(({ label, val }) => (
                <div key={label} className="glass-light border border-gray-200 rounded-xl p-3">
                  <p className="text-gray-400 text-[10px] uppercase">{label}</p>
                  <p className="text-gray-800 font-medium mt-0.5 capitalize">{val}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Description</p>
              <p className="text-gray-600 text-sm leading-relaxed">{claim.description}</p>
            </div>
          </GlassCard>

          {/* Customer info */}
          <GlassCard padding="p-5">
            <h2 className="text-gray-800 font-semibold text-sm mb-4">Customer</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-xl font-bold text-white">
                {claim.customer?.firstName?.[0]}{claim.customer?.lastName?.[0]}
              </div>
              <div>
                <p className="text-gray-800 font-semibold">{claim.customer?.firstName} {claim.customer?.lastName}</p>
                <p className="text-gray-400 text-xs">{claim.customer?.email}</p>
                {claim.customer?.phone && <p className="text-gray-400 text-xs">{claim.customer.phone}</p>}
              </div>
            </div>
          </GlassCard>

          {/* Attachments */}
          {claim.attachments?.length > 0 && (
            <GlassCard padding="p-5">
              <h2 className="text-gray-800 font-semibold text-sm mb-4">Evidence ({claim.attachments.length})</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {claim.attachments.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer" className="group">
                    <div className="aspect-square rounded-xl overflow-hidden glass-light border border-gray-200 group-hover:border-blue-500/40 transition-all flex items-center justify-center">
                      {a.resourceType === "image"
                        ? <img src={a.url} alt="" className="w-full h-full object-cover" />
                        : (a.resourceType === "video" ? <Video size={28} className="text-gray-400" /> : <FileText size={28} className="text-gray-400" />)
                      }
                    </div>
                    <p className="text-gray-400 text-[9px] mt-1 truncate">{a.originalName}</p>
                  </a>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Status history */}
          <GlassCard padding="p-5">
            <h2 className="text-gray-800 font-semibold text-sm mb-4">Timeline</h2>
            <div className="space-y-3">
              {claim.statusHistory?.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                    h.status === "approved" ? "bg-emerald-500" : h.status === "rejected" ? "bg-red-500" : h.status === "under_review" ? "bg-amber-500" : "bg-blue-500"
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${STATUS_BADGE_CLASS[h.status]} text-[9px]`}>{STATUS_LABELS[h.status]}</span>
                      <span className="text-gray-400 text-[10px]">{fromNow(h.timestamp)}</span>
                    </div>
                    {h.note && <p className="text-gray-400 text-xs mt-0.5 italic">"{h.note}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right: Fraud + Decision */}
        <div className="space-y-5">
          {/* Fraud panel */}
          {fraudLog && (
            <GlassCard padding="p-5" glow={fraudLog.isFlagged ? "red" : "green"}>
              <h2 className="text-gray-800 font-semibold text-sm mb-4">Fraud Analysis</h2>
              <RiskMeter score={fraudLog.riskScore} />
              {fraudLog.ruleDetails?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Triggered Rules</p>
                  {fraudLog.ruleDetails.map((r, i) => (
                    <div key={i} className={`p-2.5 rounded-xl text-xs border ${
                      r.severity === "critical" ? "border-red-500/30 bg-red-50" :
                      r.severity === "high"     ? "border-amber-500/30 bg-amber-500/8" : "border-gray-200 glass-light"
                    }`}>
                      <p className="text-gray-800 font-medium capitalize">{r.rule.replace(/_/g," ")}</p>
                      <p className="text-gray-400 mt-0.5">{r.description}</p>
                      <p className="text-gray-400 mt-0.5">+{r.scoreContribution} pts · {r.severity}</p>
                    </div>
                  ))}
                </div>
              )}
              {fraudLog.resolution !== "pending" && (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-emerald-500 text-xs font-medium capitalize">{fraudLog.resolution.replace("_"," ")}</p>
                  {fraudLog.resolutionNote && <p className="text-gray-400 text-xs mt-0.5">{fraudLog.resolutionNote}</p>}
                </div>
              )}
            </GlassCard>
          )}

          {/* Decision panel */}
          {canReview && (
            <GlassCard padding="p-5" glow="purple">
              <h2 className="text-gray-800 font-semibold text-sm mb-4">Make a Decision</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Decision *</label>
                  <div className="space-y-2">
                    {[
                      { val: "under_review", label: "Move to Review", color: "amber" },
                      { val: "approved",     label: "Approve",        color: "green" },
                      { val: "rejected",     label: "Reject",         color: "red" },
                    ].map((d) => (
                      <button key={d.val} onClick={() => setForm((p) => ({ ...p, status: d.val }))}
                        className={`w-full p-3 rounded-xl text-sm text-left border transition-all ${
                          form.status === d.val
                            ? `border-neon-${d.color}/40 bg-neon-${d.color}/10 text-gray-800`
                            : "border-gray-200 glass-light text-gray-600 hover:border-white/15"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.status === "approved" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Approved Amount (₹) *</label>
                      <input type="number" value={form.approvedAmount} onChange={(e) => setForm((p) => ({ ...p, approvedAmount: e.target.value }))}
                        placeholder={`Max: ${formatCurrency(claim.claimAmount)}`} className="input-neon text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Deductible Applied</label>
                      <input type="number" value={form.deductibleApplied} onChange={(e) => setForm((p) => ({ ...p, deductibleApplied: e.target.value }))}
                        className="input-neon text-sm" />
                      {form.approvedAmount && (
                        <p className="text-emerald-500 text-xs">Payout: {formatCurrency(Math.max(0, Number(form.approvedAmount) - Number(form.deductibleApplied)))}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    {form.status === "rejected" ? "Rejection Reason *" : "Adjuster Note"}
                  </label>
                  <textarea rows={3} value={form.adjusterNote} onChange={(e) => setForm((p) => ({ ...p, adjusterNote: e.target.value }))}
                    placeholder="Add your notes…" className="input-neon resize-none text-sm" />
                </div>

                <NeonButton
                  variant={form.status === "approved" ? "cyan" : form.status === "rejected" ? "danger" : "purple"}
                  fullWidth
                  loading={submitting}
                  onClick={handleReview}
                >
                  {form.status === "approved" ? "Approve Claim" : form.status === "rejected" ? "Reject Claim" : "Submit Decision"}
                </NeonButton>
              </div>
            </GlassCard>
          )}

          {/* Already resolved */}
          {isResolved && (
            <GlassCard padding="p-5" glow={claim.status === "approved" ? "green" : "none"}>
              <h2 className="text-gray-800 font-semibold text-sm mb-3">Resolution</h2>
              <span className={`badge ${STATUS_BADGE_CLASS[claim.status]} text-sm`}>{STATUS_LABELS[claim.status]}</span>
              {claim.finalPayoutAmount != null && (
                <div className="mt-3">
                  <p className="text-gray-400 text-xs">Final Payout</p>
                  <p className="text-emerald-500 font-bold text-xl">{formatCurrency(claim.finalPayoutAmount)}</p>
                </div>
              )}
              {claim.rejectionReason && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-red-500 text-xs">Rejection Reason</p>
                  <p className="text-gray-600 text-xs mt-1">{claim.rejectionReason}</p>
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimDetail;
