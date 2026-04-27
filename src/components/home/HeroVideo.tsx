"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy } from "lucide-react";
import WorldCupCountdown from "./WorldCupCountdown";

/**
 * Hero — full-bleed soccer video on loop with a dark gradient overlay,
 * headline + subheadline, World Cup countdown, and two CTAs.
 *
 * Drop a 5-15s MP4 (silent, dark, moody — e.g. close-up of a jersey or
 * stadium b-roll) at /public/videos/hero/hero-loop.mp4 and the <video>
 * element below picks it up. If the file is missing, the gradient + grain
 * fallback keeps the section visually rich.
 */
export default function HeroVideo() {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-label="Hero"
      style={{ minHeight: "75vh" }}
    >
      {/* === Background layer === */}

      {/* Solid base (always rendered — the video sits on top if present) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-background"
      />

      {/* Aurora wash + corner glows (same vibe as the rest of the site) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-mesh-aurora opacity-90"
      />
      <div
        aria-hidden
        className="absolute -top-32 start-1/3 h-[640px] w-[640px] rounded-full bg-accent/20 blur-[150px]"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 end-0 h-[480px] w-[480px] rounded-full bg-violet/15 blur-[140px]"
      />

      {/* Looping muted video — drop /public/videos/hero/hero-loop.mp4
          and it kicks in automatically. Until then the fallback above
          carries the section. */}
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-50"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/videos/hero/hero-loop.mp4" type="video/mp4" />
      </video>

      {/* Subtle grain — adds texture so the section never reads as flat */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] [background-image:url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')] mix-blend-overlay"
      />

      {/* Dark gradient (top transparent → bottom darker) for text legibility */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background/85"
      />

      {/* === Foreground content === */}
      <div className="container relative z-10 flex min-h-[75vh] flex-col items-center justify-center gap-7 py-20 text-center md:min-h-[85vh] md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex w-full max-w-4xl flex-col items-center gap-5"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-widest text-accent">
            <Trophy className="h-3.5 w-3.5" />
            מונדיאל 2026 · הקולקציה הרשמית
          </div>

          <h1 className="font-display text-5xl font-black uppercase leading-[1.02] text-foreground md:text-7xl">
            הגיע הזמן <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-accent via-cyan to-accent bg-clip-text text-transparent">
              ללבוש את הצבעים
            </span>
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            חולצות רשמיות לנבחרות ולמועדונים. משלוח ישירות לכל הארץ.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/products"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-accent px-8 font-display text-sm font-bold uppercase tracking-wide text-accent-foreground shadow-glow transition-all duration-300 hover:-translate-y-0.5"
            >
              לקולקציה
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Link>
            <Link
              href="/collections/world-cup-2026"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-border bg-surface/70 px-8 font-display text-sm font-bold uppercase tracking-wide text-foreground backdrop-blur transition-colors hover:border-accent"
            >
              מונדיאל 2026
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        {/* Countdown — sized up for hero presence */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
          className="w-full max-w-3xl"
        >
          <WorldCupCountdown />
        </motion.div>
      </div>
    </section>
  );
}
