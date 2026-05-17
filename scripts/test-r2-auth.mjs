#!/usr/bin/env node
// Verify new R2 credentials authenticate against the jerseydrop-images bucket.
// Uses ListObjectsV2 — no writes, just read auth check.
import {
  S3Client,
  ListObjectsV2Command,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET,
} = process.env;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function main() {
  console.log(`Using Access Key ID: ${R2_ACCESS_KEY_ID.slice(0, 8)}…`);
  console.log(`Bucket: ${R2_BUCKET}`);
  await s3.send(new HeadBucketCommand({ Bucket: R2_BUCKET }));
  console.log("HeadBucket OK — credentials authenticated.");

  // Walk pages to count total objects under products/ (single page is capped
  // at 1000 keys, so we'd otherwise undercount our ~3,901 images).
  let total = 0;
  let pages = 0;
  let continuationToken;
  const sampleKeys = [];
  do {
    const resp = await s3.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: "products/",
        ContinuationToken: continuationToken,
      }),
    );
    pages++;
    const keys = resp.Contents || [];
    total += keys.length;
    if (sampleKeys.length < 3 && keys.length) {
      sampleKeys.push(...keys.slice(0, 3 - sampleKeys.length).map((k) => k.Key));
    }
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : null;
  } while (continuationToken);

  console.log(`ListObjectsV2 OK — ${pages} page(s).`);
  console.log(`Objects under products/: ${total}`);
  console.log(`Sample keys: ${sampleKeys.join(", ")}`);
}

main().catch((e) => {
  console.error("FAILED:", e?.name || "", e?.message || e);
  if (e?.$metadata) console.error("HTTP status:", e.$metadata.httpStatusCode);
  process.exit(1);
});
