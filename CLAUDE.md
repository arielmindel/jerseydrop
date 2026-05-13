# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

JerseyDrop — Hebrew-language soccer-jersey e-commerce. Next.js 14 (App Router, TS strict, `src/` layout), Tailwind v3, dark-only, fully RTL. Production: `jerseydrop.co.il` (Vercel, auto-deploys from `main`).

## Commands

```bash
npm run dev           # dev server on http://localhost:3000
npm run build         # production build (regenerates all static product pages)
npm run lint          # eslint via next lint
npm start             # serve the production build locally

# Catalog / patches validators — run these after touching data/ or src/lib/patches.ts
node scripts/verify-patches.mjs              # 12 historical UEFA spot-checks (Arsenal 24-25 UCL, AC Milan 93-94 UCL, …)
node scripts/image-quality-audit.mjs         # dry-run dimension audit of every product image
node scripts/image-quality-audit.mjs --apply # write the reorder/drop/imageQuality:"low" decisions back to data/sporthub-products.json
```

The build statically pre-renders every visible product page (≈1800 SKUs). Build time is dominated by `generateStaticParams` on `/products/[slug]`, `/teams/[slug]`, `/nations/[slug]`, `/leagues/[slug]`, `/collections/[slug]`.

## Path aliases (tsconfig.json)

- `@/*` → `./src/*`
- `@catalog/*` → `./data/*` — `import x from "@catalog/patches-config.json"` is the canonical way to load catalog JSON.

## Catalog architecture

The catalog is a static JSON file, **not** a database. Three layers:

1. **`data/sporthub-products.json`** — single array of ~2100 product objects. Schema is `Product` in `src/lib/types.ts`. Every product page, listing page, search index, and sitemap entry derives from this file. Edits to this file ⇒ full rebuild required.

2. **`src/lib/products.ts`** — loads + filters the JSON. `ALL_PRODUCTS` is the raw list; `products` (and thus `getAllProducts()`, `getProductBySlug()`, `generateStaticParams`) excludes anything with `imageQuality: "low"`. `allProductsIncludingHidden` is the unfiltered escape hatch (used by `/admin/hidden`). When you add new lookup helpers, decide which array they should read.

3. **`data/patches-config.json`** — UEFA competition + domestic-league patch data, season-keyed (`"1992-93"` through `"2025-26"`, 34 seasons). Lookup logic lives in `src/lib/patches.ts`:
   - `normalizeSeason()` handles supplier-side season strings: canonical `"YYYY-YY"`, compact `"0910"`, corrupted retros `"2096-97"` → `"1996-97"`.
   - `candidateSeasons()` expands a bare `"YYYY"` (retro convention) into `[YYYY-YY+1, YYYY-1-YY]` and unions results.
   - `getAvailablePatches(product)` returns the patch selector options. Falls back to `competitions["2025-26"]` when the season can't be resolved.
   - When jersey season is unknown (null or future), uses the current 2025-26 footprint.

## Image pipeline

Catalog products carry Yupoo CDN URLs that **must** be routed through the local proxy because Yupoo hot-link-protects: `/api/yupoo-image?url=<encoded photo.yupoo.com URL>` (route at `src/app/api/yupoo-image/route.ts`). When merging supplier data via scripts, transform raw `https://photo.yupoo.com/...` URLs into the proxy form before writing.

Each product should have exactly 2 images: front + back. The dimension audit (`scripts/image-quality-audit.mjs`) scores every image, reorders so `images[0]` is the strongest portrait jersey shot, drops fabric/label close-ups, and flags products whose **all** photos failed the bar with `imageQuality: "low"` — which immediately hides them site-wide via the filter in `src/lib/products.ts`. The hidden list is browsable at `/admin/hidden`.

## Supplier (Yupoo) data

`data/yupoo-final-catalog.json`, `docs/YUPOO_INDEX.json`, `data/yupoo-albums-with-photos.json` — offline snapshots of the 7 Yupoo supplier accounts (`512283458`, `qiqirong`, `jianbo666888`, `diyao508`, `lingshang88`, `xiaoyueliang0917`, `3072503479`). Each album has `nameCn` (Chinese title) + `photos` array. Products link back via `sourceHandleCn` (longest-token match against `nameCn`). `scripts/scrape_yupoo_catalogs.py` regenerates the snapshots.

Two false-friend pairs that bite naively-built Chinese-token matchers — handle these explicitly when writing audits:

- `尼斯` (Nice) vs `威尼斯` (Venezia) vs `突尼斯` (Tunisia) — three different entities all ending in `斯`. Always use longest-match-first.
- `克鲁塞罗` (Cruzeiro, Brazil) vs `蓝十字` (Cruz Azul, Mexico) — different teams that map onto similar English transliterations.

## Admin

`/admin/*` is gated by Supabase session (cookie-based). `middleware.ts` enforces it; the page also re-checks server-side. Login form at `/admin/login` pre-fills the last email from localStorage to trigger Safari Touch ID autofill. The admin namespace is `noindex` and excluded from `robots.txt`.

## Conventions

- **RTL**: `<html dir="rtl">` is set in `src/app/layout.tsx`. Use logical Tailwind utilities — `ms-*`/`me-*`/`ps-*`/`pe-*`, never `ml-*`/`mr-*`. `start-*`/`end-*` for positioning.
- **Hebrew UI, English team names, ILS prices.** Product `nameHe` is what renders; English fields are for SEO / structured data only.
- **Dark mode only** — no light theme.
- **Never mention suppliers, dropshipping, or wholesale in visible content.** Internal fields like `sourceHandleCn`, `sourcePriceMin/Max`, `imagesOriginal` exist but must not surface.
- **Slug stability**: when fixing mislabeled products, change `teamSlug` / `team` / `league` / `nameHe`, but **do not rewrite `slug`** (URL field) — that breaks indexed pages.
- **Deploy via push to main.** No PRs needed for solo work. The user's `תדחוף` shortcut means `git add -A && git commit -m "…" && git push` — already authorised, do not ask again.
