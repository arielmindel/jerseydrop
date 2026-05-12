#!/usr/bin/env node
/**
 * Verification harness for the season-aware patch selector.
 *
 * Reads data/patches-config.json directly (mirrors the runtime logic in
 * src/lib/patches.ts) and runs the 12 spot-checks specified in the goal
 * brief. Exits non-zero if any check fails so CI / the dev loop can react.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_PATH = resolve(__dirname, "../data/patches-config.json");
const CONFIG = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));

const COMPETITION_TO_PATCH = {
  championsLeague: "champions-league",
  uefaCup: "uefa-cup",
  europaLeague: "europa-league",
  cupWinnersCup: "cup-winners-cup",
  conferenceLeague: "conference-league",
};

function normalizeSeason(s) {
  if (!s) return null;
  const trimmed = String(s).trim();
  const m1 = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (m1) {
    const start = parseInt(m1[1], 10);
    const endYY = parseInt(m1[2], 10);
    const expected = (start + 1) % 100;
    if (endYY === expected && start >= 1950 && start <= 2030) return trimmed;
    if (start > 2030) {
      const corrected = start - 100;
      const correctedEnd = (corrected + 1) % 100;
      if (correctedEnd === endYY)
        return `${corrected}-${String(endYY).padStart(2, "0")}`;
    }
    return null;
  }
  const m2 = trimmed.match(/^(\d{2})(\d{2})$/);
  if (m2) {
    const a = parseInt(m2[1], 10);
    const b = parseInt(m2[2], 10);
    if (b === (a + 1) % 100) {
      const startYear = a >= 60 ? 1900 + a : 2000 + a;
      return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
    }
  }
  return null;
}

function findCompetitionForTeam(slug, season) {
  const s = CONFIG.competitions?.[season];
  if (!s) return null;
  const order = [
    "championsLeague",
    "uefaCup",
    "europaLeague",
    "conferenceLeague",
    "cupWinnersCup",
  ];
  for (const c of order) {
    if (s[c]?.includes(slug)) return c;
  }
  return null;
}

function getAvailablePatches(product) {
  const ids = ["none"];
  if (product.category === "national") {
    if (product.isWorldCup2026) ids.push("world-cup-2026");
    return ids;
  }
  if (product.league === "israel") {
    ids.push("israeli-premier-league");
    return ids;
  }
  const domesticId = CONFIG.teamLeague[product.teamSlug];
  const season = normalizeSeason(product.season);
  if (season) {
    const comp = findCompetitionForTeam(product.teamSlug, season);
    if (comp) {
      ids.push(COMPETITION_TO_PATCH[comp]);
      if (domesticId) ids.push(domesticId);
      return ids;
    }
  }
  if (domesticId) ids.push(domesticId);
  return ids;
}

// ---------------------------------------------------------------------------
// 12 spot-checks
// ---------------------------------------------------------------------------
const CASES = [
  {
    name: "Arsenal 2024-25",
    product: { category: "club", teamSlug: "arsenal", season: "2024-25" },
    expected: ["premier-league", "champions-league"],
  },
  {
    name: "Inter 2009-10",
    product: { category: "club", teamSlug: "inter-milan", season: "2009-10" },
    expected: ["serie-a", "champions-league"],
  },
  {
    name: "Bayern 2012-13",
    product: { category: "club", teamSlug: "bayern-munich", season: "2012-13" },
    expected: ["bundesliga", "champions-league"],
  },
  {
    name: "Liverpool 2000-01",
    product: { category: "club", teamSlug: "liverpool", season: "2000-01" },
    expected: ["premier-league", "uefa-cup"],
  },
  {
    name: "Real Madrid 1997-98",
    product: { category: "club", teamSlug: "real-madrid", season: "1997-98" },
    expected: ["la-liga", "champions-league"],
  },
  {
    name: "Manchester United 1998-99",
    product: {
      category: "club",
      teamSlug: "manchester-united",
      season: "1998-99",
    },
    expected: ["premier-league", "champions-league"],
  },
  {
    name: "Barcelona 1996-97",
    product: { category: "club", teamSlug: "barcelona", season: "1996-97" },
    expected: ["la-liga", "cup-winners-cup"],
  },
  {
    name: "PSG 1995-96",
    product: { category: "club", teamSlug: "psg", season: "1995-96" },
    expected: ["ligue-1", "cup-winners-cup"],
  },
  {
    name: "Chelsea 1997-98",
    product: { category: "club", teamSlug: "chelsea", season: "1997-98" },
    expected: ["premier-league", "cup-winners-cup"],
  },
  {
    name: "AC Milan 1993-94",
    product: { category: "club", teamSlug: "ac-milan", season: "1993-94" },
    expected: ["serie-a", "champions-league"],
  },
  {
    name: "AS Roma 2024-25",
    product: { category: "club", teamSlug: "roma", season: "2024-25" },
    expected: ["serie-a", "europa-league"],
  },
  {
    name: "Tottenham 2024-25",
    product: { category: "club", teamSlug: "tottenham", season: "2024-25" },
    expected: ["premier-league", "europa-league"],
  },
];

let passed = 0;
const failures = [];

for (const tc of CASES) {
  const ids = getAvailablePatches(tc.product);
  // The "none" sentinel is always there; the expected patches must all be
  // present (regardless of ordering) and no UEFA/domestic patch should leak.
  const without = ids.filter((id) => id !== "none");
  const expectedSet = new Set(tc.expected);
  const actualSet = new Set(without);
  const sizeMatch = expectedSet.size === actualSet.size;
  const contentMatch = [...expectedSet].every((id) => actualSet.has(id));
  const ok = sizeMatch && contentMatch;
  if (ok) {
    passed++;
    console.log(`  ✅  ${tc.name}  →  ${without.join(", ")}`);
  } else {
    failures.push({
      name: tc.name,
      expected: tc.expected,
      actual: without,
    });
    console.log(
      `  ❌  ${tc.name}\n        expected: ${tc.expected.join(", ")}\n        actual:   ${without.join(", ")}`,
    );
  }
}

console.log("");
console.log(`Result: ${passed}/${CASES.length} pass`);
if (failures.length > 0) {
  process.exit(1);
}
