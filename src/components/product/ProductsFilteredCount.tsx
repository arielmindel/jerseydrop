"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import {
  applyFilters,
  parseFilters,
  type ProductFilterParams,
} from "@/lib/filters";

/**
 * Renders the "X / Y חולצות" count badge that used to live on the
 * server side of /products/page.tsx. Moved client-side so the page
 * itself can be rendered statically (ISR) instead of dynamically on
 * every request. Reads URL params via the client hook and recomputes
 * the filtered count on each navigation.
 */
export default function ProductsFilteredCount({
  products,
}: {
  products: Product[];
}) {
  const sp = useSearchParams();

  // Build a plain { key: string | string[] } object from URLSearchParams.
  // parseFilters expects the same shape Next.js gives to server pages.
  const searchParams = useMemo<ProductFilterParams>(() => {
    const out: Record<string, string | string[]> = {};
    const seen = new Set<string>();
    Array.from(sp.keys()).forEach((key) => {
      if (seen.has(key)) return;
      seen.add(key);
      const values = sp.getAll(key);
      out[key] = values.length > 1 ? values : values[0];
    });
    return out as ProductFilterParams;
  }, [sp]);

  const filteredLength = useMemo(() => {
    const filters = parseFilters(searchParams);
    return applyFilters(products, filters).length;
  }, [products, searchParams]);

  return (
    <span className="text-sm text-muted">
      {filteredLength} / {products.length} חולצות
    </span>
  );
}
