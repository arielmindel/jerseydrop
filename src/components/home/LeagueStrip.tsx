import Link from "next/link";
import { LEAGUES } from "@/lib/constants";

export default function LeagueStrip() {
  return (
    <section className="container py-10 md:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <span className="section-eyebrow">Leagues</span>
          <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight md:text-3xl">
            הליגות הגדולות בעולם
          </h2>
        </div>
        <Link
          href="/leagues"
          className="font-display text-xs font-bold uppercase tracking-widest text-accent hover:underline"
        >
          הכל ←
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {LEAGUES.map((league) => (
          <li key={league.id}>
            <Link
              href={`/leagues/${league.slug}`}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-glow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background font-display text-sm font-black text-accent">
                {league.nameEn
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="font-display text-xs font-bold uppercase leading-tight text-foreground">
                {league.nameHe}
              </div>
              <div className="font-display text-[10px] text-muted">
                {league.teams.length} מועדונים
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
