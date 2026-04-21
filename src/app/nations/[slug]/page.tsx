import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { NATIONS, SIZES, TIER_LABELS } from "@/lib/constants";
import { getProductsByNation } from "@/lib/products";
import { applyFilters, parseFilters, type ProductFilterParams } from "@/lib/filters";
import ProductGrid from "@/components/product/ProductGrid";
import FilterSidebar, { type FilterGroupConfig } from "@/components/filters/FilterSidebar";
import SortDropdown from "@/components/filters/SortDropdown";

type Props = {
  params: { slug: string };
  searchParams: ProductFilterParams;
};

export function generateStaticParams() {
  return NATIONS.map((n) => ({ slug: n.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const nation = NATIONS.find((n) => n.slug === params.slug);
  if (!nation) return { title: "נבחרת לא נמצאה" };
  return {
    title: `${nation.nameHe} · ${nation.nameEn}`,
    description: `כל חולצות נבחרת ${nation.nameHe} — בית, חוץ, שוער ומהדורות מיוחדות למונדיאל 2026.`,
  };
}

export default function NationPage({ params, searchParams }: Props) {
  const nation = NATIONS.find((n) => n.slug === params.slug);
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
              href="/nations"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              נבחרות
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
