# JerseyDrop — Live Site Audit (Customer-Perspective)

**Site audited:** https://jerseydrop.vercel.app
**Audit date:** 2026-05-03
**Method:** Server-side HTML inspection via `curl` (40+ pages: home, all collections, 10 teams, 10 nations, 5 leagues, 5 static pages, 3 search variants, 15 random products, plus mobile UA fetch, robots/sitemap/OG image, 404 page, favicon).

---

## Summary

| Severity | Count |
|---|---|
| BLOCKER | 4 |
| HIGH | 6 |
| MEDIUM | 5 |
| LOW | 6 |

### Top issues a real customer would hit
1. **33 product cards link to dead 404 pages** (e.g. `/products/copy-of-`, `/products/2024-`, `/products/1993-`) — visible across home’s "כל החולצות", retro page, retro-90s, special, long-sleeve, short-suit, and most popular team pages (Arsenal, Real Madrid, Barcelona, Liverpool, Inter Miami, Borussia Dortmund, Ajax, Manchester United, Al-Nassr).
2. **WhatsApp icon in the footer (every page) and the main WhatsApp card on `/contact`** point to `https://wa.me/972000000000` — a placeholder all-zeros number. Customers clicking the most prominent WhatsApp CTA on the contact page get a broken link.
3. **OG image (`/opengraph-image`) is a 0-byte response** — every page links to it for social sharing. Sharing any JerseyDrop URL on WhatsApp / Facebook / Twitter shows no preview image.
4. **Premier League page lists 3 teams that aren’t in the 2025/26 Premier League**: Leicester City (relegated), Sheffield United (Championship), Derby County (Championship). Looks unprofessional for the headline league.

### Headline SEO bug (not customer-visible but kills traffic)
- **Every non-product page sets `<link rel="canonical" href="https://jerseydrop.vercel.app">`** — i.e. `/teams/arsenal`, `/about`, `/nations/portugal`, etc., all canonicalise to the homepage. Google will deindex the entire team / nation / league / static catalogue.

---

## Detailed findings

### BLOCKER

#### B1. 33 product slugs return 404 but are still linked from major listing pages
- **Evidence:** All listing pages (collection / team / catalogue) are crawled and their `/products/...` href list extracted. 33 unique slugs are linked but every one returns HTTP 404 with the homepage `<title>`:
  ```
  /products/1993-, 1994-, 1995-, 1996-, 1997-, 2-, 2000-, 2001-, 2002-,
  2005-, 2006-, 2007-, 2008-09-, 2009-, 2010-, 2012-, 2014-, 2017-18-,
  2019-, 2020, 2023-, 2024-, 2024-25-, 2025-26-, copy-of-, copy-of-1980-,
  copy-of-1994-95-, copy-of-2-, copy-of-2003-04-, copy-of-2022-, copy-of-2023-,
  copy-of-2024-, 2 (single-digit)
  ```
- **Source pages where customers will hit them:**
  - `/products` (catalogue) — 33 broken links
  - `/retro` — 25 broken links (over half the page)
  - `/collections/retro-90s` — 8 broken links
  - `/collections/special` — 6 broken links
  - `/collections/long-sleeve` — 3 broken links
  - `/collections/short-suit` — 2 broken links
  - `/teams/arsenal`, `/teams/real-madrid`, `/teams/barcelona`, `/teams/liverpool`, `/teams/inter-miami`, `/teams/manchester-united`, `/teams/al-nassr`, `/teams/borussia-dortmund`, `/teams/ajax` — at least one each
- **Why it matters:** A customer browsing the retro page literally can’t click on more than half the products. Even the catalogue (`/products`) is full of dead cards.
- **Suggested fix:** Filter the catalog data so any product whose slug starts with `copy-of-`, is purely numeric, or ends in a trailing dash, is excluded from listing pages and not rendered as a `<Link>`. Better: clean the source data (these look like leftover Shopify "Copy of …" handles where the original name became empty).

