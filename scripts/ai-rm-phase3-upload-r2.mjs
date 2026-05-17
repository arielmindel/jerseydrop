#!/usr/bin/env node
/**
 * Phase 3 — Upload all 96 approved AI images to Cloudflare R2.
 *
 * Key pattern: ai-products/{slug}/{seq}.jpg (seq=0 is the primary; 1+ are
 * carousel images in CSV order).
 *
 * Fully resumable via data/ai-migration-state.json — re-running skips any
 * (slug, seq) already uploaded. Errors are appended to
 * data/ai-migration-errors.json and the run continues.
 *
 * Progress log every 20 uploads.
 */
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import pLimit from "p-limit";
import * as dotenv from "dotenv";
import mime from "mime-types";
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
const STATE_PATH = path.join(ROOT, "data", "ai-migration-state.json");
const ERRORS_PATH = path.join(ROOT, "data", "ai-migration-errors.json");

const CONCURRENCY = 8;
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

// ---- Shared variant → slug suffix (must match Phase 2) ---------------------
const VARIANT_SUFFIX = {
  "adult-SS": "",
  "adult-LS": "-long-sleeve",
  set: "-set",
  "kids-set": "-kids-set",
  kids: "-kids",
  "kids-LS": "-kids-long-sleeve",
  "kids-LS-set": "-kids-ls-set",
};

function normalizeSeason(s) {
  if (!s) return s;
  const m = s.match(/^(\d{4})-(\d{2,4})$/);
  if (!m) return s;
  const start = parseInt(m[1], 10);
  let end = m[2];
  if (end.length === 4) end = end.slice(2);
  return `${start}-${end.padStart(2, "0")}`;
}

function remapPath(p) {
  return p.replace(
    "/Users/arielmindel/jerseydrop_approved_images/",
    "/Users/arielmindel/Downloads/jerseydrop_approved_images/",
  );
}

// ---- CSV reader ------------------------------------------------------------
async function readCsv() {
  const text = await fs.readFile(CSV, "utf8");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const header = lines[0].split(",");
  const idx = {};
  header.forEach((h, i) => (idx[h] = i));
  const rows = lines.slice(1).map((l) => l.split(","));
  return rows
    .filter((r) => r[idx.catalog_status] !== "concept-no-match")
    .map((r) => ({
      filename: r[idx.filename],
      fullPath: remapPath(r[idx.full_path]),
      kitType: r[idx.kit_type],
      variant: r[idx.variant],
      season: normalizeSeason(r[idx.season]),
      catalogStatus: r[idx.catalog_status],
      catalogSlugRaw: r[idx.catalog_slug],
      isPrimary: r[idx.is_primary] === "true",
    }));
}

function targetSlugFor(row) {
  if (row.catalogStatus === "exists") return row.catalogSlugRaw;
  // missing → compute same slug Phase 2 generated
  const suffix = VARIANT_SUFFIX[row.variant];
  if (suffix === undefined)
    throw new Error(`Unknown variant '${row.variant}' for ${row.filename}`);
  return `real-madrid-${row.kitType}-${row.season}${suffix}`;
}

// ---- State / errors --------------------------------------------------------
async function loadJsonOr(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(await fs.readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function main() {
  const rows = await readCsv();
  console.log(`Workable CSV rows: ${rows.length}`);

  // Group rows by slug, then within each slug:
  //   - primaries (in CSV order) come first
  //   - secondaries (in CSV order) come after
  //   - seq is assigned 0..N. So the FIRST primary gets seq=0 (the cover);
  //     additional primaries and secondaries take the next slots.
  // This avoids the seq=0 collision when CSV has multiple "primary" rows
  // for the same SKU (the supplier shipped several candidate front shots).
  const bySlug = new Map();
  for (const r of rows) {
    const slug = targetSlugFor(r);
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push(r);
  }
  const tasks = [];
  for (const [slug, list] of bySlug) {
    const primaries = list.filter((r) => r.isPrimary);
    const secondaries = list.filter((r) => !r.isPrimary);
    let seq = 0;
    for (const r of [...primaries, ...secondaries]) {
      tasks.push({ ...r, slug, seq });
      seq++;
    }
  }
  console.log(`Tasks queued: ${tasks.length}`);

  // Load resumable state
  const state = await loadJsonOr(STATE_PATH, {
    startedAt: new Date().toISOString(),
    done: {}, // key: "slug/seq" → {key, contentType, bytes, uploadedAt}
  });
  const errors = await loadJsonOr(ERRORS_PATH, { errors: [] });

  const limit = pLimit(CONCURRENCY);
  let completed = 0;
  let skipped = 0;
  let failed = 0;
  let processed = 0;
  const startedAt = Date.now();

  const flushState = async () => {
    await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2));
    await fs.writeFile(ERRORS_PATH, JSON.stringify(errors, null, 2));
  };

  async function uploadOne(task) {
    const stateKey = `${task.slug}/${task.seq}`;
    if (state.done[stateKey]) {
      skipped++;
      return;
    }
    const ext = path.extname(task.fullPath).slice(1).toLowerCase() || "jpg";
    const r2Ext = ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)
      ? ext
      : "jpg";
    const objectKey = `ai-products/${task.slug}/${task.seq}.${r2Ext}`;
    try {
      const buf = await fs.readFile(task.fullPath);
      const ct =
        mime.lookup(task.fullPath) ||
        (ext === "png" ? "image/png" : "image/jpeg");
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
        sourceFile: task.fullPath,
        uploadedAt: new Date().toISOString(),
      };
      completed++;
    } catch (err) {
      failed++;
      const msg = err?.message || String(err);
      errors.errors.push({
        when: new Date().toISOString(),
        slug: task.slug,
        seq: task.seq,
        src: task.fullPath,
        key: objectKey,
        error: msg,
      });
      console.warn(`  ✗ ${objectKey}  — ${msg}`);
    } finally {
      processed++;
      if (processed % PROGRESS_EVERY === 0) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
        console.log(
          `  [${processed}/${tasks.length}] done=${completed} skipped=${skipped} failed=${failed} (${elapsed}s)`,
        );
      }
      if (processed % FLUSH_EVERY === 0) await flushState();
    }
  }

  await Promise.all(tasks.map((t) => limit(() => uploadOne(t))));
  await flushState();

  console.log("");
  console.log("=== Phase 3 done ===");
  console.log(`Total tasks: ${tasks.length}`);
  console.log(`Uploaded:    ${completed}`);
  console.log(`Skipped:     ${skipped} (already in state)`);
  console.log(`Failed:      ${failed}`);
  console.log(`State file:  ${STATE_PATH}`);
  console.log(`Errors file: ${ERRORS_PATH}`);
  if (failed > 0) process.exit(2);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
