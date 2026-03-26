import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  registerUser, selectIsActionLoading, selectAuthError,
  clearError, clearRegistrationDone,
} from "../../store/authSlice.js";
import NeonButton from "../../components/common/NeonButton.jsx";
import { User, Briefcase, Search, PartyPopper } from "lucide-react";

const ROLES = [
  { value: "customer",  label: "Customer",        Icon: User,     desc: "Browse and purchase policies" },
  { value: "agent",     label: "Agent",            Icon: Briefcase, desc: "Manage client policies" },
  { value: "adjuster",  label: "Claims Adjuster",  Icon: Search,   desc: "Review and process claims" },
];

const steps = ["Account", "Personal", "Role"];

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: "8+ chars",     pass: password.length >= 8 },
    { label: "Uppercase",    pass: /[A-Z]/.test(password) },
    { label: "Number",       pass: /\d/.test(password) },
    { label: "Special char", pass: /[@$!%*?&_\-#^]/.test(password) },
  ];
  const score  = checks.filter((c) => c.pass).length;
  const colors = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-400"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const texts  = ["", "text-red-500", "text-amber-500", "text-blue-500", "text-emerald-500"];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1,2,3,4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-gray-200"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {checks.map((c) => (
            <span key={c.label} className={`text-[10px] flex items-center gap-1 ${c.pass ? "text-emerald-500" : "text-gray-400"}`}>
              <span>{c.pass ? "✓" : "○"}</span> {c.label}
            </span>
          ))}
        </div>
        <span className={`text-[10px] font-bold ${texts[score]}`}>{labels[score]}</span>
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const isLoading = useSelector(selectIsActionLoading);
  const error     = useSelector(selectAuthError);

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    password: "", confirmPassword: "", phone: "", role: "customer",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (!form.email) errs.email = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email.";
      if (!form.password) errs.password = "Password is required.";
      else if (form.password.length < 8) errs.password = "Min 8 characters.";
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match.";
    }
    if (step === 1) {
      if (!form.firstName) errs.firstName = "First name is required.";
      if (!form.lastName)  errs.lastName  = "Last name is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep()) setStep((p) => p + 1); };
  const back = () => setStep((p) => p - 1);

  const handleSubmit = async () => {
    const result = await dispatch(registerUser({
      firstName: form.firstName, lastName: form.lastName,
      email: form.email, password: form.password,
      role: form.role, phone: form.phone || undefined,
    }));
    if (!result.error) { setDone(true); dispatch(clearRegistrationDone()); }
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.8)",
    boxShadow: "0 8px 40px rgba(99,102,241,0.1)",
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #eef2ff 0%, #faf5ff 50%, #f0fdfa 100%)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl p-10 text-center max-w-md w-full" style={cardStyle}>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: 2 }} className="flex justify-center mb-4"><PartyPopper size={56} className="text-purple-500" /></motion.div>
        <h2 className="text-2xl font-bold gradient-text mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>You're registered!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your account has been created for <span className="text-teal-600 font-semibold">{form.email}</span>.
          You can now log in.
        </p>
        <NeonButton variant="purple" fullWidth onClick={() => navigate("/login")}>Go to Login</NeonButton>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #eef2ff 0%, #faf5ff 50%, #f0fdfa 100%)" }}>
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
      <div className="bg-grid absolute inset-0" />

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}>
              <span className="text-white font-bold">IX</span>
            </div>
            <span className="font-bold text-gray-800 text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>InsureX</span>
          </Link>
          <p className="text-gray-400 text-sm">Create your account in 3 simple steps</p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <motion.div animate={{ scale: i === step ? 1.1 : 1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i < step   ? "bg-emerald-100 border-2 border-emerald-400 text-emerald-600" :
                  i === step ? "bg-purple-100 border-2 border-purple-400 text-purple-600 shadow-md" :
                               "bg-white border-2 border-gray-200 text-gray-400"
                }`}>
                {i < step ? "✓" : i + 1}
              </motion.div>
              <span className={`text-xs hidden sm:block font-medium ${i === step ? "text-gray-700" : "text-gray-400"}`}>{s}</span>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 rounded-full ${i < step ? "bg-emerald-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}
          className="rounded-3xl p-8" style={cardStyle}>

          {/* Step 0 */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Account credentials</h2>
                <p className="text-gray-400 text-sm mt-1">Set up your login email and password</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Email Address</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com"
                  className={`input-neon ${errors.email ? "border-red-300" : ""}`} />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Password</label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Min 8 characters"
                    className={`input-neon pr-16 ${errors.password ? "border-red-300" : ""}`} />
                  <button type="button" onClick={() => setShowPwd((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[10px] font-semibold tracking-wider">
                    {showPwd ? "HIDE" : "SHOW"}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                <PasswordStrength password={form.password} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat your password"
                    className={`input-neon pr-16 ${errors.confirmPassword ? "border-red-300" : ""}`} />
                  <button type="button" onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[10px] font-semibold tracking-wider">
                    {showConfirm ? "HIDE" : "SHOW"}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
              </div>
              <NeonButton variant="purple" fullWidth size="lg" onClick={next}>Next →</NeonButton>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Personal information</h2>
                <p className="text-gray-400 text-sm mt-1">Tell us a bit about yourself</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">First Name</label>
                  <input value={form.firstName} onChange={set("firstName")} placeholder="Arjun"
                    className={`input-neon ${errors.firstName ? "border-red-300" : ""}`} />
                  {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Last Name</label>
                  <input value={form.lastName} onChange={set("lastName")} placeholder="Kumar"
                    className={`input-neon ${errors.lastName ? "border-red-300" : ""}`} />
                  {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Phone <span className="text-gray-300">(optional)</span></label>
                <input value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className="input-neon" />
              </div>
              <div className="flex gap-3">
                <NeonButton variant="ghost" fullWidth onClick={back}>← Back</NeonButton>
                <NeonButton variant="purple" fullWidth size="lg" onClick={next}>Next →</NeonButton>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Choose your role</h2>
                <p className="text-gray-400 text-sm mt-1">This determines your dashboard and permissions</p>
              </div>
              <div className="space-y-2.5">
                {ROLES.map((r) => (
                  <motion.button key={r.value} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      form.role === r.value
                        ? "border-purple-300 bg-purple-50 shadow-md"
                        : "border-gray-200 bg-white/60 hover:border-gray-300"
                    }`}>
                    <r.Icon size={22} className="text-gray-600" />
                    <div>
                      <p className="text-gray-800 text-sm font-semibold">{r.label}</p>
                      <p className="text-gray-400 text-xs">{r.desc}</p>
                    </div>
                    {form.role === r.value && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shadow-sm">
                        <span className="text-white text-[10px]">✓</span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-3">
                <NeonButton variant="ghost" fullWidth onClick={back}>← Back</NeonButton>
                <NeonButton variant="purple" fullWidth size="lg" loading={isLoading} onClick={handleSubmit}>
                  Create Account
                </NeonButton>
              </div>
            </div>
          )}
        </motion.div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-500 hover:text-blue-500 font-semibold transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