#### B2. WhatsApp footer/contact CTA is a placeholder number (`972000000000`)
- **Evidence:** Every page contains:
  ```html
  <a href="https://wa.me/972000000000" aria-label="WhatsApp" …>
  ```
  in the footer icon strip. The `/contact` page also uses this number for the **main WhatsApp card** (the first/largest "talk to us" CTA in the contact grid), not just the footer icon.
- **Confirmed pages:** all 40 sampled pages (home, every collection, every team, every nation, every league, about, contact, privacy, terms, size-guide, search).
- **Note:** the floating green WhatsApp bubble at the bottom-right and the per-product "בקש מחיר/זמינות" link both correctly use `wa.me/972533936304` (real number). So the business is reachable — but customers who click the obvious footer icon or the top-of-contact card get a dead link.
- **Suggested fix:** Search-and-replace `972000000000` → `972533936304` (or whatever the real business number is). One-line config change in whatever component renders the footer + the contact `WhatsAppCard`.

#### B3. OG image is 0 bytes — no social share previews work
- **URL:** `https://jerseydrop.vercel.app/opengraph-image` (referenced from every page’s `<meta property="og:image">` and `<meta name="twitter:image">`).
- **Response:** HTTP 200, `Content-Type: image/png`, **`Content-Length: 0`** (verified with multiple cache-buster query strings).
- **Why it matters:** WhatsApp / Facebook / Telegram / Twitter / Slack all need a non-empty image for the link preview. With 0 bytes, the share looks empty and unprofessional. Major loss for organic Israeli WhatsApp word-of-mouth marketing.
- **Suggested fix:** Re-deploy. The `app/opengraph-image.tsx` (or static `opengraph-image.png`) is either failing to render or the file is missing in the build. Check Next.js build logs and the file in `src/app/`. Fastest workaround: drop a static `public/og-image.jpg` and reference it via metadata.

#### B4. Premier League page contains 3 teams that aren’t in the 2025/26 Premier League
- **URL:** `/leagues/premier-league`
- **Found teams:** 22 listed including `derby-county`, `sheffield-united`, `leicester-city`. Leicester was relegated end of 24/25; Sheffield United and Derby County are Championship clubs.
- **Why it matters:** First impression for a UK-football-focused customer is that the catalog is out of date. The page also has 22 teams which is more than the 20-team league.
- **Suggested fix:** Move Leicester / Sheffield United / Derby County to a "Championship" section or just remove from the EPL listing. If you keep them because you stock the jerseys, make a separate `/leagues/championship` page.

---

### HIGH

#### H1. Every non-product page canonicalises to the homepage
- **Evidence:** `home.html`, `team-arsenal.html`, `nation-argentina.html`, `league-premier-league.html`, `static-about.html`, every collection page — all contain literally `<link rel="canonical" href="https://jerseydrop.vercel.app"/>`. Only `/products/<slug>` pages have correct per-URL canonicals.
- **Why it matters:** Google will treat the entire team/nation/league/collection/static catalogue as duplicates of the homepage and deindex them. This will hide the bulk of the SEO surface (teams + nations are the high-intent buyer pages).
- **Suggested fix:** In whatever generates `<head>` metadata (Next.js `generateMetadata` or a layout), use the actual page URL — e.g. `alternates: { canonical: pathname }` per route, instead of a constant.

#### H2. WebSite SearchAction in JSON-LD points to a URL that doesn’t actually search
- **JSON-LD on every page:**
  ```json
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://jerseydrop.vercel.app/products?q={search_term_string}"
  }
  ```
- **Reality:** `/products?q=arsenal` returns the same content as `/products` (no filtering). The actual search is at `/search?q=…`.
- **Why it matters:** Google Sitelinks Searchbox feature won’t work, and the structured data is misleading.
- **Suggested fix:** Either implement query filtering on `/products` or change the target to `https://jerseydrop.vercel.app/search?q={search_term_string}`.

