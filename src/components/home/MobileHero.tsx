"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

/**
 * Mobile Hero — static composition that solves the 16:9 → 9:16 cropping
 * problem. Higgsfield videos are landscape; on a 9:16 phone object-cover
 * crops them to extreme close-ups (only fabric texture visible). Here we
 * skip video entirely and stage three iconic national jerseys around a
 * glowing globe, then crown it with the brand mark and a single CTA.
 *
 * Renders only under md (768px). The desktop hero (HeroLegendsRotator)
 * handles md+ via Hero.tsx wrapper.
 */

const FLOAT_TRANSITION = (delay: number, duration = 4) => ({
  duration,
  repeat: Infinity,
  delay,
  ease: "easeInOut" as const,
});

export default function MobileHero() {
  return (
    <section
      aria-label="Hero"
      className="relative w-full h-[100dvh] overflow-hidden bg-gradient-to-b from-slate-950 via-black to-slate-950 md:hidden"
    >
      {/* ============ ATMOSPHERIC LAYERS ============ */}
      {/* Subtle SVG film grain (~5%) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />
      {/* Pulsing center neon glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[#00FF88] opacity-[0.08] blur-3xl"
      />

      {/* ============ GLOBE + JERSEYS STAGE ============ */}
      <div className="relative mx-auto mt-16 h-64 w-64">
        {/* Outer halo */}
        <div
          aria-hidden
          className="absolute -inset-8 animate-pulse rounded-full bg-emerald-500/20 blur-3xl"
        />

        {/* Globe sphere */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full border border-emerald-500/30 bg-gradient-to-br from-slate-700 via-slate-900 to-black"
          style={{
            boxShadow:
              "inset 0 0 80px rgba(0,255,136,0.2), 0 0 60px rgba(0,255,136,0.3)",
          }}
        />
        {/* Surface highlight */}
        <div
          aria-hidden
          className="absolute inset-4 rounded-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.15), transparent 50%)",
          }}
        />
        {/* Slow-spinning faux continents */}
        <div
          aria-hidden
          className="absolute inset-6 animate-spin rounded-full opacity-30"
          style={{
            animationDuration: "80s",
            backgroundImage:
              "radial-gradient(circle at 70% 60%, rgba(0,255,136,0.4), transparent 40%), radial-gradient(circle at 25% 50%, rgba(0,255,136,0.3), transparent 35%)",
          }}
        />

        {/* ============ FLOATING JERSEYS ============ */}
        {/* Brazil — center hero, biggest, in front */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={FLOAT_TRANSITION(0)}
          className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
        >
          <Image
            src="/heroes/mobile/brazil-home.jpg"
            alt="Brazil"
            width={140}
            height={140}
            priority
            className="h-auto w-[140px] rounded-xl drop-shadow-[0_20px_30px_rgba(0,255,136,0.25)]"
          />
        </motion.div>

        {/* France — back-left (RTL → start side, visually on the right) */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={FLOAT_TRANSITION(0.5, 5)}
          className="absolute left-1/2 top-1/2 z-10"
          style={{
            transform: "translate(-35%, -65%) scale(0.9)",
            opacity: 0.92,
          }}
        >
          <Image
            src="/heroes/mobile/france-home.jpg"
            alt="France"
            width={140}
            height={140}
            priority
            className="h-auto w-[140px] rounded-xl drop-shadow-[0_20px_30px_rgba(0,255,136,0.25)]"
          />
        </motion.div>

        {/* Argentina — back-right */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={FLOAT_TRANSITION(1, 5)}
          className="absolute left-1/2 top-1/2 z-10"
          style={{
            transform: "translate(-65%, -60%) scale(0.9)",
            opacity: 0.92,
          }}
        >
          <Image
            src="/heroes/mobile/argentina-home.jpg"
            alt="Argentina"
            width={140}
            height={140}
            priority
            className="h-auto w-[140px] rounded-xl drop-shadow-[0_20px_30px_rgba(0,255,136,0.25)]"
          />
        </motion.div>
      </div>

      {/* ============ HEADLINE ============ */}
      <div className="mt-8 px-6 text-center">
        <h1
          className="font-display text-5xl font-black tracking-tight text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          JerseyDrop
        </h1>
        <div
          aria-hidden
          className="mx-auto mt-1 h-1 w-16 bg-gradient-to-r from-transparent via-[#00FF88] to-transparent"
        />
        <p className="mt-4 text-base leading-relaxed text-white/70">
          חולצות כדורגל אותנטיות,
          <br />
          ישר אליך
        </p>
      </div>

      {/* ============ CTA ============ */}
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full bg-[#00FF88] px-12 py-5 font-display text-xl font-bold uppercase tracking-wide text-black shadow-[0_0_40px_rgba(0,255,136,0.5)] transition-transform active:scale-95"
        >
          קנה עכשיו
          <ArrowDown className="h-5 w-5" />
        </Link>
      </motion.div>
    </section>
  );
}
