/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // ─── Light Mode Color Palette ────────────────────────
      colors: {
        // Surface hierarchy (light)
        void:   "#f0f4ff",
        abyss:  "#f5f7ff",
        deep:   "#eef2ff",
        panel:  "#f8faff",
        card:   "#ffffff",
        border: "rgba(99,102,241,0.12)",

        // Accent palette (kept vibrant, works on light too)
        neon: {
          blue:   "#3b82f6",
          purple: "#8b5cf6",
          cyan:   "#14b8a6",
          pink:   "#ec4899",
          green:  "#10b981",
          amber:  "#f59e0b",
          red:    "#ef4444",
        },

        // Soft glow variants
        glow: {
          blue:   "rgba(59,130,246,0.2)",
          purple: "rgba(139,92,246,0.2)",
          cyan:   "rgba(20,184,166,0.2)",
          pink:   "rgba(236,72,153,0.2)",
          green:  "rgba(16,185,129,0.2)",
          red:    "rgba(239,68,68,0.2)",
        },

        // Text hierarchy (light mode)
        text: {
          primary:   "#1e1b4b",
          secondary: "#4b5563",
          muted:     "#9ca3af",
          accent:    "#8b5cf6",
        },
      },

      // ─── Typography ─────────────────────────────────────
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Syne", "Inter", "sans-serif"],
      },

      // ─── Glassmorphism Blur ──────────────────────────────
      backdropBlur: {
        xs: "2px", sm: "4px", md: "8px", lg: "16px", xl: "24px",
      },

      // ─── Animations ──────────────────────────────────────
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.5" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-10px)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "gradient-shift": {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        "pulse-glow":     "pulse-glow 2s ease-in-out infinite",
        "float":          "float 6s ease-in-out infinite",
        "float-slow":     "float 9s ease-in-out infinite",
        "shimmer":        "shimmer 2.5s linear infinite",
        "fade-in-up":     "fade-in-up 0.5s ease-out forwards",
        "fade-in":        "fade-in 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out forwards",
        "gradient-shift": "gradient-shift 6s ease infinite",
      },

      // ─── Border Radius ───────────────────────────────────
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },

      // ─── Box Shadow (soft, light-mode) ───────────────────
      boxShadow: {
        "glow-blue":   "0 4px 20px rgba(59,130,246,0.2),  0 1px 4px rgba(59,130,246,0.1)",
        "glow-purple": "0 4px 20px rgba(139,92,246,0.2),  0 1px 4px rgba(139,92,246,0.1)",
        "glow-cyan":   "0 4px 20px rgba(20,184,166,0.2),  0 1px 4px rgba(20,184,166,0.1)",
        "glow-pink":   "0 4px 20px rgba(236,72,153,0.2),  0 1px 4px rgba(236,72,153,0.1)",
        "glow-green":  "0 4px 20px rgba(16,185,129,0.2),  0 1px 4px rgba(16,185,129,0.1)",
        "glow-red":    "0 4px 20px rgba(239,68,68,0.2),   0 1px 4px rgba(239,68,68,0.1)",
        "glow-sm":     "0 2px 8px rgba(139,92,246,0.15)",
        "glow-lg":     "0 8px 32px rgba(59,130,246,0.15), 0 4px 12px rgba(139,92,246,0.1)",
        "glass":       "0 4px 24px rgba(99,102,241,0.1),  inset 0 1px 0 rgba(255,255,255,0.9)",
        "card-hover":  "0 12px 40px rgba(99,102,241,0.12),0 4px 16px rgba(0,0,0,0.05)",
      },

      // ─── Background Images ───────────────────────────────
      backgroundImage: {
        "grid-pattern":     "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "neon-gradient":    "linear-gradient(135deg, #3b82f6, #8b5cf6, #14b8a6)",
        "aurora":           "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08), rgba(20,184,166,0.06))",
        "shimmer-gradient": "linear-gradient(90deg, transparent, rgba(99,102,241,0.06), transparent)",
      },

      backgroundSize: { "grid": "40px 40px" },

      transitionDuration: { "400": "400ms", DEFAULT: "150ms" },
      transitionTimingFunction: { DEFAULT: "cubic-bezier(0.4,0,0.2,1)" },
    },
  },
  plugins: [],
};
