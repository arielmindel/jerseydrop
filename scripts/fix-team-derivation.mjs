/**
 * Re-derive team / teamSlug / league for every product in
 * /data/sporthub-products.json based on the most reliable available signal:
 *
 *   1. sourceHandleCn (Chinese supplier title) → matched against the
 *      CN_TO_TEAM dictionary. Most reliable since the Chinese title
 *      always names the team explicitly.
 *   2. nameHe (Hebrew product name from the merge) → matched against
 *      the HE_TO_TEAM dictionary after stripping season/color/type
 *      modifiers.
 *   3. existing team field → trusted only if the above are inconclusive.
 *
 * Updates league per the canonical TEAM_LEAGUE map (cluster of UCL/La Liga/
 * Serie A/Bundesliga/Ligue 1/Premier League/Israel/Other/Tier-1/2/3).
 *
 * Run: node scripts/fix-team-derivation.mjs
 */

import { readFileSync, writeFileSync } from "fs";

const products = JSON.parse(
  readFileSync("./data/sporthub-products.json", "utf8"),
);
const startCount = products.length;

// ============================================================================
// 1. Master team registry (slug → { he, en, league, category })
// ============================================================================

const TEAMS = {
  // -- Premier League (England) --
  "manchester-united":     { he: "מנצ׳סטר יונייטד", en: "Manchester United", league: "premier-league", category: "club" },
  "manchester-city":       { he: "מנצ׳סטר סיטי", en: "Manchester City", league: "premier-league", category: "club" },
  "liverpool":             { he: "ליברפול", en: "Liverpool", league: "premier-league", category: "club" },
  "arsenal":               { he: "ארסנל", en: "Arsenal", league: "premier-league", category: "club" },
  "chelsea":               { he: "צ׳לסי", en: "Chelsea", league: "premier-league", category: "club" },
  "tottenham":             { he: "טוטנהאם", en: "Tottenham", league: "premier-league", category: "club" },
  "newcastle":             { he: "ניוקאסל", en: "Newcastle", league: "premier-league", category: "club" },
  "west-ham":              { he: "ווסטהאם", en: "West Ham", league: "premier-league", category: "club" },
  "aston-villa":           { he: "אסטון וילה", en: "Aston Villa", league: "premier-league", category: "club" },
  "brighton":              { he: "ברייטון", en: "Brighton", league: "premier-league", category: "club" },
  "fulham":                { he: "פולהאם", en: "Fulham", league: "premier-league", category: "club" },
  "everton":               { he: "אברטון", en: "Everton", league: "premier-league", category: "club" },
  "wolves":                { he: "וולברהמפטון", en: "Wolves", league: "premier-league", category: "club" },
  "nottingham-forest":     { he: "נוטינגהאם פורסט", en: "Nottingham Forest", league: "premier-league", category: "club" },
  "leicester-city":        { he: "לסטר", en: "Leicester City", league: "premier-league", category: "club" },
  "bournemouth":           { he: "בורנמות׳", en: "Bournemouth", league: "premier-league", category: "club" },
  "crystal-palace":        { he: "קריסטל פאלאס", en: "Crystal Palace", league: "premier-league", category: "club" },
  "leeds":                 { he: "לידס", en: "Leeds United", league: "premier-league", category: "club" },

  // -- La Liga (Spain) --
  "real-madrid":           { he: "ריאל מדריד", en: "Real Madrid", league: "la-liga", category: "club" },
  "barcelona":             { he: "ברצלונה", en: "Barcelona", league: "la-liga", category: "club" },
  "atletico-madrid":       { he: "אתלטיקו מדריד", en: "Atletico Madrid", league: "la-liga", category: "club" },
  "athletic-bilbao":       { he: "אתלטיק בילבאו", en: "Athletic Bilbao", league: "la-liga", category: "club" },
  "sevilla":               { he: "סביליה", en: "Sevilla", league: "la-liga", category: "club" },
  "real-betis":            { he: "בטיס", en: "Real Betis", league: "la-liga", category: "club" },
  "real-sociedad":         { he: "ריאל סוסיאדד", en: "Real Sociedad", league: "la-liga", category: "club" },
  "valencia":              { he: "ולנסיה", en: "Valencia", league: "la-liga", category: "club" },
  "villarreal":            { he: "ויאריאל", en: "Villarreal", league: "la-liga", category: "club" },
  "girona":                { he: "ז׳ירונה", en: "Girona", league: "la-liga", category: "club" },
  "osasuna":               { he: "אוסאסונה", en: "Osasuna", league: "la-liga", category: "club" },
  "espanyol":              { he: "אספניול", en: "Espanyol", league: "la-liga", category: "club" },
  "rayo-vallecano":        { he: "ראיו וייקאנו", en: "Rayo Vallecano", league: "la-liga", category: "club" },
  "celta-vigo":            { he: "סלטה ויגו", en: "Celta Vigo", league: "la-liga", category: "club" },
  "getafe":                { he: "חטאפה", en: "Getafe", league: "la-liga", category: "club" },
  "alaves":                { he: "אלאבס", en: "Alavés", league: "la-liga", category: "club" },
  "mallorca":              { he: "מיורקה", en: "Mallorca", league: "la-liga", category: "club" },
  "granada":               { he: "גראנדה", en: "Granada", league: "la-liga", category: "club" },
  "cadiz":                 { he: "קאדיז", en: "Cadiz", league: "la-liga", category: "club" },
  "malaga":                { he: "מלאגה", en: "Malaga", league: "la-liga", category: "club" },

  // -- Serie A (Italy) --
  "ac-milan":              { he: "מילאן", en: "AC Milan", league: "serie-a", category: "club" },
  "inter-milan":           { he: "אינטר", en: "Inter Milan", league: "serie-a", category: "club" },
  "juventus":              { he: "יובנטוס", en: "Juventus", league: "serie-a", category: "club" },
  "napoli":                { he: "נאפולי", en: "Napoli", league: "serie-a", category: "club" },
  "roma":                  { he: "רומא", en: "Roma", league: "serie-a", category: "club" },
  "lazio":                 { he: "לאציו", en: "Lazio", league: "serie-a", category: "club" },
  "atalanta":              { he: "אטלנטה", en: "Atalanta", league: "serie-a", category: "club" },
  "fiorentina":            { he: "פיורנטינה", en: "Fiorentina", league: "serie-a", category: "club" },
  "bologna":               { he: "בולוניה", en: "Bologna", league: "serie-a", category: "club" },
  "lecce":                 { he: "לאצה", en: "Lecce", league: "serie-a", category: "club" },
  "torino":                { he: "טורינו", en: "Torino", league: "serie-a", category: "club" },
  "udinese":               { he: "אודינזה", en: "Udinese", league: "serie-a", category: "club" },
  "monza":                 { he: "מונצה", en: "Monza", league: "serie-a", category: "club" },
  "como":                  { he: "קומו", en: "Como", league: "serie-a", category: "club" },
  "parma":                 { he: "פארמה", en: "Parma", league: "serie-a", category: "club" },

  // -- Bundesliga (Germany) --
  "bayern-munich":         { he: "באיירן מינכן", en: "Bayern Munich", league: "bundesliga", category: "club" },
  "borussia-dortmund":     { he: "דורטמונד", en: "Borussia Dortmund", league: "bundesliga", category: "club" },
  "bayer-leverkusen":      { he: "באייר לברקוזן", en: "Bayer Leverkusen", league: "bundesliga", category: "club" },
  "rb-leipzig":            { he: "לייפציג", en: "RB Leipzig", league: "bundesliga", category: "club" },
  "vfb-stuttgart":         { he: "שטוטגרט", en: "VfB Stuttgart", league: "bundesliga", category: "club" },
  "eintracht-frankfurt":   { he: "פרנקפורט", en: "Eintracht Frankfurt", league: "bundesliga", category: "club" },
  "borussia-monchengladbach":{ he: "מנשנגלדבך", en: "Borussia Mönchengladbach", league: "bundesliga", category: "club" },
  "wolfsburg":             { he: "וולפסבורג", en: "Wolfsburg", league: "bundesliga", category: "club" },
  "schalke":               { he: "שאלקה", en: "Schalke 04", league: "bundesliga", category: "club" },
  "st-pauli":              { he: "סנט פאולי", en: "St. Pauli", league: "bundesliga", category: "club" },

  // -- Ligue 1 (France) --
  "psg":                   { he: "פריז", en: "Paris Saint-Germain", league: "ligue-1", category: "club" },
  "marseille":             { he: "מארסיי", en: "Marseille", league: "ligue-1", category: "club" },
  "lyon":                  { he: "ליון", en: "Lyon", league: "ligue-1", category: "club" },
  "monaco":                { he: "מונקו", en: "Monaco", league: "ligue-1", category: "club" },
  "lille":                 { he: "ליל", en: "Lille", league: "ligue-1", category: "club" },
  "rennes":                { he: "רן", en: "Rennes", league: "ligue-1", category: "club" },
  "nice":                  { he: "ניס", en: "Nice", league: "ligue-1", category: "club" },

  // -- Other Leagues (Eredivisie, Primeira, MLS, Liga MX, Brazil, Argentina, etc.) --
  "ajax":                  { he: "אייאקס", en: "Ajax", league: "other", category: "club" },
  "psv":                   { he: "פסוו איינדהובן", en: "PSV Eindhoven", league: "other", category: "club" },
  "feyenoord":             { he: "פיינורד", en: "Feyenoord", league: "other", category: "club" },
  "az-alkmaar":            { he: "אלקמר", en: "AZ Alkmaar", league: "other", category: "club" },

  "benfica":               { he: "בנפיקה", en: "Benfica", league: "other", category: "club" },
  "porto":                 { he: "פורטו", en: "Porto", league: "other", category: "club" },
  "sporting-lisbon":       { he: "ספורטינג", en: "Sporting CP", league: "other", category: "club" },

  "celtic":                { he: "סלטיק", en: "Celtic", league: "other", category: "club" },
  "rangers":               { he: "ריינג׳רס", en: "Rangers", league: "other", category: "club" },

  "inter-miami":           { he: "אינטר מיאמי", en: "Inter Miami", league: "other", category: "club" },
  "la-galaxy":             { he: "אל איי גלקסי", en: "LA Galaxy", league: "other", category: "club" },
  "lafc":                  { he: "אל איי אף סי", en: "LAFC", league: "other", category: "club" },
  "dc-united":             { he: "דיסי יונייטד", en: "DC United", league: "other", category: "club" },
  "charlotte-fc":          { he: "שארלוט", en: "Charlotte FC", league: "other", category: "club" },
  "new-england-revolution":{ he: "ניו אינגלנד", en: "New England Revolution", league: "other", category: "club" },
  "atlanta-united":        { he: "אטלנטה יונייטד", en: "Atlanta United", league: "other", category: "club" },
  "seattle-sounders":      { he: "סיאטל סאונדרס", en: "Seattle Sounders", league: "other", category: "club" },

  "boca":                  { he: "בוקה", en: "Boca Juniors", league: "other", category: "club" },
  "river-plate":           { he: "ריבר פלייט", en: "River Plate", league: "other", category: "club" },

  "flamengo":              { he: "פלמנגו", en: "Flamengo", league: "other", category: "club" },
  "santos":                { he: "סנטוס", en: "Santos", league: "other", category: "club" },
  "palmeiras":             { he: "פאלמייראס", en: "Palmeiras", league: "other", category: "club" },
  "corinthians":           { he: "קורינתיאנס", en: "Corinthians", league: "other", category: "club" },
  "sao-paulo":             { he: "סאו פאולו", en: "São Paulo", league: "other", category: "club" },
  "gremio":                { he: "גרמיו", en: "Grêmio", league: "other", category: "club" },
  "fluminense":            { he: "פלומיננסה", en: "Fluminense", league: "other", category: "club" },

  "red-bull-salzburg":     { he: "רד בול זלצבורג", en: "Red Bull Salzburg", league: "other", category: "club" },
  "fenerbahce":            { he: "פנרבחצה", en: "Fenerbahçe", league: "other", category: "club" },
  "galatasaray":           { he: "גלטסראיי", en: "Galatasaray", league: "other", category: "club" },
  "club-brugge":           { he: "קלאב ברוז׳", en: "Club Brugge", league: "other", category: "club" },
  "aberdeen":              { he: "אברדין", en: "Aberdeen", league: "other", category: "club" },
  "al-ahly":               { he: "אל אהלי", en: "Al Ahly", league: "other", category: "club" },
  "tigres":                { he: "טיגרס", en: "Tigres UANL", league: "other", category: "club" },
  "al-nassr":              { he: "אל נאסר", en: "Al Nassr", league: "other", category: "club" },
  "al-hilal":              { he: "אל הילאל", en: "Al Hilal", league: "other", category: "club" },
  "al-ittihad":            { he: "אל איתיחאד", en: "Al Ittihad", league: "other", category: "club" },

  // -- Israel Premier League (real ones) --
  "hapoel-tel-aviv":       { he: "הפועל תל אביב", en: "Hapoel Tel Aviv", league: "israel", category: "club" },
  "maccabi-tel-aviv":      { he: "מכבי תל אביב", en: "Maccabi Tel Aviv", league: "israel", category: "club" },
  "beitar-jerusalem":      { he: "ביתר ירושלים", en: "Beitar Jerusalem", league: "israel", category: "club" },
  "maccabi-haifa":         { he: "מכבי חיפה", en: "Maccabi Haifa", league: "israel", category: "club" },
  "hapoel-beer-sheva":     { he: "הפועל באר שבע", en: "Hapoel Be'er Sheva", league: "israel", category: "club" },
  "hapoel-jerusalem":      { he: "הפועל ירושלים", en: "Hapoel Jerusalem", league: "israel", category: "club" },

  // -- National Teams (Tier 1) --
  "argentina":             { he: "ארגנטינה", en: "Argentina", league: "tier-1", category: "national" },
  "brazil":                { he: "ברזיל", en: "Brazil", league: "tier-1", category: "national" },
  "portugal":              { he: "פורטוגל", en: "Portugal", league: "tier-1", category: "national" },
  "france":                { he: "צרפת", en: "France", league: "tier-1", category: "national" },
  "spain":                 { he: "ספרד", en: "Spain", league: "tier-1", category: "national" },
  "germany":               { he: "גרמניה", en: "Germany", league: "tier-1", category: "national" },
  "england":               { he: "אנגליה", en: "England", league: "tier-1", category: "national" },

  // -- National Teams (Tier 2) --
  "netherlands":           { he: "הולנד", en: "Netherlands", league: "tier-2", category: "national" },
  "italy":                 { he: "איטליה", en: "Italy", league: "tier-2", category: "national" },
  "belgium":               { he: "בלגיה", en: "Belgium", league: "tier-2", category: "national" },
  "japan":                 { he: "יפן", en: "Japan", league: "tier-2", category: "national" },
  "morocco":               { he: "מרוקו", en: "Morocco", league: "tier-2", category: "national" },
  "usa":                   { he: "ארה״ב", en: "USA", league: "tier-2", category: "national" },
  "mexico":                { he: "מקסיקו", en: "Mexico", league: "tier-2", category: "national" },

  // -- National Teams (Tier 3) --
  "colombia":              { he: "קולומביה", en: "Colombia", league: "tier-3", category: "national" },
  "croatia":               { he: "קרואטיה", en: "Croatia", league: "tier-3", category: "national" },
  "turkey":                { he: "טורקיה", en: "Turkey", league: "tier-3", category: "national" },
  "south-korea":           { he: "דרום קוריאה", en: "South Korea", league: "tier-3", category: "national" },
  "saudi-arabia":          { he: "ערב הסעודית", en: "Saudi Arabia", league: "tier-3", category: "national" },
  "scotland":              { he: "סקוטלנד", en: "Scotland", league: "tier-3", category: "national" },
  "switzerland":           { he: "שוויץ", en: "Switzerland", league: "tier-3", category: "national" },
  "norway":                { he: "נורווגיה", en: "Norway", league: "tier-3", category: "national" },
  "chile":                 { he: "צ׳ילה", en: "Chile", league: "tier-3", category: "national" },
  "wales":                 { he: "וויילס", en: "Wales", league: "tier-3", category: "national" },
  "uruguay":               { he: "אורוגוואי", en: "Uruguay", league: "tier-3", category: "national" },
  "ecuador":               { he: "אקוודור", en: "Ecuador", league: "tier-3", category: "national" },
  "ghana":                 { he: "גאנה", en: "Ghana", league: "tier-3", category: "national" },
  "nigeria":               { he: "ניגריה", en: "Nigeria", league: "tier-3", category: "national" },
  "senegal":               { he: "סנגל", en: "Senegal", league: "tier-3", category: "national" },
  "ivory-coast":           { he: "חוף השנהב", en: "Ivory Coast", league: "tier-3", category: "national" },
  "south-africa":          { he: "דרום אפריקה", en: "South Africa", league: "tier-3", category: "national" },
  "egypt":                 { he: "מצרים", en: "Egypt", league: "tier-3", category: "national" },
  "algeria":               { he: "אלג׳יריה", en: "Algeria", league: "tier-3", category: "national" },
  "cameroon":              { he: "קמרון", en: "Cameroon", league: "tier-3", category: "national" },
  "tunisia":               { he: "תוניסיה", en: "Tunisia", league: "tier-3", category: "national" },
  "mali":                  { he: "מאלי", en: "Mali", league: "tier-3", category: "national" },
  "australia":             { he: "אוסטרליה", en: "Australia", league: "tier-3", category: "national" },
  "canada":                { he: "קנדה", en: "Canada", league: "tier-3", category: "national" },
  "ukraine":               { he: "אוקראינה", en: "Ukraine", league: "tier-3", category: "national" },
  "poland":                { he: "פולין", en: "Poland", league: "tier-3", category: "national" },
  "denmark":               { he: "דנמרק", en: "Denmark", league: "tier-3", category: "national" },
  "sweden":                { he: "שוודיה", en: "Sweden", league: "tier-3", category: "national" },
  "austria":               { he: "אוסטריה", en: "Austria", league: "tier-3", category: "national" },
  "serbia":                { he: "סרביה", en: "Serbia", league: "tier-3", category: "national" },
  "ireland":               { he: "אירלנד", en: "Ireland", league: "tier-3", category: "national" },
  "jamaica":               { he: "ג׳מייקה", en: "Jamaica", league: "tier-3", category: "national" },
  "qatar":                 { he: "קטר", en: "Qatar", league: "tier-3", category: "national" },
  "iran":                  { he: "איראן", en: "Iran", league: "tier-3", category: "national" },
  "iraq":                  { he: "עיראק", en: "Iraq", league: "tier-3", category: "national" },
  "venezuela":             { he: "ונצואלה", en: "Venezuela", league: "tier-3", category: "national" },
  "peru":                  { he: "פרו", en: "Peru", league: "tier-3", category: "national" },
  "paraguay":              { he: "פרגוואי", en: "Paraguay", league: "tier-3", category: "national" },
};

