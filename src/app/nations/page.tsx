import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Flag, Trophy } from "lucide-react";
import { NATIONS, TIER_LABELS, type NationTier } from "@/lib/constants";
import { getHeroImageFor, getProductsByNation } from "@/lib/products";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";
import WorldCupCountdown from "@/components/home/WorldCupCountdown";

export const metadata: Metadata = {
  title: "נבחרות לאומיות — מונדיאל 2026",
  description:
    "כל חולצות הנבחרות לקראת מונדיאל 2026. ארגנטינה, ברזיל, פורטוגל, צרפת, ספרד, גרמניה, אנגליה ועוד.",
};

function NationCard({ slug, nameHe, nameEn, flag }: (typeof NATIONS)[number]) {
  const productsCount = getProductsByNation(slug).length;
  const img = getHeroImageFor({ team: slug });
  return (
    <Link
      href={`/nations/${slug}`}
      className="group relative flex aspect-[5/3] items-end overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 hover:-translate-y-1 hover:border-accent/60 hover:shadow-glow-sm"
    >
      {img ? (
        <Image
          src={img}
          alt={nameHe}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="object-cover opacity-70 transition-all duration-500 group-hover:scale-105 group-hover:opacity-95"
        />
      ) : (
        <div className="absolute inset-0 bg-card-gradient" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute end-3 top-3 rounded-full border border-border/60 bg-background/80 px-2 py-1 backdrop-blur-sm">
        <span className="text-2xl">{flag}</span>
      </div>
      <div className="relative w-full p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-base font-bold uppercase tracking-tight text-foreground">
            {nameHe}
          </span>
          <span className="font-display text-[10px] tracking-widest text-accent">
            {nameEn}
          </span>
        </div>
        {productsCount > 0 && (
          <span className="mt-1 inline-block font-display text-[10px] uppercase tracking-widest text-muted">
            {productsCount} חולצות זמינות
          </span>
        )}
      </div>
    </Link>
  );
}

function TierSection({
  tier,
  title,
  Icon,
}: {
  tier: NationTier;
  title: string;
  Icon: typeof Trophy;
}) {
  const teams = NATIONS.filter((n) => n.tier === tier);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-5 w-5 ${tier === "tier-1" ? "text-accent" : "text-muted"}`}
        />
        <div>
          <span className="section-eyebrow">{title}</span>
          <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight md:text-3xl">
            {TIER_LABELS[tier].he}
          </h2>
          <p className="text-xs text-muted md:text-sm">
            {TIER_LABELS[tier].description}
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <NationCard key={team.slug} {...team} />
        ))}
      </div>
    </div>
  );
}

export default function NationsPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="absolute inset-0 bg-mesh-aurora opacity-80"
        />
        <div className="container relative grid gap-10 py-14 md:grid-cols-[1.2fr_1fr] md:items-center md:py-20">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              <span className="section-eyebrow">Nations · FIFA World Cup 2026</span>
            </div>
            <h1 className="mt-3 font-display text-4xl font-black uppercase leading-[1.05] md:text-6xl">
              נבחרות העולם <br />
              <span className="text-accent">מונדיאל 2026</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted md:text-base">
              המונדיאל נפתח ב-11 ביוני 2026. הזמינו את החולצות עכשיו — 10–15
              ימי עסקים, מגיעות ישר אליכם בזמן.
            </p>
          </div>
          <WorldCupCountdown />
        </div>
      </section>

      <section className="container space-y-14 py-14 md:py-20">
        <TierSection tier="tier-1" title="Tier 1 · Must-have" Icon={Trophy} />
        <TierSection tier="tier-2" title="Tier 2 · Popular" Icon={Flag} />
        <TierSection tier="tier-3" title="Tier 3 · Other" Icon={Flag} />
      </section>
    </>
  );
}
