import productsJson from "@catalog/sporthub-products.json";
import correctionsJson from "@catalog/product-corrections.json";
import type { Product, ProductVersion } from "./types";
import { CUSTOMIZATION_FEE } from "./constants";

// ============================================================================
// Catalog corrections (from scripts/fix-products.mjs)
// ----------------------------------------------------------------------------
// • `fixes` map: high-confidence relabels (URL + image agreed against the
//   original label). Applied at module load to override `team` + `teamSlug`.
// • `flags` map: products with image-mismatch or no-team-detected. The
//   "no-team-detected" subset is HIDDEN from public listings until human
//   review. The "image-mismatch" subset is shown but the team label has
//   already been corrected — only the photo may be wrong.
// ============================================================================
type Correction = { teamSlug: string; team: string };
type Flag = {
  reason: "image-mismatch" | "no-team-detected";
  detail: string;
  teamFromUrl?: string;
  teamFromImage?: string;
  currentTeam?: string;
};
const CORRECTIONS = correctionsJson as {
  stats: Record<string, number>;
  fixes: Record<string, Correction>;
  flags: Record<string, Flag>;
};

const HIDDEN_IDS = new Set<string>(
  Object.entries(CORRECTIONS.flags)
    .filter(([, f]) => f.reason === "no-team-detected")
    .map(([id]) => id),
);

const IMAGE_MISMATCH_IDS = new Set<string>(
  Object.entries(CORRECTIONS.flags)
    .filter(([, f]) => f.reason === "image-mismatch")
    .map(([id]) => id),
);

export function isImageMismatchFlagged(productId: string): boolean {
  return IMAGE_MISMATCH_IDS.has(productId);
}

// ============================================================================
// Slug normalization
// ----------------------------------------------------------------------------
// The supplier catalog ships with garbage slugs — 56 distinct products share
// "jersey-home-2025-26", and 620/995 rows collide overall. We rebuild a
// canonical slug from team + type + flags + season at module load time, with
// a 6-char id suffix when the canonical form still collides. This guarantees
// 1 product per URL and gives us human-readable URLs.
// ============================================================================

