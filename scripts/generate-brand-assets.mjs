/**
 * Generate PNG brand assets (profile pictures, covers, apple-touch-icon) from
 * the pristine SVG path definitions — independent of font availability.
 *
 * Run: node scripts/generate-brand-assets.mjs
 *
 * Outputs to /public/brand/.
 */

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, "../public/brand");

const COLORS = {
  bg: "#0A0A0A",
  white: "#FFFFFF",
  accent: "#00FF88",
  gold: "#D4AF37",
};

// Inline icon paths (kept in sync with /public/logo/logo-mark.svg — jersey + droplet).
const JERSEY_PATH = "M 22 14 L 14 14 L 8 18 L 5 28 L 16 26 L 16 56 L 48 56 L 48 26 L 59 28 L 56 18 L 50 14 L 42 14 L 32 24 Z";
const DROPLET_PATH = "M 32 28 L 38 42 A 6 6 0 0 1 26 42 Z";

function iconGroup(scale = 1, tx = 0, ty = 0, strokeWidth = 3.5) {
  return `<g transform="translate(${tx} ${ty}) scale(${scale})">
    <g stroke="${COLORS.white}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" fill="none">
      <path d="${JERSEY_PATH}" />
    </g>
    <g fill="${COLORS.accent}" stroke="none">
      <path d="${DROPLET_PATH}" />
    </g>
  </g>`;
}

function squareLogo({ size, bg = COLORS.bg, iconPct = 0.55 }) {
  const iconSize = size * iconPct;
  const scale = iconSize / 64;
  const tx = (size - iconSize) / 2;
  const ty = (size - iconSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" fill="${bg}"/>
    <circle cx="${size * 0.85}" cy="${size * 0.15}" r="${size * 0.3}" fill="${COLORS.accent}" opacity="0.12"/>
    ${iconGroup(scale, tx, ty, 3.5)}
  </svg>`;
}

function roundedBadge({ size }) {
  // For apple-touch-icon — with accent-tinted gradient glow in the corner
  const iconSize = size * 0.6;
  const scale = iconSize / 64;
  const tx = (size - iconSize) / 2;
  const ty = (size - iconSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${COLORS.bg}"/>
        <stop offset="1" stop-color="#1A1A1A"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" rx="${size * 0.22}" ry="${size * 0.22}" fill="url(#g)"/>
    <circle cx="${size * 0.78}" cy="${size * 0.22}" r="${size * 0.32}" fill="${COLORS.accent}" opacity="0.15"/>
    ${iconGroup(scale, tx, ty, 3.5)}
  </svg>`;
}

function banner({ width, height, bg = COLORS.bg }) {
  // Horizontal cover for Facebook/Twitter/LinkedIn headers.
  // Treat the wordmark as a fixed-length block via textLength so we can center
  // the full lockup deterministically.
  const iconSize = height * 0.5;
  const fontSize = height * 0.26;
  const wordmarkLen = fontSize * 5.8; // approx width of "JERSEYDROP" at this weight
  const gap = height * 0.12;
  const groupW = iconSize + gap + wordmarkLen;
  const startX = Math.max(height * 0.2, (width - groupW) / 2);
  const iconTx = startX;
  const iconTy = (height - iconSize) / 2;
  const scale = iconSize / 64;

  const wordX = iconTx + iconSize + gap;
  const wordY = height / 2 + fontSize * 0.35;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <radialGradient id="glow" cx="50%" cy="0%" r="65%">
        <stop offset="0" stop-color="${COLORS.accent}" stop-opacity="0.22"/>
        <stop offset="1" stop-color="${COLORS.accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="${bg}"/>
    <rect width="100%" height="100%" fill="url(#glow)"/>
    ${iconGroup(scale, iconTx, iconTy, 3.5)}
    <text x="${wordX}" y="${wordY}" font-family="Arial Black, Helvetica Neue, Arial, sans-serif" font-weight="900" font-size="${fontSize}" letter-spacing="-2" textLength="${wordmarkLen}" lengthAdjust="spacingAndGlyphs">
      <tspan fill="${COLORS.white}">JERSEY</tspan><tspan fill="${COLORS.accent}">DROP</tspan>
    </text>
    <text x="${width / 2}" y="${height - height * 0.08}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${height * 0.055}" letter-spacing="5" fill="${COLORS.accent}" opacity="0.75">
      OFFICIAL JERSEYS · WORLD CUP 2026
    </text>
  </svg>`;
}

async function render(svg, outPath) {
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  const stats = await fs.stat(outPath);
  console.log(`✓ ${path.relative(path.resolve(__dirname, ".."), outPath)} (${Math.round(stats.size / 1024)} KB)`);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  // Square profiles — solid dark bg (best for Instagram / Google Business / WhatsApp)
  await render(squareLogo({ size: 1080 }), path.join(OUT_DIR, "profile-1080.png"));
  await render(squareLogo({ size: 512 }), path.join(OUT_DIR, "profile-512.png"));
  await render(squareLogo({ size: 400 }), path.join(OUT_DIR, "profile-400.png"));

  // Transparent-bg icons (for use on dark UIs already)
  await render(
    squareLogo({ size: 1024, bg: "transparent" }),
    path.join(OUT_DIR, "profile-1024-transparent.png"),
  );

  // Rounded-square badge (iOS/Android home screen)
  await render(roundedBadge({ size: 512 }), path.join(OUT_DIR, "app-icon-512.png"));
  await render(roundedBadge({ size: 180 }), path.join(OUT_DIR, "apple-touch-icon.png"));

  // Social banners / covers
  await render(
    banner({ width: 1500, height: 500 }),
    path.join(OUT_DIR, "cover-twitter-1500x500.png"),
  );
  await render(
    banner({ width: 1200, height: 630 }),
    path.join(OUT_DIR, "cover-og-1200x630.png"),
  );
  await render(
    banner({ width: 820, height: 312 }),
    path.join(OUT_DIR, "cover-facebook-820x312.png"),
  );

  console.log("\nAll brand assets generated → public/brand/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
