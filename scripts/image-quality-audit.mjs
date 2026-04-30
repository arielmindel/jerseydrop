#!/usr/bin/env node
/**
 * Image quality audit — fetch each image, parse JPEG/WebP dimensions,
 * score it, and reorder/drop so:
 *   1. image[0] is always the best front-of-jersey shot
 *   2. close-up details / fabric crops are demoted or dropped
 *   3. extremely tall portrait shots (likely model wearing the jersey)
 *      are demoted because the user wants jersey-only photography
 *
 * Heuristics (tuned to this catalogue's two suppliers — Shopify catalog
 * shots and yupoo album photography):
 *
 *   ASPECT      | INTERPRETATION                        | SCORE
 *   1.20-1.45   | Portrait jersey-on-hanger / catalog   | 100 (best)
 *   1.10-1.20   | Soft portrait, jersey shot            |  85
 *   1.00-1.10   | Square or near-square                 |  60 (close-up)
 *   0.80-1.00   | Landscape or square close-up          |  40
 *   1.45-1.80   | Tall — could be jersey on body / model|  55
 *   > 1.80      | Very tall — almost certainly model    |  30
 *
 *   File size also factored in: < 30KB = thumbnail/broken (-30 penalty),
 *   > 1.5MB = high-res lookbook (likely model shot, -10 penalty).
 *
 * Pass --apply to write the reorder/drops back to the data file.
 */

import fs from "node:fs";

const FILE = "data/sporthub-products.json";
const REPORT = "docs/IMAGE_QUALITY_AUDIT.md";
const APPLY = process.argv.includes("--apply");
const ONLY_TEAM = process.argv.find((a) => a.startsWith("--team="))?.slice(7);

const CONCURRENCY = 6;
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 1;

const products = JSON.parse(fs.readFileSync(FILE, "utf8"));

// ---------------------------------------------------------------------------
// JPEG / WebP dimension parser — reads the first ~64KB of the image bytes
// ---------------------------------------------------------------------------

/** Parse JPEG dimensions from the SOFn marker. Returns { w, h } or null. */
function parseJpeg(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null; // not a JPEG
  let i = 2;
  while (i < buf.length - 4) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    // Skip standalone markers
    if (marker === 0x00 || marker === 0xff || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    const segLen = (buf[i + 2] << 8) | buf[i + 3];
    // SOFn (0xC0..0xCF except 0xC4/0xC8/0xCC which are non-frame)
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      const h = (buf[i + 5] << 8) | buf[i + 6];
      const w = (buf[i + 7] << 8) | buf[i + 8];
      return { w, h };
    }
    i += 2 + segLen;
  }
  return null;
}

/** Parse WebP (VP8/VP8L/VP8X) dimensions. Returns { w, h } or null. */
function parseWebp(buf) {
  if (
    buf[0] !== 0x52 || // 'R'
    buf[1] !== 0x49 || // 'I'
    buf[2] !== 0x46 || // 'F'
    buf[3] !== 0x46 || // 'F'
    buf[8] !== 0x57 || // 'W'
    buf[9] !== 0x45 || // 'E'
    buf[10] !== 0x42 || // 'B'
    buf[11] !== 0x50 // 'P'
  ) {
    return null;
  }
  // VP8 (lossy)
  if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x20) {
    const w = (buf[26] | (buf[27] << 8)) & 0x3fff;
    const h = (buf[28] | (buf[29] << 8)) & 0x3fff;
    return { w, h };
  }
  // VP8L (lossless)
  if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x4c) {
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    const w = 1 + (((b1 & 0x3f) << 8) | b0);
    const h = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { w, h };
  }
  // VP8X (extended)
  if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x58) {
    const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { w, h };
  }
  return null;
}

/** Parse PNG dimensions. */
function parsePng(buf) {
  if (
    buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47
  ) return null;
  const w = (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19];
  const h = (buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23];
  return { w, h };
}

function parseDims(buf) {
  return parseJpeg(buf) || parseWebp(buf) || parsePng(buf);
}

// ---------------------------------------------------------------------------
// HTTP probe (re-uses yupoo Referer trick)
// ---------------------------------------------------------------------------

function unwrap(url) {
  if (!url) return null;
  try {
    if (url.startsWith("/api/yupoo-image")) {
      const u = new URL(url, "https://example.com");
      return u.searchParams.get("url");
    }
    return url;
  } catch {
    return null;
  }
}

