"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ChevronDown } from "lucide-react";

/**
 * JerseyDrop V8 — DROPPING JERSEYS HERO
 * Minimalist: zero text, only the gold "קנה עכשיו" CTA bottom-left.
 * One jersey at a time falls in from above, lands with a spring bounce,
 * hovers at center with a soft float, then exits as the next jersey
 * drops in. 6 iconic jerseys cycle on a continuous loop.
 *
 * Atmosphere is built up in layered overlays — black base, gold spotlight
 * cone behind the jersey, vignette, film grain, neon-green corner glow.
 *
 * Behavior:
 *   • Pauses while the cursor is over the hero (gives users control)
 *   • prefers-reduced-motion → freezes on the first jersey, no animation
 *   • Mobile uses a smaller jersey + a slightly faster cycle
 */

type Jersey = { src: string; alt: string };

const JERSEYS: Jersey[] = [
  { src: "/jerseys/real-madrid.jpg", alt: "Real Madrid" },
  { src: "/jerseys/argentina.jpg", alt: "Argentina" },
  { src: "/jerseys/barcelona.jpg", alt: "Barcelona" },
  { src: "/jerseys/liverpool.jpg", alt: "Liverpool" },
  { src: "/jerseys/inter-miami.jpg", alt: "Inter Miami" },
  { src: "/jerseys/man-united.jpg", alt: "Manchester United" },
];

// Total visible duration per jersey: ENTER + HOLD + EXIT (no LAND because
// the spring physics does that automatically inside the ENTER tween).
const CYCLE_MS_DESKTOP = 5500;
const CYCLE_MS_MOBILE = 4500;

