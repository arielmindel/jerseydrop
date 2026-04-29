#!/usr/bin/env node
/**
 * Master audit — extract every team-identifying signal from every field of
 * every product, vote among them, and snap each product to the correct
 * team / league / category.
 *
 * Signals (in confidence order, high to low):
 *   1. images[].filename — supplier-coded English/transliterated filenames
 *      like "Napoli_2023.jpg", "rgntynh-hwz-2026.jpg"
 *   2. sourceHandle — Hebrew URL slug from sporthubkit.com — usually correct
 *   3. nameHe — display name; can drift after the supplier "copy-of"s a SKU
 *   4. sourceHandleCn — Chinese supplier handle; clean signal but only
 *      for ~half the catalogue
 *   5. tags — supplier-set tags
 *
 * Decision rule: each signal votes for a team slug. If 2+ signals agree,
 * snap. If only one signal fires, snap if confidence ≥ 80% (i.e. an exact
 * dictionary hit, not a substring guess). If no signals fire → mark
 * isSpecial=true (the user's instruction for genuinely unidentifiable
 * SKUs).
 *
 * League rule (per user): assign by "well-known club" — Sunderland,
 * Leeds, etc. land in Premier League even if currently in Championship.
 */

import fs from "node:fs";

const FILE = "data/sporthub-products.json";
const REPORT = "docs/MASTER_AUDIT.json";
const APPLY = process.argv.includes("--apply");
const products = JSON.parse(fs.readFileSync(FILE, "utf8"));

// ---------------------------------------------------------------------------
// TEAM REGISTRY: slug → { he, en, league, category, aliases[] }
// ---------------------------------------------------------------------------

