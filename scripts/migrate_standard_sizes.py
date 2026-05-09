#!/usr/bin/env python3
"""
V7 size standardization: rebuild every product.sizes array.

Rules:
  - Kids products (priceTier == 'kids-set' OR isKids == true)
    → ["16", "18", "20", "22", "24", "26", "28"]
  - All other products
    → ["S", "M", "L", "XL", "XXL"]

Strips legacy junk values: "Default Title", "כן", "ילדים",
"ילדים (שירות הלקוחות יצור קשר לתאיום מידה)", "16 - גיל 2", etc.

Run AFTER migrate_tiered_pricing.py (depends on priceTier being set).

  python3 scripts/migrate_standard_sizes.py
"""

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "sporthub-products.json"

ADULT_SIZES = ["S", "M", "L", "XL", "XXL"]
KIDS_SIZES = ["16", "18", "20", "22", "24", "26", "28"]


def is_kids(p) -> bool:
    return p.get("priceTier") == "kids-set" or p.get("isKids") is True


def main():
    products = json.loads(DATA.read_text(encoding="utf-8"))

    # Snapshot of how messy the old sizes were, for the commit log
    pre = Counter()
    for p in products:
        for s in p.get("sizes") or []:
            pre[s] += 1

    counter = Counter()
    for p in products:
        if is_kids(p):
            p["sizes"] = list(KIDS_SIZES)
            counter["kids"] += 1
        else:
            p["sizes"] = list(ADULT_SIZES)
            counter["adult"] += 1

    DATA.write_text(
        json.dumps(products, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"Total products: {len(products)}")
    print(f"  Adult sizes (S, M, L, XL, XXL): {counter['adult']}")
    print(f"  Kids sizes (16-28):              {counter['kids']}")

    print("\nLegacy size values that were replaced (top 25 by frequency):")
    for v, n in pre.most_common(25):
        marker = "✓" if v in set(ADULT_SIZES + KIDS_SIZES) else "✗"
        print(f"  {marker} {n:>5}  '{v[:60]}'")


if __name__ == "__main__":
    main()
