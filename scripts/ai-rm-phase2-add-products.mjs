#!/usr/bin/env node
/**
 * Phase 2 — Add 24 missing Real Madrid product variants to the catalog.
 *
 * Reads the variants CSV, picks rows with catalog_status === "missing", groups
 * by (season, kit_type, variant), then clones a similar existing RM product
 * for each group and mutates it into the new SKU. Image fields are left
 * empty here — Phase 4 fills them with the R2 URLs Phase 3 uploads.
 *
 * Re-run safe: skips slugs that already exist.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CATALOG = path.join(ROOT, "data", "sporthub-products.json");
const CSV =
  "/Users/arielmindel/claude memory/Real Madrid - Variants Mapped.csv";

// ---- Variant → slug suffix + flags + sizes + tier --------------------------
const VARIANT_SPEC = {
  "adult-SS": {
    suffix: "",
    isKids: false,
    isLS: false,
    isShortSuit: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    tier: "regular",
  },
  "adult-LS": {
    suffix: "-long-sleeve",
    isKids: false,
    isLS: true,
    isShortSuit: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    tier: "long-sleeve",
  },
  set: {
    suffix: "-set",
    isKids: false,
    isLS: false,
    isShortSuit: true,
    sizes: ["S", "M", "L", "XL", "XXL"],
    tier: "adult-set",
  },
  "kids-set": {
    suffix: "-kids-set",
    isKids: true,
    isLS: false,
    isShortSuit: true,
    sizes: ["16", "18", "20", "22", "24", "26", "28"],
    tier: "kids-set",
  },
  kids: {
    suffix: "-kids",
    isKids: true,
    isLS: false,
    isShortSuit: false,
    sizes: ["16", "18", "20", "22", "24", "26", "28"],
    tier: "regular",
  },
  "kids-LS": {
    suffix: "-kids-long-sleeve",
    isKids: true,
    isLS: true,
    isShortSuit: false,
    sizes: ["16", "18", "20", "22", "24", "26", "28"],
    tier: "long-sleeve",
  },
  "kids-LS-set": {
    suffix: "-kids-ls-set",
    isKids: true,
    isLS: true,
    isShortSuit: true,
    sizes: ["16", "18", "20", "22", "24", "26", "28"],
    tier: "kids-set",
  },
};

// ---- Hebrew labels ---------------------------------------------------------
const TYPE_HE = {
  home: "בית",
  away: "חוץ",
  third: "חוץ שלישי",
  goalkeeper: "שוער",
  special: "מהדורה מיוחדת",
};

function nameHeFor(kitType, variant, season) {
  const typeWord = TYPE_HE[kitType] || kitType;
  const parts = ["ריאל מדריד", typeWord, season];
  if (variant === "set") parts.push("- סט מבוגרים");
  else if (variant === "kids-set") parts.push("- סט ילדים");
  else if (variant === "adult-LS") parts.push("שרוול ארוך");
  else if (variant === "kids") parts.push("- ילדים");
  else if (variant === "kids-LS") parts.push("- ילדים שרוול ארוך");
  else if (variant === "kids-LS-set") parts.push("- סט ילדים שרוול ארוך");
  return parts.join(" ");
}

// ---- CSV parsing -----------------------------------------------------------
function parseCsv(text) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const header = lines[0].split(",");
  const idx = {};
  header.forEach((h, i) => (idx[h] = i));
  const rows = lines.slice(1).map((l) => l.split(","));
  return { idx, rows };
}

function normalizeSeason(s) {
  // CSV has both "1999-00" and "1999-2000" — collapse to YYYY-YY canonical.
  if (!s) return s;
  const m = s.match(/^(\d{4})-(\d{2,4})$/);
  if (!m) return s;
  const start = parseInt(m[1], 10);
  let endRaw = m[2];
  if (endRaw.length === 4) endRaw = endRaw.slice(2);
  return `${start}-${endRaw.padStart(2, "0")}`;
}

// ---- main ------------------------------------------------------------------
const products = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const csv = fs.readFileSync(CSV, "utf8");
const { idx, rows } = parseCsv(csv);

const missing = rows.filter((r) => r[idx.catalog_status] === "missing");

// Group by normalized (season, kit_type, variant)
const groups = new Map();
for (const r of missing) {
  const season = normalizeSeason(r[idx.season]);
  const kitType = r[idx.kit_type];
  const variant = r[idx.variant];
  const key = `${season}|${kitType}|${variant}`;
  if (!groups.has(key)) groups.set(key, { season, kitType, variant });
}

const rm = products.filter((p) => p.teamSlug === "real-madrid");

function pickTemplate(kitType, variant, season) {
  const spec = VARIANT_SPEC[variant];
  // Priority: exact (type, season, kids, LS) → (type, kids, LS) → (type, kids) → (type) → any RM
  const tryFinds = [
    (p) =>
      p.type === kitType &&
      p.season === season &&
      !!p.isKids === spec.isKids &&
      !!p.isLongSleeve === spec.isLS,
    (p) =>
      p.type === kitType &&
      !!p.isKids === spec.isKids &&
      !!p.isLongSleeve === spec.isLS,
    (p) => p.type === kitType && !!p.isKids === spec.isKids,
    (p) => p.type === kitType,
    () => true,
  ];
  for (const fn of tryFinds) {
    const t = rm.find(fn);
    if (t) return t;
  }
  return rm[0];
}

let added = 0;
let skippedExists = 0;
const newRows = [];

for (const g of groups.values()) {
  const spec = VARIANT_SPEC[g.variant];
  if (!spec) {
    console.warn(`  ! unknown variant '${g.variant}' — skipped`);
    continue;
  }
  const targetSlug = `real-madrid-${g.kitType}-${g.season}${spec.suffix}`;
  if (products.some((p) => p.slug === targetSlug)) {
    skippedExists++;
    console.log(`  • ${targetSlug} already exists — skipping`);
    continue;
  }
  const template = pickTemplate(g.kitType, g.variant, g.season);
  const isSpecial = g.kitType === "special";
  const id = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const newProduct = {
    ...JSON.parse(JSON.stringify(template)),
    id,
    slug: targetSlug,
    nameHe: nameHeFor(g.kitType, g.variant, g.season),
    nameEn: "",
    season: g.season,
    type: g.kitType,
    isRetro: parseInt(g.season.slice(0, 4), 10) < 2020,
    isKids: spec.isKids,
    isWorldCup2026: false,
    isSpecial,
    isLongSleeve: spec.isLS,
    isShortSuit: spec.isShortSuit,
    priceFan: null,
    pricePlayer: null,
    priceRetro: null,
    priceTier: spec.tier,
    sizes: spec.sizes,
    images: [],
    imagesLocal: [],
    imagesOriginal: [],
    primaryImage: null,
    tags: [
      "ריאל מדריד",
      spec.isKids ? "ילדים" : "מבוגרים",
      spec.isLS ? "שרוול ארוך" : null,
      "ai-expansion",
    ].filter(Boolean),
    description: "<p>חולצת ריאל מדריד אותנטית. תמונות וצילומים מקצועיים של JerseyDrop.</p>",
    stock: "in-stock",
    sourceHandle: "",
    sourceUrl: "",
    sourceHandleCn: "",
    sourcePriceMin: null,
    sourcePriceMax: null,
    colorHe: null,
    imageQuality: null,
    addedAt: "2026-05-16",
    source: "ai-expansion",
  };
  products.push(newProduct);
  newRows.push({ slug: targetSlug, templateSlug: template.slug });
  added++;
}

fs.writeFileSync(CATALOG, JSON.stringify(products, null, 2));
console.log("");
console.log("=== Phase 2 done ===");
console.log(`Added:           ${added}`);
console.log(`Skipped (exists): ${skippedExists}`);
console.log(`Catalog total:   ${products.length}`);
console.log("New slugs:");
for (const n of newRows) console.log(`  + ${n.slug.padEnd(55)} (← ${n.templateSlug})`);
