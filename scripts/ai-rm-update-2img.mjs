#!/usr/bin/env node
/**
 * Phase 4 (new strategy) — Rewrite every Real Madrid SKU we split-uploaded
 * so its `images[]` array is EXACTLY:
 *   [ ${R2_PUBLIC_URL}/ai-products/{slug}/front.jpg,
 *     ${R2_PUBLIC_URL}/ai-products/{slug}/back.jpg ]
 *
 * Replaces any mix of old Yupoo URLs, prior multi-image AI URLs, or
 * 4-5-image carousel duplicates. Preserves `imagesOriginal[]` as-is (the
 * deepest historical backup — never overwrite).
 *
 * Source of truth = data/ai-split-state.json (Phase 3 output).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const CATALOG = path.join(ROOT, "data", "sporthub-products.json");
const STATE_PATH = path.join(ROOT, "data", "ai-split-state.json");

const PUBLIC_BASE = process.env.R2_PUBLIC_URL;
if (!PUBLIC_BASE) {
  console.error("R2_PUBLIC_URL missing from .env.local");
  process.exit(1);
}

const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
const products = JSON.parse(fs.readFileSync(CATALOG, "utf8"));

// Group state by slug → which sides are present
const bySlug = new Map();
for (const stateKey of Object.keys(state.done)) {
  const [slug, side] = stateKey.split("/");
  if (!bySlug.has(slug)) bySlug.set(slug, new Set());
  bySlug.get(slug).add(side);
}

let updated = 0;
let skippedIncomplete = 0;
let missingSlug = 0;
let unhiddenLow = 0;
const samples = [];

for (const [slug, sides] of bySlug) {
  if (!sides.has("front") || !sides.has("back")) {
    skippedIncomplete++;
    console.warn(
      `  ! skipping ${slug} — missing side(s): ${["front", "back"]
        .filter((s) => !sides.has(s))
        .join(", ")}`,
    );
    continue;
  }
  const product = products.find((p) => p.slug === slug);
  if (!product) {
    missingSlug++;
    console.warn(`  ! slug not in catalog: ${slug}`);
    continue;
  }
  const frontUrl = `${PUBLIC_BASE}/ai-products/${slug}/front.jpg`;
  const backUrl = `${PUBLIC_BASE}/ai-products/${slug}/back.jpg`;

  // Preserve the deepest historical originals — only set if empty/missing.
  if (
    !Array.isArray(product.imagesOriginal) ||
    product.imagesOriginal.length === 0
  ) {
    product.imagesOriginal = Array.isArray(product.images)
      ? [...product.images]
      : [];
  }

  product.images = [frontUrl, backUrl];
  product.primaryImage = frontUrl;
  if (product.imageQuality === "low") {
    product.imageQuality = null;
    unhiddenLow++;
  }
  updated++;
  if (samples.length < 5) samples.push({ slug, frontUrl, backUrl });
}

fs.writeFileSync(CATALOG, JSON.stringify(products, null, 2));

console.log("=== Phase 4 done ===");
console.log(`Slugs in split-state:        ${bySlug.size}`);
console.log(`Products updated in catalog: ${updated}`);
console.log(`Newly unhidden (was low):    ${unhiddenLow}`);
console.log(`Skipped — incomplete sides:  ${skippedIncomplete}`);
console.log(`Skipped — slug not found:    ${missingSlug}`);
console.log("");
console.log("Sample updated products:");
for (const s of samples) {
  console.log(`  ${s.slug}`);
  console.log(`    front: ${s.frontUrl}`);
  console.log(`    back:  ${s.backUrl}`);
}
