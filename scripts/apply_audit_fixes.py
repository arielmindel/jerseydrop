#!/usr/bin/env python3
"""
Reads aggregated visual-audit results from docs/audit_results/batch_*.json
and applies the recommended fixes to data/sporthub-products.json.

Recommendations handled:
  - swap                  → reverse images[] order
  - remove-image-N        → drop image at index N
  - keep-only-image-N     → keep only image N
  - all-bad               → set imageQuality:low (re-hide)
  - ok / needs-back-view  → ignored (no change)

Run:
  python3 scripts/apply_audit_fixes.py            # dry run
  python3 scripts/apply_audit_fixes.py --commit   # write changes
"""
import glob
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "sporthub-products.json"


def main(commit: bool):
    products = json.loads(DATA.read_text(encoding="utf-8"))
    by_id = {p["id"]: p for p in products}

    results = []
    for f in sorted(glob.glob(str(ROOT / "docs/audit_results/batch_*.json"))):
        try:
            d = json.loads(Path(f).read_text())
            results.extend(d.get("results", []))
        except Exception as e:
            print(f"  WARN {f}: {e}")

    print(f"Loaded {len(results)} audit results")

    stats = Counter()
    actions_applied = []

    for r in results:
        pid = r["id"]
        rec = r.get("recommendation", "ok")
        p = by_id.get(pid)
        if not p:
            stats["product-not-found"] += 1
            continue

        if rec in ("ok", "needs-back-view", "needs-front-view"):
            stats[rec] += 1
            continue

        old_imgs = list(p.get("images", []))

        if rec == "swap":
            new_imgs = list(reversed(old_imgs))
        elif rec.startswith("remove-image-"):
            idx = int(rec.rsplit("-", 1)[-1])
            if idx < 0 or idx >= len(old_imgs):
                stats[f"{rec}-bad-index"] += 1
                continue
            new_imgs = [img for i, img in enumerate(old_imgs) if i != idx]
        elif rec.startswith("keep-only-image-"):
            idx = int(rec.rsplit("-", 1)[-1])
            if idx < 0 or idx >= len(old_imgs):
                stats[f"{rec}-bad-index"] += 1
                continue
            new_imgs = [old_imgs[idx]]
        elif rec == "all-bad":
            # SKIP — agent classification of "all-bad" has too many false positives.
            # User reviews these manually.
            stats["all-bad-skip-needs-review"] += 1
            continue
        else:
            stats[f"unknown-rec:{rec}"] += 1
            continue

        if commit:
            p["images"] = new_imgs
            p["primaryImage"] = new_imgs[0] if new_imgs else ""
            if not new_imgs:
                # No images left — re-hide so it doesn't show broken
                p["imageQuality"] = "low"

        stats[rec] += 1
        actions_applied.append({
            "id": pid,
            "name": r.get("name", "")[:40],
            "rec": rec,
            "before": old_imgs,
            "after": new_imgs,
            "reasoning": r.get("reasoning", "")[:100],
        })

    # Print summary
    print("\n=== Stats ===")
    for k, v in stats.most_common():
        print(f"  {v:>4}  {k}")

    print(f"\n=== Actions ({len(actions_applied)}) ===")
    for a in actions_applied:
        print(f"  {a['id']}  {a['rec']}  '{a.get('name','')}'")
        if a.get("reasoning"):
            print(f"      → {a['reasoning']}")

    if commit:
        DATA.write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\n✓ Wrote {DATA}")
    else:
        print("\n(dry run — pass --commit to write)")


if __name__ == "__main__":
    main(commit="--commit" in sys.argv)
