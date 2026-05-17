#!/usr/bin/env node
/**
 * v2 re-split — per-image layout classification.
 *
 * Input: /Users/arielmindel/claude memory/Real Madrid - Image Layouts.csv
 *   (80 rows, layout_type ∈ {A, C, D, E}; Type B is a planned label that
 *    isn't present in this batch.)
 *
 * Per layout (overwrites ai-products/{slug}/front.jpg + back.jpg):
 *   A — vertical-cut-50.   left half  → front,   right half → back
 *   B — horizontal-cut-50. top half   → front,   bottom half → back
 *   C — 2×2 standard.      TL+TR stacked → front (jersey/shorts front),
 *                          BL+BR stacked → back
 *   D — 2×2 reversed.      TL+BL stacked → front (jersey+shorts FRONT),
 *                          TR+BR stacked → back  (jersey+shorts BACK)
 *   E — no back view present. SKIP entirely.
 *
 * Per-image overrides (Phase 1):
 *   kids_001 / kids_002 / kids_004 / kids_005 → variant `kids` (jersey-only,
 *   not kids-set). Their target slug is fixed via KIDS_OVERRIDE_SLUG.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import pLimit from "p-limit";
import * as dotenv from "dotenv";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

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

const LAYOUTS_CSV =
  "/Users/arielmindel/claude memory/Real Madrid - Image Layouts.csv";
const VARIANTS_CSV =
  "/Users/arielmindel/claude memory/Real Madrid - Variants Mapped.csv";
const STATE_PATH = path.join(ROOT, "data", "ai-resplit-v2-state.json");
const ERRORS_PATH = path.join(ROOT, "data", "ai-resplit-v2-errors.json");
const INTENDED_SLUGS_OUT = path.join(
  ROOT,
  "data",
  "ai-resplit-v2-intended-slugs.json",
);
const CONCURRENCY = 4;
const JPEG_QUALITY = 90;
const PROGRESS_EVERY = 20;
const FLUSH_EVERY = 10;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ---------------- Phase 1 — per-image overrides ----------------
const KIDS_OVERRIDE_SLUG = {
  "kids_001.png": "real-madrid-home-2017-18-kids",
  "kids_002.png": "real-madrid-third-2013-14-kids",
  "kids_004.png": "real-madrid-away-2016-17-kids-t-1386",
  "kids_005.png": "real-madrid-home-2012-13-kids",
};
const KIDS_RECLASS = new Set(Object.keys(KIDS_OVERRIDE_SLUG));

// ---------------- Helpers ----------------
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

async function loadCsv(p) {
  const text = await fs.readFile(p, "utf8");
  return parse(text, { columns: true, skip_empty_lines: true });
}

// Build a (filename → variants CSV row) lookup for slug resolution of
// MISSING rows.
async function buildVariantsByFilename() {
  const rows = await loadCsv(VARIANTS_CSV);
  const m = new Map();
  for (const r of rows) {
    if (!m.has(r.filename)) m.set(r.filename, r);
  }
  return m;
}

function resolveSlug(layoutRow, variantsByFilename) {
  // Phase 1 override
  if (KIDS_OVERRIDE_SLUG[layoutRow.filename])
    return KIDS_OVERRIDE_SLUG[layoutRow.filename];
  // Clean slug given directly in layout CSV
  if (layoutRow.slug && !layoutRow.slug.startsWith("("))
    return layoutRow.slug;
  // MISSING — compute from variants CSV using row.season + kit_type +
  // (possibly overridden) variant
  const vRow = variantsByFilename.get(layoutRow.filename);
  if (!vRow)
    throw new Error(
      `Layout row '${layoutRow.filename}' has no matching variants-CSV row to compute slug`,
    );
  const variant = KIDS_RECLASS.has(layoutRow.filename) ? "kids" : vRow.variant;
  const suffix = VARIANT_SUFFIX[variant];
  if (suffix === undefined)
    throw new Error(`Unknown variant '${variant}' for ${layoutRow.filename}`);
  const season = normSeason(vRow.season);
  return `real-madrid-${vRow.kit_type}-${season}${suffix}`;
}

// ---------------- Split logic per layout type ----------------
async function splitTypeA(srcPath) {
  const meta = await sharp(srcPath).metadata();
  const w = meta.width, h = meta.height;
  const halfW = Math.floor(w / 2);
  const [front, back] = await Promise.all([
    sharp(srcPath)
      .extract({ left: 0, top: 0, width: halfW, height: h })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer(),
    sharp(srcPath)
      .extract({ left: halfW, top: 0, width: w - halfW, height: h })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer(),
  ]);
  return { front, back };
}

async function splitTypeB(srcPath) {
  const meta = await sharp(srcPath).metadata();
  const w = meta.width, h = meta.height;
  const halfH = Math.floor(h / 2);
  const [front, back] = await Promise.all([
    sharp(srcPath)
      .extract({ left: 0, top: 0, width: w, height: halfH })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer(),
    sharp(srcPath)
      .extract({ left: 0, top: halfH, width: w, height: h - halfH })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer(),
  ]);
  return { front, back };
}

// 2x2 helper — returns [TL, TR, BL, BR] equal-size buffers.
async function extractQuadrants(srcPath) {
  const meta = await sharp(srcPath).metadata();
  const halfW = Math.floor(meta.width / 2);
  const halfH = Math.floor(meta.height / 2);
  const x = (left, top) =>
    sharp(srcPath)
      .extract({ left, top, width: halfW, height: halfH })
      .toBuffer();
  const [TL, TR, BL, BR] = await Promise.all([
    x(0, 0),
    x(halfW, 0),
    x(0, halfH),
    x(halfW, halfH),
  ]);
  return { TL, TR, BL, BR, halfW, halfH };
}

async function vStack(top, bottom, w, h) {
  return sharp({
    create: {
      width: w,
      height: h * 2,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: top, top: 0, left: 0 },
      { input: bottom, top: h, left: 0 },
    ])
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}

// Type C — TL=jersey-front, TR=shorts-front, BL=jersey-back, BR=shorts-back
async function splitTypeC(srcPath) {
  const { TL, TR, BL, BR, halfW, halfH } = await extractQuadrants(srcPath);
  const [front, back] = await Promise.all([
    vStack(TL, TR, halfW, halfH), // jersey-front on top, shorts-front below
    vStack(BL, BR, halfW, halfH), // jersey-back on top, shorts-back below
  ]);
  return { front, back };
}

// Type D — TL=jersey-front, TR=jersey-back, BL=shorts-front, BR=shorts-back
async function splitTypeD(srcPath) {
  const { TL, TR, BL, BR, halfW, halfH } = await extractQuadrants(srcPath);
  const [front, back] = await Promise.all([
    vStack(TL, BL, halfW, halfH), // jersey-front on top, shorts-front below
    vStack(TR, BR, halfW, halfH), // jersey-back  on top, shorts-back  below
  ]);
  return { front, back };
}

async function splitByLayout(srcPath, layoutType) {
  switch (layoutType) {
    case "A": return splitTypeA(srcPath);
    case "B": return splitTypeB(srcPath);
    case "C": return splitTypeC(srcPath);
    case "D": return splitTypeD(srcPath);
    default:
      throw new Error(`Unknown layout type '${layoutType}'`);
  }
}

// ---------------- main ----------------
async function loadJsonOr(p, fallback) {
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch {
    return fallback;
  }
}

async function main() {
  const layouts = await loadCsv(LAYOUTS_CSV);
  const variantsByFilename = await buildVariantsByFilename();

  // Build tasks list
  const tasks = [];
  const seenSlugs = new Set();
  for (const row of layouts) {
    if (row.layout_type === "E") continue;
    const slug = resolveSlug(row, variantsByFilename);
    if (seenSlugs.has(slug)) continue; // first primary per slug wins
    seenSlugs.add(slug);
    const fullPath = remapPath(row.full_path);
    if (!existsSync(fullPath)) {
      console.warn(`  ✗ missing source: ${fullPath}`);
      continue;
    }
    tasks.push({
      filename: row.filename,
      fullPath,
      layoutType: row.layout_type,
      slug,
    });
  }
  console.log(`Layouts CSV rows: ${layouts.length}`);
  console.log(`Tasks queued (deduped, Type E skipped): ${tasks.length}`);

  // Persist the intended-slug allow-list — Phase B catalog script reads it.
  await fs.writeFile(
    INTENDED_SLUGS_OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        slugs: tasks.map((t) => ({
          slug: t.slug,
          filename: t.filename,
          layoutType: t.layoutType,
        })),
      },
      null,
      2,
    ),
  );

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
  let processed = 0;
  let uploaded = 0;
  let failed = 0;
  const startedAt = Date.now();

  async function processOne(t) {
    try {
      const { front, back } = await splitByLayout(t.fullPath, t.layoutType);
      const frontKey = `ai-products/${t.slug}/front.jpg`;
      const backKey = `ai-products/${t.slug}/back.jpg`;
      await Promise.all([
        s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: frontKey,
            Body: front,
            ContentType: "image/jpeg",
            CacheControl: "public, max-age=31536000, immutable",
          }),
        ),
        s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: backKey,
            Body: back,
            ContentType: "image/jpeg",
            CacheControl: "public, max-age=31536000, immutable",
          }),
        ),
      ]);
      state.done[t.slug] = {
        layoutType: t.layoutType,
        srcFile: t.fullPath,
        frontBytes: front.length,
        backBytes: back.length,
        uploadedAt: new Date().toISOString(),
      };
      uploaded++;
    } catch (err) {
      failed++;
      const msg = err?.message || String(err);
      errors.errors.push({
        when: new Date().toISOString(),
        slug: t.slug,
        srcFile: t.fullPath,
        layoutType: t.layoutType,
        error: msg,
      });
      console.warn(`  ✗ ${t.slug}  [${t.layoutType}]  — ${msg}`);
    } finally {
      processed++;
      if (processed % PROGRESS_EVERY === 0) {
        const el = ((Date.now() - startedAt) / 1000).toFixed(1);
        console.log(
          `  [${processed}/${tasks.length}] uploaded=${uploaded} failed=${failed}  (${el}s)`,
        );
      }
      if (processed % FLUSH_EVERY === 0) await flushState();
    }
  }

  await Promise.all(tasks.map((t) => limit(() => processOne(t))));
  await flushState();

  console.log("");
  console.log("=== v2 re-split done ===");
  console.log(`Tasks:    ${tasks.length}`);
  console.log(`Uploaded: ${uploaded} pairs → ${uploaded * 2} files`);
  console.log(`Failed:   ${failed}`);
  console.log(`State:    ${STATE_PATH}`);
  console.log(`Intended slugs list: ${INTENDED_SLUGS_OUT}`);
  if (failed > 0) process.exit(2);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
