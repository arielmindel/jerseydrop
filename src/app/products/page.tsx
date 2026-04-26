import type { Metadata } from "next";
import { LEAGUES, SIZES } from "@/lib/constants";
import { getAllProducts } from "@/lib/products";
import { applyFilters, parseFilters, type ProductFilterParams } from "@/lib/filters";
import ProductGrid from "@/components/product/ProductGrid";
import FilterSidebar, { type FilterGroupConfig } from "@/components/filters/FilterSidebar";
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

  const teams = Array.from(new Set(all.map((p) => p.teamSlug))).map((slug) => {
    const p = all.find((x) => x.teamSlug === slug)!;
    return { value: slug, labelHe: p.team };
  });
  const seasons = Array.from(
    new Set(all.map((p) => p.season).filter((s): s is string => Boolean(s))),
  );

  const groups: FilterGroupConfig[] = [
    {
      key: "category",
      labelHe: "קטגוריה",
      type: "multi",
      options: [
        { value: "national", labelHe: "נבחרות" },
        { value: "club", labelHe: "מועדונים" },
        { value: "retro", labelHe: "רטרו" },
      ],
    },
    {
      key: "league",
      labelHe: "ליגה",
      type: "multi",
      options: LEAGUES.map((l) => ({ value: l.slug, labelHe: l.nameHe })),
    },
    {
      key: "team",
      labelHe: "קבוצה",
      type: "multi",
      options: teams,
    },
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
      key: "season",
      labelHe: "עונה",
      type: "multi",
      options: seasons.map((s) => ({ value: s, labelHe: s })),
    },
    { key: "price", labelHe: "טווח מחירים", type: "price" },
    {
      key: "tag",
      labelHe: "תגיות",
      type: "multi",
      options: [
        { value: "world-cup-2026", labelHe: "מונדיאל 2026" },
        { value: "bestseller", labelHe: "Bestseller" },
        { value: "new", labelHe: "חדש" },
        { value: "messi", labelHe: "Messi" },
        { value: "ronaldo", labelHe: "Ronaldo" },
      ],
    },
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
                {all.length} חולצות · ליגות, נבחרות ורטרו · סנן לפי הצורך שלך.
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
          <FilterSidebar groups={groups} />
          <div className="flex-1">
            <ProductGrid products={filtered} />
          </div>
        </div>
      </section>
    </>
  );
}
