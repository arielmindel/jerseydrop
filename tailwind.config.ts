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
        background: "#0A0A0A",
        surface: "#141414",
        border: "#262626",
        foreground: "#FFFFFF",
        muted: {
          DEFAULT: "#A3A3A3",
          foreground: "#6B6B6B",
        },
        accent: {
          DEFAULT: "#00FF88",
          foreground: "#0A0A0A",
        },
        gold: "#D4AF37",
        destructive: "#FF3B3B",
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
        gold: "0 0 20px rgba(212, 175, 55, 0.35)",
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
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "fade-up": "fadeUp 0.45s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
