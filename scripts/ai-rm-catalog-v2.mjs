#!/usr/bin/env node
/**
 * v2 catalog cleanup — keep ONLY the Real Madrid SKUs whose slugs
 * appear in the intended-slugs allow-list (i.e., the ones we just
 * re-split + uploaded in v2). Every other RM row is removed.
 *
 * For each intended slug:
 *   - If a catalog row already exists → set its images / primaryImage
 *     to the ai-products/{slug}/{front,back}.jpg pair and clear any
 *     `imageQuality: "low"` flag.
 *   - If not → clone the closest existing RM product as a template and
 *     append a new entry (slug, nameHe, type, variant flags, etc.).
 *
 * Output:
 *   - data/sporthub-products.json mutated in place
 *   - data/ai-catalog-v2-report.json (kept / added / removed lists)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const CATALOG = path.join(ROOT, "data", "sporthub-products.json");
const INTENDED_PATH = path.join(
  ROOT,
  "data",
  "ai-resplit-v2-intended-slugs.json",
);
const REPORT_PATH = path.join(ROOT, "data", "ai-catalog-v2-report.json");
const VARIANTS_CSV =
  "/Users/arielmindel/claude memory/Real Madrid - Variants Mapped.csv";

const PUB = process.env.R2_PUBLIC_URL;
if (!PUB) {
  console.error("R2_PUBLIC_URL missing from .env.local");
  process.exit(1);
}

// ---- Mirror of resplit-v2 — kept identical so behaviour stays in sync ----
const KIDS_OVERRIDE_SLUG = {
  "kids_001.png": "real-madrid-home-2017-18-kids",
  "kids_002.png": "real-madrid-third-2013-14-kids",
  "kids_004.png": "real-madrid-away-2016-17-kids-t-1386",
  "kids_005.png": "real-madrid-home-2012-13-kids",
};
const KIDS_RECLASS = new Set(Object.keys(KIDS_OVERRIDE_SLUG));

const VARIANT_SPEC = {
  "adult-SS": { suffix: "", isKids: false, isLS: false, isShortSuit: false, sizes: ["S","M","L","XL","XXL"], tier: "regular" },
  "adult-LS": { suffix: "-long-sleeve", isKids: false, isLS: true,  isShortSuit: false, sizes: ["S","M","L","XL","XXL"], tier: "long-sleeve" },
  set:        { suffix: "-set", isKids: false, isLS: false, isShortSuit: true,  sizes: ["S","M","L","XL","XXL"], tier: "adult-set" },
  "kids-set": { suffix: "-kids-set", isKids: true, isLS: false, isShortSuit: true,  sizes: ["16","18","20","22","24","26","28"], tier: "kids-set" },
  kids:       { suffix: "-kids", isKids: true, isLS: false, isShortSuit: false, sizes: ["16","18","20","22","24","26","28"], tier: "regular" },
  "kids-LS":  { suffix: "-kids-long-sleeve", isKids: true, isLS: true,  isShortSuit: false, sizes: ["16","18","20","22","24","26","28"], tier: "long-sleeve" },
  "kids-LS-set": { suffix: "-kids-ls-set", isKids: true, isLS: true,  isShortSuit: true,  sizes: ["16","18","20","22","24","26","28"], tier: "kids-set" },
  "ls-set":   { suffix: "-ls-set", isKids: false, isLS: true,  isShortSuit: true,  sizes: ["S","M","L","XL","XXL"], tier: "adult-set" },
};

const TYPE_HE = {
  home: "בית",
  away: "חוץ",
  third: "חוץ שלישי",
  goalkeeper: "שוער",
  special: "מהדורה מיוחדת",
};

function normSeason(s) {
  if (!s) return s;
  const m = s.match(/^(\d{4})-(\d{2,4})$/);
  if (!m) return s;
  const end = m[2].length === 4 ? m[2].slice(2) : m[2];
  return `${m[1]}-${end.padStart(2, "0")}`;
}

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

// ---- Load inputs ----
const intended = JSON.parse(fs.readFileSync(INTENDED_PATH, "utf8"));
const products = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const variantsCsv = parse(fs.readFileSync(VARIANTS_CSV, "utf8"), {
  columns: true,
  skip_empty_lines: true,
});
const vByFilename = new Map();
for (const r of variantsCsv) {
  if (!vByFilename.has(r.filename)) vByFilename.set(r.filename, r);
}

// Build metadata per intended slug: derive season/type/variant for cloning
const slugMeta = new Map();
for (const entry of intended.slugs) {
  const vRow = vByFilename.get(entry.filename);
  if (!vRow) {
    console.warn(
      `  ! no variants-CSV row for ${entry.filename} — cannot derive metadata`,
    );
    continue;
  }
  const variant = KIDS_RECLASS.has(entry.filename) ? "kids" : vRow.variant;
  const season = normSeason(vRow.season);
  const kitType = vRow.kit_type;
  if (!VARIANT_SPEC[variant]) {
    console.warn(`  ! unknown variant '${variant}' for ${entry.filename}`);
    continue;
  }
  slugMeta.set(entry.slug, {
    variant,
    season,
    kitType,
    isMissing: vRow.catalog_status === "missing",
  });
}

const intendedSlugSet = new Set(slugMeta.keys());
console.log(`Intended slugs from v2: ${intendedSlugSet.size}`);

// ---- Index existing RM products ----
const isRm = (p) => p.teamSlug === "real-madrid" || p.team === "ריאל מדריד";
const rmExisting = products.filter(isRm);
const bySlug = new Map(rmExisting.map((p) => [p.slug, p]));
console.log(`Existing RM products in catalog: ${rmExisting.length}`);

function pickTemplate(kitType, variant) {
  const spec = VARIANT_SPEC[variant];
  const tryFinds = [
    (p) => p.type === kitType && !!p.isKids === spec.isKids && !!p.isLongSleeve === spec.isLS && !!p.isShortSuit === spec.isShortSuit,
    (p) => p.type === kitType && !!p.isKids === spec.isKids && !!p.isLongSleeve === spec.isLS,
    (p) => p.type === kitType && !!p.isKids === spec.isKids,
    (p) => p.type === kitType,
    () => true,
  ];
  for (const fn of tryFinds) {
    const t = rmExisting.find(fn);
    if (t) return t;
  }
  return rmExisting[0];
}

// ---- Per-intended-slug update / add ----
const report = {
  generatedAt: new Date().toISOString(),
  updated: [], // already in catalog → updated images
  added: [], // newly created
  removed: [], // RM rows pruned (slug not in intended set)
};

for (const [slug, meta] of slugMeta) {
  const front = `${PUB}/ai-products/${slug}/front.jpg`;
  const back = `${PUB}/ai-products/${slug}/back.jpg`;
  let p = bySlug.get(slug);
  if (p) {
    if (
      !Array.isArray(p.imagesOriginal) ||
      p.imagesOriginal.length === 0
    ) {
      p.imagesOriginal = Array.isArray(p.images) ? [...p.images] : [];
    }
    p.images = [front, back];
    p.primaryImage = front;
    if (p.imageQuality === "low") p.imageQuality = null;
    report.updated.push({ slug, action: "updated-existing" });
  } else {
    const spec = VARIANT_SPEC[meta.variant];
    const template = pickTemplate(meta.kitType, meta.variant);
    const id = `ai-v2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const isSpecial = meta.kitType === "special";
    const newProduct = {
      ...JSON.parse(JSON.stringify(template)),
      id,
      slug,
      nameHe: nameHeFor(meta.kitType, meta.variant, meta.season),
      nameEn: "",
      season: meta.season,
      type: meta.kitType,
      isRetro: parseInt(meta.season.slice(0, 4), 10) < 2020,
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
      images: [front, back],
      imagesLocal: [],
      imagesOriginal: [],
      primaryImage: front,
      tags: [
        "ריאל מדריד",
        spec.isKids ? "ילדים" : "מבוגרים",
        spec.isLS ? "שרוול ארוך" : null,
        "ai-expansion",
      ].filter(Boolean),
      description: "<p>חולצת ריאל מדריד אותנטית. צילומים מקצועיים של JerseyDrop.</p>",
      stock: "in-stock",
      sourceHandle: "",
      sourceUrl: "",
      sourceHandleCn: "",
      sourcePriceMin: null,
      sourcePriceMax: null,
      colorHe: null,
      imageQuality: null,
      addedAt: "2026-05-17",
      source: "ai-expansion-v2",
    };
    products.push(newProduct);
    bySlug.set(slug, newProduct);
    report.added.push({ slug, action: "added-new", variant: meta.variant, season: meta.season, kitType: meta.kitType });
  }
}

// ---- Remove any RM product whose slug is NOT in intended set ----
const before = products.length;
const kept = products.filter((p) => {
  if (!isRm(p)) return true; // non-RM untouched
  if (intendedSlugSet.has(p.slug)) return true;
  report.removed.push({
    slug: p.slug,
    nameHe: p.nameHe,
    hadAiImages: Array.isArray(p.images) && p.images[0]?.includes?.("/ai-products/"),
  });
  return false;
});
const after = kept.length;
console.log(`Catalog: ${before} → ${after}  (-${before - after})`);

// Persist
fs.writeFileSync(CATALOG, JSON.stringify(kept, null, 2));
fs.writeFileSync(
  REPORT_PATH,
  JSON.stringify(
    {
      ...report,
      stats: {
        intendedSlugs: intendedSlugSet.size,
        rmBefore: rmExisting.length,
        rmAfter: kept.filter(isRm).length,
        updatedCount: report.updated.length,
        addedCount: report.added.length,
        removedCount: report.removed.length,
        catalogBefore: before,
        catalogAfter: after,
      },
    },
    null,
    2,
  ),
);

console.log("");
console.log("=== Catalog v2 cleanup done ===");
console.log(`Updated existing:        ${report.updated.length}`);
console.log(`Newly added:             ${report.added.length}`);
console.log(`Removed (not in intent): ${report.removed.length}`);
console.log(`Final RM count:          ${kept.filter(isRm).length}`);
console.log(`Final catalog count:     ${after}`);
console.log(`Report:                  ${REPORT_PATH}`);
