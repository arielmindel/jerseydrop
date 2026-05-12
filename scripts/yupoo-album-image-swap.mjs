#!/usr/bin/env node
/**
 * yupoo-album-image-swap.mjs
 *
 * Catalog-based image-quality fix.
 *
 * Some products end up showing close-up "detail" photos (a fabric crop,
 * a collar tag, a climacool label) because their `images[]` array points
 * at deep positions in the Yupoo album rather than the cover/back pair.
 *
 * For every product whose `primaryImage` or `images[0]` is a Yupoo URL,
 * we try to:
 *   1. Identify the source album in data/yupoo-final-catalog.json by
 *      hash-matching OR by `sourceHandleCn` -> `nameCn`.
 *   2. Replace the product's images with photos[0] + photos[1] of that
 *      album IF at least one current image points to album position >= 2
 *      (i.e., is provably a close-up).
 *
 * Conservative: if the current images already point to album positions
 * 0 and/or 1, we do NOT touch them — the existing dimension-based
 * image-quality audit handles the case where photo[0] itself happens
 * to be a closeup. We never reduce below 2 images, never delete a
 * product, and only touch image fields.
 *
 * Writes:
 *   data/sporthub-products.json  (in place, with image fields updated)
 *   data/image-quality-fixes.json (audit log of all fixes)
 *
 * Usage:
 *   node scripts/yupoo-album-image-swap.mjs            # dry-run
 *   node scripts/yupoo-album-image-swap.mjs --apply    # write changes
 */

import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const PRODUCTS_FILE = "data/sporthub-products.json";
const CATALOG_FILE = "data/yupoo-final-catalog.json";
const REPORT_FILE = "data/image-quality-fixes.json";

const CLOSEUP_MARKERS = [
  "-tag",
  "-label",
  "-collar",
  "-fabric",
  "-detail",
  "-closeup",
];

const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, "utf8"));
const originalProductCount = products.length;

// ---------------------------------------------------------------------------
// Index: yupoo "user/hash" -> [{albumIdx, photoIdx}]
// ---------------------------------------------------------------------------
const hashIndex = new Map();
catalog.forEach((album, ai) => {
  album.photos.forEach((url, pi) => {
    const m = url.match(/photo\.yupoo\.com\/([^/]+)\/([^/]+)\/big\.jpg/);
    if (m) {
      const key = `${m[1]}/${m[2]}`;
      if (!hashIndex.has(key)) hashIndex.set(key, []);
      hashIndex.get(key).push({ ai, pi });
    }
  });
});

// nameCn -> albumIdx (first occurrence wins)
const nameIndex = new Map();
catalog.forEach((album, ai) => {
  if (album.nameCn && !nameIndex.has(album.nameCn)) {
    nameIndex.set(album.nameCn, ai);
  }
});

function unwrap(url) {
  if (!url) return null;
  if (typeof url !== "string") return null;
  if (url.startsWith("/api/yupoo-image")) {
    try {
      return new URL(url, "https://example.com").searchParams.get("url");
    } catch {
      return null;
    }
  }
  return url;
}

function hashOf(url) {
  const real = unwrap(url);
  if (!real || typeof real !== "string") return null;
  const m = real.match(/photo\.yupoo\.com\/([^/]+)\/([^/]+)\/big\.jpg/);
  return m ? `${m[1]}/${m[2]}` : null;
}

function isYupoo(url) {
  const real = unwrap(url);
  return typeof real === "string" && real.includes("photo.yupoo.com");
}

function isLocalProductImage(url) {
  return typeof url === "string" && url.startsWith("/images/");
}

function isYupooLinked(p) {
  if (isYupoo(p.primaryImage)) return true;
  for (const u of p.images || []) if (isYupoo(u)) return true;
  for (const u of p.imagesOriginal || []) if (isYupoo(u)) return true;
  if (p.sourceHandleCn && nameIndex.has(p.sourceHandleCn)) return true;
  return false;
}

// Find an album: prefer hash match (more specific), fall back to sourceHandleCn.
function findAlbumForProduct(p) {
  const refUrls = [
    p.primaryImage,
    ...(p.images || []),
    ...(p.imagesOriginal || []),
  ];
  for (const u of refUrls) {
    const h = hashOf(u);
    if (!h) continue;
    const hits = hashIndex.get(h);
    if (hits && hits.length) return catalog[hits[0].ai];
  }
  if (p.sourceHandleCn && nameIndex.has(p.sourceHandleCn)) {
    return catalog[nameIndex.get(p.sourceHandleCn)];
  }
  return null;
}

// Build albumPhotoIdx map for a given album: hash -> position
function albumHashMap(album) {
  const out = new Map();
  album.photos.forEach((url, pi) => {
    const m = url.match(/photo\.yupoo\.com\/([^/]+)\/([^/]+)\/big\.jpg/);
    if (m) out.set(`${m[1]}/${m[2]}`, pi);
  });
  return out;
}

