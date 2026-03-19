import { useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import { purchasePolicy } from "../../store/policySlice.js";
import { selectPolicyLoading } from "../../store/policySlice.js";
import NeonButton from "../common/NeonButton.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { X, PartyPopper } from "lucide-react";

const RISK_OPTS = [
  { value: "low",    label: "Low Risk",    color: "bg-emerald-400", desc: "No major risk factors" },
  { value: "medium", label: "Medium Risk", color: "bg-amber-400",   desc: "Some existing risk factors" },
  { value: "high",   label: "High Risk",   color: "bg-red-400",     desc: "Significant risk factors present" },
];

const PremiumCalculator = ({ policy, onClose }) => {
  const dispatch    = useDispatch();
  const isSubmitting = useSelector(selectPolicyLoading);

  const [form, setForm]     = useState({ customerAge: "", riskLevel: "medium", assetValue: "", selectedAddOns: [], startDate: "" });
  const [preview, setPreview] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [step, setStep]     = useState("form"); // form | preview | success

  const set = (field) => (val) => {
    setForm((p) => ({ ...p, [field]: val }));
    setPreview(null);
  };

  const toggleAddOn = (name) => {
    setForm((p) => ({
      ...p,
      selectedAddOns: p.selectedAddOns.includes(name)
        ? p.selectedAddOns.filter((n) => n !== name)
        : [...p.selectedAddOns, name],
    }));
    setPreview(null);
  };

  const calculate = async () => {
    if (!form.customerAge || !form.assetValue) { toast.error("Please fill in your age and asset value."); return; }
    try {
      setCalcLoading(true);
      const { data } = await api.post("/policies/calculate-premium", {
        policyId:      policy._id,
        customerAge:   Number(form.customerAge),
        riskLevel:     form.riskLevel,
        assetValue:    Number(form.assetValue),
        selectedAddOns: form.selectedAddOns,
      });
      setPreview(data.data);
      setStep("preview");
    } catch (err) {
      toast.error(err.response?.data?.message || "Calculation failed.");
    } finally {
      setCalcLoading(false);
    }
  };

  const purchase = async () => {
    if (!form.startDate) { toast.error("Please select a start date."); return; }
    const result = await dispatch(purchasePolicy({
      policyId:      policy._id,
      customerAge:   Number(form.customerAge),
      riskLevel:     form.riskLevel,
      assetValue:    Number(form.assetValue),
      selectedAddOns: form.selectedAddOns,
      startDate:     form.startDate,
    }));
    if (!result.error) { toast.success("Policy purchased successfully!"); setStep("success"); }
    else toast.error(result.payload);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.25 }}
        className="glass-strong border border-gray-200 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl"
      >
        {/* Header */}
        <div className="sticky top-0 glass border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <h2 className="text-gray-800 font-semibold">Premium Calculator</h2>
            <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[260px]">{policy.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl glass-light border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5">
          {step === "success" ? (
            <div className="text-center py-8">
              <motion.div animate={{ scale: [1,1.1,1] }} transition={{ duration:1, repeat:2 }} className="flex justify-center mb-4"><PartyPopper size={52} className="text-purple-500" /></motion.div>
              <h3 className="text-xl font-bold gradient-text mb-2">Policy Purchased!</h3>
              <p className="text-gray-600 text-sm mb-6">Your {policy.name} policy is now active. You'll receive a confirmation email shortly.</p>
              <NeonButton variant="purple" fullWidth onClick={onClose}>Close</NeonButton>
            </div>
          ) : step === "preview" && preview ? (
            <>
              {/* Premium breakdown */}
              <div className="glass-light border border-gray-200 rounded-2xl p-5 space-y-3">
                <h3 className="text-gray-800 font-semibold text-sm">Premium Breakdown</h3>
                {[
                  ["Base Premium",   formatCurrency(preview.premiumDetails.basePremium)],
                  ["Age Factor",     `×${preview.premiumDetails.ageFactor.toFixed(2)}`],
                  ["Risk Factor",    `×${preview.premiumDetails.riskFactor.toFixed(2)}`],
                  ...(preview.premiumDetails.addOnsTotal > 0 ? [["Add-ons", formatCurrency(preview.premiumDetails.addOnsTotal)]] : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-600 font-mono">{val}</span>
                  </div>
                ))}
                <hr className="divider" />
                <div className="flex justify-between">
                  <span className="text-gray-800 font-semibold">Monthly Premium</span>
                  <span className="text-blue-500 font-bold text-lg">{formatCurrency(preview.premiumDetails.calculatedMonthlyPremium)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Total ({policy.durationMonths} months)</span>
                  <span className="text-emerald-500 font-semibold">{formatCurrency(preview.premiumDetails.totalPremiumPaid)}</span>
                </div>
              </div>

              {/* Start date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Policy Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="input-neon"
                />
              </div>

              <div className="flex gap-3">
                <NeonButton variant="ghost" fullWidth onClick={() => setStep("form")}>← Recalculate</NeonButton>
                <NeonButton variant="purple" fullWidth loading={isSubmitting} onClick={purchase}>
                  Purchase Policy
                </NeonButton>
              </div>
            </>
          ) : (
            <>
              {/* Age */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Your Age</label>
                <input type="number" min="18" max="99" value={form.customerAge}
                  onChange={(e) => set("customerAge")(e.target.value)}
                  placeholder="e.g. 32" className="input-neon" />
                <p className="text-gray-400 text-[10px]">Eligible age: {policy.minAge}–{policy.maxAge}</p>
              </div>

              {/* Risk */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Risk Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {RISK_OPTS.map((r) => (
                    <button key={r.value} onClick={() => set("riskLevel")(r.value)}
                      className={`p-3 rounded-xl text-center border transition-all text-xs ${
                        form.riskLevel === r.value
                          ? "border-purple-400 bg-purple-50 text-gray-800"
                          : "border-gray-200 glass-light text-gray-400 hover:border-white/15"
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${r.color} mx-auto mb-1`} />
                      <span className="font-medium">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Asset value */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Asset Value (₹)</label>
                <input type="number" min="0" value={form.assetValue}
                  onChange={(e) => set("assetValue")(e.target.value)}
                  placeholder="e.g. 50000" className="input-neon" />
              </div>

              {/* Add-ons */}
              {policy.availableAddOns?.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Optional Add-ons</label>
                  <div className="space-y-2">
                    {policy.availableAddOns.map((a) => (
                      <button key={a.name} onClick={() => toggleAddOn(a.name)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${
                          form.selectedAddOns.includes(a.name)
                            ? "border-teal-600/40 bg-teal-500/8 text-gray-800"
                            : "border-gray-200 glass-light text-gray-600 hover:border-white/15"
                        }`}
                      >
                        <span>{a.name}</span>
                        <span className="text-gray-400 text-xs">+{(a.extraPremiumRate * 100).toFixed(0)}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <NeonButton variant="purple" fullWidth size="lg" loading={calcLoading} onClick={calculate}>
                Calculate Premium →
              </NeonButton>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PremiumCalculator;
