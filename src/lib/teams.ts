/**
 * Team-grouping utilities.
 *
 * Drives the LEVEL-1 league/nation cards (one card per unique team in that
 * scope) and the LEVEL-2 /teams/[slug] page. Everything is computed from
 * the catalog at module load — no hardcoded team lists, every team that
 * has ≥ 1 product gets a card.
 *
 * Team slugs are skipped if they're catch-all buckets that aren't really
 * teams ("unknown", "misc"). Adding a new team to the catalog automatically
 * surfaces it as a card the next build.
 */

import { getAllProducts, getHeroImageFor } from "./products";
import type { Product } from "./types";

/** Slugs that are placeholder buckets, not real teams — never get a card. */
const NON_TEAM_SLUGS = new Set(["unknown", "misc", "", "ac"]);

/** Brand colour map for team-card ribbons. Add new entries here as the
 *  catalogue grows — falls back to neon green if a team isn't listed. */
export const TEAM_COLORS: Record<string, { bg: string; fg: string }> = {
  // La Liga
  "real-madrid": { bg: "bg-white", fg: "text-[#0E1A2B]" },
  barcelona: { bg: "bg-[#A50044]", fg: "text-white" },
  "atletico-madrid": { bg: "bg-[#CB3524]", fg: "text-white" },
  "athletic-bilbao": { bg: "bg-[#EE2523]", fg: "text-white" },
  "real-betis": { bg: "bg-[#0E913A]", fg: "text-white" },
  sevilla: { bg: "bg-white", fg: "text-[#D6202F]" },
  valencia: { bg: "bg-[#FF7E1A]", fg: "text-white" },
  // Premier League
  arsenal: { bg: "bg-[#EF0107]", fg: "text-white" },
  chelsea: { bg: "bg-[#034694]", fg: "text-white" },
  liverpool: { bg: "bg-[#C8102E]", fg: "text-white" },
  "manchester-city": { bg: "bg-[#6CABDD]", fg: "text-[#0F2542]" },
  "manchester-united": { bg: "bg-[#DA291C]", fg: "text-white" },
  tottenham: { bg: "bg-white", fg: "text-[#0F2542]" },
  newcastle: { bg: "bg-[#0F0F10]", fg: "text-white" },
  "aston-villa": { bg: "bg-[#7A003C]", fg: "text-[#95BFE5]" },
  everton: { bg: "bg-[#003399]", fg: "text-white" },
  brighton: { bg: "bg-[#005DAA]", fg: "text-white" },
  wolves: { bg: "bg-[#FDB913]", fg: "text-[#231F20]" },
  "west-ham": { bg: "bg-[#7A263A]", fg: "text-[#FBBA00]" },
  leeds: { bg: "bg-white", fg: "text-[#1D428A]" },
  fulham: { bg: "bg-white", fg: "text-[#0F0F10]" },
  // Serie A
  "ac-milan": { bg: "bg-[#FB090B]", fg: "text-[#0F0F10]" },
  "inter-milan": { bg: "bg-[#0068A8]", fg: "text-[#FBBA00]" },
  juventus: { bg: "bg-[#0F0F10]", fg: "text-white" },
  napoli: { bg: "bg-[#0099D5]", fg: "text-white" },
  roma: { bg: "bg-[#8E1F2F]", fg: "text-[#F0BC42]" },
  lazio: { bg: "bg-[#87CEEB]", fg: "text-white" },
  fiorentina: { bg: "bg-[#592C82]", fg: "text-white" },
  atalanta: { bg: "bg-[#0E1A2B]", fg: "text-[#1B71BB]" },
  // Bundesliga
  "bayern-munich": { bg: "bg-[#DC052D]", fg: "text-white" },
  "borussia-dortmund": { bg: "bg-[#FDE100]", fg: "text-[#0F0F10]" },
  "bayer-leverkusen": { bg: "bg-[#E32219]", fg: "text-[#0F0F10]" },
  "rb-leipzig": { bg: "bg-white", fg: "text-[#DD0741]" },
  "vfb-stuttgart": { bg: "bg-white", fg: "text-[#E32219]" },
  "st-pauli": { bg: "bg-[#624A2A]", fg: "text-white" },
  // Ligue 1
  psg: { bg: "bg-[#0F2542]", fg: "text-[#DA291C]" },
  marseille: { bg: "bg-[#2FAFE2]", fg: "text-white" },
  lyon: { bg: "bg-white", fg: "text-[#0E1A2B]" },
  monaco: { bg: "bg-[#CD0F2D]", fg: "text-white" },
  // Other / club international
  "inter-miami": { bg: "bg-[#F7B5CD]", fg: "text-[#231F20]" },
  ajax: { bg: "bg-white", fg: "text-[#D2122E]" },
  benfica: { bg: "bg-[#E32219]", fg: "text-white" },
  porto: { bg: "bg-[#0E2C5C]", fg: "text-white" },
  "sporting-lisbon": { bg: "bg-[#019344]", fg: "text-white" },
  flamengo: { bg: "bg-[#0F0F10]", fg: "text-[#E1131D]" },
  "boca-juniors": { bg: "bg-[#003F87]", fg: "text-[#FFD200]" },
  "river-plate": { bg: "bg-white", fg: "text-[#D6202F]" },
  santos: { bg: "bg-white", fg: "text-[#0F0F10]" },
  palmeiras: { bg: "bg-[#0E6E36]", fg: "text-white" },
  celtic: { bg: "bg-[#016A3A]", fg: "text-white" },
  rangers: { bg: "bg-[#1C3F94]", fg: "text-white" },
  feyenoord: { bg: "bg-[#E32219]", fg: "text-white" },
  psv: { bg: "bg-[#ED1B24]", fg: "text-white" },
  fenerbahce: { bg: "bg-[#FFE500]", fg: "text-[#0E2C5C]" },
  galatasaray: { bg: "bg-[#FFB300]", fg: "text-[#A71930]" },
  "al-nassr": { bg: "bg-[#FFD400]", fg: "text-[#231F20]" },
  "al-hilal": { bg: "bg-[#0048A0]", fg: "text-white" },
  "al-ahly": { bg: "bg-[#E32219]", fg: "text-white" },
  // Nations
  argentina: { bg: "bg-[#75AADB]", fg: "text-[#FFC72C]" },
  brazil: { bg: "bg-[#FFDF00]", fg: "text-[#009C3B]" },
  france: { bg: "bg-[#0055A4]", fg: "text-white" },
  germany: { bg: "bg-[#0F0F10]", fg: "text-[#FFCE00]" },
  spain: { bg: "bg-[#AA151B]", fg: "text-[#F1BF00]" },
  portugal: { bg: "bg-[#006600]", fg: "text-[#FFCC00]" },
  england: { bg: "bg-white", fg: "text-[#CE1124]" },
  italy: { bg: "bg-[#0073C2]", fg: "text-white" },
  netherlands: { bg: "bg-[#FF6C00]", fg: "text-white" },
  belgium: { bg: "bg-[#0F0F10]", fg: "text-[#FAE042]" },
  morocco: { bg: "bg-[#C1272D]", fg: "text-[#006233]" },
  japan: { bg: "bg-white", fg: "text-[#BC002D]" },
  mexico: { bg: "bg-[#006847]", fg: "text-white" },
  usa: { bg: "bg-[#3C3B6E]", fg: "text-white" },
  croatia: { bg: "bg-white", fg: "text-[#FF0000]" },
  colombia: { bg: "bg-[#FCD116]", fg: "text-[#003893]" },
  uruguay: { bg: "bg-[#0038A8]", fg: "text-[#FCD116]" },
};

