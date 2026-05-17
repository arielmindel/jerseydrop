#!/usr/bin/env node
/**
 * One-shot fix for real-madrid-special-2024-25.
 *
 * The source AI image is a 2×2 Type-D grid (TL=jersey-front,
 * TR=jersey-back, BL=shorts-front, BR=shorts-back). Earlier v2 split
 * treated it as a set and composed jersey+shorts into a tall portrait.
 * But this SKU is a single jersey, not a set. We re-extract only the
 * jersey halves (TL → front, TR → back) and overwrite the R2 keys.
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
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const SRC =
  "/Users/arielmindel/Downloads/jerseydrop_approved_images/round2/D4AF8526-78C6-4E3C-8172-BF0C03FAE45E.jpeg";
const SLUG = "real-madrid-special-2024-25";
const QUALITY = 90;

async function main() {
  const meta = await sharp(SRC).metadata();
  const halfW = Math.floor(meta.width / 2);
  const halfH = Math.floor(meta.height / 2);
  console.log(`Source ${meta.width}×${meta.height}, extracting ${halfW}×${halfH} per quadrant`);

  // Type D: TL = jersey-front, TR = jersey-back. Keep ONLY these.
  const frontBuf = await sharp(SRC)
    .extract({ left: 0, top: 0, width: halfW, height: halfH })
    .jpeg({ quality: QUALITY })
    .toBuffer();
  const backBuf = await sharp(SRC)
    .extract({ left: halfW, top: 0, width: meta.width - halfW, height: halfH })
    .jpeg({ quality: QUALITY })
    .toBuffer();

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
    put(`ai-products/${SLUG}/front.jpg`, frontBuf),
    put(`ai-products/${SLUG}/back.jpg`, backBuf),
  ]);
  console.log(`✓ Uploaded ai-products/${SLUG}/front.jpg  (${frontBuf.length} bytes)`);
  console.log(`✓ Uploaded ai-products/${SLUG}/back.jpg   (${backBuf.length} bytes)`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
