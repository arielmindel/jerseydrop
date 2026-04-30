#!/usr/bin/env python3
"""
Pragmatic rollback: for every product image flagged by the cleaned-image
audit, replace product.images[idx] with the original (pre-rembg) URL
stashed in product.imagesOriginal[idx].

This trades "white background everywhere" for "no missing-sleeve / red-blob
disasters". Customers see the genuine product photo for the 128 problem
SKUs, while the other 2,606 keep their clean white backgrounds.

Run:
  python3 scripts/rollback_bad_cleanups.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "sporthub-products.json"
AUDIT = ROOT / "docs" / "CLEANED_IMAGE_AUDIT.json"

products = json.loads(DATA.read_text(encoding="utf-8"))
by_id = {p["id"]: p for p in products}
audit = json.loads(AUDIT.read_text(encoding="utf-8"))
suspects = audit["suspects"]

rolled_back = 0
no_original = 0

for s in suspects:
    p = by_id.get(s["id"])
    if not p:
        continue
    idx = s["idx"]
    originals = p.get("imagesOriginal") or []
    original_url = originals[idx] if idx < len(originals) else None
    if not original_url:
        no_original += 1
        continue
    p["images"][idx] = original_url
    rolled_back += 1

DATA.write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")

print(f"Rolled back: {rolled_back} images to original URLs")
if no_original:
    print(f"No original to roll back to: {no_original}")
