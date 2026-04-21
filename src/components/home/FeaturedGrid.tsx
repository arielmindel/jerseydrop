import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { getFeaturedProducts } from "@/lib/products";

export default function FeaturedGrid() {
  const featured = getFeaturedProducts(8);

  return (
    <section className="container py-16 md:py-24">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="section-eyebrow">Top Sellers</span>
          <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-tight md:text-5xl">
            הנמכרות ביותר
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted md:text-base">
            החולצות שכולם קונים השנה — לפני שכל מידה נגמרת במלאי.
          </p>
        </div>
        <Link
          href="/products"
          className="hidden items-center gap-1.5 font-display text-xs font-bold uppercase tracking-widest text-accent hover:underline md:inline-flex"
        >
          כל החולצות <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-8 flex md:hidden">
        <Link
          href="/products"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-surface py-3 font-display text-xs font-bold uppercase tracking-widest text-accent"
        >
          כל החולצות <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
