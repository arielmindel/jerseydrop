"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ChevronDown } from "lucide-react";
import { WORLD_CUP_START_UTC } from "@/lib/constants";

/**
 * Cinematic video hero — JerseyDrop V8 (premium polish).
 *
 * Distinct from competitor (sporthubkit.com) by design:
 *   • Multi-layer overlay (linear darken + radial vignette + green corner
 *     glow + amber upper-right tint + film grain) → depth, not flat dark
 *   • Bold display H1 with metallic gold gradient on key word "התשוקה"
 *   • 4 large countdown boxes with neon green digits + gold borders
 *   • Bottom-LEFT gold CTA with pulsing glow + smooth scroll to #leagues
 *
 * Performance:
 *   • <source media> serves a 854px variant under 768px viewports
 *   • prefers-reduced-motion → pauses video AND skips entrance animations
 *   • muted + playsInline + autoPlay (Safari iOS friendly)
 *   • poster shown immediately so the hero isn't blank during decode
 */

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function compute(): TimeLeft {
  const diff = WORLD_CUP_START_UTC - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

const pad = (n: number) => n.toString().padStart(2, "0");

function CountdownBox({
  value,
  label,
  index,
  reduced,
}: {
  value: number;
  label: string;
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: reduced ? 0 : 0.6 + index * 0.1,
        ease: "easeOut",
      }}
      className="flex flex-col items-center gap-1 rounded-xl border border-gold/40 bg-black/35 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4"
      style={{
        boxShadow:
          "0 0 0 1px rgba(212,175,55,0.20), 0 12px 30px -10px rgba(0,255,136,0.18)",
      }}
    >
      <span
        className="font-display text-3xl font-black tabular-nums leading-none tracking-tight sm:text-4xl md:text-5xl"
        style={{
          color: "#00ff88",
          textShadow:
            "0 0 18px rgba(0,255,136,0.55), 0 0 4px rgba(0,255,136,0.45)",
        }}
      >
        {pad(value)}
      </span>
      <span className="font-display text-[0.625rem] font-bold uppercase tracking-[0.22em] text-neutral-400">
        {label}
      </span>
    </motion.div>
  );
}

