#!/usr/bin/env node
/**
 * Audit ALL products with `sourceHandleCn` for inconsistencies between
 * the Chinese source text and the assigned teamSlug.
 *
 * Strategy:
 *   1. Build a Chinese-token -> slug dictionary (longest-first matching).
 *   2. For each product, find the LONGEST matching Chinese token.
 *   3. If the matched slug != product.teamSlug -> potential mislabel.
 *   4. Only emit HIGH or MEDIUM confidence cases. Skip ambiguous ones.
 *
 * Output: data/catalog-mislabels.json (array of mismatches)
 *
 * Does NOT modify sporthub-products.json.
 */

import fs from "node:fs";

const PRODUCTS_FILE = "data/sporthub-products.json";
const OUT_FILE = "data/catalog-mislabels.json";

const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));

/* ───────────────────────────────────────────────────────────────────────
 * Chinese-token dictionary.
 *
 * Order DOES NOT MATTER here — we sort by length descending before matching
 * so the LONGEST token wins (e.g. 威尼斯 beats 尼斯; 巴黎圣日耳曼 beats 巴黎;
 * 阿根廷 vs 阿森纳 — both have 阿 but full names don't collide).
 *
 * Each entry: cn (Chinese form) -> { slug, league, he }
 *
 * League options must match the catalog: premier-league / la-liga / serie-a
 * / bundesliga / ligue-1 / portugal / eredivisie / mls / liga-mx / saudi-pl
 * / brazil / argentina / scotland / turkey / other / national. The audit
 * mostly compares slugs, so league is informational.
 * ─────────────────────────────────────────────────────────────────────── */
