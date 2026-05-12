#!/usr/bin/env node
/**
 * Wave-2 fix: rebuild nameHe + (occasionally) teamSlug from sourceHandleCn.
 *
 * Context:
 *   An earlier audit fixed many teamSlugs by trusting nameHe. But there's
 *   still a wave of products where teamSlug is now correct (post-fix) but
 *   nameHe was never regenerated — so the display still shows the OLD wrong
 *   team. Plus a residual where teamSlug itself stayed wrong.
 *
 *   We trust the Chinese supplier handle (sourceHandleCn). It always names
 *   the team explicitly. From CN we get expected teamSlug, then:
 *     - if current teamSlug ≠ expected ⇒ correct teamSlug + team + league.
 *     - if nameHe does NOT contain the canonical Hebrew team name for the
 *       (corrected) teamSlug ⇒ rebuild nameHe from scratch.
 *
 * Conservative: skip if uncertain.
 *   - No sourceHandleCn → skip.
 *   - CN doesn't yield a confident team token → skip.
 *   - Cannot determine canonical Hebrew team name → skip.
 *
 * Run:
 *   node scripts/fix-cn-based-names.mjs            # dry-run + report
 *   node scripts/fix-cn-based-names.mjs --apply    # write changes
 */

import { readFileSync, writeFileSync } from "node:fs";

const FILE = "data/sporthub-products.json";
const APPLY = process.argv.includes("--apply");

const products = JSON.parse(readFileSync(FILE, "utf8"));
const startCount = products.length;
const config = JSON.parse(readFileSync("data/patches-config.json", "utf8"));
const TEAM_LEAGUE = config.teamLeague; // slug → league id

// ─── Chinese → teamSlug dictionary (longest match wins) ──────────────────
// We start from the existing dictionary (fix-team-derivation.mjs) and add
// the major tokens the user provided that were missing.

