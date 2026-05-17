#!/usr/bin/env node
// Verify the new R2 token can Put + Delete a tiny test object.
// Used once after rotating keys, then can be deleted.

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
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

const KEY = `test/write-check-${Date.now()}.txt`;
const BODY = `r2-write-check ${new Date().toISOString()}`;

async function main() {
  console.log(`PUT s3://${R2_BUCKET}/${KEY} ...`);
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: KEY,
      Body: BODY,
      ContentType: "text/plain",
    }),
  );
  console.log("  PUT ok");

  console.log(`HEAD s3://${R2_BUCKET}/${KEY} ...`);
  const head = await s3.send(
    new HeadObjectCommand({ Bucket: R2_BUCKET, Key: KEY }),
  );
  console.log(`  HEAD ok — size=${head.ContentLength} ct=${head.ContentType}`);

  console.log(`DELETE s3://${R2_BUCKET}/${KEY} ...`);
  await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: KEY }));
  console.log("  DELETE ok");

  console.log("✓ R2 write/read/delete all working.");
}

main().catch((e) => {
  console.error("FAILED:", e.message || e);
  process.exit(1);
});
