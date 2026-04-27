import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Refresh: navy-charcoal with subtle blue undertone instead of pure
        // black. Reads as "premium dark" rather than "void". Surface +
        // border are nudged to give cards more visible structure.
        background: "#0B1220",
        surface: "#151B2C",
        "surface-2": "#1C2237",
        border: "#2C3349",
        foreground: "#F8FAFC",
        muted: {
          DEFAULT: "#94A3B8",
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#00FF88",
          foreground: "#0B1220",
        },
        // Secondary accents for variety in section washes / category badges
        cyan: "#22D3EE",
        violet: "#A855F7",
        rose: "#F472B6",
        amber: "#F59E0B",
        gold: "#D4AF37",
        destructive: "#FF3B5C",
        success: "#00FF88",
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "ui-sans-serif", "sans-serif"],
        jersey: ["var(--font-oswald)", "Arial Black", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(0, 255, 136, 0.35)",
        "glow-sm": "0 0 12px rgba(0, 255, 136, 0.25)",
        "glow-cyan": "0 0 24px rgba(34, 211, 238, 0.30)",
        "glow-violet": "0 0 24px rgba(168, 85, 247, 0.30)",
        "glow-rose": "0 0 24px rgba(244, 114, 182, 0.30)",
        gold: "0 0 20px rgba(212, 175, 55, 0.35)",
        card: "0 4px 24px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(44, 51, 73, 0.6)",
      },
      backgroundImage: {
        "mesh-aurora":
          "radial-gradient(at 8% 12%, rgba(0,255,136,0.12) 0px, transparent 50%), radial-gradient(at 95% 8%, rgba(168,85,247,0.10) 0px, transparent 45%), radial-gradient(at 50% 100%, rgba(34,211,238,0.08) 0px, transparent 55%)",
        "mesh-warm":
          "radial-gradient(at 12% 0%, rgba(244,114,182,0.10) 0px, transparent 45%), radial-gradient(at 90% 30%, rgba(245,158,11,0.08) 0px, transparent 50%)",
        "mesh-ice":
          "radial-gradient(at 0% 50%, rgba(34,211,238,0.10) 0px, transparent 50%), radial-gradient(at 100% 50%, rgba(0,255,136,0.10) 0px, transparent 50%)",
        "card-gradient":
          "linear-gradient(180deg, rgba(28,34,55,0.6) 0%, rgba(11,18,32,0.4) 100%)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0,255,136,0.45)" },
          "50%": { boxShadow: "0 0 0 8px rgba(0,255,136,0)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "fade-up": "fadeUp 0.45s ease-out both",
        shimmer: "shimmer 2.4s ease-in-out infinite",
        floaty: "floaty 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
