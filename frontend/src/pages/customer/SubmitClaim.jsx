import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { submitClaim } from "../../store/claimSlice.js";
import { fetchMyPolicies, selectMyPolicies } from "../../store/policySlice.js";
import { selectUser } from "../../store/authSlice.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import NeonButton from "../../components/common/NeonButton.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { FileText, Video, AlertTriangle, X } from "lucide-react";

const MAX_FILES = 10;
const MAX_MB    = 10;

const FilePreview = ({ file, onRemove }) => {
  const isImage = file.type.startsWith("image/");
  const url     = isImage ? URL.createObjectURL(file) : null;
  const sizeMB  = (file.size / 1048576).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group"
    >
      <div className="w-full aspect-square rounded-xl overflow-hidden glass-light border border-gray-200 flex items-center justify-center">
        {isImage ? (
          <img src={url} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-2">
            {file.type.includes("pdf") ? <FileText size={28} className="text-gray-400 mx-auto" /> : <Video size={28} className="text-gray-400 mx-auto" />}
            <p className="text-gray-400 text-[10px] mt-1 truncate max-w-full">{file.name}</p>
          </div>
        )}
        <button
          onClick={() => onRemove(file.name)}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/80 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        ><X size={12} /></button>
      </div>
      <p className="text-gray-400 text-[9px] text-center mt-1">{sizeMB}MB</p>
    </motion.div>
  );
};

