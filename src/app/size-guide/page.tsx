"use client";

import { useState } from "react";
import { Ruler, Shirt, Hand } from "lucide-react";

type SizeRow = {
  size: string;
  chestCm: string;
  lengthCm: string;
  chestIn: string;
  lengthIn: string;
};

const ADULT_SIZES: SizeRow[] = [
  { size: "S",   chestCm: "94–100",  lengthCm: "68", chestIn: '37–39"', lengthIn: '26.8"' },
  { size: "M",   chestCm: "100–106", lengthCm: "70", chestIn: '39–42"', lengthIn: '27.6"' },
  { size: "L",   chestCm: "106–112", lengthCm: "72", chestIn: '42–44"', lengthIn: '28.3"' },
  { size: "XL",  chestCm: "112–118", lengthCm: "74", chestIn: '44–46"', lengthIn: '29.1"' },
  { size: "2XL", chestCm: "118–124", lengthCm: "76", chestIn: '46–49"', lengthIn: '29.9"' },
  { size: "3XL", chestCm: "124–130", lengthCm: "78", chestIn: '49–51"', lengthIn: '30.7"' },
  { size: "4XL", chestCm: "130–136", lengthCm: "80", chestIn: '51–54"', lengthIn: '31.5"' },
];

const KIDS_SIZES: SizeRow[] = [
  { size: "16", chestCm: "62–66", lengthCm: "44", chestIn: '24–26"', lengthIn: '17.3"' },
  { size: "18", chestCm: "66–70", lengthCm: "47", chestIn: '26–28"', lengthIn: '18.5"' },
  { size: "20", chestCm: "70–74", lengthCm: "50", chestIn: '28–29"', lengthIn: '19.7"' },
  { size: "22", chestCm: "74–78", lengthCm: "53", chestIn: '29–31"', lengthIn: '20.9"' },
  { size: "24", chestCm: "78–82", lengthCm: "56", chestIn: '31–32"', lengthIn: '22.0"' },
  { size: "26", chestCm: "82–86", lengthCm: "59", chestIn: '32–34"', lengthIn: '23.2"' },
  { size: "28", chestCm: "86–90", lengthCm: "62", chestIn: '34–35"', lengthIn: '24.4"' },
];

type Tab = "adults" | "kids";

export default function SizeGuidePage() {
  const [tab, setTab] = useState<Tab>("adults");
  const rows = tab === "adults" ? ADULT_SIZES : KIDS_SIZES;

  return (
    <>
      <section className="border-b border-border/60 bg-background">
        <div className="container py-12 md:py-16">
          <span className="section-eyebrow">Sizing</span>
          <h1 className="mt-3 font-display text-4xl font-black uppercase leading-tight md:text-5xl">
            מדריך מידות
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted md:text-base">
            כל המידות במדריך הזה הן בס״מ ובאינץ׳. החולצות שלנו לפי גזרה
            אסיאתית — אם אתם בין שתי מידות, מומלץ לעלות מידה.
          </p>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        {/* Tabs */}
        <div role="tablist" aria-label="Size guide tabs" className="mb-6 inline-flex rounded-full border border-border bg-surface p-1">
          {([
            { id: "adults" as Tab, label: "מבוגרים" },
            { id: "kids" as Tab, label: "ילדים" },
          ]).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-5 py-2 font-display text-sm font-bold uppercase tracking-wide transition-all ${
                  active
                    ? "bg-accent text-accent-foreground shadow-glow"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr className="font-display text-xs uppercase tracking-widest text-muted">
                  <th className="py-3 text-start ps-4">מידה</th>
                  <th className="py-3 text-start">חזה (ס״מ)</th>
                  <th className="py-3 text-start">אורך (ס״מ)</th>
                  <th className="py-3 text-start">חזה (אינץ׳)</th>
                  <th className="py-3 text-start pe-4">אורך (אינץ׳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.size} className="hover:bg-surface/40">
                    <td className="py-3 ps-4 font-display font-bold text-foreground">
                      {r.size}
                    </td>
                    <td className="py-3 text-foreground">{r.chestCm}</td>
                    <td className="py-3 text-foreground">{r.lengthCm}</td>
                    <td className="py-3 text-muted">{r.chestIn}</td>
                    <td className="py-3 pe-4 text-muted">{r.lengthIn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4 text-xs text-accent">
          💡 החולצות לפי גזרה אסיאתית. אם אתם בין מידות, מומלץ לעלות
          מידה.
        </p>
      </section>

      {/* How to measure */}
      <section className="container pb-16">
        <div className="mb-6">
          <span className="section-eyebrow">How To</span>
          <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-tight md:text-3xl">
            איך מודדים?
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <MeasureCard
            icon={Shirt}
            label="חזה"
            description="מודדים סביב החזה במקום הרחב ביותר, מתחת לבית-השחי. שמרו על סרט המידה ישר ולא מתוח. השוו לעמודה ׳חזה׳ בטבלה."
          />
          <MeasureCard
            icon={Ruler}
            label="אורך"
            description="מודדים מהכתף (עליונה) עד תחתית החולצה. השוו לעמודה ׳אורך׳ בטבלה."
          />
          <MeasureCard
            icon={Hand}
            label="שרוול"
            description="מודדים מהכתף (תפר עליון) דרך מרפק עד שורש כף היד. רלוונטי רק לחולצות שרוול ארוך."
          />
        </div>
      </section>
    </>
  );
}

function MeasureCard({
  icon: Icon,
  label,
  description,
}: {
  icon: typeof Ruler;
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-1 font-display text-base font-bold uppercase tracking-tight">
        {label}
      </h3>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}
