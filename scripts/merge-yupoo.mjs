/**
 * Merge yupoo-final-catalog.json (1,810 albums × 5,387 photos) into
 * sporthub-products.json. Strategy:
 * 1. For each yupoo entry: extract team / season / type / color / flags
 * 2. Try to match against an existing sporthub product by
 *    teamSlug + season + type (with flexible Hebrew spelling)
 * 3. If matched → append photos, add sourceHandleCn, set colorHe if absent,
 *    add catalog tag
 * 4. If no team match in registry → still add as new product so the photos
 *    aren't lost (team derived from cleaned nameHe)
 *
 * Run: node scripts/merge-yupoo.mjs
 */

import { readFileSync, writeFileSync } from "fs";

// ============================================================================
// 0. Load
// ============================================================================
const yupoo = JSON.parse(
  readFileSync("./data/yupoo-final-catalog.json", "utf8"),
);
const sporthub = JSON.parse(
  readFileSync("./data/sporthub-products.json", "utf8"),
);

const startingCount = sporthub.length;
console.log(`Yupoo entries: ${yupoo.length}`);
console.log(`Sporthub starting: ${startingCount}`);

// ============================================================================
// 1. Color / type / modifier dictionaries
// ============================================================================

const COLOR_HE_TO_EN = {
  "ירוק": "green",
  "אדום": "red",
  "כחול": "blue",
  "לבן": "white",
  "שחור": "black",
  "צהוב": "yellow",
  "סגול": "purple",
  "ורוד": "pink",
  "כתום": "orange",
  "אפור": "gray",
  "חום": "brown",
  "בורדו": "maroon",
  "תכלת": "sky-blue",
  "נייבי": "navy",
  "כסף": "silver",
  "זהב": "gold",
};

const COLOR_CN_TO_HE = [
  ["酒红", "בורדו"],
  ["天蓝", "תכלת"],
  ["绿", "ירוק"],
  ["红", "אדום"],
  ["蓝", "כחול"],
  ["白", "לבן"],
  ["黑", "שחור"],
  ["黄", "צהוב"],
  ["紫", "סגול"],
  ["粉", "ורוד"],
  ["橙", "כתום"],
  ["灰", "אפור"],
  ["棕", "חום"],
  ["金", "זהב"],
  ["银", "כסף"],
];

const TYPE_FROM_CN = [
  ["主场", "home"],
  ["二客", "away"],
  ["三客", "third"],
  ["客场", "away"],
  ["门将", "goalkeeper"],
  ["复古", "retro"],
  ["特别", "special"],
  ["特刻", "special"],
  ["训练", "special"],
];

const TYPE_FROM_HE = [
  ["שלישי", "third"],
  ["שוער", "goalkeeper"],
  ["רטרו", "retro"],
  ["מיוחד", "special"],
  ["מיוחדת", "special"],
  ["בית", "home"],
  ["חוץ", "away"],
];

const KIDS_TOKENS = ["童", "儿童", "ילדים"];
const LONG_SLEEVE_TOKENS = ["长袖", "שרוול ארוך"];

// ============================================================================
// 2. Team registry from sporthub + manual aliases
// ============================================================================

