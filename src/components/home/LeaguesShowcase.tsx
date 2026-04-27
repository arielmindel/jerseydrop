import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getHeroImageFor } from "@/lib/products";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";

/**
 * Magazine-grid showcase of leagues + nations + WC. Inspired by sporthub.com:
 * tall portrait cards with full-bleed jersey photography, Hebrew title in a
 * coloured ribbon at the bottom, hover lifts the image slightly.
 */

type LeagueTile = {
  href: string;
  titleHe: string;
  titleEn: string;
  /** Tailwind text colour for the ribbon — picks up via class composition. */
  ribbonClass: string;
  /** Pull representative image from one of these signals. */
  pickImage: () => string | null;
};

const TILES: LeagueTile[] = [
  // Row 1
  {
    href: "/leagues/la-liga",
    titleHe: "ליגה ספרדית",
    titleEn: "La Liga",
    ribbonClass: "bg-amber/95 text-background",
    pickImage: () => getHeroImageFor({ team: "real-madrid" }) || getHeroImageFor({ league: "la-liga" }),
  },
  {
    href: "/leagues/premier-league",
    titleHe: "ליגה אנגלית",
    titleEn: "Premier League",
    ribbonClass: "bg-violet/95 text-foreground",
    pickImage: () => getHeroImageFor({ team: "manchester-united" }) || getHeroImageFor({ league: "premier-league" }),
  },
  {
    href: "/nations",
    titleHe: "נבחרות",
    titleEn: "National Teams",
    ribbonClass: "bg-cyan/95 text-background",
    pickImage: () => getHeroImageFor({ team: "argentina" }) || getHeroImageFor({ category: "national" }),
  },
  {
    href: "/collections/world-cup-2026",
    titleHe: "מונדיאל",
    titleEn: "World Cup 2026",
    ribbonClass: "bg-gold/95 text-background",
    pickImage: () => getHeroImageFor({ category: "national", isWorldCup2026: true }) || getHeroImageFor({ team: "brazil" }),
  },
  // Row 2
  {
    href: "/leagues/other",
    titleHe: "ליגות אחרות",
    titleEn: "Other Leagues",
    ribbonClass: "bg-accent/95 text-background",
    pickImage: () => getHeroImageFor({ team: "inter-miami" }) || getHeroImageFor({ league: "other" }),
  },
  {
    href: "/leagues/ligue-1",
    titleHe: "ליגה צרפתית",
    titleEn: "Ligue 1",
    ribbonClass: "bg-blue-500/95 text-foreground",
    pickImage: () => getHeroImageFor({ team: "psg" }) || getHeroImageFor({ league: "ligue-1" }),
  },
  {
    href: "/leagues/bundesliga",
    titleHe: "ליגה גרמנית",
    titleEn: "Bundesliga",
    ribbonClass: "bg-destructive/95 text-foreground",
    pickImage: () => getHeroImageFor({ team: "bayern-munich" }) || getHeroImageFor({ league: "bundesliga" }),
  },
  {
    href: "/leagues/serie-a",
    titleHe: "ליגה איטלקית",
    titleEn: "Serie A",
    ribbonClass: "bg-sky-400/95 text-background",
    pickImage: () => getHeroImageFor({ team: "ac-milan" }) || getHeroImageFor({ league: "serie-a" }),
  },
];

export default function LeaguesShowcase() {
  const tiles = TILES.map((t) => ({ ...t, image: t.pickImage() }));

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
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 hover:-translate-y-1 hover:shadow-glow-sm md:aspect-[3/4.2]"
          >
            {t.image ? (
              <Image
                src={t.image}
                alt={t.titleHe}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 bg-card-gradient" />
            )}
            {/* Soft top-down dark gradient so the ribbon stands out */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/40"
            />
            {/* Ribbon */}
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