export default function HeroVideoLoop() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prefersReduced = useReducedMotion() ?? false;
  const [time, setTime] = useState<TimeLeft>(() => compute());

  // Live countdown tick (only on client, only after mount)
  useEffect(() => {
    setTime(compute());
    const id = window.setInterval(() => setTime(compute()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Honor reduced-motion: pause the loop, the poster image stays.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (prefersReduced) v.pause();
    else v.play().catch(() => {});
  }, [prefersReduced]);

  const scrollToLeagues = () => {
    document
      .getElementById("leagues")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      aria-label="Hero"
      className="relative w-full overflow-hidden bg-black"
      style={{ height: "min(85vh, 900px)" }}
    >
      {/* Video — desktop variant by default, swap to mobile under 768px */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/videos/hero-poster.jpg"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source
          src="/videos/hero-loop-mobile.mp4"
          type="video/mp4"
          media="(max-width: 767px)"
        />
        <source src="/videos/hero-loop.mp4" type="video/mp4" />
      </video>

      {/* ============ MULTI-LAYER OVERLAY (depth, not flat dark) ============ */}
      {/* L1 — vertical darken: heavier at bottom for text legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      {/* L2 — radial vignette: corners darker than center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.30) 65%, rgba(0,0,0,0.60) 100%)",
        }}
      />
      {/* L3 — bottom-left neon-green glow (where the CTA sits) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 55% at 12% 90%, rgba(0,255,136,0.10) 0%, transparent 60%)",
        }}
      />
      {/* L4 — top-right amber tint (subtle warmth on the eyebrow side) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 88% 12%, rgba(212,175,55,0.07) 0%, transparent 60%)",
        }}
      />
      {/* L5 — SVG film grain (so stock footage doesn't read as "stock") */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      {/* ============ FOREGROUND CONTENT ============ */}
      <div className="container relative z-10 flex h-full flex-col py-10 md:py-14">
        {/* Center — H1 + subline + countdown */}
        <div className="my-auto flex flex-col items-center text-center">
          {/* H1 — huge, dramatic, gold accent on התשוקה */}
          <motion.h1
            initial={prefersReduced ? false : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-black uppercase text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]"
            style={{
              fontSize: "clamp(2.75rem, 8vw, 6.5rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            לבש את{" "}
            <span
              className="inline-block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #fcd34d 0%, #f4e5a1 38%, #d4a017 100%)",
                textShadow: "0 0 30px rgba(252,211,77,0.25)",
                filter: "drop-shadow(0 2px 0 rgba(120,80,10,0.35))",
              }}
            >
              התשוקה
            </span>{" "}
            למשחק
          </motion.h1>

          {/* Subline — neutral-300 (hierarchy below H1), max-width capped */}
          <motion.p
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: prefersReduced ? 0 : 0.25, ease: "easeOut" }}
            className="mt-5 max-w-[600px] font-display text-sm text-neutral-300 sm:text-base md:text-lg"
            style={{ letterSpacing: "0.02em" }}
          >
            חולצות כדורגל מהליגות הגדולות בעולם · משלוח 10–15 ימי עסקים
          </motion.p>

          {/* Countdown — 4 large boxes, neon green digits, gold borders */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: prefersReduced ? 0 : 0.5, duration: 0.4 }}
            className="mt-8 flex items-center gap-2 sm:gap-3 md:gap-4"
          >
            <CountdownBox value={time.days} label="ימים" index={0} reduced={prefersReduced} />
            <CountdownBox value={time.hours} label="שעות" index={1} reduced={prefersReduced} />
            <CountdownBox value={time.minutes} label="דקות" index={2} reduced={prefersReduced} />
            <CountdownBox value={time.seconds} label="שניות" index={3} reduced={prefersReduced} />
          </motion.div>
          <div className="mt-3 font-display text-[0.625rem] font-bold uppercase tracking-[0.32em] text-accent/80">
            מונדיאל 2026 · עוד מעט
          </div>
        </div>

        {/* Bottom-left — CTA + scroll hint */}
        <div className="flex items-end justify-start">
          <div className="flex flex-col items-start gap-2">
            <motion.button
              type="button"
              onClick={scrollToLeagues}
              initial={prefersReduced ? false : { opacity: 0, y: 14 }}
              animate={{
                opacity: 1,
                y: 0,
                boxShadow: prefersReduced
                  ? "0 14px 40px -10px rgba(252,211,77,0.55), 0 0 0 1px rgba(252,211,77,0.40)"
                  : [
                      "0 14px 40px -10px rgba(252,211,77,0.45), 0 0 0 1px rgba(252,211,77,0.40)",
                      "0 14px 60px -8px rgba(252,211,77,0.75), 0 0 0 1px rgba(252,211,77,0.55)",
                      "0 14px 40px -10px rgba(252,211,77,0.45), 0 0 0 1px rgba(252,211,77,0.40)",
                    ],
              }}
              transition={{
                opacity: { duration: 0.6, delay: prefersReduced ? 0 : 0.85 },
                y: { duration: 0.6, delay: prefersReduced ? 0 : 0.85 },
                boxShadow: prefersReduced
                  ? { duration: 0 }
                  : { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
              className="group inline-flex h-12 items-center gap-2 rounded-full px-6 font-display text-sm font-black uppercase tracking-[0.18em] text-background transition-transform duration-base ease-emphasized hover:-translate-y-0.5 sm:h-14 sm:px-8 sm:text-base"
              style={{
                background: "linear-gradient(135deg, #fcd34d 0%, #d4a017 100%)",
              }}
            >
              קנה עכשיו
              <ArrowDown className="h-4 w-4 transition-transform duration-base group-hover:translate-y-0.5" />
            </motion.button>
            <button
              type="button"
              onClick={scrollToLeagues}
              aria-label="גלול למטה"
              className="ml-2 inline-flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-[0.32em] text-white/55 transition-colors duration-base hover:text-accent"
            >
              <ChevronDown className="h-3 w-3 animate-bounce" />
              גלול למטה
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