/** Manual aliases — yupoo Hebrew spelling variants → canonical sporthub team. */
const TEAM_ALIASES = {
  "ריאל מדריד": "ריאל מדריד",
  "ריאל": "ריאל מדריד",
  "ברצלונה": "ברצלונה",
  "ברסה": "ברצלונה",
  "אתלטיקו": "אתלטיקו",
  "אתלטיקו מדריד": "אתלטיקו",
  "סביליה": "סביליה",
  "ולנסיה": "ולנסיה",
  "ויאריאל": "ויאריאל",
  "בטיס": "בטיס",
  "סוסיאדד": "ריאל סוסיאדד",
  "ריאל סוסיאדד": "ריאל סוסיאדד",
  "אוסאסונה": "אוסאסונה",
  "אספניול": "אספניול",
  "אתלטיק בילבאו": "אתלטיק בילבאו",
  "ראיו": "ראיו וייקאנו",
  "ראיו וייקאנו": "ראיו וייקאנו",
  "מנצ'סטר יוניטד": "מנצ׳סטר יונייטד",
  "מנצסטר יוניטד": "מנצ׳סטר יונייטד",
  "מנצ׳סטר יוניטד": "מנצ׳סטר יונייטד",
  "מנצ׳סטר יונייטד": "מנצ׳סטר יונייטד",
  "מנצסטר יונייטד": "מנצ׳סטר יונייטד",
  "מנצ סטר": "מנצ׳סטר יונייטד",
  "מנצ'סטר סיטי": "מנצ׳סטר סיטי",
  "מנצסטר סיטי": "מנצ׳סטר סיטי",
  "מנצ׳סטר סיטי": "מנצ׳סטר סיטי",
  "סיטי": "מנצ׳סטר סיטי",
  "ליברפול": "ליברפול",
  "ארסנל": "ארסנל",
  "צ'לסי": "צ׳לסי",
  "צלסי": "צ׳לסי",
  "צ׳לסי": "צ׳לסי",
  "טוטהנאם": "טוטנהאם",
  "טוטנהאם": "טוטנהאם",
  "ספרס": "טוטנהאם",
  "הוטספרס": "טוטנהאם",
  "ניוקסל": "ניוקאסל",
  "ניוקאסל": "ניוקאסל",
  "ווסטהאם": "ווסטהאם",
  "וויסט האם": "ווסטהאם",
  "אסטון וילה": "אסטון וילה",
  "וילה": "אסטון וילה",
  "ברייטון": "ברייטון",
  "פולהאם": "פולהאם",
  "אברטון": "אברטון",
  "וולברהמפטון": "וולברהמפטון",
  "וולבס": "וולברהמפטון",
  "נוטינגהאם": "נוטינגהאם פורסט",
  "נוטינגהאם פורסט": "נוטינגהאם פורסט",
  "פורסט": "נוטינגהאם פורסט",
  "באירן": "באיירן מינכן",
  "באיירן": "באיירן מינכן",
  "באיירן מינכן": "באיירן מינכן",
  "באירן מינכן": "באיירן מינכן",
  "דורטמונד": "דורטמונד",
  "בורוסיה דורטמונד": "דורטמונד",
  "לברקוזן": "באייר לברקוזן",
  "באייר לברקוזן": "באייר לברקוזן",
  "לייפציג": "לייפציג",
  "פריס": "פריז",
  "פריז": "פריז",
  "פסז": "פריז",
  "פיאסז": "פריז",
  "מרסיי": "מרסיי",
  "ליון": "ליון",
  "מונקו": "מונקו",
  "ניס": "ניס",
  "מילן": "מילאן",
  "מילאן": "מילאן",
  "אינטר": "אינטר",
  "אינטר מילאן": "אינטר",
  "יובנטוס": "יובנטוס",
  "יובה": "יובנטוס",
  "נאפולי": "נאפולי",
  "רומא": "רומא",
  "לאציו": "לאציו",
  "אטלנטה": "אטלנטה",
  "פיורנטינה": "פיורנטינה",
  "ארגנטינה": "ארגנטינה",
  "ברזיל": "ברזיל",
  "פורטוגל": "פורטוגל",
  "צרפת": "צרפת",
  "ספרד": "ספרד",
  "גרמניה": "גרמניה",
  "אנגליה": "אנגליה",
  "הולנד": "הולנד",
  "איטליה": "איטליה",
  "בלגיה": "בלגיה",
  "יפן": "יפן",
  "מקסיקו": "מקסיקו",
  "ארה״ב": "ארה״ב",
  "ארה ב": "ארה״ב",
  "ארהב": "ארה״ב",
  "אוקראינה": "אוקראינה",
  "פולין": "פולין",
  "תורכיה": "טורקיה",
  "טורקיה": "טורקיה",
  "מרוקו": "מרוקו",
  "סנגל": "סנגל",
  "ניגריה": "ניגריה",
  "מצרים": "מצרים",
  "אוסטרליה": "אוסטרליה",
  "ארגנטינה ארה ב": "ארגנטינה",
  "אינטר מיאמי": "אינטר מיאמי",
  "מיאמי": "אינטר מיאמי",
  "בוקה": "בוקה",
  "בוקה ג'וניורס": "בוקה",
  "ריבר פלייט": "ריבר פלייט",
  "פלמנגו": "פלמנגו",
  "סנטוס": "סנטוס",
  "פלמיירס": "פלמיירס",
  "באנפיקה": "בנפיקה",
  "בנפיקה": "בנפיקה",
  "פורטו": "פורטו",
  "ספורטינג": "ספורטינג",
  "סלטיק": "סלטיק",
  "ריינג'רס": "ריינג׳רס",
  "ריינג׳רס": "ריינג׳רס",
  "אייאקס": "אייאקס",
  "פיינורד": "פיינורד",
  "PSV": "פסוו איינדהובן",
  "פסוו": "פסוו איינדהובן",
  "הפועל תל אביב": "הפועל תל אביב",
  "הפועל ת'א": "הפועל תל אביב",
  "מכבי תל אביב": "מכבי תל אביב",
  "מכבי ת'א": "מכבי תל אביב",
  "ביתר ירושלים": "ביתר ירושלים",
  "ביתר": "ביתר ירושלים",
};

