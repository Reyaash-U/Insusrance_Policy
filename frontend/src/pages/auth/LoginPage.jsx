import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  loginUser, fetchCurrentUser, selectIsActionLoading, selectAuthError,
  selectIsAuthenticated, clearError,
} from "../../store/authSlice.js";
import { getRoleHome } from "../../routes/RoleRoute.jsx";
import { selectUser } from "../../store/authSlice.js";
import NeonButton from "../../components/common/NeonButton.jsx";
import { User, Search, Zap, Lock } from "lucide-react";

const InputField = ({ label, type = "text", value, onChange, placeholder, icon, error }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 tracking-wide">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{icon}</span>
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input-neon pl-10 ${isPassword ? "pr-12" : ""} ${error ? "border-red-300 focus:border-red-400" : ""}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((p) => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[10px] font-semibold tracking-wider">
            {show ? "HIDE" : "SHOW"}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
};

const DEMO_ACCOUNTS = [
  { label: "Customer",  email: "customer@demo.com", password: "Demo@1234", Icon: User,   color: "from-purple-400 to-blue-400",   badge: "bg-purple-50 text-purple-600" },
  { label: "Adjuster",  email: "adjuster@demo.com", password: "Demo@1234", Icon: Search, color: "from-amber-400 to-orange-400",  badge: "bg-amber-50  text-amber-600"  },
  { label: "Admin",     email: "admin@insurex.com", password: "Admin@123", Icon: Zap,    color: "from-red-400    to-rose-400",    badge: "bg-red-50    text-red-600"    },
];

const LoginPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isLoading = useSelector(selectIsActionLoading);
  const error     = useSelector(selectAuthError);
  const isAuth    = useSelector(selectIsAuthenticated);
  const user      = useSelector(selectUser);
  const [form, setForm] = useState({ email: "", password: "" });
  const from = location.state?.from?.pathname || null;

  useEffect(() => {
    if (isAuth && user) navigate(from || getRoleHome(user.role), { replace: true });
  }, [isAuth, user, navigate, from]);

  useEffect(() => {
    if (error) toast.error(error);
    return () => dispatch(clearError());
  }, [error, dispatch]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error("Please fill in all fields."); return; }
    const result = await dispatch(loginUser(form));
    if (!result.error) {
      await dispatch(fetchCurrentUser());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #eef2ff 0%, #faf5ff 50%, #f0fdfa 100%)" }}>

      {/* Floating blobs */}
      <motion.div animate={{ y: [0, -18, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
      <motion.div animate={{ y: [0, 14, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-10 right-10 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)" }} />
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)" }} />
      <div className="bg-grid absolute inset-0" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}>
            <span className="text-white font-bold text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>IX</span>
          </motion.div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: "'Syne', sans-serif" }}>InsureX</h1>
          <p className="text-gray-400 text-sm mt-1">Intelligent Insurance Platform</p>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl p-8"
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 8px 40px rgba(99,102,241,0.1), 0 2px 8px rgba(0,0,0,0.04)",
          }}>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-6">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Email Address" type="email" value={form.email}
              onChange={set("email")} placeholder="you@example.com" icon={<User size={14} />} />
            <InputField label="Password" type="password" value={form.password}
              onChange={set("password")} placeholder="Your password" icon={<Lock size={14} />} />

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-xs text-purple-500 hover:text-blue-500 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            <NeonButton type="submit" variant="purple" fullWidth loading={isLoading} size="lg">
              Sign In
            </NeonButton>
          </form>

          <div className="flex items-center gap-3 my-6">
            <hr className="flex-1 divider" />
            <span className="text-gray-300 text-xs font-medium">or try a demo</span>
            <hr className="flex-1 divider" />
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((d) => (
              <motion.button
                key={d.label}
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setForm({ email: d.email, password: d.password })}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(99,102,241,0.1)",
                  boxShadow: "0 1px 4px rgba(99,102,241,0.06)",
                }}
              >
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${d.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <d.Icon size={14} className="text-white" />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-gray-700">{d.label}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${d.badge}`}>{d.email}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-center text-gray-400 text-sm mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-purple-500 hover:text-blue-500 font-semibold transition-colors">
            Create one
          </Link>
        </motion.p>
      </div>
    </div>
  );
};

export default LoginPage;
