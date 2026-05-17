#!/usr/bin/env node
/**
 * One-shot fix for real-madrid-away-2024-25-kids-t-1355.
 *
 * Source: long_sleeve_001.png (1086×1448, Type C layout).
 * Bug: the source AI image placed jersey-front extending PAST the 50/50
 * split (jersey ends around column ~530, but split is at 543), and the
 * shorts panels (TR/BR) start at column 543 with the hanger centered
 * around column ~800. Vanilla halfW extract captures ~20px of jersey-bleed
 * on the LEFT EDGE of the shorts panel.
 *
 * Fix: instead of TR=[543..1086], use a tighter [620..1086] slice for the
 * shorts so the jersey bleed is excluded. Then compose the shorts onto a
 * halfW (543) canvas, horizontally centered. Result is a clean
 * jersey-on-top + shorts-on-bottom portrait.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import * as dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET } =
  process.env;
const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const SRC =
  "/Users/arielmindel/Downloads/jerseydrop_approved_images/long-sleeves/long_sleeve_001.png";
const SLUG = "real-madrid-away-2024-25-kids-t-1355";
const Q = 90;

// Shorts panel: start past jersey-bleed
const SHORTS_LEFT = 620;

async function makeSide({ jerseyTop, shortsTop }) {
  const meta = await sharp(SRC).metadata();
  const halfW = Math.floor(meta.width / 2);
  const halfH = Math.floor(meta.height / 2);

  // Jersey = LEFT half top (TL) or LEFT half bottom (BL)
  const jersey = await sharp(SRC)
    .extract({ left: 0, top: jerseyTop, width: halfW, height: halfH })
    .png()
    .toBuffer();

  // Shorts = cropped right portion (avoiding jersey bleed), centered onto halfW
  const shortsCropW = meta.width - SHORTS_LEFT;
  const shortsCrop = await sharp(SRC)
    .extract({
      left: SHORTS_LEFT,
      top: shortsTop,
      width: shortsCropW,
      height: halfH,
    })
    .png()
    .toBuffer();
  // Center onto a halfW × halfH canvas with the same dark background as source
  const shortsCentered = await sharp({
    create: {
      width: halfW,
      height: halfH,
      channels: 3,
      background: { r: 0, g: 0, b: 0 }, // matches source studio bg
    },
  })
    .composite([
      { input: shortsCrop, top: 0, left: Math.floor((halfW - shortsCropW) / 2) },
    ])
    .png()
    .toBuffer();

  // Final vstack
  return sharp({
    create: {
      width: halfW,
      height: halfH * 2,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([
      { input: jersey, top: 0, left: 0 },
      { input: shortsCentered, top: halfH, left: 0 },
    ])
    .jpeg({ quality: Q })
    .toBuffer();
}

async function main() {
  const meta = await sharp(SRC).metadata();
  const halfH = Math.floor(meta.height / 2);
  console.log(`Source ${meta.width}×${meta.height}, halfH=${halfH}`);

  const front = await makeSide({ jerseyTop: 0, shortsTop: 0 });
  const back = await makeSide({ jerseyTop: halfH, shortsTop: halfH });

  // Also write local copies so we can verify before pushing to R2
  const fs = await import("node:fs/promises");
  await fs.writeFile("/tmp/rm-audit/_fix-kids-t-1355-front.jpg", front);
  await fs.writeFile("/tmp/rm-audit/_fix-kids-t-1355-back.jpg", back);
  console.log("Wrote local previews to /tmp/rm-audit/_fix-kids-t-1355-*.jpg");

  if (process.argv.includes("--upload")) {
    const put = (key, body) =>
      s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: body,
          ContentType: "image/jpeg",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
    await Promise.all([
      put(`ai-products/${SLUG}/front.jpg`, front),
      put(`ai-products/${SLUG}/back.jpg`, back),
    ]);
    console.log(`✓ Uploaded ai-products/${SLUG}/front.jpg (${front.length}B)`);
    console.log(`✓ Uploaded ai-products/${SLUG}/back.jpg  (${back.length}B)`);
  } else {
    console.log("Dry run. Pass --upload to push to R2.");
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
