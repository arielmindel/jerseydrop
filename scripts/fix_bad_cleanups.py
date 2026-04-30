#!/usr/bin/env python3
"""
For every product image flagged by audit_cleaned_images.py, retry the
cleanup with rembg's `birefnet-general` model (BiRefNet — much better
edge detection than U2Net, especially for sleeves and complex shapes).

If the retry produces a "good" output (passes the same heuristics that
flagged it in the first place), we OVERWRITE the existing webp.
Otherwise we ROLL BACK that product.images[idx] to its imagesOriginal[idx]
so the customer sees the original photo (with original background) rather
than a mutilated one.

Run:
  python3 scripts/fix_bad_cleanups.py
"""

import io
import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import numpy as np
import requests
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "sporthub-products.json"
AUDIT = ROOT / "docs" / "CLEANED_IMAGE_AUDIT.json"
PUBLIC = ROOT / "public"
OUT_DIR = PUBLIC / "images" / "products-clean"

WHITE_THRESHOLD = 240
MIN_FILL_PCT = 22.0
MAX_BLOB_BBOX_RATIO = 0.30
MAX_WIDTH = 1200
WEBP_QUALITY = 82
DOWNLOAD_TIMEOUT = 30
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0"


def unwrap(url):
    if not url:
        return None
    if url.startswith("/api/yupoo-image"):
        try:
            from urllib.parse import urlparse, parse_qs
            return parse_qs(urlparse(url).query).get("url", [None])[0]
        except Exception:
            return None
    if url.startswith("/"):
        return None
    return url


def referer_for(url):
    try:
        from urllib.parse import urlparse
        u = urlparse(url)
        if u.hostname and u.hostname.endswith("yupoo.com"):
            parts = [p for p in u.path.split("/") if p]
            user = parts[0] if parts else ""
            return f"https://{user}.x.yupoo.com/" if user else "https://yupoo.com/"
    except Exception:
        pass
    return None


def download(url):
    real = unwrap(url)
    if not real:
        return None
    headers = {"User-Agent": UA, "Accept": "image/*"}
    r = referer_for(real)
    if r:
        headers["Referer"] = r
    for attempt in range(3):
        try:
            resp = requests.get(real, headers=headers, timeout=DOWNLOAD_TIMEOUT)
            if resp.status_code == 200:
                return resp.content
            if resp.status_code == 429 or resp.status_code >= 500:
                time.sleep(2 ** attempt + 1)
                continue
            return None
        except Exception:
            time.sleep(2 ** attempt + 1)
    return None


def to_webp(rgba_image, out_path):
    if rgba_image.mode != "RGBA":
        rgba_image = rgba_image.convert("RGBA")
    bg = Image.new("RGB", rgba_image.size, (255, 255, 255))
    bg.paste(rgba_image, mask=rgba_image.split()[3])
    if bg.width > MAX_WIDTH:
        ratio = MAX_WIDTH / bg.width
        bg = bg.resize((MAX_WIDTH, int(bg.height * ratio)), Image.LANCZOS)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        tmp = Path(f.name)
        bg.save(tmp, format="PNG")
    try:
        r = subprocess.run(
            ["/opt/homebrew/bin/cwebp", "-q", str(WEBP_QUALITY), "-m", "6", str(tmp), "-o", str(out_path)],
            capture_output=True,
            timeout=20,
        )
        return r.returncode == 0
    finally:
        tmp.unlink(missing_ok=True)


def is_good_cleanup(path):
    """Run the same heuristics as the audit. Returns True if cleanup is OK."""
    try:
        img = Image.open(path).convert("RGB")
    except Exception:
        return False
    arr = np.asarray(img)
    h, w = arr.shape[:2]
    total = h * w
    is_bg = np.all(arr >= WHITE_THRESHOLD, axis=2)
    is_fg = ~is_bg
    fg_count = int(is_fg.sum())
    if fg_count == 0:
        return False
    fill_pct = fg_count / total * 100
    if fill_pct < MIN_FILL_PCT:
        return False
    rows = np.any(is_fg, axis=1)
    cols = np.any(is_fg, axis=0)
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    bbox_h = int(rmax - rmin + 1)
    bbox_w = int(cmax - cmin + 1)
    bbox_ratio = (bbox_h * bbox_w) / total
    bbox_aspect = bbox_h / max(1, bbox_w)
    if bbox_ratio < MAX_BLOB_BBOX_RATIO:
        return False
    if bbox_aspect < 0.5 or bbox_aspect > 2.5:
        return False
    upper_third = is_fg[rmin:rmin + max(1, bbox_h // 3), :]
    if upper_third.size:
        upper_max = int(upper_third.sum(axis=1).max())
        middle_band = is_fg[rmin + bbox_h // 3 : rmin + 2 * bbox_h // 3, :]
        middle_max = int(middle_band.sum(axis=1).max()) if middle_band.size else 1
        if middle_max > 0 and upper_max / middle_max < 0.55:
            return False
    return True


def main():
    products = json.loads(DATA.read_text(encoding="utf-8"))
    by_id = {p["id"]: p for p in products}
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    suspects = audit["suspects"]
    print(f"Re-cleaning {len(suspects)} suspect images with birefnet-general...")

    # birefnet-general is ~973MB and ran ~10min/image on this CPU.
    # Switching to isnet-general-use — modern, only 170MB, similar accuracy
    # for the cases we're fixing (over-cropped jerseys).
    print("Loading isnet-general-use session...")
    t0 = time.time()
    session = new_session("isnet-general-use")
    print(f"  ready in {time.time() - t0:.1f}s", flush=True)

    fixed = 0
    rolled_back = 0
    for n, s in enumerate(suspects, 1):
        product = by_id.get(s["id"])
        if not product:
            continue
        idx = s["idx"]
        original_url = (product.get("imagesOriginal") or [None] * (idx + 1))[idx]
        if not original_url:
            continue
        # Re-download original
        raw = download(original_url)
        if not raw or len(raw) < 5000:
            # download failed; roll back to original URL
            product["images"][idx] = original_url
            rolled_back += 1
            continue
        # Re-clean with stronger model
        try:
            cleaned_bytes = remove(raw, session=session)
            cleaned = Image.open(io.BytesIO(cleaned_bytes))
        except Exception:
            product["images"][idx] = original_url
            rolled_back += 1
            continue
        # Save to a tmp WebP and audit it
        out_path = PUBLIC / Path(s["path"]).relative_to(Path("public"))
        ok_write = to_webp(cleaned, out_path)
        if ok_write and is_good_cleanup(out_path):
            fixed += 1
        else:
            # Roll back
            product["images"][idx] = original_url
            rolled_back += 1
        if n % 5 == 0 or n == len(suspects):
            print(f"  {n}/{len(suspects)} · fixed={fixed} rolled_back={rolled_back}", flush=True)

    DATA.write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")
    print()
    print(f"Done. Fixed (better model worked): {fixed}")
    print(f"Rolled back (using original photo): {rolled_back}")


if __name__ == "__main__":
    main()
