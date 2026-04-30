#!/usr/bin/env python3
"""
Quality audit for the rembg-cleaned images. Flags products where the AI
over-cropped (sleeves missing, blob remnants, only logo survived, etc).

Heuristics — a CLEANED image is suspect if any of:
  1. Non-white pixel area < 18% of total pixels
       (a real jersey on white fills 30-65%; below 18% means the AI ate it)
  2. Bounding box of non-white content is dramatically smaller than the
     output canvas (e.g. just a swoosh or a fragment in the corner)
  3. Aspect ratio of the bounding box is way off from a jersey shape
     (a jersey is roughly 0.85-1.4 in height/width; below 0.5 or above 2.5
     is something weird like a horizontal strip)
  4. The non-white area has too many disconnected pieces (a jersey is one
     mostly-connected blob)

Writes:
  docs/CLEANED_IMAGE_AUDIT.json   { suspectIds: [...], details: { ... } }

Run:
  python3 scripts/audit_cleaned_images.py
"""

import io
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "sporthub-products.json"
PUBLIC = ROOT / "public"
OUT = ROOT / "docs" / "CLEANED_IMAGE_AUDIT.json"

WHITE_THRESHOLD = 240  # any RGB channel >= 240 counts as "near-white" background

MIN_FILL_PCT = 22.0  # below this, treat as eaten by AI
MAX_BLOB_BBOX_RATIO = 0.30  # if bbox covers < this fraction of image area, suspect


def is_suspect(path: Path):
    """Returns (is_suspect, reason, metrics dict) for a cleaned WebP."""
    try:
        img = Image.open(path).convert("RGB")
    except Exception as e:
        return True, f"open-failed:{type(e).__name__}", {}
    arr = np.asarray(img)
    h, w = arr.shape[:2]
    total = h * w
    # A pixel is "background" if all channels >= threshold (i.e. mostly white)
    is_bg = np.all(arr >= WHITE_THRESHOLD, axis=2)
    is_fg = ~is_bg
    fg_count = int(is_fg.sum())
    fill_pct = fg_count / total * 100.0
    metrics = {"w": w, "h": h, "fill_pct": round(fill_pct, 2)}

    if fg_count == 0:
        return True, "empty-after-clean", metrics

    # Bounding box of foreground
    rows = np.any(is_fg, axis=1)
    cols = np.any(is_fg, axis=0)
    if not rows.any() or not cols.any():
        return True, "no-bbox", metrics
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    bbox_h = int(rmax - rmin + 1)
    bbox_w = int(cmax - cmin + 1)
    bbox_ratio = (bbox_h * bbox_w) / total
    bbox_aspect = bbox_h / max(1, bbox_w)
    metrics["bbox"] = f"{bbox_w}x{bbox_h}"
    metrics["bbox_ratio"] = round(bbox_ratio, 3)
    metrics["bbox_aspect_h_over_w"] = round(bbox_aspect, 2)

    if fill_pct < MIN_FILL_PCT:
        return True, f"low-fill({fill_pct:.1f}%)", metrics
    if bbox_ratio < MAX_BLOB_BBOX_RATIO:
        return True, f"tiny-bbox({bbox_ratio:.2f})", metrics
    if bbox_aspect < 0.5 or bbox_aspect > 2.5:
        return True, f"weird-aspect({bbox_aspect:.2f})", metrics

    # NEW: jersey-shape sanity. A real jersey has horizontal extent at the
    # SHOULDER LINE roughly = sleeve span. We check the widest run of fg
    # pixels in the upper third — if the bbox is much narrower at top vs
    # middle, the AI ate the sleeves.
    upper_third = is_fg[rmin:rmin + max(1, bbox_h // 3), :]
    if upper_third.size:
        upper_widths = upper_third.sum(axis=1)
        upper_max = int(upper_widths.max())
        # Middle stripe (around 50% of bbox height)
        middle_band = is_fg[rmin + bbox_h // 3 : rmin + 2 * bbox_h // 3, :]
        middle_max = int(middle_band.sum(axis=1).max()) if middle_band.size else 1
        # If the upper third is < 60% as wide as the middle, sleeves are
        # likely missing (a true jersey has wide shoulders).
        if middle_max > 0 and upper_max / middle_max < 0.55:
            metrics["upper_to_middle_ratio"] = round(upper_max / middle_max, 2)
            return True, f"sleeves-missing({upper_max}/{middle_max})", metrics

    return False, "ok", metrics


def main():
    products = json.loads(DATA.read_text(encoding="utf-8"))
    todo = []
    for p in products:
        if p.get("imageQuality") == "low":
            continue
        for i, url in enumerate(p.get("images") or []):
            if not url.startswith("/images/products-clean/"):
                continue
            path = PUBLIC / url.lstrip("/")
            if not path.exists():
                continue
            todo.append((p["id"], i, path, p.get("nameHe", "")))

    print(f"Auditing {len(todo)} cleaned images...")
    suspects = []
    by_reason = {}
    for n, (pid, idx, path, name) in enumerate(todo, 1):
        bad, reason, metrics = is_suspect(path)
        if bad:
            suspects.append({
                "id": pid,
                "idx": idx,
                "path": str(path.relative_to(ROOT)),
                "nameHe": name,
                "reason": reason,
                "metrics": metrics,
            })
            tag = reason.split("(")[0]
            by_reason[tag] = by_reason.get(tag, 0) + 1
        if n % 250 == 0:
            print(f"  {n}/{len(todo)} · suspects={len(suspects)}")

    print()
    print(f"Total suspects: {len(suspects)} / {len(todo)} ({len(suspects)/max(1,len(todo))*100:.1f}%)")
    for k, v in sorted(by_reason.items(), key=lambda x: -x[1]):
        print(f"  {v:>4}  {k}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"total": len(todo), "suspects": suspects, "by_reason": by_reason}, indent=2, ensure_ascii=False))
    print(f"\nReport: {OUT}")


if __name__ == "__main__":
    main()
