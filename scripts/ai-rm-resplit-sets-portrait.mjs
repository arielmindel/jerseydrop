#!/usr/bin/env node
/**
 * Re-split SET-variant AI renders into PORTRAIT compositions.
 *
 * The supplier's SET source files are 2×2 grids (jersey front | shorts front /
 * jersey back | shorts back). The previous two attempts cut them vertically
 * (gave us jersey-only + shorts-only) and horizontally (gave us "tops"
 * landscape strips). Neither matches a normal PDP gallery, which expects
 * portrait jersey-sized images.
 *
 * This pass extracts the 4 quadrants, then vertically stacks TL on top of
 * TR for front.jpg and BL on top of BR for back.jpg. Result: a portrait
 * image where the jersey sits above the matching shorts — exactly what a
 * customer would see in a real product photo.
 *
 *   ┌──────────────┬──────────────┐
 *   │     TL       │      TR      │      ┌────────┐  ┌────────┐
 *   │ jersey front │ shorts front │  →   │   TL   │  │   BL   │
 *   ├──────────────┼──────────────┤      ├────────┤  ├────────┤
 *   │      BL      │      BR      │      │   TR   │  │   BR   │
 *   │ jersey back  │ shorts back  │      └────────┘  └────────┘
 *   └──────────────┴──────────────┘       front.jpg   back.jpg
 *
 * Overwrites the existing ai-products/{slug}/front.jpg + back.jpg keys.
 * Old wide / vertical-strip versions are gone — but the R2 keys never
 * changed name, so the catalog needs no mutation.
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
const STATE_PATH = path.join(
  ROOT,
  "data",
  "ai-resplit-sets-portrait-state.json",
);
const ERRORS_PATH = path.join(
  ROOT,
  "data",
  "ai-resplit-sets-portrait-errors.json",
);
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

const VARIANT_SUFFIX = {
  "adult-SS": "",
  "adult-LS": "-long-sleeve",
  set: "-set",
  "kids-set": "-kids-set",
  kids: "-kids",
  "kids-LS": "-kids-long-sleeve",
  "kids-LS-set": "-kids-ls-set",
};
const SET_VARIANTS = new Set(["set", "kids-set", "kids-LS-set"]);

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
    throw new Error(`Unknown variant '${row.variant}'`);
  return `real-madrid-${row.kitType}-${row.season}${suffix}`;
}

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

// ---------------------------------------------------------------------------
// Build a portrait by extracting 4 quadrants then stacking
// the "left column" (TL on top of TR for front, BL on top of BR for back).
// ---------------------------------------------------------------------------
async function buildSetHalves(srcPath) {
  const meta = await sharp(srcPath).metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h) throw new Error(`No dimensions for ${srcPath}`);
  const halfW = Math.floor(w / 2);
  const halfH = Math.floor(h / 2);

  const extract = (left, top) =>
    sharp(srcPath)
      .extract({ left, top, width: halfW, height: halfH })
      .toBuffer();

  const [TL, TR, BL, BR] = await Promise.all([
    extract(0, 0),
    extract(halfW, 0),
    extract(0, halfH),
    extract(halfW, halfH),
  ]);

  // Compose front = TL stacked above TR, both halfW × halfH.
  const compose = (top, bottom) =>
    sharp({
      create: {
        width: halfW,
        height: halfH * 2,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        { input: top, top: 0, left: 0 },
        { input: bottom, top: halfH, left: 0 },
      ])
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

  const [frontBuf, backBuf] = await Promise.all([
    compose(TL, TR),
    compose(BL, BR),
  ]);
  return { frontBuf, backBuf, finalW: halfW, finalH: halfH * 2 };
}

// ---------------------------------------------------------------------------
async function main() {
  const products = await readSetPrimaries();
  console.log(`SET primaries to re-split as portrait: ${products.length}`);
  if (products.length === 0) return;

  // Sanity check
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
      const { frontBuf, backBuf, finalW, finalH } = await buildSetHalves(
        p.fullPath,
      );
      const frontKey = `ai-products/${p.slug}/front.jpg`;
      const backKey = `ai-products/${p.slug}/back.jpg`;
      await Promise.all([
        s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: frontKey,
            Body: frontBuf,
            ContentType: "image/jpeg",
            CacheControl: "public, max-age=31536000, immutable",
          }),
        ),
        s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: backKey,
            Body: backBuf,
            ContentType: "image/jpeg",
            CacheControl: "public, max-age=31536000, immutable",
          }),
        ),
      ]);
      state.done[p.slug] = {
        srcFile: p.fullPath,
        variant: p.variant,
        finalDim: `${finalW}×${finalH}`,
        frontBytes: frontBuf.length,
        backBytes: backBuf.length,
        uploadedAt: new Date().toISOString(),
      };
      completed++;
      console.log(`  ✓ ${p.slug}  ${finalW}×${finalH}  front=${frontBuf.length}B back=${backBuf.length}B`);
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
  console.log("=== Portrait re-split done ===");
  console.log(`Products: ${products.length}`);
  console.log(`Uploaded: ${completed} pairs → ${completed * 2} files`);
  console.log(`Failed:   ${failed}`);
  console.log(`Elapsed:  ${elapsed}s`);
  console.log(`State:    ${STATE_PATH}`);
  if (failed > 0) process.exit(2);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
