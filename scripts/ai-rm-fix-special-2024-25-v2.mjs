#!/usr/bin/env node
/**
 * One-shot fix v2 for real-madrid-special-2024-25.
 *
 * Source: round2/D4AF8526-78C6-4E3C-8172-BF0C03FAE45E.jpeg (1086×1449).
 *
 * Layout: 2x2 grid BUT with UNEQUAL row heights. The jerseys occupy
 * roughly the TOP 67% (y=0 to ~975) and the shorts occupy the BOTTOM
 * 33% (y≈990 to 1449). The split is NOT at halfH=724.
 *
 * Prior fix (ai-rm-fix-special-2024-25.mjs) used halfH=724 → cut both
 * jerseys in half across the chest.
 *
 * This v2 extracts the FULL jersey-front and full jersey-back, no shorts
 * (since catalog says isShortSuit=null → display as jersey only).
 *
 *   front = extract(left=0,    top=0, width=halfW, height=JERSEY_H)
 *   back  = extract(left=halfW,top=0, width=halfW, height=JERSEY_H)
 *
 * where JERSEY_H = 980 (just below the divider row, no shorts).
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
  "/Users/arielmindel/Downloads/jerseydrop_approved_images/round2/D4AF8526-78C6-4E3C-8172-BF0C03FAE45E.jpeg";
const SLUG = "real-madrid-special-2024-25";
const Q = 90;
const JERSEY_H = 820; // ends at jersey hem, just before the shelf divider

async function main() {
  const meta = await sharp(SRC).metadata();
  const halfW = Math.floor(meta.width / 2);
  console.log(`Source ${meta.width}×${meta.height}, halfW=${halfW}, jerseyH=${JERSEY_H}`);

  const front = await sharp(SRC)
    .extract({ left: 0, top: 0, width: halfW, height: JERSEY_H })
    .jpeg({ quality: Q })
    .toBuffer();
  const back = await sharp(SRC)
    .extract({ left: halfW, top: 0, width: meta.width - halfW, height: JERSEY_H })
    .jpeg({ quality: Q })
    .toBuffer();

  const fs = await import("node:fs/promises");
  await fs.writeFile("/tmp/rm-audit/_fix-special-2024-25-front.jpg", front);
  await fs.writeFile("/tmp/rm-audit/_fix-special-2024-25-back.jpg", back);
  console.log("Wrote local previews to /tmp/rm-audit/_fix-special-2024-25-*.jpg");

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
