#!/usr/bin/env python3
"""
V7 pricing migration: replace flat 119 ₪ with 6-tier pricing.

Tier resolution order (first match wins):
  1. mystery     → 99   (nameHe contains 'בהפתעה' OR slug contains 'mystery')
  2. kids-set    → 169  (short-suit AND kids)
  3. adult-set   → 189  (short-suit AND not kids)
  4. long-sleeve → 129  (isLongSleeve, not in any set bucket above)
  5. special     → 119  (isSpecial)
  6. regular     → 109  (everything else)

Sets product.priceTier + uniform priceFan/pricePlayer/priceRetro to the
tier price. Removes originalPrice (we don't show struck-through prices).

Run:
  python3 scripts/migrate_tiered_pricing.py
"""

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "sporthub-products.json"

TIER_PRICE = {
    "mystery": 99,
    "kids-set": 169,
    "adult-set": 189,
    "long-sleeve": 129,
    "special": 119,
    "regular": 109,
}


def is_short_suit(p) -> bool:
    """True if the product is a "short-suit" — jersey + shorts combo.
    The catalog uses two parallel signals: the legacy flag isShortSuit,
    and the tag 'short-suit' on the tags[] array. Trust either."""
    if p.get("isShortSuit") is True:
        return True
    return "short-suit" in (p.get("tags") or [])


def has_kids_signal(p) -> bool:
    """True if the product is a kids product. We trust isKids first, then
    fall back to the 'ילדים' tag, then to the presence of any kids-numbered
    size value (16/18/.../28) in the existing sizes[] array."""
    if p.get("isKids") is True:
        return True
    if "ילדים" in (p.get("tags") or []):
        return True
    sizes = p.get("sizes") or []
    kids_sizes = {"16", "18", "20", "22", "24", "26", "28"}
    return any(s in kids_sizes for s in sizes)


def is_mystery(p) -> bool:
    name = (p.get("nameHe") or "")
    slug = (p.get("slug") or "")
    return "בהפתעה" in name or "mystery" in slug.lower()


def resolve_tier(p) -> str:
    if is_mystery(p):
        return "mystery"
    if is_short_suit(p):
        return "kids-set" if has_kids_signal(p) else "adult-set"
    if p.get("isLongSleeve") is True:
        return "long-sleeve"
    if p.get("isSpecial") is True:
        return "special"
    return "regular"


def main():
    products = json.loads(DATA.read_text(encoding="utf-8"))
    counter = Counter()
    for p in products:
        tier = resolve_tier(p)
        price = TIER_PRICE[tier]
        p["priceTier"] = tier
        p["priceFan"] = price
        p["pricePlayer"] = price
        p["priceRetro"] = price
        if "originalPrice" in p:
            del p["originalPrice"]
        counter[tier] += 1

    DATA.write_text(
        json.dumps(products, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"Total products: {len(products)}")
    print("Tier distribution:")
    for tier in ["regular", "long-sleeve", "adult-set", "kids-set", "special", "mystery"]:
        print(f"  {tier:12} → {TIER_PRICE[tier]:>3} ₪  · {counter[tier]:>4} products")
    total = sum(counter.values())
    print(f"  {'sum':12} →       · {total:>4}")


if __name__ == "__main__":
    main()
