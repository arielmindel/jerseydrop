import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getAllProducts, getHeroImageFor } from "@/lib/products";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";

type CatalogTile = {
  href: string;
  titleHe: string;
  subtitleHe: string;
  badgeLabel: string;
  accent: string;
  filterTag: string;
};

const TILES: CatalogTile[] = [
  {
    href: "/products?catalog=player",
    titleHe: "Player Edition",
    subtitleHe: "חולצות שחקנים — בד מיקרו פייבר נושם",
    badgeLabel: "PRO QUALITY",
    accent: "#00FF88",
    filterTag: "player",
  },
  {
    href: "/products?catalog=fan",
    titleHe: "Fan Edition",
    subtitleHe: "החולצה היומיומית — איכות גבוהה במחיר נגיש",
    badgeLabel: "EVERYDAY",
    accent: "#22D3EE",
    filterTag: "fan",
  },
  {
    href: "/collections/short-suit",
    titleHe: "סטים שלמים",
    subtitleHe: "חולצה + מכנס באותו עיצוב",
    badgeLabel: "FULL KITS",
    accent: "#A855F7",
    filterTag: "short-suit",
  },
  {
    href: "/retro",
    titleHe: "רטרו",
    subtitleHe: "קלאסיקות מ-80s ועד 10s",
    badgeLabel: "TIMELESS",
    accent: "#D4AF37",
    filterTag: "retro",
  },
];

export default function DiscoverByCatalog() {
  const all = getAllProducts();
  // Count + pick a representative image per catalog
  const tiles = TILES.map((t) => {
    const matching = all.filter((p) => p.tags?.includes(t.filterTag));
    const image =
      matching.find((p) => p.images?.length)?.images[0] ||
      getHeroImageFor({ category: "club" });
    return { ...t, count: matching.length, image };
  });

  return (
    <section className="container py-14 md:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="section-eyebrow">Discover</span>
          <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-tight md:text-4xl">
            גלה לפי קטלוג
          </h2>
          <p className="mt-2 text-sm text-muted md:text-base">
            סינון מהיר לפי איכות וסגנון
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-surface transition-all duration-500 hover:-translate-y-1"
          >
            {t.image ? (
              <Image
                src={t.image}
                alt={t.titleHe}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
              />
            ) : (
              <div className="absolute inset-0 bg-card-gradient" />
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-25 transition-opacity duration-500 group-hover:opacity-45"
              style={{ backgroundColor: t.accent }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/0"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5">
              <span
                className="font-display text-[10px] font-bold uppercase tracking-widest"
                style={{ color: t.accent }}
              >
                {t.badgeLabel}
              </span>
              <h3 className="font-display text-xl font-black uppercase leading-tight">
                {t.titleHe}
              </h3>
              <p className="line-clamp-2 text-xs text-muted">{t.subtitleHe}</p>
              <div className="mt-1 inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-foreground">
                {t.count} פריטים <ArrowLeft className="h-3 w-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