/**
 * Priority order — these slugs always come first within their league /
 * nation tier, in this exact order. Anything not listed falls into the
 * "by product count desc" tail.
 */
const PRIORITY_BY_LEAGUE: Record<string, string[]> = {
  "premier-league": [
    "arsenal",
    "chelsea",
    "liverpool",
    "manchester-city",
    "manchester-united",
    "tottenham",
    "newcastle",
    "aston-villa",
  ],
  "la-liga": [
    "real-madrid",
    "barcelona",
    "atletico-madrid",
    "athletic-bilbao",
    "sevilla",
    "real-betis",
  ],
  "serie-a": [
    "ac-milan",
    "inter-milan",
    "juventus",
    "napoli",
    "roma",
    "lazio",
    "atalanta",
    "bologna",
  ],
  bundesliga: [
    "bayern-munich",
    "borussia-dortmund",
    "bayer-leverkusen",
    "rb-leipzig",
    "vfb-stuttgart",
  ],
  "ligue-1": ["psg", "monaco", "marseille", "lyon", "brest", "lille"],
  other: ["inter-miami"],
  "tier-1": ["argentina", "brazil", "france", "germany", "spain", "portugal", "england"],
  "tier-2": ["netherlands", "italy", "belgium", "morocco", "japan", "mexico", "usa"],
};

