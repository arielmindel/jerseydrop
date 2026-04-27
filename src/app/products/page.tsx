import type { Metadata } from "next";
import { LEAGUES, SIZES, TIER_LABELS } from "@/lib/constants";
import { getAllProducts } from "@/lib/products";
import {
  applyFilters,
  parseFilters,
  type ProductFilterParams,
} from "@/lib/filters";
import InfiniteProductGrid from "@/components/product/InfiniteProductGrid";
import FilterSidebar, {
  type FilterGroupConfig,
} from "@/components/filters/FilterSidebar";
import SortDropdown from "@/components/filters/SortDropdown";

export const metadata: Metadata = {
  title: "כל החולצות — ליגות, נבחרות ורטרו",
  description:
    "כל חולצות הכדורגל של JerseyDrop במקום אחד. סנן לפי קבוצה, ליגה, גרסה, מידה ומחיר.",
};

type Props = { searchParams: ProductFilterParams };

export default function ProductsPage({ searchParams }: Props) {
  const all = getAllProducts();
  const filters = parseFilters(searchParams);
  const filtered = applyFilters(all, filters);

  // ----- Build dynamic option lists from the current catalog -----
  const teams = Array.from(new Set(all.map((p) => p.teamSlug)))
    .filter(Boolean)
    .map((slug) => {
      const p = all.find((x) => x.teamSlug === slug)!;
      return { value: slug, labelHe: p.team || slug };
    })
    .sort((a, b) => a.labelHe.localeCompare(b.labelHe, "he"));

  const seasons = Array.from(
    new Set(all.map((p) => p.season).filter((s): s is string => Boolean(s))),
  ).sort()
    .reverse();

  // Build counts cache (for badges next to each filter option)
  const counts: Record<string, number> = {};
  const incr = (k: string) => (counts[k] = (counts[k] || 0) + 1);
  for (const p of all) {
    incr(`category:${p.category}`);
    incr(`league:${p.league}`);
    incr(`team:${p.teamSlug}`);
    incr(`type:${p.type}`);
    if (p.season) incr(`season:${p.season}`);
    if (p.isRetro) incr(`flag:retro`);
    if (p.isKids) incr(`flag:kids`);
    if (p.isLongSleeve) incr(`flag:long-sleeve`);
    if (p.isWorldCup2026) incr(`flag:wc2026`);
    if (p.isSpecial) incr(`flag:special`);
  }

  const groups: FilterGroupConfig[] = [
    {
      key: "category",
      labelHe: "קטגוריה",
      type: "multi",
      options: [
        { value: "national", labelHe: "נבחרות" },
        { value: "club", labelHe: "מועדונים" },
      ],
    },
    {
      key: "flag",
      labelHe: "תכונות",
      type: "multi",
      options: [
        { value: "wc2026", labelHe: "מונדיאל 2026" },
        { value: "retro", labelHe: "רטרו" },
        { value: "kids", labelHe: "ילדים" },
        { value: "long-sleeve", labelHe: "שרוול ארוך" },
        { value: "special", labelHe: "מהדורה מיוחדת" },
      ],
    },
    {
      key: "league",
      labelHe: "ליגה",
      type: "multi",
      options: LEAGUES.map((l) => ({ value: l.slug, labelHe: l.nameHe })),
      visibleWhen: { key: "category", notEquals: "national" },
    },
    {
      key: "league",
      labelHe: "Tier (נבחרות)",
      type: "multi",
      options: (["tier-1", "tier-2", "tier-3"] as const).map((t) => ({
        value: t,
        labelHe: TIER_LABELS[t].he,
      })),
      visibleWhen: { key: "category", equals: "national" },
    },
    {
      key: "team",
      labelHe: "קבוצה",
      type: "search-multi",
      options: teams,
      defaultCollapsed: true,
    },
    {
      key: "type",
      labelHe: "סוג חולצה",
      type: "multi",
      options: [
        { value: "home", labelHe: "בית" },
        { value: "away", labelHe: "חוץ" },
        { value: "third", labelHe: "שלישי" },
        { value: "goalkeeper", labelHe: "שוער" },
        { value: "special", labelHe: "מיוחד" },
        { value: "retro", labelHe: "רטרו" },
      ],
    },
    {
      key: "season",
      labelHe: "עונה",
      type: "multi",
      options: seasons.map((s) => ({ value: s, labelHe: s })),
      defaultCollapsed: true,
    },
    {
      key: "size",
      labelHe: "מידה",
      type: "multi",
      options: SIZES.map((s) => ({ value: s, labelHe: s })),
    },
    { key: "price", labelHe: "טווח מחירים", type: "price" },
  ];

  return (
    <>
      <section className="border-b border-border/60 bg-background">
        <div className="container py-10 md:py-14">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="section-eyebrow">Shop All</span>
              <h1 className="mt-2 font-display text-4xl font-black uppercase leading-tight md:text-5xl">
                כל <span className="text-accent">החולצות</span>
              </h1>
              <p className="mt-2 text-sm text-muted md:text-base">
                {all.length} חולצות בקטלוג · ליגות, נבחרות ורטרו · סנן לפי
                הצורך שלך.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">
                {filtered.length} / {all.length} חולצות
              </span>
              <SortDropdown />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8 md:py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <FilterSidebar groups={groups} counts={counts} />
          <div className="flex-1">
            <InfiniteProductGrid products={filtered} />
          </div>
        </div>
      </section>
    </>
  );
}
