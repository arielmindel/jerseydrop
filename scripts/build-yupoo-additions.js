#!/usr/bin/env node
/**
 * Build yupoo-catalog-additions.json — candidate new products for underserved teams.
 * Uses data/yupoo-final-catalog.json + docs/YUPOO_INDEX.json (offline snapshots).
 * Quality > quantity: only verified team/season/type mappings.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "data/yupoo-final-catalog.json"), "utf8"));
const ypIdx = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/YUPOO_INDEX.json"), "utf8"));

function findInCatalog(predicate) {
  return catalog.find(predicate);
}

function pick2(photos) {
  // pick first 2 photos (front + back if available)
  return (photos || []).slice(0, 2);
}

function randomId() {
  return "yp-add-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36).slice(-4);
}

function tagsFor({ team, season, isRetro, isKids, isLongSleeve, type }) {
  const t = ["yupoo", team];
  if (season) t.push(season);
  if (isRetro) t.push("רטרו");
  if (isKids) t.push("ילדים");
  if (isLongSleeve) t.push("שרוול ארוך");
  if (type === "special") t.push("ספיישל");
  return t;
}

function buildProduct(opts) {
  const {
    teamSlug, team, league, season, type,
    nameHe, photos,
    isRetro = false, isKids = false, isLongSleeve = false, isSpecial = false,
    priceTier = "regular", price = 109,
    description = "",
    sourceHandleCn = "",
  } = opts;
  return {
    id: randomId(),
    sourceHandle: "",
    sourceUrl: "",
    sourceHandleCn,
    slug: opts.slug,
    nameHe,
    nameEn: "",
    category: "club",
    league,
    team,
    teamSlug,
    season,
    type,
    isRetro,
    isKids,
    isWorldCup2026: false,
    isSpecial,
    isLongSleeve,
    isShortSuit: priceTier === "adult-set" || priceTier === "kids-set",
    priceFan: price,
    pricePlayer: price,
    priceRetro: price,
    sizes: ["S","M","L","XL","XXL"],
    images: photos,
    tags: tagsFor({ team, season, isRetro, isKids, isLongSleeve, type }),
    colorHe: null,
    description,
    stock: "in-stock",
    sourcePriceMin: null,
    sourcePriceMax: null,
    primaryImage: photos[0],
    imagesOriginal: photos,
    priceTier,
  };
}

const additions = [];

// ============================================================
// ATLETICO MADRID
// Existing: 2004-05 home retro, 2004-05 away retro, 2025-26 away long-sleeve.
// ============================================================
const AM = {
  teamSlug: "atletico-madrid",
  team: "אתלטיקו מדריד",
  league: "la-liga",
};

// 1. 2024-25 home (fan-1: 24-25马竞主)
{
  const album = findInCatalog(x => x.title === "24-25马竞主");
  if (album) {
    additions.push(buildProduct({
      ...AM,
      slug: "atletico-madrid-home-2024-25",
      nameHe: "אתלטיקו מדריד מדי בית 2024/25",
      season: "2024-25",
      type: "home",
      photos: pick2(album.photos),
      description: "<p>חולצת הבית של אתלטיקו מדריד לעונת 2024/25. גזרה אדומה-לבנה קלאסית, איכות פאן ראויה לכל אוהד מתחתית טריבונת המטרופוליטנו.</p>",
      sourceHandleCn: album.title,
    }));
  }
}

// 2. 2025-26 home (fan-1: 25-26红白马竞主场)
{
  const album = findInCatalog(x => x.title === "25-26红白马竞主场");
  if (album) {
    additions.push(buildProduct({
      ...AM,
      slug: "atletico-madrid-home-2025-26",
      nameHe: "אתלטיקו מדריד מדי בית 2025/26",
      season: "2025-26",
      type: "home",
      photos: pick2(album.photos),
      description: "<p>חולצת הבית החדשה של אתלטיקו מדריד לעונת 2025/26. פסים אדומים ולבנים מסורתיים בעיצוב מודרני.</p>",
      sourceHandleCn: album.title,
    }));
  }
}

// 3. 2025-26 away — regular fan (fan-1: 25-26上青马竞客场)
{
  const album = findInCatalog(x => x.title === "25-26上青马竞客场");
  if (album) {
    additions.push(buildProduct({
      ...AM,
      slug: "atletico-madrid-away-2025-26",
      nameHe: "אתלטיקו מדריד מדי חוץ 2025/26",
      season: "2025-26",
      type: "away",
      photos: pick2(album.photos),
      description: "<p>חולצת החוץ של אתלטיקו מדריד 2025/26 בגוון תכלת בהיר. עיצוב נקי ומינימליסטי שמתאים גם מחוץ למגרש.</p>",
      sourceHandleCn: album.title,
    }));
  }
}

// 4. 2025-26 second-away / third (fan-1: 25-26上青马竞2客场)
{
  const album = findInCatalog(x => x.title === "25-26上青马竞2客场");
  if (album) {
    additions.push(buildProduct({
      ...AM,
      slug: "atletico-madrid-third-2025-26",
      nameHe: "אתלטיקו מדריד מדי שלישי 2025/26",
      season: "2025-26",
      type: "third",
      photos: pick2(album.photos),
      description: "<p>חולצת המדי השלישי של אתלטיקו מדריד לעונת 2025/26. גרסה אלטרנטיבית בגוון ייחודי.</p>",
      sourceHandleCn: album.title,
    }));
  }
}

// 5. 2025-26 home long-sleeve (player-2: 25-26马竞主场（长袖款）)
{
  const album = findInCatalog(x => x.title && x.title.includes("25-26马竞主场") && x.title.includes("长袖"));
  if (album) {
    additions.push(buildProduct({
      ...AM,
      slug: "atletico-madrid-home-2025-26-long-sleeve",
      nameHe: "אתלטיקו מדריד מדי בית שרוול ארוך 2025/26",
      season: "2025-26",
      type: "home",
      photos: pick2(album.photos),
      isLongSleeve: true,
      priceTier: "long-sleeve",
      price: 129,
      description: "<p>חולצת הבית של אתלטיקו מדריד 2025/26 בגרסת שרוול ארוך. אידיאלי לערבי כדורגל קרירים.</p>",
      sourceHandleCn: album.title,
    }));
  }
}

// 6. Retro 1999-00 home
{
  const r = ypIdx.retro_3072503479.albums.find(a => a.title_cn === "99-00马竞主场");
  if (r) {
    additions.push(buildProduct({
      ...AM,
      slug: "atletico-madrid-retro-1999-00-home",
      nameHe: "אתלטיקו מדריד רטרו 1999/00 בית",
      season: "1999-00",
      type: "retro",
      photos: pick2(r.photo_urls),
      isRetro: true,
      description: "<p>חולצה רטרו של אתלטיקו מדריד מעונת 1999/00. נוסטלגיה אמיתית למעריצים ותיקים.</p>",
      sourceHandleCn: r.title_cn,
    }));
  }
}

// 7. Retro 1995-96 home
{
  const r = ypIdx.retro_3072503479.albums.find(a => a.title_cn === "95/96马竞主场");
  if (r) {
    additions.push(buildProduct({
      ...AM,
      slug: "atletico-madrid-retro-1995-96-home",
      nameHe: "אתלטיקו מדריד רטרו 1995/96 בית",
      season: "1995-96",
      type: "retro",
      photos: pick2(r.photo_urls),
      isRetro: true,
      description: "<p>החולצה האייקונית של אתלטיקו מדריד מעונת הזכייה הכפולה ב-1995/96 — אליפות הליגה וגביע המלך.</p>",
      sourceHandleCn: r.title_cn,
    }));
  }
}

// 8. Retro 1994-95 home
{
  const r = ypIdx.retro_3072503479.albums.find(a => a.title_cn === "94/95马竞主场");
  if (r) {
    additions.push(buildProduct({
      ...AM,
      slug: "atletico-madrid-retro-1994-95-home",
      nameHe: "אתלטיקו מדריד רטרו 1994/95 בית",
      season: "1994-95",
      type: "retro",
      photos: pick2(r.photo_urls),
      isRetro: true,
      description: "<p>חולצה רטרו קלאסית של אתלטיקו מדריד מעונת 1994/95.</p>",
      sourceHandleCn: r.title_cn,
    }));
  }
}

// 9. 2025-26 away adult set (short-suit: 2526马竞客场成人套装)
{
  const album = findInCatalog(x => x.title === "2526马竞客场成人套装");
  if (album) {
    additions.push(buildProduct({
      ...AM,
      slug: "atletico-madrid-away-2025-26-adult-set",
      nameHe: "אתלטיקו מדריד סט חוץ למבוגרים 2025/26",
      season: "2025-26",
      type: "away",
      photos: pick2(album.photos),
      priceTier: "adult-set",
      price: 189,
      description: "<p>סט חוץ מלא של אתלטיקו מדריד למבוגרים לעונת 2025/26 — חולצה ומכנסיים.</p>",
      sourceHandleCn: album.title,
    }));
  }
}

// ============================================================
// MONACO — special centenary edition (player-1: 摩纳哥百年纪念版)
// ============================================================
{
  const album = findInCatalog(x => x.title === "摩纳哥百年纪念版");
  if (album) {
    additions.push(buildProduct({
      teamSlug: "monaco",
      team: "מונאקו",
      league: "ligue-1",
      slug: "monaco-special-centenary",
      nameHe: "מונאקו מהדורת מאה שנה ספיישל",
      season: null,
      type: "special",
      photos: pick2(album.photos),
      isSpecial: true,
      priceTier: "special",
      price: 119,
      description: "<p>מהדורה מיוחדת של מונאקו לציון 100 שנה למועדון. עיצוב יוקרתי וייחודי שלא יהיה לכולם.</p>",
      sourceHandleCn: album.title,
    }));
  }
}

// Write output
const outPath = path.join(ROOT, "data/yupoo-catalog-additions.json");
fs.writeFileSync(outPath, JSON.stringify(additions, null, 2));
console.log("Wrote " + additions.length + " products to " + outPath);

// Breakdown
const byTeam = {};
for (const a of additions) byTeam[a.teamSlug] = (byTeam[a.teamSlug] || 0) + 1;
console.log("\nBreakdown:");
for (const [t, n] of Object.entries(byTeam)) console.log("  " + t + ": " + n);
