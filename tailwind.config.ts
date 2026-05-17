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
        // Refined dark theme — 3-tier LAYERED grays with cool undertone.
        // Premium streetwear / Mr Porter / Adidas Originals feel, NOT
        // pure-OLED-black. Each surface has its own tonal level so
        // products always have a visible frame even when AI image bg
        // is also dark.
        //   bg-background (base)   = #0F1115  (page, deepest)
        //   bg-surface-2  (mid)    = #12151B  (sections, header, footer)
        //   bg-surface    (card)   = #161A22  (highest — cards, modals)
        background: "#0F1115",
        surface: "#161A22",
        "surface-2": "#12151B",
        border: "#262932",
        // Semantic aliases (per the layered-grays spec)
        base: "#0F1115",
        card: "#161A22",
        "border-subtle": "#262932",
        foreground: "#FAFAFA",
        muted: {
          DEFAULT: "#A1A1AA",
          foreground: "#71717A",
        },
        accent: {
          DEFAULT: "#00FF88",
          foreground: "#0F1115",
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
        glow: "0 0 24px rgba(0, 255, 136, 0.35)",
        "glow-sm": "0 0 12px rgba(0, 255, 136, 0.25)",
        "glow-cyan": "0 0 24px rgba(34, 211, 238, 0.30)",
        "glow-violet": "0 0 24px rgba(168, 85, 247, 0.30)",
        "glow-rose": "0 0 24px rgba(244, 114, 182, 0.30)",
        gold: "0 0 20px rgba(212, 175, 55, 0.35)",
        card: "0 4px 24px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(38, 41, 50, 0.8)",
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
