#!/usr/bin/env node
/**
 * Build N contact-sheet batches (16 products each, 4×4 grid) at large
 * enough thumb size that the Read tool can show each jersey clearly.
 *
 * Output: /tmp/rm-audit/batch-{1..N}.png
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = "/tmp/rm-audit";
const OUT_PATTERN = (n) => path.join(SRC_DIR, `batch-${n}.png`);
const PER_BATCH = 16;
const COLS = 4;
const THUMB_W = 220;
const THUMB_H = 330; // 2:3 portrait → fits SET (AR 0.67) without letterbox
const GAP = 4;
const LABEL_H = 32;
const CELL_W = THUMB_W * 2 + GAP;
const CELL_H = THUMB_H + LABEL_H;
const PAD = 8;

function shortVariant(p) {
  if (p.isKids && p.isShortSuit && p.isLongSleeve) return "K·LS·SET";
  if (p.isKids && p.isShortSuit) return "K·SET";
  if (p.isKids && p.isLongSleeve) return "K·LS";
  if (p.isKids) return "KIDS";
  if (p.isShortSuit && p.isLongSleeve) return "A·LS·SET";
  if (p.isShortSuit) return "SET";
  if (p.isLongSleeve) return "LS";
  return "SS";
}

function esc(t) {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function label(idx, slug, variant) {
  const slugShort = slug.length > 38 ? slug.slice(0, 35) + "…" : slug;
  return Buffer.from(`
    <svg width="${CELL_W}" height="${LABEL_H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0f1320"/>
      <text x="6" y="13" fill="#7df09a" font-family="ui-monospace, Menlo, monospace" font-size="11" font-weight="700">#${idx + 1} · ${esc(variant)}</text>
      <text x="6" y="27" fill="#cbd5e1" font-family="ui-monospace, Menlo, monospace" font-size="10">${esc(slugShort)}</text>
    </svg>`);
}

async function fit(srcBuf, w, h) {
  return sharp(srcBuf)
    .resize(w, h, { fit: "contain", background: { r: 240, g: 240, b: 245 } })
    .toBuffer();
}

async function main() {
  const list = JSON.parse(
    await fs.readFile(path.join(SRC_DIR, "manifest.json"), "utf8"),
  );
  const batches = Math.ceil(list.length / PER_BATCH);
  const rows = Math.ceil(PER_BATCH / COLS);
  const sheetW = COLS * CELL_W + (COLS + 1) * PAD;
  const sheetH = rows * CELL_H + (rows + 1) * PAD;
  console.log(`Total: ${list.length} products → ${batches} batch(es) of ${PER_BATCH}`);
  console.log(`Each sheet: ${sheetW}×${sheetH} px`);

  for (let b = 0; b < batches; b++) {
    const slice = list.slice(b * PER_BATCH, (b + 1) * PER_BATCH);
    const composites = [];
    for (let j = 0; j < slice.length; j++) {
      const globalIdx = b * PER_BATCH + j;
      const p = slice[j];
      const base = `${String(globalIdx).padStart(2, "0")}_${p.slug.slice(0, 40)}`;
      const [fBuf, bBuf] = await Promise.all([
        fs.readFile(path.join(SRC_DIR, `${base}_front.jpg`)),
        fs.readFile(path.join(SRC_DIR, `${base}_back.jpg`)),
      ]);
      const [fThumb, bThumb] = await Promise.all([
        fit(fBuf, THUMB_W, THUMB_H),
        fit(bBuf, THUMB_W, THUMB_H),
      ]);
      const col = j % COLS;
      const row = Math.floor(j / COLS);
      const x = PAD + col * (CELL_W + PAD);
      const y = PAD + row * (CELL_H + PAD);
      composites.push({ input: fThumb, top: y, left: x });
      composites.push({ input: bThumb, top: y, left: x + THUMB_W + GAP });
      composites.push({
        input: label(globalIdx, p.slug, shortVariant(p)),
        top: y + THUMB_H,
        left: x,
      });
    }
    const sheet = await sharp({
      create: {
        width: sheetW,
        height: sheetH,
        channels: 3,
        background: { r: 235, g: 238, b: 244 }, // light gray so dark kits don't merge into bg
      },
    })
      .composite(composites)
      .png({ compressionLevel: 9 })
      .toBuffer();
    const out = OUT_PATTERN(b + 1);
    await fs.writeFile(out, sheet);
    console.log(`  ✓ ${out}  (${(sheet.length / 1024).toFixed(0)} KB)`);
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