const CN_DICT = {
  // ── Spanish La Liga ───────────────────────────────────────────────────
  "皇马":               { slug: "real-madrid",         league: "la-liga",         he: "ריאל מדריד" },
  "皇家马德里":         { slug: "real-madrid",         league: "la-liga",         he: "ריאל מדריד" },
  "皇家社会":           { slug: "real-sociedad",       league: "la-liga",         he: "ריאל סוסיאדד" },
  "巴塞":               { slug: "barcelona",           league: "la-liga",         he: "ברצלונה" },
  "巴萨":               { slug: "barcelona",           league: "la-liga",         he: "ברצלונה" },
  "巴塞罗那":           { slug: "barcelona",           league: "la-liga",         he: "ברצלונה" },
  "巴赛":               { slug: "barcelona",           league: "la-liga",         he: "ברצלונה" }, // common typo variant
  "马竞":               { slug: "atletico-madrid",     league: "la-liga",         he: "אתלטיקו מדריד" },
  "马德里竞技":         { slug: "atletico-madrid",     league: "la-liga",         he: "אתלטיקו מדריד" },
  "塞维利亚":           { slug: "sevilla",             league: "la-liga",         he: "סביליה" },
  "瓦伦西亚":           { slug: "valencia",            league: "la-liga",         he: "ולנסיה" },
  "贝蒂斯":             { slug: "real-betis",          league: "la-liga",         he: "ריאל בטיס" },
  "毕尔巴鄂":           { slug: "athletic-bilbao",     league: "la-liga",         he: "אתלטיק בילבאו" },
  "毕尔巴鄂竞技":       { slug: "athletic-bilbao",     league: "la-liga",         he: "אתלטיק בילבאו" },
  "比利亚雷亚尔":       { slug: "villarreal",          league: "la-liga",         he: "ויאריאל" },
  "马拉加":             { slug: "malaga",              league: "la-liga",         he: "מלגה" },
  "莱万特":             { slug: "levante",             league: "la-liga",         he: "לבנטה" },
  "塞尔塔":             { slug: "celta-vigo",          league: "la-liga",         he: "סלטה ויגו" },
  "塞尔塔维戈":         { slug: "celta-vigo",          league: "la-liga",         he: "סלטה ויגו" },
  "赫罗纳":             { slug: "girona",              league: "la-liga",         he: "חירונה" },
  "格拉纳达":           { slug: "granada",             league: "la-liga",         he: "גרנדה" },
  "马洛卡":             { slug: "mallorca",            league: "la-liga",         he: "מיורקה" },
  "马略卡":             { slug: "mallorca",            league: "la-liga",         he: "מיורקה" },
  "奥萨苏纳":           { slug: "osasuna",             league: "la-liga",         he: "אוסאסונה" },
  "西班牙人":           { slug: "espanyol",            league: "la-liga",         he: "אספניול" },
  "赫塔费":             { slug: "getafe",              league: "la-liga",         he: "חטאפה" },
  "阿拉维斯":           { slug: "alaves",              league: "la-liga",         he: "אלאבס" },
  "巴拉多利德":         { slug: "real-valladolid",     league: "la-liga",         he: "בייאדוליד" },
  "卡迪斯":             { slug: "cadiz",               league: "la-liga",         he: "קאדיז" },

  // ── Italian Serie A ───────────────────────────────────────────────────
  "国米":               { slug: "inter-milan",         league: "serie-a",         he: "אינטר מילאן" },
  "国际米兰":           { slug: "inter-milan",         league: "serie-a",         he: "אינטר מילאן" },
  "AC米兰":             { slug: "ac-milan",            league: "serie-a",         he: "מילאן" },
  "ac米兰":             { slug: "ac-milan",            league: "serie-a",         he: "מילאן" },
  "尤文":               { slug: "juventus",            league: "serie-a",         he: "יובנטוס" },
  "尤文图斯":           { slug: "juventus",            league: "serie-a",         he: "יובנטוס" },
  "那不勒斯":           { slug: "napoli",              league: "serie-a",         he: "נאפולי" },
  "罗马":               { slug: "roma",                league: "serie-a",         he: "רומא" },
  "拉齐奥":             { slug: "lazio",               league: "serie-a",         he: "לאציו" },
  "佛罗伦萨":           { slug: "fiorentina",          league: "serie-a",         he: "פיורנטינה" },
  "费奥伦蒂纳":         { slug: "fiorentina",          league: "serie-a",         he: "פיורנטינה" },
  "亚特兰大":           { slug: "atalanta",            league: "serie-a",         he: "אטאלנטה" },
  "都灵":               { slug: "torino",              league: "serie-a",         he: "טורינו" },
  "帕尔马":             { slug: "parma",               league: "serie-a",         he: "פארמה" },
  "莱切":               { slug: "lecce",               league: "serie-a",         he: "לצ'ה" },
  "科莫":               { slug: "como",                league: "serie-a",         he: "קומו" },
  "威尼斯":             { slug: "venezia",             league: "serie-b",         he: "ונציה" },
  "巴勒莫":             { slug: "palermo",             league: "serie-b",         he: "פלרמו" },

  // ── English Premier League ────────────────────────────────────────────
  "曼联":               { slug: "manchester-united",   league: "premier-league",  he: "מנצ'סטר יונייטד" },
  "曼彻斯特联":         { slug: "manchester-united",   league: "premier-league",  he: "מנצ'סטר יונייטד" },
  "曼城":               { slug: "manchester-city",     league: "premier-league",  he: "מנצ'סטר סיטי" },
  "曼彻斯特城":         { slug: "manchester-city",     league: "premier-league",  he: "מנצ'סטר סיטי" },
  "利物浦":             { slug: "liverpool",           league: "premier-league",  he: "ליברפול" },
  "阿森纳":             { slug: "arsenal",             league: "premier-league",  he: "ארסנל" },
  "阿深纳":             { slug: "arsenal",             league: "premier-league",  he: "ארסנל" }, // typo seen in supplier titles
  "切尔西":             { slug: "chelsea",             league: "premier-league",  he: "צ'לסי" },
  "热刺":               { slug: "tottenham",           league: "premier-league",  he: "טוטנהאם" },
  "托特纳姆":           { slug: "tottenham",           league: "premier-league",  he: "טוטנהאם" },
  "纽卡":               { slug: "newcastle",           league: "premier-league",  he: "ניוקאסל" },
  "纽卡斯":             { slug: "newcastle",           league: "premier-league",  he: "ניוקאסל" },
  "纽卡斯尔":           { slug: "newcastle",           league: "premier-league",  he: "ניוקאסל" },
  "阿斯顿维拉":         { slug: "aston-villa",         league: "premier-league",  he: "אסטון וילה" },
  "维拉":               { slug: "aston-villa",         league: "premier-league",  he: "אסטון וילה" },
  "狼队":               { slug: "wolves",              league: "premier-league",  he: "וולבס" },
  "西汉姆":             { slug: "west-ham",            league: "premier-league",  he: "ווסטהאם" },
  "西汉姆联":           { slug: "west-ham",            league: "premier-league",  he: "ווסטהאם" },
  "埃弗顿":             { slug: "everton",             league: "premier-league",  he: "אברטון" },
  "莱斯特":             { slug: "leicester-city",      league: "premier-league",  he: "לסטר" },
  "莱斯特城":           { slug: "leicester-city",      league: "premier-league",  he: "לסטר" },
  "布莱顿":             { slug: "brighton",            league: "premier-league",  he: "ברייטון" },
  "富勒姆":             { slug: "fulham",              league: "premier-league",  he: "פולהאם" },
  "水晶宫":             { slug: "crystal-palace",      league: "premier-league",  he: "קריסטל פאלאס" },
  "诺丁汉森林":         { slug: "nottingham-forest",   league: "premier-league",  he: "נוטינגהאם פורסט" },
  "诺丁汉":             { slug: "nottingham-forest",   league: "premier-league",  he: "נוטינגהאם" },
  "伯恩茅斯":           { slug: "bournemouth",         league: "premier-league",  he: "בורנמות'" },
  "布伦特福德":         { slug: "brentford",           league: "premier-league",  he: "ברנטפורד" },
  "伯恩利":             { slug: "burnley",             league: "premier-league",  he: "ברנלי" },
  "利兹联":             { slug: "leeds",               league: "premier-league",  he: "לידס" },
  "利兹":               { slug: "leeds",               league: "premier-league",  he: "לידס" },
  "桑德兰":             { slug: "sunderland",          league: "premier-league",  he: "סנדרלנד" },
  "谢菲尔德联":         { slug: "sheffield-united",    league: "premier-league",  he: "שפילד יונייטד" },
  "考文垂":             { slug: "coventry",            league: "premier-league",  he: "קובנטרי" },
  "德比郡":             { slug: "derby-county",        league: "premier-league",  he: "דרבי" },
  "雷克斯汉姆":         { slug: "wrexham",             league: "other",           he: "רקסהאם" },

  // ── German Bundesliga ─────────────────────────────────────────────────
  "拜仁":               { slug: "bayern-munich",       league: "bundesliga",      he: "באיירן מינכן" },
  "拜仁慕尼黑":         { slug: "bayern-munich",       league: "bundesliga",      he: "באיירן מינכן" },
  "多特蒙德":           { slug: "borussia-dortmund",   league: "bundesliga",      he: "דורטמונד" },
  "多特":               { slug: "borussia-dortmund",   league: "bundesliga",      he: "דורטמונד" },
  "勒沃库森":           { slug: "bayer-leverkusen",    league: "bundesliga",      he: "באייר לברקוזן" },
  "莱比锡":             { slug: "rb-leipzig",          league: "bundesliga",      he: "לייפציג" },
  "RB莱比锡":           { slug: "rb-leipzig",          league: "bundesliga",      he: "לייפציג" },
  "法兰克福":           { slug: "eintracht-frankfurt", league: "bundesliga",      he: "פרנקפורט" },
  "美因茨":             { slug: "mainz",               league: "bundesliga",      he: "מיינץ" },
  "霍芬海姆":           { slug: "hoffenheim",          league: "bundesliga",      he: "הופנהיים" },
  "沃尔夫斯堡":         { slug: "wolfsburg",           league: "bundesliga",      he: "וולפסבורג" },
  "柏林联合":           { slug: "union-berlin",        league: "bundesliga",      he: "אוניון ברלין" },
  "门兴格拉德巴赫":     { slug: "borussia-monchengladbach", league: "bundesliga", he: "מנשנגלדבך" },
  "门兴":               { slug: "borussia-monchengladbach", league: "bundesliga", he: "מנשנגלדבך" },
  "斯图加特":           { slug: "vfb-stuttgart",       league: "bundesliga",      he: "שטוטגרט" },
  "云达不莱梅":         { slug: "werder-bremen",       league: "bundesliga",      he: "ורדר ברמן" },
  "圣保利":             { slug: "st-pauli",            league: "bundesliga",      he: "סנט פאולי" },

  // ── French Ligue 1 ────────────────────────────────────────────────────
  "巴黎圣日耳曼":       { slug: "psg",                 league: "ligue-1",         he: "PSG" },
  "巴黎":               { slug: "psg",                 league: "ligue-1",         he: "PSG" },
  "大巴黎":             { slug: "psg",                 league: "ligue-1",         he: "PSG" },
  "马赛":               { slug: "marseille",           league: "ligue-1",         he: "מרסיי" },
  "里昂":               { slug: "lyon",                league: "ligue-1",         he: "ליון" },
  "里尔":               { slug: "lille",               league: "ligue-1",         he: "ליל" },
  "雷恩":               { slug: "rennes",              league: "ligue-1",         he: "רן" },
  "摩纳哥":             { slug: "monaco",              league: "ligue-1",         he: "מונאקו" },
  "尼斯":               { slug: "nice",                league: "ligue-1",         he: "ניס" },

  // ── Portugal ──────────────────────────────────────────────────────────
  "本菲卡":             { slug: "benfica",             league: "portugal",        he: "בנפיקה" },
  "波尔图":             { slug: "porto",               league: "portugal",        he: "פורטו" },
  "葡萄牙体育":         { slug: "sporting-lisbon",     league: "portugal",        he: "ספורטינג ליסבון" },
  "里斯本竞技":         { slug: "sporting-lisbon",     league: "portugal",        he: "ספורטינג ליסבון" },
  "里斯本":             { slug: "sporting-lisbon",     league: "portugal",        he: "ספורטינג ליסבון" },
  "布拉加":             { slug: "braga",               league: "portugal",        he: "בראגה" },

  // ── Netherlands ───────────────────────────────────────────────────────
  "阿贾克斯":           { slug: "ajax",                league: "eredivisie",      he: "אייאקס" },
  "费耶诺德":           { slug: "feyenoord",           league: "eredivisie",      he: "פיינורד" },
  "埃因霍温":           { slug: "psv",                 league: "eredivisie",      he: "פ.ס.וו איינדהובן" },
  "PSV埃因霍温":        { slug: "psv",                 league: "eredivisie",      he: "פ.ס.וו איינדהובן" },
  "阿尔克马尔":         { slug: "az-alkmaar",          league: "eredivisie",      he: "אז אלקמאר" },

  // ── Scotland / Greece / Turkey / Ukraine ──────────────────────────────
  "凯尔特人":           { slug: "celtic",              league: "scotland",        he: "סלטיק" },
  "格拉斯哥流浪者":     { slug: "rangers",             league: "scotland",        he: "ריינג'רס" },
  "流浪者":             { slug: "rangers",             league: "scotland",        he: "ריינג'רס" },
  "阿伯丁":             { slug: "aberdeen",            league: "scotland",        he: "אברדין" },
  "奥林匹亚科斯":       { slug: "olympiacos",          league: "other",           he: "אולימפיאקוס" },
  "AEK雅典":            { slug: "aek-athens",          league: "other",           he: "AEK אתונה" },
  "雅典AEK":            { slug: "aek-athens",          league: "other",           he: "AEK אתונה" },
  "加拉塔萨雷":         { slug: "galatasaray",         league: "turkey",          he: "גלאטסארי" },
  "费内巴切":           { slug: "fenerbahce",          league: "turkey",          he: "פנרבחצ'ה" },
  "贝西克塔斯":         { slug: "besiktas",            league: "turkey",          he: "בשיקטש" },
  "特拉布宗体育":       { slug: "trabzonspor",         league: "turkey",          he: "טרבזונספור" },
  "特拉布宗":           { slug: "trabzonspor",         league: "turkey",          he: "טרבזונספור" },
  "沙赫塔":             { slug: "shakhtar-donetsk",    league: "other",           he: "שחטאר דונייצק" },
  "顿涅茨克矿工":       { slug: "shakhtar-donetsk",    league: "other",           he: "שחטאר דונייצק" },

  // ── Austria ───────────────────────────────────────────────────────────
  "萨尔茨堡":           { slug: "red-bull-salzburg",   league: "other",           he: "ר.ב. זלצבורג" },
  "萨尔茨堡红牛":       { slug: "red-bull-salzburg",   league: "other",           he: "ר.ב. זלצבורג" },
  "萨尔斯堡":           { slug: "red-bull-salzburg",   league: "other",           he: "ר.ב. זלצבורג" },

  // ── Switzerland ───────────────────────────────────────────────────────
  "年轻人":             { slug: "young-boys",          league: "other",           he: "יאנג בויז" },

  // ── Saudi / Middle East ───────────────────────────────────────────────
  "利雅得胜利":         { slug: "al-nassr",            league: "saudi-pl",        he: "אל נאסר" },
  "利雅得新月":         { slug: "al-hilal",            league: "saudi-pl",        he: "אל הילאל" },
  "新月":               { slug: "al-hilal",            league: "saudi-pl",        he: "אל הילאל" },
  "胜利":               { slug: "al-nassr",            league: "saudi-pl",        he: "אל נאסר" }, // less specific
  "吉达联合":           { slug: "al-ittihad",          league: "saudi-pl",        he: "אל איתיחאד" },
  "吉达":               { slug: "al-ittihad",          league: "saudi-pl",        he: "אל איתיחאד" },
  "吉达国民":           { slug: "al-ahli",             league: "saudi-pl",        he: "אל אהלי (סעודיה)" }, // Saudi Al-Ahli; ambiguous, treat as low confidence
  "阿尔阿赫利":         { slug: "al-ahly",             league: "other",           he: "אל אהלי" },

  // ── Brazil ────────────────────────────────────────────────────────────
  "巴西":               { slug: "brazil",              league: "national",        he: "ברזיל" },
  "弗拉门戈":           { slug: "flamengo",            league: "brazil",          he: "פלמנגו" },
  "佛拉门戈":           { slug: "flamengo",            league: "brazil",          he: "פלמנגו" },
  "弗鲁米嫩塞":         { slug: "fluminense",          league: "brazil",          he: "פלומיננזה" },
  "弗洛米嫩塞":         { slug: "fluminense",          league: "brazil",          he: "פלומיננזה" },
  "桑托斯":             { slug: "santos",              league: "brazil",          he: "סנטוס" },
  "帕尔梅拉斯":         { slug: "palmeiras",           league: "brazil",          he: "פלמייראס" },
  "帕梅拉斯":           { slug: "palmeiras",           league: "brazil",          he: "פלמייראס" },
  "科林蒂安":           { slug: "corinthians",         league: "brazil",          he: "קורינתיאנס" },
  "圣保罗":             { slug: "sao-paulo",           league: "brazil",          he: "סאו פאולו" },
  "圣保罗FC":           { slug: "sao-paulo",           league: "brazil",          he: "סאו פאולו" },
  "博塔弗戈":           { slug: "botafogo",            league: "brazil",          he: "בוטאפוגו" },
  "瓦斯科":             { slug: "vasco",               league: "brazil",          he: "ואסקו" },
  "瓦斯科达伽马":       { slug: "vasco",               league: "brazil",          he: "ואסקו" },
  "达伽马":             { slug: "vasco",               league: "brazil",          he: "ואסקו" },
  "达咖马":             { slug: "vasco",               league: "brazil",          he: "ואסקו" },
  "格雷米奥":           { slug: "gremio",              league: "brazil",          he: "גרמיו" },
  "克鲁塞罗":           { slug: "cruzeiro",            league: "brazil",          he: "קרוזיירו" },
  "克鲁塞":             { slug: "cruzeiro",            league: "brazil",          he: "קרוזיירו" }, // truncated variant seen in supplier data
  "米内罗":             { slug: "atletico-mineiro",    league: "brazil",          he: "אטלטיקו מיניירו" },
  "米内罗竞技":         { slug: "atletico-mineiro",    league: "brazil",          he: "אטלטיקו מיניירו" },
  "米内罗体育":         { slug: "atletico-mineiro",    league: "brazil",          he: "אטלטיקו מיניירו" },
  "米纳斯":             { slug: "atletico-mineiro",    league: "brazil",          he: "אטלטיקו מיניירו" },

  // ── Argentina ─────────────────────────────────────────────────────────
  "阿根廷":             { slug: "argentina",           league: "national",        he: "ארגנטינה" },
  "博卡":               { slug: "boca-juniors",        league: "argentina",       he: "בוקה גוניורס" },
  "博卡青年":           { slug: "boca-juniors",        league: "argentina",       he: "בוקה גוניורס" },
  "河床":               { slug: "river-plate",         league: "argentina",       he: "ריבר פלייט" },

  // ── Mexico / MLS / South America ──────────────────────────────────────
  "美洲":               { slug: "club-america",        league: "liga-mx",         he: "קלוב אמריקה" },
  "美洲俱乐部":         { slug: "club-america",        league: "liga-mx",         he: "קלוב אמריקה" },
  "蓝十字":             { slug: "cruz-azul",           league: "liga-mx",         he: "קרוז אסול" },
  "克鲁兹蓝":           { slug: "cruz-azul",           league: "liga-mx",         he: "קרוז אסול" },
  "瓜达拉哈拉":         { slug: "chivas",              league: "liga-mx",         he: "צ'יבאס" },
  "芝华士":             { slug: "chivas",              league: "liga-mx",         he: "צ'יבאס" },
  "蒙特雷":             { slug: "monterrey",           league: "liga-mx",         he: "מונטריי" },
  "老虎":               { slug: "tigres",              league: "liga-mx",         he: "טיגרס" },
  "迈阿密国际":         { slug: "inter-miami",         league: "mls",             he: "אינטר מיאמי" },
  "迈阿密":             { slug: "inter-miami",         league: "mls",             he: "אינטר מיאמי" },
  "新英格兰":           { slug: "new-england-revolution", league: "mls",          he: "ניו אינגלנד" },
  "夏洛特":             { slug: "charlotte-fc",        league: "mls",             he: "שרלוט" },
  "华盛顿":             { slug: "dc-united",           league: "mls",             he: "די.סי. יונייטד" },
  "DC联":               { slug: "dc-united",           league: "mls",             he: "די.סי. יונייטד" },
  "国民竞技":           { slug: "atletico-nacional",   league: "other",           he: "אתלטיקו נסיונל" }, // Colombia
  "亿万富翁":           { slug: "millonarios",         league: "other",           he: "מילונאריוס" },
  "天主教":             { slug: "universidad-catolica",league: "other",           he: "אוניברסידד קתוליקה" },
  "天主教大学":         { slug: "universidad-catolica",league: "other",           he: "אוניברסידד קתוליקה" },
  "科洛科洛":           { slug: "colo-colo",           league: "other",           he: "קולו קולו" },

  // ── Africa ────────────────────────────────────────────────────────────
  "开罗国民":           { slug: "al-ahly",             league: "other",           he: "אל אהלי קהיר" },

  // ── National teams (only safe ones — many appear with -场/-客/童装 suffix) ─
  "葡萄牙":             { slug: "portugal",            league: "national",        he: "פורטוגל" },
  "西班牙":             { slug: "spain",               league: "national",        he: "ספרד" },
  "法国":               { slug: "france",              league: "national",        he: "צרפת" },
  "德国":               { slug: "germany",             league: "national",        he: "גרמניה" },
  "英格兰":             { slug: "england",             league: "national",        he: "אנגליה" },
  "意大利":             { slug: "italy",               league: "national",        he: "איטליה" },
  "荷兰":               { slug: "netherlands",         league: "national",        he: "הולנד" },
  "比利时":             { slug: "belgium",             league: "national",        he: "בלגיה" },
  "克罗地亚":           { slug: "croatia",             league: "national",        he: "קרואטיה" },
  "波兰":               { slug: "poland",              league: "national",        he: "פולין" },
  "丹麦":               { slug: "denmark",             league: "national",        he: "דנמרק" },
  "瑞典":               { slug: "sweden",              league: "national",        he: "שוודיה" },
  "挪威":               { slug: "norway",              league: "national",        he: "נורווגיה" },
  "瑞士":               { slug: "switzerland",         league: "national",        he: "שוויץ" },
  "苏格兰":             { slug: "scotland",            league: "national",        he: "סקוטלנד" },
  "威尔士":             { slug: "wales",               league: "national",        he: "וויילס" },
  "爱尔兰":             { slug: "ireland",             league: "national",        he: "אירלנד" },
  "北爱尔兰":           { slug: "northern-ireland",    league: "national",        he: "צפון אירלנד" },
  "捷克":               { slug: "czech-republic",      league: "national",        he: "צ'כיה" },
  "匈牙利":             { slug: "hungary",             league: "national",        he: "הונגריה" },
  "土耳其":             { slug: "turkey",              league: "national",        he: "טורקיה" },
  "乌克兰":             { slug: "ukraine",             league: "national",        he: "אוקראינה" },
  "日本":               { slug: "japan",               league: "national",        he: "יפן" },
  "韩国":               { slug: "south-korea",         league: "national",        he: "דרום קוריאה" },
  "中国":               { slug: "china",               league: "national",        he: "סין" },
  "卡塔尔":             { slug: "qatar",               league: "national",        he: "קטאר" },
  "沙特":               { slug: "saudi-arabia",        league: "national",        he: "ערב הסעודית" },
  "沙特阿拉伯":         { slug: "saudi-arabia",        league: "national",        he: "ערב הסעודית" },
  "墨西哥":             { slug: "mexico",              league: "national",        he: "מקסיקו" },
  "巴拿马":             { slug: "panama",              league: "national",        he: "פנמה" },
  "牙买加":             { slug: "jamaica",             league: "national",        he: "ג'מייקה" },
  "美国":               { slug: "usa",                 league: "national",        he: "ארה\"ב" },
  "加拿大":             { slug: "canada",              league: "national",        he: "קנדה" },
  "哥伦比亚":           { slug: "colombia",            league: "national",        he: "קולומביה" },
  "智利":               { slug: "chile",               league: "national",        he: "צ'ילה" },
  "秘鲁":               { slug: "peru",                league: "national",        he: "פרו" },
  "乌拉圭":             { slug: "uruguay",             league: "national",        he: "אורוגוואי" },
  "厄瓜多尔":           { slug: "ecuador",             league: "national",        he: "אקוודור" },
  "委内瑞拉":           { slug: "venezuela",           league: "national",        he: "ונצואלה" },
  "摩洛哥":             { slug: "morocco",             league: "national",        he: "מרוקו" },
  "突尼斯":             { slug: "tunisia",             league: "national",        he: "תוניסיה" },
  "阿尔及利亚":         { slug: "algeria",             league: "national",        he: "אלג'יריה" },
  "埃及":               { slug: "egypt",               league: "national",        he: "מצרים" },
  "尼日利亚":           { slug: "nigeria",             league: "national",        he: "ניגריה" },
  "塞内加尔":           { slug: "senegal",             league: "national",        he: "סנגל" },
  "马里":               { slug: "mali",                league: "national",        he: "מאלי" },
  "象牙海岸":           { slug: "ivory-coast",         league: "national",        he: "חוף השנהב" },
  "科特迪瓦":           { slug: "ivory-coast",         league: "national",        he: "חוף השנהב" },
  "喀麦隆":             { slug: "cameroon",            league: "national",        he: "קמרון" },
  "加纳":               { slug: "ghana",               league: "national",        he: "גאנה" },
  "南非":               { slug: "south-africa",        league: "national",        he: "דרום אפריקה" },
  "伊朗":               { slug: "iran",                league: "national",        he: "איראן" },
  "伊拉克":             { slug: "iraq",                league: "national",        he: "עיראק" },
  "约旦":               { slug: "jordan",              league: "national",        he: "ירדן" },
};

