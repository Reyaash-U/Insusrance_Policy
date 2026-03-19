import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";

const GlassCard = ({
  children,
  className   = "",
  tilt        = false,
  glow        = "none",
  hover       = true,
  onClick,
  padding     = "p-6",
  delay       = 0,
  ...rest
}) => {
  const ref  = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, { stiffness: 200, damping: 28 });
  const rotateY = useSpring(rawY, { stiffness: 200, damping: 28 });

  const glowClasses = {
    blue:   "border-blue-200/60   hover:border-blue-300/80   hover:shadow-blue-100",
    purple: "border-purple-200/60 hover:border-purple-300/80 hover:shadow-purple-100",
    cyan:   "border-teal-200/60   hover:border-teal-300/80   hover:shadow-teal-100",
    green:  "border-emerald-200/60 hover:border-emerald-300/80 hover:shadow-emerald-100",
    red:    "border-red-200/60    hover:border-red-300/80    hover:shadow-red-100",
    none:   "border-white/60      hover:border-white/80",
  };

  const handleMouseMove = (e) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    rawY.set(x * 8);
    rawX.set(-y * 8);
  };

  const handleMouseLeave = () => { rawX.set(0); rawY.set(0); };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: delay * 0.5, ease: "easeOut" }}
      style={tilt ? { rotateX, rotateY, transformStyle: "preserve-3d", willChange: "transform" } : {}}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={[
        "relative rounded-2xl border glass",
        padding,
        glowClasses[glow] || glowClasses.none,
        hover   ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" : "",
        onClick ? "cursor-pointer" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
