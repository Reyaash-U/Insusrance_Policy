import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import NeonButton from "../../components/common/NeonButton.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { fromNow } from "../../utils/formatDate.js";
import { Heart, Car, Home, Leaf, Plane, Building2, Shield, X } from "lucide-react";

const CATEGORY_COLORS = {
  health:     "text-emerald-500",
  auto:       "text-blue-500",
  home:       "text-teal-600",
  life:       "text-purple-500",
  travel:     "text-amber-500",
  business:   "text-red-500",
};

const CATEGORY_ICON_MAP = { health: Heart, auto: Car, home: Home, life: Leaf, travel: Plane, business: Building2 };
const CatIcon = ({ cat }) => { const I = CATEGORY_ICON_MAP[cat] || Shield; return <I size={12} />; };

/* ── Create / Edit Modal ──────────────────────────────────────── */
const defaultForm = {
  name: "", description: "", category: "health", basePremium: "",
  maxClaimAmount: "", deductible: "", durationMonths: "12",
  waitingPeriodDays: "0", minAge: "18", maxAge: "99",
  ageFactor: "1", riskFactor: "1", assetValueRate: "0",
  tags: "", isActive: true,
};

const PolicyModal = ({ policy, onClose, onSaved }) => {
  const isEdit = !!policy;
  const [form, setForm] = useState(isEdit ? {
    name:             policy.name,
    description:      policy.description,
    category:         policy.category,
    basePremium:      policy.basePremium,
    maxClaimAmount:   policy.maxClaimAmount,
    deductible:       policy.deductible || "",
    durationMonths:   policy.durationMonths || "12",
    waitingPeriodDays:policy.waitingPeriodDays || "0",
    minAge:           policy.minAge || "18",
    maxAge:           policy.maxAge || "99",
    ageFactor:        policy.ageFactor || "1",
    riskFactor:       policy.riskFactor || "1",
    assetValueRate:   policy.assetValueRate || "0",
    tags:             (policy.tags || []).join(", "),
    isActive:         policy.isActive ?? true,
  } : defaultForm);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.basePremium || !form.maxClaimAmount) {
      toast.error("Name, base premium, and max claim amount are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        basePremium:       Number(form.basePremium),
        maxClaimAmount:    Number(form.maxClaimAmount),
        deductible:        Number(form.deductible) || 0,
        durationMonths:    Number(form.durationMonths),
        waitingPeriodDays: Number(form.waitingPeriodDays),
        minAge:            Number(form.minAge),
        maxAge:            Number(form.maxAge),
        ageFactor:         Number(form.ageFactor),
        riskFactor:        Number(form.riskFactor),
        assetValueRate:    Number(form.assetValueRate),
        tags:              form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (isEdit) {
        await api.put(`/policies/${policy._id}`, payload);
        toast.success("Policy updated.");
      } else {
        await api.post("/policies", payload);
        toast.success("Policy created.");
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed.");
    } finally { setSaving(false); }
  };

  const fields = [
    { key: "name",             label: "Name *",                 type: "text",   span: 2 },
    { key: "description",      label: "Description",            type: "textarea",span: 2 },
    { key: "category",         label: "Category",               type: "select", span: 1, opts: ["health","auto","home","life","travel","business"] },
    { key: "basePremium",      label: "Base Premium ($/mo) *",  type: "number", span: 1 },
    { key: "maxClaimAmount",   label: "Max Claim Amount ($) *", type: "number", span: 1 },
    { key: "deductible",       label: "Deductible ($)",         type: "number", span: 1 },
    { key: "durationMonths",   label: "Duration (months)",      type: "number", span: 1 },
    { key: "waitingPeriodDays",label: "Waiting Period (days)",  type: "number", span: 1 },
    { key: "minAge",           label: "Min Age",                type: "number", span: 1 },
    { key: "maxAge",           label: "Max Age",                type: "number", span: 1 },
    { key: "ageFactor",        label: "Age Factor",             type: "number", span: 1 },
    { key: "riskFactor",       label: "Risk Factor",            type: "number", span: 1 },
    { key: "assetValueRate",   label: "Asset Value Rate",       type: "number", span: 1 },
    { key: "tags",             label: "Tags (comma-separated)", type: "text",   span: 2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard padding="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold gradient-text">
              {isEdit ? "Edit Policy" : "Create Policy"}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fields.map(({ key, label, type, span, opts }) => (
                <div key={key} className={span === 2 ? "col-span-2" : ""}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                  {type === "textarea" ? (
                    <textarea
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      rows={3}
                      className="input-neon resize-none text-sm w-full"
                    />
                  ) : type === "select" ? (
                    <select
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      className="input-neon text-sm w-full"
                    >
                      {opts.map((o) => (
                        <option key={o} value={o} style={{ background: "#ffffff", color: "#1e1b4b" }} className="capitalize">{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      className="input-neon text-sm w-full"
                    />
                  )}
                </div>
              ))}

              <div className="col-span-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => set("isActive", !form.isActive)}
                  className={`w-10 h-6 rounded-full transition-all relative ${form.isActive ? "bg-emerald-500/60" : "bg-white/10"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.isActive ? "left-5" : "left-1"}`} />
                </button>
                <span className="text-sm text-gray-600">{form.isActive ? "Active (visible to customers)" : "Inactive (hidden)"}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <NeonButton type="submit" variant="cyan" fullWidth loading={saving}>
                {isEdit ? "Save Changes" : "Create Policy"}
              </NeonButton>
              <NeonButton type="button" variant="ghost" onClick={onClose}>Cancel</NeonButton>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
};

/* ── Main Page ────────────────────────────────────────────────── */
const AllPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState({ category: "", isActive: "" });
  const [modal,    setModal]    = useState(null); // null | "create" | policy object

  const load = () => {
    setLoading(true);
    api.get("/policies/admin/all", { params: { ...filter, limit: 100 } })
      .then(({ data }) => setPolicies(data.data || []))
      .catch(() => toast.error("Failed to load policies."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const toggleActive = async (policy) => {
    try {
      await api.put(`/policies/${policy._id}`, { isActive: !policy.isActive });
      setPolicies((p) => p.map((x) => x._id === policy._id ? { ...x, isActive: !x.isActive } : x));
      toast.success(`Policy ${policy.isActive ? "deactivated" : "activated"}.`);
    } catch { toast.error("Action failed."); }
  };

  const handleSaved = () => {
    setModal(null);
    load();
  };

  return (
    <>
      <AnimatePresence>
        {modal && (
          <PolicyModal
            policy={modal === "create" ? null : modal}
            onClose={() => setModal(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">All Policies</h1>
            <p className="text-gray-400 text-sm mt-1">{policies.length} policies</p>
          </div>
          <NeonButton variant="cyan" onClick={() => setModal("create")}>+ New Policy</NeonButton>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select value={filter.category} onChange={(e) => setFilter((p) => ({ ...p, category: e.target.value }))}
            className="input-neon max-w-[160px] text-sm">
            <option value="">All Categories</option>
            {["health","auto","home","life","travel","business"].map((c) => (
              <option key={c} value={c} style={{ background: "#ffffff", color: "#1e1b4b" }} className="capitalize">{c}</option>
            ))}
          </select>
          <select value={filter.isActive} onChange={(e) => setFilter((p) => ({ ...p, isActive: e.target.value }))}
            className="input-neon max-w-[140px] text-sm">
            <option value="">All Status</option>
            <option value="true"  style={{ background: "#ffffff", color: "#1e1b4b" }}>Active</option>
            <option value="false" style={{ background: "#ffffff", color: "#1e1b4b" }}>Inactive</option>
          </select>
        </div>

        <GlassCard padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {["Policy","Category","Base Premium","Max Claim","Duration","Status","Created","Actions"].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-gray-400 text-xs font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? [1,2,3,4,5].map((i) => (
                  <tr key={i}><td colSpan={8} className="px-5 py-3"><div className="skeleton h-8 rounded-lg" /></td></tr>
                )) : policies.map((p, i) => (
                  <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-white/60 transition-colors group">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-gray-800 font-medium">{p.name}</p>
                        <p className="text-gray-400 text-[10px] font-mono">{p.slug}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold capitalize flex items-center gap-1.5 ${CATEGORY_COLORS[p.category] || "text-gray-600"}`}>
                        <CatIcon cat={p.category} />
                        {p.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-blue-500 font-semibold">{formatCurrency(p.basePremium)}<span className="text-gray-400 text-[10px]">/mo</span></td>
                    <td className="px-5 py-3 text-gray-600">{formatCurrency(p.maxClaimAmount)}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{p.durationMonths}mo</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${p.isActive ? "badge-active" : "badge-rejected"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{fromNow(p.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal(p)}
                          className="text-teal-600 text-xs hover:underline"
                        >Edit</button>
                        <span className="text-white/20">|</span>
                        <button
                          onClick={() => toggleActive(p)}
                          className={`text-xs hover:underline ${p.isActive ? "text-red-500" : "text-emerald-500"}`}
                        >
                          {p.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </>
  );
};

export default AllPolicies;
