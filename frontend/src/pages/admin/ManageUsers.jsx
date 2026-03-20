import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import GlassCard from "../../components/common/GlassCard.jsx";
import NeonButton from "../../components/common/NeonButton.jsx";
import { fromNow } from "../../utils/formatDate.js";
import BackButton from "../../components/common/BackButton.jsx";

const ROLE_COLORS = { admin:"text-red-500", adjuster:"text-amber-500", agent:"text-teal-600", customer:"text-emerald-500" };

const ManageUsers = () => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/admin/users", { params: { limit: 50, search } });
      setUsers(data.data || []);
    } catch { toast.error("Failed to load users."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const toggleStatus = async (userId, isActive) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`);
      setUsers((p) => p.map((u) => u._id === userId ? { ...u, isActive: !isActive } : u));
      toast.success(`User ${isActive ? "deactivated" : "activated"}.`);
    } catch { toast.error("Action failed."); }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <BackButton />
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Manage Users</h1>
        <p className="text-gray-400 text-sm mt-1">{users.length} users</p>
      </motion.div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
        className="input-neon max-w-md" />

      <GlassCard padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["User","Email","Role","Status","Joined","Actions"].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-gray-400 text-xs font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? [1,2,3,4,5].map((i) => (
                    <tr key={i}><td colSpan={6} className="px-5 py-3"><div className="skeleton h-8 rounded-lg" /></td></tr>
                  ))
                : users.map((u, i) => (
                    <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-white/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/40 to-blue-500/40 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <span className="text-gray-800 font-medium">{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold capitalize text-xs ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`badge ${u.isActive ? "badge-active" : "badge-rejected"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{fromNow(u.createdAt)}</td>
                      <td className="px-5 py-3">
                        <NeonButton variant={u.isActive ? "danger" : "cyan"} size="sm"
                          onClick={() => toggleStatus(u._id, u.isActive)}>
                          {u.isActive ? "Deactivate" : "Activate"}
                        </NeonButton>
                      </td>
                    </motion.tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default ManageUsers;
