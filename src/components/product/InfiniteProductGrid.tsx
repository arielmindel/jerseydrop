"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

const PAGE_SIZE = 24;

/**
 * Client-side incremental rendering driven by IntersectionObserver.
 * The full filtered product list is passed in; we just slice it. This way
 * the URL stays shareable (no client-side filter state) and the experience
 * stays snappy even with hundreds of results.
 */
export default function InfiniteProductGrid({
  products,
  emptyHint = "לא נמצאו חולצות תואמות. נסו להסיר חלק מהפילטרים.",
}: {
  products: Product[];
  emptyHint?: string;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset when the underlying list changes (e.g. user toggled a filter).
  // Use product list length + first id as a cheap dependency.
  const listKey = useMemo(
    () => `${products.length}|${products[0]?.id || ""}`,
    [products],
  );
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [listKey]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible((v) => Math.min(v + PAGE_SIZE, products.length));
          }
        }
      },
      { rootMargin: "600px 0px" }, // start fetching well before user reaches the end
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [products.length]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-surface/40 py-16 text-center">
        <div className="font-display text-lg font-bold uppercase tracking-tight">
          הסל ריק
        </div>
        <p className="max-w-sm text-sm text-muted">{emptyHint}</p>
      </div>
    );
  }

  const sliced = products.slice(0, visible);
  const allLoaded = visible >= products.length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {sliced.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* Sentinel + status */}
      <div
        ref={sentinelRef}
        className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted"
        aria-live="polite"
      >
        {!allLoaded ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <span>טוען עוד… ({sliced.length} מתוך {products.length})</span>
          </>
        ) : (
          <span className="font-display text-xs uppercase tracking-widest">
            זה הכל. ראית את כל {products.length} המוצרים.
          </span>
        )}
      </div>
    </div>
  );
}
