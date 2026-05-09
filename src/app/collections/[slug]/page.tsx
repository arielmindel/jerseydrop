import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Sparkles, Trophy } from "lucide-react";
import {
  COLLECTIONS,
  getCollectionMeta,
  getCollectionProducts,
  type CollectionId,
} from "@/lib/collections";
import InfiniteProductGrid from "@/components/product/InfiniteProductGrid";
import AudienceToggle from "@/components/product/AudienceToggle";

type Props = {
  params: { slug: string };
  searchParams?: { audience?: string };
};

export function generateStaticParams() {
  return Object.keys(COLLECTIONS).map((slug) => ({ slug }));
}

function isCollectionId(s: string): s is CollectionId {
  return s in COLLECTIONS;
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isCollectionId(params.slug)) return { title: "קולקציה לא נמצאה" };
  const meta = getCollectionMeta(params.slug);
  return {
    alternates: { canonical: `/collections/${params.slug}` },
    title: meta.titleHe,
    description: meta.descriptionHe,
  };
}

export default function CollectionPage({ params, searchParams }: Props) {
  if (!isCollectionId(params.slug)) notFound();
  const meta = getCollectionMeta(params.slug);
  const all = getCollectionProducts(params.slug);
  // Audience gate (segmented toggle above grid). A product is "kids" if
  // explicitly flagged OR is a kids set.
  const audience = searchParams?.audience;
  const products =
    audience === "adult"
      ? all.filter((p) => !p.isKids && p.priceTier !== "kids-set")
      : audience === "kids"
        ? all.filter((p) => p.isKids || p.priceTier === "kids-set")
        : all;

  return (
    <>
      <section
        className="relative isolate overflow-hidden border-b border-border/60"
        style={{ backgroundColor: "#0B1220" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage: `radial-gradient(at 20% 0%, ${meta.accent}33 0px, transparent 55%), radial-gradient(at 90% 30%, ${meta.accent}22 0px, transparent 50%)`,
          }}
        />
        <div className="container relative py-16 md:py-24">
          <div className="flex items-center gap-2">
            {params.slug === "champions-league" ? (
              <Trophy className="h-4 w-4" style={{ color: meta.accent }} />
            ) : (
              <Sparkles className="h-4 w-4" style={{ color: meta.accent }} />
            )}
            <span
              className="font-display text-xs font-bold uppercase tracking-widest"
              style={{ color: meta.accent }}
            >
              {meta.badgeLabel}
            </span>
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black uppercase leading-[1.05] md:text-6xl">
            {meta.titleHe}
          </h1>
          <p className="mt-3 text-sm text-muted md:text-lg">
            {meta.subtitleHe}
          </p>
          <p className="mt-3 max-w-xl text-sm text-muted md:text-base">
            {meta.descriptionHe}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 font-display text-xs text-foreground backdrop-blur">
            {products.length} חולצות בקולקציה
          </div>
        </div>
      </section>

      <section className="container py-6 md:py-8">
        <AudienceToggle />
      </section>

      <section className="container py-4 md:py-10">
        <InfiniteProductGrid
          products={products}
          emptyHint="הקולקציה הזו תתעדכן עם מוצרים נוספים בקרוב."
        />
      </section>
    </>
  );
}
