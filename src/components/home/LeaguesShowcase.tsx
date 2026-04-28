import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

/**
 * Magazine grid of league/category cards on the homepage.
 *
 * After V5.1 feedback the user supplied 7 high-quality photo banners (player
 * portraits + league marks + crowd backdrops). We now render those edge-to-edge
 * with a colour-coded ribbon on the bottom carrying the Hebrew title.
 *
 * The 8th card (World Cup) keeps a trophy-style SVG composition until the user
 * saves the FIFA trophy image they referenced — see /public/images/leagues/.
 */

type LeagueTile = {
  href: string;
  titleHe: string;
  titleEn: string;
  /** Tailwind colour class for the title ribbon at the bottom. */
  ribbonClass: string;
} & (
  | { kind: "image"; src: string }
  | { kind: "world-cup" }
);

const TILES: LeagueTile[] = [
  // Row 1
  {
    href: "/leagues/la-liga",
    titleHe: "ליגה ספרדית",
    titleEn: "La Liga",
    ribbonClass: "bg-amber/95 text-background",
    kind: "image",
    src: "/images/leagues/la-liga.jpg",
  },
  {
    href: "/leagues/premier-league",
    titleHe: "ליגה אנגלית",
    titleEn: "Premier League",
    ribbonClass: "bg-violet/95 text-foreground",
    kind: "image",
    src: "/images/leagues/premier-league.jpg",
  },
  {
    href: "/nations",
    titleHe: "נבחרות",
    titleEn: "National Teams",
    ribbonClass: "bg-cyan/95 text-background",
    kind: "image",
    src: "/images/leagues/nations.jpg",
  },
  {
    href: "/collections/world-cup-2026",
    titleHe: "מונדיאל",
    titleEn: "World Cup 2026",
    ribbonClass: "bg-gold/95 text-background",
    kind: "world-cup",
  },
  // Row 2
  {
    href: "/leagues/other",
    titleHe: "ליגות אחרות",
    titleEn: "Other Leagues",
    ribbonClass: "bg-accent/95 text-background",
    kind: "image",
    src: "/images/leagues/other.jpg",
  },
  {
    href: "/leagues/ligue-1",
    titleHe: "ליגה צרפתית",
    titleEn: "Ligue 1",
    ribbonClass: "bg-blue-500/95 text-foreground",
    kind: "image",
    src: "/images/leagues/ligue-1.jpg",
  },
  {
    href: "/leagues/bundesliga",
    titleHe: "ליגה גרמנית",
    titleEn: "Bundesliga",
    ribbonClass: "bg-destructive/95 text-foreground",
    kind: "image",
    src: "/images/leagues/bundesliga.jpg",
  },
  {
    href: "/leagues/serie-a",
    titleHe: "ליגה איטלקית",
    titleEn: "Serie A",
    ribbonClass: "bg-sky-400/95 text-background",
    kind: "image",
    src: "/images/leagues/serie-a.jpg",
  },
];

