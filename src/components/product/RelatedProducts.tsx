import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <section className="container border-t border-border/60 pb-20 pt-12 md:pb-24 md:pt-16">
      <div className="mb-6">
        <span className="section-eyebrow">You might also like</span>
        <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight md:text-3xl">
          חולצות דומות
        </h2>
      </div>
      <div className="-mx-4 overflow-x-auto pb-2">
        <ul className="mx-4 flex min-w-max gap-4">
          {products.map((p) => (
            <li key={p.id} className="w-60 shrink-0 md:w-64">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
