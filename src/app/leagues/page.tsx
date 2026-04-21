import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, Trophy } from "lucide-react";
import { LEAGUES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "ליגות — כל חולצות המועדונים",
  description:
    "פרמייר ליג, לה ליגה, סריה א, בונדסליגה, ליג 1 ועוד. כל חולצות המועדונים הגדולים של אירופה, MLS וברזיל.",
};

export default function LeaguesPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-background">
        <div
          aria-hidden
          className="absolute -top-24 start-1/3 h-[420px] w-[420px] rounded-full bg-accent/15 blur-[140px]"
        />
        <div className="container relative py-14 md:py-20">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            <span className="section-eyebrow">Top Leagues</span>
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black uppercase leading-[1.05] md:text-6xl">
            הליגות הגדולות <span className="text-accent">בעולם</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted md:text-base">
            5 ליגות מובילות + קטגוריית ״אחר״ לברזיל, MLS, הולנד, סקוטלנד
            ופורטוגל. בחרו ליגה וגלו את כל החולצות.
          </p>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {LEAGUES.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.slug}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-surface"
            >
              <Image
                src={`https://picsum.photos/seed/jd-league-${league.id}/900/700`}
                alt={league.nameEn}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover opacity-70 transition-all duration-500 group-hover:scale-105 group-hover:opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-6">
                <span className="font-display text-[11px] font-bold uppercase tracking-widest text-accent">
                  {league.nameEn} · {league.country}
                </span>
                <h2 className="font-display text-2xl font-black uppercase leading-tight md:text-3xl">
                  {league.nameHe}
                </h2>
                <p className="line-clamp-1 text-xs text-muted">
                  {league.teams.slice(0, 6).join(" · ")}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-accent">
                  {league.teams.length} מועדונים{" "}
                  <ArrowLeft className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