#### H3. Product JSON-LD missing `offers` (no Google rich-result eligibility)
- **All 14 valid product pages tested have zero `offers` in the Product JSON-LD.** Sample (`/products/liverpool-home-2026-27`):
  ```json
  {"@type":"Product","name":"…","sku":"…","image":[…],"description":"…","brand":{…},"category":"Club Jersey"}
  ```
- **Why it matters:** Google requires at least `offers.price` (or `priceSpecification`) plus `availability` for product rich results. Without it, no price-snippet in SERP. Note the business model is "ask via WhatsApp", but you can still emit `availability: PreOrder` and `priceSpecification: TBD` or use a contact-for-quote pattern.
- **Suggested fix:** Add an `offers` object even when price is "TBD" — set `availability: https://schema.org/PreOrder` and `priceCurrency: ILS`, with `url` pointing at the WhatsApp CTA.

#### H4. Product JSON-LD `image` URLs are relative paths
- **All 14 product pages** emit:
  ```json
  "image":["/images/products-clean/yp-fan-1-31-0.webp", "/images/products-clean/yp-fan-1-31-1.webp"]
  ```
- **Why it matters:** Schema.org requires absolute URLs for `image`. Google ignores relative paths.
- **Suggested fix:** Prefix with `https://jerseydrop.vercel.app` when emitting the JSON-LD.

#### H5. Product page `<h1>` is just the team name, not the product name
- **Example:** `/products/liverpool-home-2026-27` — `<h1>` is `ליברפול`, but the JSON-LD `name` and the `<title>` are `26-27 אדום ליברפול בית` / `ליברפול · 2026-27`. Same on every product I tested.
- **Why it matters:** SEO + UX. Users land on a product page and see only "ליברפול" as the headline; SEO loses the long-tail product-name targeting; it also creates many product pages with identical H1s (e.g. dozens of Liverpool products all have H1 "ליברפול"), hurting on-page relevance.
- **Suggested fix:** Render the actual product name (with team subtitle below) as the H1.

#### H6. Multiple products share identical `<title>` tags — duplicate-content issue
- **Example identical titles:**
  - `מנצ׳סטר יונייטד | JerseyDrop` — used by `/products/manchester-united-home-kids-847186` and `/products/manchester-united-retro-long-sleeve-retro-432530` (and many more).
  - `מקסיקו | JerseyDrop` — `/products/mexico-away` and others.
  - `גרמניה | JerseyDrop` — `/products/germany-home-541778`, `/products/germany-retro-retro-242066`, …
- **Why it matters:** Google deduplicates identical-title URLs in search and may pick one canonical, dropping the rest.
- **Suggested fix:** Build the title from the season + variant + team, e.g. `2026/27 בית · ליברפול | JerseyDrop` (some Liverpool products do this — but many like `germany-home-541778` get only the team name).

---

### MEDIUM

#### M1. Home page has no `<h1>` element
- **Verified:** `home.html` has zero `<h1>` tags. First heading is `<h2>ליגות`.
- **Why it matters:** Every other page has an H1; the homepage missing one is a minor SEO + accessibility regression.
- **Suggested fix:** Add a visually-styled or visually-hidden `<h1>` such as "JerseyDrop — חולצות כדורגל רשמיות".

#### M2. `/size-guide` has the homepage’s default `<title>` instead of its own
- `static-size-guide.html` `<title>`: `JerseyDrop — חולצות כדורגל רשמיות | מונדיאל 2026` (same as `/`). The `<h1>` correctly says "מדריך מידות". `/about`, `/contact`, `/privacy`, `/terms` all have unique titles — only `/size-guide` is wrong.
- **Suggested fix:** Add `export const metadata = { title: "מדריך מידות | JerseyDrop" }` to `app/size-guide/page.tsx` (or whatever the file is).