// ============================================================================
// 2. Chinese → team-slug dictionary
// ============================================================================

const CN_TO_SLUG = {
  // Premier League
  "曼联": "manchester-united",
  "曼城": "manchester-city",
  "利物浦": "liverpool",
  "阿森纳": "arsenal",
  "切尔西": "chelsea",
  "热刺": "tottenham",
  "纽卡斯": "newcastle",
  "纽卡斯尔": "newcastle",
  "西汉姆": "west-ham",
  "维拉": "aston-villa",
  "阿斯顿维拉": "aston-villa",
  "布莱顿": "brighton",
  "富勒姆": "fulham",
  "埃弗顿": "everton",
  "狼队": "wolves",
  "诺丁汉": "nottingham-forest",
  "莱斯特": "leicester-city",
  "伯恩茅斯": "bournemouth",
  "水晶宫": "crystal-palace",
  "利兹联": "leeds",
  "利兹": "leeds",

  // La Liga
  "皇马": "real-madrid",
  "皇家马德里": "real-madrid",
  "巴萨": "barcelona",
  "巴塞": "barcelona",
  "巴赛": "barcelona",
  "巴塞罗那": "barcelona",
  "马竞": "atletico-madrid",
  "马德里竞技": "atletico-madrid",
  "毕尔巴鄂": "athletic-bilbao",
  "毕尔包": "athletic-bilbao",
  "塞维利亚": "sevilla",
  "贝蒂斯": "real-betis",
  "皇家社会": "real-sociedad",
  "巴伦西亚": "valencia",
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
  "马拉加": "malaga",
  "加迪斯": "cadiz",
  "卡迪斯": "cadiz",

  // Serie A
  "AC米兰": "ac-milan",
  "ac米兰": "ac-milan",
  "米兰": "ac-milan",
  "国米": "inter-milan",
  "国际米兰": "inter-milan",
  "尤文": "juventus",
  "尤文图斯": "juventus",
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

  // Bundesliga
  "拜仁": "bayern-munich",
  "拜仁慕尼黑": "bayern-munich",
  "多特": "borussia-dortmund",
  "多特蒙德": "borussia-dortmund",
  "勒沃库森": "bayer-leverkusen",
  "莱比锡": "rb-leipzig",
  "rb莱比锡": "rb-leipzig",
  "斯图加特": "vfb-stuttgart",
  "法兰克福": "eintracht-frankfurt",
  "门兴": "borussia-monchengladbach",
  "沃尔夫斯堡": "wolfsburg",
  "沙尔克": "schalke",
  "圣保利": "st-pauli",
  "圣保里": "st-pauli",

  // Ligue 1
  "巴黎": "psg",
  "大巴黎": "psg",
  "巴黎圣日耳曼": "psg",
  "马赛": "marseille",
  "里昂": "lyon",
  "摩纳哥": "monaco",
  "里尔": "lille",
  "雷恩": "rennes",
  "尼斯": "nice",

  // Other clubs
  "阿贾克斯": "ajax",
  "埃因霍温": "psv",
  "费耶诺德": "feyenoord",
  "阿尔克马尔": "az-alkmaar",
  "本菲卡": "benfica",
  "波尔图": "porto",
  "葡萄牙体育": "sporting-lisbon",
  "里斯本竞技": "sporting-lisbon",
  "凯尔特人": "celtic",
  "流浪者": "rangers",

  "迈阿密": "inter-miami",
  "国际迈阿密": "inter-miami",
  "洛杉矶银河": "la-galaxy",
  "洛杉矶FC": "lafc",
  "华盛顿": "dc-united",
  "华盛顿联": "dc-united",
  "夏洛特": "charlotte-fc",
  "新英格兰": "new-england-revolution",
  "亚特兰大联": "atlanta-united",
  "西雅图": "seattle-sounders",

  "博卡": "boca",
  "博卡青年": "boca",
  "河床": "river-plate",
  "弗拉门戈": "flamengo",
  "桑托斯": "santos",
  "帕尔梅拉斯": "palmeiras",
  "科林蒂安": "corinthians",
  "圣保罗": "sao-paulo",
  "格雷米奥": "gremio",

  "萨尔茨堡": "red-bull-salzburg",
  "费内巴切": "fenerbahce",
  "加拉塔萨雷": "galatasaray",
  "布鲁日": "club-brugge",
  "阿伯丁": "aberdeen",
  "开罗国民": "al-ahly",
  "阿赫利": "al-ahly",
  "老虎": "tigres",
  "提格雷斯": "tigres",
  "利雅得新月": "al-hilal",
  "利雅得胜利": "al-nassr",
  "吉达国民": "al-ittihad",
  "麦隆": "cameroon",
  "万城": "manchester-city",
  "万联": "manchester-united",
  "里斯本竞技": "sporting-lisbon",

  // Israeli (real)
  "特拉维夫工人": "hapoel-tel-aviv",
  "工人特拉维夫": "hapoel-tel-aviv",
  "马卡比特拉维夫": "maccabi-tel-aviv",
  "贝塔尔耶路撒冷": "beitar-jerusalem",
  "马卡比海法": "maccabi-haifa",

  // Nationals
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
};