const CN_TO_SLUG = {
  // Premier League
  "曼联": "manchester-united",
  "曼彻斯特联": "manchester-united",
  "曼城": "manchester-city",
  "曼彻斯特城": "manchester-city",
  "利物浦": "liverpool",
  "阿森纳": "arsenal",
  "切尔西": "chelsea",
  "热刺": "tottenham",
  "托特纳姆": "tottenham",
  "纽卡斯尔": "newcastle",
  "纽卡斯": "newcastle",
  "纽卡": "newcastle",
  "西汉姆": "west-ham",
  "阿斯顿维拉": "aston-villa",
  "维拉": "aston-villa",
  "布莱顿": "brighton",
  "富勒姆": "fulham",
  "埃弗顿": "everton",
  "狼队": "wolves",
  "诺丁汉森林": "nottingham-forest",
  "诺丁汉": "nottingham-forest",
  "莱斯特": "leicester-city",
  "伯恩茅斯": "bournemouth",
  "伯恩利": "burnley",
  "水晶宫": "crystal-palace",
  "利兹联": "leeds",
  "利兹": "leeds",
  "谢菲尔德联": "sheffield-united",
  "桑德兰": "sunderland",
  "考文垂": "coventry",
  "德比郡": "derby-county",
  "雷克斯汉姆": "wrexham",

  // La Liga
  "皇家马德里": "real-madrid",
  "皇马": "real-madrid",
  "巴塞罗那": "barcelona",
  "巴萨": "barcelona",
  "巴塞": "barcelona",
  "巴赛": "barcelona",
  "马德里竞技": "atletico-madrid",
  "马竞": "atletico-madrid",
  "毕尔巴鄂": "athletic-bilbao",
  "毕尔包": "athletic-bilbao",
  "塞维利亚": "sevilla",
  "贝蒂斯": "real-betis",
  "皇家社会": "real-sociedad",
  "巴伦西亚": "valencia",
  "瓦伦西亚": "valencia",
  "比利亚雷亚尔": "villarreal",
  "维拉利尔": "villarreal",
  "赫罗纳": "girona",
  "奥萨苏纳": "osasuna",
  "西班牙人": "espanyol",
  "巴列卡诺": "rayo-vallecano",
  "塞尔塔": "celta-vigo",
  "赫塔菲": "getafe",
  "格拉纳达": "granada",
  "马略卡": "mallorca",
  "马洛卡": "mallorca",
  "马拉加": "malaga",
  "加迪斯": "cadiz",
  "卡迪斯": "cadiz",
  "莱万特": "levante",
  "阿拉维斯": "alaves",
  "巴拉多利德": "real-valladolid",

  // Serie A
  "AC米兰": "ac-milan",
  "ac米兰": "ac-milan",
  "国际米兰": "inter-milan",
  "国米": "inter-milan",
  // NOTE: 米兰 alone is ambiguous (Milan city → AC Milan by default per dict);
  // we DELIBERATELY don't add it as a bare key because international tokens
  // 国米 / AC米兰 / ac米兰 are longer and will match first. Keeping 米兰 as
  // a tie-breaker default to AC Milan if nothing longer matched.
  "米兰": "ac-milan",
  "尤文图斯": "juventus",
  "尤文": "juventus",
  "那不勒斯": "napoli",
  "罗马": "roma",
  "拉齐奥": "lazio",
  "亚特兰大": "atalanta",
  "佛罗伦萨": "fiorentina",
  "博洛尼亚": "bologna",
  "莱切": "lecce",
  "都灵": "torino",
  "乌迪内斯": "udinese",
  "蒙扎": "monza",
  "科莫": "como",
  "帕尔马": "parma",
  "帕尔玛": "parma",
  "威尼斯": "venezia",

  // Bundesliga
  "拜仁慕尼黑": "bayern-munich",
  "拜仁": "bayern-munich",
  "多特蒙德": "borussia-dortmund",
  "多特": "borussia-dortmund",
  "勒沃库森": "bayer-leverkusen",
  "莱比锡": "rb-leipzig",
  "rb莱比锡": "rb-leipzig",
  "RB莱比锡": "rb-leipzig",
  "斯图加特": "vfb-stuttgart",
  "法兰克福": "eintracht-frankfurt",
  "门兴格拉德巴赫": "borussia-monchengladbach",
  "门兴": "borussia-monchengladbach",
  "沃尔夫斯堡": "wolfsburg",
  "沙尔克": "schalke",
  "圣保利": "st-pauli",
  "圣保里": "st-pauli",
  "不莱梅": "werder-bremen",

  // Ligue 1 (LONGEST FIRST: 巴黎圣日耳曼 before 巴黎)
  "巴黎圣日耳曼": "psg",
  "大巴黎": "psg",
  "巴黎": "psg",
  "马赛": "marseille",
  "里昂": "lyon",
  "摩纳哥": "monaco",
  "里尔": "lille",
  "雷恩": "rennes",
  "尼斯": "nice",
  "布雷斯特": "brest",

  // Eredivisie / Portugal / Scotland / Turkey
  "阿贾克斯": "ajax",
  "埃因霍温": "psv",
  "费耶诺德": "feyenoord",
  "阿尔克马尔": "az-alkmaar",
  "本菲卡": "benfica",
  "波尔图": "porto",
  "葡萄牙体育": "sporting-lisbon",
  "里斯本竞技": "sporting-lisbon",
  "葡体": "sporting-lisbon",
  "布拉加": "braga",
  "凯尔特人": "celtic",
  "流浪者": "rangers",
  "阿伯丁": "aberdeen",
  "费内巴切": "fenerbahce",
  "加拉塔萨雷": "galatasaray",
  "贝西克塔斯": "besiktas",
  "特拉布宗体育": "trabzonspor",
  "萨尔茨堡": "red-bull-salzburg",
  "矿工": "shakhtar-donetsk",
  "基辅迪纳摩": "dynamo-kyiv",
  "雅典AEK": "aek-athens",

  // MLS / North America
  "国际迈阿密": "inter-miami",
  "迈阿密国际": "inter-miami",
  "迈阿密": "inter-miami",
  "洛杉矶银河": "la-galaxy",
  "洛杉矶FC": "lafc",
  "华盛顿联": "dc-united",
  "华盛顿": "dc-united",
  "夏洛特": "charlotte-fc",
  "新英格兰": "new-england-revolution",
  "亚特兰大联": "atlanta-united",
  "西雅图": "seattle-sounders",

  // South America
  "博卡青年": "boca-juniors",
  "博卡": "boca-juniors",
  "河床": "river-plate",
  "弗拉门戈": "flamengo",
  "桑托斯": "santos",
  "帕尔梅拉斯": "palmeiras",
  "科林蒂安": "corinthians",
  "圣保罗": "sao-paulo",
  "格雷米奥": "gremio",
  "弗鲁米嫩塞": "fluminense",
  "瓦斯科": "vasco",
  "博塔弗戈": "botafogo",
  "克鲁塞罗": "cruzeiro",
  "米内罗": "atletico-mineiro",
  "国民竞技": "atletico-nacional",
  "巴拉纳竞技": "atletico-paranaense",

  // Liga MX / Chile
  "美洲队": "club-america",
  "美洲": "club-america",
  "老虎": "tigres",
  "提格雷斯": "tigres",
  "蓝十字": "cruz-azul",
  "蒙特雷": "monterrey",
  "芝华士": "chivas",
  "科洛科洛": "colo-colo",
  "智利大学": "universidad-catolica",
  "米利奥那利奥斯": "millonarios",

  // Egypt / Saudi
  "开罗国民": "al-ahly",
  "阿赫利": "al-ahly",
  "阿尔纳斯尔": "al-nassr",
  "利雅得新月": "al-hilal",
  "利雅得胜利": "al-nassr",
  "吉达国民": "al-ittihad",
  "吉达联合": "al-ittihad",

  // Israeli (real)
  "特拉维夫工人": "hapoel-tel-aviv",
  "工人特拉维夫": "hapoel-tel-aviv",
  "马卡比特拉维夫": "maccabi-tel-aviv",
  "贝塔尔耶路撒冷": "beitar-jerusalem",
  "马卡比海法": "maccabi-haifa",
  "万城": "manchester-city",
  "万联": "manchester-united",

  // ─── National teams ─────────────────────────────────────────
  "阿根廷": "argentina",
  "巴西": "brazil",
  "葡萄牙": "portugal",
  "法国": "france",
  "西班牙": "spain",
  "德国": "germany",
  "英格兰": "england",
  "荷兰": "netherlands",
  "意大利": "italy",
  "比利时": "belgium",
  "日本": "japan",
  "摩洛哥": "morocco",
  "美国": "usa",
  "墨西哥": "mexico",
  "哥伦比亚": "colombia",
  "克罗地亚": "croatia",
  "土耳其": "turkey",
  "韩国": "south-korea",
  "沙特": "saudi-arabia",
  "苏格兰": "scotland",
  "瑞士": "switzerland",
  "挪威": "norway",
  "智利": "chile",
  "威尔士": "wales",
  "乌拉圭": "uruguay",
  "厄瓜多尔": "ecuador",
  "加纳": "ghana",
  "尼日利亚": "nigeria",
  "塞内加尔": "senegal",
  "科特迪瓦": "ivory-coast",
  "南非": "south-africa",
  "埃及": "egypt",
  "阿尔及利亚": "algeria",
  "喀麦隆": "cameroon",
  "突尼斯": "tunisia",
  "马里": "mali",
  "澳大利亚": "australia",
  "加拿大": "canada",
  "乌克兰": "ukraine",
  "波兰": "poland",
  "丹麦": "denmark",
  "瑞典": "sweden",
  "奥地利": "austria",
  "塞尔维亚": "serbia",
  "爱尔兰": "ireland",
  "牙买加": "jamaica",
  "卡塔尔": "qatar",
  "伊朗": "iran",
  "伊拉克": "iraq",
  "委内瑞拉": "venezuela",
  "秘鲁": "peru",
  "巴拉圭": "paraguay",
  "玻利维亚": "bolivia",
  "巴拿马": "panama",
  "中国": "china",
  "北爱尔兰": "northern-ireland",
  "捷克": "czech-republic",
  "匈牙利": "hungary",
  "希腊": "greece",

  // ─── Typos & short forms commonly seen in supplier CN handles ───
  "阿深纳": "arsenal",          // typo of 阿森纳
  "佛拉门戈": "flamengo",       // typo of 弗拉门戈
  "佛罗伦赛": "fiorentina",     // typo of 佛罗伦萨
  "阿尼及利亚": "algeria",      // typo of 阿尔及利亚
  "兰十字": "cruz-azul",        // typo of 蓝十字
  "客麦隆": "cameroon",         // typo of 喀麦隆
  "科特迪特瓦": "ivory-coast",  // typo of 科特迪瓦
  "皇家贝斯": "real-betis",     // typo of 皇家贝蒂斯
  "阿斯顿": "aston-villa",      // short form (Aston without 维拉)
  "里斯本": "sporting-lisbon",  // short form (already 葡萄牙体育/里斯本竞技)
  "新月": "al-hilal",           // short form (al-Hilal — only after longer 利雅得新月 fails)
  "达伽马": "vasco",            // Vasco da Gama
  "达咖马": "vasco",            // typo variant
  "弗鲁米": "fluminense",       // short form of 弗鲁米嫩塞
  "格雷米": "gremio",           // short form of 格雷米奥
  "费内巴": "fenerbahce",       // short form of 费内巴切
  "克鲁塞": "cruzeiro",         // short form of 克鲁塞罗
  "AC": "ac-milan",             // standalone AC (always AC Milan in this catalog)
  "Ac": "ac-milan",
  "ac": "ac-milan",
  "帕梅拉斯": "palmeiras",      // typo of 帕尔梅拉斯
  "百万富翁": "millonarios",
  "博塔佛戈": "botafogo",       // typo of 博塔弗戈
  "埃佛顿": "everton",          // typo of 埃弗顿
  "里资本": "sporting-lisbon",  // typo of 里斯本
  "费耶诺得": "feyenoord",      // typo of 费耶诺德
  "佛鲁米嫩塞": "fluminense",   // typo of 弗鲁米嫩塞
  "天主教": "universidad-catolica",
  "帕尔拉斯": "palmeiras",      // typo of 帕尔梅拉斯
};