function refererFor(url) {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("yupoo.com")) {
      const username = u.pathname.split("/").filter(Boolean)[0] || "";
      return username ? `https://${username}.x.yupoo.com/` : "https://yupoo.com/";
    }
    return null;
  } catch {
    return null;
  }
}

async function probeOnce(url) {
  const real = unwrap(url);
  if (!real) return { ok: false, error: "unwrap-failed" };
  const referer = refererFor(real);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(real, {
      headers: {
        Range: "bytes=0-65535",
        ...(referer ? { Referer: referer } : {}),
        "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/124.0.0.0",
        Accept: "image/*",
      },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok && res.status !== 206) {
      return { ok: false, status: res.status, error: `http-${res.status}` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const totalSize = Number(
      res.headers.get("content-range")?.split("/")[1] ??
        res.headers.get("content-length") ??
        buf.length,
    );
    const dims = parseDims(buf);
    return { ok: true, status: res.status, bytes: totalSize, dims };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, error: e?.name || "fetch-error" };
  }
}

async function probe(url) {
  let last = null;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    const r = await probeOnce(url);
    if (r.ok) return r;
    last = r;
    if (r.status > 0) return r;
    if (i < MAX_RETRIES) await new Promise((res) => setTimeout(res, 1500));
  }
  return last;
}

async function pool(items, n, task) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await task(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: n }, worker));
  return results;
}

// ---------------------------------------------------------------------------
// SCORING
// ---------------------------------------------------------------------------

function scoreImage(dims, bytes, isShopify) {
  if (!dims || dims.w <= 0 || dims.h <= 0) return 0;
  const aspect = dims.h / dims.w; // h>w means PORTRAIT
  const area = dims.w * dims.h;
  let score = 0;

  // Aspect ratio. Empirical findings:
  //   - shopify+square (1:1) is almost always a catalog hanger shot (good)
  //   - yupoo+square is often a macro detail (bad)
  //   - Portrait is universally good
  //   - Landscape is universally bad (fabric / collar close-up)
  if (aspect >= 1.20 && aspect <= 1.45) score += 100;
  else if (aspect >= 1.10 && aspect < 1.20) score += 85;
  else if (aspect > 1.45 && aspect <= 1.80) score += 55;
  else if (aspect > 1.80) score += 25;
  else if (aspect >= 0.95 && aspect < 1.10) score += isShopify ? 90 : 25;
  else if (aspect >= 0.80 && aspect < 0.95) score += isShopify ? 35 : 10;
  else score += 5;

  // Resolution
  if (area >= 800 * 1000) score += 20;
  else if (area >= 500 * 600) score += 15;
  else if (area >= 400 * 500) score += 10;
  else if (area >= 250 * 300) score += 5;
  else score -= 10;

  // File size
  if (bytes < 25_000) score -= 30;
  else if (bytes < 50_000) score -= 10;
  else if (bytes >= 150_000 && bytes <= 1_500_000) score += 10;
  else if (bytes > 2_500_000) score -= 15;

  return score;
}

// ---------------------------------------------------------------------------
// SCAN
// ---------------------------------------------------------------------------

const todo = [];
for (const p of products) {
  if (ONLY_TEAM && p.teamSlug !== ONLY_TEAM) continue;
  for (let i = 0; i < (p.images || []).length; i++) {
    todo.push({ pid: p.id, idx: i, url: p.images[i] });
  }
}