const TEAMS = {
  // ===== Premier League (assigned per user: well-known clubs even if
  //       currently in Championship — they get folded into PL).
  //       We also keep some EFL clubs here under the user's "doesn't matter"
  //       guidance (Sunderland, Leeds, Derby etc.) =====
  "derby-county": { he: "דרבי קאונטי", en: "Derby County", league: "premier-league", category: "club" },
  "sheffield-united": { he: "שפילד יונייטד", en: "Sheffield United", league: "premier-league", category: "club" },
  "sheffield-wednesday": { he: "שפילד וונסדיי", en: "Sheffield Wednesday", league: "premier-league", category: "club" },
  burnley: { he: "ברנלי", en: "Burnley", league: "premier-league", category: "club" },
  "luton-town": { he: "לוטון", en: "Luton Town", league: "premier-league", category: "club" },
  "manchester-united": { he: "מנצ׳סטר יונייטד", en: "Manchester United", league: "premier-league", category: "club" },
  "manchester-city": { he: "מנצ׳סטר סיטי", en: "Manchester City", league: "premier-league", category: "club" },
  liverpool: { he: "ליברפול", en: "Liverpool", league: "premier-league", category: "club" },
  arsenal: { he: "ארסנל", en: "Arsenal", league: "premier-league", category: "club" },
  chelsea: { he: "צ׳לסי", en: "Chelsea", league: "premier-league", category: "club" },
  tottenham: { he: "טוטנהאם", en: "Tottenham", league: "premier-league", category: "club" },
  newcastle: { he: "ניוקאסל", en: "Newcastle", league: "premier-league", category: "club" },
  "aston-villa": { he: "אסטון וילה", en: "Aston Villa", league: "premier-league", category: "club" },
  everton: { he: "אברטון", en: "Everton", league: "premier-league", category: "club" },
  brighton: { he: "ברייטון", en: "Brighton", league: "premier-league", category: "club" },
  wolves: { he: "וולבס", en: "Wolves", league: "premier-league", category: "club" },
  "west-ham": { he: "ווסט האם", en: "West Ham", league: "premier-league", category: "club" },
  leeds: { he: "לידס", en: "Leeds", league: "premier-league", category: "club" },
  fulham: { he: "פולהם", en: "Fulham", league: "premier-league", category: "club" },
  "leicester-city": { he: "לסטר סיטי", en: "Leicester", league: "premier-league", category: "club" },
  "nottingham-forest": { he: "נוטינגהאם פורסט", en: "Nottingham Forest", league: "premier-league", category: "club" },
  "crystal-palace": { he: "קריסטל פאלאס", en: "Crystal Palace", league: "premier-league", category: "club" },
  sunderland: { he: "סנדרלנד", en: "Sunderland", league: "premier-league", category: "club" },
  bournemouth: { he: "בורנמות׳", en: "Bournemouth", league: "premier-league", category: "club" },
  brentford: { he: "ברנטפורד", en: "Brentford", league: "premier-league", category: "club" },
  southampton: { he: "סאות׳המפטון", en: "Southampton", league: "premier-league", category: "club" },
  "ipswich-town": { he: "איפסוויץ׳", en: "Ipswich Town", league: "premier-league", category: "club" },

  // ===== La Liga =====
  "real-madrid": { he: "ריאל מדריד", en: "Real Madrid", league: "la-liga", category: "club" },
  barcelona: { he: "ברצלונה", en: "Barcelona", league: "la-liga", category: "club" },
  "atletico-madrid": { he: "אתלטיקו מדריד", en: "Atletico Madrid", league: "la-liga", category: "club" },
  "athletic-bilbao": { he: "אתלטיק בילבאו", en: "Athletic Bilbao", league: "la-liga", category: "club" },
  sevilla: { he: "סביליה", en: "Sevilla", league: "la-liga", category: "club" },
  "real-betis": { he: "ריאל בטיס", en: "Real Betis", league: "la-liga", category: "club" },
  "real-sociedad": { he: "ריאל סוסיאדד", en: "Real Sociedad", league: "la-liga", category: "club" },
  valencia: { he: "ולנסיה", en: "Valencia", league: "la-liga", category: "club" },
  villarreal: { he: "ויאריאל", en: "Villarreal", league: "la-liga", category: "club" },
  girona: { he: "ז׳ירונה", en: "Girona", league: "la-liga", category: "club" },
  "celta-vigo": { he: "סלטה ויגו", en: "Celta Vigo", league: "la-liga", category: "club" },
  "real-valladolid": { he: "וויאדוליד", en: "Real Valladolid", league: "la-liga", category: "club" },
  granada: { he: "גרנדה", en: "Granada", league: "la-liga", category: "club" },
  malaga: { he: "מלאגה", en: "Malaga", league: "la-liga", category: "club" },
  cadiz: { he: "קדיס", en: "Cadiz", league: "la-liga", category: "club" },
  espanyol: { he: "אספניול", en: "Espanyol", league: "la-liga", category: "club" },
  alaves: { he: "אלאבס", en: "Alaves", league: "la-liga", category: "club" },
  "deportivo-la-coruna": { he: "דפורטיבו", en: "Deportivo", league: "la-liga", category: "club" },
  levante: { he: "לבנטה", en: "Levante", league: "la-liga", category: "club" },
  mallorca: { he: "מאיורקה", en: "Mallorca", league: "la-liga", category: "club" },
  "las-palmas": { he: "לאס פלמאס", en: "Las Palmas", league: "la-liga", category: "club" },
  getafe: { he: "חטאפה", en: "Getafe", league: "la-liga", category: "club" },
  "rayo-vallecano": { he: "ראיו ויאקאנו", en: "Rayo Vallecano", league: "la-liga", category: "club" },
  osasuna: { he: "אוססונה", en: "Osasuna", league: "la-liga", category: "club" },

  // ===== Serie A =====
  "ac-milan": { he: "מילאן", en: "AC Milan", league: "serie-a", category: "club" },
  "inter-milan": { he: "אינטר מילאן", en: "Inter Milan", league: "serie-a", category: "club" },
  juventus: { he: "יובנטוס", en: "Juventus", league: "serie-a", category: "club" },
  napoli: { he: "נאפולי", en: "Napoli", league: "serie-a", category: "club" },
  roma: { he: "רומא", en: "Roma", league: "serie-a", category: "club" },
  lazio: { he: "לאציו", en: "Lazio", league: "serie-a", category: "club" },
  fiorentina: { he: "פיורנטינה", en: "Fiorentina", league: "serie-a", category: "club" },
  atalanta: { he: "אטאלנטה", en: "Atalanta", league: "serie-a", category: "club" },
  bologna: { he: "בולוניה", en: "Bologna", league: "serie-a", category: "club" },
  parma: { he: "פארמה", en: "Parma", league: "serie-a", category: "club" },
  lecce: { he: "לצ׳ה", en: "Lecce", league: "serie-a", category: "club" },
  como: { he: "קומו", en: "Como", league: "serie-a", category: "club" },
  torino: { he: "טורינו", en: "Torino", league: "serie-a", category: "club" },
  udinese: { he: "אודינזה", en: "Udinese", league: "serie-a", category: "club" },
  cagliari: { he: "קליארי", en: "Cagliari", league: "serie-a", category: "club" },
  genoa: { he: "ג׳נואה", en: "Genoa", league: "serie-a", category: "club" },

  // ===== Bundesliga =====
  "bayern-munich": { he: "באיירן מינכן", en: "Bayern Munich", league: "bundesliga", category: "club" },
  "borussia-dortmund": { he: "דורטמונד", en: "Borussia Dortmund", league: "bundesliga", category: "club" },
  "bayer-leverkusen": { he: "באייר לברקוזן", en: "Bayer Leverkusen", league: "bundesliga", category: "club" },
  "rb-leipzig": { he: "רדבול לייפציג", en: "RB Leipzig", league: "bundesliga", category: "club" },
  "vfb-stuttgart": { he: "שטוטגרט", en: "VfB Stuttgart", league: "bundesliga", category: "club" },
  "st-pauli": { he: "סנט פאולי", en: "St. Pauli", league: "bundesliga", category: "club" },
  "eintracht-frankfurt": { he: "פרנקפורט", en: "Eintracht Frankfurt", league: "bundesliga", category: "club" },
  wolfsburg: { he: "וולפסבורג", en: "Wolfsburg", league: "bundesliga", category: "club" },
  "hertha-berlin": { he: "הרטה ברלין", en: "Hertha Berlin", league: "bundesliga", category: "club" },
  schalke: { he: "שלקה", en: "Schalke", league: "bundesliga", category: "club" },
  "borussia-monchengladbach": { he: "מנשנגלדבך", en: "Borussia M'gladbach", league: "bundesliga", category: "club" },
  "werder-bremen": { he: "וורדר ברמן", en: "Werder Bremen", league: "bundesliga", category: "club" },

  // ===== Ligue 1 =====
  psg: { he: "פריז סן ז׳רמן", en: "PSG", league: "ligue-1", category: "club" },
  marseille: { he: "מארסיי", en: "Marseille", league: "ligue-1", category: "club" },
  lyon: { he: "ליון", en: "Lyon", league: "ligue-1", category: "club" },
  monaco: { he: "מונאקו", en: "Monaco", league: "ligue-1", category: "club" },
  nice: { he: "ניס", en: "Nice", league: "ligue-1", category: "club" },
  lille: { he: "ליל", en: "Lille", league: "ligue-1", category: "club" },
  brest: { he: "ברסט", en: "Brest", league: "ligue-1", category: "club" },
  rennes: { he: "רן", en: "Rennes", league: "ligue-1", category: "club" },

  // ===== Other (non-Big-5 European + global) =====
  ajax: { he: "אייאקס", en: "Ajax", league: "other", category: "club" },
  feyenoord: { he: "פיינורד", en: "Feyenoord", league: "other", category: "club" },
  psv: { he: "פ.ס.וו אינדהובן", en: "PSV", league: "other", category: "club" },
  "az-alkmaar": { he: "אלקמר", en: "AZ Alkmaar", league: "other", category: "club" },
  "aek-athens": { he: "אאק אתונה", en: "AEK Athens", league: "other", category: "club" },
  benfica: { he: "בנפיקה", en: "Benfica", league: "other", category: "club" },
  porto: { he: "פורטו", en: "Porto", league: "other", category: "club" },
  "sporting-lisbon": { he: "ספורטינג ליסבון", en: "Sporting CP", league: "other", category: "club" },
  braga: { he: "בראגה", en: "Braga", league: "other", category: "club" },
  celtic: { he: "סלטיק", en: "Celtic", league: "other", category: "club" },
  rangers: { he: "רנג׳רס", en: "Rangers", league: "other", category: "club" },
  aberdeen: { he: "אברדין", en: "Aberdeen", league: "other", category: "club" },
  fenerbahce: { he: "פנרבחצ׳ה", en: "Fenerbahce", league: "other", category: "club" },
  galatasaray: { he: "גלאטאסארי", en: "Galatasaray", league: "other", category: "club" },
  besiktas: { he: "בשיקטאש", en: "Besiktas", league: "other", category: "club" },
  "trabzonspor": { he: "טרבזונספור", en: "Trabzonspor", league: "other", category: "club" },
  "olympiakos": { he: "אולימפיאקוס", en: "Olympiakos", league: "other", category: "club" },
  "panathinaikos": { he: "פאנאתינייקוס", en: "Panathinaikos", league: "other", category: "club" },
  "dinamo-zagreb": { he: "דינמו זאגרב", en: "Dinamo Zagreb", league: "other", category: "club" },
  "red-bull-salzburg": { he: "רד בול זלצבורג", en: "RB Salzburg", league: "other", category: "club" },
  "shakhtar-donetsk": { he: "שאחטר דוניצק", en: "Shakhtar Donetsk", league: "other", category: "club" },

  // MLS / Concacaf
  "inter-miami": { he: "אינטר מיאמי", en: "Inter Miami", league: "other", category: "club" },
  "la-galaxy": { he: "LA גלקסי", en: "LA Galaxy", league: "other", category: "club" },
  "lafc": { he: "LAFC", en: "LAFC", league: "other", category: "club" },
  "new-england-revolution": { he: "ניו אינגלנד", en: "New England Revolution", league: "other", category: "club" },
  "charlotte-fc": { he: "שרלוט", en: "Charlotte FC", league: "other", category: "club" },
  "atlanta-united": { he: "אטלנטה יונייטד", en: "Atlanta United", league: "other", category: "club" },
  "dc-united": { he: "די.סי. יונייטד", en: "DC United", league: "other", category: "club" },
  "ny-city-fc": { he: "ניו יורק סיטי", en: "NYCFC", league: "other", category: "club" },
  "ny-red-bulls": { he: "ניו יורק רד בולס", en: "NY Red Bulls", league: "other", category: "club" },
  "seattle-sounders": { he: "סיאטל סאונדרס", en: "Seattle Sounders", league: "other", category: "club" },
  "portland-timbers": { he: "פורטלנד טימברס", en: "Portland Timbers", league: "other", category: "club" },
  tigres: { he: "טיגרס", en: "Tigres UANL", league: "other", category: "club" },
  monterrey: { he: "מונטריי", en: "Monterrey", league: "other", category: "club" },
  "club-america": { he: "קלוב אמריקה", en: "Club America", league: "other", category: "club" },
  pumas: { he: "פומאס", en: "Pumas UNAM", league: "other", category: "club" },
  "cruz-azul": { he: "קרוז אסול", en: "Cruz Azul", league: "other", category: "club" },
  chivas: { he: "צ׳יבאס", en: "Chivas", league: "other", category: "club" },
  millonarios: { he: "מיליונריוס", en: "Millonarios", league: "other", category: "club" },
  "universidad-catolica": { he: "אוניברסידד קתוליקה", en: "Universidad Católica", league: "other", category: "club" },
  "colo-colo": { he: "קולו קולו", en: "Colo-Colo", league: "other", category: "club" },
  "atletico-nacional": { he: "אטלטיקו נסיונל", en: "Atlético Nacional", league: "other", category: "club" },

  // South America
  flamengo: { he: "פלמנגו", en: "Flamengo", league: "other", category: "club" },
  santos: { he: "סנטוס", en: "Santos", league: "other", category: "club" },
  palmeiras: { he: "פאלמיירס", en: "Palmeiras", league: "other", category: "club" },
  corinthians: { he: "קורינתיאנס", en: "Corinthians", league: "other", category: "club" },
  "atletico-mineiro": { he: "אתלטיקו מינייהו", en: "Atletico Mineiro", league: "other", category: "club" },
  botafogo: { he: "בוטפוגו", en: "Botafogo", league: "other", category: "club" },
  fluminense: { he: "פלומיננסה", en: "Fluminense", league: "other", category: "club" },
  vasco: { he: "וסקו דה גאמה", en: "Vasco da Gama", league: "other", category: "club" },
  cruzeiro: { he: "קרוזיירו", en: "Cruzeiro", league: "other", category: "club" },
  gremio: { he: "גרמיו", en: "Grêmio", league: "other", category: "club" },
  internacional: { he: "אינטרנסיונל", en: "Internacional", league: "other", category: "club" },
  "young-boys": { he: "יאנג בויס", en: "Young Boys", league: "other", category: "club" },
  basel: { he: "באזל", en: "Basel", league: "other", category: "club" },
  "wrexham": { he: "וורקסהאם", en: "Wrexham", league: "other", category: "club" },
  coventry: { he: "קונבטרי", en: "Coventry", league: "other", category: "club" },
  "sao-paulo": { he: "סאו פאולו", en: "São Paulo", league: "other", category: "club" },
  "boca-juniors": { he: "בוקה גוניורס", en: "Boca Juniors", league: "other", category: "club" },
  "river-plate": { he: "ריבר פלייט", en: "River Plate", league: "other", category: "club" },

  // Saudi / MENA
  "al-nassr": { he: "אל נאסר", en: "Al Nassr", league: "other", category: "club" },
  "al-hilal": { he: "אל הילאל", en: "Al Hilal", league: "other", category: "club" },
  "al-ahly": { he: "אל אהלי", en: "Al Ahly", league: "other", category: "club" },
  "al-ittihad": { he: "אל איתחאד", en: "Al Ittihad", league: "other", category: "club" },

  // Israel (per user: restore if found in catalog)
  "hapoel-tel-aviv": { he: "הפועל תל אביב", en: "Hapoel Tel Aviv", league: "israel", category: "club" },
  "maccabi-tel-aviv": { he: "מכבי תל אביב", en: "Maccabi Tel Aviv", league: "israel", category: "club" },
  "beitar-jerusalem": { he: "ביתר ירושלים", en: "Beitar Jerusalem", league: "israel", category: "club" },
  "maccabi-haifa": { he: "מכבי חיפה", en: "Maccabi Haifa", league: "israel", category: "club" },
  "hapoel-haifa": { he: "הפועל חיפה", en: "Hapoel Haifa", league: "israel", category: "club" },

  // ===== Nations — tier-1 (must-have World Cup) =====
  argentina: { he: "ארגנטינה", en: "Argentina", league: "tier-1", category: "national" },
  brazil: { he: "ברזיל", en: "Brazil", league: "tier-1", category: "national" },
  france: { he: "צרפת", en: "France", league: "tier-1", category: "national" },
  germany: { he: "גרמניה", en: "Germany", league: "tier-1", category: "national" },
  spain: { he: "ספרד", en: "Spain", league: "tier-1", category: "national" },
  portugal: { he: "פורטוגל", en: "Portugal", league: "tier-1", category: "national" },
  england: { he: "אנגליה", en: "England", league: "tier-1", category: "national" },

  // ===== tier-2 =====
  italy: { he: "איטליה", en: "Italy", league: "tier-2", category: "national" },
  netherlands: { he: "הולנד", en: "Netherlands", league: "tier-2", category: "national" },
  belgium: { he: "בלגיה", en: "Belgium", league: "tier-2", category: "national" },
  morocco: { he: "מרוקו", en: "Morocco", league: "tier-2", category: "national" },
  japan: { he: "יפן", en: "Japan", league: "tier-2", category: "national" },
  mexico: { he: "מקסיקו", en: "Mexico", league: "tier-2", category: "national" },
  usa: { he: "ארה״ב", en: "USA", league: "tier-2", category: "national" },
  uruguay: { he: "אורוגוואי", en: "Uruguay", league: "tier-2", category: "national" },
  "south-korea": { he: "דרום קוריאה", en: "South Korea", league: "tier-2", category: "national" },
  croatia: { he: "קרואטיה", en: "Croatia", league: "tier-2", category: "national" },

  // ===== tier-3 =====
  colombia: { he: "קולומביה", en: "Colombia", league: "tier-3", category: "national" },
  turkey: { he: "טורקיה", en: "Turkey", league: "tier-3", category: "national" },
  nigeria: { he: "ניגריה", en: "Nigeria", league: "tier-3", category: "national" },
  senegal: { he: "סנגל", en: "Senegal", league: "tier-3", category: "national" },
  cameroon: { he: "קמרון", en: "Cameroon", league: "tier-3", category: "national" },
  algeria: { he: "אלג׳יריה", en: "Algeria", league: "tier-3", category: "national" },
  tunisia: { he: "תוניסיה", en: "Tunisia", league: "tier-3", category: "national" },
  "ivory-coast": { he: "חוף השנהב", en: "Ivory Coast", league: "tier-3", category: "national" },
  "south-africa": { he: "דרום אפריקה", en: "South Africa", league: "tier-3", category: "national" },
  egypt: { he: "מצרים", en: "Egypt", league: "tier-3", category: "national" },
  mali: { he: "מאלי", en: "Mali", league: "tier-3", category: "national" },
  jamaica: { he: "ג׳מייקה", en: "Jamaica", league: "tier-3", category: "national" },
  ghana: { he: "גאנה", en: "Ghana", league: "tier-3", category: "national" },
  scotland: { he: "סקוטלנד", en: "Scotland", league: "tier-3", category: "national" },
  ireland: { he: "אירלנד", en: "Ireland", league: "tier-3", category: "national" },
  wales: { he: "וויילס", en: "Wales", league: "tier-3", category: "national" },
  switzerland: { he: "שוויץ", en: "Switzerland", league: "tier-3", category: "national" },
  poland: { he: "פולין", en: "Poland", league: "tier-3", category: "national" },
  denmark: { he: "דנמרק", en: "Denmark", league: "tier-3", category: "national" },
  sweden: { he: "שוודיה", en: "Sweden", league: "tier-3", category: "national" },
  norway: { he: "נורבגיה", en: "Norway", league: "tier-3", category: "national" },
  finland: { he: "פינלנד", en: "Finland", league: "tier-3", category: "national" },
  iceland: { he: "איסלנד", en: "Iceland", league: "tier-3", category: "national" },
  austria: { he: "אוסטריה", en: "Austria", league: "tier-3", category: "national" },
  hungary: { he: "הונגריה", en: "Hungary", league: "tier-3", category: "national" },
  romania: { he: "רומניה", en: "Romania", league: "tier-3", category: "national" },
  serbia: { he: "סרביה", en: "Serbia", league: "tier-3", category: "national" },
  ukraine: { he: "אוקראינה", en: "Ukraine", league: "tier-3", category: "national" },
  russia: { he: "רוסיה", en: "Russia", league: "tier-3", category: "national" },
  greece: { he: "יוון", en: "Greece", league: "tier-3", category: "national" },
  "czech-republic": { he: "צ׳כיה", en: "Czech Republic", league: "tier-3", category: "national" },
  "saudi-arabia": { he: "ערב הסעודית", en: "Saudi Arabia", league: "tier-3", category: "national" },
  iran: { he: "איראן", en: "Iran", league: "tier-3", category: "national" },
  iraq: { he: "עיראק", en: "Iraq", league: "tier-3", category: "national" },
  qatar: { he: "קטאר", en: "Qatar", league: "tier-3", category: "national" },
  australia: { he: "אוסטרליה", en: "Australia", league: "tier-3", category: "national" },
  china: { he: "סין", en: "China", league: "tier-3", category: "national" },
  "new-zealand": { he: "ניו זילנד", en: "New Zealand", league: "tier-3", category: "national" },
  canada: { he: "קנדה", en: "Canada", league: "tier-3", category: "national" },
  chile: { he: "צ׳ילה", en: "Chile", league: "tier-3", category: "national" },
  peru: { he: "פרו", en: "Peru", league: "tier-3", category: "national" },
  ecuador: { he: "אקוודור", en: "Ecuador", league: "tier-3", category: "national" },
  venezuela: { he: "ונצואלה", en: "Venezuela", league: "tier-3", category: "national" },
  paraguay: { he: "פרגוואי", en: "Paraguay", league: "tier-3", category: "national" },
  bolivia: { he: "בוליביה", en: "Bolivia", league: "tier-3", category: "national" },
  costa: { he: "קוסטה ריקה", en: "Costa Rica", league: "tier-3", category: "national" },
  panama: { he: "פנמה", en: "Panama", league: "tier-3", category: "national" },
};

