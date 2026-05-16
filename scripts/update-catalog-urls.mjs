#!/usr/bin/env node
// Rewrite data/sporthub-products.json `images` array to point at R2 for every
// product whose ALL images uploaded successfully (per data/migration-state.json).
//
// Products with ANY non-uploaded image are left untouched (keeps existing
// shopify/yupoo/proxy URLs working). `imagesOriginal` and `imagesLocal` are
// preserved.
//
// Run AFTER scripts/migrate-images-to-r2.mjs.

import * as dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const { R2_PUBLIC_URL } = process.env;
if (!R2_PUBLIC_URL) {
  console.error("Missing R2_PUBLIC_URL in .env.local");
  process.exit(1);
}

const CATALOG_PATH = path.join(ROOT, "data", "sporthub-products.json");
const STATE_PATH = path.join(ROOT, "data", "migration-state.json");
const BACKUP_PATH = path.join(
  ROOT,
  "data",
  `sporthub-products.pre-r2.${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
);

async function main() {
  const catalog = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8"));
  const state = JSON.parse(await fs.readFile(STATE_PATH, "utf8"));

  // Snapshot before mutating
  await fs.writeFile(BACKUP_PATH, JSON.stringify(catalog, null, 2));
  console.log(`Backup written: ${BACKUP_PATH}`);

  let migratedCount = 0;
  let skippedCount = 0;
  const skippedSlugs = [];

  for (const product of catalog) {
    const slug = product.slug;
    const imgs = product.images || [];
    if (imgs.length === 0) {
      skippedCount++;
      continue;
    }
    const s = state[slug];
    if (!s) {
      skippedCount++;
      skippedSlugs.push(`${slug}: no state`);
      continue;
    }
    const allUploaded = imgs.every((_, i) => s.uploaded[i] === true);
    if (!allUploaded) {
      skippedCount++;
      const missing = imgs
        .map((_, i) => (s.uploaded[i] ? null : i))
        .filter((x) => x !== null);
      skippedSlugs.push(`${slug}: missing indices ${missing.join(",")}`);
      continue;
    }

    // Preserve imagesOriginal (untouched). Initialize from current `images`
    // only if not already set, so we never overwrite a real prior original.
    if (!product.imagesOriginal || product.imagesOriginal.length === 0) {
      product.imagesOriginal = [...imgs];
    }

    const newUrls = imgs.map((_, i) => {
      const ext = s.ext?.[i] || "jpg";
      return `${R2_PUBLIC_URL}/products/${slug}/${i}.${ext}`;
    });
    product.images = newUrls;
    if (product.primaryImage) {
      product.primaryImage = newUrls[0];
    }
    migratedCount++;
  }

  await fs.writeFile(CATALOG_PATH, JSON.stringify(catalog, null, 2));

  console.log(`\nDone.`);
  console.log(`  Migrated: ${migratedCount} products`);
  console.log(`  Skipped: ${skippedCount} products`);
  if (skippedSlugs.length) {
    console.log(`\nFirst 10 skipped products:`);
    skippedSlugs.slice(0, 10).forEach((s) => console.log(`  - ${s}`));
    if (skippedSlugs.length > 10)
      console.log(`  ...and ${skippedSlugs.length - 10} more`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
