export type LeagueId =
  | "premier-league"
  | "la-liga"
  | "serie-a"
  | "bundesliga"
  | "ligue-1"
  | "other";

export type NationTier = "tier-1" | "tier-2" | "tier-3";

export type LeagueInfo = {
  id: LeagueId;
  slug: LeagueId;
  nameHe: string;
  nameEn: string;
  country: string;
  teams: string[];
};

export const LEAGUES: LeagueInfo[] = [
  {
    id: "premier-league",
    slug: "premier-league",
    nameHe: "פרמייר ליג",
    nameEn: "Premier League",
    country: "אנגליה",
    teams: [
      "Manchester United",
      "Liverpool",
      "Manchester City",
      "Arsenal",
      "Chelsea",
      "Tottenham",
      "Newcastle",
      "Aston Villa",
    ],
  },
  {
    id: "la-liga",
    slug: "la-liga",
    nameHe: "לה ליגה",
    nameEn: "La Liga",
    country: "ספרד",
    teams: [
      "Real Madrid",
      "Barcelona",
      "Atletico Madrid",
      "Sevilla",
      "Betis",
      "Athletic Bilbao",
    ],
  },
  {
    id: "serie-a",
    slug: "serie-a",
    nameHe: "סריה א",
    nameEn: "Serie A",
    country: "איטליה",
    teams: ["AC Milan", "Inter Milan", "Juventus", "Napoli", "Roma", "Lazio"],
  },
  {
    id: "bundesliga",
    slug: "bundesliga",
    nameHe: "בונדסליגה",
    nameEn: "Bundesliga",
    country: "גרמניה",
    teams: ["Bayern Munich", "Borussia Dortmund"],
  },
  {
    id: "ligue-1",
    slug: "ligue-1",
    nameHe: "ליג 1",
    nameEn: "Ligue 1",
    country: "צרפת",
    teams: ["PSG", "Marseille", "Lyon"],
  },
  {
    id: "other",
    slug: "other",
    nameHe: "אחר",
    nameEn: "Other Leagues",
    country: "ברזיל, MLS, הולנד, פורטוגל, סקוטלנד",
    teams: [
      "Inter Miami",
      "Flamengo",
      "Boca Juniors",
      "Ajax",
      "Benfica",
      "Sporting",
      "Celtic",
    ],
  },
];

export type NationInfo = {
  slug: string;
  nameHe: string;
  nameEn: string;
  flag: string;
  tier: NationTier;
};

export const NATIONS: NationInfo[] = [
  { slug: "argentina", nameHe: "ארגנטינה", nameEn: "Argentina", flag: "🇦🇷", tier: "tier-1" },
  { slug: "brazil", nameHe: "ברזיל", nameEn: "Brazil", flag: "🇧🇷", tier: "tier-1" },
  { slug: "portugal", nameHe: "פורטוגל", nameEn: "Portugal", flag: "🇵🇹", tier: "tier-1" },
  { slug: "france", nameHe: "צרפת", nameEn: "France", flag: "🇫🇷", tier: "tier-1" },
  { slug: "spain", nameHe: "ספרד", nameEn: "Spain", flag: "🇪🇸", tier: "tier-1" },
  { slug: "germany", nameHe: "גרמניה", nameEn: "Germany", flag: "🇩🇪", tier: "tier-1" },
  { slug: "england", nameHe: "אנגליה", nameEn: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: "tier-1" },
  { slug: "netherlands", nameHe: "הולנד", nameEn: "Netherlands", flag: "🇳🇱", tier: "tier-2" },
  { slug: "italy", nameHe: "איטליה", nameEn: "Italy", flag: "🇮🇹", tier: "tier-2" },
  { slug: "belgium", nameHe: "בלגיה", nameEn: "Belgium", flag: "🇧🇪", tier: "tier-2" },
  { slug: "japan", nameHe: "יפן", nameEn: "Japan", flag: "🇯🇵", tier: "tier-2" },
  { slug: "morocco", nameHe: "מרוקו", nameEn: "Morocco", flag: "🇲🇦", tier: "tier-2" },
  { slug: "usa", nameHe: "ארה״ב", nameEn: "USA", flag: "🇺🇸", tier: "tier-2" },
  { slug: "mexico", nameHe: "מקסיקו", nameEn: "Mexico", flag: "🇲🇽", tier: "tier-2" },
  { slug: "colombia", nameHe: "קולומביה", nameEn: "Colombia", flag: "🇨🇴", tier: "tier-3" },
  { slug: "croatia", nameHe: "קרואטיה", nameEn: "Croatia", flag: "🇭🇷", tier: "tier-3" },
  { slug: "turkey", nameHe: "טורקיה", nameEn: "Turkey", flag: "🇹🇷", tier: "tier-3" },
  { slug: "south-korea", nameHe: "דרום קוריאה", nameEn: "South Korea", flag: "🇰🇷", tier: "tier-3" },
  { slug: "saudi-arabia", nameHe: "ערב הסעודית", nameEn: "Saudi Arabia", flag: "🇸🇦", tier: "tier-3" },
  { slug: "scotland", nameHe: "סקוטלנד", nameEn: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", tier: "tier-3" },
  { slug: "switzerland", nameHe: "שוויץ", nameEn: "Switzerland", flag: "🇨🇭", tier: "tier-3" },
  { slug: "norway", nameHe: "נורווגיה", nameEn: "Norway", flag: "🇳🇴", tier: "tier-3" },
  { slug: "chile", nameHe: "צ׳ילה", nameEn: "Chile", flag: "🇨🇱", tier: "tier-3" },
  { slug: "nigeria", nameHe: "ניגריה", nameEn: "Nigeria", flag: "🇳🇬", tier: "tier-3" },
  { slug: "senegal", nameHe: "סנגל", nameEn: "Senegal", flag: "🇸🇳", tier: "tier-3" },
  { slug: "ghana", nameHe: "גאנה", nameEn: "Ghana", flag: "🇬🇭", tier: "tier-3" },
  { slug: "wales", nameHe: "וויילס", nameEn: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", tier: "tier-3" },
];

export const TIER_LABELS: Record<NationTier, { he: string; en: string; description: string }> = {
  "tier-1": {
    he: "Must-have",
    en: "Tier 1",
    description: "החולצות הכי מבוקשות — המועדפות של הקהל הישראלי",
  },
  "tier-2": {
    he: "Popular",
    en: "Tier 2",
    description: "נבחרות חזקות עם קהל נאמן",
  },
  "tier-3": {
    he: "אחר",
    en: "Tier 3",
    description: "נבחרות נוספות שזמינות להזמנה",
  },
};

export const WORLD_CUP_START_UTC = Date.UTC(2026, 5, 11, 18, 0, 0);

export const SHIPPING = {
  freeThreshold: 249,
  standardFee: 29,
  leadTimeDays: "10-15",
};

export const CUSTOMIZATION_FEE = 30;

export const SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"] as const;
export type Size = (typeof SIZES)[number];
