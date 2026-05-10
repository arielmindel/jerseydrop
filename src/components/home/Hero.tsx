"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";

/**
 * JerseyDrop — Universal Hero (V9).
 *
 * Two video sets, ONE shown per device — pure CSS switches at the
 * (orientation: portrait/landscape) breakpoint. No JS detection, no
 * hydration mismatch.
 *
 *   • portrait:  9:16 vertical clips (jersey + landmark in same frame)
 *   • landscape: 16:9 horizontal clips (the existing Higgsfield set)
 *
 * Two stacked <video> layers per orientation crossfade every CYCLE_MS.
 * Browsers preload only the first of each set (preload="auto"); the
 * back layer uses preload="metadata" until it's its turn to play.
 *
 * CTA anchored bottom-center in portrait, bottom-left in landscape.
 */

const HORIZONTAL = [
  "/videos/heroes/ronaldo-brazil.mp4",
  "/videos/heroes/zidane-france.mp4",
  "/videos/heroes/messi-argentina.mp4",
  "/videos/heroes/maradona-argentina.mp4",
  "/videos/heroes/ronaldo-portugal.mp4",
  "/videos/heroes/pele-brazil.mp4",
];

// Vertical set: 4 clips ready (Brazil, France, Argentina-Messi,
// Argentina-Maradona). Portugal and Pele vertical aren't generated yet
// (Higgsfield credits exhausted) — when they land, append the paths
// here and the rotator picks them up automatically.
const VERTICAL = [
  "/videos/heroes/mobile/ronaldo-brazil-vertical.mp4",
  "/videos/heroes/mobile/zidane-france-vertical.mp4",
  "/videos/heroes/mobile/messi-argentina-vertical.mp4",
  "/videos/heroes/mobile/maradona-argentina-vertical.mp4",
];

const CYCLE_MS = 7000; // dwell per clip
const FADE_MS = 1100; // crossfade duration

export default function Hero() {
  const prefersReduced = useReducedMotion() ?? false;
  // One global tick — each set computes its own current/next via modulo.
  const [tick, setTick] = useState(0);
  const [frontLayer, setFrontLayer] = useState<"a" | "b">("a");

  // Front/back srcs PER ORIENTATION. Each pair flips on each tick.
  const [hSrcA, setHSrcA] = useState(HORIZONTAL[0]);
  const [hSrcB, setHSrcB] = useState(HORIZONTAL[1] || HORIZONTAL[0]);
  const [vSrcA, setVSrcA] = useState(VERTICAL[0]);
  const [vSrcB, setVSrcB] = useState(VERTICAL[1] || VERTICAL[0]);

  const hARef = useRef<HTMLVideoElement | null>(null);
  const hBRef = useRef<HTMLVideoElement | null>(null);
  const vARef = useRef<HTMLVideoElement | null>(null);
  const vBRef = useRef<HTMLVideoElement | null>(null);

  // Cycle: dwell on the current clip, then swap layers + advance tick.
  useEffect(() => {
    if (prefersReduced) return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      setFrontLayer((f) => (f === "a" ? "b" : "a"));
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [prefersReduced]);

  // Whenever the tick changes, point the now-back layer (per set) at the
  // *next* upcoming clip so it has CYCLE_MS to preload before its turn.
  useEffect(() => {
    const hNext = HORIZONTAL[(tick + 1) % HORIZONTAL.length];
    const vNext = VERTICAL[(tick + 1) % VERTICAL.length];
    if (frontLayer === "a") {
      // Layer B just became back — prep it with the next clip.
      setHSrcB(hNext);
      setVSrcB(vNext);
    } else {
      setHSrcA(hNext);
      setVSrcA(vNext);
    }
  }, [tick, frontLayer]);

  // Make sure the videos are actually playing (autoplay can be paused
  // by the browser after a src swap on some platforms).
  useEffect(() => {
    [hARef.current, hBRef.current, vARef.current, vBRef.current].forEach((v) =>
      v?.play().catch(() => {}),
    );
  }, [hSrcA, hSrcB, vSrcA, vSrcB]);

  // Smooth opacity crossfade — no spin, no blur. Both layers always
  // mounted so there's no load pause when swapping front/back.
  const aIsFront = frontLayer === "a";
  const layerStyle = (isFront: boolean): React.CSSProperties => ({
    opacity: isFront ? 1 : 0,
    transition: prefersReduced
      ? "opacity 200ms linear"
      : `opacity ${FADE_MS}ms ease-in-out`,
    willChange: "opacity",
  });

  return (
    <section
      aria-label="Hero"
      className="relative w-full h-[100dvh] landscape:h-screen landscape:lg:max-h-[1080px] overflow-hidden bg-black"
    >
      {/* ============ VERTICAL LAYERS (portrait only) ============ */}
      <video
        ref={vARef}
        src={vSrcA}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover portrait:block landscape:hidden"
        style={layerStyle(aIsFront)}
      />
      <video
        ref={vBRef}
        src={vSrcB}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover portrait:block landscape:hidden"
        style={layerStyle(!aIsFront)}
      />

      {/* ============ HORIZONTAL LAYERS (landscape only) ============ */}
      <video
        ref={hARef}
        src={hSrcA}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover landscape:block portrait:hidden"
        style={layerStyle(aIsFront)}
      />
      <video
        ref={hBRef}
        src={hSrcB}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover landscape:block portrait:hidden"
        style={layerStyle(!aIsFront)}
      />

      {/* ============ BOTTOM GRADIENT FOR CTA CONTRAST ============ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
      />

      {/* ============ CTA — smooth-scrolls down to the leagues section ============ */}
      <motion.button
        type="button"
        onClick={() => {
          document
            .getElementById("leagues")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="absolute z-30 inline-flex items-center gap-2 rounded-full bg-[#00FF88] px-12 py-5 font-display text-xl font-bold uppercase tracking-wide text-black shadow-[0_0_40px_rgba(0,255,136,0.6)] transition-transform active:scale-95 bottom-12 left-1/2 -translate-x-1/2 landscape:left-12 landscape:translate-x-0 lg:bottom-16 lg:left-16 lg:px-14 lg:py-6 lg:text-2xl"
        style={{
          paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
        }}
      >
        <motion.span
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center gap-2"
        >
          קנה עכשיו
          <ArrowDown aria-hidden className="h-5 w-5 lg:h-6 lg:w-6" />
        </motion.span>
      </motion.button>
    </section>
  );
}
