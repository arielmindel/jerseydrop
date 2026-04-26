import type { Metadata } from "next";
import Link from "next/link";
import { Star, Trophy } from "lucide-react";
import { getIsraeliProducts } from "@/lib/products";
import InfiniteProductGrid from "@/components/product/InfiniteProductGrid";

export const metadata: Metadata = {
  title: "ישראל — חולצות מקומיות",
  description:
    "כל חולצות הקבוצות הישראליות במקום אחד — הפועל תל אביב, מכבי תל אביב, ביתר ירושלים ועוד.",
};

export default function IsraeliPage() {
  const products = getIsraeliProducts();

  // Group by team to give the page some structure
  const byTeam = products.reduce<Record<string, typeof products>>(
    (acc, p) => {
      const key = p.team || "אחר";
      acc[key] = acc[key] || [];
      acc[key].push(p);
      return acc;
    },
    {},
  );
  const topTeams = Object.entries(byTeam)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-background">
        {/* Israeli flag accent — blue + white horizontal stripes */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(180deg, transparent 0, transparent 22%, #0038b8 22%, #0038b8 32%, transparent 32%, transparent 68%, #0038b8 68%, #0038b8 78%, transparent 78%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -top-12 start-1/3 h-[440px] w-[440px] rounded-full bg-[#0038b8]/12 blur-[160px]"
        />
        <div className="container relative py-14 md:py-20">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-accent" />
            <span className="section-eyebrow">Israel · ישראל</span>
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black uppercase leading-[1.05] md:text-6xl">
            חולצות <span className="text-accent">ישראליות</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted md:text-base">
            כל חולצות הקבוצות המקומיות — מהפועל ומכבי דרך ביתר ועד נבחרת
            ישראל. {products.length} חולצות בקטלוג.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {topTeams.map(([team, items]) => (
              <span
                key={team}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted"
              >
                <Trophy className="h-3 w-3 text-accent" />
                {team}
                <span className="text-muted/70">({items.length})</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <InfiniteProductGrid
          products={products}
          emptyHint={
            products.length === 0
              ? "החולצות הישראליות יעלו לקטלוג בקרוב — חזרו אלינו."
              : undefined
          }
        />
      </section>

      <section className="container pb-16">
        <div className="rounded-3xl border border-border bg-surface p-6 md:p-8">
          <p className="text-sm text-muted md:text-base">
            לא מוצאים את הקבוצה שלכם?{" "}
            <Link
              href="/contact"
              className="font-semibold text-accent hover:underline"
            >
              שלחו לנו הודעה
            </Link>{" "}
            ונשמח לבדוק זמינות אצל הספק.
          </p>
        </div>
      </section>
    </>
  );
}