console.log(`Probing ${todo.length} images (concurrency=${CONCURRENCY})...`);
const start = Date.now();
let done = 0;
const probes = await pool(todo, CONCURRENCY, async (item) => {
  const r = await probe(item.url);
  done++;
  if (done % 100 === 0 || done === todo.length) {
    const pct = ((done / todo.length) * 100).toFixed(1);
    const sec = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ${done}/${todo.length} (${pct}%) — ${sec}s`);
  }
  return { ...item, ...r };
});

const byProduct = new Map();
for (const r of probes) {
  if (!byProduct.has(r.pid)) byProduct.set(r.pid, []);
  byProduct.get(r.pid).push(r);
}

let reordered = 0;
let dropped = 0;
let droppedProducts = 0;
const samples = [];

const VERBOSE = process.argv.includes("--verbose");
for (const p of products) {
  if (ONLY_TEAM && p.teamSlug !== ONLY_TEAM) continue;
  const probes = (byProduct.get(p.id) || []).sort((a, b) => a.idx - b.idx);
  if (!probes.length) continue;
  if (VERBOSE) {
    console.log(`\n${p.id} | ${p.nameHe}`);
    probes.forEach((pr, i) => {
      const sc = pr.ok ? scoreImage(pr.dims, pr.bytes) : -100;
      console.log(`  [${i}] score=${sc} dims=${pr.dims?.w}×${pr.dims?.h} bytes=${pr.bytes}`);
    });
  }

  // Score each image (shopify CDN images get a square-shape boost)
  const scored = probes.map((pr, i) => {
    const isShopify =
      typeof p.images[i] === "string" && p.images[i].includes("cdn.shopify.com");
    return {
      idx: i,
      url: p.images[i],
      ok: pr.ok,
      score: pr.ok ? scoreImage(pr.dims, pr.bytes, isShopify) : -100,
      dims: pr.dims,
      bytes: pr.bytes,
    };
  });

  // Sort by score desc; ties broken by original order
  const sorted = [...scored].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.idx - b.idx;
  });

  // Drop images with score < 50 (landscape close-ups score 35, model
  // body shots score 25-55). Threshold tuned so genuine portrait jersey
  // shots (score 75+) pass and close-ups don't.
  const kept = sorted.filter((s) => s.score >= 50);

  if (kept.length === 0) {
    // All images poor — keep one (best of the worst) so we don't show a
    // 404 placeholder, but FLAG the product so the merch team can
    // source a better photo.
    droppedProducts++;
    p._needsNewImage = true;
    continue;
  }
  // If we'd drop the product down to no images, keep best-of-the-worst
  if (kept.length === 0 && sorted.length > 0) {
    kept.push(sorted[0]);
  }

  const newImages = kept.map((s) => s.url);
  const orderChanged =
    newImages.length !== p.images.length ||
    newImages.some((u, i) => u !== p.images[i]);

  if (orderChanged) {
    if (newImages.length < p.images.length) dropped += p.images.length - newImages.length;
    if (newImages[0] !== p.images[0]) reordered++;
    if (samples.length < 30) {
      samples.push({
        id: p.id,
        nameHe: p.nameHe,
        before: scored.map((s) => `${s.score}@${s.dims?.w}×${s.dims?.h}`),
        after: kept.map((s) => `${s.score}@${s.dims?.w}×${s.dims?.h}`),
      });
    }
    if (APPLY) p.images = newImages;
  }
}

// Build "needs new images" report grouped by team
const needNew = products.filter((p) => p._needsNewImage);
const byTeam = new Map();
for (const p of needNew) {
  const k = `${p.teamSlug || "unknown"} (${p.team || ""})`;
  if (!byTeam.has(k)) byTeam.set(k, []);
  byTeam.get(k).push(p);
}

if (APPLY) {
  // Strip the temporary _needsNewImage flag before writing
  for (const p of products) {
    if (p._needsNewImage) {
      // Mark it persistently so future audits know
      p.imageQuality = "low";
      delete p._needsNewImage;
    }
  }
  fs.writeFileSync(FILE, JSON.stringify(products, null, 2));
}

fs.mkdirSync("docs", { recursive: true });
const lines = [];
lines.push("# Image Quality Audit");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("## Summary");
lines.push("");
lines.push(`- Probed: ${todo.length} images`);
lines.push(`- Products with image[0] reordered to a better one: ${reordered}`);
lines.push(`- Total images dropped (score < 50): ${dropped}`);
lines.push(`- Products with ALL images poor (need new photos): ${droppedProducts}`);
lines.push("");
lines.push("## Products needing new photos (by team)");
lines.push("");
const sortedTeams = [...byTeam.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [team, list] of sortedTeams) {
  lines.push(`### ${team} — ${list.length} products`);
  for (const p of list) {
    lines.push(`- ${p.id} · ${p.nameHe}`);
  }
  lines.push("");
}
lines.push("## Sample image-reorder changes");
lines.push("");
for (const s of samples.slice(0, 15)) {
  lines.push(`### ${s.id} — ${s.nameHe}`);
  lines.push(`Before: ${s.before.join(", ")}`);
  lines.push(`After:  ${s.after.join(", ")}`);
  lines.push("");
}
fs.writeFileSync(REPORT, lines.join("\n"));

console.log("");
console.log(`Reordered: ${reordered} products (image[0] swapped to a better shot)`);
console.log(`Dropped:   ${dropped} bad images`);
console.log(`Couldn't fix: ${droppedProducts} products (all images poor — need new sources)`);
console.log(`Report: ${REPORT}`);
console.log(APPLY ? "" : "DRY RUN — pass --apply to write changes");
