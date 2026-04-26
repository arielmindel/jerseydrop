# JerseyDrop — Claude Code Prompt V2 (Big Catalog Update)

Paste the prompt below into Claude Code in the JerseyDrop project. This expands the site to handle 995 products with proper search, filters, pagination, and lazy loading.

---

## THE PROMPT

```
=== CONTEXT ===

Major update: JerseyDrop now has a real product catalog with 995 products imported from a supplier (sporthubkit.com — owner gave us permission, he's exiting the market). The catalog has been pre-built and saved to:

  /data/sporthub-products.json   (995 products, structured for our site)
  /data/catalog-stats.json       (aggregate stats: categories, leagues, top teams)

Product images are served from **Shopify's CDN** (cdn.shopify.com) — NOT from /public. This keeps the build lean (1.2GB of images would crash Vercel deployments). Each product has:

  - `images: string[]`        → full Shopify CDN URLs, ready to use as <img src>
  - `imagesLocal: string[]`   → backup filenames (don't use yet — files exist in /supplier-images/sporthub-product-images/ as a backup, will migrate to our own CDN later if Shopify host goes down)

CRITICAL: Add `cdn.shopify.com` to `next.config.mjs` images.remotePatterns so Next/Image can optimize them:

```js
// next.config.mjs
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/**' }
    ]
  }
}
```

Use the URLs from `images[]` directly with Next/Image:

```tsx
<Image src={product.images[0]} alt={product.nameHe} width={600} height={800} />
```

ALL PRICES IN THE JSON ARE NULL by design. The owner (Ariel) will set prices manually after launch. Display "מחיר בקרוב" or hide the price chip when price is null. Do NOT auto-generate prices.

=== WHAT TO BUILD (additive to existing site) ===

The original prompt designed the site for ~25 products. With 995 products, we need a much more capable browse/search experience. Add these features WITHOUT regressing existing functionality.

1. PRODUCTS DATA LAYER

Replace the placeholder products.json reference. Read from /data/sporthub-products.json. The shape is:

type Product = {
  id: string                    // shopify-style numeric id
  sourceHandle: string          // for reference / future re-fetch
  sourceUrl: string             // sporthub URL (don't link out, internal use only)
  slug: string                  // OUR slug for /products/[slug]
  nameHe: string                // Hebrew title (visible to users)
  nameEn: string                // optional English (sometimes empty)
  category: 'national' | 'club'
  league: 'premier-league' | 'la-liga' | 'serie-a' | 'bundesliga' | 'ligue-1' | 'other' | 'israel' | 'tier-1' | 'tier-2' | 'tier-3'
  team: string                  // Hebrew team name
  teamSlug: string              // url-safe English slug for team
  season: string | null         // "2025-26", "2010", etc.
  type: 'home' | 'away' | 'third' | 'goalkeeper' | 'special' | 'retro'
  isRetro: boolean
  isKids: boolean
  isWorldCup2026: boolean
  isSpecial: boolean
  isLongSleeve: boolean
  priceFan: number | null       // ALWAYS null for now (user fills in)
  pricePlayer: number | null    // ALWAYS null for now
  priceRetro: number | null
  originalPrice: number | null
  sizes: string[]               // sizes from variants (S, M, L, etc.)
  images: string[]              // full Shopify CDN URLs (use directly with Next/Image)
  imagesLocal: string[]         // backup filenames (don't use yet — for future CDN migration)
  tags: string[]                // raw tags from supplier
  description: string           // body html (truncated, may include HTML)
  stock: 'in-stock' | 'low' | 'preorder'
  sourcePriceMin: number | null  // INTERNAL — never show on site
  sourcePriceMax: number | null  // INTERNAL — never show on site
}

Add helper functions in /lib/products.ts:
- getAllProducts() → reads JSON
- getProductBySlug(slug)
- getProductsByLeague(leagueSlug)
- getProductsByTeam(teamSlug)
- searchProducts(query, filters) — see search section below

2. PRICE DISPLAY LOGIC

When priceFan is null AND pricePlayer is null AND priceRetro is null:
- Show small badge: "מחיר בקרוב" (in muted text-neutral-400, no green)
- DO NOT show "0 ₪" or any zero — that looks broken
- Add-to-cart button shows "הזמנה — צור קשר" instead of normal CTA, links to WhatsApp with the product name pre-filled

When prices ARE set (later, after Ariel fills them in):
- Show the standard pricing UI (Fan/Player toggle, etc.)
- "הוספה לסל" works normally

This dual mode lets the site go live before pricing is finalized.

3. SEARCH (CRITICAL)

Add /app/(shop)/search/page.tsx and a search bar in the Header.

Search bar in Header:
- Replaces the static title — appears between logo and nav
- Placeholder: "חפש חולצה, מועדון, נבחרת..."
- On submit (Enter or icon click) → /search?q={query}
- On desktop: shows recent searches dropdown (use localStorage)

Search page (/search?q=...):
- Searches across: nameHe, nameEn, team, league, season, tags
- Hebrew normalization: case-insensitive, ignores ", ', - characters, handles common spelling variants ("מנצסטר" / "מנצ'סטר" / "manchester" all match the same)
- Shows results in the same product grid layout as the listing page
- If 0 results: show "לא נמצאו תוצאות עבור [query]" + "נסה: ארגנטינה, ברצלונה, ריאל מדריד..."
- URL is shareable (server-side render the page)

Implementation: build a client-side searchable index using Fuse.js or a custom Hebrew-aware fuzzy matcher. The dataset is small (~1MB after compression) so client-side is fine. Pre-compute search tokens at build time.

4. FILTERS — UPGRADED

The /products page filters need to handle 995 products. Required filters:

- Category: National / Club / Retro / Kids / Special / Israeli (multi-select)
- League: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Other, Israel (multi-select, only relevant when category=Club)
- Tier (for Nationals): Tier 1 / Tier 2 / Tier 3 (multi-select, only relevant when category=National)
- Team: searchable dropdown (auto-complete from team list)
- Season: 2025-26, 2024-25, 2023-24, retro pre-2020 (multi-select)
- Type: Home / Away / Third / Goalkeeper / Special / Retro
- Long Sleeve: yes/no
- Kids size: yes/no
- Price: range slider (only enabled when prices have been set)

Filter UI:
- Desktop: collapsible sidebar on the right (RTL), filters stay visible while scrolling
- Mobile: bottom sheet drawer triggered by a "סינון" button at the top of the grid
- Show count of active filters as a badge
- "נקה הכל" button to reset
- All filters update URL searchParams (so the page is shareable)

5. PAGINATION / INFINITE SCROLL

Don't render all 995 products at once. Choose ONE approach:

OPTION A (preferred): Infinite scroll
- Initial render: 24 products
- IntersectionObserver triggers loading next 24 when user scrolls near the bottom
- Show "טוען..." spinner while loading
- After all loaded: show "זה הכל. ראית את כל המוצרים."

OPTION B (fallback): Numbered pagination
- 48 per page
- Page numbers at the bottom (1, 2, 3, ..., 21)
- ?page=2 in URL

Pick Option A for best UX. Build it cleanly.

6. PERFORMANCE — IMAGES

Use Next.js <Image> component for ALL product images. Configure:

- next.config.mjs: REQUIRED — add `images.remotePatterns: [{ protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/**' }]`
- ProductCard: `<Image src={product.images[0]} alt={product.nameHe} width={400} height={500} loading="lazy" />` — pass URL directly
- Hero image and above-the-fold: priority={true}
- Generate blur placeholder via `placeholder="blur"` with a base64 data URL

7. NEW PAGES

Add these dedicated category pages:

- /israeli — "ישראל — חולצות מקומיות". Hero with Israeli flag accent. Lists all 47 products tagged 'israel'.
- /kids — "ילדים". Hero with playful design. Lists all 96 kids products.
- /retro — "רטרו — קלאסיקות". Already in original prompt, but ensure it shows all 365 retro products.

Update homepage:
- Add "מועדפים בישראל" section with Hapoel Tel Aviv + Maccabi Tel Aviv featured (huge for IL market!)
- Update featured products to use real top sellers from the catalog

8. PRODUCT DETAIL PAGE — UPDATES

The product detail page should:
- Show all images in the gallery (not just one)
- For products with isWorldCup2026 = true: show a "מונדיאל 2026" gold badge near the title
- For products with isLongSleeve = true: show "שרוול ארוך" badge
- For Kids: show "ילדים" badge
- The customization section (name + number) — keep the live preview feature
- Below the description, show "מוצרים דומים" carousel: products from same team or same league

9. URL STRUCTURE — UPDATED

Make sure these all work:
- /products → all products with filters
- /products/[slug] → individual product
- /leagues → leagues overview
- /leagues/premier-league
- /leagues/la-liga
- /leagues/serie-a
- /leagues/bundesliga
- /leagues/ligue-1
- /leagues/other
- /leagues/israel  (NEW)
- /nations → tiers overview
- /nations/[teamSlug] → e.g. /nations/argentina
- /retro → all retro
- /kids → all kids (NEW)
- /israeli → all Israeli (NEW)
- /search?q=...

10. SEO

Update sitemap.ts to include all 995 product URLs + category pages. Add structured data (schema.org Product) on each detail page.

=== CHECKPOINTS ===

After each major piece, commit with a clear message:

1. "feat: switch products data source to sporthub-products.json with 995 items"
2. "feat: dual price display — show 'מחיר בקרוב' when null, WhatsApp CTA"
3. "feat: search bar in header + /search page with Hebrew-aware fuzzy matching"
4. "feat: upgraded filters (category, league, tier, team, season, type, long-sleeve, kids)"
5. "feat: infinite scroll on /products page"
6. "perf: Next/Image lazy loading for all product cards + blur placeholder"
7. "feat: /israeli page (47 products), /kids page (96 products)"
8. "feat: real top-sellers in homepage featured grid"
9. "feat: WC2026/LongSleeve/Kids badges on product detail page"
10. "chore: sitemap with all 995 product URLs + structured data"

After each step, tell me what was done and any decisions you made before moving to the next.

=== NOTES ===

- IMPORTANT: never display sourcePriceMin / sourcePriceMax. They are internal reference values from the supplier. They should never appear in the UI.
- Don't link to sporthub URLs anywhere. They're internal.
- Image filenames in JSON look like "ארגנטינה-בית-2026__00.jpg" (Hebrew slug + index). The Hebrew is fine — Next.js handles it. Just URL-encode when needed.
- Some products have empty sizes arrays — handle gracefully (show "מידה אחת" or hide size selector)
- Some products have description with HTML — sanitize before rendering
- Sometimes nameEn is empty — fall back to nameHe everywhere

Start with checkpoint 1 (switch data source). Confirm understanding before installing anything new.
```
