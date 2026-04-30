#!/usr/bin/env node
/**
 * Batch-clean every visible product image:
 *   1. Download original image (with yupoo Referer trick where needed)
 *   2. Pipe through rembg → PNG with white background
 *   3. Compress to WebP @ q82
 *   4. Save to public/images/products-clean/<productId>-<idx>.webp
 *   5. Update data/sporthub-products.json so each product.images[] entry
 *      points at /images/products-clean/<file>.webp
 *
 * Originals are not modified or deleted on the source server — we just stop
 * referencing them. The original URL is preserved as `imagesOriginal[]`
 * so we can roll back if anything looks off.
 *
 * Idempotent: products already pointing at /images/products-clean/ are
 * skipped. Re-running the script after a partial failure resumes from
 * where it stopped.
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const FILE = "data/sporthub-products.json";
const OUT_DIR = "public/images/products-clean";
const REMBG_BIN = "/Users/arielmindel/Library/Python/3.9/bin/rembg";
const CWEBP = "/opt/homebrew/bin/cwebp";
const CONCURRENCY = 4;
const TIMEOUT_MS = 60_000;
const SAVE_EVERY = 50;

const products = JSON.parse(fs.readFileSync(FILE, "utf8"));
fs.mkdirSync(OUT_DIR, { recursive: true });

function unwrap(url) {
  if (!url) return null;
  if (url.startsWith("/api/yupoo-image")) {
    try {
      return new URL(url, "https://example.com").searchParams.get("url");
    } catch {
      return null;
    }
  }
  if (url.startsWith("/")) return null; // already cleaned local path
  return url;
}

function refererFor(url) {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("yupoo.com")) {
      const username = u.pathname.split("/").filter(Boolean)[0] || "";
      return username
        ? `https://${username}.x.yupoo.com/`
        : "https://yupoo.com/";
    }
  } catch {}
  return null;
}

async function downloadOriginal(url) {
  const real = unwrap(url);
  if (!real) return null;
  const referer = refererFor(real);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(real, {
      headers: {
        ...(referer ? { Referer: referer } : {}),
        "User-Agent":
          "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/124.0.0.0",
        Accept: "image/*",
      },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    clearTimeout(t);
    return null;
  }
}

function runProcess(cmd, args, input) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    const out = [];
    const err = [];
    proc.stdout.on("data", (c) => out.push(c));
    proc.stderr.on("data", (c) => err.push(c));
    proc.on("close", (code) =>
      resolve({ code, stdout: Buffer.concat(out), stderr: Buffer.concat(err).toString() }),
    );
    proc.on("error", () => resolve({ code: -1, stdout: Buffer.alloc(0), stderr: "spawn failed" }));
    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }
  });
}

async function rembgClean(buffer) {
  // rembg reads stdin and writes stdout — perfect for piping
  const r = await runProcess(REMBG_BIN, ["i", "-bgc", "255", "255", "255", "255", "-m", "u2net", "-", "-"], buffer);
  if (r.code !== 0) return null;
  return r.stdout;
}

async function pngToWebp(pngBuffer, outPath) {
  // cwebp doesn't read stdin reliably; use a tmp file
  const tmp = path.join("/tmp", `clean-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`);
  fs.writeFileSync(tmp, pngBuffer);
  const r = await runProcess(CWEBP, ["-q", "82", "-m", "6", tmp, "-o", outPath]);
  fs.unlinkSync(tmp);
  return r.code === 0;
}

function relPath(absOutFile) {
  // Convert local path to public URL path
  return absOutFile.replace(/^public/, "");
}

async function processOne(p, idx) {
  const orig = p.images?.[idx];
  if (!orig) return { ok: false, reason: "no-image" };
  // Skip if already cleaned
  if (orig.startsWith("/images/products-clean/")) {
    return { ok: true, reason: "already-clean" };
  }
  const outName = `${p.id}-${idx}.webp`.replace(/[^a-zA-Z0-9._-]/g, "_");
  const outPath = path.join(OUT_DIR, outName);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
    // Already produced; just update the URL in the JSON
    p.images[idx] = `/${outPath.replace(/^public\//, "")}`;
    return { ok: true, reason: "existed" };
  }
  const buf = await downloadOriginal(orig);
  if (!buf || buf.length < 5_000) return { ok: false, reason: "download-failed" };
  const cleaned = await rembgClean(buf);
  if (!cleaned || cleaned.length < 1_000) return { ok: false, reason: "rembg-failed" };
  const ok = await pngToWebp(cleaned, outPath);
  if (!ok) return { ok: false, reason: "webp-failed" };
  // Stash the original URL on the product (first time only)
  if (!Array.isArray(p.imagesOriginal)) p.imagesOriginal = [];
  if (!p.imagesOriginal[idx]) p.imagesOriginal[idx] = orig;
  p.images[idx] = `/${outPath.replace(/^public\//, "")}`;
  return { ok: true, reason: "cleaned" };
}

// ---------------------------------------------------------------------------

const todo = [];
for (const p of products) {
  if (p.imageQuality === "low") continue; // skip already-hidden
  for (let i = 0; i < (p.images || []).length; i++) {
    const url = p.images[i];
    if (!url || url.startsWith("/images/products-clean/")) continue;
    todo.push({ p, idx: i });
  }
}

console.log(`Cleaning ${todo.length} images across ${new Set(todo.map((t) => t.p.id)).size} products...`);
console.log(`Output: ${OUT_DIR}/`);

let done = 0;
let cleaned = 0;
let failed = 0;
let already = 0;
const start = Date.now();
const failures = [];

async function worker() {
  while (true) {
    const item = todo[done++];
    if (!item) return;
    const r = await processOne(item.p, item.idx);
    if (r.ok) {
      if (r.reason === "cleaned" || r.reason === "existed") cleaned++;
      else already++;
    } else {
      failed++;
      if (failures.length < 30)
        failures.push({ id: item.p.id, idx: item.idx, reason: r.reason });
    }
    if (done % 25 === 0 || done === todo.length) {
      const sec = ((Date.now() - start) / 1000).toFixed(0);
      const rate = done / Math.max(1, sec);
      const remaining = ((todo.length - done) / Math.max(0.001, rate)).toFixed(0);
      console.log(
        `  ${done}/${todo.length} · cleaned=${cleaned} fail=${failed} skip=${already} · ${sec}s · eta=${remaining}s`,
      );
    }
    if (done % SAVE_EVERY === 0) {
      fs.writeFileSync(FILE, JSON.stringify(products, null, 2));
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

fs.writeFileSync(FILE, JSON.stringify(products, null, 2));

console.log("");
console.log(`Done. cleaned=${cleaned} failed=${failed} already=${already}`);
if (failures.length) {
  console.log(`First failures:`);
  failures.forEach((f) => console.log(`  ${f.id}[${f.idx}] · ${f.reason}`));
}