// ---------------------------------------------------------------------------
// SIGNAL DICTIONARIES — text patterns → team slug
// ---------------------------------------------------------------------------

/** Hebrew text → slug. Multi-word entries first; first-match-wins loop. */
const HE_DICT = [
  // Disambiguators (multi-word, must run before single-word fallbacks)
  ["מנצסטר יונייטד", "manchester-united"],
  ["מנצסטר יוניטד", "manchester-united"],
  ["מנצ׳סטר יונייטד", "manchester-united"],
  ["מנצ׳סטר יוניטד", "manchester-united"],
  ["מנצסטר סיטי", "manchester-city"],
  ["מנצ׳סטר סיטי", "manchester-city"],
  // Multi-word "X יוניטד" entries — must be BEFORE the catch-all "יוניטד"
  ["לידס יוניטד", "leeds"],
  ["לידס יונייטד", "leeds"],
  ["שפילד יונייטד", "sheffield-united"],
  ["שפילד יוניטד", "sheffield-united"],
  ["דיסי יונייטד", "dc-united"],
  ["דיסי יוניטד", "dc-united"],
  ["די.סי. יוניטד", "dc-united"],
  ["די.סי יונייטד", "dc-united"],
  ["די.סי. יונייטד", "dc-united"],
  ["דיסי-יונייטד", "dc-united"],
  ["אטלנטה יונייטד", "atlanta-united"],
  ["אטלנטה יוניטד", "atlanta-united"],
  ["ניו אינגלנד", "new-england-revolution"],
  ["ניו אנגלנד", "new-england-revolution"],
  // Catch-all: lone "יוניטד" / "יונייטד" — most often Manchester United
  ["יוניטד", "manchester-united"],
  ["יונייטד", "manchester-united"],
  ["יונייטד", "manchester-united"],
  ["סיביליה", "sevilla"],
  ["סיבליה", "sevilla"],
  ["וורדברמן", "werder-bremen"],
  ["וורדר ברמן", "werder-bremen"],
  ["וורדר", "werder-bremen"],
  ["אינטר מיאמי", "inter-miami"],
  ["אינטר מילאן", "inter-milan"],
  ["ריאל מדריד", "real-madrid"],
  ["אתלטיקו מדריד", "atletico-madrid"],
  ["אטלטיקו מדריד", "atletico-madrid"],
  ["ריאל בטיס", "real-betis"],
  ["באייר לברקוזן", "bayer-leverkusen"],
  ["לברקוזן", "bayer-leverkusen"],
  ["לברקיזן", "bayer-leverkusen"],
  ["רדבול לייפציג", "rb-leipzig"],
  ["רד בול לייפציג", "rb-leipzig"],
  ["לייפציג", "rb-leipzig"],
  ["רדבול זלצבורג", "red-bull-salzburg"],
  ["רד בול זלצבורג", "red-bull-salzburg"],
  ["באיירן מינכן", "bayern-munich"],
  ["באיירן", "bayern-munich"],
  ["באירן", "bayern-munich"],
  ["ביירן", "bayern-munich"],
  ["בורוסיה דורטמונד", "borussia-dortmund"],
  ["דורטמונד", "borussia-dortmund"],
  ["בוקה גוניורס", "boca-juniors"],
  ["בוקה ג׳וניורס", "boca-juniors"],
  ["ניו אינגלנד", "new-england-revolution"],
  ["ניו אנגלנד", "new-england-revolution"],
  ["LA גלקסי", "la-galaxy"],
  ["אל איי גלקסי", "la-galaxy"],
  ["לוס אנג׳לס גלקסי", "la-galaxy"],
  ["ספורטינג ליסבון", "sporting-lisbon"],
  ["ספורטינג", "sporting-lisbon"],
  ["דרום קוריאה", "south-korea"],
  ["דרום-קוריאה", "south-korea"],
  ["דרום אפריקה", "south-africa"],
  ["ערב הסעודית", "saudi-arabia"],
  ["ערב סעודית", "saudi-arabia"],
  ["ערב הסעדוית", "saudi-arabia"], // typo seen in catalog
  ["סעודיה", "saudi-arabia"],
  ["קוסטה ריקה", "costa"],
  ["ניו זילנד", "new-zealand"],
  ["צ׳ילה", "chile"],
  ["צילה", "chile"],
  ["חוף השנהב", "ivory-coast"],
  ["צ׳כיה", "czech-republic"],
  ["צכיה", "czech-republic"],
  ["הפועל תל אביב", "hapoel-tel-aviv"],
  ["מכבי תל אביב", "maccabi-tel-aviv"],
  ["ביתר ירושלים", "beitar-jerusalem"],
  ["מכבי חיפה", "maccabi-haifa"],
  ["הפועל חיפה", "hapoel-haifa"],
  ["שאחטר דוניצק", "shakhtar-donetsk"],
  ["שאחטר", "shakhtar-donetsk"],
  ["דינמו זאגרב", "dinamo-zagreb"],
  ["דינמו זגרב", "dinamo-zagreb"],
  ["נוטינגהאם פורסט", "nottingham-forest"],
  ["נוטינגהם פורסט", "nottingham-forest"],
  ["קריסטל פאלאס", "crystal-palace"],
  ["קריסטל פאלס", "crystal-palace"],
  ["סאות׳המפטון", "southampton"],
  ["סאות'המפטון", "southampton"],
  ["איפסוויץ", "ipswich-town"],
  ["איפסוויץ׳", "ipswich-town"],
  ["וולפסבורג", "wolfsburg"],
  ["מנשנגלדבך", "borussia-monchengladbach"],
  ["מנשדגלבאך", "borussia-monchengladbach"],
  ["מנשנגלדבאך", "borussia-monchengladbach"],
  ["מנשנגלדבאך", "borussia-monchengladbach"],
  ["גלדבאך", "borussia-monchengladbach"],
  ["פרנקפורט", "eintracht-frankfurt"],
  ["שטוטגרט", "vfb-stuttgart"],
  ["סנט פאולי", "st-pauli"],
  ["פאולי", "st-pauli"],
  ["אטלנטה יונייטד", "atlanta-united"],
  ["שרלוט", "charlotte-fc"],
  ["קלוב אמריקה", "club-america"],
  ["סאו פאולו", "sao-paulo"],
  ["ריבר פלייט", "river-plate"],
  ["ריבר פלאטה", "river-plate"],
  ["דפורטיבו", "deportivo-la-coruna"],

  // Italian
  ["פיורנטינה", "fiorentina"],
  ["נאפולי", "napoli"],
  ["יובנטוס", "juventus"],
  ["לאציו", "lazio"],
  ["אטאלנטה", "atalanta"],
  ["אטלנטה", "atalanta"],
  ["בולוניה", "bologna"],
  ["פארמה", "parma"],
  ["לצ׳ה", "lecce"],
  ["לאצה", "lecce"],
  ["לאצ׳ה", "lecce"],
  ["טורינו", "torino"],
  ["אודינזה", "udinese"],
  ["קליארי", "cagliari"],
  ["ג׳נואה", "genoa"],
  ["קומו", "como"],
  ["רומא", "roma"],
  ["אינטר", "inter-milan"],
  ["מילאן", "ac-milan"],

  // Spanish
  ["ברצלונה", "barcelona"],
  ["באלוגי", "barcelona"], // alias
  ["סביליה", "sevilla"],
  ["ולנסיה", "valencia"],
  ["אתלטיק בליבאו", "athletic-bilbao"],
  ["אתלטיק בילבאו", "athletic-bilbao"],
  ["בילבאו", "athletic-bilbao"],
  ["ריאל סוסיאדד", "real-sociedad"],
  ["סוסיאדד", "real-sociedad"],
  ["סוסיאדאד", "real-sociedad"],
  ["בטיס", "real-betis"],
  ["ויאריאל", "villarreal"],
  ["ז׳ירונה", "girona"],
  ["גירונה", "girona"],
  ["סלטה ויגו", "celta-vigo"],
  ["גרנדה", "granada"],
  ["מלאגה", "malaga"],
  ["קדיס", "cadiz"],
  ["אספניול", "espanyol"],
  ["אלאבס", "alaves"],
  ["אלבאס", "alaves"],
  ["דיפורטיבו אלבאס", "alaves"],
  ["לבנטה", "levante"],
  ["מאיורקה", "mallorca"],
  ["מיורקה", "mallorca"],
  ["לאס פלמאס", "las-palmas"],
  ["לאס פלמס", "las-palmas"],
  ["חטאפה", "getafe"],
  ["ראיו ויאקאנו", "rayo-vallecano"],
  ["אוססונה", "osasuna"],
  ["אלקמר", "az-alkmaar"],
  ["אאק אתונה", "aek-athens"],
  ["אאק", "aek-athens"],
  ["אאק-אתונה", "aek-athens"],

  // German singles
  ["וולבס", "wolves"],
  ["ווסט האם", "west-ham"],
  ["וואסטהאם", "west-ham"],
  ["ווסטהם", "west-ham"],
  ["לסטר", "leicester-city"],
  ["סנדרלנד", "sunderland"],
  ["דרבי קאונטי", "derby-county"],
  ["דרבי", "derby-county"],
  ["שפילד יונייטד", "sheffield-united"],
  ["שפילד וונסדיי", "sheffield-wednesday"],
  ["ברנלי", "burnley"],
  ["לוטון", "luton-town"],
  ["לוטון טאון", "luton-town"],
  ["די.סי. יונייטד", "dc-united"],
  ["דיסי יונייטד", "dc-united"],
  ["דיסי ייוניטד", "dc-united"],
  ["דיסי-יונייטד", "dc-united"],
  ["ניו יורק סיטי", "ny-city-fc"],
  ["סיאטל סאונדרס", "seattle-sounders"],
  ["פורטלנד טימברס", "portland-timbers"],
  ["ברנטפורד", "brentford"],
  ["בורנמות׳", "bournemouth"],
  ["ברייטון", "brighton"],
  ["אברטון", "everton"],
  ["פולהם", "fulham"],
  ["פולהאם", "fulham"],
  ["לידס", "leeds"],
  ["טוטנהאם", "tottenham"],
  ["טוטנהם", "tottenham"],
  ["טוטהאם", "tottenham"],
  ["טוטהם", "tottenham"],
  ["ניוקאסל", "newcastle"],
  ["ניו קאסל", "newcastle"],
  ["אסטון וילה", "aston-villa"],
  ["צ׳לסי", "chelsea"],
  ["צלסי", "chelsea"],
  ["ארסנל", "arsenal"],
  ["ליברפול", "liverpool"],

  // French
  ["פריז סן ז׳רמן", "psg"],
  ["פריז סן גרמן", "psg"],
  ["פריז סן-גרמן", "psg"],
  ["פריס סן גרמן", "psg"],
  ["פריז", "psg"],
  ["מארסיי", "marseille"],
  ["מרסיי", "marseille"],
  ["מארסי", "marseille"],
  ["אולימפיק מארסי", "marseille"],
  ["אולימפיק מרסי", "marseille"],
  ["אולימפיק מארסיי", "marseille"],
  ["ליון", "lyon"],
  ["מונאקו", "monaco"],
  ["ניס", "nice"],
  ["ליל", "lille"],
  ["ברסט", "brest"],
  ["רן", "rennes"],

  // Other clubs
  ["אייאקס", "ajax"],
  ["אייקס", "ajax"],
  ["פיינורד", "feyenoord"],
  ["פ.ס.וו אינדהובן", "psv"],
  ["פ.ס.וו", "psv"],
  ["בנפיקה", "benfica"],
  ["פורטו", "porto"],
  ["בראגה", "braga"],
  ["בארגה", "braga"],
  ["סלטיק", "celtic"],
  ["רנג׳רס", "rangers"],
  ["רנגרס", "rangers"],
  ["אברדין", "aberdeen"],
  ["פנרבחצ׳ה", "fenerbahce"],
  ["פנרבחצה", "fenerbahce"],
  ["גלאטאסארי", "galatasaray"],
  ["גלאטסריי", "galatasaray"],
  ["גלאטסראי", "galatasaray"],
  ["בשיקטאש", "besiktas"],
  ["בשיקטס", "besiktas"],
  ["טרבזונספור", "trabzonspor"],
  ["אולימפיאקוס", "olympiakos"],
  ["פאנאתינייקוס", "panathinaikos"],
  ["אל נאסר", "al-nassr"],
  ["אל-נאסר", "al-nassr"],
  ["אל הילאל", "al-hilal"],
  ["אל-הילאל", "al-hilal"],
  ["אל אהלי", "al-ahly"],
  ["אל-אהלי", "al-ahly"],
  ["אל איתחאד", "al-ittihad"],
  ["אל-איתחאד", "al-ittihad"],
  ["אינטר", "inter-milan"], // disambiguated above
  ["טיגרס", "tigres"],
  ["מונטריי", "monterrey"],
  ["פלמנגו", "flamengo"],
  ["סנטוס", "santos"],
  ["פאלמיירס", "palmeiras"],
  ["פלמיירס", "palmeiras"],
  ["קורינתיאנס", "corinthians"],
  ["אתלטיקו מינייהו", "atletico-mineiro"],
  ["אתלטיקו מיניירו", "atletico-mineiro"],
  ["אתלטיק מניירו", "atletico-mineiro"],
  ["אתלטיק מנירו", "atletico-mineiro"],
  ["מינייהו", "atletico-mineiro"],
  ["פלומיננסה", "fluminense"],
  ["פלומיננזה", "fluminense"],
  ["וסקו דה גאמה", "vasco"],
  ["וסקו", "vasco"],
  ["קרוזיירו", "cruzeiro"],
  ["גרמיו", "gremio"],
  ["אינטרנסיונל", "internacional"],
  ["יאנג בויס", "young-boys"],
  ["אולד בויס", "young-boys"], // catalog typo
  ["באזל", "basel"],
  ["וורקסהאם", "wrexham"],
  ["וורקסהם", "wrexham"],
  ["קונבטרי", "coventry"],
  ["קובנטרי", "coventry"],
  ["וויאדוליד", "real-valladolid"],
  ["ויאדוליד", "real-valladolid"],
  ["ויאלאדוליד", "real-valladolid"],
  ["בוקה", "boca-juniors"],
  ["ריבר", "river-plate"],

  // Nations
  ["ארגנטינה", "argentina"],
  ["ברזיל", "brazil"],
  ["צרפת", "france"],
  ["גרמניה", "germany"],
  ["ספרד", "spain"],
  ["פורטוגל", "portugal"],
  ["אנגליה", "england"],
  ["איטליה", "italy"],
  ["הולנד", "netherlands"],
  ["בלגיה", "belgium"],
  ["מרוקו", "morocco"],
  ["יפן", "japan"],
  ["מקסיקו", "mexico"],
  ["מכסיקו", "mexico"],
  ["ארה״ב", "usa"],
  ["ארהב", "usa"],
  ["ארה'ב", "usa"],
  ["ארצות הברית", "usa"],
  ["אורוגוואי", "uruguay"],
  ["קרואטיה", "croatia"],
  ["קולומביה", "colombia"],
  ["טורקיה", "turkey"],
  ["ניגריה", "nigeria"],
  ["ניגריהם", "nigeria"],
  ["נגיריה", "nigeria"],
  ["סנגל", "senegal"],
  ["קמרון", "cameroon"],
  ["אלג׳יריה", "algeria"],
  ["אלגיריה", "algeria"],
  ["תוניסיה", "tunisia"],
  ["מצרים", "egypt"],
  ["מאלי", "mali"],
  ["ג׳מייקה", "jamaica"],
  ["גמייקה", "jamaica"],
  ["ג׳מייכה", "jamaica"],
  ["גאנה", "ghana"],
  ["סקוטלנד", "scotland"],
  ["אירלנד", "ireland"],
  ["וויילס", "wales"],
  ["וויילז", "wales"],
  ["וילס", "wales"],
  ["שוויץ", "switzerland"],
  ["פולין", "poland"],
  ["דנמרק", "denmark"],
  ["שוודיה", "sweden"],
  ["נורבגיה", "norway"],
  ["נורווגיה", "norway"],
  ["פינלנד", "finland"],
  ["איסלנד", "iceland"],
  ["אוסטריה", "austria"],
  ["הונגריה", "hungary"],
  ["רומניה", "romania"],
  ["סרביה", "serbia"],
  ["אוקראינה", "ukraine"],
  ["אוקרינה", "ukraine"],
  ["רוסיה", "russia"],
  ["יוון", "greece"],
  ["איראן", "iran"],
  ["עיראק", "iraq"],
  ["קטאר", "qatar"],
  ["אוסטרליה", "australia"],
  ["קנדה", "canada"],
  ["צ׳ילה", "chile"],
  ["פרו", "peru"],
  ["אקוודור", "ecuador"],
  ["ונצואלה", "venezuela"],
  ["וונצואלה", "venezuela"],
  ["פרגוואי", "paraguay"],
  ["בוליביה", "bolivia"],
  ["פנמה", "panama"],
];

