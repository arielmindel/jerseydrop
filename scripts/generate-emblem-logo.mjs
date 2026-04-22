/**
 * Emblem / esports-style crest logo for JerseyDrop.
 * Inspired by the "Offside Jersey" reference: white circle → dark shield
 * with yellow trim → soccer ball + checkered flag + whistle up top →
 * chrome "JERSEY" text → yellow "DROP" ribbon → green pitch footer →
 * yellow stars & blue burst lines radiating out.
 *
 * Run: node scripts/generate-emblem-logo.mjs
 */

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, "../public/brand");

function buildEmblemSvg(size) {
  // Static viewBox 1080x1080, sharp rescales to `size`.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1080 1080">
  <defs>
    <!-- Chrome/silver text gradient for JERSEY -->
    <linearGradient id="chromeFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#F5F7FA"/>
      <stop offset="35%" stop-color="#C9D1D9"/>
      <stop offset="55%" stop-color="#6B7280"/>
      <stop offset="72%" stop-color="#9CA3AF"/>
      <stop offset="100%" stop-color="#E5E7EB"/>
    </linearGradient>

    <!-- Shield background gradient -->
    <linearGradient id="shieldBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#0B1A4A"/>
    </linearGradient>

    <!-- Inner shield gradient -->
    <linearGradient id="shieldInner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1E40AF"/>
    </linearGradient>

    <!-- Gold banner gradient -->
    <linearGradient id="goldBanner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="55%" stop-color="#EAB308"/>
      <stop offset="100%" stop-color="#CA8A04"/>
    </linearGradient>

    <!-- Gold rim gradient -->
    <linearGradient id="goldRim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Green pitch gradient -->
    <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#16A34A"/>
      <stop offset="100%" stop-color="#065F46"/>
    </linearGradient>

    <!-- Blue speed line gradient (fade from opaque to transparent) -->
    <linearGradient id="speedLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2563EB" stop-opacity="0"/>
      <stop offset="100%" stop-color="#2563EB" stop-opacity="0.65"/>
    </linearGradient>

    <!-- Whistle body gradient -->
    <linearGradient id="whistleBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E5E7EB"/>
      <stop offset="50%" stop-color="#9CA3AF"/>
      <stop offset="100%" stop-color="#4B5563"/>
    </linearGradient>

    <!-- Soft drop shadow filter for the shield -->
    <filter id="shieldShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
      <feOffset dy="8"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- ===== WHITE CIRCLE BACKGROUND ===== -->
  <circle cx="540" cy="540" r="520" fill="#FFFFFF"/>

  <!-- ===== BACKGROUND BURST (behind shield) ===== -->
  <!-- Blue speed lines radiating out -->
  <g opacity="0.35">
    <rect x="70"  y="420" width="160" height="12" fill="url(#speedLine)"/>
    <rect x="70"  y="460" width="200" height="10" fill="url(#speedLine)"/>
    <rect x="70"  y="560" width="180" height="12" fill="url(#speedLine)" transform="scale(1 -1) translate(0 -1100)"/>
    <rect x="70"  y="620" width="140" height="10" fill="url(#speedLine)"/>
    <rect x="850" y="420" width="160" height="12" fill="url(#speedLine)" transform="scale(-1 1) translate(-1860 0)"/>
    <rect x="850" y="460" width="200" height="10" fill="url(#speedLine)" transform="scale(-1 1) translate(-1900 0)"/>
    <rect x="850" y="560" width="180" height="12" fill="url(#speedLine)" transform="scale(-1 1) translate(-1880 0)"/>
    <rect x="850" y="620" width="140" height="10" fill="url(#speedLine)" transform="scale(-1 1) translate(-1840 0)"/>
  </g>

  <!-- Yellow starbursts -->
  <g fill="#FBBF24">
    <polygon points="180,220 195,260 235,260 200,285 215,325 180,300 145,325 160,285 125,260 165,260" transform="scale(0.5) translate(100 250)"/>
    <polygon points="920,220 935,260 975,260 940,285 955,325 920,300 885,325 900,285 865,260 905,260" transform="scale(0.5) translate(1550 250)"/>
    <polygon points="160,800 175,840 215,840 180,865 195,905 160,880 125,905 140,865 105,840 145,840" transform="scale(0.55) translate(80 750)"/>
    <polygon points="920,820 935,860 975,860 940,885 955,925 920,900 885,925 900,885 865,860 905,860" transform="scale(0.55) translate(1530 750)"/>
  </g>

  <!-- Small sparkles -->
  <g fill="#FDE047">
    <circle cx="110" cy="500" r="6"/>
    <circle cx="980" cy="520" r="6"/>
    <circle cx="200" cy="900" r="5"/>
    <circle cx="900" cy="900" r="5"/>
    <circle cx="540" cy="105" r="5"/>
    <circle cx="540" cy="985" r="5"/>
  </g>

  <!-- ===== SHIELD ===== -->
  <g filter="url(#shieldShadow)">
    <!-- Shield outer (gold trim) -->
    <path d="M 270 290
             L 810 290
             Q 830 290 830 315
             L 830 650
             Q 830 700 790 745
             Q 680 850 550 895
             L 530 895
             Q 400 850 290 745
             Q 250 700 250 650
             L 250 315
             Q 250 290 270 290
             Z"
          fill="url(#goldRim)" stroke="#8B5A00" stroke-width="3"/>
    <!-- Shield inner (blue) -->
    <path d="M 290 315
             L 790 315
             Q 802 315 802 330
             L 802 642
             Q 802 685 768 722
             Q 672 815 552 858
             L 528 858
             Q 408 815 312 722
             Q 278 685 278 642
             L 278 330
             Q 278 315 290 315
             Z"
          fill="url(#shieldBg)"/>
    <!-- Inner blue highlight stripe (light gloss at top) -->
    <path d="M 310 335
             L 770 335
             L 770 420
             Q 540 455 310 420
             Z"
          fill="url(#shieldInner)" opacity="0.55"/>
  </g>

  <!-- ===== TOP ICONS: FLAG + BALL + WHISTLE ===== -->
  <!-- Checkered flag (left) -->
  <g transform="translate(320 335)">
    <!-- Pole -->
    <rect x="0" y="-10" width="6" height="130" fill="#1F2937" rx="2"/>
    <!-- Flag body (tilted rect with checker pattern) -->
    <g transform="rotate(-6 6 5)">
      <rect x="6" y="0" width="96" height="62" fill="#FACC15" stroke="#1F2937" stroke-width="3"/>
      <g fill="#1F2937">
        <rect x="6"  y="0"  width="24" height="20"/>
        <rect x="54" y="0"  width="24" height="20"/>
        <rect x="30" y="20" width="24" height="20"/>
        <rect x="78" y="20" width="24" height="20"/>
        <rect x="6"  y="40" width="24" height="22"/>
        <rect x="54" y="40" width="24" height="22"/>
      </g>
    </g>
  </g>

  <!-- Soccer ball (center top) -->
  <g transform="translate(475 325)">
    <circle cx="60" cy="60" r="56" fill="#FFFFFF" stroke="#0F172A" stroke-width="4"/>
    <!-- Central pentagon -->
    <polygon points="60,32 85,50 75,80 45,80 35,50" fill="#0F172A"/>
    <!-- Surrounding patches (simplified) -->
    <g fill="#0F172A">
      <polygon points="30,36 44,48 34,64 17,55"/>
      <polygon points="90,36 76,48 86,64 103,55"/>
      <polygon points="22,75 36,82 32,98 15,92"/>
      <polygon points="98,75 84,82 88,98 105,92"/>
      <polygon points="48,96 60,88 72,96 66,108 54,108"/>
    </g>
    <!-- Ball highlight -->
    <ellipse cx="42" cy="35" rx="12" ry="5" fill="#FFFFFF" opacity="0.6"/>
  </g>

  <!-- Whistle (right) -->
  <g transform="translate(660 345)">
    <!-- Lanyard -->
    <path d="M -8 -10 Q 40 -30 80 -4" stroke="#F87171" stroke-width="4" fill="none"/>
    <!-- Whistle body -->
    <rect x="4" y="8" width="92" height="42" rx="14" fill="url(#whistleBody)" stroke="#1F2937" stroke-width="3"/>
    <!-- Finger hole chamber (circle on top) -->
    <circle cx="70" cy="29" r="10" fill="#0F172A"/>
    <circle cx="70" cy="29" r="5" fill="#4B5563"/>
    <!-- Ring for lanyard -->
    <circle cx="94" cy="12" r="6" fill="none" stroke="#1F2937" stroke-width="3"/>
    <!-- Mouthpiece bump -->
    <rect x="-2" y="22" width="10" height="14" rx="3" fill="url(#whistleBody)" stroke="#1F2937" stroke-width="2"/>
  </g>

  <!-- ===== CHROME "JERSEY" TEXT ===== -->
  <!-- Dark backdrop slab -->
  <rect x="240" y="495" width="600" height="120" rx="10" fill="#0F172A" opacity="0.0"/>
  <!-- Shadow layer -->
  <text x="542" y="597"
        text-anchor="middle"
        font-family="Arial Black, Helvetica Neue, sans-serif"
        font-weight="900" font-size="140" letter-spacing="-4"
        textLength="460" lengthAdjust="spacingAndGlyphs"
        fill="#0F172A">JERSEY</text>
  <!-- Outline layer (thick) -->
  <text x="540" y="594"
        text-anchor="middle"
        font-family="Arial Black, Helvetica Neue, sans-serif"
        font-weight="900" font-size="140" letter-spacing="-4"
        textLength="460" lengthAdjust="spacingAndGlyphs"
        fill="none" stroke="#0F172A" stroke-width="14" stroke-linejoin="round">JERSEY</text>
  <!-- Chrome fill -->
  <text x="540" y="594"
        text-anchor="middle"
        font-family="Arial Black, Helvetica Neue, sans-serif"
        font-weight="900" font-size="140" letter-spacing="-4"
        textLength="460" lengthAdjust="spacingAndGlyphs"
        fill="url(#chromeFill)">JERSEY</text>
  <!-- Top gloss highlight -->
  <text x="540" y="594"
        text-anchor="middle"
        font-family="Arial Black, Helvetica Neue, sans-serif"
        font-weight="900" font-size="140" letter-spacing="-4"
        textLength="460" lengthAdjust="spacingAndGlyphs"
        fill="#FFFFFF" opacity="0.35" clip-path="inset(0 0 60% 0)">JERSEY</text>

  <!-- ===== YELLOW "DROP" RIBBON BANNER ===== -->
  <g>
    <!-- Main ribbon body -->
    <path d="M 300 640
             L 780 640
             L 810 680
             L 780 720
             L 300 720
             L 270 680
             Z"
          fill="url(#goldBanner)" stroke="#92400E" stroke-width="3"/>
    <!-- Side fold shadows -->
    <path d="M 300 640 L 270 680 L 300 720 L 320 680 Z" fill="#92400E" opacity="0.5"/>
    <path d="M 780 640 L 810 680 L 780 720 L 760 680 Z" fill="#92400E" opacity="0.5"/>
    <!-- DROP text on ribbon -->
    <text x="540" y="702"
          text-anchor="middle"
          font-family="Arial Black, Helvetica Neue, sans-serif"
          font-weight="900" font-size="62" letter-spacing="8"
          fill="#1F2937">DROP</text>
  </g>

  <!-- ===== GREEN PITCH FOOTER ===== -->
  <g>
    <!-- Pitch trapezoid shape inside the shield point -->
    <path d="M 350 740
             L 730 740
             Q 720 790 640 830
             L 440 830
             Q 360 790 350 740
             Z"
          fill="url(#pitchGrad)"/>
    <!-- Center circle -->
    <circle cx="540" cy="775" r="28" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.95"/>
    <circle cx="540" cy="775" r="3" fill="#FFFFFF"/>
    <!-- Center line -->
    <line x1="355" y1="775" x2="725" y2="775" stroke="#FFFFFF" stroke-width="2" opacity="0.6"/>
  </g>

  <!-- ===== FRAMING STARS (decoration) ===== -->
  <g fill="#FBBF24" opacity="0.9">
    <polygon points="260,500 268,518 287,518 272,530 279,548 260,537 241,548 248,530 233,518 252,518"/>
    <polygon points="820,500 828,518 847,518 832,530 839,548 820,537 801,548 808,530 793,518 812,518"/>
  </g>
</svg>`;
}

async function render(svg, outPath) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);
  const stats = await fs.stat(outPath);
  console.log(`  ✓ ${path.basename(outPath).padEnd(32)} ${Math.round(stats.size / 1024)} KB`);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log("Rendering emblem crest logo…");
  const sizes = [
    { file: "emblem-1080.png", size: 1080 },
    { file: "emblem-512.png", size: 512 },
    { file: "emblem-400.png", size: 400 },
  ];
  for (const s of sizes) {
    await render(buildEmblemSvg(s.size), path.join(OUT_DIR, s.file));
  }
  console.log("\nDone → public/brand/emblem-*.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