function buildCanonicalSlug(p: Product): string {
  const parts: string[] = [];
  if (p.teamSlug) parts.push(p.teamSlug);
  if (p.type && p.type !== "home") parts.push(p.type);
  else if (p.type === "home") parts.push("home");
  if (p.isKids) parts.push("kids");
  if (p.isLongSleeve) parts.push("long-sleeve");
  if (p.isRetro && !p.season) parts.push("retro");
  if (p.season) parts.push(p.season);
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeProducts(raw: Product[]): Product[] {
  // Step A: apply team/teamSlug corrections from the audit run
  const corrected = raw.map((p) => {
    const fix = CORRECTIONS.fixes[p.id];
    if (!fix) return p;
    return { ...p, team: fix.team, teamSlug: fix.teamSlug };
  });

  // Step B: compute canonical slugs + their frequencies (uses corrected teamSlug)
  const canonical = corrected.map(buildCanonicalSlug);
  const freq = new Map<string, number>();
  canonical.forEach((s) => freq.set(s, (freq.get(s) || 0) + 1));

  // Step C: append id suffix where the canonical form still collides
  return corrected.map((p, i) => {
    const base = canonical[i];
    const slug =
      (freq.get(base) || 0) > 1 ? `${base}-${p.id.slice(-6)}` : base;
    return { ...p, slug };
  });
}

const ALL_PRODUCTS: Product[] = normalizeProducts(
  productsJson as unknown as Product[],
);

/** Public-facing catalog: filters out products flagged "no-team-detected". */
export const products: Product[] = ALL_PRODUCTS.filter(
  (p) => !HIDDEN_IDS.has(p.id),
);

/** Includes hidden products. Use only for admin/review tooling. */
export const allProductsIncludingHidden: Product[] = ALL_PRODUCTS;

// ============================================================================
// Lookups
// ============================================================================

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

// ============================================================================
// Filters by group
// ============================================================================

export function getProductsByLeague(leagueSlug: string): Product[] {
  return products.filter((p) => p.league === leagueSlug);
}

export function getProductsByTeam(teamSlug: string): Product[] {
  return products.filter((p) => p.teamSlug === teamSlug);
}

/** Backward-compat for existing /nations/[slug] page — same as getProductsByTeam
 *  but scoped to category=national. */
export function getProductsByNation(nationSlug: string): Product[] {
  return products.filter(
    (p) => p.category === "national" && p.teamSlug === nationSlug,
  );
}

export function getProductsByCategory(
  category: Product["category"],
): Product[] {
  return products.filter((p) => p.category === category);
}

export function getRetroProducts(): Product[] {
  return products.filter((p) => p.isRetro);
}

export function getKidsProducts(): Product[] {
  return products.filter((p) => p.isKids);
}

export function getIsraeliProducts(): Product[] {
  return products.filter((p) => p.league === "israel");
}

export function getWorldCupProducts(): Product[] {
  return products.filter((p) => p.isWorldCup2026);
}

// ============================================================================
// Featured / top sellers
// ============================================================================

/** Top-selling teams to feature on the homepage (English slugs). */
export const FEATURED_TEAM_SLUGS = [
  "real-madrid",
  "barcelona",
  "manchester-united",
  "arsenal",
  "inter-miami",
  "liverpool",
  "psg",
  "argentina",
];

/** Pick one canonical product per featured team (preferring 2025-26 home). */
export function getFeaturedProducts(limit = 8): Product[] {
  const out: Product[] = [];
  for (const slug of FEATURED_TEAM_SLUGS) {
    const teamProducts = getProductsByTeam(slug);
    if (!teamProducts.length) continue;
    const pick =
      teamProducts.find(
        (p) =>
          p.type === "home" && p.season?.startsWith("2025") && !p.isRetro,
      ) ||
      teamProducts.find((p) => p.type === "home" && !p.isRetro) ||
      teamProducts.find((p) => !p.isRetro) ||
      teamProducts[0];
    if (pick) out.push(pick);
    if (out.length >= limit) break;
  }
  return out;
}

// ============================================================================
// Related products
// ============================================================================

export function getRelatedProducts(product: Product, limit = 6): Product[] {
  const pool = products.filter((p) => p.id !== product.id);
  // Same team first, then same league, then random
  const sameTeam = pool.filter((p) => p.teamSlug === product.teamSlug);
  const sameLeague = pool.filter(
    (p) => p.teamSlug !== product.teamSlug && p.league === product.league,
  );
  const others = pool.filter(
    (p) => p.teamSlug !== product.teamSlug && p.league !== product.league,
  );
  return [...sameTeam, ...sameLeague, ...others].slice(0, limit);
}

// ============================================================================
// Pricing helpers (handle null prices — Checkpoint 2 covers full UI logic)
// ============================================================================

export function hasPrice(product: Product): boolean {
  return (
    product.priceFan !== null ||
    product.pricePlayer !== null ||
    product.priceRetro !== null
  );
}

export function getStartingPrice(product: Product): number | null {
  const candidates = [
    product.priceFan,
    product.pricePlayer,
    product.priceRetro,
  ].filter((v): v is number => typeof v === "number" && v > 0);
  if (!candidates.length) return null;
  return Math.min(...candidates);
}

export function getAvailableVersions(product: Product): ProductVersion[] {
  const versions: ProductVersion[] = [];
  if (product.priceRetro !== null || product.isRetro) versions.push("retro");
  if (product.priceFan !== null) versions.push("fan");
  if (product.pricePlayer !== null) versions.push("player");
  // Default for null-price product so UI has *something* to render
  if (versions.length === 0) {
    if (product.isRetro) versions.push("retro");
    else versions.push("fan", "player");
  }
  return versions;
}

export function priceFor(
  product: Product,
  version: ProductVersion,
): number | null {
  if (version === "retro") return product.priceRetro;
  if (version === "player") return product.pricePlayer;
  return product.priceFan;
}

export function totalWithCustomization(
  base: number | null,
  hasCustomization: boolean,
): number | null {
  if (base === null) return null;
  return base + (hasCustomization ? CUSTOMIZATION_FEE : 0);
}

// ============================================================================
// Sizes — gracefully handle catalog noise like ["כן"]
// ============================================================================

const STANDARD_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];
const KIDS_SIZE_PATTERN = /^(XS|YS|YM|YL|YXL|10|12|14|16|18|20|22|24|26|28)$/i;

