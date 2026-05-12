#!/usr/bin/env node
/**
 * Comprehensive gap sweep across all Yupoo suppliers.
 *
 * For every album in data/yupoo-final-catalog.json (which is the flattened
 * version of docs/YUPOO_INDEX.json) we:
 *   1. Detect team + season + type/flags from title_cn
 *   2. Skip if team can't be confidently determined
 *   3. Skip if (teamSlug, season, type, flags) already in sporthub-products.json
 *   4. Skip if fewer than 2 photos available
 *   5. Otherwise emit a candidate product
 *
 * Writes data/yupoo-comprehensive-additions.json
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "data/yupoo-final-catalog.json"), "utf8"));
const products = JSON.parse(fs.readFileSync(path.join(ROOT, "data/sporthub-products.json"), "utf8"));
const patches = JSON.parse(fs.readFileSync(path.join(ROOT, "data/patches-config.json"), "utf8"));

// ---------------------------------------------------------------------------
// 1. Build teamSlug -> Hebrew name map from existing catalog
// ---------------------------------------------------------------------------
const slugToHe = new Map();
for (const p of products) {
  if (p.teamSlug && p.team && !slugToHe.has(p.teamSlug)) slugToHe.set(p.teamSlug, p.team);
}
const nationalSlugs = new Set(products.filter(p => p.category === "national").map(p => p.teamSlug));
const teamLeagueMap = patches.teamLeague || {};
// Build a "national tier" lookup from existing products so we keep using
// tier-1/tier-2/tier-3 like the rest of the catalog (not "national-teams").
const nationalTier = new Map();
for (const p of products) {
  if (p.category === "national" && p.teamSlug && p.league && !nationalTier.has(p.teamSlug)) {
    nationalTier.set(p.teamSlug, p.league);
  }
}

// ---------------------------------------------------------------------------
// 2. Existing-products dedup keys
// ---------------------------------------------------------------------------
function keyOf({ teamSlug, season, type, isShortSuit, isLongSleeve, isKids, isRetro, isSpecial }) {
  return `${teamSlug}|${season || "NULL"}|${type}|${isShortSuit ? 1 : 0}|${isLongSleeve ? 1 : 0}|${isKids ? 1 : 0}|${isRetro ? 1 : 0}|${isSpecial ? 1 : 0}`;
}
const existingKeys = new Set();
for (const p of products) {
  existingKeys.add(keyOf({
    teamSlug: p.teamSlug,
    season: p.season,
    type: p.type,
    isShortSuit: p.isShortSuit,
    isLongSleeve: p.isLongSleeve,
    isKids: p.isKids,
    isRetro: p.isRetro,
    isSpecial: p.isSpecial,
  }));
}
const existingSlugs = new Set(products.map(p => p.slug));

// ---------------------------------------------------------------------------
// 3. Chinese token -> teamSlug dictionary
// Order matters: longer tokens checked first to avoid suffix collisions
// (e.g. 突尼斯/Tunisia matched before 尼斯/Nice).
// ---------------------------------------------------------------------------
const teamMap = [
  // Bundesliga
  ["拜仁慕尼黑", "bayern-munich"], ["拜仁", "bayern-munich"],
  ["多特蒙德", "borussia-dortmund"], ["多特", "borussia-dortmund"],
  ["勒沃库森", "bayer-leverkusen"],
  ["RB莱比锡", "rb-leipzig"], ["莱比锡", "rb-leipzig"],
  ["斯图加特", "vfb-stuttgart"],
  ["法兰克福", "eintracht-frankfurt"],
  ["不莱梅", "werder-bremen"],
  ["沃尔夫斯堡", "wolfsburg"],
  ["圣保利", "st-pauli"],

  // La Liga
  ["皇家马德里", "real-madrid"], ["皇马", "real-madrid"],
  ["巴塞罗那", "barcelona"], ["巴塞", "barcelona"], ["巴萨", "barcelona"],
  ["马德里竞技", "atletico-madrid"], ["马竞", "atletico-madrid"],
  ["毕尔巴鄂", "athletic-bilbao"],
  ["塞维利亚", "sevilla"],
  ["皇家贝蒂斯", "real-betis"], ["贝蒂斯", "real-betis"], ["皇家贝斯", "real-betis"],
  ["皇家社会", "real-sociedad"],
  ["比利亚雷亚尔", "villarreal"],
  ["瓦伦西亚", "valencia"],
  ["赫罗纳", "girona"],
  ["马洛卡", "mallorca"], ["马略卡", "mallorca"],
  ["奥萨苏纳", "osasuna"],
  ["塞尔塔", "celta-vigo"],
  ["莱万特", "levante"],
  ["阿拉维斯", "alaves"],
  ["加的斯", "cadiz"],
  ["格拉纳达", "granada"],
  ["西班牙人", "espanyol"],
  ["马拉加", "malaga"],
  ["巴拉多利德", "real-valladolid"],
  ["皇家瓦拉多利德", "real-valladolid"],

  // Premier League
  ["曼彻斯特联", "manchester-united"], ["曼联", "manchester-united"],
  ["曼彻斯特城", "manchester-city"], ["曼城", "manchester-city"],
  ["利物浦", "liverpool"],
  ["切尔西", "chelsea"],
  ["阿森纳", "arsenal"], ["阿深纳", "arsenal"],
  ["热刺", "tottenham"], ["托特纳姆", "tottenham"],
  ["阿斯顿维拉", "aston-villa"], ["阿斯顿", "aston-villa"], ["维拉", "aston-villa"],
  ["纽卡斯尔", "newcastle"], ["纽卡", "newcastle"],
  ["狼队", "wolves"],
  ["埃弗顿", "everton"], ["埃佛顿", "everton"],
  ["布莱顿", "brighton"],
  ["莱斯特城", "leicester-city"], ["莱斯特", "leicester-city"],
  ["利兹联", "leeds"], ["利兹", "leeds"],
  ["富勒姆", "fulham"],
  ["西汉姆联", "west-ham"], ["西汉姆", "west-ham"],
  ["诺丁汉森林", "nottingham-forest"], ["森林队", "nottingham-forest"],
  ["伯恩茅斯", "bournemouth"],
  ["伯恩利", "burnley"],
  ["水晶宫", "crystal-palace"],
  ["谢菲尔德联", "sheffield-united"],
  ["桑德兰", "sunderland"],
  ["考文垂", "coventry"],
  ["德比郡", "derby-county"],
  ["雷克斯汉姆", "wrexham"],

  // Serie A
  ["尤文图斯", "juventus"], ["尤文", "juventus"],
  ["国际米兰", "inter-milan"], ["国米", "inter-milan"],
  ["AC米兰", "ac-milan"], ["AC", "ac-milan"], ["Ac", "ac-milan"],
  ["那不勒斯", "napoli"],
  ["拉齐奥", "lazio"],
  ["佛罗伦萨", "fiorentina"], ["佛罗伦赛", "fiorentina"],
  ["亚特兰大", "atalanta"],
  ["博洛尼亚", "bologna"],
  ["莱切", "lecce"],
  ["科莫", "como"],
  ["帕尔马", "parma"],
  ["威尼斯", "venezia"],

  // Ligue 1
  ["巴黎圣日耳曼", "psg"], ["巴黎", "psg"],
  ["马赛", "marseille"], ["马塞", "marseille"],
  ["里昂", "lyon"],
  ["摩纳哥", "monaco"],

  // Eredivisie
  ["阿贾克斯", "ajax"],
  ["埃因霍温", "psv"],
  ["费耶诺德", "feyenoord"], ["费耶诺得", "feyenoord"],
  ["阿尔克马尔", "az-alkmaar"],

  // Scotland
  ["凯尔特人", "celtic"],
  ["流浪者", "rangers"],
  ["阿伯丁", "aberdeen"],

  // Portugal
  ["里斯本竞技", "sporting-lisbon"], ["葡体", "sporting-lisbon"], ["葡萄牙体育", "sporting-lisbon"],
  ["本菲卡", "benfica"],
  ["波尔图", "porto"],
  ["布拉加", "braga"],

  // Turkey
  ["费内巴切", "fenerbahce"], ["费内巴", "fenerbahce"],
  ["加拉塔萨雷", "galatasaray"],
  ["贝西克塔斯", "besiktas"],
  ["特拉布宗体育", "trabzonspor"], ["特拉布宗", "trabzonspor"],

  // Other Europe
  ["红牛萨尔茨堡", "red-bull-salzburg"], ["萨尔茨堡", "red-bull-salzburg"],
  ["大伯尔尼", "young-boys"], ["年轻人", "young-boys"],
  ["顿涅茨克矿工", "shakhtar-donetsk"], ["矿工", "shakhtar-donetsk"],
  ["基辅迪纳摩", "dynamo-kyiv"],
  ["雅典AEK", "aek-athens"], ["AEK雅典", "aek-athens"], ["AEK", "aek-athens"],

  // MLS / Saudi / Asia
  ["迈阿密国际", "inter-miami"], ["国际迈阿密", "inter-miami"], ["迈阿密", "inter-miami"],
  ["阿尔纳斯尔", "al-nassr"], ["利雅得胜利", "al-nassr"],
  ["利雅得新月", "al-hilal"], ["新月", "al-hilal"],
  ["吉达联合", "al-ittihad"],

  // Brazil
  ["桑托斯", "santos"], ["桑拖斯", "santos"],
  ["弗拉门戈", "flamengo"], ["佛拉门戈", "flamengo"],
  ["帕尔梅拉斯", "palmeiras"], ["帕梅拉斯", "palmeiras"], ["帕尔拉斯", "palmeiras"],
  ["米内罗竞技", "atletico-mineiro"], ["米内罗", "atletico-mineiro"],
  ["国民竞技", "atletico-nacional"],
  ["巴拉纳竞技", "atletico-paranaense"],
  ["科林蒂安", "corinthians"],
  ["圣保罗", "sao-paulo"],
  ["弗鲁米嫩塞", "fluminense"], ["弗鲁米", "fluminense"], ["佛鲁米嫩塞", "fluminense"],
  ["瓦斯科", "vasco"], ["达咖马", "vasco"], ["达伽马", "vasco"],
  ["博塔弗戈", "botafogo"], ["博塔佛戈", "botafogo"],
  ["格雷米奥", "gremio"], ["格雷米", "gremio"],
  ["克鲁塞罗", "cruzeiro"], ["克鲁塞", "cruzeiro"],

  // Argentina
  ["博卡青年", "boca-juniors"], ["博卡", "boca-juniors"],
  ["河床", "river-plate"],

  // Mexico
  ["美洲队", "club-america"], ["美洲", "club-america"],
  ["老虎", "tigres"],
  ["蓝十字", "cruz-azul"],
  ["蒙特雷", "monterrey"],
  ["芝华士", "chivas"],

  // Other South America
  ["科洛科洛", "colo-colo"],
  ["智利大学", "universidad-catolica"], ["天主教", "universidad-catolica"],
  ["米利奥那利奥斯", "millonarios"], ["百万富翁", "millonarios"],

  // Egypt
  ["大埃及", "al-ahly"], ["埃及国民", "al-ahly"],

  // National teams (must be after club tokens to avoid collisions)
  ["巴西", "brazil"],
  ["阿根廷", "argentina"],
  ["德国", "germany"],
  ["法国", "france"],
  ["西班牙", "spain"],
  ["英格兰", "england"],
  ["葡萄牙", "portugal"],
  ["意大利", "italy"],
  ["荷兰", "netherlands"],
  ["比利时", "belgium"],
  ["克罗地亚", "croatia"],
  ["波兰", "poland"],
  ["丹麦", "denmark"],
  ["瑞典", "sweden"],
  ["挪威", "norway"],
  ["瑞士", "switzerland"],
  ["奥地利", "austria"],
  ["捷克", "czech-republic"],
  ["匈牙利", "hungary"],
  ["乌克兰", "ukraine"],
  ["土耳其", "turkey"],
  ["希腊", "greece"],
  ["塞尔维亚", "serbia"],
  ["苏格兰", "scotland"],
  ["威尔士", "wales"],
  ["爱尔兰", "ireland"],
  ["北爱尔兰", "northern-ireland"],
  ["俄罗斯", "russia"],
  ["罗马尼亚", "romania"],
  ["哥伦比亚", "colombia"],
  ["乌拉圭", "uruguay"],
  ["智利", "chile"],
  ["秘鲁", "peru"],
  ["厄瓜多尔", "ecuador"],
  ["巴拉圭", "paraguay"],
  ["委内瑞拉", "venezuela"],
  ["玻利维亚", "bolivia"],
  ["墨西哥", "mexico"],
  ["加拿大", "canada"],
  ["美国", "usa"],
  ["巴拿马", "panama"],
  ["哥斯达黎加", "costa-rica"],
  ["洪都拉斯", "honduras"],
  ["牙买加", "jamaica"],
  ["古巴", "cuba"],
  ["多米尼加", "dominican-republic"],
  ["海地", "haiti"],
  ["特立尼达", "trinidad-tobago"],
  ["萨尔瓦多", "el-salvador"],
  ["危地马拉", "guatemala"],
  ["日本", "japan"],
  ["韩国", "south-korea"],
  ["卡塔尔", "qatar"],
  ["沙特阿拉伯", "saudi-arabia"], ["沙特", "saudi-arabia"],
  ["伊朗", "iran"],
  ["伊拉克", "iraq"],
  ["澳大利亚", "australia"],
  ["新西兰", "new-zealand"],
  ["中国", "china"],
  ["朝鲜", "north-korea"],
  ["越南", "vietnam"],
  ["泰国", "thailand"],
  ["印度尼西亚", "indonesia"],
  ["马来西亚", "malaysia"],
  ["乌兹别克斯坦", "uzbekistan"],
  ["阿联酋", "uae"],
  ["约旦", "jordan"],
  ["巴勒斯坦", "palestine"],
  ["以色列", "israel"],
  ["黎巴嫩", "lebanon"],
  ["叙利亚", "syria"],
  ["阿曼", "oman"],
  ["科威特", "kuwait"],
  ["巴林", "bahrain"],
  ["也门", "yemen"],
  ["埃及", "egypt"],
  ["摩洛哥", "morocco"],
  ["阿尔及利亚", "algeria"],
  ["突尼斯", "tunisia"],   // must come before 尼斯 if there were one
  ["利比亚", "libya"],
  ["南非", "south-africa"],
  ["尼日利亚", "nigeria"], ["阿尼及利亚", "nigeria"], ["尼及利亚", "nigeria"],
  ["加纳", "ghana"],
  ["塞内加尔", "senegal"],
  ["科特迪瓦", "ivory-coast"],
  ["喀麦隆", "cameroon"],
  ["马里", "mali"],
  ["布基纳法索", "burkina-faso"],
  ["乍得", "chad"],
  ["几内亚", "guinea"],
  ["肯尼亚", "kenya"],
  ["坦桑尼亚", "tanzania"],
  ["乌干达", "uganda"],
  ["卢旺达", "rwanda"],
  ["苏丹", "sudan"],
  ["埃塞俄比亚", "ethiopia"],
  ["索马里", "somalia"],
  ["安哥拉", "angola"],
  ["莫桑比克", "mozambique"],
  ["纳米比亚", "namibia"],
  ["博茨瓦纳", "botswana"],
  ["津巴布韦", "zimbabwe"],
  ["赞比亚", "zambia"],
  ["马达加斯加", "madagascar"],
  ["佛得角", "cape-verde"],
  ["塞拉利昂", "sierra-leone"],
  ["利比里亚", "liberia"],
  ["多哥", "togo"],
  ["贝宁", "benin"],
  ["尼日尔", "niger"],
  ["毛里塔尼亚", "mauritania"],
  ["冈比亚", "gambia"],
  ["几内亚比绍", "guinea-bissau"],
  ["赤道几内亚", "equatorial-guinea"],
  ["刚果", "congo"],
  ["加蓬", "gabon"],
  ["中非", "central-african-republic"],
];

function detectTeam(title) {
  for (const [zh, slug] of teamMap) {
    if (title.includes(zh)) return slug;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 4. Season parsing
// ---------------------------------------------------------------------------
function isValidSeason(s) {
  if (!s) return false;
  // single year e.g. "1998" or "2026"
  if (/^(19|20)\d{2}$/.test(s)) {
    const y = parseInt(s, 10);
    return y >= 1950 && y <= 2030;
  }
  // YYYY-YY e.g. "2025-26", with second part = (first+1) % 100
  const m = s.match(/^(19|20)(\d{2})-(\d{2})$/);
  if (!m) return false;
  const yy1 = parseInt(m[2], 10);
  const yy2 = parseInt(m[3], 10);
  return yy2 === (yy1 + 1) % 100;
}

function detectSeason(title) {
  // 2026-27, 2025-26, 2024-25 etc.
  let m = title.match(/(20\d{2})-?(20)?(\d{2})/);
  if (m) {
    const y1 = parseInt(m[1], 10);
    const y2yy = m[3] ? parseInt(m[3], 10) : (y1 + 1) % 100;
    return `${y1}-${String(y2yy).padStart(2, "0")}`;
  }
  // 26-27, 25-26, 24-25 (modern) or 99-00, 87-88 (historical)
  m = title.match(/(\d{2})-(\d{2})/);
  if (m) {
    const yy1 = parseInt(m[1], 10);
    const yy2 = parseInt(m[2], 10);
    // sanity check: yy2 = yy1 + 1 (mod 100)
    if (yy2 === (yy1 + 1) % 100) {
      // 50+ is treated as 1900s, <=50 is 2000s
      const y1full = yy1 >= 50 ? 1900 + yy1 : 2000 + yy1;
      return `${y1full}-${String(yy2).padStart(2, "0")}`;
    }
  }
  // 2526, 2425 (no separator)
  m = title.match(/(?:^|[^0-9])(\d{2})(\d{2})(?:[^0-9]|$)/);
  if (m) {
    const yy1 = parseInt(m[1], 10);
    const yy2 = parseInt(m[2], 10);
    if (yy2 === (yy1 + 1) % 100) {
      const y1full = yy1 >= 50 ? 1900 + yy1 : 2000 + yy1;
      return `${y1full}-${String(yy2).padStart(2, "0")}`;
    }
  }
  // 99-00 retro (or 99/00)
  m = title.match(/(\d{2})[-\/](\d{2})/);
  if (m) {
    const yy1 = parseInt(m[1], 10);
    const yy2 = parseInt(m[2], 10);
    if ((yy1 === 99 && yy2 === 0) || (yy1 + 1 === yy2)) {
      const y1full = yy1 >= 50 ? 1900 + yy1 : 2000 + yy1;
      return `${y1full}-${String(yy2).padStart(2, "0")}`;
    }
  }
  // Single 4-digit year — only when not adjacent to other digits and looks
  // like a season year (1950-2030).
  m = title.match(/(?:^|[^0-9])(19[5-9]\d|20[0-3]\d)(?:[^0-9]|$)/);
  if (m) {
    return m[1];
  }
  return null;
}

// ---------------------------------------------------------------------------
// 5. Type detection
// ---------------------------------------------------------------------------
function detectType(title) {
  // order matters
  if (/守门|门将/.test(title)) return "goalkeeper";
  if (/三客|3客|三客场/.test(title)) return "third";
  if (/二客|2客/.test(title)) return "third"; // second-away treated as third
  if (/客场|客/.test(title)) return "away";
  if (/主场|主/.test(title)) return "home";
  if (/特别版|特别|纪念版|纪念/.test(title)) return "special";
  return null;
}

function detectFlags(title, supplier) {
  const isKids = /童装|儿童/.test(title);
  const isLongSleeve = /长袖/.test(title);
  const isShortSuit = supplier === "short_xiaoyueliang0917" || /套装/.test(title);
  const isRetro = supplier === "retro_3072503479" || /复古|怀旧/.test(title);
  const isSpecial = /特别版|特别|纪念版|纪念|限量/.test(title);
  return { isKids, isLongSleeve, isShortSuit, isRetro, isSpecial };
}

// ---------------------------------------------------------------------------
// 6. Catalog name -> supplier slug mapping
// yupoo-final-catalog uses .catalog: "fan-1" / "fan-2" / "player-1" / "player-2"
// / "retro-1" / "short-1" but we mainly want to know if retro / short.
// ---------------------------------------------------------------------------
function catalogToSupplier(cat) {
  if (cat.startsWith("retro")) return "retro_3072503479";
  if (cat.startsWith("short")) return "short_xiaoyueliang0917";
  if (cat === "fan-1") return "fan_jianbo666888";
  if (cat === "fan-2") return "fan_diyao508";
  if (cat === "player-1") return "player_qiqirong";
  return cat;
}

// ---------------------------------------------------------------------------
// 7. Pricing rules
// ---------------------------------------------------------------------------
function priceForFlags({ isShortSuit, isKids, isLongSleeve, isSpecial }) {
  if (isShortSuit && isKids) return { price: 169, tier: "kids-set" };
  if (isShortSuit) return { price: 189, tier: "adult-set" };
  if (isLongSleeve) return { price: 129, tier: "long-sleeve" };
  if (isSpecial) return { price: 119, tier: "special" };
  return { price: 109, tier: "regular" };
}

// ---------------------------------------------------------------------------
// 8. Slug + type/season string helpers
// ---------------------------------------------------------------------------
function makeSlug({ teamSlug, type, season, isKids, isRetro, isLongSleeve, isShortSuit, isSpecial }) {
  const parts = [teamSlug, type];
  if (season) parts.push(season);
  if (isKids) parts.push("kids");
  if (isRetro && type !== "retro") parts.push("retro");
  if (isLongSleeve) parts.push("ls");
  if (isShortSuit) parts.push("set");
  if (isSpecial && type !== "special") parts.push("sp");
  return parts.join("-");
}

function hebrewType(type, isLongSleeve, isKids, isShortSuit, isSpecial, season) {
  const seasonHe = season ? ` ${season.replace("-", "/")}` : "";
  if (isShortSuit && isKids) return `סט ילדים${seasonHe}`;
  if (isShortSuit) return `סט מבוגרים ${typeWord(type)}${seasonHe}`;
  if (isKids) return `מדי ילדים ${typeWord(type)}${seasonHe}`;
  if (isLongSleeve) return `מדי ${typeWord(type)} שרוול ארוך${seasonHe}`;
  if (isSpecial) return `מהדורה מיוחדת${seasonHe}`;
  if (type === "retro") return `רטרו${seasonHe}`;
  return `מדי ${typeWord(type)}${seasonHe}`;
}
function typeWord(type) {
  switch (type) {
    case "home": return "בית";
    case "away": return "חוץ";
    case "third": return "שלישי";
    case "goalkeeper": return "שוער";
    case "special": return "מהדורה מיוחדת";
    case "retro": return "רטרו";
    default: return type || "";
  }
}

// ---------------------------------------------------------------------------
// 9. Build candidates
// ---------------------------------------------------------------------------
const candidates = [];
const stats = {
  total: 0,
  byCatalog: {},
  skipped: {
    no_team: 0,
    no_type: 0,
    insufficient_photos: 0,
    duplicate: 0,
    slug_collision: 0,
    photo_url_missing: 0,
  },
  reasonsByCatalog: {},
};
const newKeys = new Set();      // dedup within the run
const newSlugs = new Set();
function bumpReason(catalog, reason) {
  stats.reasonsByCatalog[catalog] = stats.reasonsByCatalog[catalog] || {};
  stats.reasonsByCatalog[catalog][reason] = (stats.reasonsByCatalog[catalog][reason] || 0) + 1;
}

function encodeImg(url) {
  return `/api/yupoo-image?url=${encodeURIComponent(url)}`;
}

// Extract album ID from yupoo URL: .../albums/235713553?uid=1
function albumIdFromUrl(url) {
  const m = url && url.match(/\/albums\/(\d+)/);
  return m ? m[1] : null;
}

for (const album of catalog) {
  stats.total++;
  const catKey = album.catalog;
  stats.byCatalog[catKey] = (stats.byCatalog[catKey] || 0) + 1;

  const title = album.title || album.nameCn || "";
  const supplier = catalogToSupplier(catKey);
  const photos = (album.photos || []).filter(Boolean);

  if (photos.length < 2) {
    stats.skipped.insufficient_photos++;
    bumpReason(catKey, "insufficient_photos");
    continue;
  }

  const teamSlug = detectTeam(title);
  if (!teamSlug) {
    stats.skipped.no_team++;
    bumpReason(catKey, "no_team");
    continue;
  }
  if (!slugToHe.has(teamSlug)) {
    // detected slug isn't in our catalog yet — skip (no Hebrew name)
    stats.skipped.no_team++;
    bumpReason(catKey, "no_team_in_catalog");
    continue;
  }

  const flags = detectFlags(title, supplier);
  let type = detectType(title);
  // If supplier is retro and type wasn't otherwise specified, type=retro
  if (flags.isRetro && (!type || type === "home" || type === "away" || type === "third")) {
    // keep type as home/away/third if explicitly stated; but mark as retro flag
    if (!type) type = "retro";
  }
  if (!type) {
    // Last resort: if isSpecial, treat as special
    if (flags.isSpecial) type = "special";
  }
  if (!type) {
    stats.skipped.no_type++;
    bumpReason(catKey, "no_type");
    continue;
  }

  // Re-parse from title rather than trust album.season — the pre-stored
  // value in yupoo-final-catalog.json has known bugs (e.g. "2526", "2099-01").
  // Re-parse from title rather than trust album.season (pre-stored values
  // in yupoo-final-catalog.json have known bugs like "2526", "2099-01").
  const season = detectSeason(title) || (album.season && isValidSeason(album.season) ? album.season : null);

  const matchKey = keyOf({
    teamSlug,
    season,
    type,
    isShortSuit: flags.isShortSuit,
    isLongSleeve: flags.isLongSleeve,
    isKids: flags.isKids,
    isRetro: flags.isRetro,
    isSpecial: flags.isSpecial,
  });

  if (existingKeys.has(matchKey) || newKeys.has(matchKey)) {
    stats.skipped.duplicate++;
    bumpReason(catKey, "duplicate");
    continue;
  }
  newKeys.add(matchKey);

  let slug = makeSlug({ teamSlug, type, season, ...flags });
  if (existingSlugs.has(slug) || newSlugs.has(slug)) {
    // disambiguate with album id
    const albumId = albumIdFromUrl(album.url) || Math.random().toString(36).slice(2, 8);
    slug = `${slug}-${albumId}`;
    if (existingSlugs.has(slug) || newSlugs.has(slug)) {
      stats.skipped.slug_collision++;
      bumpReason(catKey, "slug_collision");
      continue;
    }
  }
  newSlugs.add(slug);

  const team = slugToHe.get(teamSlug);
  const isNational = nationalSlugs.has(teamSlug);
  const league = isNational
    ? (nationalTier.get(teamSlug) || "tier-3")
    : (teamLeagueMap[teamSlug] || "other");
  const { price, tier } = priceForFlags(flags);

  const sizes = (flags.isKids && !flags.isShortSuit) ? ["16","18","20","22","24","26","28"]
                : (flags.isKids && flags.isShortSuit) ? ["16","18","20","22","24","26","28"]
                : ["S","M","L","XL","XXL"];

  const albumId = albumIdFromUrl(album.url) || Math.random().toString(36).slice(2, 8);

  const imageUrls = photos.slice(0, 2).map(encodeImg);

  const tags = ["yupoo", team];
  if (season) tags.push(season);
  if (flags.isRetro) tags.push("רטרו");
  if (flags.isKids) tags.push("ילדים");
  if (flags.isLongSleeve) tags.push("שרוול ארוך");
  if (flags.isShortSuit) tags.push("סט");
  if (flags.isSpecial) tags.push("ספיישל");

  const titleHebSegment = hebrewType(type, flags.isLongSleeve, flags.isKids, flags.isShortSuit, flags.isSpecial, season);
  const nameHe = `${team} ${titleHebSegment}`.trim();

  const product = {
    id: `yp-yupoo-${albumId}`,
    slug,
    nameHe,
    nameEn: "",
    sourceHandle: "",
    sourceUrl: album.url || "",
    sourceHandleCn: title,
    category: isNational ? "national" : "club",
    league,
    team,
    teamSlug,
    season,
    type,
    isRetro: !!flags.isRetro,
    isKids: !!flags.isKids,
    isWorldCup2026: false,
    isSpecial: !!flags.isSpecial,
    isLongSleeve: !!flags.isLongSleeve,
    isShortSuit: !!flags.isShortSuit,
    priceFan: price,
    pricePlayer: price,
    priceRetro: price,
    sizes,
    images: imageUrls,
    imagesOriginal: imageUrls,
    primaryImage: imageUrls[0],
    tags,
    description: nameHe,
    stock: "in-stock",
    sourcePriceMin: null,
    sourcePriceMax: null,
    priceTier: tier,
  };

  candidates.push(product);
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------
const outPath = path.join(ROOT, "data/yupoo-comprehensive-additions.json");
fs.writeFileSync(outPath, JSON.stringify(candidates, null, 2));

// Validate JSON
JSON.parse(fs.readFileSync(outPath, "utf8"));

console.log(`\nWrote ${candidates.length} candidates to ${outPath}`);

// Report
console.log("\n=== STATS ===");
console.log(`Total albums scanned: ${stats.total}`);
console.log("By catalog:", stats.byCatalog);
console.log("Skipped:", stats.skipped);
console.log("\nReasons by catalog:");
for (const [c, r] of Object.entries(stats.reasonsByCatalog)) console.log("  " + c + ":", r);

// Team breakdown
const byTeam = {};
for (const c of candidates) byTeam[c.teamSlug] = (byTeam[c.teamSlug] || 0) + 1;
const sortedTeams = Object.entries(byTeam).sort((a, b) => b[1] - a[1]);
console.log("\nTop 20 teams by new product count:");
for (const [t, n] of sortedTeams.slice(0, 20)) console.log("  " + t.padEnd(28) + n);

// Type breakdown
const byType = {};
for (const c of candidates) byType[c.priceTier] = (byType[c.priceTier] || 0) + 1;
console.log("\nBy priceTier:", byType);

const byPType = {};
for (const c of candidates) byPType[c.type] = (byPType[c.type] || 0) + 1;
console.log("By type:", byPType);

console.log(`\nUnique teams touched: ${Object.keys(byTeam).length}`);
