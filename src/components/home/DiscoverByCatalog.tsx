import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getAllProducts, getHeroImageFor } from "@/lib/products";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";

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
    <section className="container section-y">
      <header className="mb-8 flex items-end justify-between gap-4 md:mb-10">
        <div className="flex flex-col gap-2">
          <SectionEyebrow>Discover</SectionEyebrow>
          <h2 className="font-display text-display font-black uppercase">
            גלה לפי קטלוג
          </h2>
          <p className="text-body-sm text-muted">
            סינון מהיר לפי איכות וסגנון
          </p>
        </div>
      </header>

      <div className="reveal-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="reveal-item group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-surface edge-light transition-all duration-base ease-emphasized hover:-translate-y-1 hover:border-accent/40"
          >
            {t.image ? (
              <Image
                src={t.image}
                alt={t.titleHe}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover opacity-70 transition-all duration-slow group-hover:scale-[1.06] group-hover:opacity-95"
              />
            ) : (
              <div className="absolute inset-0 bg-card-gradient" />
            )}
            {/* Accent colour wash — fades up on hover for that "lit" feel */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-25 transition-opacity duration-base group-hover:opacity-50"
              style={{ backgroundColor: t.accent }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/0"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5">
              <span
                className="font-display text-[0.625rem] font-bold uppercase leading-none tracking-[0.18em]"
                style={{ color: t.accent }}
              >
                {t.badgeLabel}
              </span>
              <h3 className="font-display text-h2 font-black uppercase leading-tight">
                {t.titleHe}
              </h3>
              <p className="line-clamp-2 text-body-sm text-muted">{t.subtitleHe}</p>
              <div className="mt-1 inline-flex items-center gap-1.5 font-display text-[0.625rem] font-bold uppercase tracking-[0.18em] text-foreground">
                {t.count} פריטים{" "}
                <ArrowLeft className="h-3 w-3 transition-transform duration-base group-hover:-translate-x-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
