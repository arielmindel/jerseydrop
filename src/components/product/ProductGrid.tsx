import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
  emptyHint = "לא נמצאו חולצות תואמות. נסו להסיר חלק מהפילטרים.",
}: {
  products: Product[];
  emptyHint?: string;
}) {
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
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
