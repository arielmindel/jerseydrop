import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NATIONS } from "@/lib/constants";

export default function NationsStrip() {
  const tier1 = NATIONS.filter((n) => n.tier === "tier-1");

  return (
    <section className="container py-10 md:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <span className="section-eyebrow">Nations · מונדיאל 2026</span>
          <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight md:text-3xl">
            הנבחרות שכולם מחכים להן
          </h2>
        </div>
        <Link
          href="/nations"
          className="font-display text-xs font-bold uppercase tracking-widest text-accent hover:underline"
        >
          כל הנבחרות ←
        </Link>
      </div>
      <div className="-mx-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
        <ul className="mx-4 flex min-w-max items-stretch gap-3">
          {tier1.map((nation) => (
            <li key={nation.slug}>
              <Link
                href={`/nations/${nation.slug}`}
                className="flex h-28 w-36 flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface px-3 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-glow-sm"
              >
                <span className="text-3xl">{nation.flag}</span>
                <span className="font-display text-sm font-bold uppercase text-foreground">
                  {nation.nameHe}
                </span>
                <span className="font-display text-[10px] text-muted">
                  {nation.nameEn}
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/nations"
              className="flex h-28 w-36 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-accent/40 bg-surface/40 px-3 text-center text-accent transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:bg-surface"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-display text-sm font-bold uppercase">
                עוד נבחרות
              </span>
              <span className="font-display text-[10px] text-muted">
                Tier 2 + Tier 3
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
