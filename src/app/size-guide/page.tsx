import type { Metadata } from "next";
import SizeGuideTable from "@/components/product/SizeGuideTable";

export const metadata: Metadata = {
  title: "מדריך מידות",
  description:
    "טבלת מידות JerseyDrop בס״מ — חזה, אורך וכתף מ-S עד 4XL, Fan ו-Player.",
};

export default function SizeGuidePage() {
  return (
    <section className="container grid gap-10 py-14 md:grid-cols-[1fr_1.1fr] md:py-20">
      <div className="space-y-4">
        <span className="section-eyebrow">Size Guide</span>
        <h1 className="font-display text-4xl font-black uppercase leading-tight md:text-5xl">
          איך לבחור מידה
        </h1>
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            המידות שלנו הן למבוגרים, בגזרה של כדורגל רשמי. אם אתם בין שתי מידות,
            עלו מידה — במיוחד בגרסת Player שגזרתה צמודה יותר.
          </p>
          <p>
            <strong className="text-foreground">איך מודדים?</strong> חזה: היקף בחלק
            הרחב ביותר של בית-החזה. אורך: מהכתף ועד קצה החולצה. כתף: מהתפר ועד
            התפר השני.
          </p>
          <p>
            לא בטוחים? שלחו לנו וואטסאפ עם המידות שלכם ואנחנו נמליץ.
          </p>
        </div>
      </div>
      <div className="self-start rounded-2xl border border-border bg-surface p-5">
        <SizeGuideTable />
      </div>
    </section>
  );
}
