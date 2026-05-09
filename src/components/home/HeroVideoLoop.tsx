"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, ArrowDown } from "lucide-react";
import WorldCupCountdown from "./WorldCupCountdown";

/**
 * Cinematic video hero — JerseyDrop V8.
 *
 * Distinct from competitor (sporthubkit.com) by design:
 *   • dual overlay = radial vignette + neon-green corner glow (vs. their
 *     plain dark gradient)
 *   • bold display type with gold accent on key word "התשוקה"
 *   • bottom-LEFT CTA with smooth-scroll to the products/leagues block
 *     (vs. their static link)
 *   • live World Cup 2026 countdown integrated INTO the hero
 *
 * Performance:
 *   • <source media> swaps to a 480p variant on narrow viewports (~280KB)
 *   • prefers-reduced-motion → pauses video, poster stays visible
 *   • muted + playsInline + autoPlay (Safari iOS friendly)
 *   • poster shown immediately so the hero isn't blank during decode
 */
export default function HeroVideoLoop() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Honor reduced-motion: pause the loop, the poster image stays.
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (mql.matches) {
        video.pause();
      } else {
        // play() returns a promise; some browsers reject if autoplay blocked
        video.play().catch(() => {});
      }
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  const scrollToLeagues: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    e.preventDefault();
    const el = document.getElementById("leagues");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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

      {/* ---- DUAL OVERLAY (this is the unique differentiator) ----
           Layer 1: radial vignette so the corners darken and the
           foreground type sits comfortably no matter the frame.
           Layer 2: bottom-left neon-green soft glow that ties the
           hero to the JerseyDrop accent palette. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.78) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 12% 88%, rgba(0,255,136,0.18) 0%, transparent 65%), radial-gradient(ellipse 50% 50% at 85% 15%, rgba(212,175,55,0.10) 0%, transparent 60%)",
        }}
      />

      {/* Subtle film grain (texture so video doesn't look "clean stock") */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      {/* ---- FOREGROUND CONTENT ---- */}
      <div className="container relative z-10 flex h-full flex-col py-8 md:py-12">
        {/* Top row — eyebrow tag (right side in RTL) */}
        <div className="flex items-center justify-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-background/30 px-3 py-1.5 font-display text-[0.625rem] font-bold uppercase tracking-[0.32em] text-accent backdrop-blur-md">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent shadow-glow-sm" />
            JerseyDrop
          </span>
        </div>

        {/* Center — H1 + subline + countdown */}
        <div className="my-auto flex flex-col items-center text-center">
          <h1 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-white drop-shadow-2xl sm:text-5xl md:text-7xl">
            לבש את{" "}
            <span
              className="inline-block bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(180deg, #fcd34d 0%, #d4a017 100%)",
              }}
            >
              התשוקה
            </span>{" "}
            למשחק
          </h1>
          <p className="mt-4 max-w-xl font-display text-sm text-white/80 sm:text-base md:text-lg">
            חולצות כדורגל מהליגות הגדולות בעולם · משלוח 10–15 ימי עסקים
          </p>

          {/* Countdown — neon green, integrated into hero */}
          <div className="mt-6 md:mt-8">
            <WorldCupCountdown compact />
          </div>
        </div>

        {/* Bottom row — CTA on the left (RTL) + scroll hint */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col items-start gap-2">
            <a
              href="#leagues"
              onClick={scrollToLeagues}
              className="group inline-flex h-12 items-center gap-2 rounded-full px-6 font-display text-sm font-black uppercase tracking-[0.18em] text-background shadow-2xl transition-all duration-base ease-emphasized hover:-translate-y-0.5 sm:h-14 sm:px-8 sm:text-base"
              style={{
                background: "linear-gradient(135deg, #fcd34d 0%, #d4a017 100%)",
                boxShadow:
                  "0 14px 40px -10px rgba(252,211,77,0.55), 0 0 0 1px rgba(252,211,77,0.40)",
              }}
            >
              קנה עכשיו
              <ArrowDown className="h-4 w-4 transition-transform duration-base group-hover:translate-y-0.5" />
            </a>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("leagues")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              aria-label="גלול למטה"
              className="ml-2 inline-flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-[0.32em] text-white/60 transition-colors duration-base hover:text-accent"
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
