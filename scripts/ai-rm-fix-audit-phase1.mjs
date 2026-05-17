#!/usr/bin/env node
/**
 * One-shot audit-driven fix:
 *
 *   A. real-madrid-home-2024-25 ← set_002.png as Type A (vertical 50/50)
 *      left half → front.jpg, right half → back.jpg. Source is a
 *      horizontal full-set pair (set-front | set-back).
 *
 *   B. real-madrid-home-1999-00-set ← adult_001.png — caller must
 *      confirm layout (D vs C) before running. Pass `--layout=D` or
 *      `--layout=C` on the command line.
 *
 *        Type D (2×2 reversed): TL=jersey-front, TR=jersey-back,
 *                               BL=shorts-front, BR=shorts-back.
 *          → front = vstack(TL, BL),  back = vstack(TR, BR)
 *
 *        Type C (2×2 standard): TL=jersey-front, TR=shorts-front,
 *                               BL=jersey-back, BR=shorts-back.
 *          → front = vstack(TL, TR),  back = vstack(BL, BR)
 *
 *   Both overwrite the existing R2 keys.
 *
 * Usage:
 *   node scripts/ai-rm-fix-audit-phase1.mjs --task=A
 *   node scripts/ai-rm-fix-audit-phase1.mjs --task=B --layout=D
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

const Q = 90;
const SRC_DIR = "/Users/arielmindel/Downloads/jerseydrop_approved_images";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.+))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

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

async function taskA() {
  const src = `${SRC_DIR}/sets/set_002.png`;
  const slug = "real-madrid-home-2024-25";
  const meta = await sharp(src).metadata();
  const halfW = Math.floor(meta.width / 2);
  const [front, back] = await Promise.all([
    sharp(src)
      .extract({ left: 0, top: 0, width: halfW, height: meta.height })
      .jpeg({ quality: Q })
      .toBuffer(),
    sharp(src)
      .extract({
        left: halfW,
        top: 0,
        width: meta.width - halfW,
        height: meta.height,
      })
      .jpeg({ quality: Q })
      .toBuffer(),
  ]);
  await Promise.all([
    put(`ai-products/${slug}/front.jpg`, front),
    put(`ai-products/${slug}/back.jpg`, back),
  ]);
  console.log(
    `✓ A — ${slug}  src ${meta.width}×${meta.height}  front=${front.length}B  back=${back.length}B`,
  );
}

async function taskB(layout) {
  if (!["C", "D"].includes(layout))
    throw new Error("Pass --layout=C or --layout=D for task B");
  const src = `${SRC_DIR}/adults/adult_001.png`;
  const slug = "real-madrid-home-1999-00-set";
  const meta = await sharp(src).metadata();
  const halfW = Math.floor(meta.width / 2);
  const halfH = Math.floor(meta.height / 2);
  const ex = (left, top) =>
    sharp(src).extract({ left, top, width: halfW, height: halfH }).toBuffer();
  const [TL, TR, BL, BR] = await Promise.all([
    ex(0, 0),
    ex(halfW, 0),
    ex(0, halfH),
    ex(halfW, halfH),
  ]);
  const vstack = (top, bottom) =>
    sharp({
      create: {
        width: halfW,
        height: halfH * 2,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        { input: top, top: 0, left: 0 },
        { input: bottom, top: halfH, left: 0 },
      ])
      .jpeg({ quality: Q })
      .toBuffer();

  let front, back;
  if (layout === "D") {
    [front, back] = await Promise.all([vstack(TL, BL), vstack(TR, BR)]);
  } else {
    [front, back] = await Promise.all([vstack(TL, TR), vstack(BL, BR)]);
  }
  await Promise.all([
    put(`ai-products/${slug}/front.jpg`, front),
    put(`ai-products/${slug}/back.jpg`, back),
  ]);
  console.log(
    `✓ B — ${slug}  src ${meta.width}×${meta.height}  layout ${layout}  front=${front.length}B  back=${back.length}B`,
  );
}

async function main() {
  if (args.task === "A") await taskA();
  else if (args.task === "B") await taskB(args.layout);
  else {
    console.error('Pass --task=A or --task=B --layout=C|D');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
