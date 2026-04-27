/**
 * Audit the supplier catalog for product↔image mismatches.
 *
 * Strategy:
 * 1. Treat the source URL slug (Hebrew handle from sporthubkit.com) as the
 *    ground-truth team name. The supplier built that URL by hand from the
 *    original product title, so it's the most reliable signal we have.
 * 2. Cross-check 3 things:
 *    a) The `team` field — does it match the team mentioned in the URL?
 *    b) The first image filename — does it mention any team that conflicts
 *       with the labelled team? (lots of images are named e.g. "Liverpool_Home_Kids.jpg")
 *    c) The teamSlug — does it correspond to a known canonical team?
 * 3. Flag any product with conflicting signals.
 *
 * Output:
 *   data/audit-report.json — every problematic product with explanation
 *   data/audit-summary.txt — human-readable summary
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");

const products = JSON.parse(
  await fs.readFile(path.join(DATA, "sporthub-products.json"), "utf8"),
);

// ---------------------------------------------------------------------------
// Team dictionary — Hebrew names + English slugs + aliases for matching
// ---------------------------------------------------------------------------
const TEAMS = [
  // ----- Top European clubs -----
  { slug: "real-madrid",        he: ["ריאל מדריד", "ריאל"],                          en: ["real madrid", "real-madrid", "realmadrid", "rmcf"] },
  { slug: "barcelona",          he: ["ברצלונה", "ברסה"],                              en: ["barcelona", "barca", "fcb", "fc-barcelona"] },
  { slug: "manchester-united",  he: ["מנצסטר יונייטד", "מנצ'סטר יונייטד", "יונייטד", "manunited"],  en: ["manchester united", "man united", "man-united", "manchester-united", "united", "mufc"] },
  { slug: "manchester-city",    he: ["מנצ'סטר סיטי", "סיטי"],                       en: ["manchester city", "man city", "manchester-city", "man-city", "city", "mci"] },
  { slug: "liverpool",          he: ["ליברפול"],                                      en: ["liverpool", "lfc"] },
  { slug: "arsenal",            he: ["ארסנל"],                                        en: ["arsenal", "afc"] },
  { slug: "chelsea",            he: ["צלסי"],                                          en: ["chelsea", "cfc"] },
  { slug: "tottenham",          he: ["טוטהנאם", "טוטנהאם", "ספרס"],                en: ["tottenham", "spurs", "thfc"] },
  { slug: "newcastle",          he: ["ניוקאסל"],                                      en: ["newcastle", "nufc"] },
  { slug: "bayern-munich",      he: ["באירן מינכן", "באיירן", "באירן"],            en: ["bayern", "bayern munich", "bayern-munich", "fcb"] },
  { slug: "borussia-dortmund",  he: ["דורטמונד"],                                     en: ["dortmund", "bvb", "borussia"] },
  { slug: "psg",                he: ["פריז סן ז'רמן", "פריז", "פסז"],              en: ["psg", "paris", "paris-saint-germain"] },
  { slug: "marseille",          he: ["מארסיי", "מרסיי"],                            en: ["marseille", "om", "olympique-marseille"] },
  { slug: "lyon",               he: ["ליון"],                                          en: ["lyon", "olympique-lyonnais", "ol"] },
  { slug: "juventus",           he: ["יובנטוס", "יובה"],                            en: ["juventus", "juve", "juv"] },
  { slug: "ac-milan",           he: ["מילאן", "אצ' מילאן"],                          en: ["milan", "ac milan", "ac-milan", "acmilan"] },
  { slug: "inter-milan",        he: ["אינטר", "אינטר מילאן"],                       en: ["inter", "inter milan", "inter-milan", "intermilan"] },
  { slug: "napoli",             he: ["נאפולי"],                                       en: ["napoli", "ssc-napoli"] },
  { slug: "roma",               he: ["רומא"],                                          en: ["roma", "as-roma", "asroma"] },
  { slug: "lazio",              he: ["לאציו"],                                         en: ["lazio", "ss-lazio"] },
  { slug: "atletico-madrid",    he: ["אתלטיקו מדריד", "אתלטיקו"],                  en: ["atletico", "atletico-madrid", "atleti"] },
  { slug: "sevilla",            he: ["סביליה"],                                        en: ["sevilla"] },
  { slug: "betis",              he: ["בטיס"],                                          en: ["betis", "real-betis"] },
  { slug: "athletic-bilbao",    he: ["אתלטיק בילבאו"],                              en: ["athletic", "bilbao", "athletic-bilbao"] },
  { slug: "celtic",             he: ["סלטיק"],                                         en: ["celtic"] },
  { slug: "ajax",               he: ["אאיאקס", "אייאקס"],                          en: ["ajax"] },
  { slug: "benfica",            he: ["בנפיקה"],                                        en: ["benfica"] },
  { slug: "sporting",           he: ["ספורטינג"],                                     en: ["sporting", "sporting-cp", "lisbon"] },
  { slug: "porto",              he: ["פורטו"],                                         en: ["porto", "fc-porto"] },
  { slug: "braga",              he: ["בראגה"],                                         en: ["braga", "sc-braga"] },
  { slug: "inter-miami",        he: ["אינטר מיאמי", "מיאמי"],                       en: ["inter miami", "miami", "intermiami"] },
  { slug: "boca-juniors",       he: ["בוקה", "בוקה ג'וניורס"],                       en: ["boca", "boca-juniors", "boca juniors"] },
  { slug: "river-plate",        he: ["ריבר פלייט"],                                  en: ["river", "river-plate", "river plate"] },
  { slug: "flamengo",           he: ["פלמנגו"],                                       en: ["flamengo"] },
  { slug: "santos",             he: ["סנטוס"],                                         en: ["santos"] },
  { slug: "palmeiras",          he: ["פלמייראס"],                                    en: ["palmeiras"] },
  { slug: "corinthians",        he: ["קורינתיאנס"],                                  en: ["corinthians"] },
  { slug: "fluminense",         he: ["פלומיננזה"],                                   en: ["fluminense"] },
  { slug: "botafogo",           he: ["בוטאפוגו"],                                    en: ["botafogo"] },
  { slug: "leicester",          he: ["לסטר"],                                          en: ["leicester", "lcfc"] },
  { slug: "aston-villa",        he: ["אסטון וילה"],                                  en: ["aston villa", "aston-villa", "avfc"] },
  { slug: "everton",            he: ["אברטון"],                                        en: ["everton"] },
  { slug: "leeds",              he: ["לידס"],                                          en: ["leeds"] },
  { slug: "wolves",             he: ["וולבס", "וולבר"],                             en: ["wolves", "wolverhampton"] },
  { slug: "brighton",           he: ["ברייטון"],                                       en: ["brighton"] },
  { slug: "fulham",             he: ["פולהאם"],                                        en: ["fulham"] },
  { slug: "west-ham",           he: ["ווסטהאם"],                                      en: ["west ham", "west-ham", "westham"] },
  { slug: "valencia",            he: ["ולנסיה"],                                       en: ["valencia"] },
  { slug: "cadiz",              he: ["קאדיז"],                                         en: ["cadiz"] },
  // ----- Israeli clubs -----
  { slug: "hapoel-tel-aviv",    he: ["הפועל תל אביב", "הפועל ת\"א"],                en: ["hapoel-tel-aviv", "hapoel tel aviv", "hapoel-ta", "hapoel"] },
  { slug: "maccabi-tel-aviv",   he: ["מכבי תל אביב", "מכבי ת\"א"],                 en: ["maccabi-tel-aviv", "maccabi tel aviv", "maccabi-ta", "maccabi"] },
  { slug: "beitar-jerusalem",   he: ["ביתר ירושלים", "ביתר"],                       en: ["beitar", "beitar-jerusalem", "beitar jerusalem"] },
  { slug: "hapoel-beer-sheva",  he: ["הפועל באר שבע"],                              en: ["hapoel-beer-sheva", "beer sheva"] },
  { slug: "maccabi-haifa",      he: ["מכבי חיפה"],                                    en: ["maccabi-haifa", "maccabi haifa"] },
  // ----- National teams -----
  { slug: "argentina",          he: ["ארגנטינה"],   en: ["argentina", "rgntynh", "rgntyn"] },
  { slug: "brazil",             he: ["ברזיל"],       en: ["brazil", "brasil", "brzyl"] },
  { slug: "portugal",           he: ["פורטוגל"],    en: ["portugal", "pwrtwgl"] },
  { slug: "france",             he: ["צרפת"],        en: ["france", "zrpt"] },
  { slug: "spain",              he: ["ספרד"],         en: ["spain", "sprd"] },
  { slug: "germany",            he: ["גרמניה"],     en: ["germany", "grmnyh", "grmny"] },
  { slug: "england",            he: ["אנגליה"],     en: ["england", "nglyh", "ngly"] },
  { slug: "italy",              he: ["איטליה"],     en: ["italy", "ytlyh", "ytly"] },
  { slug: "netherlands",        he: ["הולנד"],       en: ["netherlands", "holland", "hwlnd"] },
  { slug: "belgium",            he: ["בלגיה"],       en: ["belgium", "blgyh"] },
  { slug: "japan",              he: ["יפן"],          en: ["japan", "ypn"] },
  { slug: "mexico",             he: ["מקסיקו"],     en: ["mexico", "mqsyqw", "msyqw"] },
  { slug: "morocco",            he: ["מרוקו"],       en: ["morocco", "mrwqw"] },
  { slug: "usa",                he: ["ארה\"ב", "ארהב"], en: ["usa", "us", "united states"] },
  { slug: "canada",             he: ["קנדה"],         en: ["canada", "qndh"] },
  { slug: "colombia",           he: ["קולומביה"],   en: ["colombia"] },
  { slug: "croatia",            he: ["קרואטיה"],   en: ["croatia"] },
  { slug: "turkey",             he: ["טורקיה"],     en: ["turkey"] },
  { slug: "saudi-arabia",       he: ["סעודיה", "ערב הסעודית"], en: ["saudi", "saudi-arabia"] },
  { slug: "south-korea",        he: ["דרום קוריאה"], en: ["south korea", "south-korea", "korea"] },
  { slug: "scotland",           he: ["סקוטלנד"],    en: ["scotland"] },
  { slug: "wales",              he: ["וויילס", "וילס"], en: ["wales"] },
  { slug: "switzerland",        he: ["שוויץ"],       en: ["switzerland"] },
  { slug: "norway",             he: ["נורווגיה"],   en: ["norway"] },
  { slug: "denmark",            he: ["דנמרק"],       en: ["denmark"] },
  { slug: "chile",              he: ["צ'ילה"],       en: ["chile"] },
  { slug: "uruguay",            he: ["אורוגוואי"], en: ["uruguay"] },
  { slug: "peru",               he: ["פרו"],          en: ["peru"] },
  { slug: "ecuador",            he: ["אקוודור"],    en: ["ecuador"] },
  { slug: "ghana",              he: ["גאנה"],         en: ["ghana"] },
  { slug: "senegal",            he: ["סנגל"],         en: ["senegal"] },
  { slug: "nigeria",            he: ["ניגריה"],     en: ["nigeria"] },
  { slug: "ivory-coast",        he: ["חוף השנהב"], en: ["ivory coast", "ivory-coast", "cote d ivoire"] },
  { slug: "cameroon",           he: ["קמרון"],       en: ["cameroon"] },
  { slug: "qatar",              he: ["קטאר"],         en: ["qatar"] },
  { slug: "iran",               he: ["איראן"],       en: ["iran"] },
  { slug: "iraq",               he: ["עיראק"],       en: ["iraq"] },
  { slug: "jordan",             he: ["ירדן"],         en: ["jordan"] },
  { slug: "egypt",              he: ["מצרים"],       en: ["egypt"] },
  { slug: "tunisia",            he: ["תוניסיה"],   en: ["tunisia"] },
  { slug: "algeria",            he: ["אלג'יריה"],   en: ["algeria"] },
];

function normalize(s) {
  return (s || "").toLowerCase()
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[״׳"'`]/g, "")
    .replace(/[-_./()[\]]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectTeam(text) {
  const t = normalize(text);
  if (!t) return null;
  // Build candidates: (team, variant, score) where longer variants score higher.
  // Use word-boundary match for short variants (<=3 chars) to avoid "om"
  // matching inside "roma".
  const candidates = [];
  for (const team of TEAMS) {
    for (const variant of [...team.he, ...team.en]) {
      const n = normalize(variant);
      if (!n) continue;
      let matched = false;
      if (n.length <= 3) {
        // Word-boundary regex
        const re = new RegExp(`(^|[^a-z\u0590-\u05FF])${n}([^a-z\u0590-\u05FF]|$)`, "i");
        matched = re.test(t);
      } else {
        // Substring is OK for 4+ chars
        matched = t.includes(n);
      }
      if (matched) candidates.push({ team: team.slug, variant: n, len: n.length });
    }
  }
  if (!candidates.length) return null;
  // Prefer the longest variant match — it's the most specific
  candidates.sort((a, b) => b.len - a.len);
  return candidates[0].team;
}

function teamFromSourceUrl(p) {
  if (!p.sourceUrl) return null;
  const handle = decodeURIComponent(p.sourceUrl.split("/").pop() || "");
  return detectTeam(handle);
}

function teamFromImageFilename(p) {
  const filenames = (p.images || []).map((u) => {
    const last = u.split("/").pop() || "";
    return decodeURIComponent(last.split("?")[0]);
  });
  for (const fn of filenames) {
    const t = detectTeam(fn);
    if (t) return t;
  }
  return null;
}

function teamFromCurrentLabel(p) {
  return detectTeam(`${p.team || ""} ${p.nameHe || ""} ${p.teamSlug || ""}`);
}

// ---------------------------------------------------------------------------
// Run audit
// ---------------------------------------------------------------------------
const issues = [];
const stats = {
  total: products.length,
  resolvedFromUrl: 0,
  resolvedFromImage: 0,
  conflictUrlVsLabel: 0,
  conflictImageVsLabel: 0,
  conflictImageVsUrl: 0,
  unresolvable: 0,
};

for (const p of products) {
  const fromUrl = teamFromSourceUrl(p);
  const fromImg = teamFromImageFilename(p);
  const fromLabel = teamFromCurrentLabel(p);

  if (fromUrl) stats.resolvedFromUrl++;
  if (fromImg) stats.resolvedFromImage++;
  if (!fromUrl && !fromImg && !fromLabel) {
    stats.unresolvable++;
    issues.push({
      id: p.id,
      slug: p.slug,
      team: p.team,
      nameHe: p.nameHe,
      sourceUrl: p.sourceUrl,
      images: p.images?.slice(0, 1) || [],
      issue: "no-team-detected",
      currentTeam: p.team,
      teamFromUrl: null,
      teamFromImage: null,
      teamFromLabel: null,
    });
    continue;
  }

  // Conflict detection — when 2+ signals disagree
  const allSignals = [
    fromUrl && { src: "url", val: fromUrl },
    fromImg && { src: "image", val: fromImg },
    fromLabel && { src: "label", val: fromLabel },
  ].filter(Boolean);

  const distinct = new Set(allSignals.map((s) => s.val));
  if (distinct.size > 1) {
    // Mismatch! Decide canonical (URL > image > label).
    const canonical = fromUrl || fromImg || fromLabel;
    const conflictType =
      fromUrl && fromImg && fromUrl !== fromImg
        ? "image-vs-url"
        : fromImg && fromLabel && fromImg !== fromLabel
          ? "image-vs-label"
          : "url-vs-label";

    if (conflictType === "image-vs-url") stats.conflictImageVsUrl++;
    if (conflictType === "image-vs-label") stats.conflictImageVsLabel++;
    if (conflictType === "url-vs-label") stats.conflictUrlVsLabel++;

    issues.push({
      id: p.id,
      slug: p.slug,
      team: p.team,
      nameHe: p.nameHe,
      sourceUrl: p.sourceUrl,
      images: p.images?.slice(0, 1) || [],
      issue: conflictType,
      currentTeamSlug: p.teamSlug,
      teamFromUrl: fromUrl,
      teamFromImage: fromImg,
      teamFromLabel: fromLabel,
      canonicalRecommendation: canonical,
    });
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
const reportPath = path.join(DATA, "audit-report.json");
await fs.writeFile(reportPath, JSON.stringify({ stats, issues }, null, 2));

const summary = `JerseyDrop Audit — ${new Date().toISOString()}
=====================================

Total products: ${stats.total}
Resolved from URL: ${stats.resolvedFromUrl}
Resolved from image: ${stats.resolvedFromImage}
Unresolvable (no team detected anywhere): ${stats.unresolvable}

CONFLICTS:
  Image filename ≠ URL handle: ${stats.conflictImageVsUrl}  ← these likely have wrong images
  Image filename ≠ Label: ${stats.conflictImageVsLabel}
  URL handle ≠ Label: ${stats.conflictUrlVsLabel}

TOTAL ISSUES: ${issues.length}

Top 20 mismatched products:
${issues
  .filter((i) => i.issue !== "no-team-detected")
  .slice(0, 20)
  .map(
    (i) =>
      `  - [${i.issue}] ${i.team || "(no team)"} | URL says: ${i.teamFromUrl || "?"} | Image says: ${i.teamFromImage || "?"}\n    sourceUrl: ${i.sourceUrl}\n    image: ${i.images[0] || "(none)"}`,
  )
  .join("\n\n")}
`;

await fs.writeFile(path.join(DATA, "audit-summary.txt"), summary);
console.log(summary);
