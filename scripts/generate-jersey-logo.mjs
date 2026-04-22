/**
 * Generate the hero "JerseyDrop" brand image — a colorful photorealistic-
 * adjacent soccer jersey viewed from the back, rendered from pure SVG
 * geometry so we never depend on an AI image quota.
 *
 * Run: node scripts/generate-jersey-logo.mjs
 * Outputs to /public/brand/.
 */

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, "../public/brand");

// Jersey back silhouette — one closed path (collar → shoulder → sleeve out →
// sleeve bottom → armpit → body side → hem → back up the other side → collar).
// Coordinates assume viewBox 0 0 1080 1080.
const JERSEY_PATH =
  "M 340 272 L 238 258 L 148 332 L 130 502 L 310 478 L 328 780 L 346 958 L 734 958 L 752 780 L 770 478 L 950 502 L 932 332 L 842 258 L 740 272 Q 540 294 340 272 Z";
const COLLAR_BAND = "M 348 278 Q 540 308 732 278";

function buildJerseyLogoSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1080 1080">
  <defs>
    <!-- Jersey body: neon green → electric blue → purple → hot pink -->
    <linearGradient id="jerseyGrad" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="#00FF88"/>
      <stop offset="32%" stop-color="#00C2FF"/>
      <stop offset="60%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#FF3D9A"/>
    </linearGradient>
    <!-- Top-center neon glow -->
    <radialGradient id="topGlow" cx="50%" cy="8%" r="62%">
      <stop offset="0%" stop-color="#00FF88" stop-opacity="0.28"/>
      <stop offset="70%" stop-color="#00FF88" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#00FF88" stop-opacity="0"/>
    </radialGradient>
    <!-- Bottom pink glow -->
    <radialGradient id="bottomGlow" cx="50%" cy="95%" r="55%">
      <stop offset="0%" stop-color="#FF3D9A" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#FF3D9A" stop-opacity="0"/>
    </radialGradient>
    <!-- Side shadow on jersey (left→right darker gradient for dimensionality) -->
    <linearGradient id="sideShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.18"/>
      <stop offset="50%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.18"/>
    </linearGradient>
    <!-- Performance fabric mesh pattern -->
    <pattern id="mesh" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
      <circle cx="7" cy="7" r="0.9" fill="#FFFFFF" opacity="0.12"/>
    </pattern>
    <!-- Subtle grain on the background -->
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/>
    </filter>
    <!-- Clip path: only the jersey body for inner fills -->
    <clipPath id="jerseyClip">
      <path d="${JERSEY_PATH}"/>
    </clipPath>
  </defs>

  <!-- Background (black + two glow spots) -->
  <rect width="1080" height="1080" fill="#0A0A0A"/>
  <rect width="1080" height="1080" fill="url(#topGlow)"/>
  <rect width="1080" height="1080" fill="url(#bottomGlow)"/>
  <rect width="1080" height="1080" filter="url(#grain)"/>

  <!-- Soft halo behind the jersey for "cutout" separation -->
  <ellipse cx="540" cy="620" rx="430" ry="410" fill="#000000" opacity="0.35"/>

  <!-- Jersey fill + mesh overlay + side shade (all clipped to jersey shape) -->
  <g clip-path="url(#jerseyClip)">
    <path d="${JERSEY_PATH}" fill="url(#jerseyGrad)"/>
    <rect x="0" y="0" width="1080" height="1080" fill="url(#mesh)"/>
    <rect x="0" y="0" width="1080" height="1080" fill="url(#sideShade)"/>
  </g>

  <!-- Jersey outline -->
  <path d="${JERSEY_PATH}" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-opacity="0.45" stroke-linejoin="round"/>

  <!-- Collar back band -->
  <path d="${COLLAR_BAND}" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.7"/>
  <path d="${COLLAR_BAND}" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.95"/>

  <!-- Sleeve cuff accents -->
  <line x1="140" y1="498" x2="300" y2="478" stroke="#0A0A0A" stroke-width="7" opacity="0.35"/>
  <line x1="780" y1="478" x2="940" y2="498" stroke="#0A0A0A" stroke-width="7" opacity="0.35"/>

  <!-- "JERSEY DROP" printed on the back (nameplate row) -->
  <text x="540" y="428" text-anchor="middle"
        font-family="Arial Black, Helvetica Neue, sans-serif"
        font-weight="900" font-size="78" letter-spacing="4"
        textLength="410" lengthAdjust="spacingAndGlyphs"
        fill="#FFFFFF">JERSEY DROP</text>

  <!-- Classic big jersey number -->
  <text x="540" y="830" text-anchor="middle"
        font-family="Arial Black, Helvetica Neue, sans-serif"
        font-weight="900" font-size="340" letter-spacing="-10"
        fill="#FFFFFF">26</text>

  <!-- Subtle lens-flare highlight on top-right shoulder -->
  <ellipse cx="820" cy="300" rx="80" ry="18" fill="#FFFFFF" opacity="0.12" transform="rotate(-18 820 300)"/>
</svg>`;
}

async function render(svg, outPath) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);
  const stats = await fs.stat(outPath);
  console.log(`  ✓ ${path.basename(outPath).padEnd(32)} ${Math.round(stats.size / 1024)} KB`);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log("Rendering colorful jersey logo…");
  const sizes = [
    { file: "profile-1080.png", size: 1080 },
    { file: "profile-512.png", size: 512 },
    { file: "profile-400.png", size: 400 },
    { file: "hero-jersey-1200.png", size: 1200 },
  ];
  for (const s of sizes) {
    await render(buildJerseyLogoSvg(s.size), path.join(OUT_DIR, s.file));
  }

  console.log("\nAll brand jersey images regenerated → public/brand/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
