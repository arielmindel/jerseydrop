import type { Product, ProductVersion } from "./types";
import type { Size } from "./constants";

export type ProductFilterParams = {
  category?: string | string[];
  league?: string | string[];
  team?: string | string[];
  nation?: string | string[];
  type?: string | string[];
  version?: string | string[];
  size?: string | string[];
  season?: string | string[];
  tag?: string | string[];
  min?: string;
  max?: string;
  sort?: string;
  q?: string;
};

export type ParsedFilters = {
  category: string[];
  league: string[];
  team: string[];
  nation: string[];
  type: string[];
  version: ProductVersion[];
  size: Size[];
  season: string[];
  tag: string[];
  min: number;
  max: number;
  sort: SortKey;
  q: string;
};

export type SortKey = "popularity" | "price-asc" | "price-desc" | "newest";

export const SORT_OPTIONS: { value: SortKey; labelHe: string }[] = [
  { value: "popularity", labelHe: "פופולריות" },
  { value: "price-asc", labelHe: "מחיר: נמוך לגבוה" },
  { value: "price-desc", labelHe: "מחיר: גבוה לנמוך" },
  { value: "newest", labelHe: "החדשים ביותר" },
];

export const PRICE_MIN = 100;
export const PRICE_MAX = 300;

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : value.split(",").filter(Boolean);
}

export function parseFilters(params: ProductFilterParams): ParsedFilters {
  return {
    category: toArray(params.category),
    league: toArray(params.league),
    team: toArray(params.team),
    nation: toArray(params.nation),
    type: toArray(params.type),
    version: toArray(params.version) as ProductVersion[],
    size: toArray(params.size) as Size[],
    season: toArray(params.season),
    tag: toArray(params.tag),
    min: Number(params.min ?? PRICE_MIN) || PRICE_MIN,
    max: Number(params.max ?? PRICE_MAX) || PRICE_MAX,
    sort: (params.sort as SortKey) || "popularity",
    q: (params.q || "").trim().toLowerCase(),
  };
}

function popularityScore(p: Product): number {
  let score = 0;
  if (p.featured) score += 100;
  if (p.tags.includes("bestseller")) score += 50;
  if (p.tags.includes("world-cup-2026")) score += 30;
  if (p.tags.includes("new")) score += 10;
  return score;
}

function seasonYear(s: string): number {
  const m = s.match(/(\d{4})/);
  return m ? Number(m[1]) : 0;
}

export function applyFilters(
  source: Product[],
  filters: ParsedFilters,
): Product[] {
  let out = source.filter((p) => {
    if (filters.category.length && !filters.category.includes(p.category))
      return false;
    if (filters.league.length && (!p.league || !filters.league.includes(p.league)))
      return false;
    if (filters.team.length && !filters.team.includes(p.teamSlug))
      return false;
    if (filters.nation.length && (!p.nation || !filters.nation.includes(p.nation)))
      return false;
    if (filters.type.length && !filters.type.includes(p.type))
      return false;
    if (filters.version.length) {
      const match = p.versions.some((v) => filters.version.includes(v));
      if (!match) return false;
    }
    if (filters.size.length) {
      const match = p.sizes.some((s) => filters.size.includes(s));
      if (!match) return false;
    }
    if (filters.season.length && !filters.season.includes(p.season))
      return false;
    if (filters.tag.length) {
      const match = filters.tag.some((t) => p.tags.includes(t));
      if (!match) return false;
    }
    if (p.priceFan < filters.min || p.priceFan > filters.max) return false;
    if (filters.q) {
      const hay = `${p.nameHe} ${p.nameEn} ${p.team} ${p.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(filters.q)) return false;
    }
    return true;
  });

  switch (filters.sort) {
    case "price-asc":
      out = [...out].sort((a, b) => a.priceFan - b.priceFan);
      break;
    case "price-desc":
      out = [...out].sort((a, b) => b.priceFan - a.priceFan);
      break;
    case "newest":
      out = [...out].sort(
        (a, b) => seasonYear(b.season) - seasonYear(a.season),
      );
      break;
    case "popularity":
    default:
      out = [...out].sort(
        (a, b) => popularityScore(b) - popularityScore(a),
      );
  }
  return out;
}

export function buildQueryString(
  current: URLSearchParams,
  patch: Record<string, string | null>,
): string {
  const next = new URLSearchParams(current);
  Object.entries(patch).forEach(([k, v]) => {
    if (v === null || v === "") next.delete(k);
    else next.set(k, v);
  });
  const s = next.toString();
  return s ? `?${s}` : "";
}
