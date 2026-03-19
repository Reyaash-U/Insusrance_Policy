import { useEffect } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyPolicies, selectMyPolicies, selectPolicyLoading } from "../../store/policySlice.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";
import { Heart, Car, Home, Leaf, Plane, Briefcase, Circle, Shield, Clock, Calendar } from "lucide-react";

const CAT_ICON_MAP = { health: Heart, auto: Car, home: Home, life: Leaf, travel: Plane, business: Briefcase, other: Circle };
const CatIcon = ({ cat, size = 20 }) => { const I = CAT_ICON_MAP[cat] || Shield; return <I size={size} className="text-gray-500" />; };
const STATUS_CONFIG = {
  active:    { cls: "badge-active",   label: "Active" },
  expired:   { cls: "badge-expired",  label: "Expired" },
  cancelled: { cls: "badge-rejected", label: "Cancelled" },
  suspended: { cls: "badge-under-review", label: "Suspended" },
};

const PolicyDetailCard = ({ p, idx }) => {
  const cfg      = STATUS_CONFIG[p.status] || STATUS_CONFIG.expired;
  const pct      = Math.min(100, ((p.totalClaimedAmount || 0) / p.policySnapshot.maxClaimAmount) * 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(p.endDate) - new Date()) / 86400000));

  return (
    <GlassCard
      delay={idx * 0.06}
      glow={p.status === "active" ? "blue" : "none"}
      className="flex flex-col"
      padding="p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl glass-light border border-gray-200 flex items-center justify-center flex-shrink-0">
            <CatIcon cat={p.policySnapshot.category} size={20} />
          </div>
          <div>
            <h3 className="text-gray-800 font-semibold text-sm">{p.policySnapshot.name}</h3>
            <p className="text-gray-400 text-[10px] capitalize">{p.policySnapshot.category}</p>
          </div>
        </div>
        <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
      </div>

      {/* Coverage bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-gray-400">Coverage used</span>
          <span className="text-gray-600 font-mono">{pct.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-white/6 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, delay: idx * 0.1 }}
            className={`h-full rounded-full ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-blue-500"}`}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>{formatCurrency(p.totalClaimedAmount || 0)} claimed</span>
          <span>{formatCurrency(p.remainingCoverageAmount)} remaining</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        {[
          { label: "Max Coverage",     val: formatCurrency(p.policySnapshot.maxClaimAmount) },
          { label: "Monthly Premium",  val: formatCurrency(p.premiumDetails?.calculatedMonthlyPremium) },
          { label: "Start Date",       val: formatDate(p.startDate) },
          { label: "End Date",         val: formatDate(p.endDate) },
          { label: "Deductible",       val: formatCurrency(p.policySnapshot.deductible) },
          { label: "Risk Level",       val: <span className="capitalize">{p.riskLevel}</span> },
        ].map(({ label, val }) => (
          <div key={label} className="glass-light border border-gray-200 rounded-xl p-2.5">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider">{label}</p>
            <p className="text-gray-800 font-medium mt-0.5">{val}</p>
          </div>
        ))}
      </div>

      {/* Days remaining */}
      {p.status === "active" && (
        <div className={`flex items-center gap-2 p-3 rounded-xl ${daysLeft < 30 ? "bg-amber-500/10 border border-amber-500/20" : "glass-light border border-gray-200"}`}>
          {daysLeft < 30 ? <Clock size={14} className="text-amber-500 flex-shrink-0" /> : <Calendar size={14} className="text-gray-400 flex-shrink-0" />}
          <p className={`text-xs ${daysLeft < 30 ? "text-amber-500" : "text-gray-600"}`}>
            {daysLeft === 0 ? "Expiring today!" : `${daysLeft} days remaining`}
          </p>
        </div>
      )}

      {/* Add-ons */}
      {p.selectedAddOns?.length > 0 && (
        <div className="mt-3">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1.5">Active Add-ons</p>
          <div className="flex flex-wrap gap-1">
            {p.selectedAddOns.map((a) => (
              <span key={a.name} className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-600/20 text-teal-600">
                {a.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};

const MyPolicies = () => {
  const dispatch  = useDispatch();
  const policies  = useSelector(selectMyPolicies);
  const isLoading = useSelector(selectPolicyLoading);

  useEffect(() => { dispatch(fetchMyPolicies({ limit: 20 })); }, [dispatch]);

  const active  = policies.filter((p) => p.status === "active");
  const others  = policies.filter((p) => p.status !== "active");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">My Policies</h1>
        <p className="text-gray-400 text-sm mt-1">{policies.length} total · {active.length} active</p>
      </motion.div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map((i) => <div key={i} className="skeleton h-80 rounded-2xl" />)}
        </div>
      ) : policies.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Shield size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-gray-800 font-semibold mb-2">No policies yet</h3>
          <p className="text-gray-400 text-sm">Browse our marketplace to find the right plan for you.</p>
        </GlassCard>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-4">Active ({active.length})</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {active.map((p, i) => <PolicyDetailCard key={p._id} p={p} idx={i} />)}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section>
              <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-4">Inactive ({others.length})</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {others.map((p, i) => <PolicyDetailCard key={p._id} p={p} idx={i} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default MyPolicies;
