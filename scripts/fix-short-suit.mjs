#!/usr/bin/env node
/**
 * V5 feedback #6 — sets cleanup.
 *
 * Many products are flagged `isShortSuit: true` but have NO linguistic signal
 * (no 套/套装/短裤/童装 in Chinese, no סט/חליפ/מכנס/מדים in Hebrew). Those are
 * almost certainly false positives where the supplier mass-tagged jerseys as
 * sets. We unset the flag + drop the "סטים"/"short-suit" tags.
 *
 * Linguistic signals are conservative — we'd rather under-clean than wrongly
 * remove a real set. Verified samples (e.g. "Real Madrid 25-26 player edition"
 * with `25-26皇马联名款`) confirm these are single-jersey listings.
 */

import fs from "node:fs";

const FILE = "data/sporthub-products.json";
const products = JSON.parse(fs.readFileSync(FILE, "utf8"));

const CN_SET_MARKERS = ["套", "套装", "套裝", "短裤", "短褲", "童装", "童裝"];
const HE_SET_MARKERS = [
  /(^|[\s\-(])סט([\s\-).]|$)/u,
  /(^|[\s\-(])חליפ/u,
  /(^|[\s\-(])מכנס/u,
  /(^|[\s\-(])מדים([\s\-).]|$)/u,
];
const EN_SET_MARKERS = [/\bkit\b/i, /\bset\b/i, /\bsuit\b/i, /\bshort/i];

function hasSetSignal(p) {
  const cn = p.sourceHandleCn || "";
  const he = p.nameHe || "";
  const en = p.nameEn || "";
  if (CN_SET_MARKERS.some((m) => cn.includes(m))) return true;
  if (HE_SET_MARKERS.some((re) => re.test(he))) return true;
  if (EN_SET_MARKERS.some((re) => re.test(en))) return true;
  return false;
}

let cleared = 0;
let kept = 0;

for (const p of products) {
  if (!p.isShortSuit) continue;
  if (hasSetSignal(p)) {
    kept++;
    continue;
  }
  // No signal → unset
  p.isShortSuit = false;
  if (Array.isArray(p.tags)) {
    p.tags = p.tags.filter((t) => t !== "סטים" && t !== "short-suit");
  }
  cleared++;
}

fs.writeFileSync(FILE, JSON.stringify(products, null, 2));
console.log(`Cleared isShortSuit on ${cleared} products (no linguistic signal)`);
console.log(`Kept ${kept} products with verified set signals`);
console.log(`Total products: ${products.length}`);