export function getDisplayableSizes(product: Product): string[] {
  if (!Array.isArray(product.sizes) || product.sizes.length === 0) return [];
  const cleaned = product.sizes
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(
      (s) =>
        STANDARD_SIZES.includes(s.toUpperCase()) ||
        KIDS_SIZE_PATTERN.test(s) ||
        /^(SM|MD|LG|XXL|XXXL|XXXXL)$/i.test(s),
    );
  return cleaned;
}

// ============================================================================
// Search / index helpers (Checkpoint 3 builds on top of these)
// ============================================================================

/** Tokens we expose to a search engine — covers HE + EN + tags. */
export function getSearchTokens(product: Product): string[] {
  return [
    product.nameHe,
    product.nameEn,
    product.team,
    product.teamSlug.replace(/-/g, " "),
    product.league,
    product.season || "",
    ...(product.tags || []),
  ].filter(Boolean);
}

// ============================================================================
// Hero / showcase image picker — returns the most representative product
// image for a category, with safe fallbacks. Used by homepage strips,
// /leagues, /nations, /retro, /kids, /israeli pages.
// ============================================================================

function pickRepresentative(filtered: Product[]): Product | null {
  if (!filtered.length) return null;
  const withImage = filtered.filter((p) => p.images?.length);
  if (!withImage.length) return null;

  // Prefer current-season home/away products (cleaner photography)
  const current2025 = withImage.find(
    (p) =>
      p.season?.startsWith("2025") &&
      (p.type === "home" || p.type === "away") &&
      !p.isKids,
  );
  if (current2025) return current2025;

  // Then any current-season product
  const anyCurrent = withImage.find((p) => p.season?.startsWith("2025"));
  if (anyCurrent) return anyCurrent;

  return withImage[0];
}

export function getHeroImageFor(scope: {
  league?: Product["league"];
  team?: string;
  isRetro?: boolean;
  isKids?: boolean;
  isWorldCup2026?: boolean;
  category?: Product["category"];
}): string | null {
  let pool = products;
  if (scope.league) pool = pool.filter((p) => p.league === scope.league);
  if (scope.team) pool = pool.filter((p) => p.teamSlug === scope.team);
  if (scope.isRetro !== undefined)
    pool = pool.filter((p) => p.isRetro === scope.isRetro);
  if (scope.isKids !== undefined)
    pool = pool.filter((p) => p.isKids === scope.isKids);
  if (scope.isWorldCup2026 !== undefined)
    pool = pool.filter((p) => p.isWorldCup2026 === scope.isWorldCup2026);
  if (scope.category)
    pool = pool.filter((p) => p.category === scope.category);
  const pick = pickRepresentative(pool);
  return pick?.images?.[0] || null;
}

/** Pick N products with images for a strip / collage display. */
export function getShowcaseProducts(
  scope: Parameters<typeof getHeroImageFor>[0],
  limit = 6,
): Product[] {
  let pool = products;
  if (scope.league) pool = pool.filter((p) => p.league === scope.league);
  if (scope.team) pool = pool.filter((p) => p.teamSlug === scope.team);
  if (scope.isRetro !== undefined)
    pool = pool.filter((p) => p.isRetro === scope.isRetro);
  if (scope.isKids !== undefined)
    pool = pool.filter((p) => p.isKids === scope.isKids);
  if (scope.isWorldCup2026 !== undefined)
    pool = pool.filter((p) => p.isWorldCup2026 === scope.isWorldCup2026);
  if (scope.category)
    pool = pool.filter((p) => p.category === scope.category);
  // De-dupe by team so we get visual variety in collages
  const seenTeams = new Set<string>();
  const out: Product[] = [];
  for (const p of pool) {
    if (!p.images?.length) continue;
    if (seenTeams.has(p.teamSlug)) continue;
    seenTeams.add(p.teamSlug);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}