// AMBIGUOUS tokens — explicitly never auto-resolve. These must appear ONLY
// as suffixes of longer keys above (which would match first). If we ever
// see them standalone in CN, we abort with "ambiguous".
const AMBIGUOUS_TOKENS = new Set([
  "利雅得", // 利雅得新月 vs 利雅得胜利
  "皇家",   // 皇家马德里 vs 皇家社会
  "马德里", // 马德里竞技 vs 皇家马德里
]);

// Sort entries longest-first
const CN_ENTRIES = Object.entries(CN_TO_SLUG).sort(
  (a, b) => b[0].length - a[0].length,
);

function deriveSlugFromCn(rawCn) {
  if (!rawCn) return { slug: null, reason: "no-cn" };
  const cn = String(rawCn);
  for (const [chinese, slug] of CN_ENTRIES) {
    if (cn.includes(chinese)) return { slug, matched: chinese };
  }
  // Check if any ambiguous token is present — explicit skip
  for (const tok of AMBIGUOUS_TOKENS) {
    if (cn.includes(tok)) return { slug: null, reason: "ambiguous" };
  }
  return { slug: null, reason: "no-match" };
}

// ─── Build canonical Hebrew team-name map from EXISTING products ─────────
// For each teamSlug, pick the most common `team` value among products that
// currently have that teamSlug. This is the "ground truth" Hebrew label.
const teamNameCounts = {}; // slug → { name → count }
for (const p of products) {
  if (!p.teamSlug || !p.team) continue;
  if (!teamNameCounts[p.teamSlug]) teamNameCounts[p.teamSlug] = {};
  teamNameCounts[p.teamSlug][p.team] =
    (teamNameCounts[p.teamSlug][p.team] || 0) + 1;
}
const TEAM_HE = {};
for (const slug of Object.keys(teamNameCounts)) {
  const counts = teamNameCounts[slug];
  let best = null;
  let bestCount = -1;
  for (const [name, c] of Object.entries(counts)) {
    if (c > bestCount) {
      best = name;
      bestCount = c;
    }
  }
  if (best) TEAM_HE[slug] = best;
}

