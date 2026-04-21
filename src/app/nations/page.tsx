import Link from "next/link";
import type { Metadata } from "next";
import { Flag, Trophy } from "lucide-react";
import { NATIONS, TIER_LABELS, type NationTier } from "@/lib/constants";
import { getProductsByNation } from "@/lib/products";
import WorldCupCountdown from "@/components/home/WorldCupCountdown";

export const metadata: Metadata = {
  title: "נבחרות לאומיות — מונדיאל 2026",
  description:
    "כל חולצות הנבחרות לקראת מונדיאל 2026. ארגנטינה, ברזיל, פורטוגל, צרפת, ספרד, גרמניה, אנגליה ועוד.",
};

function NationCard({ slug, nameHe, nameEn, flag }: (typeof NATIONS)[number]) {
  const productsCount = getProductsByNation(slug).length;
  return (
    <Link
      href={`/nations/${slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-glow-sm"
    >
      <span className="text-4xl md:text-5xl">{flag}</span>
      <div className="flex flex-1 flex-col">
        <span className="font-display text-base font-bold uppercase tracking-tight text-foreground">
          {nameHe}
        </span>
        <span className="font-display text-[11px] text-muted">{nameEn}</span>
        {productsCount > 0 && (
          <span className="mt-1 font-display text-[10px] uppercase tracking-widest text-accent">
            {productsCount} חולצות זמינות
          </span>
        )}
      </div>
      <span className="font-display text-xs font-bold uppercase tracking-widest text-muted group-hover:text-accent">
        ←
      </span>
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
        <Icon className={`h-5 w-5 ${tier === "tier-1" ? "text-accent" : "text-muted"}`} />
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
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-background">
        <div
          aria-hidden
          className="absolute -top-20 start-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-accent/15 blur-[160px]"
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
              המונדיאל נפתח ב-11 ביוני 2026. הזמינו את החולצות עכשיו — 10–15 ימי
              עסקים, מגיעות ישר אליכם בזמן.
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
