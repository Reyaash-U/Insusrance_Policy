import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/axios.js";
import NeonButton from "../../components/common/NeonButton.jsx";
import Loader from "../../components/common/Loader.jsx";
import { PartyPopper, XCircle } from "lucide-react";

const VerifyEmailPage = () => {
  const [params]  = useSearchParams();
  const token     = params.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("No verification token found in the URL."); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(({ data }) => { setStatus("success"); setMessage(data.message); })
      .catch((err) => { setStatus("error"); setMessage(err.response?.data?.message || "Verification failed."); });
  }, [token]);

  const IconMap = { success: PartyPopper, error: XCircle };
  const borders = { success: "border-emerald-200 shadow-md", error: "border-red-200 shadow-md", loading: "border-gray-200" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-100" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-50 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`glass border ${borders[status]} rounded-3xl p-10 text-center max-w-md w-full relative z-10`}
      >
        {status === "loading" ? (
          <div className="flex flex-col items-center gap-4">
            <Loader size="lg" />
            <p className="text-gray-600 text-sm">Verifying your email…</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex justify-center mb-4"
            >
              {IconMap[status] && (() => { const I = IconMap[status]; return <I size={48} className={status === "success" ? "text-emerald-500" : "text-red-500"} />; })()}
            </motion.div>
            <h2 className={`text-xl font-bold mb-2 ${status === "success" ? "gradient-text" : "text-red-500"}`}>
              {status === "success" ? "Email Verified!" : "Verification Failed"}
            </h2>
            <p className="text-gray-600 text-sm mb-6">{message}</p>
            <Link to="/login">
              <NeonButton variant={status === "success" ? "purple" : "ghost"} fullWidth>
                {status === "success" ? "Go to Login →" : "Back to Login"}
              </NeonButton>
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
