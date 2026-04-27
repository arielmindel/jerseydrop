import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatILS } from "@/lib/utils";
import { getStartingPrice, hasPrice } from "@/lib/products";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";

export default function ProductCard({ product }: { product: Product }) {
  const startingPrice = getStartingPrice(product);
  const hasDiscount =
    typeof startingPrice === "number" &&
    typeof product.originalPrice === "number" &&
    product.originalPrice > startingPrice;
  const fallbackImg =
    "https://picsum.photos/seed/jerseydrop-fallback/600/750";
  const primaryImg = product.images?.[0] || fallbackImg;
  const altText = product.nameHe || product.nameEn || product.team;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-glow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Badges intentionally removed from card grids — kept on the detail page only.
            Cards show: image, team, season, price chip. */}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="line-clamp-1 font-display text-sm font-bold uppercase tracking-tight text-foreground">
            {product.team}
          </span>
          {product.season && (
            <span className="font-display text-[10px] text-muted">
              {product.season}
            </span>
          )}
        </div>
        <div className="line-clamp-1 text-xs text-muted">{product.nameHe}</div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            {hasPrice(product) && typeof startingPrice === "number" ? (
              <>
                <span className="font-display text-lg font-bold text-foreground">
                  {formatILS(startingPrice)}
                </span>
                {hasDiscount && (
                  <span className="font-display text-xs text-muted line-through">
                    {formatILS(product.originalPrice as number)}
                  </span>
                )}
              </>
            ) : (
              <span className="font-display text-xs uppercase tracking-widest text-muted">
                מחיר בקרוב
              </span>
            )}
          </div>
          <span className="font-display text-[10px] uppercase tracking-widest text-muted group-hover:text-accent">
            גלה ←
          </span>
        </div>
      </div>
    </Link>
  );
}
