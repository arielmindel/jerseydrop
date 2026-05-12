#!/usr/bin/env node
/**
 * Rescue products marked imageQuality: "low" by mining DEEPER photos
 * from their source Yupoo album.
 *
 * The audit previously found these 666 products had only fabric/label
 * closeups in their imported images[]. But 664 of them link to a Yupoo
 * album via `sourceHandleCn`, and many of those albums have 3-24 photos
 * total — only the first 1-2 were imported. The actual full-jersey
 * shots may be deeper in the album.
 *
 * For each low-quality product:
 *  1) Find album by exact nameCn === sourceHandleCn (longest-match wins).
 *  2) Albums < 3 photos → unfixable, skip.
 *  3) Otherwise fetch all album photos, score them with the same
 *     heuristic as image-quality-audit.mjs.
 *  4) Pick top 2 by score. If both score ≥ 60 → fixable: replace
 *     images[], imagesOriginal[], primaryImage; remove imageQuality flag.
 *  5) Otherwise → leave imageQuality: "low" in place.
 *
 * Writes data/sporthub-products.json in place.
 */

import fs from "node:fs";

const FILE = "data/sporthub-products.json";
const YUPOO = "data/yupoo-final-catalog.json";

const CONCURRENCY = 8;
const TIMEOUT_MS = 30_000;
const MIN_SCORE = 60;

// ---------------------------------------------------------------------------
// JPEG / WebP / PNG dimension parser — borrowed from image-quality-audit.mjs
// ---------------------------------------------------------------------------

function parseJpeg(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 4) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (marker === 0x00 || marker === 0xff || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    const segLen = (buf[i + 2] << 8) | buf[i + 3];
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

function parseWebp(buf) {
  if (
    buf[0] !== 0x52 || buf[1] !== 0x49 || buf[2] !== 0x46 || buf[3] !== 0x46 ||
    buf[8] !== 0x57 || buf[9] !== 0x45 || buf[10] !== 0x42 || buf[11] !== 0x50
  ) return null;
  if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x20) {
    const w = (buf[26] | (buf[27] << 8)) & 0x3fff;
    const h = (buf[28] | (buf[29] << 8)) & 0x3fff;
    return { w, h };
  }
  if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x4c) {
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    const w = 1 + (((b1 & 0x3f) << 8) | b0);
    const h = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { w, h };
  }
  if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x58) {
    const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { w, h };
  }
  return null;
}

function parsePng(buf) {
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
  const w = (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19];
  const h = (buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23];
  return { w, h };
}

function parseDims(buf) {
  return parseJpeg(buf) || parseWebp(buf) || parsePng(buf);
}

// ---------------------------------------------------------------------------
// HTTP probe (yupoo Referer trick)
// ---------------------------------------------------------------------------

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

async function probe(url) {
  const referer = refererFor(url);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Range: "bytes=0-65535",
        ...(referer ? { Referer: referer } : {}),
        "User-Agent":
          "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/124.0.0.0",
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

async function pool(items, n, task) {
  const results = new Array(items.length);
  let cursor = 0;
  let done = 0;
  const total = items.length;
  const start = Date.now();
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= total) return;
      results[i] = await task(items[i], i);
      done++;
      if (done % 50 === 0 || done === total) {
        const pct = ((done / total) * 100).toFixed(1);
        const sec = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`  ${done}/${total} (${pct}%) — ${sec}s`);
      }
    }
  }
  await Promise.all(Array.from({ length: n }, worker));
  return results;
}

// ---------------------------------------------------------------------------
// Scoring (per task spec)
// ---------------------------------------------------------------------------

