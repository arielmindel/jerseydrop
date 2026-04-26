import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { LEAGUES, SIZES } from "@/lib/constants";
import { getProductsByLeague } from "@/lib/products";
import { applyFilters, parseFilters, type ProductFilterParams } from "@/lib/filters";
import ProductGrid from "@/components/product/ProductGrid";
import FilterSidebar, { type FilterGroupConfig } from "@/components/filters/FilterSidebar";
import SortDropdown from "@/components/filters/SortDropdown";

type Props = {
  params: { slug: string };
  searchParams: ProductFilterParams;
};

export function generateStaticParams() {
  return LEAGUES.map((l) => ({ slug: l.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const league = LEAGUES.find((l) => l.slug === params.slug);
  if (!league) return { title: "ליגה לא נמצאה" };
  return {
    title: `${league.nameHe} · ${league.nameEn}`,
    description: `חולצות מקוריות של ${league.nameHe} — ${league.teams.slice(0, 5).join(", ")} ועוד. גרסת Fan ו-Player.`,
  };
}

export default function LeaguePage({ params, searchParams }: Props) {
  const league = LEAGUES.find((l) => l.slug === params.slug);
  if (!league) notFound();

  const all = getProductsByLeague(league.slug);
  const filters = parseFilters(searchParams);
  const filtered = applyFilters(all, filters);

  const teamOptions = Array.from(new Set(all.map((p) => p.teamSlug))).map(
    (slug) => {
      const prod = all.find((p) => p.teamSlug === slug)!;
      return { value: slug, labelHe: prod.team };
    },
  );
  const seasons = Array.from(
    new Set(all.map((p) => p.season).filter((s): s is string => Boolean(s))),
  );

  const groups: FilterGroupConfig[] = [
    {
      key: "team",
      labelHe: "קבוצה",
      type: "multi",
      options: teamOptions,
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
  ];

  return (
    <>
      <section className="border-b border-border/60 bg-background">
        <div className="container py-10 md:py-14">
          <nav className="mb-4 flex items-center gap-1 text-xs text-muted">
            <Link href="/leagues" className="inline-flex items-center gap-1 hover:text-foreground">
              <ChevronLeft className="h-3.5 w-3.5" />
              ליגות
            </Link>
          </nav>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="section-eyebrow">{league.nameEn}</span>
              <h1 className="mt-2 font-display text-4xl font-black uppercase leading-tight md:text-5xl">
                {league.nameHe}
              </h1>
              <p className="mt-2 text-sm text-muted md:text-base">
                {league.country} · {league.teams.length} מועדונים · {all.length}{" "}
                חולצות זמינות
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
          <div className="flex-1 space-y-6">
            <ProductGrid
              products={filtered}
              emptyHint={`אין כרגע חולצות זמינות ב-${league.nameHe} עם הפילטרים האלה.`}
            />
          </div>
        </div>
      </section>
    </>
  );
}
