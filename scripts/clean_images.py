#!/usr/bin/env python3
"""
Fast batch background-removal: load the rembg U2Net model ONCE, then push
every product image through the same in-memory session. ~3x faster than
spawning the rembg CLI per image.

Usage:
  python3 scripts/clean_images.py [--limit N]

Reads:
  data/sporthub-products.json

Writes:
  public/images/products-clean/<id>-<idx>.webp  (one per processed image)
  data/sporthub-products.json                    (URLs updated, originals
                                                   stashed in imagesOriginal[])
"""

import io
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "sporthub-products.json"
OUT_DIR = ROOT / "public" / "images" / "products-clean"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Tune-ables
DOWNLOAD_TIMEOUT = 30
WEBP_QUALITY = 82
MAX_WIDTH = 1200  # downsize ridiculously huge originals before processing
DOWNLOAD_CONCURRENCY = 2  # lowered after yupoo rate-limited at 8
SAVE_EVERY = 50

LIMIT = None
if "--limit" in sys.argv:
    LIMIT = int(sys.argv[sys.argv.index("--limit") + 1])

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0"


def unwrap(url: str):
    if not url:
        return None
    if url.startswith("/api/yupoo-image"):
        try:
            qs = urllib.parse.urlparse(url).query
            return urllib.parse.parse_qs(qs).get("url", [None])[0]
        except Exception:
            return None
    if url.startswith("/"):
        return None
    return url


def referer_for(url: str):
    try:
        u = urllib.parse.urlparse(url)
        if u.hostname and u.hostname.endswith("yupoo.com"):
            parts = [p for p in u.path.split("/") if p]
            user = parts[0] if parts else ""
            return f"https://{user}.x.yupoo.com/" if user else "https://yupoo.com/"
    except Exception:
        pass
    return None


def download(url: str, retries: int = 3):
    real = unwrap(url)
    if not real:
        return None
    headers = {"User-Agent": UA, "Accept": "image/*"}
    r = referer_for(real)
    if r:
        headers["Referer"] = r
    last_err = None
    for attempt in range(retries):
        try:
            resp = requests.get(real, headers=headers, timeout=DOWNLOAD_TIMEOUT, stream=False)
            if resp.status_code == 200:
                return resp.content
            if resp.status_code == 429 or resp.status_code >= 500:
                # Rate-limited or transient — back off and retry
                time.sleep(2 ** attempt + 1)
                continue
            return None
        except Exception as e:
            last_err = e
            time.sleep(2 ** attempt + 1)
    return None


def to_webp(rgba_image: Image.Image, out_path: Path) -> bool:
    """Composite RGBA over white, save as WebP via cwebp for best compression."""
    if rgba_image.mode != "RGBA":
        rgba_image = rgba_image.convert("RGBA")
    bg = Image.new("RGB", rgba_image.size, (255, 255, 255))
    bg.paste(rgba_image, mask=rgba_image.split()[3])
    # Cap width so giant 3024×3024 retros don't bloat
    if bg.width > MAX_WIDTH:
        ratio = MAX_WIDTH / bg.width
        bg = bg.resize((MAX_WIDTH, int(bg.height * ratio)), Image.LANCZOS)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        tmp = Path(f.name)
        bg.save(tmp, format="PNG")
    try:
        result = subprocess.run(
            ["/opt/homebrew/bin/cwebp", "-q", str(WEBP_QUALITY), "-m", "6", str(tmp), "-o", str(out_path)],
            capture_output=True,
            timeout=20,
        )
        return result.returncode == 0
    finally:
        tmp.unlink(missing_ok=True)


def process(session, product, idx, out_path):
    url = product["images"][idx]
    if url.startswith("/images/products-clean/"):
        return ("skipped-already", None)
    if out_path.exists() and out_path.stat().st_size > 1000:
        return ("skipped-existed", None)
    raw = download(url)
    if not raw or len(raw) < 5000:
        return ("download-failed", None)
    try:
        cleaned = remove(raw, session=session)
        img = Image.open(io.BytesIO(cleaned))
    except Exception as e:
        return (f"rembg-failed:{type(e).__name__}", None)
    ok = to_webp(img, out_path)
    if not ok:
        return ("webp-failed", None)
    return ("cleaned", url)