const SubmitClaim = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const policies  = useSelector(selectMyPolicies).filter((p) => p.status === "active");
  const user      = useSelector(selectUser);

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    purchasedPolicyId: "",
    title:             "",
    description:       "",
    incidentDate:      "",
    claimAmount:       "",
    address:           "",
    city:              "",
    state:             "",
    country:           "",
  });
  const [files,      setFiles]      = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState({});
  const [step,       setStep]       = useState(0); // 0: details, 1: media, 2: review

  useEffect(() => { dispatch(fetchMyPolicies({ limit: 50 })); }, [dispatch]);

  const selectedPolicy = policies.find((p) => p._id === form.purchasedPolicyId);

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: typeof e === "string" ? e : e.target.value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleFiles = (e) => {
    const incoming = Array.from(e.target.files);
    const filtered = incoming.filter((f) => f.size <= MAX_MB * 1048576);
    if (filtered.length < incoming.length) toast.error(`Some files exceeded ${MAX_MB}MB and were skipped.`);
    setFiles((prev) => [...prev, ...filtered].slice(0, MAX_FILES));
    e.target.value = "";
  };

  const removeFile = (name) => setFiles((p) => p.filter((f) => f.name !== name));

  const validate = () => {
    const errs = {};
    if (!form.purchasedPolicyId) errs.purchasedPolicyId = "Select a policy.";
    if (!form.title.trim())      errs.title             = "Title is required.";
    if (form.title.length < 5)   errs.title             = "Title must be at least 5 characters.";
    if (!form.description.trim() || form.description.length < 20) errs.description = "Description must be at least 20 characters.";
    if (!form.incidentDate)      errs.incidentDate      = "Incident date is required.";
    if (new Date(form.incidentDate) > new Date()) errs.incidentDate = "Date cannot be in the future.";
    if (!form.claimAmount || Number(form.claimAmount) < 1) errs.claimAmount = "Enter a valid claim amount.";
    if (selectedPolicy && Number(form.claimAmount) > selectedPolicy.remainingCoverageAmount)
      errs.claimAmount = `Exceeds remaining coverage (${formatCurrency(selectedPolicy.remainingCoverageAmount)}).`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("purchasedPolicyId", form.purchasedPolicyId);
      fd.append("title",             form.title);
      fd.append("description",       form.description);
      fd.append("incidentDate",      form.incidentDate);
      fd.append("claimAmount",       form.claimAmount);
      if (form.address || form.city) {
        fd.append("incidentLocation[address]", form.address);
        fd.append("incidentLocation[city]",    form.city);
        fd.append("incidentLocation[state]",   form.state);
        fd.append("incidentLocation[country]", form.country);
      }
      files.forEach((f) => fd.append("attachments", f));

      const result = await dispatch(submitClaim(fd));
      if (!result.error) {
        toast.success("Claim submitted successfully!");
        navigate("/my-claims");
      } else {
        toast.error(result.payload);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ["Claim Details", "Evidence Upload", "Review & Submit"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">File a Claim</h1>
        <p className="text-gray-400 text-sm mt-1">Submit your insurance claim with supporting evidence</p>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? "text-gray-800" : "text-gray-400"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                i < step  ? "bg-emerald-50 border border-emerald-400 text-emerald-500" :
                i === step ? "bg-purple-50 border border-purple-400 text-purple-500 shadow-sm" :
                             "bg-white/70 border border-gray-200 text-gray-400"
              }`}>{i < step ? "✓" : i + 1}</div>
              <span className="text-xs hidden sm:block">{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-emerald-200" : "bg-white/70"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: Details */}
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard padding="p-6" className="space-y-5">
              {/* Policy selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Select Policy *</label>
                <select value={form.purchasedPolicyId} onChange={set("purchasedPolicyId")}
                  className={`input-neon ${errors.purchasedPolicyId ? "border-red-500/50" : ""}`}
                  style={{ color: "#1e1b4b" }}>
                  <option value="" style={{ background: "#ffffff", color: "#6b7280" }}>-- Choose an active policy --</option>
                  {policies.map((p) => (
                    <option key={p._id} value={p._id} style={{ background: "#ffffff", color: "#1e1b4b" }}>
                      {p.policySnapshot.name} — {formatCurrency(p.remainingCoverageAmount)} remaining
                    </option>
                  ))}
                </select>
                {errors.purchasedPolicyId && <p className="text-red-500 text-xs">{errors.purchasedPolicyId}</p>}
              </div>

              {/* Selected policy info */}
              {selectedPolicy && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Max Coverage",  val: formatCurrency(selectedPolicy.policySnapshot.maxClaimAmount) },
                    { label: "Remaining",     val: formatCurrency(selectedPolicy.remainingCoverageAmount) },
                    { label: "Deductible",    val: formatCurrency(selectedPolicy.policySnapshot.deductible) },
                  ].map(({ label, val }) => (
                    <div key={label} className="glass-light border border-gray-200 rounded-xl p-3 text-center">
                      <p className="text-gray-400 text-[10px] uppercase">{label}</p>
                      <p className="text-gray-800 text-sm font-semibold mt-0.5">{val}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Claim Title *</label>
                <input value={form.title} onChange={set("title")} placeholder="Brief title describing the incident"
                  className={`input-neon ${errors.title ? "border-red-500/50" : ""}`} />
                {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Description * <span className="text-gray-400">({form.description.length}/5000)</span>
                </label>
                <textarea value={form.description} onChange={set("description")} rows={4}
                  placeholder="Describe the incident in detail — what happened, when, how, and why you are claiming…"
                  className={`input-neon resize-none ${errors.description ? "border-red-500/50" : ""}`} />
                {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
              </div>

              {/* Date + Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Incident Date *</label>
                  <input type="date" value={form.incidentDate} onChange={set("incidentDate")}
                    max={new Date().toISOString().split("T")[0]}
                    className={`input-neon ${errors.incidentDate ? "border-red-500/50" : ""}`} />
                  {errors.incidentDate && <p className="text-red-500 text-xs">{errors.incidentDate}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Claim Amount (₹) *</label>
                  <input type="number" min="1" value={form.claimAmount} onChange={set("claimAmount")}
                    placeholder="0.00"
                    className={`input-neon ${errors.claimAmount ? "border-red-500/50" : ""}`} />
                  {errors.claimAmount && <p className="text-red-500 text-xs">{errors.claimAmount}</p>}
                </div>
              </div>

              {/* Location (optional) */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Incident Location <span className="text-gray-400">(optional)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.address} onChange={set("address")} placeholder="Street address" className="input-neon text-xs" />
                  <input value={form.city}    onChange={set("city")}    placeholder="City"           className="input-neon text-xs" />
                  <input value={form.state}   onChange={set("state")}   placeholder="State"          className="input-neon text-xs" />
                  <input value={form.country} onChange={set("country")} placeholder="Country"        className="input-neon text-xs" />
                </div>
              </div>

              <NeonButton variant="purple" fullWidth size="lg" onClick={() => { if (validate()) setStep(1); }}>
                Next: Upload Evidence →
              </NeonButton>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 1: Files */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard padding="p-6" className="space-y-5">
              <div>
                <h3 className="text-gray-800 font-semibold">Upload Evidence</h3>
                <p className="text-gray-400 text-xs mt-1">Add photos, videos, or PDF documents supporting your claim (optional, max {MAX_FILES} files)</p>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-purple-400/40 rounded-2xl p-10 text-center cursor-pointer transition-all group"
              >
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf"
                  onChange={handleFiles} className="hidden" />
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📎</div>
                <p className="text-gray-600 text-sm font-medium">Click to browse files</p>
                <p className="text-gray-400 text-xs mt-1">JPEG, PNG, WEBP, GIF, MP4, MOV, PDF · Max {MAX_MB}MB each</p>
              </div>

              {/* File previews */}
              {files.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs mb-3">{files.length} file(s) selected</p>
                  <AnimatePresence>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {files.map((f) => <FilePreview key={f.name} file={f} onRemove={removeFile} />)}
                    </div>
                  </AnimatePresence>
                </div>
              )}

              <div className="flex gap-3">
                <NeonButton variant="ghost" fullWidth onClick={() => setStep(0)}>← Back</NeonButton>
                <NeonButton variant="purple" fullWidth size="lg" onClick={() => setStep(2)}>
                  Next: Review →
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard padding="p-6" className="space-y-5">
              <h3 className="text-gray-800 font-semibold">Review & Submit</h3>

              <div className="space-y-3">
                {[
                  { label: "Policy",       val: selectedPolicy?.policySnapshot.name },
                  { label: "Title",        val: form.title },
                  { label: "Incident Date",val: form.incidentDate },
                  { label: "Claim Amount", val: formatCurrency(Number(form.claimAmount)) },
                  { label: "Location",     val: [form.city, form.state, form.country].filter(Boolean).join(", ") || "Not provided" },
                  { label: "Attachments",  val: `${files.length} file(s)` },
                ].map(({ label, val }) => (
                  <div key={label} className="flex gap-3 p-3 glass-light border border-gray-200 rounded-xl">
                    <span className="text-gray-400 text-xs w-28 flex-shrink-0">{label}</span>
                    <span className="text-gray-800 text-xs font-medium">{val}</span>
                  </div>
                ))}
                <div className="p-3 glass-light border border-gray-200 rounded-xl">
                  <span className="text-gray-400 text-xs">Description</span>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-3">{form.description}</p>
                </div>
              </div>

              {/* Fraud warning */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-600 text-xs leading-relaxed">
                  By submitting this claim, you confirm that all information provided is accurate and truthful. Fraudulent claims are subject to legal action.
                </p>
              </div>

              <div className="flex gap-3">
                <NeonButton variant="ghost" fullWidth onClick={() => setStep(1)}>← Back</NeonButton>
                <NeonButton variant="purple" fullWidth size="lg" loading={submitting} onClick={handleSubmit}>
                  Submit Claim
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubmitClaim;