// Manual canonical overrides (use the "nicer" Hebrew form, especially for
// slugs that didn't have many existing products or where current data has
// multiple acceptable spellings — pick the geresh ׳ form).
const MANUAL_OVERRIDES = {
  "manchester-city": "מנצ׳סטר סיטי",
  "manchester-united": "מנצ׳סטר יונייטד",
  "chelsea": "צ׳לסי",
  "tottenham": "טוטנהאם",
  "psg": "פריז",
  "ac-milan": "מילאן",
  "inter-milan": "אינטר",
  "real-madrid": "ריאל מדריד",
  "barcelona": "ברצלונה",
  "bayern-munich": "באיירן מינכן",
  "borussia-dortmund": "דורטמונד",
  "rb-leipzig": "לייפציג",
  "bayer-leverkusen": "באייר לברקוזן",
  "palmeiras": "פלמייראס",
  "algeria": "אלג׳יריה",
  "ajax": "אייאקס",
  "japan": "יפן",
  "argentina": "ארגנטינה",
  "brazil": "ברזיל",
  "france": "צרפת",
  "portugal": "פורטוגל",
  "spain": "ספרד",
  "germany": "גרמניה",
  "england": "אנגליה",
  "italy": "איטליה",
  "morocco": "מרוקו",
};
for (const [slug, he] of Object.entries(MANUAL_OVERRIDES)) {
  TEAM_HE[slug] = he;
}

