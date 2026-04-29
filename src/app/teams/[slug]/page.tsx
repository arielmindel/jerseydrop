import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { SIZES } from "@/lib/constants";
import { getAllTeamSlugs, getTeamMeta } from "@/lib/teams";
import { getProductsByTeam } from "@/lib/products";
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
import TeamQuickChips from "@/components/team/TeamQuickChips";

type Props = {
  params: { slug: string };
  searchParams: ProductFilterParams;
};

export function generateStaticParams() {
  return getAllTeamSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const meta = getTeamMeta(params.slug);
  if (!meta) return { title: "קבוצה לא נמצאה" };
  return {
    title: `${meta.name} — ${meta.productCount} חולצות`,
    description: `כל החולצות של ${meta.name} — בית, חוץ, רטרו ואדישנס מיוחדות. גרסת Fan ו-Player.`,
  };
}

export default function TeamPage({ params, searchParams }: Props) {
  const meta = getTeamMeta(params.slug);
  if (!meta) notFound();

  const all = getProductsByTeam(params.slug);
  const filters = parseFilters(searchParams);
  const filtered = applyFilters(all, filters);

  // Build filter sidebar groups scoped to THIS team's catalog
  const seasons = Array.from(
    new Set(all.map((p) => p.season).filter((s): s is string => Boolean(s))),
  )
    .sort()
    .reverse();

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
    },
    {
      key: "size",
      labelHe: "מידה",
      type: "multi",
      options: SIZES.map((s) => ({ value: s, labelHe: s })),
    },
    {
      key: "flag",
      labelHe: "תכונות",
      type: "multi",
      options: [
        { value: "retro", labelHe: "רטרו" },
        { value: "kids", labelHe: "ילדים" },
        { value: "long-sleeve", labelHe: "שרוול ארוך" },
        { value: "special", labelHe: "מהדורה מיוחדת" },
      ],
    },
    { key: "price", labelHe: "טווח מחירים", type: "price" },
  ];

  // Build the league back-link from the team's actual league
  const backHref =
    meta.league && meta.league !== "" ? `/leagues/${meta.league}` : "/leagues";
  const backLabel =
    meta.league?.startsWith("tier-") ? "נבחרות" : "ליגות";

  return (
    <>
      <section className="border-b border-border/60 bg-background">
        <div className="container py-10 md:py-14">
          <nav className="mb-4 flex items-center gap-1 text-xs text-muted">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {backLabel}
            </Link>
          </nav>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-4xl font-black uppercase leading-tight md:text-5xl">
                {meta.name}
              </h1>
              <p className="mt-2 text-sm text-muted md:text-base">
                {meta.productCount} חולצות · כל החולצות, רטרו והעונה הנוכחית
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

      <section className="container py-6 md:py-8">
        <TeamQuickChips />
      </section>

      <section className="container py-4 md:py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <FilterSidebar groups={groups} />
          <div className="flex-1">
            <InfiniteProductGrid
              products={filtered}
              emptyHint="אין חולצות תואמות עם הפילטרים האלה. נסה להסיר חלק."
            />
          </div>
        </div>
      </section>
    </>
  );
}
