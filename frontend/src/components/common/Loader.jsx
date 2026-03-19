import { motion } from "framer-motion";

const Loader = ({ fullScreen = false, size = "md", text = "" }) => {
  const sizes = { sm: "w-5 h-5", md: "w-10 h-10", lg: "w-14 h-14" };

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <motion.div
          className={`${sizes[size]} rounded-full`}
          style={{ border: "2.5px solid rgba(139,92,246,0.15)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full"
            style={{ borderTop: "2.5px solid #8b5cf6", borderRight: "2.5px solid transparent",
                     borderBottom: "2.5px solid transparent", borderLeft: "2.5px solid transparent" }} />
        </motion.div>
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{ background: "rgba(139,92,246,0.08)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </div>
      {text && <p className="text-gray-500 text-sm animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: "linear-gradient(135deg, #eef2ff 0%, #faf5ff 40%, #f0fdfa 100%)" }}>
        <div className="flex flex-col items-center gap-5">
          {spinner}
          <motion.p
            className="text-gray-400 text-xs tracking-widest uppercase font-medium"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            InsureX
          </motion.p>
        </div>
      </div>
    );
  }

  return spinner;
};

export default Loader;