def main():
    products = json.loads(DATA.read_text(encoding="utf-8"))
    todo = []
    for p in products:
        if p.get("imageQuality") == "low":
            continue
        for i, url in enumerate(p.get("images") or []):
            if not url or url.startswith("/images/products-clean/"):
                continue
            safe_id = "".join(c if c.isalnum() or c in "._-" else "_" for c in p["id"])
            out = OUT_DIR / f"{safe_id}-{i}.webp"
            todo.append((p, i, out))
    if LIMIT:
        todo = todo[:LIMIT]
    total = len(todo)
    print(f"To process: {total} images across {len({t[0]['id'] for t in todo})} products")

    print("Loading rembg session (one-time, ~5-10s)...")
    t0 = time.time()
    session = new_session("u2net")
    print(f"  ready in {time.time() - t0:.1f}s")

    # Pre-fetch downloads in parallel since rembg is single-threaded
    # Use a producer-consumer: parallel downloads, single rembg processor
    cleaned = 0
    failed = 0
    skipped = 0
    failures = []
    start = time.time()

    def fetch(item):
        p, idx, out_path = item
        url = p["images"][idx]
        if url.startswith("/images/products-clean/"):
            return (item, None, "skipped-already")
        if out_path.exists() and out_path.stat().st_size > 1000:
            return (item, None, "skipped-existed")
        raw = download(url)
        if not raw or len(raw) < 5000:
            return (item, None, "download-failed")
        return (item, raw, "ok")

    with ThreadPoolExecutor(max_workers=DOWNLOAD_CONCURRENCY) as pool:
        futures = [pool.submit(fetch, item) for item in todo]
        for done_idx, fut in enumerate(as_completed(futures), 1):
            item, raw, status = fut.result()
            p, idx, out_path = item
            if status.startswith("skipped"):
                skipped += 1
                # Still update URL on already-existed files
                if status == "skipped-existed":
                    rel = "/" + str(out_path.relative_to(ROOT / "public"))
                    if not p.get("imagesOriginal"):
                        p["imagesOriginal"] = list(p.get("images", []))
                    p["images"][idx] = rel
            elif status == "ok":
                # Run rembg + webp on the main thread (ML is single-threaded anyway)
                try:
                    cleaned_bytes = remove(raw, session=session)
                    img = Image.open(io.BytesIO(cleaned_bytes))
                    if to_webp(img, out_path):
                        rel = "/" + str(out_path.relative_to(ROOT / "public"))
                        if not p.get("imagesOriginal"):
                            p["imagesOriginal"] = list(p.get("images", []))
                        p["images"][idx] = rel
                        cleaned += 1
                    else:
                        failed += 1
                        if len(failures) < 30:
                            failures.append((p["id"], idx, "webp-failed"))
                except Exception as e:
                    failed += 1
                    if len(failures) < 30:
                        failures.append((p["id"], idx, f"rembg:{type(e).__name__}"))
            else:
                failed += 1
                if len(failures) < 30:
                    failures.append((p["id"], idx, status))

            if done_idx % 25 == 0 or done_idx == total:
                elapsed = time.time() - start
                rate = done_idx / max(0.1, elapsed)
                eta = (total - done_idx) / max(0.001, rate)
                print(
                    f"  {done_idx}/{total} · cleaned={cleaned} fail={failed} skip={skipped} · {elapsed:.0f}s · {rate:.1f}/s · eta={eta:.0f}s"
                )
            if done_idx % SAVE_EVERY == 0:
                DATA.write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")

    DATA.write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")
    print()
    print(f"Done. cleaned={cleaned} failed={failed} skipped={skipped}")
    if failures:
        print("First failures:")
        for f in failures:
            print(f"  {f}")


if __name__ == "__main__":
    main()