// Build registry from sporthub + add aliases
const slugByHebrew = new Map();
const recordBySlug = new Map();

for (const p of sporthub) {
  if (p.team && p.teamSlug) {
    if (!slugByHebrew.has(p.team)) slugByHebrew.set(p.team, p.teamSlug);
    if (!recordBySlug.has(p.teamSlug)) {
      recordBySlug.set(p.teamSlug, {
        team: p.team,
        league: p.league,
        category: p.category,
      });
    }
  }
}

// ============================================================================
// 3. Parsing helpers
// ============================================================================

function parseSeason(entry) {
  if (entry.season && entry.season !== "null") return entry.season;
  const text = `${entry.title || ""} ${entry.nameHe || ""}`;
  // YY-YY pattern (e.g. "26-27" → "2026-27")
  const yy = text.match(/(\d{2})[-/](\d{2})/);
  if (yy) {
    const start = parseInt(yy[1], 10);
    const fullStart = start < 70 ? 2000 + start : 1900 + start;
    const next = (fullStart + 1) % 100;
    return `${fullStart}-${next < 10 ? "0" + next : next}`;
  }
  // 4-digit year
  const yyyy = text.match(/(19\d{2}|20\d{2})/);
  if (yyyy) return yyyy[1];
  return null;
}

function detectType(entry) {
  const title = entry.title || "";
  const name = entry.nameHe || "";
  for (const [cn, t] of TYPE_FROM_CN) {
    if (title.includes(cn)) return t;
  }
  for (const [he, t] of TYPE_FROM_HE) {
    if (name.includes(he)) return t;
  }
  return "home";
}

function detectColor(entry) {
  const title = entry.title || "";
  for (const [cn, he] of COLOR_CN_TO_HE) {
    if (title.includes(cn)) return he;
  }
  const name = entry.nameHe || "";
  for (const he of Object.keys(COLOR_HE_TO_EN)) {
    if (name.match(new RegExp(`(?:^|\\s)${he}(?:\\s|$)`))) return he;
  }
  return null;
}

function detectIsKids(entry) {
  const text = `${entry.title || ""} ${entry.nameHe || ""}`;
  return KIDS_TOKENS.some((t) => text.includes(t));
}

function detectIsLongSleeve(entry) {
  const text = `${entry.title || ""} ${entry.nameHe || ""}`;
  return LONG_SLEEVE_TOKENS.some((t) => text.includes(t));
}

function detectIsRetro(entry, season) {
  if (entry.catalog === "retro") return true;
  if (season) {
    const yearMatch = season.match(/(\d{4})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      if (year && year < 2020) return true;
    }
  }
  return false;
}

/** Strip color, type, modifier, season from nameHe to leave just the team.
 *  Hebrew chars don't trigger \b in JS regex, so we use explicit
 *  space/start/end anchors instead. */
