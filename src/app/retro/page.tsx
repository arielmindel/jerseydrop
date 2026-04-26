import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { getRetroProducts } from "@/lib/products";
import ProductGrid from "@/components/product/ProductGrid";

export const metadata: Metadata = {
  title: "רטרו — קלאסיקות שלא יחזרו",
  description:
    "חולצות רטרו ונוסטלגיה: ארגנטינה 2010, ריאל 06-07, מנצ׳סטר יונייטד 13-14 ועוד.",
};

export default function RetroPage() {
  const retro = getRetroProducts();

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-background">
        <div
          aria-hidden
          className="absolute -top-10 end-0 h-96 w-96 rounded-full bg-gold/10 blur-[160px]"
        />
        <div className="container relative py-14 md:py-20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="section-eyebrow !text-gold">Retro · Classic</span>
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black uppercase leading-[1.05] md:text-6xl">
            קלאסיקות <span className="text-gold">שלא יחזרו</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted md:text-base">
            חולצות מיתולוגיות שמעבירות אתכם לעונות שלא נשכחו — רפרודוקציות
            נאמנות למקור, בדים כמו של פעם, ותחושה שלא תקבלו במקום אחר.
          </p>
        </div>
      </section>
      <section className="container py-10 md:py-14">
        <ProductGrid
          products={retro}
          emptyHint="הרטרו עומד לחזור — בקרוב יתווספו דגמים חדשים."
        />
      </section>
    </>
  );
}