/* ───────────────────────────────────────────────────────────────────────
 * Ambiguous tokens — if matched alone (no longer disambiguator), we DROP
 * the candidate rather than guess. Examples:
 *   "米兰" alone could be AC or Inter; "马德里" alone could be Real or Atleti;
 *   "雷亚尔" alone could be Real Madrid or Real Sociedad/Betis/etc;
 * ─────────────────────────────────────────────────────────────────────── */
const AMBIGUOUS_TOKENS = new Set([
  "米兰",      // AC vs Inter
  "马德里",    // Real vs Atletico
  "雷亚尔",
  "皇家",      // Real (any)
  "胜利",      // Al-Nassr only by association; ambiguous Chinese word
  "新月",      // Al-Hilal but the literal word is generic
  "利雅得",    // Riyadh — could be Al-Nassr or Al-Hilal
]);

/* Slugs that the audit considers EQUIVALENT (for cases where the catalog
 * uses one canonical slug but dictionary entries use another). */
const SLUG_ALIASES = {
  "betis": "real-betis",
  "real-betis": "real-betis",
  "leicester": "leicester-city",
  "leicester-city": "leicester-city",
  "red-bull-leipzig": "rb-leipzig",
  "rb-leipzig": "rb-leipzig",
  "red-bull-salzburg": "red-bull-salzburg",
  "salzburg": "red-bull-salzburg",
};
function canonSlug(s) {
  if (!s) return s;
  return SLUG_ALIASES[s] || s;
}

