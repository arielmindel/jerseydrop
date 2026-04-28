#!/usr/bin/env node
/**
 * Cross-check + autofix: scan all products for mismatches between nameHe
 * and teamSlug, then apply fixes for the high-confidence cases.
 *
 * The previous derivation pass missed cases where the supplier's source
 * handle in Chinese disagreed with the Hebrew name (e.g. a sourceHandleCn
 * of "25-26阿贾克斯二客" → ajax, but the Hebrew name is "יפן מדי חוץ" → Japan).
 * For these, the HEBREW NAME wins because it's what the customer reads.
 *
 * Rule order matters: multi-word rules go first, generic rules later, so
 * "אינטר מיאמי" matches inter-miami before "אינטר" matches inter-milan.
 *
 * Pass --apply to write fixes back to data/sporthub-products.json. Without
 * the flag we just print + save a JSON report.
 */

import fs from "node:fs";

const FILE = "data/sporthub-products.json";
const APPLY = process.argv.includes("--apply");
const products = JSON.parse(fs.readFileSync(FILE, "utf8"));

// Hebrew letter range — used as boundary check
const HE_LETTER = /[\u0590-\u05FF]/;
function containsToken(text, word) {
  if (!text || !word) return false;
  const lower = String(text).toLowerCase();
  const w = String(word).toLowerCase();
  let from = 0;
  while (true) {
    const idx = lower.indexOf(w, from);
    if (idx < 0) return false;
    const before = lower[idx - 1];
    const after = lower[idx + w.length];
    const beforeOk = !before || !HE_LETTER.test(before);
    const afterOk = !after || !HE_LETTER.test(after);
    if (beforeOk && afterOk) return true;
    from = idx + 1;
  }
}

