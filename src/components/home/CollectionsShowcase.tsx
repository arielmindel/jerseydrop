import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Sparkles, Gift, Baby, Shirt, Crown } from "lucide-react";
import { getAllProducts, getHeroImageFor } from "@/lib/products";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";

/**
 * Magazine-style collections grid (sporthub-inspired).
 * Bento layout: a single big card on the right (RTL = reads first), 4 smaller
 * cards filling the rest. After V5 cleanup we removed:
 *   - "ישראל" — no real israeli inventory yet
 *   - "דריפ"  — duplicated /collections/special filter; merged back in
 */

type Tile = {
  href: string;
  titleHe: string;
  badgeLabel: string;
  ribbonClass: string;
  Icon: typeof Star;
  /** Tailwind grid placement classes */
  span: string;
  pickImage: () => string | null;
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
    pickImage: () => getHeroImageFor({ team: "real-madrid" }),
  },
  {
    href: "/retro",
    titleHe: "רטרו",
    badgeLabel: "RETRO · CLASSICS",
    ribbonClass: "bg-sky-400/95 text-background",
    Icon: Crown,
    span: "",
    pickImage: () => {
      const all = getAllProducts();
      const r = all.find((p) => p.isRetro && p.images?.length);
      return r?.images[0] || null;
    },
  },
  {
    href: "/kids",
    titleHe: "מידות ילדים",
    badgeLabel: "KIDS",
    ribbonClass: "bg-violet/95 text-foreground",
    Icon: Baby,
    span: "",
    pickImage: () => {
      const all = getAllProducts();
      const k = all.find((p) => p.isKids && p.images?.length);
      return k?.images[0] || null;
    },
  },
  {
    href: "/collections/special",
    titleHe: "מיוחדות",
    badgeLabel: "SPECIAL EDITIONS",
    ribbonClass: "bg-amber/95 text-background",
    Icon: Sparkles,
    span: "",
    pickImage: () => {
      const all = getAllProducts();
      const s = all.find((p) => p.isSpecial && p.images?.length);
      return s?.images[0] || null;
    },
  },
  {
    href: "/collections/long-sleeve",
    titleHe: "חולצות ארוכות",
    badgeLabel: "LONG SLEEVE",
    ribbonClass: "bg-blue-500/95 text-foreground",
    Icon: Shirt,
    span: "",
    pickImage: () => {
      const all = getAllProducts();
      const ls = all.find((p) => p.isLongSleeve && p.images?.length);
      return ls?.images[0] || null;
    },
  },
];

export default function CollectionsShowcase() {
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
          קולקציות
        </h2>
      </div>

      <div className="grid auto-rows-[180px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4 md:gap-4">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`group relative block overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 hover:-translate-y-1 hover:shadow-glow-sm ${t.span}`}
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
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/50"
            />
            <div className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-2 py-1 backdrop-blur-sm">
              <t.Icon className="h-3 w-3 text-foreground/80" />
              <span className="font-display text-[9px] font-bold uppercase tracking-widest text-foreground/80">
                {t.badgeLabel}
              </span>
            </div>
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
