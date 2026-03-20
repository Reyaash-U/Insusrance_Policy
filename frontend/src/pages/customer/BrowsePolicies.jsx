import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchPolicies, selectPolicies, selectPolicyMeta, selectPolicyLoading } from "../../store/policySlice.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import NeonButton from "../../components/common/NeonButton.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import PremiumCalculator from "../../components/premium/PremiumCalculator.jsx";
import {
  LayoutGrid, Heart, Car, Home, Star, Plane, Briefcase, Circle, Search, Shield,
} from "lucide-react";
import BackButton from "../../components/common/BackButton.jsx";

const CATEGORIES = ["all","health","auto","home","life","travel","business","other"];
const CAT_ICON_MAP = { all: LayoutGrid, health: Heart, auto: Car, home: Home, life: Star, travel: Plane, business: Briefcase, other: Circle };
const CatIcon = ({ cat, size = 14 }) => { const I = CAT_ICON_MAP[cat] || Circle; return <I size={size} />; };
const glows      = ["blue","purple","cyan","green","blue","purple","cyan","none"];

const PolicyCard = ({ policy, idx, onCalculate }) => {
  const coverageTotal = policy.coverages?.reduce((s, c) => s + c.limit, 0) || 0;
  const glow = glows[idx % glows.length];

  return (
    <GlassCard glow={glow} delay={idx * 0.05} tilt hover className="flex flex-col h-full group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center glass-light border border-gray-200 text-gray-500">
          <CatIcon cat={policy.category} size={22} />
        </div>
        <div className="flex items-center gap-2">
          {policy.isFeatured && (
            <span className="badge badge-approved text-[9px]">Featured</span>
          )}
          <span className="badge badge-active text-[9px] capitalize">{policy.category}</span>
        </div>
      </div>

      <h3 className="text-gray-800 font-semibold text-base mb-1 group-hover:gradient-text transition-all duration-300">
        {policy.name}
      </h3>
      <p className="text-gray-400 text-xs leading-relaxed mb-4 flex-1 line-clamp-3">
        {policy.description}
      </p>

      {/* Coverage chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {policy.coverages?.slice(0, 3).map((c) => (
          <span key={c.name} className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 border border-gray-200 text-gray-600">
            {c.name}
          </span>
        ))}
        {policy.coverages?.length > 3 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 border border-gray-200 text-gray-400">
            +{policy.coverages.length - 3} more
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl glass-light border border-gray-200">
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Base Premium</p>
          <p className="text-blue-500 font-bold text-sm mt-0.5">{formatCurrency(policy.basePremium)}<span className="text-gray-400 font-normal text-[10px]">/mo</span></p>
        </div>
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Max Coverage</p>
          <p className="text-emerald-500 font-bold text-sm mt-0.5">{formatCurrency(policy.maxClaimAmount)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Duration</p>
          <p className="text-gray-600 text-sm mt-0.5">{policy.durationMonths} months</p>
        </div>
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Total Coverage</p>
          <p className="text-gray-600 text-sm mt-0.5">{formatCurrency(coverageTotal)}</p>
        </div>
      </div>

      {/* Add-ons preview */}
      {policy.availableAddOns?.length > 0 && (
        <div className="mb-4">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1.5">Available Add-ons</p>
          <div className="flex flex-wrap gap-1">
            {policy.availableAddOns.map((a) => (
              <span key={a.name} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-500">
                {a.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <NeonButton variant="purple" fullWidth onClick={() => onCalculate(policy)}>
        Calculate & Purchase →
      </NeonButton>
    </GlassCard>
  );
};

const BrowsePolicies = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const policies   = useSelector(selectPolicies);
  const meta       = useSelector(selectPolicyMeta);
  const isLoading  = useSelector(selectPolicyLoading);

  const [category, setCategory] = useState("all");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [calcPolicy, setCalcPolicy] = useState(null);

  useEffect(() => {
    dispatch(fetchPolicies({
      page,
      limit: 9,
      ...(category !== "all" && { category }),
      ...(search && { search }),
    }));
  }, [dispatch, category, page, search]);

  const handleCategoryChange = (cat) => { setCategory(cat); setPage(1); };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <BackButton />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Policy Marketplace</h1>
        <p className="text-gray-400 text-sm mt-1">Explore our range of insurance plans tailored for you</p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search policies by name, category, or keyword…"
          className="input-neon pl-10 py-3 text-sm"
        />
      </motion.div>

      {/* Category filter */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-2"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              category === cat
                ? "bg-purple-100 border border-purple-400 text-purple-500 shadow-sm"
                : "glass-light border border-gray-200 text-gray-600 hover:text-gray-800 hover:border-white/15"
            }`}
          >
            <CatIcon cat={cat} size={13} />
            <span className="capitalize">{cat === "all" ? "All Plans" : cat}</span>
          </button>
        ))}
      </motion.div>

      {/* Meta */}
      {meta && !isLoading && (
        <p className="text-gray-400 text-xs">{meta.total} plans found</p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton h-96 rounded-2xl" />)}
        </div>
      ) : policies.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Search size={48} className="text-gray-200" />
          <p className="text-gray-600">No policies found matching your criteria.</p>
          <NeonButton variant="ghost" onClick={() => { setCategory("all"); setSearch(""); }}>
            Clear filters
          </NeonButton>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {policies.map((p, i) => (
            <PolicyCard key={p._id} policy={p} idx={i} onCalculate={setCalcPolicy} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <NeonButton variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</NeonButton>
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                p === page ? "bg-purple-100 border border-purple-400 text-purple-500" : "glass-light border border-gray-200 text-gray-400 hover:text-gray-600"
              }`}
            >{p}</button>
          ))}
          <NeonButton variant="ghost" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</NeonButton>
        </div>
      )}

      {/* Premium Calculator Modal */}
      <AnimatePresence>
        {calcPolicy && (
          <PremiumCalculator policy={calcPolicy} onClose={() => setCalcPolicy(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrowsePolicies;