/* ───────────────────────────────────────────────────────────────────────
 * Build sorted token list (longest first)
 * ─────────────────────────────────────────────────────────────────────── */
const TOKENS = Object.keys(CN_DICT).sort((a, b) => b.length - a.length);

function findChineseTeam(text) {
  if (!text) return null;
  // Case-insensitive search for tokens that contain Latin (e.g. AC米兰)
  const lower = text.toLowerCase();
  for (const tok of TOKENS) {
    const probe = /[A-Za-z]/.test(tok) ? tok.toLowerCase() : tok;
    if (lower.includes(probe) || text.includes(tok)) {
      return { token: tok, ...CN_DICT[tok] };
    }
  }
  // Check for ambiguous-only tokens — return a sentinel to mark skip
  for (const tok of AMBIGUOUS_TOKENS) {
    if (text.includes(tok)) return { token: tok, ambiguous: true };
  }
  return null;
}

/* ───────────────────────────────────────────────────────────────────────
 * Audit loop
 * ─────────────────────────────────────────────────────────────────────── */
let audited = 0;
let skippedAmbiguous = 0;
let noMatch = 0;
const mismatches = [];
const ambiguousSamples = [];

for (const p of products) {
  if (!p.sourceHandleCn) continue;
  audited++;

  const match = findChineseTeam(p.sourceHandleCn);
  if (!match) { noMatch++; continue; }

  if (match.ambiguous) {
    skippedAmbiguous++;
    if (ambiguousSamples.length < 10) {
      ambiguousSamples.push({
        slug: p.slug,
        id: p.id,
        sourceHandleCn: p.sourceHandleCn,
        currentSlug: p.teamSlug,
        ambiguousToken: match.token,
      });
    }
    continue;
  }

  const expected = canonSlug(match.slug);
  const current = canonSlug(p.teamSlug);
  if (expected === current) continue;

  // Determine confidence
  //   high  — token is unique & unambiguous (length >= 3 or distinct chars)
  //   medium — token is shorter / could share substrings with national name
  //   low   — would have been ambiguous (already filtered above)
  let confidence = "high";
  // Some tokens are short and might overlap with other names. Mark them medium.
  const MEDIUM_TOKENS = new Set([
    "维拉", "多特", "新月", "胜利", "美洲", "尼斯", "马赛", "罗马",
    "莱比锡", "门兴", "纽卡", "莱切", "科莫", "瓦斯科", "纽卡斯",
    "米纳斯", "里斯本", "巴萨", "巴塞", "巴赛",
  ]);
  if (MEDIUM_TOKENS.has(match.token)) confidence = "medium";

  mismatches.push({
    slug: p.slug,
    id: p.id,
    sourceHandleCn: p.sourceHandleCn,
    currentTeam: p.team,
    currentSlug: p.teamSlug,
    currentLeague: p.league,
    suspectedTeam: match.he,
    suspectedSlug: match.slug,
    suspectedLeague: match.league,
    confidence,
    reason: `Chinese token "${match.token}" -> ${match.slug}, but product is tagged ${p.teamSlug}`,
  });
}

