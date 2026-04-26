import type { Product, ProductVersion } from "./types";
import type { Size } from "./constants";
import { getStartingPrice } from "./products";

export type ProductFilterParams = {
  category?: string | string[];
  league?: string | string[];
  team?: string | string[];
  /** alias for team — kept for backwards compatibility with /nations/[slug] */
  nation?: string | string[];
  type?: string | string[];
  version?: string | string[];
  size?: string | string[];
  season?: string | string[];
  tag?: string | string[];
  /** flag-based filter: "retro" / "kids" / "long-sleeve" / "wc2026" / "special" */
  flag?: string | string[];
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
  flag: string[];
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

export const PRICE_MIN = 0;
export const PRICE_MAX = 500;

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
    flag: toArray(params.flag),
    min: Number(params.min ?? PRICE_MIN) || PRICE_MIN,
    max: Number(params.max ?? PRICE_MAX) || PRICE_MAX,
    sort: (params.sort as SortKey) || "popularity",
    q: (params.q || "").trim().toLowerCase(),
  };
}

function popularityScore(p: Product): number {
  let score = 0;
  if (p.isWorldCup2026) score += 50;
  if (p.isSpecial) score += 30;
  if (p.season?.startsWith("2025")) score += 20;
  if (p.season?.startsWith("2024")) score += 10;
  if (p.isRetro) score -= 5; // surface fresh stuff first by default
  return score;
}

function seasonYear(s: string | null): number {
  if (!s) return 0;
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
    if (filters.league.length && !filters.league.includes(p.league))
      return false;
    if (filters.team.length && !filters.team.includes(p.teamSlug))
      return false;
    // `nation` is an alias for teamSlug scoped to category=national
    if (filters.nation.length) {
      if (p.category !== "national") return false;
      if (!filters.nation.includes(p.teamSlug)) return false;
    }
    if (filters.type.length && !filters.type.includes(p.type)) return false;
    if (filters.version.length) {
      const versions: ProductVersion[] = [];
      if (p.priceFan !== null) versions.push("fan");
      if (p.pricePlayer !== null) versions.push("player");
      if (p.priceRetro !== null || p.isRetro) versions.push("retro");
      if (versions.length === 0) versions.push("fan", "player");
      if (!versions.some((v) => filters.version.includes(v))) return false;
    }
    if (filters.size.length) {
      if (!Array.isArray(p.sizes)) return false;
      if (!p.sizes.some((s) => filters.size.includes(s as Size))) return false;
    }
    if (filters.season.length) {
      if (!p.season || !filters.season.includes(p.season)) return false;
    }
    if (filters.tag.length) {
      if (!filters.tag.some((t) => p.tags?.includes(t))) return false;
    }
    if (filters.flag.length) {
      const flags: string[] = [];
      if (p.isRetro) flags.push("retro");
      if (p.isKids) flags.push("kids");
      if (p.isLongSleeve) flags.push("long-sleeve");
      if (p.isWorldCup2026) flags.push("wc2026");
      if (p.isSpecial) flags.push("special");
      if (!flags.some((f) => filters.flag.includes(f))) return false;
    }
    // Price filter — only applied when product has a known price.
    // Null-price products bypass the filter so they remain visible until pricing is set.
    const startingPrice = getStartingPrice(p);
    if (startingPrice !== null) {
      if (startingPrice < filters.min || startingPrice > filters.max)
        return false;
    }
    if (filters.q) {
      const hay =
        `${p.nameHe || ""} ${p.nameEn || ""} ${p.team || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
      if (!hay.includes(filters.q)) return false;
    }
    return true;
  });

  switch (filters.sort) {
    case "price-asc":
      out = [...out].sort(
        (a, b) =>
          (getStartingPrice(a) ?? Number.POSITIVE_INFINITY) -
          (getStartingPrice(b) ?? Number.POSITIVE_INFINITY),
      );
      break;
    case "price-desc":
      out = [...out].sort(
        (a, b) =>
          (getStartingPrice(b) ?? Number.NEGATIVE_INFINITY) -
          (getStartingPrice(a) ?? Number.NEGATIVE_INFINITY),
      );
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
