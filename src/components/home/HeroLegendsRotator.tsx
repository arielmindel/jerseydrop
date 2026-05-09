"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";

/**
 * JerseyDrop — Cinematic Hero (V8.8).
 *
 * Two stacked <video> layers — both ALWAYS in the DOM and ALWAYS
 * loaded. We swap which is "in front" via opacity + transform so
 * there's never a load-pause between clips. The vortex transition
 * applies to those layers (CSS transform/filter), not to mounts.
 *
 * Foreground: ONE element only — the neon-green "קנה עכשיו" CTA
 * bottom-left. On click, smooth-scrolls to the #leagues section.
 * The hero is meant to be felt, not read — no captions, no labels.
 */

const CLIPS = [
  "/videos/heroes/ronaldo-brazil.mp4",
  "/videos/heroes/zidane-france.mp4",
  "/videos/heroes/messi-argentina.mp4",
  "/videos/heroes/maradona-argentina.mp4",
  "/videos/heroes/ronaldo-portugal.mp4",
  "/videos/heroes/pele-brazil.mp4",
];

const CLIP_DWELL_MS = 6400; // visible per clip
const FADE_MS = 1100; // crossfade duration

export default function HeroLegendsRotator() {
  const prefersReduced = useReducedMotion() ?? false;
  const [frontIdx, setFrontIdx] = useState(0);
  const [frontLayer, setFrontLayer] = useState<"a" | "b">("a");

  // Each layer holds a clip src. Layer A initially shows clip 0,
  // Layer B initially preloads clip 1.
  const [srcA, setSrcA] = useState(CLIPS[0]);
  const [srcB, setSrcB] = useState(CLIPS[1]);

  const aRef = useRef<HTMLVideoElement | null>(null);
  const bRef = useRef<HTMLVideoElement | null>(null);

  // Cycle: dwell on the current clip, then swap layers + advance index.
  useEffect(() => {
    if (prefersReduced) return;
    const id = window.setInterval(() => {
      setFrontIdx((i) => (i + 1) % CLIPS.length);
      setFrontLayer((f) => (f === "a" ? "b" : "a"));
    }, CLIP_DWELL_MS);
    return () => window.clearInterval(id);
  }, [prefersReduced]);

  // Whenever the front index changes, point the now-back layer at the
  // *next* upcoming clip so it has CLIP_DWELL_MS to preload before its
  // turn in front.
  useEffect(() => {
    const next = CLIPS[(frontIdx + 1) % CLIPS.length];
    if (frontLayer === "a") {
      setSrcB(next);
    } else {
      setSrcA(next);
    }
  }, [frontIdx, frontLayer]);

  // Make sure both videos are playing (autoplay can sometimes pause)
  useEffect(() => {
    [aRef.current, bRef.current].forEach((v) => v?.play().catch(() => {}));
  }, [srcA, srcB]);

  const scrollToLeagues = () => {
    document
      .getElementById("leagues")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Smooth crossfade with a tiny scale "breath" on the outgoing layer.
  // No spin, no blur — keeps the GPU light so playback never stutters.
  // Both layers are always in the DOM, so there's no load pause.
  const aIsFront = frontLayer === "a";
  const layerStyle = (isFront: boolean): React.CSSProperties => ({
    transform: isFront ? "scale(1)" : "scale(1.06)",
    opacity: isFront ? 1 : 0,
    transition: prefersReduced
      ? "opacity 200ms linear"
      : `opacity ${FADE_MS}ms ease-in-out, transform ${FADE_MS + 600}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    transformOrigin: "50% 50%",
    willChange: "transform, opacity",
  });

  return (
    <section
      aria-label="Hero"
      // Mobile: 88vh — almost full screen, immersive without crowding the
      // header. Desktop: full viewport height (clamped at 1080px on huge
      // monitors so the hero never balloons absurdly).
      className="relative w-full overflow-hidden bg-black h-[88vh] md:h-screen md:max-h-[1080px]"
    >
      {/* ============ TWO STACKED VIDEO LAYERS (always mounted) ============ */}
      <video
        ref={aRef}
        src={srcA}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/videos/heroes/poster.jpg"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={layerStyle(aIsFront)}
      />
      <video
        ref={bRef}
        src={srcB}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/videos/heroes/poster.jpg"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={layerStyle(!aIsFront)}
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

      {/* ============ "קנה עכשיו" CTA (bottom-start) — scrolls to leagues ============ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="absolute bottom-10 start-5 z-10 md:bottom-12 md:start-12"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <button
            type="button"
            onClick={scrollToLeagues}
            className="group inline-flex items-center gap-3 rounded-full bg-[#00FF88] px-8 py-4 font-display text-xl font-black uppercase tracking-[0.16em] text-black shadow-[0_18px_50px_-10px_rgba(0,255,136,0.55)] transition-all duration-200 ease-out hover:scale-[1.08] hover:brightness-110 md:px-12 md:py-6 md:text-2xl"
          >
            קנה עכשיו
            <ArrowDown className="h-5 w-5 transition-transform duration-200 group-hover:translate-y-0.5 md:h-6 md:w-6" />
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