#### M3. 404 page has the homepage’s default `<title>`
- A request to e.g. `/this-doesnt-exist` returns HTTP 404 and a nice H1 ("נראה שהדף הזה לא במגרש"), but the `<title>` is `JerseyDrop — חולצות כדורגל רשמיות | מונדיאל 2026`.
- **Suggested fix:** In `app/not-found.tsx` set `metadata.title = "404 — הדף לא נמצא | JerseyDrop"`.

#### M4. `/teams` index page returns 404
- `/leagues` and `/nations` work as catalog indexes, but `/teams` returns 404. If a user (or a bot) trims a URL to discover an index, they hit the not-found page.
- **Suggested fix:** Either build a `/teams` index or 301-redirect `/teams` → `/leagues` (or `/products`).

#### M5. `/products?q=…` doesn’t actually filter
- Visiting `/products?q=arsenal` returns the same 59 products as `/products` (no filter applied). The search UI on the site uses `/search?q=…` which works correctly. So `/products?q=…` is silent / dead.
- **Why it matters:** Linked from JSON-LD SearchAction (H2). External tools / bots that try `/products?q=foo` see un-filtered results — bad data.
- **Suggested fix:** Either implement the filter on `/products` or 301 to `/search?q=…`.

---

### LOW

#### L1. Catalog gaps make some league pages look thin
- **Bundesliga:** 10 teams (real league has ~18). Missing Hoffenheim, Mainz, Augsburg, Köln, Hamburg, etc.
- **Serie A:** 9 teams. Missing Lazio, Atalanta, Bologna, Torino, Genoa, Cagliari, Sassuolo, etc.
- **Ligue 1:** only 4 teams — PSG, Marseille, Lyon, Nice. Missing Lille, Monaco, Lens, Rennes, Nantes, Strasbourg, Brest, etc.
- **Why it matters:** Customers expect to find their team. Showing only PSG / Marseille / Lyon / Nice for "Ligue 1" looks barebones. May be intentional (small inventory) — note as MEDIUM if a Ligue-1 fan would bounce.
- **Suggested fix:** Either (a) add a "more coming soon — request a team" CTA, (b) hide the league page if you don’t actually stock most teams, or (c) populate.

#### L2. `/favicon.ico` returns 404
- All modern browsers automatically request `/favicon.ico` regardless of the `<link rel="icon">` tag. Returns 404 (you serve `/logo/favicon-32.png` etc. instead). Customer’s browser console shows a 404 noise; no visible icon impact.
- **Suggested fix:** Add a `public/favicon.ico` or rewrite `/favicon.ico` to `/logo/favicon-32.png`.

#### L3. Slug-to-season parsing produces oddities (e.g. `/products/arsenal-away-2092-94`)
- Some retro slugs encode `92-94` as `2092-94` — page title becomes `ארסנל · 2092-94 | JerseyDrop`. Page resolves (200) and content is correct, but the URL/title shows year 2092.
- Other examples: `/products/arsenal-home-0506` (intended 05/06), `/products/arsenal-home-129298` (mystery digits).
- **Suggested fix:** When generating slugs from old data, detect 2-digit year pairs and either prefix `19`/`20` correctly or just keep `92-94` raw. Backfill bad slugs with a redirect map.

#### L4. Search tokenizer matches substrings — `lecce` returns 3 Leicester results
- `/search?q=lecce` returns 6 results; 3 are actually Leicester City (because "lecce" ⊂ "leicester"). 1 of the 6 is the broken slug `/products/2024-25-`.
- **Suggested fix:** Use word-boundary matching, or rank exact-word matches above substring matches.

#### L5. Nation page titles don’t include shirt count (inconsistent with team pages)
- Team pages: `ארסנל — 60 חולצות | JerseyDrop`.
- Nation pages: `ארגנטינה · Argentina | JerseyDrop` (no count).
- League pages: `בונדסליגה · Bundesliga — קבוצות וחולצות | JerseyDrop` (still no count).
- Minor inconsistency. The team-page format is best.
- **Suggested fix:** Add count to nations / leagues for SEO consistency.

