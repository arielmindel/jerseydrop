#!/usr/bin/env node
/**
 * Phase 4 — Replace `images[]` on every Real Madrid SKU we uploaded in
 * Phase 3 with the R2 public URLs. Preserves the previous URLs in
 * `imagesOriginal[]` (if it was empty/unset) for rollback.
 *
 * Inputs:
 *   - data/ai-migration-state.json   ← from Phase 3 (the source of truth
 *                                       for which slug got which R2 keys)
 *   - data/sporthub-products.json    ← catalog
 *
 * Output: data/sporthub-products.json mutated in place.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const CATALOG = path.join(ROOT, "data", "sporthub-products.json");
const STATE_PATH = path.join(ROOT, "data", "ai-migration-state.json");

const PUBLIC_BASE = process.env.R2_PUBLIC_URL;
if (!PUBLIC_BASE) {
  console.error("R2_PUBLIC_URL missing from .env.local");
  process.exit(1);
}

const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
const products = JSON.parse(fs.readFileSync(CATALOG, "utf8"));

// Build slug → ordered list of R2 keys (sorted by seq).
const bySlug = new Map();
for (const [stateKey, info] of Object.entries(state.done)) {
  const [slug, seqStr] = stateKey.split("/");
  const seq = parseInt(seqStr, 10);
  if (!bySlug.has(slug)) bySlug.set(slug, []);
  bySlug.get(slug).push({ seq, key: info.key });
}
for (const list of bySlug.values()) list.sort((a, b) => a.seq - b.seq);

let updated = 0;
let missingSlug = 0;
let backupSet = 0;
const samples = [];

for (const [slug, entries] of bySlug) {
  const product = products.find((p) => p.slug === slug);
  if (!product) {
    missingSlug++;
    console.warn(`  ! slug not in catalog: ${slug}`);
    continue;
  }
  const newUrls = entries.map((e) => `${PUBLIC_BASE}/${e.key}`);

  // Preserve the old images in imagesOriginal[] — but only if empty/missing.
  // Don't overwrite a prior backup (could be a deeper history).
  const hadOriginal =
    Array.isArray(product.imagesOriginal) && product.imagesOriginal.length > 0;
  if (!hadOriginal) {
    product.imagesOriginal = Array.isArray(product.images)
      ? [...product.images]
      : [];
    backupSet++;
  }

  product.images = newUrls;
  product.primaryImage = newUrls[0];

  // Newly photographed → clear any prior imageQuality:"low" hide flag.
  if (product.imageQuality === "low") product.imageQuality = null;

  updated++;
  if (samples.length < 5) {
    samples.push({ slug, count: newUrls.length, first: newUrls[0] });
  }
}

fs.writeFileSync(CATALOG, JSON.stringify(products, null, 2));

console.log("=== Phase 4 done ===");
console.log(`Slugs in R2 state:           ${bySlug.size}`);
console.log(`Products updated in catalog: ${updated}`);
console.log(`imagesOriginal backups set:  ${backupSet}`);
console.log(`Slugs not found in catalog:  ${missingSlug}`);
console.log("");
console.log("Sample updated products:");
for (const s of samples) {
  console.log(`  ${s.slug} (${s.count} images)`);
  console.log(`    primary: ${s.first}`);
}
