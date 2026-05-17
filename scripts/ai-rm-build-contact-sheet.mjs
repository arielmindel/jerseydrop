#!/usr/bin/env node
/**
 * Build a single contact-sheet PNG showing every Real Madrid product's
 * front+back pair, with the slug + variant printed under each cell.
 *
 * Layout: 4 products per row, 16 rows = 64 products. Each cell is
 * [front | back] side by side + label band below it.
 *
 * Output: /tmp/rm-audit/contact-sheet.png  →  Read with the Read tool.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = "/tmp/rm-audit";
const OUT_PATH = "/tmp/rm-audit/contact-sheet.png";

const COLS = 4; // products per row
const THUMB_W = 130;
const THUMB_H = 175; // jersey portrait ~3:4
const GAP = 6;
const LABEL_H = 36;
const CELL_W = THUMB_W * 2 + GAP; // front + back
const CELL_H = THUMB_H + LABEL_H;
const PAD = 10;

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

function escapeSvgText(t) {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildLabelSvg(idx, slug, variant) {
  const top = `${idx + 1}. ${variant}`;
  // Trim slug for label space
  const slugShort = slug.length > 38 ? slug.slice(0, 35) + "…" : slug;
  return Buffer.from(`
    <svg width="${CELL_W}" height="${LABEL_H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0f1320"/>
      <text x="6" y="14" fill="#7df09a" font-family="ui-monospace, Menlo, monospace" font-size="11" font-weight="700">${escapeSvgText(top)}</text>
      <text x="6" y="30" fill="#cbd5e1" font-family="ui-monospace, Menlo, monospace" font-size="10">${escapeSvgText(slugShort)}</text>
    </svg>
  `);
}

async function fitTo(srcBuf, w, h) {
  return sharp(srcBuf)
    .resize(w, h, { fit: "contain", background: { r: 240, g: 240, b: 245 } })
    .toBuffer();
}

async function main() {
  const list = JSON.parse(
    await fs.readFile(path.join(SRC_DIR, "manifest.json"), "utf8"),
  );
  console.log(`Products: ${list.length}`);
  const rows = Math.ceil(list.length / COLS);
  const sheetW = COLS * CELL_W + (COLS + 1) * PAD;
  const sheetH = rows * CELL_H + (rows + 1) * PAD;
  console.log(`Sheet: ${sheetW}×${sheetH} px  (${COLS}×${rows})`);

  const composites = [];
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const fileBase = `${String(i).padStart(2, "0")}_${p.slug.slice(0, 40)}`;
    const frontPath = path.join(SRC_DIR, `${fileBase}_front.jpg`);
    const backPath = path.join(SRC_DIR, `${fileBase}_back.jpg`);
    const [frontBuf, backBuf] = await Promise.all([
      fs.readFile(frontPath),
      fs.readFile(backPath),
    ]);
    const [frontThumb, backThumb] = await Promise.all([
      fitTo(frontBuf, THUMB_W, THUMB_H),
      fitTo(backBuf, THUMB_W, THUMB_H),
    ]);
    const labelSvg = buildLabelSvg(i, p.slug, shortVariant(p));

    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (CELL_W + PAD);
    const y = PAD + row * (CELL_H + PAD);
    composites.push({ input: frontThumb, top: y, left: x });
    composites.push({ input: backThumb, top: y, left: x + THUMB_W + GAP });
    composites.push({ input: labelSvg, top: y + THUMB_H, left: x });
  }

  const sheet = await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 3,
      background: { r: 8, g: 12, b: 20 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await fs.writeFile(OUT_PATH, sheet);
  console.log(`Wrote ${OUT_PATH}  (${(sheet.length / 1024).toFixed(0)} KB)`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
