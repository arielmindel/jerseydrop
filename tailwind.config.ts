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
      // Mobile px-4, desktop px-8 — matches the responsive spec
      padding: { DEFAULT: "1rem", md: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      // Orientation-based variants — used by the universal Hero so the
      // right video set (vertical/horizontal) shows on each device.
      screens: {
        portrait: { raw: "(orientation: portrait)" },
        landscape: { raw: "(orientation: landscape)" },
      },
      colors: {
        // Light theme — white page, near-black ink, subtle gray surfaces.
        // Adidas/Nike Direct-style: black-bg AI product images "float" on
        // the white canvas. Accent darkened from neon #00FF88 to #00B85F
        // so green text passes WCAG AA (4.6:1) on white. CTA buttons stay
        // bold green with white ink for max readability.
        background: "#FFFFFF",
        surface: "#FFFFFF",
        "surface-2": "#FAFAFA",
        border: "#E5E5E5",
        foreground: "#0A0A0A",
        muted: {
          DEFAULT: "#525252",
          foreground: "#737373",
        },
        accent: {
          DEFAULT: "#00B85F",
          foreground: "#FFFFFF",
        },
        // Secondary accents for variety in section washes / category badges
        cyan: "#0891B2",
        violet: "#7E22CE",
        rose: "#DB2777",
        amber: "#D97706",
        gold: "#B8860B",
        destructive: "#DC2626",
        success: "#00B85F",
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "ui-sans-serif", "sans-serif"],
        jersey: ["var(--font-oswald)", "Arial Black", "sans-serif"],
      },
      // Type scale — see docs/DESIGN_SYSTEM.md
      // Tailwind merges with default sizes, so xs/sm/base/lg/xl/2xl/etc. still work.
      // The new tokens below give us a consistent type rhythm across the catalog.
      fontSize: {
        "display-xl": ["clamp(2.75rem, 6vw + 1rem, 4.5rem)", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "900" }],
        "display-lg": ["clamp(2.25rem, 4vw + 1rem, 3.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "900" }],
        display: ["clamp(1.75rem, 3vw + 0.75rem, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.015em", fontWeight: "800" }],
        h1: ["2rem", { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "800" }],
        h2: ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.005em", fontWeight: "700" }],
        h3: ["1.25rem", { lineHeight: "1.3", fontWeight: "700" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.55" }],
        caption: ["0.75rem", { lineHeight: "1.4" }],
        overline: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.18em", fontWeight: "700" }],
      },
      transitionDuration: {
        snap: "120ms",
        fast: "180ms",
        base: "240ms",
        slow: "360ms",
        graceful: "480ms",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        emphasized: "cubic-bezier(0.2, 0, 0, 1)",
      },
      boxShadow: {
        // Light-theme glows: tinted DROP shadow rather than haze.
        // Brand green still pulses but reads as a colored card lift,
        // not a neon halo (which only works on dark canvas).
        glow: "0 8px 24px -4px rgba(0, 184, 95, 0.35), 0 0 0 1px rgba(0, 184, 95, 0.15)",
        "glow-sm": "0 4px 12px -2px rgba(0, 184, 95, 0.25)",
        "glow-cyan": "0 8px 24px -4px rgba(8, 145, 178, 0.30)",
        "glow-violet": "0 8px 24px -4px rgba(126, 34, 206, 0.30)",
        "glow-rose": "0 8px 24px -4px rgba(219, 39, 119, 0.30)",
        gold: "0 8px 20px -4px rgba(184, 134, 11, 0.35)",
        card: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.04)",
      },
      backgroundImage: {
        // Light-theme aurora — very subtle tints over white (instead of
        // saturated glows on dark). Keeps the brand color spectrum.
        "mesh-aurora":
          "radial-gradient(at 8% 12%, rgba(0,184,95,0.05) 0px, transparent 50%), radial-gradient(at 95% 8%, rgba(126,34,206,0.04) 0px, transparent 45%), radial-gradient(at 50% 100%, rgba(8,145,178,0.04) 0px, transparent 55%)",
        "mesh-warm":
          "radial-gradient(at 12% 0%, rgba(219,39,119,0.04) 0px, transparent 45%), radial-gradient(at 90% 30%, rgba(217,119,6,0.04) 0px, transparent 50%)",
        "mesh-ice":
          "radial-gradient(at 0% 50%, rgba(8,145,178,0.04) 0px, transparent 50%), radial-gradient(at 100% 50%, rgba(0,184,95,0.05) 0px, transparent 50%)",
        "card-gradient":
          "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,250,250,1) 100%)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0,184,95,0.45)" },
          "50%": { boxShadow: "0 0 0 8px rgba(0,184,95,0)" },
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
        "accordion-down": {
          "0%": { height: "0", opacity: "0" },
          "100%": { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          "0%": { height: "var(--radix-accordion-content-height)", opacity: "1" },
          "100%": { height: "0", opacity: "0" },
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