export default function HeroDroppingJerseys() {
  const prefersReduced = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile breakpoint (sync with the rest of the site at 768px)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  // Cycle through jerseys
  useEffect(() => {
    if (prefersReduced || paused) return;
    const cycleMs = isMobile ? CYCLE_MS_MOBILE : CYCLE_MS_DESKTOP;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % JERSEYS.length);
    }, cycleMs);
    return () => window.clearInterval(id);
  }, [prefersReduced, paused, isMobile]);

  // Preload the next jersey image (avoids flicker between cycles)
  useEffect(() => {
    if (prefersReduced) return;
    const next = JERSEYS[(index + 1) % JERSEYS.length];
    const img = new window.Image();
    img.src = next.src;
  }, [index, prefersReduced]);

  const scrollToLeagues = () => {
    document
      .getElementById("leagues")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const current = JERSEYS[index];

  return (
    <section
      aria-label="Hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative w-full overflow-hidden"
      style={{
        height: "min(85vh, 900px)",
        backgroundColor: "#0A0A0A",
      }}
    >
      {/* ============ ATMOSPHERIC LAYERS ============ */}
      {/* L1 — gold spotlight cone behind the jersey ("stage" feel) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 38% 55% at 50% 52%, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.06) 35%, transparent 65%)",
        }}
      />
      {/* L2 — global vignette: corners darken */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.45) 75%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      {/* L3 — bottom-left neon-green corner glow (anchors the CTA) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 55% at 12% 92%, rgba(0,255,136,0.10) 0%, transparent 60%)",
        }}
      />
      {/* L4 — SVG film grain overlay (~5%) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />
      {/* L5 — drifting gold dust particles (only when motion is allowed) */}
      {!prefersReduced && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: 12 }).map((_, i) => {
            // Deterministic positions so SSR + client agree
            const left = ((i * 83) % 100) + 0.5;
            const top = ((i * 47) % 70) + 15;
            const delay = (i % 6) * 0.7;
            return (
              <motion.span
                key={i}
                aria-hidden
                className="absolute h-1 w-1 rounded-full"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  background: "rgba(252,211,77,0.55)",
                  boxShadow: "0 0 8px rgba(252,211,77,0.55)",
                }}
                animate={{
                  y: [0, -22, 0],
                  opacity: [0.25, 0.85, 0.25],
                }}
                transition={{
                  duration: 4 + (i % 3),
                  delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </div>
      )}

      {/* ============ CENTER STAGE — DROPPING JERSEY ============ */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={index}
            initial={
              prefersReduced
                ? { opacity: 1, y: 0, rotate: 0, scale: 1 }
                : { opacity: 0, y: "-110%", rotate: -360, scale: 0.85 }
            }
            animate={
              prefersReduced
                ? {
                    opacity: 1,
                    y: 0,
                    rotate: 0,
                    scale: 1,
                  }
                : {
                    opacity: 1,
                    y: [0, -8, 0, 6, 0],
                    rotate: 0,
                    scale: [1, 1.02, 1, 1.02, 1],
                  }
            }
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, y: "-90%", rotate: 380, scale: 0.85 }
            }
            transition={
              prefersReduced
                ? { duration: 0.2 }
                : {
                    // ENTER spring (lands with a tiny bounce)
                    opacity: { duration: 0.45 },
                    rotate: { duration: 1.6, ease: [0.16, 1, 0.3, 1] },
                    scale: {
                      duration: 4.0,
                      times: [0, 0.35, 0.55, 0.75, 1],
                      ease: "easeInOut",
                      repeat: 0,
                    },
                    y: {
                      // First value is the spring landing, then float, then exit handled by exit prop
                      duration: 3.8,
                      times: [0, 0.35, 0.55, 0.75, 1],
                      ease: "easeInOut",
                    },
                    default: {
                      type: "spring",
                      stiffness: 120,
                      damping: 14,
                      mass: 0.9,
                    },
                  }
            }
            className="relative"
            style={{
              width: isMobile ? 320 : 480,
              height: isMobile ? 320 : 480,
            }}
          >
            {/* Soft elevation shadow underneath (a separate layer so it
                doesn't rotate with the jersey) */}
            <div
              aria-hidden
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-[50%]"
              style={{
                width: isMobile ? 180 : 280,
                height: isMobile ? 18 : 26,
                background:
                  "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)",
                filter: "blur(6px)",
              }}
            />
            <Image
              src={current.src}
              alt={current.alt}
              fill
              sizes="(min-width: 768px) 480px, 320px"
              priority={index === 0}
              className="object-contain drop-shadow-[0_24px_50px_rgba(0,0,0,0.55)]"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ============ BOTTOM-LEFT CTA + SCROLL HINT ============ */}
      <div className="absolute bottom-8 start-6 z-10 flex flex-col items-start gap-2 sm:bottom-12 sm:start-12">
        <motion.button
          type="button"
          onClick={scrollToLeagues}
          initial={prefersReduced ? false : { opacity: 0, y: 16 }}
          animate={{
            opacity: 1,
            y: 0,
            boxShadow: prefersReduced
              ? "0 14px 40px -10px rgba(252,211,77,0.55), 0 0 0 1px rgba(252,211,77,0.40)"
              : [
                  "0 14px 40px -10px rgba(252,211,77,0.45), 0 0 0 1px rgba(252,211,77,0.40)",
                  "0 18px 60px -8px rgba(252,211,77,0.80), 0 0 0 1px rgba(252,211,77,0.60)",
                  "0 14px 40px -10px rgba(252,211,77,0.45), 0 0 0 1px rgba(252,211,77,0.40)",
                ],
          }}
          transition={{
            opacity: { duration: 0.6, delay: prefersReduced ? 0 : 0.6 },
            y: { duration: 0.6, delay: prefersReduced ? 0 : 0.6 },
            boxShadow: prefersReduced
              ? { duration: 0 }
              : { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
          className="group inline-flex h-12 items-center gap-2 rounded-full px-6 font-display text-sm font-black uppercase tracking-[0.18em] text-background transition-transform duration-base ease-emphasized hover:-translate-y-0.5 sm:h-14 sm:px-8 sm:text-base"
          style={{
            background:
              "linear-gradient(135deg, #d4af37 0%, #f4e5a1 50%, #d4af37 100%)",
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

      {/* Discreet pause hint — top-right, only visible on hover */}
      <div className="pointer-events-none absolute end-4 top-4 z-10 hidden items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 font-display text-[0.625rem] uppercase tracking-[0.22em] text-white/55 backdrop-blur md:flex">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${paused ? "bg-amber" : "bg-accent"}`}
        />
        {paused ? "Paused" : "Auto"}
      </div>
    </section>
  );
}