// ─── Rule registry ───────────────────────────────────────────────────────
// MULTI-WORD / SPECIFIC rules first, generic ones last. First match wins.
// Each rule: { he: [hebrewName, ...], slug, league, category }
const RULES = [
  // ─── Disambiguators (must run before generic rules) ───────────────
  { he: ["אינטר מיאמי"], slug: "inter-miami", league: "other", category: "club" },
  { he: ["אינטר מילאן"], slug: "inter-milan", league: "serie-a", category: "club" },
  { he: ["מנצסטר יונייטד", "מנצסטר יוניטד", "מנצ׳סטר יונייטד"], slug: "manchester-united", league: "premier-league", category: "club" },
  { he: ["מנצסטר סיטי", "מנצ׳סטר סיטי"], slug: "manchester-city", league: "premier-league", category: "club" },
  { he: ["ריאל מדריד"], slug: "real-madrid", league: "la-liga", category: "club" },
  { he: ["אתלטיקו מדריד", "אטלטיקו מדריד"], slug: "atletico-madrid", league: "la-liga", category: "club" },
  { he: ["באייר לברקוזן", "לברקוזן", "לברקיזן"], slug: "bayer-leverkusen", league: "bundesliga", category: "club" },
  { he: ["רדבול לייפציג", "רד-בול לייפציג", "לייפציג"], slug: "rb-leipzig", league: "bundesliga", category: "club" },
  { he: ["בוקה גוניורס", "בוקה ג׳וניורס"], slug: "boca-juniors", league: "other", category: "club" },
  { he: ["ניו אינגלנד", "ניו-אינגלנד"], slug: "new-england-revolution", league: "other", category: "club" },
  { he: ["LA גלקסי", "אל איי גלקסי", "לוס אנג׳לס גלקסי"], slug: "la-galaxy", league: "other", category: "club" },
  { he: ["ספורטינג ליסבון"], slug: "sporting-lisbon", league: "other", category: "club" },
  { he: ["דרום קוריאה", "דרום-קוריאה"], slug: "south-korea", category: "national" },
  { he: ["דרום אפריקה"], slug: "south-africa", category: "national" },
  { he: ["סעודיה", "ערב הסעודית"], slug: "saudi-arabia", category: "national" },
  { he: ["קוסטה ריקה"], slug: "costa-rica", category: "national" },
  { he: ["ניו זילנד"], slug: "new-zealand", category: "national" },
  { he: ["צ׳ילה", "צילה"], slug: "chile", category: "national" },

  // ─── Italian league ───────────────────────────────────────────────
  { he: ["פיורנטינה"], slug: "fiorentina", league: "serie-a", category: "club" },
  { he: ["רומא"], slug: "roma", league: "serie-a", category: "club" },
  { he: ["נאפולי"], slug: "napoli", league: "serie-a", category: "club" },
  { he: ["יובנטוס"], slug: "juventus", league: "serie-a", category: "club" },
  { he: ["לאציו"], slug: "lazio", league: "serie-a", category: "club" },
  { he: ["אינטר"], slug: "inter-milan", league: "serie-a", category: "club" },
  { he: ["מילאן"], slug: "ac-milan", league: "serie-a", category: "club" },
  { he: ["אטאלנטה"], slug: "atalanta", league: "serie-a", category: "club" },

  // ─── Spanish league ───────────────────────────────────────────────
  { he: ["ברצלונה", "באלוגי"], slug: "barcelona", league: "la-liga", category: "club" },
  { he: ["סביליה"], slug: "sevilla", league: "la-liga", category: "club" },
  { he: ["ולנסיה"], slug: "valencia", league: "la-liga", category: "club" },
  { he: ["בילבאו"], slug: "athletic-bilbao", league: "la-liga", category: "club" },
  { he: ["בטיס"], slug: "real-betis", league: "la-liga", category: "club" },

  // ─── German league ────────────────────────────────────────────────
  { he: ["באיירן", "באירן", "ביירן"], slug: "bayern-munich", league: "bundesliga", category: "club" },
  { he: ["דורטמונד"], slug: "borussia-dortmund", league: "bundesliga", category: "club" },
  { he: ["הרטה ברלין"], slug: "hertha-berlin", league: "bundesliga", category: "club" },
  { he: ["וולפסבורג"], slug: "wolfsburg", league: "bundesliga", category: "club" },

  // ─── English league ───────────────────────────────────────────────
  { he: ["ליברפול"], slug: "liverpool", league: "premier-league", category: "club" },
  { he: ["ארסנל"], slug: "arsenal", league: "premier-league", category: "club" },
  { he: ["צלסי", "צ׳לסי", "צ'לסי"], slug: "chelsea", league: "premier-league", category: "club" },
  { he: ["טוטנהאם", "טוטנהם"], slug: "tottenham", league: "premier-league", category: "club" },
  { he: ["ניוקאסל", "ניו קאסל"], slug: "newcastle", league: "premier-league", category: "club" },
  { he: ["אסטון וילה"], slug: "aston-villa", league: "premier-league", category: "club" },
  { he: ["וולבס", "וולברהמפטון"], slug: "wolves", league: "premier-league", category: "club" },
  { he: ["וואסטהאם", "ווסטהם", "ווסט האם"], slug: "west-ham", league: "premier-league", category: "club" },
  { he: ["לידס יוניטד", "לידס"], slug: "leeds", league: "premier-league", category: "club" },
  { he: ["אברטון"], slug: "everton", league: "premier-league", category: "club" },
  { he: ["ברייטון"], slug: "brighton", league: "premier-league", category: "club" },

  // ─── French league ────────────────────────────────────────────────
  { he: ["psg", "פריז סן ז׳רמן", "פריז"], slug: "psg", league: "ligue-1", category: "club" },
  { he: ["מרסיי"], slug: "marseille", league: "ligue-1", category: "club" },
  { he: ["ליון"], slug: "lyon", league: "ligue-1", category: "club" },

  // ─── Other clubs ──────────────────────────────────────────────────
  { he: ["פלמנגו"], slug: "flamengo", league: "other", category: "club" },
  { he: ["בוקה"], slug: "boca-juniors", league: "other", category: "club" },
  { he: ["ריבר פלייט", "ריבר"], slug: "river-plate", league: "other", category: "club" },
  { he: ["פלמיירס"], slug: "palmeiras", league: "other", category: "club" },
  { he: ["סנטוס"], slug: "santos", league: "other", category: "club" },
  { he: ["אייאקס", "אייקס"], slug: "ajax", league: "other", category: "club" },
  { he: ["פיינורד"], slug: "feyenoord", league: "other", category: "club" },
  { he: ["בנפיקה"], slug: "benfica", league: "other", category: "club" },
  { he: ["פורטו"], slug: "porto", league: "other", category: "club" },
  { he: ["ספורטינג"], slug: "sporting-lisbon", league: "other", category: "club" },
  { he: ["בארגה", "בראגה"], slug: "braga", league: "other", category: "club" },
  { he: ["סלטיק"], slug: "celtic", league: "other", category: "club" },
  { he: ["רנג׳רס", "רנג'רס"], slug: "rangers", league: "other", category: "club" },
  { he: ["אל אהלי"], slug: "al-ahly", league: "other", category: "club" },
  { he: ["אל נאסר", "אל-נאסר"], slug: "al-nassr", league: "other", category: "club" },
  { he: ["אל הילאל", "אל היללי", "אל-הילאל"], slug: "al-hilal", league: "other", category: "club" },
  { he: ["טיגרס"], slug: "tigres", league: "other", category: "club" },
  { he: ["מונטריי"], slug: "monterrey", league: "other", category: "club" },

  // ─── Nations (run after club rules to avoid catching Porto vs Portugal) ─
  { he: ["ארגנטינה"], slug: "argentina", category: "national" },
  { he: ["ברזיל"], slug: "brazil", category: "national" },
  { he: ["פורטוגל"], slug: "portugal", category: "national" },
  { he: ["צרפת"], slug: "france", category: "national" },
  { he: ["ספרד"], slug: "spain", category: "national" },
  { he: ["גרמניה"], slug: "germany", category: "national" },
  { he: ["אנגליה"], slug: "england", category: "national" },
  { he: ["איטליה"], slug: "italy", category: "national" },
  { he: ["הולנד"], slug: "netherlands", category: "national" },
  { he: ["בלגיה"], slug: "belgium", category: "national" },
  { he: ["יפן"], slug: "japan", category: "national" },
  { he: ["מרוקו"], slug: "morocco", category: "national" },
  { he: ["ארה״ב", "ארהב", "ארצות הברית"], slug: "usa", category: "national" },
  { he: ["מקסיקו"], slug: "mexico", category: "national" },
  { he: ["קולומביה"], slug: "colombia", category: "national" },
  { he: ["קרואטיה"], slug: "croatia", category: "national" },
  { he: ["טורקיה"], slug: "turkey", category: "national" },
  { he: ["סנגל"], slug: "senegal", category: "national" },
  { he: ["ניגריה"], slug: "nigeria", category: "national" },
  { he: ["מאלי"], slug: "mali", category: "national" },
];