// ============================================================================
// 3. Hebrew → team-slug dictionary (for products without sourceHandleCn)
// ============================================================================

const HE_TO_SLUG = {};
for (const [slug, t] of Object.entries(TEAMS)) {
  HE_TO_SLUG[t.he] = slug;
}
// Aliases (yupoo/sporthub variants)
const HE_ALIASES = {
  "מנצ׳סטר יוניטד": "manchester-united",
  "מנצ'סטר יונייטד": "manchester-united",
  "מנצ'סטר יוניטד": "manchester-united",
  "מנצסטר יונייטד": "manchester-united",
  "מנצ׳סטר סיטי": "manchester-city",
  "מנצ'סטר סיטי": "manchester-city",
  "מנצסטר סיטי": "manchester-city",
  "סיטי": "manchester-city",
  "ספרס": "tottenham",
  "טוטהנאם": "tottenham",
  "צ'לסי": "chelsea",
  "צלסי": "chelsea",
  "באירן": "bayern-munich",
  "באירן מינכן": "bayern-munich",
  "פסז": "psg",
  "פריז סן ז'רמן": "psg",
  "פריס": "psg",
  "מילן": "ac-milan",
  "אינטר מילאן": "inter-milan",
  "ריאל": "real-madrid",
  "ברסה": "barcelona",
  "אטלטיקו": "atletico-madrid",
  "אטלטיקו מדריד": "atletico-madrid",
  "וויריאל": "villarreal",
  "ויאריאל": "villarreal",
  "ויירל": "villarreal",
  "לאצה": "lecce",
  "לצה": "lecce",
  "אלקמר": "az-alkmaar",
  "שארלוט": "charlotte-fc",
  "דיסי ייוניטד": "dc-united",
  "די.סי. יונייטד": "dc-united",
  "דיסי יונייטד": "dc-united",
  "ניו אינגלנד": "new-england-revolution",
  "אייקס": "ajax",
  "פסוו": "psv",
  "רייבר פלייט": "river-plate",
  "ריבר פלייט": "river-plate",
  "בארגה": "red-bull-salzburg", // Salzburg uses "Bragga" branding sometimes
  "זלצבורג": "red-bull-salzburg",
  "רד בול זלצבורג": "red-bull-salzburg",
  "בוקה ג'וניורס": "boca",
  "בוקה גוניורס": "boca",
  "בוקה ג׳וניורס": "boca",
  "ארה״ב": "usa",
  "ארה ב": "usa",
  "ארהב": "usa",
  "פאולי": "st-pauli",
  "פארמטה": "parma",
  "פרמה": "parma",
  "אברדין": "aberdeen",
  "אל אהלי": "al-ahly",
  "אל-אהלי": "al-ahly",
  "טיגרס": "tigres",
  "אל נאסר": "al-nassr",
  "אל הילאל": "al-hilal",
  "אל איתיחאד": "al-ittihad",
  "מלאגה": "malaga",
  "קאדיז": "cadiz",
  "לידס": "leeds",
  "לידס יונייטד": "leeds",
};
Object.assign(HE_TO_SLUG, HE_ALIASES);

