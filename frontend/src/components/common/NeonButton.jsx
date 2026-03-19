import { motion } from "framer-motion";
import Loader from "./Loader.jsx";

const NeonButton = ({
  children,
  variant   = "purple",
  size      = "md",
  loading   = false,
  disabled  = false,
  fullWidth = false,
  type      = "button",
  onClick,
  className = "",
  icon,
}) => {
  const variantClasses = {
    blue:   "btn-neon btn-neon-blue",
    purple: "btn-neon btn-neon-purple",
    cyan:   "btn-neon btn-neon-cyan",
    ghost:  "btn-neon btn-ghost",
    danger: "btn-neon bg-gradient-to-r from-red-500 to-rose-600 text-white border border-red-200 shadow-md hover:shadow-red-200 hover:shadow-lg",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={[
        variantClasses[variant] || variantClasses.purple,
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
        "flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-250",
        className,
      ].join(" ")}
    >
      {loading ? (
        <Loader size="sm" />
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default NeonButton;