mismatches.sort((a, b) => {
  // high first, then by suspectedSlug
  if (a.confidence !== b.confidence) return a.confidence === "high" ? -1 : 1;
  return a.suspectedSlug.localeCompare(b.suspectedSlug);
});

fs.writeFileSync(OUT_FILE, JSON.stringify(mismatches, null, 2));

const highCount = mismatches.filter(m => m.confidence === "high").length;
const medCount = mismatches.filter(m => m.confidence === "medium").length;

console.log("=".repeat(72));
console.log(" CHINESE-SOURCE MISLABEL AUDIT");
console.log("=".repeat(72));
console.log(`Total products audited (with sourceHandleCn): ${audited}`);
console.log(`No Chinese token matched (skipped):           ${noMatch}`);
console.log(`Ambiguous-only matches (skipped):             ${skippedAmbiguous}`);
console.log(`Mismatches found:                             ${mismatches.length}`);
console.log(`  - high confidence:    ${highCount}`);
console.log(`  - medium confidence:  ${medCount}`);
console.log("");
console.log("Top 10 mismatches:");
for (const m of mismatches.slice(0, 10)) {
  console.log(`  [${m.confidence}] ${m.sourceHandleCn.padEnd(28)} -> tagged "${m.currentSlug}", expected "${m.suspectedSlug}"`);
}
console.log("");
if (ambiguousSamples.length) {
  console.log("Sample ambiguous skips:");
  for (const a of ambiguousSamples) {
    console.log(`  ${a.sourceHandleCn.padEnd(28)} (token "${a.ambiguousToken}", currentSlug=${a.currentSlug})`);
  }
}
console.log("");
console.log(`Report written -> ${OUT_FILE}`);
