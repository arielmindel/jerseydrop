#!/usr/bin/env node
// Sanity check: upload one local image to R2 and fetch it back via the public URL.
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import fs from "node:fs/promises";
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
  R2_PUBLIC_URL,
} = process.env;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const LOCAL = "/Users/arielmindel/supplier-images/sporthub-product-images";

async function main() {
  const files = await fs.readdir(LOCAL);
  const sample = files.find((f) => f.endsWith(".jpg"));
  if (!sample) throw new Error("No .jpg files in local backup");
  const fullPath = path.join(LOCAL, sample);
  const buf = await fs.readFile(fullPath);
  console.log(`Reading: ${sample} (${(buf.length / 1024).toFixed(1)} KB)`);

  const key = "test/connection-check.jpg";
  console.log(`Uploading to s3://${R2_BUCKET}/${key} ...`);
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buf,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=60",
    }),
  );
  console.log("Upload OK.");

  const publicUrl = `${R2_PUBLIC_URL}/${key}`;
  console.log(`Fetching back from public URL: ${publicUrl}`);
  const res = await fetch(publicUrl);
  console.log(`Response: ${res.status} ${res.statusText}`);
  console.log(`Content-Type: ${res.headers.get("content-type")}`);
  console.log(`Content-Length: ${res.headers.get("content-length")}`);
  if (!res.ok) {
    console.error(
      "Public URL is NOT serving. Check that the bucket has Public Development URL enabled in the R2 dashboard.",
    );
    process.exit(2);
  }
  const downloaded = Buffer.from(await res.arrayBuffer());
  if (downloaded.length !== buf.length) {
    console.error(
      `Size mismatch: uploaded ${buf.length}, downloaded ${downloaded.length}`,
    );
    process.exit(3);
  }
  console.log("✓ Round-trip successful. R2 is wired correctly.");
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