/** FIFA-trophy-inspired SVG composition used until we have the photo asset. */
function WorldCupPanel() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Stadium-night gradient backdrop */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, #2A1F00 0%, #0A0700 70%, #000 100%)",
        }}
      />
      {/* Light rays from above */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-3/4"
        style={{
          background:
            "conic-gradient(from 270deg at 50% 0%, transparent 0deg, rgba(212,175,55,0.18) 30deg, transparent 60deg, rgba(212,175,55,0.12) 90deg, transparent 120deg)",
        }}
      />
      {/* Trophy SVG — taller and more anatomically correct than V5.0 */}
      <svg
        viewBox="0 0 200 280"
        className="absolute left-1/2 top-1/2 h-[78%] w-auto -translate-x-1/2 -translate-y-[55%] drop-shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
        aria-hidden
      >
        <defs>
          <linearGradient id="wcGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE9A0" />
            <stop offset="35%" stopColor="#E5BC4A" />
            <stop offset="70%" stopColor="#B8862C" />
            <stop offset="100%" stopColor="#6B4A12" />
          </linearGradient>
          <linearGradient id="wcShine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <radialGradient id="wcGlobe" cx="0.4" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="#FFEFB0" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#5C3B0D" />
          </radialGradient>
        </defs>

        {/* Globe at top */}
        <circle cx="100" cy="60" r="32" fill="url(#wcGlobe)" />
        <ellipse cx="100" cy="60" rx="32" ry="10" fill="none" stroke="#3A2305" strokeWidth="0.8" opacity="0.8" />
        <ellipse cx="100" cy="60" rx="32" ry="22" fill="none" stroke="#3A2305" strokeWidth="0.6" opacity="0.5" />

        {/* Twisted handle silhouettes coming up to support the globe */}
        <path
          d="M70 90
             C 56 130, 60 158, 80 174
             L 80 188
             L 120 188
             L 120 174
             C 140 158, 144 130, 130 90
             Z"
          fill="url(#wcGold)"
        />
        {/* Inner curve detail */}
        <path
          d="M82 100 C 74 132, 78 156, 92 168 L 92 188"
          fill="none"
          stroke="#5C3B0D"
          strokeWidth="1.2"
          opacity="0.55"
        />
        <path
          d="M118 100 C 126 132, 122 156, 108 168 L 108 188"
          fill="none"
          stroke="#5C3B0D"
          strokeWidth="1.2"
          opacity="0.55"
        />

        {/* Stem joining base */}
        <rect x="86" y="188" width="28" height="14" fill="url(#wcGold)" />

        {/* Tiered base */}
        <rect x="70" y="202" width="60" height="12" rx="2" fill="url(#wcGold)" />
        <rect x="70" y="202" width="60" height="12" rx="2" fill="none" stroke="#5C3B0D" strokeWidth="0.5" opacity="0.6" />
        <rect x="62" y="216" width="76" height="14" rx="2" fill="url(#wcGold)" />
        <rect x="62" y="216" width="76" height="14" rx="2" fill="none" stroke="#5C3B0D" strokeWidth="0.5" opacity="0.6" />

        {/* Green malachite ring on the base — characteristic of the FIFA cup */}
        <rect x="62" y="232" width="76" height="6" fill="#0A4A1E" />
        <rect x="62" y="238" width="76" height="2" fill="#1B6A30" opacity="0.6" />

        {/* Subtle highlight sweep */}
        <path
          d="M76 100 C 70 130, 76 160, 92 178"
          fill="none"
          stroke="url(#wcShine)"
          strokeWidth="3"
          opacity="0.85"
        />
      </svg>

      {/* "FIFA WORLD CUP 2026" mark */}
      <div className="absolute inset-x-0 bottom-[64px] flex flex-col items-center gap-1">
        <span className="font-display text-[8px] font-bold uppercase tracking-[0.4em] text-gold/90">
          FIFA World Cup
        </span>
        <span
          className="font-display text-[28px] font-black leading-none"
          style={{
            background: "linear-gradient(180deg, #FFE9A0 0%, #B8862C 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.2em",
          }}
        >
          2026
        </span>
      </div>
    </div>
  );
}

export default function LeaguesShowcase() {
  return (
    <section className="container py-14 md:py-20">
      <div className="mb-8 text-center md:mb-12">
        <h2
          className="font-display text-5xl font-black uppercase tracking-tight md:text-7xl"
          style={{
            WebkitTextStroke: "1.5px rgba(212, 175, 55, 0.45)",
            color: "transparent",
            textShadow: "0 0 40px rgba(212, 175, 55, 0.15)",
          }}
        >
          ליגות
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 hover:-translate-y-1 hover:border-accent/60 hover:shadow-glow-sm md:aspect-[3/4.2]"
          >
            {t.kind === "image" ? (
              <Image
                src={t.src}
                alt={t.titleHe}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority={false}
              />
            ) : (
              <WorldCupPanel />
            )}

            {/* Soft gradient so the ribbon stands out */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-background/0 via-transparent to-background/55"
            />

            {/* Coloured ribbon */}
            <div
              className={`absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-4 py-3 ${t.ribbonClass}`}
            >
              <span className="font-display text-base font-black uppercase leading-none tracking-tight md:text-lg">
                {t.titleHe}
              </span>
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
