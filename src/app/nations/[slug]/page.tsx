import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { NATIONS, SIZES, TIER_LABELS, type NationTier } from "@/lib/constants";
import { getProductsByNation } from "@/lib/products";
import { getTeamsInScope } from "@/lib/teams";
import { applyFilters, parseFilters, type ProductFilterParams } from "@/lib/filters";
import ProductGrid from "@/components/product/ProductGrid";
import FilterSidebar, { type FilterGroupConfig } from "@/components/filters/FilterSidebar";
import SortDropdown from "@/components/filters/SortDropdown";
import TeamCard from "@/components/team/TeamCard";

type Props = {
  params: { slug: string };
  searchParams: ProductFilterParams;
};

const TIER_SLUGS: NationTier[] = ["tier-1", "tier-2", "tier-3"];

export function generateStaticParams() {
  // Nations + tier listing pages
  return [
    ...NATIONS.map((n) => ({ slug: n.slug })),
    ...TIER_SLUGS.map((t) => ({ slug: t })),
  ];
}

export function generateMetadata({ params }: Props): Metadata {
  if (TIER_SLUGS.includes(params.slug as NationTier)) {
    const t = TIER_LABELS[params.slug as NationTier];
    return {
      title: `${t.he} — נבחרות`,
      description: `כל הנבחרות ב-${t.he}. בחרו נבחרת וגלו את כל החולצות שלה.`,
    };
  }
  const nation = NATIONS.find((n) => n.slug === params.slug);
  if (!nation) return { title: "נבחרת לא נמצאה" };
  return {
    title: `${nation.nameHe} · ${nation.nameEn}`,
    description: `כל חולצות נבחרת ${nation.nameHe} — בית, חוץ, שוער ומהדורות מיוחדות למונדיאל 2026.`,
  };
}

// ---------------------------------------------------------------------------
// Tier listing — /nations/tier-1 etc. shows ALL nations in that tier as cards
// ---------------------------------------------------------------------------

function TierPage({ tier }: { tier: NationTier }) {
  const teams = getTeamsInScope(tier);
  const total = teams.reduce((s, t) => s + t.productCount, 0);
  const labels = TIER_LABELS[tier];

  return (
    <>
      <section className="border-b border-border/60 bg-background">
        <div className="container py-10 md:py-14">
          <nav className="mb-4 flex items-center gap-1 text-xs text-muted">
            <Link href="/nations" className="inline-flex items-center gap-1 hover:text-foreground">
              <ChevronLeft className="h-3.5 w-3.5" />
              נבחרות
            </Link>
          </nav>
          <span className="section-eyebrow">{labels.en}</span>
          <h1 className="mt-2 font-display text-4xl font-black uppercase leading-tight md:text-5xl">
            {labels.he}
          </h1>
          <p className="mt-2 text-sm text-muted md:text-base">
            {total} חולצות מ-{teams.length} נבחרות
          </p>
        </div>
      </section>

      {teams.length === 0 ? (
        <section className="container py-16">
          <div className="rounded-3xl border border-dashed border-border bg-surface/40 p-10 text-center">
            <p className="font-display text-lg font-bold uppercase tracking-tight">
              אין כרגע נבחרות זמינות ב-{labels.he}
            </p>
          </div>
        </section>
      ) : (
        <section className="container py-8 md:py-12">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {teams.map((t) => (
              <TeamCard
                key={t.slug}
                to={`/nations/${t.slug}`}
                slug={t.slug}
                name={t.name}
                productCount={t.productCount}
                image={t.heroImage}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Single-nation page — /nations/argentina etc. shows that nation's products
// ---------------------------------------------------------------------------

function NationPage({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: ProductFilterParams;
}) {
  const nation = NATIONS.find((n) => n.slug === slug);
  if (!nation) notFound();

  const all = getProductsByNation(nation.slug);
  const filters = parseFilters(searchParams);
  const filtered = applyFilters(all, filters);

  const types = Array.from(new Set(all.map((p) => p.type)));
  const typeLabel: Record<string, string> = {
    home: "בית",
    away: "חוץ",
    third: "שלישי",
    goalkeeper: "שוער",
    special: "מיוחד",
  };

  const groups: FilterGroupConfig[] = [
    {
      key: "version",
      labelHe: "גרסה",
      type: "multi",
      options: [
        { value: "fan", labelHe: "Fan" },
        { value: "player", labelHe: "Player" },
        { value: "retro", labelHe: "Retro" },
      ],
    },
    {
      key: "size",
      labelHe: "מידה",
      type: "multi",
      options: SIZES.map((s) => ({ value: s, labelHe: s })),
    },
    {
      key: "type",
      labelHe: "סוג",
      type: "multi",
      options: types.map((t) => ({ value: t, labelHe: typeLabel[t] ?? t })),
    },
    { key: "price", labelHe: "טווח מחירים", type: "price" },
  ];

  return (
    <>
      <section className="relative border-b border-border/60 bg-background">
        <div
          aria-hidden
          className="absolute -top-10 start-1/4 h-64 w-64 rounded-full bg-accent/10 blur-[120px]"
        />
        <div className="container relative py-10 md:py-14">
          <nav className="mb-4 flex items-center gap-1 text-xs text-muted">
            <Link
              href={`/nations/${nation.tier}`}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {TIER_LABELS[nation.tier].he}
            </Link>
          </nav>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-5">
              <span className="text-6xl md:text-7xl">{nation.flag}</span>
              <div>
                <span className="section-eyebrow">{TIER_LABELS[nation.tier].en}</span>
                <h1 className="mt-1 font-display text-4xl font-black uppercase leading-tight md:text-5xl">
                  {nation.nameHe}
                </h1>
                <span className="font-display text-xs text-muted md:text-sm">
                  {nation.nameEn} · {all.length} חולצות זמינות
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">
                {filtered.length} / {all.length}
              </span>
              <SortDropdown />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8 md:py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <FilterSidebar groups={groups} />
          <div className="flex-1 space-y-6">
            <ProductGrid
              products={filtered}
              emptyHint={
                all.length === 0
                  ? `עוד לא הוספנו חולצות של ${nation.nameHe} — תחזרו בקרוב.`
                  : undefined
              }
            />
          </div>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Top-level route — dispatches between tier listing and single nation
// ---------------------------------------------------------------------------

export default function NationOrTierPage({ params, searchParams }: Props) {
  if (TIER_SLUGS.includes(params.slug as NationTier)) {
    return <TierPage tier={params.slug as NationTier} />;
  }
  return <NationPage slug={params.slug} searchParams={searchParams} />;
}
