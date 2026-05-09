import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Sparkles, Gift, Baby, Shirt, Crown } from "lucide-react";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";

/**
 * Magazine-style collections grid.
 * Bento layout: a single big card on the right (RTL = reads first), 4 smaller
 * cards filling the rest. Each tile uses the same brand-curated category
 * artwork that powers the matching landing page hero — so the homepage and
 * the destination feel like one continuous flow.
 */

type Tile = {
  href: string;
  titleHe: string;
  badgeLabel: string;
  ribbonClass: string;
  Icon: typeof Star;
  /** Tailwind grid placement classes */
  span: string;
  /** Hero image (matches /public/categories/<x>.jpg) */
  image: string;
};

const TILES: Tile[] = [
  {
    href: "/collections/surprise",
    titleHe: "חולצה בהפתעה",
    badgeLabel: "MYSTERY DROP",
    ribbonClass: "bg-amber/95 text-background",
    Icon: Gift,
    // Big hero — 2 cols × 2 rows
    span: "md:col-span-2 md:row-span-2",
    image: "/categories/mystery.jpg",
  },
  {
    href: "/retro",
    titleHe: "רטרו",
    badgeLabel: "RETRO · CLASSICS",
    ribbonClass: "bg-sky-400/95 text-background",
    Icon: Crown,
    span: "",
    image: "/categories/retro.jpg",
  },
  {
    href: "/kids",
    titleHe: "מידות ילדים",
    badgeLabel: "KIDS",
    ribbonClass: "bg-violet/95 text-foreground",
    Icon: Baby,
    span: "",
    image: "/categories/kids.jpg",
  },
  {
    href: "/collections/special",
    titleHe: "מיוחדות",
    badgeLabel: "SPECIAL EDITIONS",
    ribbonClass: "bg-amber/95 text-background",
    Icon: Sparkles,
    span: "",
    image: "/categories/special.jpg",
  },
  {
    href: "/collections/long-sleeve",
    titleHe: "חולצות ארוכות",
    badgeLabel: "LONG SLEEVE",
    ribbonClass: "bg-blue-500/95 text-foreground",
    Icon: Shirt,
    span: "",
    image: "/categories/long-sleeve.jpg",
  },
];

export default function CollectionsShowcase() {
  const tiles = TILES;

  return (
    <section className="container section-y">
      <header className="mb-8 flex flex-col items-center gap-3 text-center md:mb-12">
        <SectionEyebrow tone="gold">Curated Drops</SectionEyebrow>
        <h2
          className="font-display text-display-lg font-black uppercase"
          style={{
            WebkitTextStroke: "1.5px rgba(212, 175, 55, 0.45)",
            color: "transparent",
            textShadow: "0 0 40px rgba(212, 175, 55, 0.15)",
          }}
        >
          קולקציות
        </h2>
        <p className="max-w-md text-body-sm text-muted">
          קולקציות מובחרות לכל סוג אוהד — רטרו, ילדים, מהדורות מיוחדות ועוד.
        </p>
      </header>

      <div className="reveal-grid grid auto-rows-[180px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4 md:gap-4 lg:gap-6">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`reveal-item group relative block overflow-hidden rounded-2xl border border-border bg-surface edge-light transition-all duration-base ease-emphasized hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow-sm ${t.span}`}
          >
            <Image
              src={t.image}
              alt={t.titleHe}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover transition-transform duration-slow group-hover:scale-[1.08]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/55"
            />
            {/* Floating badge — top-end. Subtly glassy so it doesn't fight
                 with the image. */}
            <div className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-2.5 py-1 backdrop-blur-md">
              <t.Icon className="h-3 w-3 text-foreground/80" />
              <span className="font-display text-[0.625rem] font-bold uppercase leading-none tracking-[0.18em] text-foreground/80">
                {t.badgeLabel}
              </span>
            </div>
            <div
              className={`absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-4 py-3 ${t.ribbonClass}`}
            >
              <span className="font-display text-h3 font-black uppercase leading-none tracking-tight">
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
