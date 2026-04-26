import Fuse from "fuse.js";
import { products } from "./products";
import type { Product } from "./types";

/**
 * Hebrew/English-aware search.
 *
 * - Normalizes Hebrew niqqud, geresh (״ ׳ ׳ ' "), dashes, and double letters.
 * - Maps the most common Hebrew↔English spelling pairs ("מנצסטר", "מנצ׳סטר",
 *   "manchester") to the same token bag.
 * - Indexes nameHe, nameEn, team, league, season, tags, and a few derived
 *   alias fields. Fuse handles fuzzy distance from there.
 */

const NIQQUD = /[\u0591-\u05C7]/g; // Hebrew vowel/cantillation marks
const QUOTE_CHARS = /["'״׳`]/g;
const SEPARATORS = /[-_./()[\]]+/g;

function stripDiacritics(s: string): string {
  return s.replace(NIQQUD, "");
}

export function normalizeText(input: string | null | undefined): string {
  if (!input) return "";
  return stripDiacritics(input)
    .toLowerCase()
    .replace(QUOTE_CHARS, "")
    .replace(SEPARATORS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Maps frequent Hebrew brand spellings to a canonical token (and vice versa).
 * Add entries as we see real-world misses in usage.
 */
const SYNONYMS: Record<string, string[]> = {
  "מנצסטר": ["מנצ'סטר", "manchester", "מנצסטר יונייטד", "manchester united"],
  "מנצ'סטר": ["מנצסטר", "manchester"],
  "ריאל": ["real madrid", "ריאל מדריד", "real"],
  "ברצלונה": ["barcelona", "barca", "ברסה"],
  "ברסה": ["ברצלונה", "barcelona"],
  "ליברפול": ["liverpool", "lfc"],
  "ארסנל": ["arsenal", "afc"],
  "סיטי": ["man city", "manchester city"],
  "צלסי": ["chelsea"],
  "באירן": ["bayern", "bayern munich", "באיירן"],
  "באיירן": ["bayern", "bayern munich", "באירן"],
  "דורטמונד": ["dortmund", "bvb"],
  "פסז": ["psg", "paris", "פריז"],
  "פריז": ["psg", "paris"],
  "אינטר": ["inter", "inter milan"],
  "מילאן": ["milan", "ac milan"],
  "יובנטוס": ["juventus", "juve"],
  "נאפולי": ["napoli"],
  "מיאמי": ["inter miami", "miami"],
  "ארגנטינה": ["argentina", "messi"],
  "מסי": ["messi", "ארגנטינה", "אינטר מיאמי"],
  "ברזיל": ["brazil", "brasil"],
  "פורטוגל": ["portugal", "ronaldo", "כריסטיאנו"],
  "רונאלדו": ["ronaldo", "פורטוגל"],
  "כריסטיאנו": ["ronaldo", "פורטוגל"],
  "צרפת": ["france", "mbappe"],
  "ספרד": ["spain"],
  "גרמניה": ["germany"],
  "אנגליה": ["england"],
  "הולנד": ["netherlands"],
  "מקסיקו": ["mexico"],
  "יפן": ["japan"],
  "מרוקו": ["morocco"],
  "הפועל": ["hapoel", "hapoel tel aviv", "הפועל תל אביב"],
  "מכבי": ["maccabi", "maccabi tel aviv", "מכבי תל אביב"],
  "ביתר": ["beitar", "beitar jerusalem"],
};

export function expandSynonyms(input: string): string {
  const tokens = normalizeText(input).split(" ");
  const expanded = new Set<string>(tokens);
  for (const t of tokens) {
    const aliases = SYNONYMS[t];
    if (aliases) aliases.forEach((a) => expanded.add(normalizeText(a)));
  }
  return Array.from(expanded).join(" ");
}

// ============================================================================
// Indexed shape — what Fuse actually scans
// ============================================================================

type IndexedProduct = {
  id: string;
  slug: string;
  // Original product reference for result rendering
  product: Product;
  // Normalized searchable fields
  nameHe: string;
  nameEn: string;
  team: string;
  teamSlug: string;
  league: string;
  season: string;
  tags: string;
  flagsLabel: string;
  combined: string;
};

function flagsLabel(p: Product): string {
  const labels: string[] = [];
  if (p.isWorldCup2026) labels.push("מונדיאל world cup mundial 2026");
  if (p.isRetro) labels.push("רטרו retro vintage");
  if (p.isKids) labels.push("ילדים kids");
  if (p.isLongSleeve) labels.push("שרוול ארוך long sleeve");
  if (p.isSpecial) labels.push("מהדורה מיוחדת special");
  return labels.join(" ");
}

function buildIndex(): IndexedProduct[] {
  return products.map((p) => {
    const tagsStr = (p.tags || []).join(" ");
    const indexed: IndexedProduct = {
      id: p.id,
      slug: p.slug,
      product: p,
      nameHe: normalizeText(p.nameHe),
      nameEn: normalizeText(p.nameEn),
      team: normalizeText(p.team),
      teamSlug: normalizeText(p.teamSlug),
      league: normalizeText(p.league),
      season: normalizeText(p.season || ""),
      tags: normalizeText(tagsStr),
      flagsLabel: normalizeText(flagsLabel(p)),
      combined: "",
    };
    indexed.combined = [
      indexed.nameHe,
      indexed.nameEn,
      indexed.team,
      indexed.teamSlug,
      indexed.league,
      indexed.season,
      indexed.tags,
      indexed.flagsLabel,
    ]
      .filter(Boolean)
      .join(" ");
    return indexed;
  });
}

const INDEX: IndexedProduct[] = buildIndex();

const FUSE = new Fuse(INDEX, {
  includeScore: true,
  threshold: 0.34,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: "team", weight: 4 },
    { name: "nameHe", weight: 3 },
    { name: "nameEn", weight: 3 },
    { name: "teamSlug", weight: 2 },
    { name: "tags", weight: 2 },
    { name: "league", weight: 1 },
    { name: "season", weight: 1 },
    { name: "flagsLabel", weight: 1 },
    { name: "combined", weight: 0.5 },
  ],
});

// ============================================================================
// Public API
// ============================================================================

export type SearchResult = {
  product: Product;
  score: number;
};

export function searchProducts(
  query: string,
  limit = 100,
): SearchResult[] {
  const normalized = expandSynonyms(query);
  if (!normalized) return [];
  const matches = FUSE.search(normalized, { limit });
  return matches.map((m) => ({
    product: m.item.product,
    score: m.score ?? 1,
  }));
}

/** Suggested searches for the empty state and the "didn't find anything" UI. */
export const SEARCH_SUGGESTIONS = [
  "ארגנטינה",
  "ברצלונה",
  "ריאל מדריד",
  "מנצ׳סטר יונייטד",
  "מסי",
  "מונדיאל 2026",
  "רטרו",
  "ילדים",
  "הפועל תל אביב",
  "אינטר מיאמי",
];
