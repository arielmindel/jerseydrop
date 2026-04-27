import patchesConfigJson from "@catalog/patches-config.json";
import type { Product } from "./types";

// ============================================================================
// Typed wrappers around /data/patches-config.json
// ============================================================================

export type Patch = {
  id: string;
  nameHe: string;
  nameEn: string;
  iconUrl: string;
  price: number;
  description: string;
};

type PatchesConfig = {
  patches: Record<string, Patch>;
  championsLeague25_26: string[];
  europaLeague25_26: string[];
  teamLeague: Record<string, string>;
};

const CONFIG = patchesConfigJson as unknown as PatchesConfig;

/** Sentinel "no patch" option always offered as the default. */
export const NO_PATCH: Patch = {
  id: "none",
  nameHe: "ללא פאצ׳",
  nameEn: "No Patch",
  iconUrl: "/images/patches/no-patch.svg",
  price: 0,
  description: "ללא פאצ׳ על השרוול",
};

const UCL = new Set(CONFIG.championsLeague25_26);
const UEL = new Set(CONFIG.europaLeague25_26);

function patchById(id: string): Patch | null {
  return CONFIG.patches[id] || null;
}

/**
 * Available patches per product, per the rules in the spec:
 * - National + WC2026 → World Cup patch
 * - National otherwise → no patches
 * - Club in Israel → Israeli Premier League patch
 * - Club in UCL → Champions League OR domestic league
 * - Club in UEL → Europa League OR domestic league
 * - Club otherwise → domestic league only
 * - Always include "no-patch" as the first option (default).
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

  if (UCL.has(slug)) {
    const ucl = patchById("champions-league-25-26");
    if (ucl) patches.push(ucl);
    if (domestic) patches.push(domestic);
    return patches;
  }

  if (UEL.has(slug)) {
    const uel = patchById("europa-league-25-26");
    if (uel) patches.push(uel);
    if (domestic) patches.push(domestic);
    return patches;
  }

  if (domestic) patches.push(domestic);
  return patches;
}

export function getPatchById(id: string | null | undefined): Patch | null {
  if (!id || id === NO_PATCH.id) return null;
  return patchById(id);
}