function imageHasCloseupMarker(p) {
  if (!p.imagesLocal) return false;
  for (const f of p.imagesLocal) {
    const lf = String(f).toLowerCase();
    for (const m of CLOSEUP_MARKERS) {
      if (lf.includes(m)) return m;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------
const fixes = [];
const investigatedNoFix = [];
const closeupMarkerHits = [];

let yupooLinked = 0;
let albumMatched = 0;
let albumUnmatched = 0;

for (const p of products) {
  if (!isYupooLinked(p)) continue;
  yupooLinked++;

  // STEP 4: check imagesLocal for closeup markers (logging-only — naming
  // convention in this catalog uses __00/__01 not -tag/-label, so this
  // should be zero, but the scaffolding is here in case it changes).
  const marker = imageHasCloseupMarker(p);
  if (marker) {
    closeupMarkerHits.push({ slug: p.slug, marker, imagesLocal: p.imagesLocal });
  }

  const album = findAlbumForProduct(p);
  if (!album) {
    albumUnmatched++;
    investigatedNoFix.push({
      slug: p.slug,
      reason: "no-album-match",
    });
    continue;
  }
  albumMatched++;

  const album_hashes = albumHashMap(album);

  // Get positions of currently-used yupoo images (from `images` only —
  // that's the field that drives the UI).
  const imgs = p.images || [];
  const positions = imgs.map((u) => {
    const h = hashOf(u);
    if (!h) return -1; // not a yupoo URL (e.g., local webp or shopify)
    return album_hashes.has(h) ? album_hashes.get(h) : -1;
  });

  const hasDeepPosition = positions.some((pos) => pos >= 2);

  if (!hasDeepPosition && !marker) {
    // Already pointing at front/back (positions 0 and/or 1) — leave alone.
    continue;
  }

  // Album must have at least 2 photos to do a clean front+back swap.
  if (album.photo_count < 2 || album.photos.length < 2) {
    investigatedNoFix.push({
      slug: p.slug,
      reason: "album-has-fewer-than-2-photos",
      albumTitle: album.title,
      albumPhotoCount: album.photo_count,
    });
    continue;
  }

  // Build the new pair from album photos[0] + photos[1], wrapped through
  // /api/yupoo-image to match the rest of the catalog's convention.
  const wrap = (u) =>
    `/api/yupoo-image?url=${encodeURIComponent(u)}`;
  const newImages = [wrap(album.photos[0]), wrap(album.photos[1])];
  const newPrimary = newImages[0];

  fixes.push({
    slug: p.slug,
    nameHe: p.nameHe,
    albumTitle: album.title,
    albumPhotoCount: album.photo_count,
    reason: hasDeepPosition
      ? `closeup-image-at-album-position-${positions.find((x) => x >= 2)}`
      : `local-filename-marker:${marker}`,
    before: {
      primaryImage: p.primaryImage,
      images: p.images,
      imagesOriginal: p.imagesOriginal,
    },
    after: {
      primaryImage: newPrimary,
      images: newImages,
      imagesOriginal: newImages,
    },
    albumPositionsBefore: positions,
  });

  if (APPLY) {
    p.images = newImages;
    p.imagesOriginal = newImages;
    p.primaryImage = newPrimary;
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validate() {
  if (products.length !== originalProductCount) {
    throw new Error(
      `Product count changed: was ${originalProductCount}, now ${products.length}`,
    );
  }
  for (const f of fixes) {
    const p = products.find((x) => x.slug === f.slug);
    if (!p) throw new Error(`Fixed product not found after apply: ${f.slug}`);
    if (APPLY) {
      if (!Array.isArray(p.images) || p.images.length !== 2) {
        throw new Error(`Fixed ${f.slug} does not have exactly 2 images`);
      }
    }
  }
  // Confirm the whole file still parses as JSON.
  JSON.parse(JSON.stringify(products));
}
validate();

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
const report = {
  generated_at: new Date().toISOString(),
  applied: APPLY,
  totals: {
    products_in_catalog: products.length,
    yupoo_linked_products: yupooLinked,
    album_matched: albumMatched,
    album_unmatched: albumUnmatched,
    fixed: fixes.length,
    investigated_no_fix: investigatedNoFix.length,
    closeup_marker_hits: closeupMarkerHits.length,
  },
  fixes,
  investigated_no_fix: investigatedNoFix,
  closeup_marker_hits: closeupMarkerHits,
};
fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

if (APPLY && fixes.length > 0) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// ---------------------------------------------------------------------------
// Console summary
// ---------------------------------------------------------------------------
console.log("");
console.log("Yupoo album image-swap audit");
console.log("============================");
console.log(`Products in catalog:         ${products.length}`);
console.log(`Yupoo-linked products:       ${yupooLinked}`);
console.log(`  album matched:             ${albumMatched}`);
console.log(`  album unmatched:           ${albumUnmatched}`);
console.log(`Closeup-filename hits:       ${closeupMarkerHits.length}`);
console.log(`Fixes applied/proposed:      ${fixes.length}`);
console.log(`Investigated but skipped:    ${investigatedNoFix.length}`);
console.log("");

if (fixes.length > 0) {
  const teamCounts = new Map();
  for (const f of fixes) {
    const p = products.find((x) => x.slug === f.slug);
    const t = p?.teamSlug || p?.team || "unknown";
    teamCounts.set(t, (teamCounts.get(t) || 0) + 1);
  }
  const top = [...teamCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log("Top teams affected:");
  for (const [team, n] of top) console.log(`  ${team}: ${n}`);
  console.log("");
}

console.log(`Report: ${REPORT_FILE}`);
console.log(
  APPLY
    ? `Wrote ${fixes.length} fixes to ${PRODUCTS_FILE}`
    : "DRY RUN — pass --apply to write changes",
);