#### L6. `Surprise` (`/collections/surprise`) page lists zero products by design — confirm intentional
- The page is a "Mystery Drop" landing — users WhatsApp to order. Content explains the model clearly. Listed here only so you don’t mistake the empty product grid for a bug.
- **No action needed.**

---

## Things checked that are FINE

- HTTP status: every URL except `/teams/dortmund` (correct slug is `/teams/borussia-dortmund`) and `/teams` returns 200.
- `lang="he" dir="rtl"` set on every page; Hebrew renders correctly (no mojibake; `U+FFFD` count = 0; no Latin-1 corruption).
- Mobile UA (`iPhone Safari`) returns the same HTML as desktop with `<meta name="viewport" content="width=device-width, initial-scale=1">` set. Responsive Tailwind classes (`md:`/`lg:`) used throughout.
- All `<img>` tags have non-empty `alt` text (sampled across 7 high-traffic pages, ~150 images).
- Sitemap (`/sitemap.xml`) is well-formed, 1665 URLs, includes only valid product slugs (the 33 bad ones are correctly excluded — the bug is purely on the listing pages).
- `robots.txt` is permissive (allows all), explicitly allows GPTBot / ClaudeBot / PerplexityBot etc., disallows `/checkout` and `/api/`. References sitemap correctly.
- 404 page has a friendly H1 ("נראה שהדף הזה לא במגרש") and serves HTTP 404 (not 200, which would be a soft-404 trap).
- Floating WhatsApp chat bubble (`972533936304`) and per-product "בקש מחיר/זמינות" CTA both work and pre-fill the product name in the WA message.
- `/search` works with both Hebrew (`q=ארסנל` → 25 valid Arsenal results) and English (`q=lecce` → 6 results).
- Static pages `/about`, `/contact`, `/privacy`, `/terms`, `/size-guide` all have meaningful content and unique H1s (only the size-guide title is wrong, see M2).
- Featured-product cards on the home page (8 of them) all link to valid product URLs.
- Image assets load (`/images/hero/hero-banner.jpg`, `/logo/logo-256.png`, `/images/leagues/*.jpg`, `/images/products-clean/*.webp` — sampled, all 200).
- JSON-LD `Organization`, `WebSite`, `BreadcrumbList`, `Product` are all present on the appropriate pages (subject to the bugs in H2/H3/H4).

---

## Recommendations (in priority order)

1. **Today (1 hour total):**
   - Replace the placeholder WhatsApp number `972000000000` → real number, site-wide. (B2)
   - Fix the canonical-URL constant so each page emits its own canonical. (H1)
   - Fix or replace the OG image. (B3)
   - Remove Leicester / Sheffield United / Derby County from `/leagues/premier-league`. (B4)

2. **This week:**
   - Filter the catalog data to drop entries with garbage slugs (`copy-of-`, ends-in-dash, purely numeric). 33 broken cards on listing pages. (B1)
   - Fix product-page H1 to be the product name, not the team name. (H5)
   - Add `offers` block + absolute image URLs to product JSON-LD. (H3, H4)
   - Add titles to `/size-guide` (M2), 404 page (M3), and either fix or redirect `/teams` (M4) and `/products?q=…` (M5).
   - Add `<h1>` to the homepage. (M1)

3. **Backlog:**
   - Rebuild slug → product map to fix oddities like `arsenal-away-2092-94` → `arsenal-away-92-94`, with 301s from old slugs. (L3)
   - Use word-boundary search to stop "lecce" returning Leicester. (L4)
   - Add shirt-count to nation/league titles. (L5)
   - Either populate Bundesliga / Serie A / Ligue 1 team rosters or trim the league pages to the teams you actually stock. (L1)
   - Add `/favicon.ico`. (L2)