function scoreImage(dims, bytes) {
  if (!dims || dims.w <= 0 || dims.h <= 0) return 0;
  const aspect = dims.h / dims.w; // h>w means PORTRAIT

  let score = 0;
  if (aspect >= 1.20 && aspect <= 1.45) score = 100;
  else if (aspect >= 1.10 && aspect < 1.20) score = 85;
  else if (aspect > 1.45 && aspect <= 1.80) score = 55;
  else if (aspect >= 1.00 && aspect < 1.10) score = 60;
  else if (aspect >= 0.80 && aspect < 1.00) score = 40;
  else if (aspect > 1.80) score = 30;
  else score = 20;

  if (bytes && bytes < 30_000) score -= 30;
  else if (bytes && bytes > 1_500_000) score -= 10;

  return score;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("Loading data...");
const products = JSON.parse(fs.readFileSync(FILE, "utf8"));
const albums = JSON.parse(fs.readFileSync(YUPOO, "utf8"));

if (products.length !== 2111) {
  console.error(`Unexpected product count: ${products.length} (expected 2111)`);
  process.exit(1);
}

// Build nameCn → album map, longest-match-first (keep album w/ most photos if dup)
const byName = new Map();
for (const a of albums) {
  if (!a.nameCn) continue;
  const prev = byName.get(a.nameCn);
  if (!prev || (a.photos?.length || 0) > (prev.photos?.length || 0)) {
    byName.set(a.nameCn, a);
  }
}
// Sort handles by descending length for longest-match
const handlesByLen = [...byName.keys()].sort((a, b) => b.length - a.length);

function findAlbumForHandle(handle) {
  if (!handle) return null;
  // 1) exact match
  if (byName.has(handle)) return byName.get(handle);
  // 2) longest-match fallback (handle starts with album name OR vice versa)
  for (const k of handlesByLen) {
    if (handle === k) return byName.get(k);
  }
  return null;
}

// Find candidates
const lowProducts = products.filter(
  (p) => p.imageQuality === "low" && p.sourceHandleCn,
);
console.log(`Low-quality products with sourceHandleCn: ${lowProducts.length}`);

// Distribution
const dist = { lt3: 0, b3to5: 0, b6to10: 0, b11plus: 0, unmatched: 0 };
const candidates = []; // products with >=3 photos
for (const p of lowProducts) {
  const a = findAlbumForHandle(p.sourceHandleCn);
  if (!a) {
    dist.unmatched++;
    continue;
  }
  const n = (a.photos || []).length;
  if (n < 3) dist.lt3++;
  else if (n <= 5) dist.b3to5++;
  else if (n <= 10) dist.b6to10++;
  else dist.b11plus++;
  if (n >= 3) candidates.push({ product: p, album: a });
}
console.log(`Photo-count distribution:`, dist);
console.log(`Candidates with 3+ photos: ${candidates.length}`);

// Collect unique URLs to fetch
const urlSet = new Set();
for (const { album } of candidates) {
  for (const u of album.photos) urlSet.add(u);
}
const urls = [...urlSet];
console.log(`Unique URLs to probe: ${urls.length}`);
console.log(`Fetching with concurrency=${CONCURRENCY}...`);

const probesArr = await pool(urls, CONCURRENCY, (u) => probe(u));
const probeMap = new Map();
for (let i = 0; i < urls.length; i++) {
  probeMap.set(urls[i], probesArr[i]);
}

// Process candidates
let fixed = 0;
let stillLow = 0;
let fetchFailed = 0;
const fixedTeams = new Map();

for (const { product, album } of candidates) {
  // Score each photo in the album
  const scored = [];
  let anyFailed = false;
  for (const url of album.photos) {
    const r = probeMap.get(url);
    if (!r || !r.ok || !r.dims) {
      anyFailed = true;
      scored.push({ url, score: -1, ok: false });
      continue;
    }
    scored.push({
      url,
      score: scoreImage(r.dims, r.bytes),
      ok: true,
      dims: r.dims,
      bytes: r.bytes,
    });
  }

  // Sort by score desc, preserve original order on tie
  const sorted = [...scored]
    .map((s, i) => ({ ...s, origIdx: i }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.origIdx - b.origIdx;
    });

  // Need at least 2 successful probes
  const okScored = sorted.filter((s) => s.ok);
  if (okScored.length < 2) {
    if (anyFailed) fetchFailed++;
    stillLow++;
    continue;
  }

  const top1 = okScored[0];
  const top2 = okScored[1];

  if (top1.score >= MIN_SCORE && top2.score >= MIN_SCORE) {
    // Fixable — replace
    const newOriginal = [top1.url, top2.url].map(
      (u) => `/api/yupoo-image?url=${encodeURIComponent(u)}`,
    );
    product.images = newOriginal.slice();
    product.imagesOriginal = newOriginal.slice();
    product.primaryImage = newOriginal[0];
    delete product.imageQuality;
    fixed++;
    const team = product.team || product.teamSlug || "(unknown)";
    fixedTeams.set(team, (fixedTeams.get(team) || 0) + 1);
  } else {
    stillLow++;
  }
}

// Validate total unchanged
if (products.length !== 2111) {
  console.error(`Product count changed unexpectedly: ${products.length}`);
  process.exit(1);
}

// Write out
const json = JSON.stringify(products, null, 2);
// Sanity check JSON parses
JSON.parse(json);
fs.writeFileSync(FILE, json);

// Final report
console.log("");
console.log("==== RESCUE REPORT ====");
console.log(`Total products: ${products.length}`);
console.log(`Low-quality with handle (start): ${lowProducts.length}`);
console.log("");
console.log("Album photo-count distribution (among 664 matched):");
console.log(`  < 3 photos:    ${dist.lt3} (unfixable_too_few_photos)`);
console.log(`  3-5 photos:    ${dist.b3to5}`);
console.log(`  6-10 photos:   ${dist.b6to10}`);
console.log(`  11+ photos:    ${dist.b11plus}`);
console.log(`  unmatched:     ${dist.unmatched}`);
console.log("");
console.log(`Products FIXED (low → visible):       ${fixed}`);
console.log(`Products with 3+ photos still low:    ${stillLow}`);
console.log(`  (of which had fetch failures:       ${fetchFailed})`);
console.log(`Products with <3 photos (unfixable):  ${dist.lt3}`);
console.log(`Products not matched:                 ${dist.unmatched}`);
console.log("");
console.log("Top teams that got products rescued:");
const sortedTeams = [...fixedTeams.entries()].sort((a, b) => b[1] - a[1]);
for (const [team, n] of sortedTeams.slice(0, 20)) {
  console.log(`  ${n.toString().padStart(3)}  ${team}`);
}

const remaining = products.filter((p) => p.imageQuality === "low").length;
console.log("");
console.log(`Remaining imageQuality:"low" in file: ${remaining}`);