// ============================================================================
// 4. Helpers
// ============================================================================

const COLOR_HE = ["ירוק","אדום","כחול","לבן","שחור","צהוב","סגול","ורוד","כתום","אפור","חום","בורדו","תכלת","נייבי","כסף","זהב"];
const TYPE_HE = ["שלישי","שוער","רטרו","מיוחד","מיוחדת","בית","חוץ","שני","מהדורה","סט","ילדים","שרוול","ארוך","ארוכה"];
const NOISE_HE = ["חולצת","כדורגל","חולצה","כדוגל","2025/26","2024/25","2023/24","2022/23","2026/27","מונדיאל"];

function stripHebrewWord(str, word) {
  return str.replace(
    new RegExp(`(^|[\\s.,:()'"\u05f4\u05f3/-])${word}(?=[\\s.,:()'"\u05f4\u05f3/-]|$)`, "g"),
    "$1",
  );
}

function normHe(s) {
  return (s || "")
    .replace(/['ʼ`]/g, "׳")
    .replace(/[״"׳]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function deriveFromCn(cn) {
  if (!cn) return null;
  // Sort dictionary by Chinese length DESC so we match longer phrases first
  const entries = Object.entries(CN_TO_SLUG).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [chinese, slug] of entries) {
    if (cn.includes(chinese)) return slug;
  }
  return null;
}

function deriveFromHe(name) {
  if (!name) return null;

  // Strip Chinese first
  let str = name.replace(/[\u4e00-\u9fa5]/g, " ");
  // Strip leading season prefix
  str = str.replace(/^\s*\d{2,4}[-/]\d{2,4}\s*/, "").trim();
  str = str.replace(/^\s*\d{4}\s+/, "").trim();
  // Strip noise/types/colors
  for (const w of NOISE_HE) str = stripHebrewWord(str, w);
  for (const w of COLOR_HE) str = stripHebrewWord(str, w);
  for (const w of TYPE_HE) str = stripHebrewWord(str, w);
  // Strip remaining digits/punct
  str = str.replace(/[0-9]+/g, " ").replace(/[״׳"'.,:()-]+/g, " ").replace(/\s+/g, " ").trim();

  // Direct match
  if (HE_TO_SLUG[str]) return HE_TO_SLUG[str];

  // Normalized exact match
  const normTarget = normHe(str);
  for (const [he, slug] of Object.entries(HE_TO_SLUG)) {
    if (normHe(he) === normTarget) return slug;
  }

  // Substring match — find longest hebrew team name contained in cleaned input
  const candidates = [];
  for (const [he, slug] of Object.entries(HE_TO_SLUG)) {
    if (!he || he.length < 3) continue;
    const nHe = normHe(he);
    if (normTarget.includes(nHe)) {
      candidates.push({ he, slug, len: nHe.length });
    }
  }
  candidates.sort((a, b) => b.len - a.len);
  if (candidates.length) return candidates[0].slug;

  // Reverse — input contained in team name? (rare but worth checking)
  for (const [he, slug] of Object.entries(HE_TO_SLUG)) {
    if (he.length < 4) continue;
    const nHe = normHe(he);
    if (nHe.length >= 4 && nHe.includes(normTarget) && normTarget.length >= 3) {
      return slug;
    }
  }

  return null;
}

// ============================================================================
// 5. Process
// ============================================================================

const stats = {
  fixedFromCn: 0,
  fixedFromHe: 0,
  unchanged: 0,
  unresolved: 0,
  unresolvedSamples: [],
  beforeIsraeli: 0,
  afterIsraeli: 0,
};

for (const p of products) {
  if (p.league === "israel") stats.beforeIsraeli++;
}

const RESERVED_NAMES = new Set([
  "Unknown",
  "ישראלי",
  "Gift card",
  "",
]);

for (const p of products) {
  // Try Chinese first
  let derivedSlug = null;
  let source = "";
  if (p.sourceHandleCn) {
    derivedSlug = deriveFromCn(p.sourceHandleCn);
    if (derivedSlug) source = "cn";
  }

  // Then try Hebrew name
  if (!derivedSlug && p.nameHe) {
    derivedSlug = deriveFromHe(p.nameHe);
    if (derivedSlug) source = "he";
  }

  // Skip if old team is already correct + we couldn't improve
  if (!derivedSlug) {
    // Check if existing team is meaningful and not a reserved value
    if (p.team && !RESERVED_NAMES.has(p.team) && !p.team.includes("ישראלי")) {
      stats.unchanged++;
      continue;
    }
    // We couldn't resolve — leave as Unknown
    stats.unresolved++;
    if (stats.unresolvedSamples.length < 30) {
      stats.unresolvedSamples.push(
        `cn=${p.sourceHandleCn || ""} | he=${p.nameHe || ""}`,
      );
    }
    continue;
  }

  // Apply derived team
  const tr = TEAMS[derivedSlug];
  if (!tr) continue;

  const oldTeam = p.team;
  const oldLeague = p.league;
  p.teamSlug = derivedSlug;
  p.team = tr.he;
  p.league = tr.league;
  p.category = tr.category;

  if (source === "cn") stats.fixedFromCn++;
  else stats.fixedFromHe++;

  if (oldLeague === "israel" && tr.league !== "israel") {
    // moved out of Israel
  }
}

// ============================================================================
// 5b. Remove obvious junk products
// ============================================================================

const JUNK_NAMES = ["Gift card", "Shipping Protection", "rise-ai-giftcard"];
const before = products.length;
const cleaned = products.filter((p) => {
  if (JUNK_NAMES.includes(p.nameHe)) return false;
  if (JUNK_NAMES.includes(p.team)) return false;
  if ((p.sourceHandle || "").includes("rise-ai-giftcard")) return false;
  return true;
});
const removed = before - cleaned.length;

for (const p of cleaned) {
  if (p.league === "israel") stats.afterIsraeli++;
}

// ============================================================================
// 6. Save + report
// ============================================================================

writeFileSync(
  "./data/sporthub-products.json",
  JSON.stringify(cleaned, null, 2),
);

console.log("=== TEAM RE-DERIVATION ===");
console.log("Total products before:", products.length);
console.log("Total products after :", cleaned.length, "(" + removed + " junk removed)");
console.log("Fixed via Chinese    :", stats.fixedFromCn);
console.log("Fixed via Hebrew     :", stats.fixedFromHe);
console.log("Unchanged (already OK):", stats.unchanged);
console.log("Unresolved           :", stats.unresolved);
console.log("");
console.log("Israel league:", stats.beforeIsraeli, "→", stats.afterIsraeli);
console.log("");
console.log("Sample unresolved (first 30):");
stats.unresolvedSamples.forEach((s) => console.log("  · " + s.slice(0, 130)));
