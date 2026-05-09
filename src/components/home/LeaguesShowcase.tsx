import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";

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
    <section id="leagues" className="container scroll-mt-20 section-y">
      <header className="mb-8 flex flex-col items-center gap-3 text-center md:mb-12">
        <SectionEyebrow tone="gold">Football Hubs</SectionEyebrow>
        <h2
          className="font-display text-display-lg font-black uppercase"
          style={{
            WebkitTextStroke: "1.5px rgba(212, 175, 55, 0.45)",
            color: "transparent",
            textShadow: "0 0 40px rgba(212, 175, 55, 0.15)",
          }}
        >
          ליגות
        </h2>
        <p className="max-w-md text-body-sm text-muted">
          הליגות הגדולות בעולם — בחר ליגה וגלה את כל הקבוצות והחולצות שלה.
        </p>
      </header>

      <div className="reveal-grid grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="reveal-item group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface edge-light transition-all duration-base ease-emphasized hover:-translate-y-1 hover:border-accent/60 hover:shadow-glow-sm"
          >
            {/* Banner area — aspect matches the source images (1600×1066 = 3:2)
                so the full composition is visible with no cropping. */}
            <div className="relative aspect-[3/2] w-full overflow-hidden">
              <Image
                src={t.src}
                alt={t.titleHe}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-slow group-hover:scale-[1.06]"
                priority={false}
              />
              {/* Subtle dark wash on hover so the ribbon below feels connected */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0 transition-opacity duration-base group-hover:opacity-100" />
            </div>

            {/* Coloured ribbon — sits BELOW the image so nothing is covered. */}
            <div
              className={`flex items-center justify-between gap-2 px-4 py-3 ${t.ribbonClass}`}
            >
              <span className="font-display text-h3 font-black uppercase leading-none tracking-tight md:text-lg">
                {t.titleHe}
              </span>
              <ArrowLeft className="h-4 w-4 transition-transform duration-base group-hover:-translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
