import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

/**
 * Magazine grid of league/category cards on the homepage.
 *
 * After V5.1 feedback the user supplied 8 high-quality photo banners (player
 * portraits, league marks, FIFA trophy in stadium lighting). We render them
 * edge-to-edge with a colour-coded ribbon at the bottom carrying the Hebrew
 * title.
 */

type LeagueTile = {
  href: string;
  titleHe: string;
  titleEn: string;
  /** Tailwind colour class for the title ribbon at the bottom. */
  ribbonClass: string;
  src: string;
};

const TILES: LeagueTile[] = [
  // Row 1
  {
    href: "/leagues/la-liga",
    titleHe: "ליגה ספרדית",
    titleEn: "La Liga",
    ribbonClass: "bg-amber/95 text-background",
    src: "/images/leagues/la-liga.jpg",
  },
  {
    href: "/leagues/premier-league",
    titleHe: "ליגה אנגלית",
    titleEn: "Premier League",
    ribbonClass: "bg-violet/95 text-foreground",
    src: "/images/leagues/premier-league.jpg",
  },
  {
    href: "/nations",
    titleHe: "נבחרות",
    titleEn: "National Teams",
    ribbonClass: "bg-cyan/95 text-background",
    src: "/images/leagues/nations.jpg",
  },
  {
    href: "/collections/world-cup-2026",
    titleHe: "מונדיאל",
    titleEn: "World Cup 2026",
    ribbonClass: "bg-gold/95 text-background",
    src: "/images/leagues/world-cup.jpg",
  },
  // Row 2
  {
    href: "/leagues/other",
    titleHe: "ליגות אחרות",
    titleEn: "Other Leagues",
    ribbonClass: "bg-accent/95 text-background",
    src: "/images/leagues/other.jpg",
  },
  {
    href: "/leagues/ligue-1",
    titleHe: "ליגה צרפתית",
    titleEn: "Ligue 1",
    ribbonClass: "bg-blue-500/95 text-foreground",
    src: "/images/leagues/ligue-1.jpg",
  },
  {
    href: "/leagues/bundesliga",
    titleHe: "ליגה גרמנית",
    titleEn: "Bundesliga",
    ribbonClass: "bg-destructive/95 text-foreground",
    src: "/images/leagues/bundesliga.jpg",
  },
  {
    href: "/leagues/serie-a",
    titleHe: "ליגה איטלקית",
    titleEn: "Serie A",
    ribbonClass: "bg-sky-400/95 text-background",
    src: "/images/leagues/serie-a.jpg",
  },
];

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
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 hover:-translate-y-1 hover:border-accent/60 hover:shadow-glow-sm"
          >
            {/* Banner area — aspect matches the source images (1600×1066 = 3:2)
                so the full composition is visible with no cropping. */}
            <div className="relative aspect-[3/2] w-full overflow-hidden">
              <Image
                src={t.src}
                alt={t.titleHe}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority={false}
              />
            </div>

            {/* Coloured ribbon — sits BELOW the image so nothing is covered. */}
            <div
              className={`flex items-center justify-between gap-2 px-4 py-3 ${t.ribbonClass}`}
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