function stripHebrewWord(str, word) {
  // Strip when preceded/followed by start/end/space/punct
  return str.replace(
    new RegExp(`(^|[\\s.,:()'"״׳-])${word}(?=[\\s.,:()'"״׳-]|$)`, "g"),
    "$1",
  );
}

function extractTeamHebrew(entry) {
  let str = entry.nameHe || "";

  // Normalize apostrophe variants → Hebrew geresh ׳ (sporthub canonical)
  // yupoo writes "מנצ'סטר" with ASCII '; sporthub writes "מנצ׳סטר" with ׳.
  str = str.replace(/['ʼ`]/g, "׳");

  // Strip Chinese FIRST so leftover Chinese chars don't bleed into our checks
  str = str.replace(/[\u4e00-\u9fa5]/g, " ");

  // Strip leading season prefix — multiple formats:
  //   "26-27 ", "2025-26 ", "2010 ", "26 " (single 2-digit year prefix)
  str = str.replace(/^\s*\d{2,4}[-–/]\d{2,4}\s*/, "").trim();
  str = str.replace(/^\d{4}\s+/, "").trim();
  str = str.replace(/^\d{2}\s+/, "").trim();

  // Strip ID-style markers: "82#", "P52#", "P60", "94#", "75# /"
  str = str.replace(/[A-Za-z]?\d{1,3}#?\s*\/?\s*/g, " ");

  // Strip size markers: "S 4XL", "S 2XL", "4XL", "2XL", "3XL", etc.
  str = str.replace(/\b(S|M|L|XS)\s*[\-–]?\s*[2-4]?X?L\b/gi, " ");
  str = str.replace(/\b[2-4]X?L\b/gi, " ");
  str = str.replace(/\bXXL\b/gi, " ");

  // Strip Hebrew colors (Hebrew-aware boundaries)
  for (const color of Object.keys(COLOR_HE_TO_EN)) {
    str = stripHebrewWord(str, color);
  }
  // Strip Hebrew type words
  for (const [t] of TYPE_FROM_HE) {
    str = stripHebrewWord(str, t);
  }
  // Strip variant markers
  str = stripHebrewWord(str, "שני");
  str = stripHebrewWord(str, "מהדורה");
  str = stripHebrewWord(str, "מיוחדת");
  str = stripHebrewWord(str, "מיוחד");
  str = stripHebrewWord(str, "סט");
  // Strip kids / long-sleeve / brand-extension markers
  str = str.replace(/ילדים|שרוול ארוך|חליפה|POLO|polo|Polo|Y3|LV|（[^）]*）|\([^)]*\)/g, " ");

  // Strip lingering single-letter junk and standalone digits
  str = str.replace(/(^|\s)[A-Z](\s|$)/g, " ");
  str = str.replace(/(^|\s)\d{1,3}(\s|$)/g, " ");

  // Final punctuation/whitespace cleanup
  str = str.replace(/[״"'.,:()\-–\/]+/g, " ").replace(/\s+/g, " ").trim();

  return str;
}

function normalize(s) {
  return (s || "")
    .replace(/[״׳"'ʼ`-–]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

// Pre-build normalized lookup once for speed
const slugByNormalized = new Map();
for (const [team, slug] of slugByHebrew.entries()) {
  const n = normalize(team);
  if (!slugByNormalized.has(n)) slugByNormalized.set(n, { slug, team });
}

function findTeamSlug(rawHebrew) {
  if (!rawHebrew) return null;

  // 1) exact alias hit
  const aliased = TEAM_ALIASES[rawHebrew];
  if (aliased && slugByHebrew.has(aliased)) return slugByHebrew.get(aliased);

  // 2) direct hit in sporthub registry
  if (slugByHebrew.has(rawHebrew)) return slugByHebrew.get(rawHebrew);

  // 3) normalized exact match (handles ׳ vs ' vs nothing)
  const normRaw = normalize(rawHebrew);
  if (slugByNormalized.has(normRaw)) return slugByNormalized.get(normRaw).slug;

  // 4) try alias substitution and re-test
  for (const [from, to] of Object.entries(TEAM_ALIASES)) {
    if (rawHebrew.includes(from)) {
      const replaced = rawHebrew.replace(from, to);
      if (slugByHebrew.has(replaced)) return slugByHebrew.get(replaced);
      const nReplaced = normalize(replaced);
      if (slugByNormalized.has(nReplaced)) return slugByNormalized.get(nReplaced).slug;
    }
  }

  // 5) substring fallback (only if both sides ≥ 4 chars to avoid noise)
  if (normRaw.length >= 4) {
    for (const [n, { slug }] of slugByNormalized.entries()) {
      if (n.length >= 4 && (n.includes(normRaw) || normRaw.includes(n))) {
        return slug;
      }
    }
  }

  return null;
}

function slugify(s, idSuffix = "") {
  let out = (s || "")
    .toLowerCase()
    .replace(/[\u4e00-\u9fa5]/g, "")
    .replace(/[״׳"',.:()]+/g, "")
    .replace(/\s+/g, "-");
  // Keep Hebrew + ASCII + dash
  out = out.replace(/[^\w\u0590-\u05ff-]+/g, "-");
  out = out.replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (idSuffix) out = `${out}-${idSuffix}`;
  return out;
}

function makeMatchKey({ teamSlug, season, type, isKids, isLongSleeve }) {
  return [
    teamSlug,
    season || "",
    type || "home",
    isKids ? "k" : "",
    isLongSleeve ? "ls" : "",
  ].join("|");
}

function inferLeagueFromTeam(teamSlug, category) {
  const r = recordBySlug.get(teamSlug);
  if (r) return r.league;
  // unknown team — return defaults
  return category === "national" ? "tier-3" : "other";
}

function isNationalSlug(teamSlug) {
  // Known national-team slugs from existing sporthub data
  const r = recordBySlug.get(teamSlug);
  return r ? r.category === "national" : false;
}

// ============================================================================
// 4. Pre-index existing sporthub products by match key
// ============================================================================

const products = sporthub.map((p) => ({ ...p })); // shallow clones we can mutate
const byMatchKey = new Map();

for (const p of products) {
  const key = makeMatchKey({
    teamSlug: p.teamSlug,
    season: p.season,
    type: p.type,
    isKids: !!p.isKids,
    isLongSleeve: !!p.isLongSleeve,
  });
  if (!byMatchKey.has(key)) byMatchKey.set(key, []);
  byMatchKey.get(key).push(p);
}

// ============================================================================
// 5. Walk yupoo and merge
// ============================================================================

let mergedCount = 0;
let addedCount = 0;
const unmatchedSamples = [];
const seenUnmatchedTeams = new Set();
const totalsByCatalog = {};

function tagsForCatalog(catalog) {
  const t = ["yupoo"];
  if (catalog && catalog.startsWith("player")) t.push("player");
  else if (catalog && catalog.startsWith("fan")) t.push("fan");
  else if (catalog === "short-suit") t.push("short-suit", "סטים");
  else if (catalog === "retro") t.push("retro");
  return t;
}

for (let i = 0; i < yupoo.length; i++) {
  const e = yupoo[i];
  const season = parseSeason(e);
  const type = detectType(e);
  const color = detectColor(e);
  const isKids = detectIsKids(e);
  const isLongSleeve = detectIsLongSleeve(e);
  const isRetro = detectIsRetro(e, season);
  const isShortSuit = e.catalog === "short-suit";

  const teamHe = extractTeamHebrew(e);
  const teamSlug = findTeamSlug(teamHe);

  totalsByCatalog[e.catalog] = (totalsByCatalog[e.catalog] || 0) + 1;

  if (teamSlug) {
    const teamRecord = recordBySlug.get(teamSlug);
    const matchKey = makeMatchKey({
      teamSlug,
      season,
      type,
      isKids,
      isLongSleeve,
    });
    const existing = (byMatchKey.get(matchKey) || [])[0];

    if (existing) {
      // ---- MERGE into existing product ----
      const newImages = (e.photos || []).filter(
        (u) => !existing.images?.includes(u),
      );
      existing.images = [...(existing.images || []), ...newImages];
      existing.sourceHandleCn = e.title;
      if (color && !existing.colorHe) existing.colorHe = color;
      const tagsToAdd = tagsForCatalog(e.catalog).filter(
        (t) => !existing.tags?.includes(t),
      );
      if (tagsToAdd.length) {
        existing.tags = [...(existing.tags || []), ...tagsToAdd];
      }
      if (isShortSuit) existing.isShortSuit = true;
      mergedCount++;
    } else {
      // Team known but no existing matching variant — add as new product
      const id = `yp-${e.catalog}-${i}`;
      const newProd = {
        id,
        slug: slugify(
          `${teamSlug}-${type}${season ? "-" + season : ""}${isKids ? "-kids" : ""}${isLongSleeve ? "-ls" : ""}`,
          id.slice(-6),
        ),
        nameHe: e.nameHe || teamHe,
        nameEn: "",
        sourceHandle: id,
        sourceUrl: "",
        sourceHandleCn: e.title,
        category: teamRecord.category,
        league: teamRecord.league,
        team: teamRecord.team,
        teamSlug,
        season,
        type,
        isRetro,
        isKids,
        isWorldCup2026: false,
        isSpecial: type === "special",
        isLongSleeve,
        isShortSuit,
        priceFan: null,
        pricePlayer: null,
        priceRetro: null,
        originalPrice: null,
        sizes: [],
        images: e.photos || [],
        tags: tagsForCatalog(e.catalog),
        colorHe: color,
        description: "",
        stock: "in-stock",
        sourcePriceMin: null,
        sourcePriceMax: null,
      };
      products.push(newProd);
      if (!byMatchKey.has(matchKey)) byMatchKey.set(matchKey, []);
      byMatchKey.get(matchKey).push(newProd);
      addedCount++;
    }
  } else {
    // ---- NO TEAM MATCH: still add as new product so photos aren't lost ----
    const fallbackTeam = teamHe || "Unknown";
    if (!seenUnmatchedTeams.has(fallbackTeam)) {
      seenUnmatchedTeams.add(fallbackTeam);
      if (unmatchedSamples.length < 30) unmatchedSamples.push(fallbackTeam);
    }
    const tSlug = slugify(fallbackTeam) || `unknown-${i}`;
    const id = `yp-${e.catalog}-${i}`;
    const newProd = {
      id,
      slug: slugify(`${tSlug}-${type}${season ? "-" + season : ""}`, id.slice(-6)),
      nameHe: e.nameHe,
      nameEn: "",
      sourceHandle: id,
      sourceUrl: "",
      sourceHandleCn: e.title,
      category: "club",
      league: "other",
      team: fallbackTeam,
      teamSlug: tSlug,
      season,
      type,
      isRetro,
      isKids,
      isWorldCup2026: false,
      isSpecial: type === "special",
      isLongSleeve,
      isShortSuit,
      priceFan: null,
      pricePlayer: null,
      priceRetro: null,
      originalPrice: null,
      sizes: [],
      images: e.photos || [],
      tags: tagsForCatalog(e.catalog),
      colorHe: color,
      description: "",
      stock: "in-stock",
      sourcePriceMin: null,
      sourcePriceMax: null,
    };
    products.push(newProd);
    addedCount++;
  }
}

// ============================================================================
// 6. Save + report
// ============================================================================

writeFileSync(
  "./data/sporthub-products.json",
  JSON.stringify(products, null, 2),
);

console.log("");
console.log("=== MERGE COMPLETE ===");
console.log(`Starting count : ${startingCount}`);
console.log(`Ending count   : ${products.length}`);
console.log(`Merged         : ${mergedCount}`);
console.log(`Added new      : ${addedCount}`);
console.log("");
console.log("Per-catalog:");
for (const [k, v] of Object.entries(totalsByCatalog)) {
  console.log(`  ${k.padEnd(12)} ${v}`);
}
console.log("");
console.log(`Unique unmatched team strings: ${seenUnmatchedTeams.size}`);
console.log("Sample unmatched teams (first 30):");
unmatchedSamples.forEach((t) => console.log(`  · ${t}`));
