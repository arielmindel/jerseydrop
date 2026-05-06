import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { getFeaturedProducts } from "@/lib/products";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";

export default function FeaturedGrid() {
  const featured = getFeaturedProducts(8);

  return (
    <section className="container section-y">
      <header className="mb-8 flex items-end justify-between gap-4 md:mb-10">
        <div className="flex flex-col gap-2">
          <SectionEyebrow>Top Sellers</SectionEyebrow>
          <h2 className="font-display text-display font-black uppercase">
            הנמכרות ביותר
          </h2>
          <p className="max-w-xl text-body-sm text-muted md:text-body">
            החולצות שכולם קונים השנה — לפני שכל מידה נגמרת במלאי.
          </p>
        </div>
        <Link
          href="/products"
          className="hidden items-center gap-1.5 font-display text-caption font-bold uppercase tracking-[0.18em] text-accent transition-all duration-base ease-emphasized hover:gap-2.5 hover:underline hover:underline-offset-4 md:inline-flex"
        >
          כל החולצות
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-base group-hover:-translate-x-0.5" />
        </Link>
      </header>

      <div className="reveal-grid grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {featured.map((product) => (
          <div key={product.id} className="reveal-item">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="mt-8 flex md:hidden">
        <Link
          href="/products"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-surface py-3 font-display text-caption font-bold uppercase tracking-[0.18em] text-accent transition-all duration-base hover:border-accent/60 hover:bg-surface-2"
        >
          כל החולצות <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