// ─── Category map (per slug) ─────────────────────────────────────────────
// Derived similarly from existing products
const teamCategoryCounts = {};
for (const p of products) {
  if (!p.teamSlug || !p.category) continue;
  if (!teamCategoryCounts[p.teamSlug]) teamCategoryCounts[p.teamSlug] = {};
  teamCategoryCounts[p.teamSlug][p.category] =
    (teamCategoryCounts[p.teamSlug][p.category] || 0) + 1;
}
const TEAM_CATEGORY = {};
for (const slug of Object.keys(teamCategoryCounts)) {
  let best = null;
  let bestCount = -1;
  for (const [cat, c] of Object.entries(teamCategoryCounts[slug])) {
    if (c > bestCount) {
      best = cat;
      bestCount = c;
    }
  }
  TEAM_CATEGORY[slug] = best;
}

// ─── league per teamSlug — start from patches-config.teamLeague, fall back
//     to the most common league among existing products.
const TEAM_LEAGUE_FINAL = {};
const teamLeagueCounts = {};
for (const p of products) {
  if (!p.teamSlug || !p.league) continue;
  if (!teamLeagueCounts[p.teamSlug]) teamLeagueCounts[p.teamSlug] = {};
  teamLeagueCounts[p.teamSlug][p.league] =
    (teamLeagueCounts[p.teamSlug][p.league] || 0) + 1;
}
for (const slug of new Set([
  ...Object.keys(teamLeagueCounts),
  ...Object.keys(TEAM_LEAGUE),
])) {
  if (TEAM_LEAGUE[slug]) {
    TEAM_LEAGUE_FINAL[slug] = TEAM_LEAGUE[slug];
    continue;
  }
  // Fall back to most-common existing league for that slug
  const counts = teamLeagueCounts[slug] || {};
  let best = null;
  let bestCount = -1;
  for (const [l, c] of Object.entries(counts)) {
    if (c > bestCount) {
      best = l;
      bestCount = c;
    }
  }
  if (best) TEAM_LEAGUE_FINAL[slug] = best;
}

// ─── Type → Hebrew suffix (per user's spec) ──────────────────────────────
const TYPE_HE = {
  home: "בית",
  away: "חוץ",
  third: "חוץ שלישי",
  goalkeeper: "שוער",
  special: "מהדורה מיוחדת",
  retro: "רטרו",
};

// Normalize season for display: "2025-26" → "2025/26", keep "2024", etc.
function displaySeason(season) {
  if (!season) return "";
  const s = String(season).trim();
  const m = s.match(/^(\d{4})-(\d{2})$/);
  if (m) return `${m[1]}/${m[2]}`;
  return s;
}

