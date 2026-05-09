"use client";

import { useState } from "react";
import { Ruler, Shirt, Hand } from "lucide-react";

// V7 — adult sizes capped at S–XXL (no 3XL/4XL anymore; mismatch with the
// catalog after standardisation in commit 8a9c223). Measurements use
// Adidas/Nike replica sizing as the realistic baseline.
type AdultRow = {
  size: string;
  chestCm: string;
  lengthCm: string;
  chestIn: string;
  lengthIn: string;
};

const ADULT_SIZES: AdultRow[] = [
  { size: "S",   chestCm: "94–100",  lengthCm: "68", chestIn: '37–39"', lengthIn: '26.8"' },
  { size: "M",   chestCm: "100–106", lengthCm: "70", chestIn: '39–42"', lengthIn: '27.6"' },
  { size: "L",   chestCm: "106–112", lengthCm: "72", chestIn: '42–44"', lengthIn: '28.3"' },
  { size: "XL",  chestCm: "112–118", lengthCm: "74", chestIn: '44–46"', lengthIn: '29.1"' },
  { size: "XXL", chestCm: "118–124", lengthCm: "76", chestIn: '46–49"', lengthIn: '29.9"' },
];

// V7 — kids sizes use age + height columns instead of inches, mirroring
// what Israeli parents look up first.
type KidsRow = {
  size: string;
  ageHe: string;
  heightCm: string;
  chestCm: string;
  lengthCm: string;
};

const KIDS_SIZES: KidsRow[] = [
  { size: "16", ageHe: "גיל 2-3",   heightCm: "95–105",  chestCm: "62–66", lengthCm: "44" },
  { size: "18", ageHe: "גיל 4-5",   heightCm: "105–115", chestCm: "66–70", lengthCm: "47" },
  { size: "20", ageHe: "גיל 6-7",   heightCm: "115–125", chestCm: "70–74", lengthCm: "50" },
  { size: "22", ageHe: "גיל 8-9",   heightCm: "125–135", chestCm: "74–78", lengthCm: "53" },
  { size: "24", ageHe: "גיל 10-11", heightCm: "135–145", chestCm: "78–82", lengthCm: "56" },
  { size: "26", ageHe: "גיל 12-13", heightCm: "145–155", chestCm: "82–86", lengthCm: "59" },
  { size: "28", ageHe: "גיל 14-15", heightCm: "155–165", chestCm: "86–90", lengthCm: "62" },
];

type Tab = "adults" | "kids";

export default function SizeGuidePage() {
  const [tab, setTab] = useState<Tab>("adults");

  return (
    <>
      <section className="border-b border-border/60 bg-background">
        <div className="container py-12 md:py-16">
          <span className="section-eyebrow">Sizing</span>
          <h1 className="mt-3 font-display text-display-lg font-black uppercase">
            מדריך מידות
          </h1>
          <p className="mt-3 max-w-2xl text-body-sm text-muted md:text-body">
            בחרו ילדים או מבוגרים. כל המידות בס״מ. החולצות לפי גזרה אסיאתית
            — אם אתם בין מידות, מומלץ לעלות מידה.
          </p>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="טאבי מדריך מידות"
          className="mb-6 inline-flex rounded-full border border-border bg-surface p-1"
        >
          {(
            [
              { id: "adults" as Tab, label: "מבוגרים" },
              { id: "kids" as Tab, label: "ילדים" },
            ]
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-5 py-2 font-display text-sm font-bold uppercase tracking-wide transition-all duration-base ease-emphasized ${
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
        {tab === "adults" ? (
          <AdultTable />
        ) : (
          <KidsTable />
        )}

        <p className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4 text-caption text-accent">
          💡 החולצות לפי גזרה אסיאתית. אם בין מידות, מומלץ לעלות מידה.
        </p>
      </section>

      {/* How to measure */}
      <section className="container pb-16">
        <div className="mb-6">
          <span className="section-eyebrow">How To</span>
          <h2 className="mt-2 font-display text-display font-black uppercase">
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

function AdultTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead className="bg-surface">
            <tr className="font-display text-overline tracking-[0.18em] text-muted">
              <th className="py-3 text-start ps-4">מידה</th>
              <th className="py-3 text-start">חזה (ס״מ)</th>
              <th className="py-3 text-start">אורך (ס״מ)</th>
              <th className="py-3 text-start">חזה (אינץ׳)</th>
              <th className="py-3 text-start pe-4">אורך (אינץ׳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ADULT_SIZES.map((r) => (
              <tr
                key={r.size}
                className="transition-colors duration-base hover:bg-surface/40"
              >
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
  );
}

function KidsTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead className="bg-surface">
            <tr className="font-display text-overline tracking-[0.18em] text-muted">
              <th className="py-3 text-start ps-4">מידה</th>
              <th className="py-3 text-start">גיל</th>
              <th className="py-3 text-start">גובה (ס״מ)</th>
              <th className="py-3 text-start">חזה (ס״מ)</th>
              <th className="py-3 text-start pe-4">אורך (ס״מ)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {KIDS_SIZES.map((r) => (
              <tr
                key={r.size}
                className="transition-colors duration-base hover:bg-surface/40"
              >
                <td className="py-3 ps-4 font-display font-bold text-foreground">
                  {r.size}
                </td>
                <td className="py-3 text-foreground">{r.ageHe}</td>
                <td className="py-3 text-foreground">{r.heightCm}</td>
                <td className="py-3 text-muted">{r.chestCm}</td>
                <td className="py-3 pe-4 text-muted">{r.lengthCm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
    <div className="rounded-2xl border border-border bg-surface p-5 transition-all duration-base hover:-translate-y-0.5 hover:border-accent/40">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-1 font-display text-h3 font-bold uppercase tracking-tight">
        {label}
      </h3>
      <p className="text-body-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}
