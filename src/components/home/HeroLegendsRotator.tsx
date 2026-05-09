"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

/**
 * JerseyDrop — Cinematic Legendary Jersey Hero (V8.5).
 *
 * Full-bleed video stage that rotates through 6 cinematic AI clips
 * (one legendary jersey + iconic landmark per clip). Two stacked
 * <video> elements crossfade every 8 seconds.
 *
 * Foreground = ONE element only: the "קנה עכשיו" CTA bottom-left.
 * No countdown, no headline, no eyebrow. Pure visual.
 *
 * Resilient to missing files: onError on each <video> drops it from
 * the active rotation, so as more clips are generated, they slot in
 * automatically without code changes — and missing clips never
 * cause broken UI.
 */

const ALL_CLIPS = [
  "/videos/heroes/ronaldo-brazil.mp4",
  "/videos/heroes/zidane-france.mp4",
  "/videos/heroes/messi-argentina.mp4",
  "/videos/heroes/maradona-argentina.mp4",
  "/videos/heroes/beckenbauer-germany.mp4",
  "/videos/heroes/pele-brazil.mp4",
];

const CLIP_DURATION_MS = 8000; // visible per clip
// 1200ms crossfade is wired into the inline `transition-opacity duration-[1200ms]`
// classes on each <video> below — keeping the constant only for documentation.

export default function HeroLegendsRotator() {
  // Track which clips are usable (passed an onLoadedData check).
  const [available, setAvailable] = useState<string[]>(ALL_CLIPS);
  // Index into `available` for the currently visible clip.
  const [activeIdx, setActiveIdx] = useState(0);
  // Which video element (A or B) is currently in front.
  const [front, setFront] = useState<"a" | "b">("a");
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);

  // Two slots so we always have one visible while the other preloads.
  const [srcA, setSrcA] = useState<string>(ALL_CLIPS[0]);
  const [srcB, setSrcB] = useState<string>(ALL_CLIPS[1] || ALL_CLIPS[0]);

  // Drop a clip from rotation if its <video> errors (404 / decode fail).
  const dropClip = (src: string) => {
    setAvailable((prev) => {
      const next = prev.filter((c) => c !== src);
      return next.length === 0 ? [ALL_CLIPS[0]] : next;
    });
  };

  // Cycle: every CLIP_DURATION_MS, swap front/back layer + advance index.
  useEffect(() => {
    if (available.length <= 1) return; // nothing to rotate
    const id = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % available.length);
      setFront((f) => (f === "a" ? "b" : "a"));
    }, CLIP_DURATION_MS);
    return () => window.clearInterval(id);
  }, [available.length]);

  // Whenever the active index changes, queue up the *next* clip in the
  // back layer so it's already buffered by the time we crossfade to it.
  useEffect(() => {
    if (available.length === 0) return;
    const current = available[activeIdx % available.length];
    const next =
      available[(activeIdx + 1) % available.length] ?? available[0];
    if (front === "a") {
      // Front = A → A shows current, B preloads next
      setSrcA(current);
      setSrcB(next);
    } else {
      setSrcB(current);
      setSrcA(next);
    }
  }, [activeIdx, available, front]);

  return (
    <section
      aria-label="Hero"
      className="relative w-full overflow-hidden bg-black"
      style={{ height: "min(100vh, 1080px)" }}
    >
      {/* ============ STACKED VIDEO LAYERS ============ */}
      <video
        key={`a-${srcA}`}
        ref={videoARef}
        src={srcA}
        autoPlay
        loop
        muted
        playsInline
        preload={activeIdx === 0 ? "auto" : "metadata"}
        poster="/videos/heroes/poster.jpg"
        onError={() => dropClip(srcA)}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out"
        style={{
          opacity: front === "a" ? 1 : 0,
          willChange: "opacity",
        }}
      />
      <video
        key={`b-${srcB}`}
        ref={videoBRef}
        src={srcB}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/videos/heroes/poster.jpg"
        onError={() => dropClip(srcB)}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out"
        style={{
          opacity: front === "b" ? 1 : 0,
          willChange: "opacity",
        }}
      />

      {/* ============ DARK GRADIENT + VIGNETTE ============ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.20) 35%, rgba(0,0,0,0.70) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.30) 70%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* ============ THE ONLY VISIBLE FOREGROUND ELEMENT ============ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="absolute bottom-8 start-6 z-10 sm:bottom-12 sm:start-12"
      >
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 rounded-full bg-[#00FF88] px-8 py-4 font-display text-lg font-black uppercase tracking-[0.16em] text-black shadow-[0_18px_50px_-10px_rgba(0,255,136,0.55)] transition-all duration-200 ease-out hover:scale-[1.08] hover:brightness-110 sm:px-10 sm:py-5 sm:text-xl"
          >
            קנה עכשיו
            <ArrowDown className="h-5 w-5 transition-transform duration-200 group-hover:translate-y-0.5" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
