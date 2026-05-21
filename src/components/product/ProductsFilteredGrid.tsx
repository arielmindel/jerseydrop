"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import {
  applyFilters,
  parseFilters,
  type ProductFilterParams,
} from "@/lib/filters";
import InfiniteProductGrid from "./InfiniteProductGrid";

/**
 * Client-side wrapper that takes the FULL catalog, reads URL search
 * params, and renders an `InfiniteProductGrid` of the filtered subset.
 *
 * Why: the parent page (/products) used to call `applyFilters` on the
 * server with `searchParams` — that opt-out flipped the route to
 * dynamic, so every request (including bot crawls at 3 rps) re-executed
 * the function and re-streamed the catalog from origin. By moving the
 * filter logic here, the page can be statically rendered + cached at
 * the CDN; filtering happens in the browser after hydration.
 */
export default function ProductsFilteredGrid({
  products,
}: {
  products: Product[];
}) {
  const sp = useSearchParams();

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

  const filtered = useMemo(() => {
    const filters = parseFilters(searchParams);
    return applyFilters(products, filters);
  }, [products, searchParams]);

  return <InfiniteProductGrid products={filtered} />;
}
