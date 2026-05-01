#!/usr/bin/env python3
"""
Reads:
  - data/sporthub-products.json   (catalog)
  - docs/YUPOO_INDEX.json         (every album + every photo across 7 catalogs)
  - docs/PHOTO_REPLACEMENTS_MASTER.md (informational; not parsed — list lives in code)

For each of the ~129 hidden products:
  1. Find its album by hash-matching the existing image URL against the index
  2. Replace product.images[] with EVERY photo from that album (proxied via /api/yupoo-image)
  3. Stash old URLs in product.imagesOriginal[] (preserve for rollback)
  4. Remove `imageQuality: "low"` so the product becomes publicly visible
  5. Apply per-product overrides (specials, deletions, special-only-no-team) per the master list

Run:
  python3 scripts/apply_photo_replacements.py            # dry run, prints planned actions
  python3 scripts/apply_photo_replacements.py --commit   # actually writes to JSON
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "sporthub-products.json"
INDEX = ROOT / "docs" / "YUPOO_INDEX.json"

# Per-product overrides driven by the master list the user dictated.
# Keys are product IDs.
DELETIONS = {"yp-fan-2-338"}

# These get isSpecial=true (kept on team page AND added to /collections/special).
SPECIALS_KEEP_TEAM = {
    "yp-short-suit-1009",  # Real Madrid 25-26 3rd LS Kids
    "yp-short-suit-1193",  # Barcelona 05-06 Home LS
    "yp-fan-2-431",        # Barcelona Yamal collage
    "yp-short-suit-1247",  # Manchester United 07-08 Away black
    "yp-fan-2-472",        # Juventus Renaissance art
    "yp-fan-2-477",        # Inter Milan Betsson snake
    "yp-fan-2-478",        # Real Betis Naruto
    "yp-fan-2-494",        # Porto Year of Dragon blue/black
    "yp-fan-2-490",        # Porto Year of Dragon white/gold
}

# These get isSpecial=true AND removed from team page (team set to special-only marker).
# We achieve "remove from team" by clearing teamSlug — the team-page filter ignores those.
SPECIALS_NO_TEAM = {
    "yp-fan-2-480",  # Ajax Bob Marley
}

# Products user explicitly said "skip — not important" (don't unhide, leave as-is).
SKIPS = {
    "yp-short-suit-1296",  # Manchester United 24-25 Away LS — user said SKIP
}

# Products user said "optional — try to find but it's OK if not". We still attempt to
# unhide if an album exists. If no album, we leave as-is.
OPTIONAL = {
    "yp-short-suit-1237",  # Real Madrid 11-12 Away
    "yp-fan-2-465",        # Manchester United 2026 Blue Special
    "yp-short-suit-1238",  # Brazil 2004 retro
    "yp-fan-2-458",        # Santos QATAR mashup
    "yp-short-suit-1307",  # Barcelona 24-25 Home LS UNHCR
    "yp-player-2-1759",    # Atletico Madrid 25-26 Away LS
    "yp-short-suit-1197",  # Atletico Madrid 04-05 Away
    "yp-short-suit-1196",  # Atletico Madrid 04-05 Home
}


HASH_RE = re.compile(r"yupoo\.com/([^/]+)/([0-9a-f]+)/")


def url_hash(yupoo_url: str):
    """Extract (catalog_user, photo_hash) from any yupoo.com photo URL or our proxy."""
    if not yupoo_url:
        return None, None
    if yupoo_url.startswith("/api/yupoo-image"):
        # Proxy URL — unwrap the inner ?url= parameter
        m = re.search(r"url=([^&]+)", yupoo_url)
        if m:
            yupoo_url = unquote(m.group(1))
    m = HASH_RE.search(yupoo_url)
    if not m:
        return None, None
    return m.group(1), m.group(2)


def proxy(yupoo_url: str) -> str:
    return "/api/yupoo-image?url=" + quote(yupoo_url, safe="")


def build_hash_to_album(index: dict):
    """Map every photo hash → (catalog_slug, album_dict)."""
    out = {}
    for slug, cat in index.items():
        for album in cat["albums"]:
            for purl in album["photo_urls"]:
                _, h = url_hash(purl)
                if h:
                    out[h] = (slug, album)
    return out


def main(commit: bool):
    products = json.loads(DATA.read_text(encoding="utf-8"))
    by_id = {p["id"]: p for p in products}
    if not INDEX.exists():
        print(f"ERROR: {INDEX} not found. Run scrape_yupoo_catalogs.py first.")
        sys.exit(1)
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    print(
        "Loaded index:",
        ", ".join(f"{s}={len(c['albums'])} albums" for s, c in index.items()),
    )

    hash_to_album = build_hash_to_album(index)
    print(f"Total unique photo hashes in index: {len(hash_to_album)}")

    hidden = [p for p in products if p.get("imageQuality") == "low"]
    print(f"Hidden products to process: {len(hidden)}")

    stats = Counter()
    actions = []  # list of dicts

    for p in hidden:
        pid = p["id"]
        action = {"id": pid, "name": p.get("nameHe", "")[:40]}

        if pid in SKIPS:
            action["op"] = "skip"
            actions.append(action)
            stats["skip"] += 1
            continue

        if pid in DELETIONS:
            # Will be removed below; don't touch its images.
            action["op"] = "pending-delete"
            actions.append(action)
            stats["pending-delete"] += 1
            continue

        # Try to find this product's album by hash-matching its existing images
        existing_hashes = []
        for img in p.get("images", []):
            _, h = url_hash(img)
            if h:
                existing_hashes.append(h)
        for img in p.get("imagesOriginal", []) or []:
            _, h = url_hash(img)
            if h and h not in existing_hashes:
                existing_hashes.append(h)

        matched_album = None
        for h in existing_hashes:
            if h in hash_to_album:
                matched_album = hash_to_album[h]
                break

        if not matched_album:
            # Album not in our index — supplier may have removed/replaced it.
            # The existing image URLs probably still work on Yupoo CDN
            # (the user can see them in the photo-needs guide right now).
            # Fallback strategy: trust the existing images, just unhide.
            existing_imgs = [i for i in p.get("images", []) if i and "yupoo" in i]
            if pid in DELETIONS:
                action["op"] = "skip-pending-delete"
                actions.append(action)
                stats["skip-pending-delete"] += 1
                continue
            if len(existing_imgs) >= 1:
                action["op"] = "unhide-only"
                action["existing_count"] = len(existing_imgs)
                action["existing_hashes"] = existing_hashes
                actions.append(action)
                stats["unhide-only"] += 1
                if not commit:
                    continue
                if "imageQuality" in p:
                    del p["imageQuality"]
                continue
            # No images at all — truly stuck
            action["op"] = "no-album-no-images"
            action["existing_hashes"] = existing_hashes
            actions.append(action)
            stats["no-album-no-images"] += 1
            if pid in OPTIONAL:
                stats["no-album-no-images (optional)"] += 1
            continue

        slug, album = matched_album
        action["catalog"] = slug
        action["album_id"] = album["id"]
        action["album_title"] = album["title_cn"]
        action["album_photo_count"] = len(album["photo_urls"])

        if not album["photo_urls"]:
            action["op"] = "album-empty"
            actions.append(action)
            stats["album-empty"] += 1
            continue

        # Normalize photo URLs: ensure /big.jpg suffix style stored in product
        new_image_urls = []
        for purl in album["photo_urls"]:
            # Replace per-photo trailing-name with big.jpg-style if Yupoo uses /HASH/<name>.jpg
            # Actually keep the original URL — the proxy handles it as-is.
            new_image_urls.append(proxy(purl))

        old_images = list(p.get("images", []))
        # Stash original images if not already stashed
        if "imagesOriginal" not in p or not p["imagesOriginal"]:
            p["imagesOriginal"] = old_images

        action["op"] = "update"
        action["old_count"] = len(old_images)
        action["new_count"] = len(new_image_urls)

        if not commit:
            actions.append(action)
            stats["update (planned)"] += 1
            continue

        # COMMIT
        p["images"] = new_image_urls
        p["primaryImage"] = new_image_urls[0]
        if "imageQuality" in p:
            del p["imageQuality"]
        stats["update"] += 1
        actions.append(action)

    # Apply special flags to ALL products that need them (not just hidden ones)
    for pid in SPECIALS_KEEP_TEAM | SPECIALS_NO_TEAM:
        p = by_id.get(pid)
        if not p:
            stats["special-not-found"] += 1
            continue
        if commit:
            p["isSpecial"] = True
            if pid in SPECIALS_NO_TEAM:
                # Clear team so it doesn't show on team page
                p["teamSlug"] = ""  # team-page query filters on this
        actions.append({"id": pid, "op": "set-special", "no_team": pid in SPECIALS_NO_TEAM})
        stats["set-special"] += 1

    # Apply deletions
    if commit:
        before = len(products)
        products[:] = [p for p in products if p["id"] not in DELETIONS]
        after = len(products)
        if after < before:
            stats["deleted"] = before - after
    else:
        for pid in DELETIONS:
            stats["delete (planned)"] += 1

    # Print summary
    print("\n=== Stats ===")
    for k, v in stats.most_common():
        print(f"  {v:>4}  {k}")

    print("\n=== Sample actions (first 30) ===")
    for a in actions[:30]:
        print(" ", a)

    # Save commit
    if commit:
        DATA.write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\n✓ Wrote {DATA}")
    else:
        print("\n(dry run — pass --commit to write)")


if __name__ == "__main__":
    main(commit="--commit" in sys.argv)
