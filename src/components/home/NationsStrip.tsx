import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NATIONS } from "@/lib/constants";
import { getHeroImageFor } from "@/lib/products";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";

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
          {tier1.map((nation) => {
            const img = getHeroImageFor({ team: nation.slug });
            return (
              <li key={nation.slug}>
                <Link
                  href={`/nations/${nation.slug}`}
                  className="group relative flex aspect-[4/5] w-44 flex-col justify-end overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 hover:-translate-y-1 hover:border-accent/60 hover:shadow-glow-sm"
                >
                  {img ? (
                    <Image
                      src={img}
                      alt={nation.nameHe}
                      fill
                      sizes="180px"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      className="object-cover opacity-75 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-card-gradient" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-transparent" />
                  <div className="absolute end-2 top-2 rounded-full border border-border/60 bg-background/70 px-2 py-1 backdrop-blur-sm">
                    <span className="text-2xl">{nation.flag}</span>
                  </div>
                  <div className="relative space-y-0.5 p-3 text-center">
                    <div className="font-display text-sm font-black uppercase text-foreground">
                      {nation.nameHe}
                    </div>
                    <div className="font-display text-[10px] tracking-widest text-accent">
                      {nation.nameEn}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/nations"
              className="flex aspect-[4/5] w-44 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-accent/40 bg-surface/40 px-3 text-center text-accent transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:bg-surface"
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
