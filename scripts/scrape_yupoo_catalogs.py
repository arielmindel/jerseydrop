#!/usr/bin/env python3
"""
Scrapes all 7 supplier Yupoo catalogs, builds an index of every album +
every photo URL inside each album.

Output: docs/YUPOO_INDEX.json — schema:
  {
    "<catalog_slug>": {
      "url": "https://...",
      "fetched_at": "2026-05-01T...",
      "albums": [
        {
          "id": "235713414",
          "title_cn": "法国客场",
          "cover_url": "https://photo.yupoo.com/diyao508/5b4392654f/medium.jpg",
          "photo_count": 2,
          "photo_urls": [
            "https://photo.yupoo.com/diyao508/abc123/big.jpg",
            "https://photo.yupoo.com/diyao508/def456/big.jpg"
          ]
        },
        ...
      ]
    },
    ...
  }

Once we have this, each product needing photo replacement is matched to its
album by the hash of its existing image (each Yupoo URL has a unique hash
that's stable within an album) — and we can pull the OTHER photos from the
same album to get front+back views.
"""

import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "YUPOO_INDEX.json"

CATALOGS = [
    ("player_512283458", "https://512283458.x.yupoo.com"),
    ("player_qiqirong", "http://qiqirong.x.yupoo.com"),
    ("fan_jianbo666888", "https://jianbo666888.x.yupoo.com"),
    ("fan_diyao508", "https://diyao508.x.yupoo.com"),
    ("fan_lingshang88", "https://lingshang88.x.yupoo.com"),
    ("short_xiaoyueliang0917", "https://xiaoyueliang0917.x.yupoo.com"),
    ("retro_3072503479", "https://3072503479.x.yupoo.com"),
]

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
TIMEOUT = 30
MAX_PAGES = 30  # safety cap per catalog
CONCURRENT_ALBUMS = 4  # parallel album fetches


def fetch(url, retries=3):
    headers = {"User-Agent": UA, "Accept": "text/html,*/*"}
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=headers, timeout=TIMEOUT)
            if r.status_code == 200:
                return r.text
            if r.status_code == 429 or r.status_code >= 500:
                time.sleep(2 ** attempt + 1)
                continue
            return None
        except Exception:
            time.sleep(2 ** attempt + 1)
    return None


# Each <a class="album__main" title="..." href="/albums/123?..."> with image inside
ALBUM_BLOCK = re.compile(
    r'<a\s+class="album__main"\s+title="([^"]+)"\s+href="(/albums/(\d+)[^"]*)"\s*>'
    r'[\s\S]*?<img[^>]+src="(https://photo\.yupoo\.com/[^"]+)"'
    r'[\s\S]*?<div[^>]*class="[^"]*album__photonumber[^"]*"[^>]*>(\d+)</div>',
    re.IGNORECASE,
)


def parse_albums_page(html, catalog_url):
    """Extract album metadata from one albums-list page."""
    out = []
    for m in ALBUM_BLOCK.finditer(html):
        title_cn, href, album_id, cover_src, photo_count = m.groups()
        out.append({
            "id": album_id,
            "title_cn": title_cn,
            "url": catalog_url + href,
            "cover_url": cover_src,
            "photo_count": int(photo_count),
            "photo_urls": [],  # filled in later
        })
    return out


def list_all_albums(catalog_url):
    """Walk every page of /albums and collect album metadata."""
    all_albums = []
    seen_ids = set()
    for page in range(1, MAX_PAGES + 1):
        url = f"{catalog_url}/albums?tab=gallery&page={page}"
        html = fetch(url)
        if not html:
            break
        page_albums = parse_albums_page(html, catalog_url)
        new = [a for a in page_albums if a["id"] not in seen_ids]
        if not new:
            break  # no new albums = end of pagination
        for a in new:
            seen_ids.add(a["id"])
            all_albums.append(a)
        print(f"  [{catalog_url}] page {page}: +{len(new)} albums (total {len(all_albums)})", flush=True)
    return all_albums


# Inside an album page, photos appear as <img class="autocover" src="...">
# or as data-origin-src / data-src on lazy-loaded thumbnails. The "big.jpg"
# version is what we want.
PHOTO_PATTERNS = [
    re.compile(r'data-origin-src="(https://photo\.yupoo\.com/[^"]+)"'),
    re.compile(r'<img[^>]+class="[^"]*autocover[^"]*"[^>]+src="(https://photo\.yupoo\.com/[^"]+)"'),
    re.compile(r'data-src="(//photo\.yupoo\.com/[^"]+)"'),
]


def fetch_album_photos(album):
    html = fetch(album["url"])
    if not html:
        return album
    photos = []
    seen = set()
    for pat in PHOTO_PATTERNS:
        for m in pat.finditer(html):
            url = m.group(1)
            if url.startswith("//"):
                url = "https:" + url
            # Normalize: prefer "big" over "medium"/"small" if both exist
            url_big = re.sub(r"/(small|medium|small\.jpg|medium\.jpg)", "/big", url)
            url_big = re.sub(r"/medium\.", "/big.", url_big)
            url_big = re.sub(r"/small\.", "/big.", url_big)
            # Extract the hash so we can de-dupe variants
            m2 = re.search(r"yupoo\.com/[^/]+/([0-9a-f]+)/", url_big)
            key = m2.group(1) if m2 else url_big
            if key in seen:
                continue
            seen.add(key)
            photos.append(url_big)
    album["photo_urls"] = photos
    return album


def scrape_catalog(slug, url):
    print(f"\n=== {slug}  ({url})", flush=True)
    albums = list_all_albums(url)
    print(f"  → {len(albums)} albums total. Fetching album photos...", flush=True)
    # Parallel fetch all album photo lists
    with ThreadPoolExecutor(max_workers=CONCURRENT_ALBUMS) as pool:
        futures = [pool.submit(fetch_album_photos, a) for a in albums]
        done = 0
        for fut in as_completed(futures):
            done += 1
            if done % 25 == 0 or done == len(albums):
                print(f"    {done}/{len(albums)} album pages parsed", flush=True)
    return {
        "url": url,
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "albums": albums,
    }


def main():
    if "--only" in sys.argv:
        only = sys.argv[sys.argv.index("--only") + 1]
        catalogs = [c for c in CATALOGS if c[0] == only]
    else:
        catalogs = CATALOGS

    index = {}
    if OUT.exists():
        try:
            index = json.loads(OUT.read_text())
            print(f"Loaded existing index: {len(index)} catalogs")
        except Exception:
            index = {}

    for slug, url in catalogs:
        index[slug] = scrape_catalog(slug, url)
        # Write incrementally so an interrupted run doesn't lose work
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(index, indent=2, ensure_ascii=False))
        print(f"  ✓ saved to {OUT}", flush=True)

    print("\n=== Summary ===")
    for slug, data in index.items():
        total_photos = sum(len(a["photo_urls"]) for a in data["albums"])
        print(f"  {slug}: {len(data['albums'])} albums, {total_photos} photos")


if __name__ == "__main__":
    main()