// Ordered Hebrew name lookup: first match wins
function findExpected(nameHe) {
  for (const rule of RULES) {
    for (const w of rule.he) {
      if (containsToken(nameHe, w)) {
        return { rule, matchedWord: w };
      }
    }
  }
  return null;
}

// Load Hebrew label for a slug (for consistent display in `team`)
const TEAM_LABELS = {};
for (const rule of RULES) TEAM_LABELS[rule.slug] = rule.he[0];
// Special-cases — use a more presentable display label than the matched word
const PRETTY = {
  "real-madrid": "ריאל מדריד",
  "atletico-madrid": "אתלטיקו מדריד",
  "manchester-united": "מנצ׳סטר יונייטד",
  "manchester-city": "מנצ׳סטר סיטי",
  "bayern-munich": "באיירן מינכן",
  "borussia-dortmund": "דורטמונד",
  "rb-leipzig": "לייפציג",
  "bayer-leverkusen": "באייר לברקוזן",
  "ac-milan": "מילאן",
  "inter-milan": "אינטר",
  "inter-miami": "אינטר מיאמי",
  "boca-juniors": "בוקה גוניורס",
  "river-plate": "ריבר פלייט",
  "sporting-lisbon": "ספורטינג ליסבון",
  "la-galaxy": "LA גלקסי",
  "new-england-revolution": "ניו אינגלנד",
  "real-betis": "בטיס",
  "athletic-bilbao": "בילבאו",
  "aston-villa": "אסטון וילה",
  "west-ham": "ווסט האם",
  "south-korea": "דרום קוריאה",
  "south-africa": "דרום אפריקה",
  "saudi-arabia": "ערב הסעודית",
  "costa-rica": "קוסטה ריקה",
  "new-zealand": "ניו זילנד",
};
for (const [slug, name] of Object.entries(PRETTY)) TEAM_LABELS[slug] = name;

let mismatches = 0;
let fixed = 0;
const conflicts = [];

for (const p of products) {
  const exp = findExpected(p.nameHe || "");
  if (!exp) continue;
  if (exp.rule.slug === p.teamSlug) continue;

  mismatches++;
  conflicts.push({
    id: p.id,
    nameHe: p.nameHe,
    matched: exp.matchedWord,
    expectedSlug: exp.rule.slug,
    currentSlug: p.teamSlug,
    currentTeam: p.team,
    cn: p.sourceHandleCn,
  });

  if (APPLY) {
    p.teamSlug = exp.rule.slug;
    p.team = TEAM_LABELS[exp.rule.slug] || exp.matchedWord;
    if (exp.rule.league) p.league = exp.rule.league;
    if (exp.rule.category) p.category = exp.rule.category;
    fixed++;
  }
}

console.log(`Total mismatches: ${mismatches} / ${products.length}`);
if (APPLY) console.log(`Applied fixes: ${fixed}`);

console.log("");
console.log("First 25 conflicts:");
console.log(JSON.stringify(conflicts.slice(0, 25), null, 2));

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(
  "docs/MISLABEL_AUDIT.json",
  JSON.stringify({ count: mismatches, applied: APPLY ? fixed : 0, conflicts }, null, 2),
);
console.log(`\nFull report → docs/MISLABEL_AUDIT.json`);

if (APPLY) {
  fs.writeFileSync(FILE, JSON.stringify(products, null, 2));
  console.log(`Wrote fixes back to ${FILE}`);
}
