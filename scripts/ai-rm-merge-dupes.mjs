#!/usr/bin/env node
/**
 * Detect duplicate Real Madrid product entries and merge the obvious ones.
 *
 * "Obvious" = the duplicate's slug is the canonical's slug followed by
 * "-real-madrid-..." — the classic supplier-import bug where a row was
 * accidentally re-slugged with the team name appended. Those are 100%
 * safe to merge because the slug shape proves they're the same SKU.
 *
 * Everything else (different nameHe, retro / special / null-season groups
 * where one might be an "away" while another is "third", or where one is
 * a training jersey vs a home jersey) is recorded in the merge report for
 * manual review — NOT auto-mutated.
 *
 * Merge rules (per spec):
 *   - If duplicate has AI images and canonical doesn't → copy AI URLs +
 *     primaryImage to canonical, then delete duplicate.
 *   - If canonical has AI images and duplicate doesn't → just delete dup.
 *   - If BOTH have AI → keep canonical's, delete dup.
 *   - If NEITHER has AI → keep canonical, delete dup.
 *   - Always preserve canonical's imagesOriginal (the deepest historical
 *     backup — never overwrite).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CATALOG = path.join(ROOT, "data", "sporthub-products.json");
const REPORT = path.join(ROOT, "data", "catalog-merge-report.json");

const products = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const rm = products.filter(
  (p) => p.teamSlug === "real-madrid" || p.team === "ריאל מדריד",
);
console.log(`Real Madrid products: ${rm.length}`);

function variantOf(p) {
  const k = p.isKids ? "K" : "A";
  const s = p.isShortSuit ? "set" : "no";
  const l = p.isLongSleeve ? "LS" : "SS";
  return `${k}-${s}-${l}`;
}

function hasAi(p) {
  return (
    Array.isArray(p.images) &&
    p.images.length > 0 &&
    typeof p.images[0] === "string" &&
    p.images[0].includes("/ai-products/")
  );
}

// Group by (season, type, variant)
const groups = new Map();
for (const p of rm) {
  const key = `${p.season || "null"}|${p.type || ""}|${variantOf(p)}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(p);
}

const merges = []; // applied
const flagged = []; // needs manual review

for (const [key, list] of groups) {
  if (list.length < 2) continue;
  // Sort by slug length asc, alphabetical as tiebreaker — shortest = canonical
  list.sort((a, b) => a.slug.length - b.slug.length || a.slug.localeCompare(b.slug));
  const canonical = list[0];
  const candidates = list.slice(1);

  for (const dup of candidates) {
    // Strict safety: duplicate slug must start with `${canon.slug}-real-madrid-`
    const isClearDup = dup.slug.startsWith(`${canonical.slug}-real-madrid-`);
    if (!isClearDup) {
      flagged.push({
        groupKey: key,
        canonical: { slug: canonical.slug, nameHe: canonical.nameHe, hasAi: hasAi(canonical) },
        candidate: { slug: dup.slug, nameHe: dup.nameHe, hasAi: hasAi(dup) },
        reason: "slug shape does not prove duplication — manual review required",
      });
      continue;
    }

    const canonAi = hasAi(canonical);
    const dupAi = hasAi(dup);
    let action = "delete-dup-only";
    if (dupAi && !canonAi) {
      canonical.images = [...dup.images];
      canonical.primaryImage = dup.primaryImage;
      if (dup.imageQuality === null && canonical.imageQuality === "low") {
        canonical.imageQuality = null;
      }
      // imagesOriginal — keep canonical's (deepest history). Only seed it
      // from the dup if canonical's is empty AND dup had a non-empty one.
      if (
        (!Array.isArray(canonical.imagesOriginal) ||
          canonical.imagesOriginal.length === 0) &&
        Array.isArray(dup.imagesOriginal) &&
        dup.imagesOriginal.length > 0
      ) {
        canonical.imagesOriginal = [...dup.imagesOriginal];
      }
      action = "ai-promoted-from-dup";
    } else if (canonAi && dupAi) {
      action = "both-ai-kept-canon";
    } else if (canonAi && !dupAi) {
      action = "canon-already-ai";
    } else {
      action = "neither-ai-kept-canon";
    }

    merges.push({
      groupKey: key,
      canonicalSlug: canonical.slug,
      deletedSlug: dup.slug,
      action,
      canonicalNameHe: canonical.nameHe,
      duplicateNameHe: dup.nameHe,
    });
  }
}

// Apply deletions (in-place, by slug)
const deletedSlugs = new Set(merges.map((m) => m.deletedSlug));
const before = products.length;
const after = products.filter((p) => !deletedSlugs.has(p.slug));
console.log(`Catalog: ${before} → ${after.length} (-${before - after.length})`);

// Write outputs
fs.writeFileSync(CATALOG, JSON.stringify(after, null, 2));
fs.writeFileSync(
  REPORT,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      stats: {
        rmProducts: rm.length,
        dupGroups: [...groups.values()].filter((l) => l.length > 1).length,
        autoMerged: merges.length,
        flaggedForReview: flagged.length,
        catalogBefore: before,
        catalogAfter: after.length,
      },
      auto: merges,
      manualReview: flagged,
    },
    null,
    2,
  ),
);

console.log("");
console.log("=== Merge complete ===");
console.log(`Auto-merged (clear dups):    ${merges.length}`);
console.log(`Flagged for manual review:   ${flagged.length}`);
console.log(`Report: ${REPORT}`);
if (merges.length > 0) {
  console.log("");
  console.log("Sample of auto-merges:");
  merges.slice(0, 10).forEach((m) => {
    console.log(`  - ${m.deletedSlug}`);
    console.log(`      → kept ${m.canonicalSlug}  [${m.action}]`);
  });
}
