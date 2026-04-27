import patchesConfig from "@catalog/patches-config.json";
import { getAllProducts } from "./products";
import type { Product } from "./types";

const UCL_TEAMS = new Set(
  (patchesConfig as { championsLeague25_26: string[] }).championsLeague25_26,
);

export type CollectionId =
  | "world-cup-2026"
  | "retro-90s"
  | "champions-league"
  | "short-suit"
  | "long-sleeve"
  | "special"
  | "drip"
  | "surprise";

export type CollectionMeta = {
  id: CollectionId;
  slug: CollectionId;
  titleHe: string;
  subtitleHe: string;
  descriptionHe: string;
  /** Hex used for the corner glow + accent badge on the collection hero. */
  accent: string;
  badgeLabel: string;
};

export const COLLECTIONS: Record<CollectionId, CollectionMeta> = {
  "world-cup-2026": {
    id: "world-cup-2026",
    slug: "world-cup-2026",
    titleHe: "מונדיאל 2026 — הקולקציה הרשמית",
    subtitleHe: "הנבחרות שכולם מחכים להן",
    descriptionHe:
      "כל החולצות של נבחרות המונדיאל 2026 — ארגנטינה, ברזיל, פורטוגל, צרפת, ספרד, גרמניה, אנגליה ועוד.",
    accent: "#D4AF37",
    badgeLabel: "FIFA WORLD CUP 2026",
  },
  "retro-90s": {
    id: "retro-90s",
    slug: "retro-90s",
    titleHe: "רטרו 90s — קלאסיקות שלא חוזרות",
    subtitleHe: "החולצות שעוצבו את הסגנון",
    descriptionHe:
      "אסופה של חולצות מהשנים 1990–1999. מבד אותנטי, גזרה כמו של פעם, רפרודוקציות נאמנות למקור.",
    accent: "#D4AF37",
    badgeLabel: "RETRO · 90s CLASSICS",
  },
  "champions-league": {
    id: "champions-league",
    slug: "champions-league",
    titleHe: "ליגת האלופות — קבוצות העילית",
    subtitleHe: "המועדונים שמשחקים על הגביע הגדול ביותר באירופה",
    descriptionHe:
      "כל החולצות של מועדוני ליגת האלופות 2025-26 — Real Madrid, Barcelona, Bayern, PSG, Inter, Juventus, City, Liverpool, Arsenal ועוד.",
    accent: "#00FF88",
    badgeLabel: "UEFA CHAMPIONS LEAGUE 25-26",
  },
  "short-suit": {
    id: "short-suit",
    slug: "short-suit",
    titleHe: "סטים — חולצה + מכנס",
    subtitleHe: "ערכת המשחק המלאה",
    descriptionHe:
      "סטים תואמים — חולצה ומכנס באותו עיצוב. למשחק, לאימון, או לסט שלם של אספן. למבוגרים ולילדים.",
    accent: "#22D3EE",
    badgeLabel: "SHORT SUITS · CONTROL THE LOOK",
  },
  "long-sleeve": {
    id: "long-sleeve",
    slug: "long-sleeve",
    titleHe: "שרוול ארוך",
    subtitleHe: "חולצות בגזרה ארוכה",
    descriptionHe:
      "כל הדגמים בשרוול ארוך — מתאימים לחורף, לשוערים, ולמי שאוהב את המראה הקלאסי.",
    accent: "#A855F7",
    badgeLabel: "LONG SLEEVE",
  },
  special: {
    id: "special",
    slug: "special",
    titleHe: "מיוחדות — חולצות שלא ניתן להשיג בכל מקום",
    subtitleHe: "מהדורות מיוחדות, אספנות ויצירות הוואי",
    descriptionHe:
      "אסופה של חולצות מיוחדות — מהדורות הוואי, מארדונה, באלוגי, ימי הולדת מועדונים, ועוד שאי אפשר למצוא בקטלוג רגיל.",
    accent: "#F59E0B",
    badgeLabel: "SPECIAL EDITIONS",
  },
  drip: {
    id: "drip",
    slug: "drip",
    titleHe: "דריפ — סטריט-וור עם הקבוצות הגדולות",
    subtitleHe: "lifestyle ולא רק על המגרש",
    descriptionHe:
      "החולצות שמתאימות יותר לרחוב מאשר למגרש — קולאבים מיוחדים, מהדורות סטייל, וגזרות שמתאימות לכל יום.",
    accent: "#F472B6",
    badgeLabel: "DRIP · STREETWEAR",
  },
  surprise: {
    id: "surprise",
    slug: "surprise",
    titleHe: "חולצה בהפתעה",
    subtitleHe: "תזמינו, אנחנו נבחר ונפתיע",
    descriptionHe:
      "המהדורה המיוחדת שלנו — הזמינו חולצה בהפתעה ואנחנו נבחר עבורכם דגם איכותי במחיר מוזל. גודל לבחירה, הקבוצה — מפתיעה.",
    accent: "#FCD34D",
    badgeLabel: "MYSTERY DROP",
  },
};

const NINETY_S = /199\d/;

export function getCollectionProducts(id: CollectionId): Product[] {
  const all = getAllProducts();
  switch (id) {
    case "world-cup-2026":
      return all.filter((p) => p.isWorldCup2026);
    case "retro-90s":
      return all.filter(
        (p) =>
          p.isRetro &&
          (NINETY_S.test(p.season || "") ||
            NINETY_S.test(p.nameHe || "") ||
            NINETY_S.test(p.nameEn || "")),
      );
    case "champions-league":
      return all.filter(
        (p) => p.category === "club" && UCL_TEAMS.has(p.teamSlug),
      );
    case "short-suit":
      return all.filter(
        (p) => p.isShortSuit || p.tags?.includes("short-suit"),
      );
    case "long-sleeve":
      return all.filter((p) => p.isLongSleeve);
    case "special":
      return all.filter((p) => p.isSpecial);
    case "drip":
      // Drip is a curated lens on isSpecial — same products, framed as
      // streetwear-first. Once we add real "drip" tags via merch curation
      // we'll narrow this to tags?.includes("drip").
      return all.filter((p) => p.isSpecial);
    case "surprise":
      // Mystery Drop has no specific product list — the page is a feature
      // page (see src/app/collections/surprise/page.tsx).
      return [];
  }
}

export function getCollectionMeta(id: CollectionId): CollectionMeta {
  return COLLECTIONS[id];
}