export type TeamSummary = {
  slug: string;
  name: string;
  productCount: number;
  heroImage: string | null;
  isPriority: boolean;
};

/** Sort `[slug, count]` pairs: priority list (in given order) first,
 *  then everything else by count desc, then by slug asc as tiebreaker. */
function sortTeams(
  pairs: Array<[string, number]>,
  priority: string[],
): Array<[string, number]> {
  const prioRank = new Map<string, number>(
    priority.map((s, i) => [s, i]),
  );
  return [...pairs].sort((a, b) => {
    const ra = prioRank.has(a[0]) ? prioRank.get(a[0])! : Infinity;
    const rb = prioRank.has(b[0]) ? prioRank.get(b[0])! : Infinity;
    if (ra !== rb) return ra - rb;
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
}

function representative(products: Product[]): {
  name: string;
  image: string | null;
} {
  if (!products.length) return { name: "", image: null };
  // Prefer a "home" jersey with a real image
  const candidates = [
    products.find((p) => p.type === "home" && p.images?.length),
    products.find((p) => !p.isRetro && p.images?.length),
    products.find((p) => p.images?.length),
    products[0],
  ];
  const pick = candidates.find(Boolean)!;
  return {
    name: pick.team || pick.teamSlug,
    image: pick.images?.[0] || null,
  };
}

/** All teams in a given league/tier scope, sorted per spec. */
export function getTeamsInScope(scopeSlug: string): TeamSummary[] {
  const all = getAllProducts();
  const inScope = all.filter((p) => p.league === scopeSlug);
  const byTeam = new Map<string, Product[]>();
  for (const p of inScope) {
    if (!p.teamSlug || NON_TEAM_SLUGS.has(p.teamSlug)) continue;
    if (!byTeam.has(p.teamSlug)) byTeam.set(p.teamSlug, []);
    byTeam.get(p.teamSlug)!.push(p);
  }

  const counts: Array<[string, number]> = Array.from(
    byTeam.entries(),
    ([slug, products]) => [slug, products.length],
  );
  const priority = PRIORITY_BY_LEAGUE[scopeSlug] || [];
  const sorted = sortTeams(counts, priority);
  const prioritySet = new Set(priority);

  return sorted.map(([slug, count]) => {
    const products = byTeam.get(slug)!;
    const rep = representative(products);
    return {
      slug,
      name: rep.name,
      productCount: count,
      heroImage: rep.image || getHeroImageFor({ team: slug }),
      isPriority: prioritySet.has(slug),
    };
  });
}

/** Top N team slugs for a scope — used by MegaMenu quick-links. */
export function getTopTeams(scopeSlug: string, limit = 5): TeamSummary[] {
  return getTeamsInScope(scopeSlug).slice(0, limit);
}

/** Used by /teams/[slug] page — group all distinct teamSlugs in the catalog
 *  for `generateStaticParams`. Filters out non-team buckets. */
export function getAllTeamSlugs(): string[] {
  const all = getAllProducts();
  const set = new Set<string>();
  for (const p of all) {
    if (!p.teamSlug || NON_TEAM_SLUGS.has(p.teamSlug)) continue;
    set.add(p.teamSlug);
  }
  return Array.from(set);
}

/** Resolve a team's display metadata (name, hero image, league, count). */
export function getTeamMeta(teamSlug: string): {
  slug: string;
  name: string;
  league: string | null;
  productCount: number;
  heroImage: string | null;
} | null {
  const all = getAllProducts();
  const products = all.filter((p) => p.teamSlug === teamSlug);
  if (!products.length) return null;
  const rep = representative(products);
  return {
    slug: teamSlug,
    name: rep.name,
    league: products[0].league || null,
    productCount: products.length,
    heroImage: rep.image,
  };
}
