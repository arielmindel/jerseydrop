#!/usr/bin/env node
// Migrate product images from local backup + remote sources → Cloudflare R2.
//
// Strategy per image:
//   1. If product.imagesLocal[i] exists → read from
//      /Users/arielmindel/supplier-images/sporthub-product-images/<file>.
//   2. Else → fetch product.images[i]. URLs may be:
//      - /api/yupoo-image?url=<encoded> → decode `url` param, treat as yupoo direct
//      - https://photo(s).yupoo.com/<user>/<hash>/... → fetch w/ Referer https://<user>.x.yupoo.com/
//      - https://cdn.shopify.com/... → fetch directly, no Referer
//      - other → fetch directly
//   3. Upload to R2: products/<slug>/<index>.<ext> with proper Content-Type.
//
// State (data/migration-state.json) is updated atomically every batch; script
// is fully resumable — already-uploaded indices are skipped on re-run.
//
// Errors are appended to data/migration-errors.json. Individual failures do not
// abort the run.

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import pLimit from "p-limit";
import * as dotenv from "dotenv";
import mime from "mime-types";
import fs from "node:fs/promises";
import { existsSync, createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET,
  R2_PUBLIC_URL,
} = process.env;

for (const [k, v] of Object.entries({
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET,
  R2_PUBLIC_URL,
})) {
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
}

const LOCAL_IMAGES_DIR =
  "/Users/arielmindel/supplier-images/sporthub-product-images";
const PUBLIC_DIR = path.join(ROOT, "public");
const CATALOG_PATH = path.join(ROOT, "data", "sporthub-products.json");
const STATE_PATH = path.join(ROOT, "data", "migration-state.json");
const ERRORS_PATH = path.join(ROOT, "data", "migration-errors.json");

const CONCURRENCY = 8;
const MAX_RETRIES = 3;
const PROGRESS_EVERY = 50;
const STATE_FLUSH_EVERY = 25;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ---- helpers ----
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const allowedExts = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

function extFromContentType(ct) {
  if (!ct) return "jpg";
  const e = mime.extension(ct.split(";")[0].trim());
  if (!e) return "jpg";
  if (e === "jpeg") return "jpg";
  return allowedExts.has(e) ? e : "jpg";
}

function extFromUrl(url) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\.([a-zA-Z0-9]+)$/);
    if (!m) return null;
    const e = m[1].toLowerCase();
    if (e === "jpeg") return "jpg";
    return allowedExts.has(e) ? e : null;
  } catch {
    return null;
  }
}

function extFromFilename(name) {
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  if (!m) return "jpg";
  const e = m[1].toLowerCase();
  if (e === "jpeg") return "jpg";
  return allowedExts.has(e) ? e : "jpg";
}

function refererForYupoo(yupooUrl) {
  try {
    const u = new URL(yupooUrl);
    const username = u.pathname.split("/").filter(Boolean)[0] || "";
    return username
      ? `https://${username}.x.yupoo.com/`
      : "https://yupoo.com/";
  } catch {
    return "https://yupoo.com/";
  }
}

function resolveSource(product, i) {
  // Returns { kind: 'local', path } OR { kind: 'remote', url, referer? }
  const localName = product.imagesLocal?.[i];
  if (localName) {
    const p = path.join(LOCAL_IMAGES_DIR, localName);
    if (existsSync(p)) return { kind: "local", path: p, name: localName };
  }
  const remote = product.images?.[i];
  if (!remote) return null;

  // Relative public-folder path (e.g. "/images/products-clean/foo.webp")
  // — served from /public at runtime; on disk it's <ROOT>/public/<path>.
  if (remote.startsWith("/") && !remote.startsWith("/api/")) {
    const p = path.join(PUBLIC_DIR, remote);
    if (existsSync(p)) {
      return { kind: "local", path: p, name: path.basename(remote) };
    }
  }

  if (remote.startsWith("/api/yupoo-image")) {
    try {
      const qs = remote.slice(remote.indexOf("?") + 1);
      const params = new URLSearchParams(qs);
      const decoded = params.get("url");
      if (decoded) {
        return {
          kind: "remote",
          url: decoded,
          referer: refererForYupoo(decoded),
        };
      }
    } catch {}
  }

  // Direct URL
  try {
    const u = new URL(remote);
    if (u.hostname.endsWith("yupoo.com")) {
      return { kind: "remote", url: remote, referer: refererForYupoo(remote) };
    }
    return { kind: "remote", url: remote };
  } catch {
    return null;
  }
}

async function fetchWithRetry(url, referer) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const headers = {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      };
      if (referer) headers.Referer = referer;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        // 403/404 are not retryable (different problem each time)
        if (res.status === 403 || res.status === 404) {
          throw new Error(`HTTP ${res.status}`);
        }
        throw new Error(`HTTP ${res.status} (retry)`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get("content-type") || "image/jpeg";
      return { buf, contentType: ct };
    } catch (e) {
      lastErr = e;
      if (
        attempt < MAX_RETRIES &&
        !String(e.message).includes("403") &&
        !String(e.message).includes("404")
      ) {
        await sleep(1000 * 2 ** (attempt - 1));
        continue;
      }
      break;
    }
  }
  throw lastErr;
}