/** Latin / English token (filename or sourceHandle) → slug. Multi-word
 *  entries should be checked as substring; single tokens checked exact
 *  on token boundaries. */
const LATIN_DICT = [
  // Multi-word — check as substring of joined-tokens
  ["manchester united", "manchester-united"],
  ["manchesterunited", "manchester-united"],
  ["manchester city", "manchester-city"],
  ["manchestercity", "manchester-city"],
  ["mancity", "manchester-city"],
  ["manunited", "manchester-united"],
  ["manutd", "manchester-united"],
  ["real madrid", "real-madrid"],
  ["realmadrid", "real-madrid"],
  ["atletico madrid", "atletico-madrid"],
  ["atleticomadrid", "atletico-madrid"],
  ["athletic bilbao", "athletic-bilbao"],
  ["athleticbilbao", "athletic-bilbao"],
  ["bilbao", "athletic-bilbao"],
  ["real betis", "real-betis"],
  ["realbetis", "real-betis"],
  ["bayer leverkusen", "bayer-leverkusen"],
  ["bayerleverkusen", "bayer-leverkusen"],
  ["leverkusen", "bayer-leverkusen"],
  ["bayer", "bayer-leverkusen"],
  ["bayern munich", "bayern-munich"],
  ["bayernmunich", "bayern-munich"],
  ["bayern", "bayern-munich"],
  ["borussia dortmund", "borussia-dortmund"],
  ["borussiadortmund", "borussia-dortmund"],
  ["dortmund", "borussia-dortmund"],
  ["bvb", "borussia-dortmund"],
  ["rb leipzig", "rb-leipzig"],
  ["leipzig", "rb-leipzig"],
  ["red bull leipzig", "rb-leipzig"],
  ["redbull leipzig", "rb-leipzig"],
  ["red bull salzburg", "red-bull-salzburg"],
  ["redbull salzburg", "red-bull-salzburg"],
  ["salzburg", "red-bull-salzburg"],
  ["paris saint", "psg"],
  ["paris saint-germain", "psg"],
  ["saintgermain", "psg"],
  ["paris", "psg"],
  ["olympique marseille", "marseille"],
  ["olympique de marseille", "marseille"],
  ["olympique lyon", "lyon"],
  ["olympique lyonnais", "lyon"],
  ["inter miami", "inter-miami"],
  ["intermiami", "inter-miami"],
  ["miami", "inter-miami"],
  ["inter milan", "inter-milan"],
  ["intermilan", "inter-milan"],
  ["ac milan", "ac-milan"],
  ["acmilan", "ac-milan"],
  ["acmilano", "ac-milan"],
  ["ac", "ac-milan"], // "AC" alone in this catalog always means AC Milan
  ["asroma", "roma"],
  ["as roma", "roma"],
  ["sporting cp", "sporting-lisbon"],
  ["sportinglisbon", "sporting-lisbon"],
  ["sporting lisbon", "sporting-lisbon"],
  ["sporting", "sporting-lisbon"],
  ["nottingham forest", "nottingham-forest"],
  ["nottinghamforest", "nottingham-forest"],
  ["forest", "nottingham-forest"],
  ["nottingham", "nottingham-forest"],
  ["crystal palace", "crystal-palace"],
  ["crystalpalace", "crystal-palace"],
  ["aston villa", "aston-villa"],
  ["astonvilla", "aston-villa"],
  ["west ham", "west-ham"],
  ["westham", "west-ham"],
  ["leicester city", "leicester-city"],
  ["leicestercity", "leicester-city"],
  ["leicester", "leicester-city"],
  ["new england", "new-england-revolution"],
  ["newengland", "new-england-revolution"],
  ["la galaxy", "la-galaxy"],
  ["lagalaxy", "la-galaxy"],
  ["galaxy", "la-galaxy"],
  ["lafc", "lafc"],
  ["charlotte fc", "charlotte-fc"],
  ["charlottefc", "charlotte-fc"],
  ["club america", "club-america"],
  ["clubamerica", "club-america"],
  ["sao paulo", "sao-paulo"],
  ["saopaulo", "sao-paulo"],
  ["river plate", "river-plate"],
  ["riverplate", "river-plate"],
  ["boca juniors", "boca-juniors"],
  ["bocajuniors", "boca-juniors"],
  ["al nassr", "al-nassr"],
  ["alnassr", "al-nassr"],
  ["nassr", "al-nassr"],
  ["al hilal", "al-hilal"],
  ["alhilal", "al-hilal"],
  ["hilal", "al-hilal"],
  ["al ahly", "al-ahly"],
  ["alahly", "al-ahly"],
  ["ahly", "al-ahly"],
  ["al ittihad", "al-ittihad"],
  ["alittihad", "al-ittihad"],
  ["ittihad", "al-ittihad"],
  ["al ahli", "al-ahly"],
  ["alahli", "al-ahly"],
  ["red bull salzburg", "red-bull-salzburg"],
  ["bobmarley", "jamaica"],
  ["bob marley", "jamaica"],
  ["bob-marley", "jamaica"],
  ["sao paulo", "sao-paulo"],

  // Single tokens (exact match on word boundary)
  ["liverpool", "liverpool"],
  ["arsenal", "arsenal"],
  ["chelsea", "chelsea"],
  ["tottenham", "tottenham"],
  ["hotspur", "tottenham"],
  ["newcastle", "newcastle"],
  ["everton", "everton"],
  ["brighton", "brighton"],
  ["wolves", "wolves"],
  ["wolverhampton", "wolves"],
  ["leeds", "leeds"],
  ["fulham", "fulham"],
  ["sunderland", "sunderland"],
  ["bournemouth", "bournemouth"],
  ["brentford", "brentford"],
  ["southampton", "southampton"],
  ["ipswich", "ipswich-town"],
  ["derby county", "derby-county"],
  ["derbycounty", "derby-county"],
  ["sheffield united", "sheffield-united"],
  ["sheffield wednesday", "sheffield-wednesday"],
  ["sheffield", "sheffield-united"],
  ["burnley", "burnley"],
  ["luton", "luton-town"],
  ["dc united", "dc-united"],
  ["dcunited", "dc-united"],
  ["new york city", "ny-city-fc"],
  ["nyc fc", "ny-city-fc"],
  ["nycfc", "ny-city-fc"],
  ["seattle sounders", "seattle-sounders"],
  ["seattle", "seattle-sounders"],
  ["portland timbers", "portland-timbers"],
  ["portland", "portland-timbers"],
  ["levante", "levante"],
  ["mallorca", "mallorca"],
  ["las palmas", "las-palmas"],
  ["laspalmas", "las-palmas"],
  ["getafe", "getafe"],
  ["rayo vallecano", "rayo-vallecano"],
  ["vallecano", "rayo-vallecano"],
  ["osasuna", "osasuna"],
  ["real sociedad", "real-sociedad"],
  ["realsociedad", "real-sociedad"],
  ["sociedad", "real-sociedad"],
  ["alkmaar", "az-alkmaar"],
  ["az alkmaar", "az-alkmaar"],
  ["aek", "aek-athens"],
  ["aek athens", "aek-athens"],
  ["barcelona", "barcelona"],
  ["barca", "barcelona"],
  ["sevilla", "sevilla"],
  ["valencia", "valencia"],
  ["villarreal", "villarreal"],
  ["girona", "girona"],
  ["alaves", "alaves"],
  ["espanyol", "espanyol"],
  ["malaga", "malaga"],
  ["granada", "granada"],
  ["cadiz", "cadiz"],
  ["betis", "real-betis"],
  ["napoli", "napoli"],
  ["juventus", "juventus"],
  ["juve", "juventus"],
  ["lazio", "lazio"],
  ["fiorentina", "fiorentina"],
  ["roma", "roma"],
  ["atalanta", "atalanta"],
  ["bologna", "bologna"],
  ["parma", "parma"],
  ["lecce", "lecce"],
  ["torino", "torino"],
  ["udinese", "udinese"],
  ["cagliari", "cagliari"],
  ["genoa", "genoa"],
  ["como", "como"],
  ["inter", "inter-milan"],
  ["milan", "ac-milan"],
  ["wolfsburg", "wolfsburg"],
  ["frankfurt", "eintracht-frankfurt"],
  ["stuttgart", "vfb-stuttgart"],
  ["pauli", "st-pauli"],
  ["hertha", "hertha-berlin"],
  ["schalke", "schalke"],
  ["psg", "psg"],
  ["marseille", "marseille"],
  ["lyon", "lyon"],
  ["lyonnais", "lyon"],
  ["monaco", "monaco"],
  ["nice", "nice"],
  ["lille", "lille"],
  ["brest", "brest"],
  ["rennes", "rennes"],
  ["ajax", "ajax"],
  ["feyenoord", "feyenoord"],
  ["psv", "psv"],
  ["benfica", "benfica"],
  ["porto", "porto"],
  ["braga", "braga"],
  ["celtic", "celtic"],
  ["rangers", "rangers"],
  ["aberdeen", "aberdeen"],
  ["fenerbahce", "fenerbahce"],
  ["galatasaray", "galatasaray"],
  ["besiktas", "besiktas"],
  ["trabzonspor", "trabzonspor"],
  ["olympiakos", "olympiakos"],
  ["panathinaikos", "panathinaikos"],
  ["zagreb", "dinamo-zagreb"],
  ["shakhtar", "shakhtar-donetsk"],
  ["donetsk", "shakhtar-donetsk"],
  ["flamengo", "flamengo"],
  ["santos", "santos"],
  ["palmeiras", "palmeiras"],
  ["corinthians", "corinthians"],
  ["tigres", "tigres"],
  ["monterrey", "monterrey"],

  // Nations
  ["argentina", "argentina"],
  ["brazil", "brazil"],
  ["brasil", "brazil"],
  ["france", "france"],
  ["germany", "germany"],
  ["deutschland", "germany"],
  ["spain", "spain"],
  ["espana", "spain"],
  ["españa", "spain"],
  ["portugal", "portugal"],
  ["england", "england"],
  ["italy", "italy"],
  ["italia", "italy"],
  ["netherlands", "netherlands"],
  ["holland", "netherlands"],
  ["nederland", "netherlands"],
  ["belgium", "belgium"],
  ["belgique", "belgium"],
  ["morocco", "morocco"],
  ["maroc", "morocco"],
  ["japan", "japan"],
  ["mexico", "mexico"],
  ["mexique", "mexico"],
  ["usa", "usa"],
  ["uruguay", "uruguay"],
  ["korea", "south-korea"],
  ["croatia", "croatia"],
  ["hrvatska", "croatia"],
  ["colombia", "colombia"],
  ["turkey", "turkey"],
  ["turkiye", "turkey"],
  ["nigeria", "nigeria"],
  ["senegal", "senegal"],
  ["cameroon", "cameroon"],
  ["algeria", "algeria"],
  ["tunisia", "tunisia"],
  ["egypt", "egypt"],
  ["mali", "mali"],
  ["jamaica", "jamaica"],
  ["ghana", "ghana"],
  ["scotland", "scotland"],
  ["ireland", "ireland"],
  ["wales", "wales"],
  ["switzerland", "switzerland"],
  ["suisse", "switzerland"],
  ["poland", "poland"],
  ["denmark", "denmark"],
  ["sweden", "sweden"],
  ["norway", "norway"],
  ["finland", "finland"],
  ["iceland", "iceland"],
  ["austria", "austria"],
  ["hungary", "hungary"],
  ["serbia", "serbia"],
  ["ukraine", "ukraine"],
  ["greece", "greece"],
  ["czech", "czech-republic"],
  ["saudi", "saudi-arabia"],
  ["iran", "iran"],
  ["iraq", "iraq"],
  ["qatar", "qatar"],
  ["australia", "australia"],
  ["canada", "canada"],
  ["chile", "chile"],
  ["peru", "peru"],
  ["ecuador", "ecuador"],
  ["venezuela", "venezuela"],
];

