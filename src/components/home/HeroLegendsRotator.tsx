"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";

/**
 * JerseyDrop — Cinematic Legendary Jersey Hero (V8.7).
 *
 * Two stacked <video> layers — both ALWAYS in the DOM and ALWAYS
 * loaded. We swap which is "in front" via opacity + transform so
 * there's never a load-pause between clips. The vortex transition
 * applies to those layers (CSS transform/filter), not to mounts.
 *
 * The AI generated jerseys with plausible-but-wrong surnames on the
 * back (Higgsfield's NSFW filter blocks any prompt that names an
 * actual player). We overlay the REAL legend identity as a small
 * glassy pill in the corner so the viewer always knows who they're
 * looking at — flag, name, number, team.
 *
 * Foreground: legend pill (top-end) + neon "קנה עכשיו" CTA (bottom-
 * start) that smooth-scrolls to the #leagues section.
 */

type Legend = {
  src: string;
  name: string;
  number: string;
  teamHe: string;
  flag: string;
};

const LEGENDS: Legend[] = [
  {
    src: "/videos/heroes/ronaldo-brazil.mp4",
    name: "Ronaldo",
    number: "9",
    teamHe: "ברזיל",
    flag: "🇧🇷",
  },
  {
    src: "/videos/heroes/zidane-france.mp4",
    name: "Zidane",
    number: "10",
    teamHe: "צרפת",
    flag: "🇫🇷",
  },
  {
    src: "/videos/heroes/messi-argentina.mp4",
    name: "Messi",
    number: "10",
    teamHe: "ארגנטינה",
    flag: "🇦🇷",
  },
  {
    src: "/videos/heroes/maradona-argentina.mp4",
    name: "Maradona",
    number: "10",
    teamHe: "ארגנטינה",
    flag: "🇦🇷",
  },
  {
    src: "/videos/heroes/ronaldo-portugal.mp4",
    name: "Cristiano",
    number: "7",
    teamHe: "פורטוגל",
    flag: "🇵🇹",
  },
  {
    src: "/videos/heroes/pele-brazil.mp4",
    name: "Pelé",
    number: "10",
    teamHe: "ברזיל",
    flag: "🇧🇷",
  },
];

const CLIP_DWELL_MS = 6400; // visible per clip
const VORTEX_MS = 1400; // crossfade/swirl duration

export default function HeroLegendsRotator() {
  const prefersReduced = useReducedMotion() ?? false;
  const [frontIdx, setFrontIdx] = useState(0);
  const [frontLayer, setFrontLayer] = useState<"a" | "b">("a");

  // Each layer holds a clip src. Layer A initially shows clip 0,
  // Layer B initially preloads clip 1.
  const [srcA, setSrcA] = useState(LEGENDS[0].src);
  const [srcB, setSrcB] = useState(LEGENDS[1].src);

  const aRef = useRef<HTMLVideoElement | null>(null);
  const bRef = useRef<HTMLVideoElement | null>(null);

  // Cycle: dwell on the current clip, then swap layers + advance index.
  useEffect(() => {
    if (prefersReduced) return;
    const id = window.setInterval(() => {
      setFrontIdx((i) => (i + 1) % LEGENDS.length);
      setFrontLayer((f) => (f === "a" ? "b" : "a"));
    }, CLIP_DWELL_MS);
    return () => window.clearInterval(id);
  }, [prefersReduced]);

  // Whenever the front index changes, point the now-back layer at the
  // *next* upcoming clip so it has CLIP_DWELL_MS to preload before its
  // turn in front.
  useEffect(() => {
    const next = LEGENDS[(frontIdx + 1) % LEGENDS.length].src;
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

  // Vortex transform: outgoing spins out + blurs + shrinks while
  // incoming spins in + unblurs + grows. Both transitions overlap
  // so the swap is one continuous swirl. Both layers are always in
  // the DOM — we never tear down a <video>, so there's no load pause.
  const aIsFront = frontLayer === "a";
  const layerStyle = (isFront: boolean): React.CSSProperties => ({
    transform: isFront ? "scale(1) rotate(0deg)" : "scale(0.06) rotate(720deg)",
    filter: isFront ? "blur(0px)" : "blur(28px)",
    opacity: isFront ? 1 : 0,
    transition: prefersReduced
      ? "opacity 200ms linear"
      : `transform ${VORTEX_MS}ms cubic-bezier(${
          isFront ? "0.16, 1, 0.3, 1" : "0.7, 0, 0.84, 0"
        }), filter ${VORTEX_MS}ms ease-in-out, opacity ${VORTEX_MS}ms ease-in-out`,
    transformOrigin: "50% 50%",
    willChange: "transform, opacity, filter",
  });

  const current = LEGENDS[frontIdx];

  return (
    <section
      aria-label="Hero"
      className="relative w-full overflow-hidden bg-black"
      style={{ height: "min(100vh, 1080px)" }}
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

      {/* ============ LEGEND IDENTITY PILL (top-end / right in RTL) ============ */}
      <div className="absolute end-6 top-6 z-10 sm:end-12 sm:top-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.src}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-black/40 px-4 py-2 backdrop-blur-md sm:gap-3 sm:px-5 sm:py-2.5"
            style={{
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.6)",
            }}
          >
            <span className="text-lg leading-none sm:text-xl" aria-hidden>
              {current.flag}
            </span>
            <div className="flex flex-col items-start leading-tight">
              <span className="font-display text-sm font-black uppercase tracking-[0.12em] text-white sm:text-base">
                {current.name}
                <span className="ms-1.5 text-[#00FF88]">#{current.number}</span>
              </span>
              <span className="font-display text-[0.625rem] font-bold uppercase tracking-[0.22em] text-white/70 sm:text-[0.7rem]">
                {current.teamHe}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ============ "קנה עכשיו" CTA (bottom-start) — scrolls to leagues ============ */}
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
          <button
            type="button"
            onClick={scrollToLeagues}
            className="group inline-flex items-center gap-2 rounded-full bg-[#00FF88] px-8 py-4 font-display text-lg font-black uppercase tracking-[0.16em] text-black shadow-[0_18px_50px_-10px_rgba(0,255,136,0.55)] transition-all duration-200 ease-out hover:scale-[1.08] hover:brightness-110 sm:px-10 sm:py-5 sm:text-xl"
          >
            קנה עכשיו
            <ArrowDown className="h-5 w-5 transition-transform duration-200 group-hover:translate-y-0.5" />
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
