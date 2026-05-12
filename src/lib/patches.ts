import patchesConfigJson from "@catalog/patches-config.json";
import type { Product } from "./types";

// ============================================================================
// Typed wrappers around /data/patches-config.json — season-aware UEFA patches
// ============================================================================

export type Patch = {
  id: string;
  nameHe: string;
  nameEn: string;
  iconUrl: string;
  price: number;
  description: string;
};

type Competition =
  | "championsLeague"
  | "uefaCup"
  | "europaLeague"
  | "cupWinnersCup"
  | "conferenceLeague";

type SeasonCompetitions = Partial<Record<Competition, string[]>>;

type PatchesConfig = {
  patches: Record<string, Patch>;
  competitions: Record<string, SeasonCompetitions>;
  teamLeague: Record<string, string>;
};

const CONFIG = patchesConfigJson as unknown as PatchesConfig;

const COMPETITION_TO_PATCH: Record<Competition, string> = {
  championsLeague: "champions-league",
  uefaCup: "uefa-cup",
  europaLeague: "europa-league",
  cupWinnersCup: "cup-winners-cup",
  conferenceLeague: "conference-league",
};

/** Sentinel "no patch" option always offered as the default. */
export const NO_PATCH: Patch = {
  id: "none",
  nameHe: "ללא פאצ׳",
  nameEn: "No Patch",
  iconUrl: "/images/patches/no-patch.svg",
  price: 0,
  description: "ללא פאצ׳ על השרוול",
};

function patchById(id: string): Patch | null {
  return CONFIG.patches[id] || null;
}

/**
 * Normalize the supplier's wildly inconsistent season strings into the
 * canonical "YYYY-YY" form used as keys in CONFIG.competitions.
 *
 * Handles:
 *  - "2024-25"   → "2024-25"   (already canonical)
 *  - "0910"      → "2009-10"   (compact two-digit pair)
 *  - "1213"      → "2012-13"
 *  - "9899"      → "1998-99"
 *  - "2096-97"   → "1996-97"   (mass-rename script bug: 19→20 prefix)
 *  - "2093-94"   → "1993-94"
 *  - "1994"      → null        (single year — likely World Cup, no Euro)
 *  - null/empty  → null
 */
export function normalizeSeason(s: string | null | undefined): string | null {
  if (!s) return null;
  const trimmed = s.trim();

  // Canonical YYYY-YY
  const m1 = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (m1) {
    const start = parseInt(m1[1], 10);
    const endYY = parseInt(m1[2], 10);
    const expected = (start + 1) % 100;
    if (endYY === expected && start >= 1950 && start <= 2030) {
      return trimmed;
    }
    // Corrupted "20XX-YY" where actual is "19XX-YY" (>2030 is impossible
    // future) — try subtracting 100 from the start.
    if (start > 2030) {
      const corrected = start - 100;
      const correctedEnd = (corrected + 1) % 100;
      if (correctedEnd === endYY) {
        return `${corrected}-${String(endYY).padStart(2, "0")}`;
      }
    }
    return null;
  }

  // Compact 4-digit form XXYY (consecutive years)
  const m2 = trimmed.match(/^(\d{2})(\d{2})$/);
  if (m2) {
    const a = parseInt(m2[1], 10);
    const b = parseInt(m2[2], 10);
    if (b === (a + 1) % 100) {
      const startYear = a >= 60 ? 1900 + a : 2000 + a;
      return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
    }
  }

  // Single year — likely a national-team World Cup / Euros jersey.
  // No European club-competition patch applies.
  return null;
}

/**
 * Look up the UEFA competition (if any) a given team participated in during
 * a specific normalized season. Returns the competition key or null.
 */
function findCompetitionForTeam(
  teamSlug: string,
  normalizedSeason: string,
): Competition | null {
  const season = CONFIG.competitions[normalizedSeason];
  if (!season) return null;
  // Tier priority: a club is listed in only ONE European competition per
  // season; if data accidentally has them in two, prefer UCL > UEL/UEFA-Cup
  // > Conference League > Cup Winners' Cup.
  const order: Competition[] = [
    "championsLeague",
    "uefaCup",
    "europaLeague",
    "conferenceLeague",
    "cupWinnersCup",
  ];
  for (const comp of order) {
    const list = season[comp];
    if (list && list.includes(teamSlug)) return comp;
  }
  return null;
}

/**
 * Available patches per product. Rules:
 *  - National team + WC2026 → World Cup patch (no Euro patches)
 *  - National team otherwise → no patches
 *  - Club in Israeli league → Israeli Premier League patch
 *  - Club in a European competition that season → competition patch +
 *    domestic-league patch
 *  - Club otherwise → domestic-league patch only
 *  - "No patch" is always the first option (the default).
 */
export function getAvailablePatches(product: Product): Patch[] {
  const patches: Patch[] = [NO_PATCH];

  if (product.category === "national") {
    if (product.isWorldCup2026) {
      const wc = patchById("world-cup-2026");
      if (wc) patches.push(wc);
    }
    return patches;
  }

  // category === "club"
  if (product.league === "israel") {
    const isr = patchById("israeli-premier-league");
    if (isr) patches.push(isr);
    return patches;
  }

  const slug = product.teamSlug;
  const domesticId = CONFIG.teamLeague[slug];
  const domestic = domesticId ? patchById(domesticId) : null;

  const season = normalizeSeason(product.season);
  if (season) {
    const comp = findCompetitionForTeam(slug, season);
    if (comp) {
      const compPatch = patchById(COMPETITION_TO_PATCH[comp]);
      if (compPatch) {
        patches.push(compPatch);
        if (domestic) patches.push(domestic);
        return patches;
      }
    }
  }

  if (domestic) patches.push(domestic);
  return patches;
}

export function getPatchById(id: string | null | undefined): Patch | null {
  if (!id || id === NO_PATCH.id) return null;
  return patchById(id);
}

/** Teams currently in UCL — used by the "Champions League" collection page. */
export function getCurrentUclTeams(): string[] {
  return CONFIG.competitions["2025-26"]?.championsLeague ?? [];
}