/** Hebrew transliterated to Latin (filename style) → slug.
 *  e.g. brzyl=ברזיל=brazil. These come from the Hebrew sourceHandle being
 *  re-encoded as ASCII when Shopify stored it. */
const HE_TRANSLIT_DICT = [
  ["brzyl", "brazil"],
  ["zrpt", "france"],
  ["sprd", "spain"],
  ["hwlnd", "netherlands"],
  ["nglyh", "england"],
  ["rgntynh", "argentina"],
  ["mqsyqw", "mexico"],
  ["mksyqw", "mexico"],
  ["yrgntynh", "argentina"],
  ["gmyyqh", "jamaica"],
  ["bwb-mrly", "jamaica"],
  ["qndh", "canada"],
  ["nwrbgyh", "norway"],
  ["pwlyn", "poland"],
  ["pwrtwgl", "portugal"],
  ["grmnyh", "germany"],
  ["yphn", "japan"],
  ["wrwgwwy", "uruguay"],
  ["rwgwwy", "uruguay"],
  ["mrwqw", "morocco"],
  ["qmrwn", "cameroon"],
  ["sngl", "senegal"],
  ["myly", "mali"],
  ["mly", "mali"],
  ["ngyrh", "nigeria"],
  ["dnmrq", "denmark"],
  ["swwdyh", "sweden"],
  ["pyld", "finland"],
  ["sqwtlnd", "scotland"],
  ["yslnd", "iceland"],
  ["wstryh", "austria"],
  ["hwngryh", "hungary"],
  ["srbyh", "serbia"],
  ["wqrynh", "ukraine"],
  ["wqrnh", "ukraine"],
  ["yrn", "iran"],
  ["yrq", "iraq"],
  ["qtr", "qatar"],
  ["wstrlyh", "australia"],
  ["zyly", "chile"],
  ["zylh", "chile"],
  ["pyrw", "peru"],
  ["qwdwr", "ecuador"],
  ["wnzwl", "venezuela"],
  ["prgwwy", "paraguay"],
  ["bwlyby", "bolivia"],
  ["pnmh", "panama"],
  ["qsth-ryqh", "costa"],
  ["zky", "czech-republic"],
  ["zkyh", "czech-republic"],
  ["ywwn", "greece"],
  ["rmnyh", "romania"],
  ["zrpt", "france"],
];

