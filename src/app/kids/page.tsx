import type { Metadata } from "next";
import { Sparkles, Star } from "lucide-react";
import { getKidsProducts } from "@/lib/products";
import InfiniteProductGrid from "@/components/product/InfiniteProductGrid";

export const metadata: Metadata = {
  title: "ילדים — חולצות במידות נוער",
  description:
    "חולצות הקבוצות הגדולות במידות לילדים. מבחר רחב מהליגות המובילות, נבחרות לאומיות ומונדיאל 2026.",
};

export default function KidsPage() {
  const products = getKidsProducts();

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-background">
        {/* Playful confetti glow */}
        <div
          aria-hidden
          className="absolute -top-12 start-1/4 h-[420px] w-[420px] rounded-full bg-pink-500/15 blur-[160px]"
        />
        <div
          aria-hidden
          className="absolute -bottom-10 end-0 h-[360px] w-[360px] rounded-full bg-accent/15 blur-[140px]"
        />
        <div className="container relative py-14 md:py-20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-400" />
            <span className="section-eyebrow !text-pink-300">Kids · ילדים</span>
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black uppercase leading-[1.05] md:text-6xl">
            חולצות <span className="text-accent">לילדים</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted md:text-base">
            הקבוצה האהובה שלהם, במידות שמתאימות. {products.length} דגמים — מ-
            ריאל מדריד ועד נבחרת ארגנטינה למונדיאל 2026.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1.5 text-xs text-pink-300">
              <Star className="h-3 w-3" />
              גיל 4-14
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs text-accent">
              <Sparkles className="h-3 w-3" />
              גם עם שם ומספר
            </span>
          </div>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <InfiniteProductGrid
          products={products}
          emptyHint={
            products.length === 0
              ? "הקטלוג לילדים מתעדכן — חזרו בקרוב."
              : undefined
          }
        />
      </section>
    </>
  );
}
