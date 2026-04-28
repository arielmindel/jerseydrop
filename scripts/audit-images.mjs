#!/usr/bin/env node
/**
 * V5 feedback #5 — image audit.
 *
 * The user reported: "תמונה ראשית רעה" (image[0] is sometimes a close-up of
 * a badge / Adidas tag / Climacool label rather than a front-of-jersey shot).
 * Without computer vision we can't tell what's IN the image, but we can:
 *   1. Verify image[0] returns 200 OK with a non-trivial body (≥ 25KB)
 *   2. Verify image[1] does the same; if it doesn't, drop image[1]
 *   3. If image[1] is dramatically smaller than image[0] (< 35% bytes),
 *      it's almost always a detail shot — drop it.
 *   4. If image[0] itself is broken (404/567/empty), log to a report file
 *      so the merch team can review (don't auto-remove products — too risky).
 *
 * Yupoo hot-link blocking: we replicate the Referer trick from
 * /api/yupoo-image so this script works against the underlying photo.yupoo.com
 * URLs without needing `next dev` running.
 */

import fs from "node:fs";

const FILE = "data/sporthub-products.json";
const REPORT_PATH = "docs/IMAGE_AUDIT_V5.md";
const CONCURRENCY = 8; // lowered after observing network throttling at 16
const TIMEOUT_MS = 25_000; // raised — yupoo can be slow during burst
const MAX_RETRIES = 2; // retry on transient TypeError/AbortError
const RETRY_DELAY_MS = 1500;
const MIN_SIZE_BYTES = 25_000; // below this = thumbnail / broken
const RATIO_DROP_THRESHOLD = 0.35; // image[1] < 35% of image[0] bytes → drop

const products = JSON.parse(fs.readFileSync(FILE, "utf8"));

/**
 * Recover the underlying URL from a /api/yupoo-image?url=... reference.
 * For non-yupoo URLs, returns the original.
 */
function unwrap(url) {
  if (!url) return null;
  try {
    if (url.startsWith("/api/yupoo-image")) {
      // Resolve against a dummy base so URL parses
      const u = new URL(url, "https://example.com");
      return u.searchParams.get("url");
    }
    return url;
  } catch {
    return null;
  }
}

/** Synthesize the Referer the proxy uses. */
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
  if (!real) return { ok: false, bytes: 0, status: 0, error: "unwrap-failed" };

  const referer = refererFor(real);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(real, {
      method: "GET",
      headers: {
        Range: "bytes=0-262143",
        ...(referer ? { Referer: referer } : {}),
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/*,*/*;q=0.8",
      },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok && res.status !== 206) {
      return { ok: false, bytes: 0, status: res.status, error: `http-${res.status}` };
    }
    const cl = Number(res.headers.get("content-range")?.split("/")[1] ?? res.headers.get("content-length") ?? 0);
    if (cl) return { ok: true, bytes: cl, status: res.status };
    const buf = await res.arrayBuffer();
    return { ok: true, bytes: buf.byteLength, status: res.status };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, bytes: 0, status: 0, error: e?.name || "fetch-error" };
  }
}

/** Probe with auto-retry on transient TypeError/AbortError. HTTP 4xx/5xx are
 *  trusted (no retry — those are real failures). */
async function probe(url) {
  let last = null;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    const r = await probeOnce(url);
    if (r.ok) return r;
    last = r;
    // Real HTTP error → don't retry; transient (status=0) → retry
    if (r.status > 0) return r;
    if (i < MAX_RETRIES) {
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS * (i + 1)));
    }
  }
  return last;
}

/** Pool that runs `task` over `items` with bounded parallelism. */
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

const todo = [];
for (const p of products) {
  const imgs = p.images || [];
  imgs.forEach((u, idx) => todo.push({ pid: p.id, slug: p.slug, idx, url: u }));
}

console.log(`Probing ${todo.length} images (concurrency=${CONCURRENCY})...`);
const start = Date.now();
let done = 0;
const probes = await pool(todo, CONCURRENCY, async (item) => {
  const r = await probe(item.url);
  done++;
  if (done % 100 === 0) {
    const pct = ((done / todo.length) * 100).toFixed(1);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ${done}/${todo.length} (${pct}%) — ${elapsed}s`);
  }
  return { ...item, ...r };
});
const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`Done in ${elapsed}s.`);

// Group by product
const byProduct = new Map();
for (const r of probes) {
  if (!byProduct.has(r.pid)) byProduct.set(r.pid, []);
  byProduct.get(r.pid).push(r);
}

let droppedSecondary = 0;
let droppedSecondarySize = 0;
let brokenPrimary = 0;
const brokenPrimaryReport = [];

for (const p of products) {
  const probesForProduct = (byProduct.get(p.id) || []).sort((a, b) => a.idx - b.idx);
  const primary = probesForProduct[0];
  const secondary = probesForProduct[1];

  // Broken primary — log it (don't auto-remove product yet)
  if (primary && (!primary.ok || primary.bytes < MIN_SIZE_BYTES)) {
    brokenPrimary++;
    brokenPrimaryReport.push({
      id: p.id,
      slug: p.slug,
      nameHe: p.nameHe,
      url: primary.url,
      bytes: primary.bytes,
      status: primary.status,
      error: primary.error,
    });
  }

  // Drop secondary if missing/tiny/much smaller than primary
  if (secondary) {
    const dropForBrokenness = !secondary.ok || secondary.bytes < MIN_SIZE_BYTES;
    const dropForRatio =
      primary && primary.ok && primary.bytes > 0 && secondary.ok &&
      secondary.bytes / primary.bytes < RATIO_DROP_THRESHOLD;

    if (dropForBrokenness) {
      p.images = [p.images[0]];
      droppedSecondary++;
    } else if (dropForRatio) {
      p.images = [p.images[0]];
      droppedSecondarySize++;
    }
  }
}

fs.writeFileSync(FILE, JSON.stringify(products, null, 2));

// Build markdown report for review
const lines = [];
lines.push("# Image Audit V5");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("## Summary");
lines.push("");
lines.push(`- Probed ${todo.length} images across ${products.length} products`);
lines.push(`- Dropped secondary image (broken/tiny): ${droppedSecondary}`);
lines.push(`- Dropped secondary image (size ratio < ${RATIO_DROP_THRESHOLD}): ${droppedSecondarySize}`);
lines.push(`- Total secondary drops: ${droppedSecondary + droppedSecondarySize}`);
lines.push(`- Products with broken/tiny PRIMARY image (need review): ${brokenPrimary}`);
lines.push("");

if (brokenPrimaryReport.length) {
  lines.push("## Broken / suspicious primary images (review manually)");
  lines.push("");
  lines.push("| ID | Slug | nameHe | bytes | status | url |");
  lines.push("|---|---|---|---|---|---|");
  for (const r of brokenPrimaryReport.slice(0, 80)) {
    const url = (r.url || "").replace(/\|/g, "%7C").slice(0, 90);
    lines.push(`| ${r.id} | ${r.slug} | ${r.nameHe} | ${r.bytes} | ${r.status} ${r.error || ""} | \`${url}...\` |`);
  }
  if (brokenPrimaryReport.length > 80) {
    lines.push(`| ... | ... | (${brokenPrimaryReport.length - 80} more) | | | |`);
  }
  lines.push("");
}

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(REPORT_PATH, lines.join("\n"));

console.log("");
console.log(`Dropped secondary (broken/tiny): ${droppedSecondary}`);
console.log(`Dropped secondary (size ratio):  ${droppedSecondarySize}`);
console.log(`Products with broken primary:    ${brokenPrimary}`);
console.log(`Report: ${REPORT_PATH}`);