async function loadJson(p, fallback) {
  try {
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function saveJsonAtomic(p, data) {
  // Unique tmp suffix so concurrent flushes don't clobber each other's .tmp
  // before rename.
  const tmp = `${p}.tmp.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, p);
}

async function r2KeyExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch (e) {
    if (e?.$metadata?.httpStatusCode === 404 || e?.name === "NotFound") {
      return false;
    }
    return false;
  }
}

// ---- main ----
async function main() {
  console.log(`R2 bucket: ${R2_BUCKET}`);
  console.log(`Public URL prefix: ${R2_PUBLIC_URL}`);
  console.log(`Local backup dir: ${LOCAL_IMAGES_DIR}`);

  const catalog = await loadJson(CATALOG_PATH, []);
  console.log(`Catalog: ${catalog.length} products`);

  const state = await loadJson(STATE_PATH, {});
  const errors = await loadJson(ERRORS_PATH, []);

  // Build flat job list of unique (productIdx, imgIdx)
  const jobs = [];
  let totalImages = 0;
  for (let pi = 0; pi < catalog.length; pi++) {
    const product = catalog[pi];
    const imgs = product.images || [];
    totalImages += imgs.length;
    if (!state[product.slug]) {
      state[product.slug] = { ext: new Array(imgs.length).fill(null), uploaded: new Array(imgs.length).fill(false), skipped: new Array(imgs.length).fill(false) };
    } else {
      // Ensure length matches in case catalog grew
      const s = state[product.slug];
      while (s.ext.length < imgs.length) s.ext.push(null);
      while (s.uploaded.length < imgs.length) s.uploaded.push(false);
      while (!s.skipped) s.skipped = new Array(imgs.length).fill(false);
      while (s.skipped.length < imgs.length) s.skipped.push(false);
    }
    for (let ii = 0; ii < imgs.length; ii++) {
      if (state[product.slug].uploaded[ii]) continue;
      if (state[product.slug].skipped[ii]) continue;
      jobs.push({ pi, ii });
    }
  }

  console.log(
    `Total images in catalog: ${totalImages}. Pending uploads: ${jobs.length}`,
  );

  if (jobs.length === 0) {
    console.log("Nothing to do — all images already migrated.");
    return;
  }

  const startedAt = Date.now();
  let done = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  let pendingFlushes = 0;

  async function flushState() {
    await saveJsonAtomic(STATE_PATH, state);
    if (errors.length) await saveJsonAtomic(ERRORS_PATH, errors);
    pendingFlushes = 0;
  }

  const limit = pLimit(CONCURRENCY);

  await Promise.all(
    jobs.map(({ pi, ii }) =>
      limit(async () => {
        const product = catalog[pi];
        const slug = product.slug;
        const src = resolveSource(product, ii);
        try {
          if (!src) {
            throw new Error("no source resolvable");
          }

          let buf;
          let contentType;
          let ext;

          if (src.kind === "local") {
            buf = await fs.readFile(src.path);
            ext = extFromFilename(src.name);
            contentType = mime.lookup(src.name) || "image/jpeg";
            if (contentType === "image/jpg") contentType = "image/jpeg";
          } else {
            const fetched = await fetchWithRetry(src.url, src.referer);
            buf = fetched.buf;
            contentType = fetched.contentType;
            ext =
              extFromContentType(contentType) ||
              extFromUrl(src.url) ||
              "jpg";
          }

          const key = `products/${slug}/${ii}.${ext}`;
          await s3.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: key,
              Body: buf,
              ContentType: contentType,
              CacheControl: "public, max-age=31536000, immutable",
            }),
          );

          state[slug].uploaded[ii] = true;
          state[slug].ext[ii] = ext;
          succeeded++;
        } catch (e) {
          failed++;
          errors.push({
            slug,
            index: ii,
            sourceKind: src?.kind,
            sourceUrl: src?.url,
            sourcePath: src?.path,
            error: e?.message || String(e),
            at: new Date().toISOString(),
          });
        } finally {
          done++;
          pendingFlushes++;

          if (pendingFlushes >= STATE_FLUSH_EVERY) {
            await flushState();
          }

          if (done % PROGRESS_EVERY === 0 || done === jobs.length) {
            const elapsedSec = (Date.now() - startedAt) / 1000;
            const rate = done / elapsedSec;
            const remaining = jobs.length - done;
            const etaMin = rate > 0 ? remaining / rate / 60 : Infinity;
            console.log(
              `${done}/${jobs.length} done (ok=${succeeded} fail=${failed}) — ${rate.toFixed(1)}/s — ETA ${etaMin.toFixed(1)} min`,
            );
          }
        }
      }),
    ),
  );

  await flushState();
  const elapsedMin = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);
  console.log(
    `\nDone. ${succeeded} uploaded, ${failed} failed, ${elapsedMin} min total.`,
  );
  console.log(`State: ${STATE_PATH}`);
  console.log(`Errors: ${ERRORS_PATH}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
