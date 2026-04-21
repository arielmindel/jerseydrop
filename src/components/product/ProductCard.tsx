import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { formatILS } from "@/lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const hasRetro = product.versions.includes("retro");
  const hasDiscount =
    product.originalPrice && product.originalPrice > product.priceFan;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-glow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-background">
        <Image
          src={product.images[0]}
          alt={`${product.nameEn} — חולצת ${product.nameHe}`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 flex flex-col items-start gap-1.5 start-3">
          {product.tags.includes("bestseller") && (
            <Badge variant="accent">Bestseller</Badge>
          )}
          {product.tags.includes("new") && <Badge variant="accent">חדש</Badge>}
          {hasRetro && <Badge variant="gold">Retro</Badge>}
          {product.stock === "low" && (
            <Badge variant="destructive">אחרונים</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-sm font-bold uppercase tracking-tight text-foreground">
            {product.team}
          </span>
          <span className="font-display text-[10px] text-muted">
            {product.season}
          </span>
        </div>
        <div className="text-xs text-muted line-clamp-1">
          {product.nameHe}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-foreground">
              {formatILS(product.priceFan)}
            </span>
            {hasDiscount && (
              <span className="font-display text-xs text-muted line-through">
                {formatILS(product.originalPrice!)}
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
