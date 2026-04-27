"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy } from "lucide-react";
import WorldCupCountdown from "./WorldCupCountdown";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";

type HeroProps = {
  showcaseImages: string[];
};

export default function HeroVideo({ showcaseImages }: HeroProps) {
  // Always render — Hero stays visually rich even if 0 products have images.
  const imgs = showcaseImages.slice(0, 4);

  return (
    <section
      className="relative isolate overflow-hidden"
      aria-label="Hero"
    >
      {/* Aurora wash + corner glows — replaces the previous solid-black hero */}
      <div
        aria-hidden
        className="absolute inset-0 bg-mesh-aurora opacity-90"
      />
      <div
        aria-hidden
        className="absolute -top-32 start-1/3 h-[640px] w-[640px] rounded-full bg-accent/15 blur-[150px]"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 end-0 h-[480px] w-[480px] rounded-full bg-violet/15 blur-[140px]"
      />
      <div
        aria-hidden
        className="absolute -top-20 end-1/4 h-[360px] w-[360px] rounded-full bg-cyan/10 blur-[120px]"
      />

      <div className="container relative z-10 grid min-h-[80vh] grid-cols-1 items-center gap-10 py-16 md:min-h-[88vh] md:grid-cols-[1.2fr_1fr] md:py-24">
        {/* Text column */}
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
            <span className="bg-gradient-to-r from-accent via-cyan to-accent bg-clip-text text-transparent">
              ללבוש את הצבעים
            </span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted md:text-lg">
            חולצות רשמיות לנבחרות ולמועדונים. גרסת Fan ו-Player, עם או בלי
            שם ומספר משלך. משלוח לכל הארץ, ישירות לבית.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/products"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-accent px-8 font-display text-sm font-bold uppercase tracking-wide text-accent-foreground shadow-glow transition-all duration-300 hover:-translate-y-0.5"
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

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            className="max-w-xl pt-4"
          >
            <WorldCupCountdown />
          </motion.div>
        </motion.div>

        {/* Showcase column — 4 jersey thumbnails in a floating collage */}
        {imgs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative mx-auto hidden h-[520px] w-full max-w-md md:block"
          >
            <CollageTile
              src={imgs[0]}
              className="absolute end-[8%] top-[2%] z-30 h-[58%] w-[55%] rotate-[-5deg]"
              accent="ring-accent/40 shadow-glow"
              delay={0}
            />
            {imgs[1] && (
              <CollageTile
                src={imgs[1]}
                className="absolute start-[2%] top-[12%] z-20 h-[50%] w-[48%] rotate-[6deg]"
                accent="ring-cyan/30 shadow-glow-cyan"
                delay={0.6}
              />
            )}
            {imgs[2] && (
              <CollageTile
                src={imgs[2]}
                className="absolute end-[16%] bottom-[2%] z-20 h-[52%] w-[50%] rotate-[3deg]"
                accent="ring-violet/30 shadow-glow-violet"
                delay={1.1}
              />
            )}
            {imgs[3] && (
              <CollageTile
                src={imgs[3]}
                className="absolute start-[10%] bottom-[8%] z-10 h-[42%] w-[40%] rotate-[-3deg]"
                accent="ring-rose/30 shadow-glow-rose"
                delay={1.5}
              />
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function CollageTile({
  src,
  className,
  accent,
  delay,
}: {
  src: string;
  className: string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{
        duration: 5,
        ease: "easeInOut",
        repeat: Infinity,
        delay,
      }}
      className={`overflow-hidden rounded-3xl border border-border/40 bg-surface ring-2 backdrop-blur ${accent} ${className}`}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width: 768px) 25vw, 50vw"
        priority
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        className="object-cover"
      />
    </motion.div>
  );
}
