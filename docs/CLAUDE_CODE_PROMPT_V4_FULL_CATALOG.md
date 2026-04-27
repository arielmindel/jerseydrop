# JerseyDrop V4 — Full Supplier Catalog Integration

Paste the prompt below into Claude Code. The user wants ALL 1,642 supplier items integrated into the site with clean, navigable categorization.

---

## THE PROMPT

```
=== EXPAND CATALOG TO FULL SUPPLIER INVENTORY (1,642 ITEMS) ===

Two new files have been added:

1) /data/yupoo-supplier-translated.json — 1,642 album titles from supplier's wholesale Yupoo catalogs. Each entry:
   {
     "catalog": "player-1" | "player-2" | "fan-1" | "fan-2" | "fan-3" | "short-suit" | "retro",
     "cn": "Chinese original title",
     "he": "Hebrew auto-translation (incomplete — improve as you go)",
     "season": "2025-26" | "2010" | null
   }

2) /data/supplier-comparison-report.md — Comparison vs current 983-product catalog

=== GOAL ===

Grow the live catalog from 983 to ~1,500 products by integrating supplier inventory. The user's #1 concern is that **the navigation must stay clean and intuitive** even with 1,500 products. Don't just dump items into one big grid — organize them properly.

=== STEP 1: MERGE INTO products.json ===

For each of the 1,642 supplier albums:
1. Try to match an existing product in /data/sporthub-products.json by team + season + type. Be flexible with Hebrew spellings:
   - "פריס" ≡ "פריז" (PSG)
   - "טוטהנאם" ≡ "טוטנהאם" (Tottenham)
   - "מנצסטר יוניטד" ≡ "מנצ'סטר יונייטד" ≡ "מנצ'סטר יוניטד"
   - "באירן" ≡ "באיירן"
   If matched → DON'T duplicate. Add the supplier's `cn` to the existing product as `sourceHandleCn`.
2. If NOT matched → ADD as a new product with:
   - id: "yupoo-{catalog}-{index}"
   - slug: generated from translated Hebrew (URL-safe)
   - nameHe: improve the auto-translation (replace residual Chinese characters with proper Hebrew)
   - nameEn: empty (skip)
   - category: 'club' | 'national' (best guess from team name)
   - league: map team to its league using existing logic
   - team / teamSlug: extracted from title
   - season: from `season` field
   - type: 'home' | 'away' | 'third' | 'goalkeeper' | 'special' | 'retro' (best guess from Chinese keywords like 主场/客场/三/复古)
   - isRetro: catalog === "retro" OR season starts with "19" or "20" (pre-2020)
   - isKids: title contains "童" or "儿童"
   - isLongSleeve: title contains "长袖"
   - isSpecial: title contains "特别"
   - prices: ALL null (user fills later)
   - images: empty array (will be backfilled from supplier Yupoo photos in a later phase)
   - tags: include catalog source (player/fan/short-suit/retro), season, team
   - sourceHandleCn: original Chinese title
   - stock: 'in-stock'

After merge, save updated /data/sporthub-products.json. Report: "Catalog grew from 983 to X products."

=== STEP 2: REBUILD CATEGORY STRUCTURE ===

This is the user's main concern. Don't just dump items — organize.

Update the navigation MENU and category PAGES to handle 1,500 items cleanly. Required structure:

A) HEADER NAV (top-level, max 6 items):
   - דף הבית
   - ליגות (mega-menu — see below)
   - נבחרות (mega-menu — see below)
   - רטרו
   - ילדים
   - חיפוש (icon)

B) "ליגות" MEGA-MENU (on hover/click):
   Two-column dropdown:
   Column 1 — Top 5 leagues:
     - פרמייר ליג (link → /leagues/premier-league) + count "(184)"
     - לה ליגה (123)
     - סריה א (112)
     - בונדסליגה (43)
     - ליג 1 (28)
   Column 2 — Other:
     - שאר העולם (Brazilian, MLS, Dutch, Portuguese, etc.) (247)
     - ליגת העל (israel) (47)
     - "כל הליגות →" (link to /leagues)

C) "נבחרות" MEGA-MENU:
   - מובילות (Tier 1: Argentina, Brazil, Portugal, France, Spain, Germany, England) (133)
   - פופולריות (Tier 2: Netherlands, Italy, Belgium, Japan, Morocco, USA, Mexico) (49)
   - שאר העולם (Tier 3) (30)
   - "כל הנבחרות →" (link to /nations)

D) NEW CATEGORY PAGES:
   - /collections/short-suit — סטים (חולצה + מכנס) — for items where catalog === "short-suit". This is a NEW category — make a dedicated page.
   - /collections/long-sleeve — שרוול ארוך (items with isLongSleeve === true)
   - /retro — Already exists; add sub-tabs by decade: 80s / 90s / 00s / 10s

E) SECONDARY NAV (footer of header or top of /products):
   Quick filter chips — clickable mini-buttons:
   "מונדיאל 2026" | "ליגת האלופות" | "רטרו" | "ילדים" | "שרוול ארוך" | "סטים"

=== STEP 3: ENHANCED FILTERS ON /products ===

With 1,500 items, filters become CRITICAL. Update FilterSidebar:

NEW filter dimensions:
- Catalog source: Player Edition / Fan Edition / Short Suit / Retro (helps user pick "fan vs player" preference)
- Color: extract from titles (绿/红/蓝/白/黑/黄/紫/粉 = green/red/blue/white/black/yellow/purple/pink) — let user filter by jersey color
- Decade (for retro): 1980s / 1990s / 2000s / 2010s

Make sure the existing filters still work:
- Category, League, Tier, Team, Season, Type, Long Sleeve, Kids, Price (when set)

Filter UX:
- Show active filter count badge
- "נקה הכל" reset button
- Mobile: bottom sheet with sticky "החל" button at the bottom

=== STEP 4: SEARCH UPGRADE ===

The search index needs to handle Chinese-derived translations (some Hebrew in catalog will be partial because auto-translation isn't perfect). Make the search:
- Match across Hebrew tokens
- Match across season (so "1998" finds 1998 jerseys)
- Match across team aliases (פריס/פריז, יוניטד/יונייטד, etc.)
- Show inline category badges in results so user knows if a result is retro/kids/short-suit

=== STEP 5: HOMEPAGE FEATURE STRIP ===

After "הקולקציה הנמכרות ביותר" section, add a new "גלה לפי קטלוג" section:

4 large cards in a row (stack on mobile):
- "Player Edition" — premium fabric, what players actually wear (264 items)
- "Fan Edition" — daily-wear quality (784 items)
- "סטים שלמים" — חולצה + מכנס (560 items)
- "רטרו" — קלאסיקות (~400 items)

Each card → corresponding catalog filter on /products

=== STEP 6: PERFORMANCE ===

With ~1,500 products:
- Use Next/Image with proper sizing — don't render full-res for product cards
- Infinite scroll: 24 initial, 24 more per scroll
- Code-split filter components so initial page loads fast
- Pre-build static category pages where possible

=== CHECKPOINTS (commit after each) ===

1. "feat: merge 1,642 supplier albums into catalog (~1,500 products)"
2. "feat: clean mega-menu nav for leagues + nations"
3. "feat: new /collections/short-suit and /collections/long-sleeve pages"
4. "feat: retro page with decade sub-tabs"
5. "feat: secondary quick-filter chips on /products"
6. "feat: upgraded filters with catalog source + color + decade"
7. "perf: search aliases for team name variants"
8. "feat: homepage 'discover by catalog' section with 4 cards"
9. "perf: image optimization + code splitting for filters"

=== IMPORTANT ===

- Translation is best-effort. Some `he` fields will still contain Chinese characters. As you process, IMPROVE these. Use your understanding of soccer team names to fix incomplete translations.
- Some supplier teams (especially obscure ones in fan-3 catalog) may not have ANY existing JD product. That's fine — add as new products under the closest league.
- DO NOT show `sourcePriceMin/Max` or `sourceHandleCn` anywhere on the site. Internal only.
- After everything: tell me the new catalog total, biggest leagues, and any items you couldn't categorize.

Confirm understanding before installing anything new. Then proceed with checkpoint 1.
```

---

## NOTES FOR ARIEL

After Claude Code finishes, expect:
- ~1,500 products (some duplicates merged)
- Catalog organized by Player/Fan/Short-Suit/Retro alongside existing leagues/nations
- Two new pages: /collections/short-suit, /collections/long-sleeve
- Retro page divided by decade
- Cleaner mega-menu nav so 1,500 items don't feel overwhelming
- All prices STILL null — Ariel sets manually
