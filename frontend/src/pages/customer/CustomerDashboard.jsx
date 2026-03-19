import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyPolicies, selectMyPolicies, selectPolicyLoading } from "../../store/policySlice.js";
import { fetchMyClaims, selectClaims, selectClaimLoading } from "../../store/claimSlice.js";
import { selectUser } from "../../store/authSlice.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import NeonButton from "../../components/common/NeonButton.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate, fromNow } from "../../utils/formatDate.js";
import { STATUS_BADGE_CLASS, STATUS_LABELS } from "../../utils/roleHelpers.js";
import {
  Shield, Gem, ClipboardList, Circle, Heart, Car, Home, Star,
  Plane, Briefcase, ShoppingBag, PlusCircle,
} from "lucide-react";

const StatCard = ({ label, value, Icon, gradient, delay, sub }) => (
  <GlassCard delay={delay} tilt padding="p-5" className="flex items-start justify-between">
    <div>
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
    </div>
    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
      <Icon size={20} className="text-white" />
    </div>
  </GlassCard>
);

const ClaimStatusBar = ({ claims }) => {
  const total    = claims.length || 1;
  const approved = claims.filter((c) => c.status === "approved").length;
  const pending  = claims.filter((c) => ["submitted","under_review"].includes(c.status)).length;
  const rejected = claims.filter((c) => c.status === "rejected").length;

  return (
    <div className="space-y-2.5">
      {[
        { label: "Approved",    count: approved, color: "bg-emerald-400", pct: (approved/total)*100 },
        { label: "In Progress", count: pending,  color: "bg-amber-400",   pct: (pending/total)*100 },
        { label: "Rejected",    count: rejected, color: "bg-red-400",     pct: (rejected/total)*100 },
      ].map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="text-gray-400 text-xs w-20">{s.label}</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full ${s.color} rounded-full`} />
          </div>
          <span className="text-gray-500 text-xs w-4 text-right">{s.count}</span>
        </div>
      ))}
    </div>
  );
};

const CAT_ICON_MAP = { health: Heart, auto: Car, home: Home, life: Star, travel: Plane, business: Briefcase };
const CatIcon = ({ cat, size = 16 }) => { const I = CAT_ICON_MAP[cat] || Shield; return <I size={size} className="text-white" />; };
const catGrad = (cat) => ({ health:"from-red-400 to-pink-400", auto:"from-blue-400 to-cyan-400",
  home:"from-amber-400 to-orange-400", life:"from-purple-400 to-indigo-400",
  travel:"from-teal-400 to-cyan-400", business:"from-indigo-400 to-blue-400" })[cat] || "from-gray-400 to-gray-500";

const CustomerDashboard = () => {
  const dispatch = useDispatch();
  const user     = useSelector(selectUser);
  const policies = useSelector(selectMyPolicies);
  const claims   = useSelector(selectClaims);
  const polLoad  = useSelector(selectPolicyLoading);
  const clmLoad  = useSelector(selectClaimLoading);

  useEffect(() => {
    dispatch(fetchMyPolicies({ limit: 5 }));
    dispatch(fetchMyClaims({ limit: 5 }));
  }, [dispatch]);

  const activePolicies = policies.filter((p) => p.status === "active");
  const totalCoverage  = activePolicies.reduce((s, p) => s + (p.maxClaimAmount || p.policySnapshot?.maxClaimAmount || 0), 0);
  const openClaims     = claims.filter((c) => ["submitted","under_review"].includes(c.status));
  const latestClaim    = claims[0];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: "'Syne', sans-serif" }}>
            {greeting()}, {user?.firstName}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Here's your insurance overview for today</p>
        </div>
        <Link to="/submit-claim">
          <NeonButton variant="purple" icon="+">File a Claim</NeonButton>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Policies" value={activePolicies.length} Icon={Shield}        gradient="from-blue-400 to-indigo-500"   delay={0}    sub="currently active" />
        <StatCard label="Total Coverage"  value={formatCurrency(totalCoverage)} Icon={Gem}   gradient="from-purple-400 to-violet-500" delay={0.05} sub="max claimable" />
        <StatCard label="Open Claims"     value={openClaims.length}     Icon={ClipboardList} gradient="from-teal-400 to-cyan-500"      delay={0.1}  sub="awaiting review" />
        <StatCard label="Total Claims"    value={claims.length}         Icon={Circle}        gradient="from-gray-300 to-gray-400"      delay={0.15} sub="all time" />
      </div>

      {/* Middle row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active policies */}
        <GlassCard delay={0.2} className="lg:col-span-2" padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-700 font-bold text-sm">Active Policies</h2>
            <Link to="/my-policies" className="text-purple-500 text-xs hover:text-blue-500 font-semibold transition-colors">View all →</Link>
          </div>
          {polLoad ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : activePolicies.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Shield size={36} className="text-gray-200" />
              <p className="text-gray-400 text-sm">No active policies yet</p>
              <Link to="/policies"><NeonButton variant="purple" size="sm">Browse Plans</NeonButton></Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activePolicies.slice(0, 4).map((p, i) => {
                const max = p.maxClaimAmount || p.policySnapshot?.maxClaimAmount || 1;
                const pct = Math.min(100, ((p.totalClaimsAmount || 0) / max) * 100);
                const cat = p.policySnapshot?.category;
                return (
                  <motion.div key={p._id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-4 p-3 rounded-xl transition-all hover:shadow-md"
                    style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(99,102,241,0.08)" }}>
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${catGrad(cat)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <CatIcon cat={cat} size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 text-sm font-semibold truncate">{p.policySnapshot?.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-gray-400 text-[10px] flex-shrink-0">{pct.toFixed(0)}% used</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-gray-700 text-xs font-semibold">{formatCurrency(max)}</p>
                      <p className="text-gray-400 text-[10px]">Expires {formatDate(p.endDate, "MMM yyyy")}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Claims breakdown */}
        <GlassCard delay={0.25} padding="p-5">
          <h2 className="text-gray-700 font-bold text-sm mb-4">Claims Overview</h2>
          {claims.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <ClipboardList size={36} className="text-gray-200" />
              <p className="text-gray-400 text-sm">No claims filed yet</p>
              <Link to="/submit-claim"><NeonButton variant="cyan" size="sm">File a Claim</NeonButton></Link>
            </div>
          ) : (
            <>
              <ClaimStatusBar claims={claims} />
              <hr className="divider my-4" />
              {latestClaim && (
                <div>
                  <p className="text-gray-400 text-xs mb-2 font-medium">Latest Claim</p>
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(99,102,241,0.08)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-gray-700 text-xs font-semibold truncate">{latestClaim.title}</p>
                        <p className="text-gray-400 text-[10px] mt-0.5 font-mono">{latestClaim.claimNumber}</p>
                      </div>
                      <span className={`badge ${STATUS_BADGE_CLASS[latestClaim.status]} flex-shrink-0`}>
                        {STATUS_LABELS[latestClaim.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-teal-600 text-xs font-bold">{formatCurrency(latestClaim.claimAmount)}</span>
                      <span className="text-gray-400 text-[10px]">{fromNow(latestClaim.createdAt)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </GlassCard>
      </div>

      {/* Recent claims table */}
      <GlassCard delay={0.3} padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-700 font-bold text-sm">Recent Claims</h2>
          <Link to="/my-claims" className="text-purple-500 text-xs hover:text-blue-500 font-semibold transition-colors">View all →</Link>
        </div>
        {clmLoad ? (
          <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : claims.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No claims yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  {["Claim #","Title","Amount","Status","Filed"].map((h) => (
                    <th key={h} className="pb-3 text-gray-400 text-xs font-semibold uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claims.slice(0, 5).map((c, i) => (
                  <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-t border-gray-100 hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 pr-4 text-teal-600 font-mono text-xs font-semibold">{c.claimNumber}</td>
                    <td className="py-3 pr-4 text-gray-600 max-w-[180px] truncate">{c.title}</td>
                    <td className="py-3 pr-4 text-gray-800 font-bold">{formatCurrency(c.claimAmount)}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge ${STATUS_BADGE_CLASS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                    </td>
                    <td className="py-3 text-gray-400 text-xs">{fromNow(c.createdAt)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Browse Plans",  to: "/policies",     Icon: ShoppingBag,   gradient: "from-blue-400 to-indigo-500" },
          { label: "My Policies",   to: "/my-policies",  Icon: Shield,        gradient: "from-purple-400 to-violet-500" },
          { label: "File a Claim",  to: "/submit-claim", Icon: PlusCircle,    gradient: "from-teal-400 to-cyan-500" },
          { label: "My Claims",     to: "/my-claims",    Icon: ClipboardList, gradient: "from-gray-300 to-gray-400" },
        ].map((a, i) => (
          <Link key={a.to} to={a.to}>
            <GlassCard delay={0.35 + i * 0.05} padding="p-4" className="text-center group hover:shadow-lg">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center mx-auto mb-2.5 shadow-md`}>
                <a.Icon size={18} className="text-white" />
              </div>
              <p className="text-gray-500 text-xs font-semibold group-hover:text-gray-700 transition-colors">{a.label}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CustomerDashboard;
