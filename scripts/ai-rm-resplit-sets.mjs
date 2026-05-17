#!/usr/bin/env node
/**
 * Re-split SET-variant AI images using a TOP/BOTTOM cut instead of the
 * earlier left/right cut.
 *
 * The supplier's SET renders are a 2×2 grid:
 *
 *   ┌──────────────┬──────────────┐
 *   │ jersey front │ shorts front │   ← top half  = SET FRONT
 *   ├──────────────┼──────────────┤
 *   │ jersey back  │ shorts back  │   ← bottom    = SET BACK
 *   └──────────────┴──────────────┘
 *
 * The earlier vertical split therefore stored "jersey-only" and "shorts-only"
 * under front.jpg / back.jpg. We now overwrite those two keys with the top
 * half and bottom half — that's the full set on both pages of the gallery.
 *
 * Only re-processes primaries where the variant contains "set" — adult set,
 * kids-set, kids-LS-set. Adult-SS / adult-LS / kids / kids-LS jerseys keep
 * the existing left/right split (they're correct).
 *
 * R2 keys (and the catalog URLs that point at them) stay identical — only
 * the bytes change. No catalog mutation needed.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
const STATE_PATH = path.join(ROOT, "data", "ai-resplit-sets-state.json");
const ERRORS_PATH = path.join(ROOT, "data", "ai-resplit-sets-errors.json");
const CONCURRENCY = 4;
const JPEG_QUALITY = 90;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ---- Slug derivation (matches Phase 2/3) ----------------------------------
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

// SET-style variants: their 2×2 grid encodes top=front, bottom=back.
const SET_VARIANTS = new Set(["set", "kids-set", "kids-LS-set"]);

// ---- main -----------------------------------------------------------------
async function readSetPrimaries() {
  const text = await fs.readFile(CSV, "utf8");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const header = lines[0].split(",");
  const idx = {};
  header.forEach((h, i) => (idx[h] = i));
  const rows = lines.slice(1).map((l) => l.split(","));
  const filtered = rows
    .filter((r) => r[idx.catalog_status] !== "concept-no-match")
    .filter((r) => r[idx.is_primary] === "true")
    .filter((r) => SET_VARIANTS.has(r[idx.variant]))
    .map((r) => ({
      filename: r[idx.filename],
      fullPath: remapPath(r[idx.full_path]),
      kitType: r[idx.kit_type],
      variant: r[idx.variant],
      season: normSeason(r[idx.season]),
      catalogStatus: r[idx.catalog_status],
      catalogSlugRaw: r[idx.catalog_slug],
    }));
  // De-dupe by slug — keep first primary
  const seen = new Set();
  const out = [];
  for (const r of filtered) {
    const slug = targetSlugFor(r);
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ ...r, slug });
  }
  return out;
}

async function loadJsonOr(p, fallback) {
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch {
    return fallback;
  }
}

async function main() {
  const products = await readSetPrimaries();
  console.log(`SET-style primaries to re-split: ${products.length}`);
  if (products.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  // Sanity — every source file must exist
  let missing = 0;
  for (const p of products) {
    if (!existsSync(p.fullPath)) {
      console.warn(`  ✗ missing source: ${p.fullPath}`);
      missing++;
    }
  }
  if (missing > 0) {
    console.error(`Aborting — ${missing} source files not on disk.`);
    process.exit(1);
  }

  const state = await loadJsonOr(STATE_PATH, {
    startedAt: new Date().toISOString(),
    done: {},
  });
  const errors = await loadJsonOr(ERRORS_PATH, { errors: [] });
  const flushState = async () => {
    await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2));
    await fs.writeFile(ERRORS_PATH, JSON.stringify(errors, null, 2));
  };

  const limit = pLimit(CONCURRENCY);
  let completed = 0;
  let failed = 0;
  const startedAt = Date.now();

  async function processOne(p) {
    try {
      const img = sharp(p.fullPath);
      const meta = await img.metadata();
      const w = meta.width;
      const h = meta.height;
      if (!w || !h)
        throw new Error(`No dimensions for ${p.fullPath}`);
      const halfH = Math.floor(h / 2);

      const [topBuf, bottomBuf] = await Promise.all([
        sharp(p.fullPath)
          .extract({ left: 0, top: 0, width: w, height: halfH })
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer(),
        sharp(p.fullPath)
          .extract({ left: 0, top: halfH, width: w, height: h - halfH })
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer(),
      ]);

      const frontKey = `ai-products/${p.slug}/front.jpg`;
      const backKey = `ai-products/${p.slug}/back.jpg`;
      await Promise.all([
        s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: frontKey,
            Body: topBuf,
            ContentType: "image/jpeg",
            CacheControl: "public, max-age=31536000, immutable",
          }),
        ),
        s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: backKey,
            Body: bottomBuf,
            ContentType: "image/jpeg",
            CacheControl: "public, max-age=31536000, immutable",
          }),
        ),
      ]);
      state.done[p.slug] = {
        srcFile: p.fullPath,
        variant: p.variant,
        frontBytes: topBuf.length,
        backBytes: bottomBuf.length,
        uploadedAt: new Date().toISOString(),
      };
      completed++;
      console.log(`  ✓ ${p.slug}  (${p.variant})`);
    } catch (err) {
      failed++;
      const msg = err?.message || String(err);
      errors.errors.push({
        when: new Date().toISOString(),
        slug: p.slug,
        srcFile: p.fullPath,
        error: msg,
      });
      console.warn(`  ✗ ${p.slug} — ${msg}`);
    }
  }

  await Promise.all(products.map((p) => limit(() => processOne(p))));
  await flushState();

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log("");
  console.log("=== Re-split (top/bottom) done ===");
  console.log(`Products: ${products.length}`);
  console.log(`Uploaded: ${completed} pairs → ${completed * 2} files`);
  console.log(`Failed:   ${failed}`);
  console.log(`Elapsed:  ${elapsed}s`);
  console.log(`State:    ${STATE_PATH}`);
  console.log(`Errors:   ${ERRORS_PATH}`);
  if (failed > 0) process.exit(2);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
