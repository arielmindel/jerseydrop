"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy } from "lucide-react";
import WorldCupCountdown from "./WorldCupCountdown";

export default function HeroVideo() {
  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-label="Hero"
    >
      {/* Video layer (drop a real file at /public/videos/hero/hero-loop.mp4). */}
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="https://picsum.photos/seed/jerseydrop-hero-stadium/1800/1100"
        aria-hidden="true"
      >
        <source src="/videos/hero/hero-loop.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlays */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/55 to-background"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,10,0.6)_65%,#0A0A0A_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -top-32 start-1/3 h-[640px] w-[640px] rounded-full bg-accent/10 blur-[150px]"
      />

      <div className="container relative z-10 flex min-h-[82vh] flex-col justify-center gap-8 py-16 md:min-h-[90vh] md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl space-y-5"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-widest text-accent">
            <Trophy className="h-3.5 w-3.5" />
            מונדיאל 2026 · הקולקציה הרשמית
          </div>
          <h1 className="font-display text-5xl font-black uppercase leading-[1.02] text-foreground md:text-7xl">
            הגיע הזמן <br className="hidden md:block" />
            <span className="text-accent">ללבוש את הצבעים</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted md:text-lg">
            חולצות רשמיות לנבחרות ולמועדונים. גרסת Fan ו-Player, עם או בלי שם
            ומספר משלך. משלוח לכל הארץ, ישירות לבית.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/products"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-accent px-8 font-display text-sm font-bold uppercase tracking-wide text-accent-foreground shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
            >
              לקולקציה
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Link>
            <Link
              href="/nations"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-border bg-surface/70 px-8 font-display text-sm font-bold uppercase tracking-wide text-foreground backdrop-blur transition-colors hover:border-accent"
            >
              מונדיאל 2026
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <WorldCupCountdown />
        </motion.div>
      </div>
    </section>
  );
}
