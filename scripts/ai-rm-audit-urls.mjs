#!/usr/bin/env node
/**
 * Audit every Real Madrid product against the AI-image strategy:
 *
 *   - If the slug appears in the variants CSV (either catalog_status=="exists"
 *     or was added in Phase 2) it MUST have exactly:
 *         images:        [ <PUB>/ai-products/{slug}/front.jpg,
 *                          <PUB>/ai-products/{slug}/back.jpg ]
 *         primaryImage:  <PUB>/ai-products/{slug}/front.jpg
 *
 *   - If a RM product is NOT in the CSV, it's expected to keep its prior
 *     Yupoo / Shopify / older /products/ R2 URL — that's intentional, no AI
 *     image was generated for it.
 *
 * Flags any deviation: missing pair, extra entries, mixed sources, or wrong
 * order. Writes the findings to data/ai-cleanup-needed.json — does NOT
 * mutate the catalog. The user reviews first.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const CATALOG = path.join(ROOT, "data", "sporthub-products.json");
const CSV =
  "/Users/arielmindel/claude memory/Real Madrid - Variants Mapped.csv";
const OUT = path.join(ROOT, "data", "ai-cleanup-needed.json");

const PUB = process.env.R2_PUBLIC_URL;
if (!PUB) {
  console.error("R2_PUBLIC_URL missing from .env.local");
  process.exit(1);
}

const VARIANT_SUFFIX = {
  "adult-SS": "",
  "adult-LS": "-long-sleeve",
  set: "-set",
  "kids-set": "-kids-set",
  kids: "-kids",
  "kids-LS": "-kids-long-sleeve",
  "kids-LS-set": "-kids-ls-set",
};
function normSeason(s) {
  if (!s) return s;
  const m = s.match(/^(\d{4})-(\d{2,4})$/);
  if (!m) return s;
  const end = m[2].length === 4 ? m[2].slice(2) : m[2];
  return `${m[1]}-${end.padStart(2, "0")}`;
}

// ---- Build the set of slugs that should have AI images --------------------
function buildAiSlugSet() {
  const text = fs.readFileSync(CSV, "utf8");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const header = lines[0].split(",");
  const idx = {};
  header.forEach((h, i) => (idx[h] = i));
  const rows = lines.slice(1).map((l) => l.split(","));
  const slugs = new Set();
  for (const r of rows) {
    if (r[idx.catalog_status] === "concept-no-match") continue;
    const status = r[idx.catalog_status];
    if (status === "exists") {
      slugs.add(r[idx.catalog_slug]);
    } else {
      // missing → compute the same slug Phase 2 created
      const suffix = VARIANT_SUFFIX[r[idx.variant]];
      if (suffix === undefined) continue;
      slugs.add(
        `real-madrid-${r[idx.kit_type]}-${normSeason(r[idx.season])}${suffix}`,
      );
    }
  }
  return slugs;
}

// ---- main -----------------------------------------------------------------
const aiSlugs = buildAiSlugSet();
console.log(`Slugs flagged as "should have AI images" in CSV: ${aiSlugs.size}`);

const products = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const rm = products.filter((p) => p.teamSlug === "real-madrid");
console.log(`Real Madrid products in catalog: ${rm.length}`);

const flagged = [];

for (const p of rm) {
  if (!aiSlugs.has(p.slug)) continue; // not in CSV → not audited
  const expectedFront = `${PUB}/ai-products/${p.slug}/front.jpg`;
  const expectedBack = `${PUB}/ai-products/${p.slug}/back.jpg`;
  const issues = [];
  const imgs = Array.isArray(p.images) ? p.images : [];

  if (imgs.length !== 2) issues.push(`images.length=${imgs.length} (want 2)`);
  if (imgs[0] !== expectedFront) issues.push(`images[0] !== expected front`);
  if (imgs[1] !== expectedBack) issues.push(`images[1] !== expected back`);
  if (p.primaryImage !== expectedFront) issues.push(`primaryImage drift`);

  // Source-mix sniff — if ANY image still references the old /products/
  // namespace, Yupoo, Shopify CDN, or the legacy proxy, that's a leak.
  for (const u of imgs) {
    if (typeof u !== "string") continue;
    if (u.includes("/products/")) issues.push(`legacy '/products/' URL leak: ${u}`);
    if (u.includes("photo.yupoo.com") || u.includes("/api/yupoo-image"))
      issues.push(`Yupoo URL leak: ${u}`);
    if (u.includes("cdn.shopify.com")) issues.push(`Shopify CDN leak: ${u}`);
  }

  if (issues.length > 0) {
    flagged.push({
      slug: p.slug,
      images: imgs,
      primaryImage: p.primaryImage,
      issues,
    });
  }
}

fs.writeFileSync(OUT, JSON.stringify({ flagged }, null, 2));

console.log("");
console.log("=== Audit done ===");
console.log(`Audited (slugs from CSV present in catalog): ${
  rm.filter((p) => aiSlugs.has(p.slug)).length
}`);
console.log(`Flagged (need cleanup):                       ${flagged.length}`);
console.log(`Report: ${OUT}`);
if (flagged.length > 0) {
  console.log("");
  console.log("Top 5 flagged:");
  flagged.slice(0, 5).forEach((f) => {
    console.log(`  • ${f.slug}`);
    f.issues.forEach((i) => console.log(`      ${i}`));
  });
}
