import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatILS } from "@/lib/utils";
import { getStartingPrice } from "@/lib/products";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";
import JerseyDropWatermark from "./JerseyDropWatermark";

/** Some products from the merge ended up without a clean Hebrew team name —
 *  fall back to deriving from nameHe so cards never show "Unknown". */
function displayTeam(product: Product): string {
  const t = (product.team || "").trim();
  if (t && t.toLowerCase() !== "unknown") return t;
  // Fall back to nameHe minus season prefix
  return (product.nameHe || "").replace(/^\d{2,4}[-/]\d{2,4}\s*/, "").trim() ||
    "חולצת כדורגל";
}

export default function ProductCard({ product }: { product: Product }) {
  // Catalog-wide flat price as of May 2026 — every product is 119 ₪ regardless
  // of edition (Fan / Player / Retro). Falls back to getStartingPrice() so we
  // still render correctly if the data file is ever rolled back to per-version
  // pricing. No struck-through originalPrice anymore — that field was removed
  // from the data when we went flat.
  const startingPrice = getStartingPrice(product) ?? 119;
  const fallbackImg =
    "https://picsum.photos/seed/jerseydrop-fallback/600/750";
  const primaryImg = product.images?.[0] || fallbackImg;
  const altText = product.nameHe || product.nameEn || displayTeam(product);
  const teamLabel = displayTeam(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface edge-light transition-all duration-base ease-emphasized hover:-translate-y-1 hover:border-accent/50 hover:shadow-glow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-background">
        <Image
          src={primaryImg}
          alt={altText}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          loading="lazy"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="object-cover transition-transform duration-slow ease-emphasized group-hover:scale-[1.06]"
        />
        {/* Subtle bottom gradient on hover so the card feet read as connected */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent opacity-0 transition-opacity duration-base group-hover:opacity-100"
        />
        <JerseyDropWatermark src={primaryImg} size="sm" />
        {/* Badges intentionally removed from card grids — kept on the detail page only. */}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="line-clamp-1 font-display text-body-sm font-bold uppercase tracking-tight text-foreground transition-colors duration-base group-hover:text-accent">
            {teamLabel}
          </span>
          {product.season && (
            <span className="font-display text-caption text-muted">
              {product.season}
            </span>
          )}
        </div>
        <div className="line-clamp-1 text-caption text-muted">{product.nameHe}</div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-body-lg font-bold text-foreground">
              {formatILS(startingPrice)}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-display text-[0.625rem] uppercase tracking-[0.18em] text-muted transition-all duration-base group-hover:gap-2 group-hover:text-accent">
            גלה
            <span aria-hidden className="transition-transform duration-base group-hover:-translate-x-0.5">
              ←
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
