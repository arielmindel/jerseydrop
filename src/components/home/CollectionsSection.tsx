import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import {
  COLLECTIONS,
  getCollectionProducts,
  type CollectionId,
} from "@/lib/collections";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";

const ORDER: CollectionId[] = [
  "world-cup-2026",
  "retro-90s",
  "champions-league",
];

export default function CollectionsSection() {
  const tiles = ORDER.map((id) => {
    const meta = COLLECTIONS[id];
    const products = getCollectionProducts(id);
    const heroImg = products[0]?.images?.[0] || null;
    return { id, meta, count: products.length, image: heroImg };
  }).filter((t) => t.count > 0);

  if (tiles.length === 0) return null;

  return (
    <section className="container py-14 md:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="section-eyebrow">Curated</span>
          <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-tight md:text-4xl">
            קולקציות
          </h2>
          <p className="mt-2 text-sm text-muted md:text-base">
            אסופות מיוחדות לפי נושא
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.id}
            href={`/collections/${t.id}`}
            className="group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-surface transition-all duration-500 hover:-translate-y-1 hover:shadow-glow-sm md:aspect-[3/4]"
            style={{
              boxShadow: `0 0 0 0 ${t.meta.accent}00`,
            }}
          >
            {t.image ? (
              <Image
                src={t.image}
                alt={t.meta.titleHe}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
              />
            ) : (
              <div className="absolute inset-0 bg-card-gradient" />
            )}
            {/* Color tint */}
            <div
              aria-hidden
              className="absolute inset-0 mix-blend-overlay opacity-30 group-hover:opacity-50 transition-opacity duration-500"
              style={{ backgroundColor: t.meta.accent }}
            />
            {/* Dark scrim for legibility */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6">
              <span
                className="font-display text-[11px] font-bold uppercase tracking-widest"
                style={{ color: t.meta.accent }}
              >
                {t.meta.badgeLabel}
              </span>
              <h3 className="font-display text-2xl font-black uppercase leading-tight md:text-3xl">
                {t.meta.titleHe}
              </h3>
              <p className="line-clamp-2 text-xs text-muted md:text-sm">
                {t.meta.subtitleHe}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-widest text-foreground transition-colors group-hover:text-accent">
                {t.count} חולצות <ArrowLeft className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
