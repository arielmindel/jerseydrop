#!/usr/bin/env node
/**
 * Split each primary AI image down the middle (left half = front, right half
 * = back) and upload the two halves to Cloudflare R2 as:
 *   ai-products/{slug}/front.jpg
 *   ai-products/{slug}/back.jpg
 *
 * The previous run uploaded whole side-by-side composites to
 * ai-products/{slug}/0.{ext} — those stay in R2 untouched (rollback path).
 * Phase 4 (separate script) rewrites the catalog to point only at the new
 * front.jpg / back.jpg pair.
 *
 * Resumable: data/ai-split-state.json records every (slug, side) that
 * uploaded successfully. Re-running skips already-done pairs.
 *
 * For each slug we use the FIRST is_primary row in CSV order — there are
 * ~10 slugs in the CSV with multiple "primary" rows (the supplier shipped
 * several candidate renders); we keep only the first per the new strategy.
 */
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import pLimit from "p-limit";
import * as dotenv from "dotenv";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET } =
  process.env;
for (const [k, v] of Object.entries({
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET,
})) {
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
}

const CSV =
  "/Users/arielmindel/claude memory/Real Madrid - Variants Mapped.csv";
const STATE_PATH = path.join(ROOT, "data", "ai-split-state.json");
const ERRORS_PATH = path.join(ROOT, "data", "ai-split-errors.json");

const CONCURRENCY = 4;
const PROGRESS_EVERY = 10;
const FLUSH_EVERY = 5;
const JPEG_QUALITY = 90;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ---- Slug derivation (matches Phase 2 + Phase 3) ---------------------------
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
function remapPath(p) {
  return p.replace(
    "/Users/arielmindel/jerseydrop_approved_images/",
    "/Users/arielmindel/Downloads/jerseydrop_approved_images/",
  );
}
function targetSlugFor(row) {
  if (row.catalogStatus === "exists") return row.catalogSlugRaw;
  const suffix = VARIANT_SUFFIX[row.variant];
  if (suffix === undefined)
    throw new Error(`Unknown variant '${row.variant}' for ${row.filename}`);
  return `real-madrid-${row.kitType}-${row.season}${suffix}`;
}

// ---- CSV reader ------------------------------------------------------------
async function readPrimaries() {
  const text = await fs.readFile(CSV, "utf8");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const header = lines[0].split(",");
  const idx = {};
  header.forEach((h, i) => (idx[h] = i));
  const rows = lines.slice(1).map((l) => l.split(","));
  // Filter: skip concept-no-match, keep only primaries
  const workable = rows
    .filter((r) => r[idx.catalog_status] !== "concept-no-match")
    .filter((r) => r[idx.is_primary] === "true")
    .map((r) => ({
      filename: r[idx.filename],
      fullPath: remapPath(r[idx.full_path]),
      kitType: r[idx.kit_type],
      variant: r[idx.variant],
      season: normSeason(r[idx.season]),
      catalogStatus: r[idx.catalog_status],
      catalogSlugRaw: r[idx.catalog_slug],
    }));
  // De-duplicate by slug — keep FIRST primary per slug, drop extras
  const seen = new Set();
  const out = [];
  for (const r of workable) {
    const slug = targetSlugFor(r);
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ ...r, slug });
  }
  return out;
}

// ---- State / errors --------------------------------------------------------
async function loadJsonOr(p, fallback) {
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch {
    return fallback;
  }
}

// ---- main ------------------------------------------------------------------
async function main() {
  const products = await readPrimaries();
  console.log(`Unique primary products: ${products.length}`);

  // Sanity check — every source file must exist
  let missing = 0;
  for (const p of products) {
    if (!existsSync(p.fullPath)) {
      console.warn(`  ✗ missing source file: ${p.fullPath}`);
      missing++;
    }
  }
  if (missing > 0) {
    console.error(`Aborting — ${missing} source files not on disk.`);
    process.exit(1);
  }

  const state = await loadJsonOr(STATE_PATH, {
    startedAt: new Date().toISOString(),
    done: {}, // key: "slug/side" → { key, contentType, bytes, srcFile, uploadedAt }
  });
  const errors = await loadJsonOr(ERRORS_PATH, { errors: [] });

  const flushState = async () => {
    await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2));
    await fs.writeFile(ERRORS_PATH, JSON.stringify(errors, null, 2));
  };

  const limit = pLimit(CONCURRENCY);
  const startedAt = Date.now();
  let completed = 0; // pairs (slug) fully done
  let skipped = 0;
  let failedPairs = 0;
  let processed = 0;

  async function uploadHalf(slug, side, buf, ct) {
    const stateKey = `${slug}/${side}`;
    if (state.done[stateKey]) return true; // skipped at the (slug, side) level
    const objectKey = `ai-products/${slug}/${side}.jpg`;
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: objectKey,
        Body: buf,
        ContentType: ct,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    state.done[stateKey] = {
      key: objectKey,
      contentType: ct,
      bytes: buf.length,
      uploadedAt: new Date().toISOString(),
    };
    return false;
  }

  async function processOne(p) {
    const frontKey = `${p.slug}/front`;
    const backKey = `${p.slug}/back`;
    const bothDone = state.done[frontKey] && state.done[backKey];
    if (bothDone) {
      skipped++;
      processed++;
      return;
    }
    try {
      const img = sharp(p.fullPath);
      const meta = await img.metadata();
      const w = meta.width;
      const h = meta.height;
      if (!w || !h) throw new Error(`Could not read dimensions of ${p.fullPath}`);
      const halfW = Math.floor(w / 2);

      // Render TWO crops — left (front) and right (back)
      const [frontBuf, backBuf] = await Promise.all([
        sharp(p.fullPath)
          .extract({ left: 0, top: 0, width: halfW, height: h })
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer(),
        sharp(p.fullPath)
          .extract({ left: halfW, top: 0, width: w - halfW, height: h })
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer(),
      ]);

      await uploadHalf(p.slug, "front", frontBuf, "image/jpeg");
      await uploadHalf(p.slug, "back", backBuf, "image/jpeg");

      completed++;
      state.done[frontKey].srcFile = p.fullPath;
      state.done[backKey].srcFile = p.fullPath;
    } catch (err) {
      failedPairs++;
      const msg = err?.message || String(err);
      errors.errors.push({
        when: new Date().toISOString(),
        slug: p.slug,
        srcFile: p.fullPath,
        error: msg,
      });
      console.warn(`  ✗ ${p.slug} — ${msg}`);
    } finally {
      processed++;
      if (processed % PROGRESS_EVERY === 0) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
        console.log(
          `  [${processed}/${products.length}] new=${completed} skipped=${skipped} failed=${failedPairs} (${elapsed}s)`,
        );
      }
      if (processed % FLUSH_EVERY === 0) await flushState();
    }
  }

  await Promise.all(products.map((p) => limit(() => processOne(p))));
  await flushState();

  console.log("");
  console.log("=== Split + upload done ===");
  console.log(`Products processed: ${products.length}`);
  console.log(`Newly uploaded:     ${completed} pair(s) → ${completed * 2} files`);
  console.log(`Skipped (in state): ${skipped}`);
  console.log(`Failed pairs:       ${failedPairs}`);
  const totalDone = Object.keys(state.done).length;
  console.log(`Total state entries: ${totalDone} (each = 1 R2 object)`);
  console.log(`State file:  ${STATE_PATH}`);
  console.log(`Errors file: ${ERRORS_PATH}`);
  if (failedPairs > 0) process.exit(2);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
