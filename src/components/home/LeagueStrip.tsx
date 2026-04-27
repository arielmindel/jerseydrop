import Image from "next/image";
import Link from "next/link";
import { LEAGUES } from "@/lib/constants";
import { getHeroImageFor } from "@/lib/products";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";

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
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {LEAGUES.map((league) => {
          const img = getHeroImageFor({ league: league.slug });
          return (
            <li key={league.id}>
              <Link
                href={`/leagues/${league.slug}`}
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 hover:-translate-y-1 hover:border-accent/60 hover:shadow-glow-sm"
              >
                {img ? (
                  <Image
                    src={img}
                    alt={league.nameHe}
                    fill
                    sizes="(min-width: 1024px) 14vw, (min-width: 640px) 33vw, 50vw"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="object-cover opacity-70 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                  />
                ) : (
                  <div className="absolute inset-0 bg-card-gradient" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="relative space-y-0.5 p-3 text-center">
                  <div className="font-display text-sm font-black uppercase leading-tight text-foreground">
                    {league.nameHe}
                  </div>
                  <div className="font-display text-[10px] tracking-widest text-accent">
                    {league.nameEn}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