// Hebrew letter range for boundary detection
const HE_RE = /[\u0590-\u05FF]/;

/** Normalize Hebrew text: lowercase + collapse all apostrophe-like chars
 *  to a single canonical ASCII apostrophe so the dictionary matches both
 *  "מנצ׳סטר" (geresh) and "מנצ'סטר" (ASCII apostrophe). */
function normHe(s) {
  return String(s)
    .toLowerCase()
    .replace(/[\u05F3\u05F4\u2019\u2032`´]/g, "'");
}

function containsHe(text, word) {
  if (!text || !word) return false;
  const lower = normHe(text);
  const w = normHe(word);
  let from = 0;
  while (true) {
    const idx = lower.indexOf(w, from);
    if (idx < 0) return false;
    const before = lower[idx - 1];
    const after = lower[idx + w.length];
    if ((!before || !HE_RE.test(before)) && (!after || !HE_RE.test(after))) return true;
    from = idx + 1;
  }
}

function findHeSlug(text) {
  for (const [w, s] of HE_DICT) {
    if (containsHe(text, w)) return s;
  }
  return null;
}

function findLatinSlug(text) {
  if (!text) return null;
  const lower = String(text).toLowerCase();
  const norm = lower.replace(/[_\-./?=&]+/g, " ");
  // "Plain" tokens — split on whitespace + Hebrew + Chinese ranges only,
  // so "ac" must appear as a free-standing token (not inside hex like
  // "520153ac"). For short 2-char codes like "ac" we only trust this kind
  // of match — otherwise UUID fragments produce false positives.
  const plainTokens = norm.split(/[\s\u0590-\u05FF\u4E00-\u9FFF]+/).filter(Boolean);
  // "Broken" tokens — additionally split digit-letter boundaries so
  // "2526Ac" → ["2526", "ac"]. Used ONLY for matches ≥ 3 chars where
  // collisions with random UUID hex are unlikely.
  const broken = norm.replace(/([a-z])([0-9])|([0-9])([a-z])/gi, "$1$3 $2$4");
  const brokenTokens = broken.split(/[\s\u0590-\u05FF\u4E00-\u9FFF]+/).filter(Boolean);
  const joined = brokenTokens.join("");
  // 1) Multi-word substrings — against the original lowercased text
  for (const [w, s] of LATIN_DICT) {
    if (w.includes(" ")) {
      if (lower.includes(w)) return s;
      const collapsed = w.replace(/ /g, "");
      if (joined.includes(collapsed)) return s;
    }
  }
  // 2) Exact token — short (≤ 2 chars) needs PLAIN token; longer can be
  //    a broken token. Avoids matching "ac" inside hex like 520153ac.
  for (const [w, s] of LATIN_DICT) {
    if (w.includes(" ")) continue;
    const tokens = w.length <= 2 ? plainTokens : brokenTokens;
    if (tokens.includes(w)) return s;
  }
  return null;
}

function findTranslitSlug(text) {
  if (!text) return null;
  const norm = String(text).toLowerCase();
  for (const [w, s] of HE_TRANSLIT_DICT) {
    // Match as a token bounded by - or _ or .
    const re = new RegExp(`(^|[\\-_./])${w}([\\-_./]|$)`);
    if (re.test(norm)) return s;
  }
  return null;
}

// Chinese dictionary (subset — broad coverage of major teams)
const CN_DICT = [
  ["拜仁", "bayern-munich"],
  ["皇马", "real-madrid"],
  ["巴萨", "barcelona"],
  ["巴塞", "barcelona"],
  ["巴赛", "barcelona"],
  ["巴萨罗那", "barcelona"],
  ["马竞", "atletico-madrid"],
  ["塞维利亚", "sevilla"],
  ["比利亚雷亚尔", "villarreal"],
  ["瓦伦西亚", "valencia"],
  ["皇家社会", "real-sociedad"],
  ["毕尔巴鄂", "athletic-bilbao"],
  ["皇家贝蒂斯", "real-betis"],
  ["贝蒂斯", "real-betis"],
  ["赫罗纳", "girona"],
  ["拉科鲁尼亚", "deportivo-la-coruna"],
  ["塞尔塔", "celta-vigo"],
  ["格拉纳达", "granada"],
  ["马拉加", "malaga"],
  ["加的斯", "cadiz"],
  ["阿拉维斯", "alaves"],
  ["西班牙人", "espanyol"],
  ["曼联", "manchester-united"],
  ["万联", "manchester-united"], // catalog typo / alt
  ["曼城", "manchester-city"],
  ["利物浦", "liverpool"],
  ["阿森纳", "arsenal"],
  ["阿深纳", "arsenal"], // catalog typo
  ["切尔西", "chelsea"],
  ["热刺", "tottenham"],
  ["纽卡斯尔", "newcastle"],
  ["阿斯顿维拉", "aston-villa"],
  ["埃弗顿", "everton"],
  ["布莱顿", "brighton"],
  ["狼队", "wolves"],
  ["西汉姆", "west-ham"],
  ["利兹", "leeds"],
  ["富勒姆", "fulham"],
  ["莱切斯特", "leicester-city"],
  ["森林", "nottingham-forest"],
  ["水晶宫", "crystal-palace"],
  ["桑德兰", "sunderland"],
  ["伯恩茅斯", "bournemouth"],
  ["布伦特福德", "brentford"],
  ["南安普顿", "southampton"],
  ["伊普斯维奇", "ipswich-town"],
  ["米兰", "ac-milan"],
  // AC products in catalog with cn like "25-26AC客场" — Latin "AC" inside
  // Chinese-source means AC Milan. We accept lowercase too because product
  // name field text gets lowercased in some samples.
  // Latin "AC" inside Chinese supplier handles always means AC Milan in
  // this catalogue. Match wherever AC appears next to a year-digit prefix
  // OR followed by 主/客/三/特/红/绿/黄/蓝/白/黑/联/纪/成/童.
  [/(?:^|\d)ac(?:[主客三特红绿黄蓝白黑联纪成童二三四五]|\d|$)/i, "ac-milan"],
  ["万城", "manchester-city"], // catalog uses 万城 = Man City
  ["国米", "inter-milan"],
  ["国际米兰", "inter-milan"],
  ["尤文", "juventus"],
  ["尤文图斯", "juventus"],
  ["那不勒斯", "napoli"],
  ["罗马", "roma"],
  ["拉齐奥", "lazio"],
  ["佛罗伦萨", "fiorentina"],
  ["佛罗伦赛", "fiorentina"],
  ["亚特兰大", "atalanta"],
  ["博洛尼亚", "bologna"],
  ["帕尔马", "parma"],
  ["莱切", "lecce"],
  ["都灵", "torino"],
  ["乌迪内斯", "udinese"],
  ["卡利亚里", "cagliari"],
  ["热那亚", "genoa"],
  ["科莫", "como"],
  ["多特蒙德", "borussia-dortmund"],
  ["勒沃库森", "bayer-leverkusen"],
  ["莱比锡", "rb-leipzig"],
  ["斯图加特", "vfb-stuttgart"],
  ["圣保利", "st-pauli"],
  ["法兰克福", "eintracht-frankfurt"],
  ["沃尔夫斯堡", "wolfsburg"],
  ["柏林赫塔", "hertha-berlin"],
  ["沙尔克", "schalke"],
  ["门兴", "borussia-monchengladbach"],
  ["大巴黎", "psg"],
  ["巴黎", "psg"],
  ["巴黎圣日耳曼", "psg"],
  ["马赛", "marseille"],
  ["里昂", "lyon"],
  ["摩纳哥", "monaco"],
  ["尼斯", "nice"],
  ["里尔", "lille"],
  ["布雷斯特", "brest"],
  ["雷恩", "rennes"],
  ["阿贾克斯", "ajax"],
  ["费耶诺德", "feyenoord"],
  ["埃因霍温", "psv"],
  ["本菲卡", "benfica"],
  ["波尔图", "porto"],
  ["布拉加", "braga"],
  ["葡体", "sporting-lisbon"],
  ["凯尔特人", "celtic"],
  ["流浪者", "rangers"],
  ["阿伯丁", "aberdeen"],
  ["费内巴切", "fenerbahce"],
  ["费内巴", "fenerbahce"],
  ["加拉塔萨雷", "galatasaray"],
  ["贝西克塔斯", "besiktas"],
  ["特拉布宗", "trabzonspor"],
  ["奥林匹亚科斯", "olympiakos"],
  ["帕纳辛奈科斯", "panathinaikos"],
  ["萨尔茨堡", "red-bull-salzburg"],
  ["顿涅茨克矿工", "shakhtar-donetsk"],
  ["矿工", "shakhtar-donetsk"],
  ["迈阿密国际", "inter-miami"],
  ["迈阿密", "inter-miami"],
  ["洛杉矶银河", "la-galaxy"],
  ["洛杉矶FC", "lafc"],
  ["新英格兰", "new-england-revolution"],
  ["夏洛特", "charlotte-fc"],
  ["亚特兰大联", "atlanta-united"],
  ["蒂格雷斯", "tigres"],
  ["老虎队", "tigres"],
  ["老虎", "tigres"],
  ["蒙特雷", "monterrey"],
  ["美洲俱乐部", "club-america"],
  ["美洲", "club-america"],
  ["美洲狮", "pumas"],
  ["蓝十字", "cruz-azul"],
  ["兰十字", "cruz-azul"],
  ["十字", "cruz-azul"],
  ["克鲁塞", "cruz-azul"],
  ["瓜达拉哈拉", "chivas"],
  ["奇瓦斯", "chivas"],
  ["里斯本竞技", "sporting-lisbon"],
  ["里斯本", "sporting-lisbon"],
  ["阿斯顿", "aston-villa"],
  ["费耶诺得", "feyenoord"],
  ["费耶诺德", "feyenoord"],
  ["皇家贝斯", "real-betis"],
  ["帕梅拉斯", "palmeiras"],
  ["百万富翁", "millonarios"],
  ["米内罗", "atletico-mineiro"],
  ["新月", "al-hilal"],
  ["利雅得胜利", "al-nassr"],
  ["利雅得新月", "al-hilal"],
  ["吉达联合", "al-ittihad"],
  ["利雅得", "al-nassr"], // generic Riyadh → Al-Nassr (most common)
  ["内马尔", "santos"], // Neymar — Santos is his original club
  ["c罗", "al-nassr"], // Cristiano Ronaldo's current club
  ["c罗纪念版", "al-nassr"],
  ["c罗特别版", "al-nassr"],
  ["梅西", "inter-miami"], // Messi's current club
  ["梅西纪念版", "inter-miami"],
  ["梅西特别版", "inter-miami"],
  ["玛利亚", "argentina"], // di Maria — most often national team merch
  ["弗拉门戈", "flamengo"],
  ["佛拉门戈", "flamengo"],
  ["博塔弗戈", "botafogo"],
  ["博塔佛戈", "botafogo"],
  ["弗鲁米嫩塞", "fluminense"],
  ["佛鲁米嫩塞", "fluminense"],
  ["弗鲁米", "fluminense"],
  ["佛鲁米", "fluminense"],
  ["桑拖斯", "santos"],
  ["桑托斯", "santos"],
  ["帕尔拉斯", "palmeiras"],
  ["帕拉米", "palmeiras"],
  ["科洛科洛", "colo-colo"],
  ["天主教", "universidad-catolica"],
  ["国民竞技", "atletico-nacional"],
  ["马塞", "marseille"],
  ["埃佛顿", "everton"],
  ["里资本", "sporting-lisbon"],
  ["芝华士", "chivas"],
  ["达伽马", "vasco"],
  ["达咖马", "vasco"],
  ["格雷米", "gremio"],
  ["格雷米奥", "gremio"],
  ["马洛卡", "mallorca"],
  ["瓦伦西亚", "valencia"],
  ["格拉纳达", "granada"],
  ["阿尔及利亚", "algeria"],
  ["阿尼及利亚", "nigeria"], // catalog typo for 尼日利亚
  ["中国", "china"],
  ["美洲狮", "pumas"],
  ["皇家西班牙人", "espanyol"],
  ["塞维利亚", "sevilla"],
  ["桑托斯", "santos"],
  ["帕尔梅拉斯", "palmeiras"],
  ["科林蒂安", "corinthians"],
  ["圣保罗", "sao-paulo"],
  ["博卡青年", "boca-juniors"],
  ["河床", "river-plate"],
  ["利雅得胜利", "al-nassr"],
  ["利雅得新月", "al-hilal"],
  ["开罗国民", "al-ahly"],
  ["伊蒂哈德", "al-ittihad"],
  ["阿根廷", "argentina"],
  ["巴西", "brazil"],
  ["法国", "france"],
  ["德国", "germany"],
  ["西班牙", "spain"],
  ["葡萄牙", "portugal"],
  ["英格兰", "england"],
  ["意大利", "italy"],
  ["荷兰", "netherlands"],
  ["比利时", "belgium"],
  ["摩洛哥", "morocco"],
  ["日本", "japan"],
  ["墨西哥", "mexico"],
  ["美国", "usa"],
  ["乌拉圭", "uruguay"],
  ["韩国", "south-korea"],
  ["克罗地亚", "croatia"],
  ["哥伦比亚", "colombia"],
  ["土耳其", "turkey"],
  ["尼日利亚", "nigeria"],
  ["塞内加尔", "senegal"],
  ["喀麦隆", "cameroon"],
  ["客麦隆", "cameroon"],
  ["麦隆", "cameroon"],
  ["阿尔及利亚", "algeria"],
  ["突尼斯", "tunisia"],
  ["科特迪瓦", "ivory-coast"],
  ["南非", "south-africa"],
  ["埃及", "egypt"],
  ["马里", "mali"],
  ["牙买加", "jamaica"],
  ["加纳", "ghana"],
  ["苏格兰", "scotland"],
  ["爱尔兰", "ireland"],
  ["威尔士", "wales"],
  ["瑞士", "switzerland"],
  ["波兰", "poland"],
  ["丹麦", "denmark"],
  ["瑞典", "sweden"],
  ["挪威", "norway"],
  ["芬兰", "finland"],
  ["冰岛", "iceland"],
  ["奥地利", "austria"],
  ["匈牙利", "hungary"],
  ["罗马尼亚", "romania"],
  ["塞尔维亚", "serbia"],
  ["乌克兰", "ukraine"],
  ["俄罗斯", "russia"],
  ["希腊", "greece"],
  ["捷克", "czech-republic"],
  ["沙特", "saudi-arabia"],
  ["伊朗", "iran"],
  ["伊拉克", "iraq"],
  ["卡塔尔", "qatar"],
  ["澳大利亚", "australia"],
  ["新西兰", "new-zealand"],
  ["加拿大", "canada"],
  ["智利", "chile"],
  ["秘鲁", "peru"],
  ["厄瓜多尔", "ecuador"],
  ["委内瑞拉", "venezuela"],
  ["巴拉圭", "paraguay"],
  ["玻利维亚", "bolivia"],
  ["哥斯达黎加", "costa"],
  ["巴拿马", "panama"],
  ["以色列", "hapoel-tel-aviv"], // generic israel match — refined later
  ["特拉维夫", "hapoel-tel-aviv"],
];

function findCnSlug(text) {
  if (!text) return null;
  const lower = String(text).toLowerCase();
  for (const [w, s] of CN_DICT) {
    if (w instanceof RegExp) {
      if (w.test(text)) return s;
    } else if (lower.includes(w.toLowerCase())) {
      return s;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// SIGNAL EXTRACTION per product
// ---------------------------------------------------------------------------

function extractFilenameTokens(images) {
  // Returns concatenated lowercase filename text for token-based matching
  const out = [];
  for (const img of images || []) {
    if (img.includes("yupoo-image")) continue; // proxied — no team info
    const fn = (img.split("/").pop() || "").split("?")[0];
    out.push(fn);
  }
  return out.join(" ").toLowerCase();
}

/** Vote across ALL signals; returns { slug, support: { ... }, confidence }.
 *
 * Signal weights (per audit findings — `tags` is catastrophically unreliable
 * because the supplier reuses tags across copy-of'd SKUs):
 *   nameHe       : weight 3 — what users actually see
 *   image        : weight 3 — what users actually look at
 *   cn           : weight 2 — Chinese supplier handle is clean
 *   sourceHandleHe : weight 2 — but often "copy-of-OTHER-team" stale
 *   sourceHandleLatin : weight 1
 *   nameEn       : weight 1
 *   tags         : weight 0 — informational only, never decisive
 */
function resolveTeam(p) {
  const filename = extractFilenameTokens(p.images);
  const sig = {
    image: findLatinSlug(filename) || findTranslitSlug(filename),
    sourceHandleHe: findHeSlug(p.sourceHandle || ""),
    sourceHandleLatin: findTranslitSlug(p.sourceHandle || ""),
    nameHe: findHeSlug(p.nameHe || ""),
    // nameHe sometimes also contains Latin tokens like "AC" — check those too
    nameHeLatin: findLatinSlug(p.nameHe || ""),
    nameEn: findLatinSlug(p.nameEn || ""),
    cn: findCnSlug(p.sourceHandleCn || ""),
    tags: (() => {
      for (const t of p.tags || []) {
        const s = findHeSlug(t) || findLatinSlug(t);
        if (s) return s;
      }
      return null;
    })(),
  };

  const WEIGHTS = {
    nameHe: 3,
    image: 3,
    cn: 2,
    sourceHandleHe: 2,
    nameHeLatin: 2,
    sourceHandleLatin: 1,
    nameEn: 1,
    tags: 0, // informational only
  };

  const tally = new Map();
  const sources = new Map();
  for (const [src, slug] of Object.entries(sig)) {
    if (!slug) continue;
    const w = WEIGHTS[src] ?? 0;
    if (w === 0) {
      // Still record source for the report, but don't add to tally
      if (!sources.has(slug)) sources.set(slug, []);
      sources.get(slug).push(src);
      continue;
    }
    tally.set(slug, (tally.get(slug) || 0) + w);
    if (!sources.has(slug)) sources.set(slug, []);
    sources.get(slug).push(src);
  }

  if (tally.size === 0) return { slug: null, votes: 0, sources: {}, signals: sig };

  const sorted = [...tally.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    // Tie-break: prefer the slug supported by image/nameHe (highest-quality signals)
    const aHasStrong = sources
      .get(a[0])
      .some((s) => s === "image" || s === "nameHe");
    const bHasStrong = sources
      .get(b[0])
      .some((s) => s === "image" || s === "nameHe");
    if (aHasStrong !== bHasStrong) return bHasStrong ? 1 : -1;
    return 0;
  });

  // Single-signal threshold: if best slug has only ONE supporting signal AND
  // that signal is a low-weight one (sourceHandleLatin, nameEn), treat as
  // "no signal" to avoid false positives.
  const winnerSrcs = sources.get(sorted[0][0]).filter((s) => WEIGHTS[s] > 0);
  if (winnerSrcs.length === 1 && WEIGHTS[winnerSrcs[0]] === 1) {
    return { slug: null, votes: 0, sources: Object.fromEntries(sources), signals: sig, weakOnly: true };
  }

  return {
    slug: sorted[0][0],
    votes: sorted[0][1],
    sources: Object.fromEntries(sources),
    signals: sig,
    conflict: tally.size > 1,
  };
}

// ---------------------------------------------------------------------------
// AUDIT LOOP
// ---------------------------------------------------------------------------

const stats = {
  total: products.length,
  unchanged: 0,
  fixedSlug: 0,
  fixedLeague: 0,
  fixedCategory: 0,
  fixedAll: 0,
  noSignal: 0,
  conflicts: 0,
  newIsSpecial: 0,
};

const changes = [];
const conflicts = [];
const noSignal = [];

for (const p of products) {
  const res = resolveTeam(p);

  if (!res.slug) {
    // No signal found → mark as special (per user's instruction)
    stats.noSignal++;
    noSignal.push({
      id: p.id,
      currentSlug: p.teamSlug,
      currentLeague: p.league,
      nameHe: p.nameHe,
      cn: p.sourceHandleCn,
    });
    if (APPLY) {
      // Don't change team — leave as-is — but mark special so they appear
      // in /collections/special.
      if (!p.isSpecial) {
        p.isSpecial = true;
        stats.newIsSpecial++;
      }
    }
    continue;
  }

  if (res.conflict) {
    stats.conflicts++;
    conflicts.push({
      id: p.id,
      currentSlug: p.teamSlug,
      pickedSlug: res.slug,
      signals: res.signals,
      sources: res.sources,
      nameHe: p.nameHe,
    });
  }

  const team = TEAMS[res.slug];
  if (!team) {
    // Resolved to a slug we don't recognise yet — log
    if (!noSignal.find((x) => x.id === p.id)) {
      noSignal.push({
        id: p.id,
        currentSlug: p.teamSlug,
        pickedSlug: res.slug,
        nameHe: p.nameHe,
        note: "slug not in registry",
      });
    }
    continue;
  }

  const currentLeague = p.league;
  const currentSlug = p.teamSlug;
  const currentCat = p.category;
  const expectedLeague = team.league;
  const expectedCat = team.category;
  const slugChange = currentSlug !== res.slug;
  const leagueChange = currentLeague !== expectedLeague;
  const catChange = currentCat !== expectedCat;

  if (!slugChange && !leagueChange && !catChange) {
    stats.unchanged++;
    continue;
  }

  if (slugChange) stats.fixedSlug++;
  if (leagueChange) stats.fixedLeague++;
  if (catChange) stats.fixedCategory++;
  if (slugChange && leagueChange) stats.fixedAll++;

  changes.push({
    id: p.id,
    nameHe: p.nameHe,
    from: { slug: currentSlug, league: currentLeague, category: currentCat },
    to: { slug: res.slug, league: expectedLeague, category: expectedCat },
    votes: res.votes,
    sources: res.sources,
  });

  if (APPLY) {
    p.teamSlug = res.slug;
    p.team = team.he;
    p.league = expectedLeague;
    p.category = expectedCat;
  }
}

if (APPLY) {
  fs.writeFileSync(FILE, JSON.stringify(products, null, 2));
}

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify({ stats, changes, conflicts, noSignal }, null, 2));

console.log("=== MASTER AUDIT REPORT ===");
console.log("Total products      :", stats.total);
console.log("Unchanged           :", stats.unchanged);
console.log("Fixed slug          :", stats.fixedSlug);
console.log("Fixed league        :", stats.fixedLeague);
console.log("Fixed category      :", stats.fixedCategory);
console.log("Fixed all 3         :", stats.fixedAll);
console.log("No signal (special) :", stats.noSignal);
console.log("Marked isSpecial    :", stats.newIsSpecial);
console.log("Conflicting signals :", stats.conflicts);
console.log("");
if (APPLY) {
  console.log("Wrote changes to", FILE);
} else {
  console.log("DRY RUN — pass --apply to write changes");
}
console.log("Full report:", REPORT);