function buildNameHe(p, teamHe) {
  const parts = [];
  if (p.isRetro || p.type === "retro") parts.push("רטרו");
  parts.push(teamHe);
  const typeWord = TYPE_HE[p.type];
  if (typeWord && p.type !== "retro") parts.push(typeWord);
  const seas = displaySeason(p.season);
  if (seas) parts.push(seas);
  if (p.isLongSleeve) parts.push("שרוול ארוך");
  // Kids set vs plain kids: convention in existing catalog uses "- סט ילדים"
  // when isShortSuit is also true, just "ילדים" otherwise.
  if (p.isKids) {
    if (p.isShortSuit) parts.push("- סט ילדים");
    else parts.push("ילדים");
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

// Does current nameHe contain the canonical team name (or a known alias)?
const TEAM_ALIASES_HE = {
  "manchester-city": ["מנצ׳סטר סיטי", "מנצ'סטר סיטי", "מנצסטר סיטי"],
  "manchester-united": [
    "מנצ׳סטר יונייטד",
    "מנצ'סטר יונייטד",
    "מנצסטר יונייטד",
    "מנצ'סטר יוניטד",
    "מנצסטר יוניטד",
  ],
  "chelsea": ["צ׳לסי", "צ'לסי", "צלסי"],
  "tottenham": ["טוטנהאם", "טוטהנאם", "טוטנהם"],
  "psg": ["פריז", "PSG", "פסז", "פריז סן ז'רמן", "פריז סן ז׳רמן"],
  "ac-milan": ["מילאן", "מילן", "AC מילאן"],
  "inter-milan": ["אינטר"],
  "real-madrid": ["ריאל מדריד", "ריאל"],
  "barcelona": ["ברצלונה", "ברסה"],
  "atletico-madrid": ["אתלטיקו מדריד", "אטלטיקו מדריד", "אתלטיקו", "אטלטיקו"],
  "bayern-munich": ["באיירן", "באירן", "ביירן", "באייר מינכן"],
  "borussia-dortmund": ["דורטמונד"],
  "rb-leipzig": ["לייפציג", "רדבול לייפציג"],
  "bayer-leverkusen": ["באייר לברקוזן", "לברקוזן", "לברקיזן"],
  "palmeiras": ["פלמייראס", "פלמיירס", "פאלמייראס"],
  "algeria": ["אלג׳יריה", "אלג'יריה"],
  "ajax": ["אייאקס", "אייקס"],
  "japan": ["יפן"],
  "argentina": ["ארגנטינה"],
  "brazil": ["ברזיל"],
  "france": ["צרפת"],
  "portugal": ["פורטוגל"],
  "spain": ["ספרד"],
  "germany": ["גרמניה"],
  "england": ["אנגליה"],
  "italy": ["איטליה"],
  "netherlands": ["הולנד"],
  "belgium": ["בלגיה"],
  "morocco": ["מרוקו"],
  "usa": ["ארה״ב", "ארהב", "ארצות הברית"],
  "mexico": ["מקסיקו"],
  "colombia": ["קולומביה"],
  "croatia": ["קרואטיה"],
  "south-korea": ["דרום קוריאה", "דרום-קוריאה"],
  "saudi-arabia": ["ערב הסעודית", "סעודיה"],
  "fiorentina": ["פיורנטינה"],
  "roma": ["רומא"],
  "napoli": ["נאפולי"],
  "juventus": ["יובנטוס"],
  "lazio": ["לאציו"],
  "atalanta": ["אטלנטה", "אטאלנטה"],
  "boca-juniors": ["בוקה גוניורס", "בוקה ג׳וניורס", "בוקה ג'וניורס", "בוקה"],
  "boca": ["בוקה"],
  "river-plate": ["ריבר פלייט", "ריבר", "רייבר פלייט"],
  "inter-miami": ["אינטר מיאמי"],
  "venezia": ["ונציה", "וונציה"],
  "como": ["קומו"],
  "parma": ["פרמה", "פארמה", "פארמטה"],
  "real-betis": ["בטיס"],
  "athletic-bilbao": ["בילבאו", "אתלטיק בילבאו"],
  "sevilla": ["סביליה"],
  "valencia": ["ולנסיה"],
  "villarreal": ["ויאריאל", "ויירל", "וויריאל"],
  "girona": ["ז׳ירונה", "ז'ירונה"],
  "osasuna": ["אוסאסונה"],
  "espanyol": ["אספניול"],
  "celta-vigo": ["סלטה ויגו"],
  "mallorca": ["מיורקה"],
  "alaves": ["אלאבס"],
  "marseille": ["מארסיי", "מרסיי"],
  "lyon": ["ליון"],
  "monaco": ["מונקו"],
  "lille": ["ליל"],
  "nice": ["ניס"],
  "newcastle": ["ניוקאסל", "ניו קאסל"],
  "aston-villa": ["אסטון וילה"],
  "west-ham": ["ווסטהאם", "ווסט האם", "ווסטהם"],
  "wolves": ["וולבס", "וולברהמפטון"],
  "everton": ["אברטון"],
  "brighton": ["ברייטון"],
  "leeds": ["לידס"],
  "fulham": ["פולהאם"],
  "leicester-city": ["לסטר"],
  "bournemouth": ["בורנמות׳", "בורנמות'"],
  "crystal-palace": ["קריסטל פאלאס"],
  "nottingham-forest": ["נוטינגהאם פורסט", "נוטינגהם"],
  "feyenoord": ["פיינורד"],
  "psv": ["פסוו"],
  "az-alkmaar": ["אלקמר"],
  "benfica": ["בנפיקה"],
  "porto": ["פורטו"],
  "sporting-lisbon": ["ספורטינג", "ספורטינג ליסבון"],
  "braga": ["בראגה", "בארגה"],
  "celtic": ["סלטיק"],
  "rangers": ["רנג׳רס", "רנג'רס", "ריינג׳רס", "ריינג'רס"],
  "fenerbahce": ["פנרבחצה"],
  "galatasaray": ["גלטסראיי"],
  "red-bull-salzburg": ["זלצבורג", "רד בול זלצבורג"],
  "flamengo": ["פלמנגו"],
  "santos": ["סנטוס"],
  "corinthians": ["קורינתיאנס"],
  "sao-paulo": ["סאו פאולו"],
  "gremio": ["גרמיו"],
  "fluminense": ["פלומיננסה"],
  "al-ahly": ["אל אהלי", "אל-אהלי"],
  "al-nassr": ["אל נאסר", "אל-נאסר"],
  "al-hilal": ["אל הילאל", "אל-הילאל", "אל היללי"],
  "al-ittihad": ["אל איתיחאד"],
  "tigres": ["טיגרס"],
  "monterrey": ["מונטריי"],
  "chivas": ["צ׳יוואס", "צ'יוואס"],
  "club-america": ["אמריקה"],
  "vfb-stuttgart": ["שטוטגרט"],
  "eintracht-frankfurt": ["פרנקפורט"],
  "wolfsburg": ["וולפסבורג"],
  "werder-bremen": ["ברמן", "ורדר ברמן"],
  "st-pauli": ["סנט פאולי", "פאולי"],
};

// Build a quick lookup map of slug → array of strings to test
function nameContainsCanonicalTeam(nameHe, slug) {
  if (!nameHe) return false;
  const candidates = [];
  if (TEAM_HE[slug]) candidates.push(TEAM_HE[slug]);
  const aliases = TEAM_ALIASES_HE[slug] || [];
  candidates.push(...aliases);
  for (const c of candidates) {
    if (c && nameHe.includes(c)) return true;
  }
  return false;
}

// ─── Process products ────────────────────────────────────────────────────
const stats = {
  total: products.length,
  withCn: 0,
  skipNoCn: 0,
  skipAmbiguous: 0,
  skipNoMatch: 0,
  skipNoCanonical: 0,
  teamSlugFixed: 0,
  nameHeFixed: 0,
  alreadyOk: 0,
};
const teamSlugDiffs = {}; // "oldSlug → newSlug" → count
const nameHeFixSamples = [];
const teamSlugFixSamples = [];
const skipSamples = {
  ambiguous: [],
  noMatch: [],
  noCanonical: [],
};

for (const p of products) {
  if (!p.sourceHandleCn) {
    stats.skipNoCn++;
    continue;
  }
  stats.withCn++;

  const { slug: expectedSlug, reason } = deriveSlugFromCn(p.sourceHandleCn);
  if (!expectedSlug) {
    if (reason === "ambiguous") {
      stats.skipAmbiguous++;
      if (skipSamples.ambiguous.length < 15)
        skipSamples.ambiguous.push({
          id: p.id,
          cn: p.sourceHandleCn,
          teamSlug: p.teamSlug,
        });
    } else {
      stats.skipNoMatch++;
      if (skipSamples.noMatch.length < 25)
        skipSamples.noMatch.push({
          id: p.id,
          cn: p.sourceHandleCn,
          teamSlug: p.teamSlug,
        });
    }
    continue;
  }

  // Canonical Hebrew team name for the EXPECTED slug
  const canonicalHe = TEAM_HE[expectedSlug];
  if (!canonicalHe) {
    stats.skipNoCanonical++;
    if (skipSamples.noCanonical.length < 15)
      skipSamples.noCanonical.push({
        id: p.id,
        cn: p.sourceHandleCn,
        expectedSlug,
      });
    continue;
  }

  // ── 1. Fix teamSlug if wrong
  let slugWasFixed = false;
  if (p.teamSlug !== expectedSlug) {
    const key = `${p.teamSlug || "NONE"} → ${expectedSlug}`;
    teamSlugDiffs[key] = (teamSlugDiffs[key] || 0) + 1;
    if (teamSlugFixSamples.length < 20) {
      teamSlugFixSamples.push({
        id: p.id,
        slug: p.slug,
        cn: p.sourceHandleCn,
        before: p.teamSlug,
        after: expectedSlug,
        nameHe: p.nameHe,
      });
    }
    if (APPLY) {
      p.teamSlug = expectedSlug;
      p.team = canonicalHe;
      if (TEAM_LEAGUE_FINAL[expectedSlug])
        p.league = TEAM_LEAGUE_FINAL[expectedSlug];
      if (TEAM_CATEGORY[expectedSlug]) p.category = TEAM_CATEGORY[expectedSlug];
    }
    slugWasFixed = true;
    stats.teamSlugFixed++;
  }

  // ── 2. Independently — rebuild nameHe if it doesn't contain the
  // canonical Hebrew team name for the (now-corrected) slug.
  const okName = nameContainsCanonicalTeam(p.nameHe, expectedSlug);
  if (!okName) {
    const newName = buildNameHe(p, canonicalHe);
    nameHeFixSamples.push({
      id: p.id,
      slug: p.slug,
      cn: p.sourceHandleCn,
      teamSlug: expectedSlug,
      before: p.nameHe,
      after: newName,
    });
    if (APPLY) {
      p.nameHe = newName;
      // Also normalize p.team to the canonical form so the display matches
      p.team = canonicalHe;
    }
    stats.nameHeFixed++;
  } else if (!slugWasFixed) {
    stats.alreadyOk++;
  }
}

// ─── Report ──────────────────────────────────────────────────────────────
console.log("=== CN-based wave-2 fix ===");
console.log(`Total products            : ${stats.total}`);
console.log(`  with sourceHandleCn     : ${stats.withCn}`);
console.log(`  skip (no CN)            : ${stats.skipNoCn}`);
console.log(`  skip (ambiguous)        : ${stats.skipAmbiguous}`);
console.log(`  skip (no CN match)      : ${stats.skipNoMatch}`);
console.log(`  skip (no canonical He)  : ${stats.skipNoCanonical}`);
console.log("");
console.log(`teamSlug fixes            : ${stats.teamSlugFixed}`);
console.log(`nameHe regenerations      : ${stats.nameHeFixed}`);
console.log(`already OK (both)         : ${stats.alreadyOk}`);

console.log("\n── Top teamSlug fixes (currentSlug → correctedSlug) ──");
const top = Object.entries(teamSlugDiffs)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12);
for (const [k, c] of top) console.log(`  ${c.toString().padStart(4)}  ${k}`);

console.log("\n── Sample teamSlug fixes (first 10) ──");
for (const s of teamSlugFixSamples.slice(0, 10)) {
  console.log(`  · id=${s.id} cn=${s.cn}`);
  console.log(`      ${s.before}  →  ${s.after}`);
  console.log(`      nameHe: ${s.nameHe}`);
}

console.log("\n── Sample nameHe regenerations (first 15) ──");
for (const s of nameHeFixSamples.slice(0, 15)) {
  console.log(`  · id=${s.id} slug=${s.slug} cn=${s.cn}`);
  console.log(`      BEFORE: ${s.before}`);
  console.log(`      AFTER : ${s.after}`);
}

console.log("\n── Skipped (ambiguous, first 10) ──");
for (const s of skipSamples.ambiguous.slice(0, 10))
  console.log(`  · id=${s.id} cn=${s.cn} teamSlug=${s.teamSlug}`);

console.log("\n── Skipped (no CN match, first 15) ──");
for (const s of skipSamples.noMatch.slice(0, 15))
  console.log(`  · id=${s.id} cn=${s.cn} teamSlug=${s.teamSlug}`);

if (skipSamples.noCanonical.length > 0) {
  console.log("\n── Skipped (no canonical He, first 10) ──");
  for (const s of skipSamples.noCanonical.slice(0, 10))
    console.log(
      `  · id=${s.id} cn=${s.cn} expectedSlug=${s.expectedSlug}`,
    );
}

// ── Verify the 4 user-provided spot-check examples are handled ─────────
const USER_SAMPLES = [
  "japan-third-2526-it-882",
  "japan-home-2526-kids-ls-it-981",
  "japan-away-2024-25--1-245",
  "japan-special-2024--3-824",
];
console.log("\n── User spot-check samples ──");
for (const slug of USER_SAMPLES) {
  const fix = nameHeFixSamples.find((s) => s.slug === slug);
  if (fix) {
    console.log(
      `  ✓ ${slug}\n      cn=${fix.cn}\n      ${fix.before}\n      →  ${fix.after}`,
    );
  } else {
    const slugFix = teamSlugFixSamples.find((s) => s.slug === slug);
    if (slugFix) {
      console.log(
        `  ✓ (teamSlug-only) ${slug}\n      ${slugFix.before} → ${slugFix.after}`,
      );
    } else {
      console.log(`  ✗ ${slug} — NOT in any fix list`);
    }
  }
}

// Always write JSON report so we can audit beyond the truncated console.
writeFileSync(
  "docs/CN_WAVE2_FIX_REPORT.json",
  JSON.stringify(
    {
      stats,
      teamSlugDiffs,
      teamSlugFixSamples,
      nameHeFixSamples,
      skipSamples,
    },
    null,
    2,
  ),
);
console.log(`\nFull report → docs/CN_WAVE2_FIX_REPORT.json`);

if (APPLY) {
  if (products.length !== startCount) {
    console.error(
      `\n!! REFUSING TO WRITE: product count changed (${startCount} → ${products.length})`,
    );
    process.exit(2);
  }
  writeFileSync(FILE, JSON.stringify(products, null, 2));
  console.log(`\n✅ Wrote ${products.length} products back to ${FILE}`);
} else {
  console.log("\n(dry-run — re-run with --apply to write changes)");
}
