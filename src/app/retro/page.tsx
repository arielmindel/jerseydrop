import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { getRetroProducts, getRetroByDecade } from "@/lib/products";
import RetroDecadeTabs from "@/components/product/RetroDecadeTabs";

export const metadata: Metadata = {
  title: "רטרו — קלאסיקות שלא יחזרו",
  description:
    "חולצות רטרו ונוסטלגיה לפי עשור: 80s, 90s, 00s, 10s. ארגנטינה 2010, ריאל 06-07, יונייטד 13-14 ועוד.",
};

export default function RetroPage() {
  const total = getRetroProducts();
  // Pre-compute each decade so the client tabs don't need to do it
  const byDecade = {
    "80s": getRetroByDecade("80s"),
    "90s": getRetroByDecade("90s"),
    "00s": getRetroByDecade("00s"),
    "10s": getRetroByDecade("10s"),
  };
  const undated = total.filter(
    (p) =>
      ![
        ...byDecade["80s"],
        ...byDecade["90s"],
        ...byDecade["00s"],
        ...byDecade["10s"],
      ].some((m) => m.id === p.id),
  );

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
            <span className="text-gold"> {total.length} פריטים בקטלוג.</span>
          </p>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <RetroDecadeTabs byDecade={byDecade} undated={undated} />
      </section>
    </>
  );
}
