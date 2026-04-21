# JerseyDrop

Premium soccer jerseys e-commerce for Israel — targeting FIFA World Cup 2026.

Dark streetwear × premium, fully RTL Hebrew, built on Next.js 14 App Router.

- Domain: **jerseydrop.co.il**
- Repo: [github.com/arielmindel/jerseydrop](https://github.com/arielmindel/jerseydrop)
- Deploy: Vercel (connect the repo, push to `main`, auto-deploys)

## Stack

| Layer       | Choice                                                    |
| ----------- | --------------------------------------------------------- |
| Framework   | Next.js 14 (App Router, TypeScript strict, `src/`)        |
| Styling     | Tailwind v3 · dark-only · RTL                             |
| UI          | shadcn-style primitives on top of Radix UI                |
| Animations  | Framer Motion                                             |
| State       | Zustand (cart, with `persist` → localStorage)             |
| Icons       | lucide-react                                              |
| Fonts       | Heebo (HE), Space Grotesk (EN display), Oswald (jersey)   |
| Images      | `next/image` + `picsum.photos` placeholders (swap later)  |

## Install & run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # eslint
```

## Environment variables

None are required for the MVP. When payment / ESP integrations go in, create `.env.local`:

```bash
# Payment processors (Israeli)
TRANZILA_API_KEY=
CARDCOM_API_KEY=
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
BIT_API_KEY=

# Customer comms
NEXT_PUBLIC_WHATSAPP_NUMBER=972000000000
RESEND_API_KEY=
```

## Adding new products

1. Open `src/data/products.json`.
2. Copy an existing product object and change at minimum:
   - `id` (unique SKU)
   - `slug` (kebab-case, used in URL)
   - `nameHe` / `nameEn`
   - `team` / `teamSlug`
   - `league` (clubs) or `nation`+`nationTier` (nationals)
   - `season`, `type`, `versions`, `priceFan`, `pricePlayer`
   - `images` — drop real files in `/public/images/products/` and reference them, or keep a picsum seed for staging.
   - `sizes`, `tags`, `stock`
3. Add `"featured": true` if you want it on the homepage top-sellers grid.

The Next build regenerates static params automatically — every product gets its own pre-rendered `/products/[slug]` page, and sitemap + filters update.

## Replacing the hero video

Drop an MP4 at `/public/videos/hero/hero-loop.mp4` (muted, looped, 10–20s, <5 MB). The existing `<video>` element in `src/components/home/HeroVideo.tsx` picks it up automatically; until then the poster image from picsum is shown with the dark overlay.

## Updating the World Cup countdown

Edit `WORLD_CUP_START_UTC` in `src/lib/constants.ts`:

```ts
export const WORLD_CUP_START_UTC = Date.UTC(2026, 5, 11, 18, 0, 0);
// YYYY, month(0-indexed), day, HH, MM, SS UTC
```

## Deploy workflow

1. `git add -A && git commit -m "…"`
2. `git push` → Vercel auto-deploys within ~90 seconds.
3. Custom domain: set `jerseydrop.co.il` in Vercel → Domains and point DNS per Vercel's instructions.

## Project structure

```
src/
  app/
    layout.tsx                 # RTL root (Heebo/Space Grotesk/Oswald) + JSON-LD + Header/Footer
    page.tsx                   # Homepage
    products/                  # Listing + [slug] detail page
    leagues/                   # Overview + [slug] filtered listing
    nations/                   # Tiered overview + [slug] filtered listing
    retro/                     # Retro category
    cart/                      # Full cart page
    checkout/                  # Single-page checkout + /success
    about/, contact/, size-guide/
    api/orders/route.ts        # Order creation stub (TODO: Tranzila/Cardcom)
    api/contact/route.ts       # Contact form stub
    opengraph-image.tsx        # Edge-rendered OG image
    robots.ts, sitemap.ts      # SEO routes
  components/
    layout/   (Header, MegaMenu, MobileMenu, Footer)
    home/     (HeroVideo, WorldCupCountdown, CategoryShowcase, LeagueStrip, NationsStrip, FeaturedGrid, WhyUs, Newsletter)
    product/  (ProductCard, ProductGrid, ProductDetail, JerseyPreview, SizeGuideTable, RelatedProducts)
    cart/     (CartDrawer)
    filters/  (FilterSidebar, SortDropdown)
    ui/       (button, card, input, label, dialog, sheet, badge, navigation-menu)
    seo/      (JsonLd)
  lib/
    constants.ts, types.ts, products.ts, cart.ts, filters.ts, utils.ts
  data/products.json           # 28 SKUs (nationals, clubs, retro)
public/
  videos/hero/                 # Drop hero-loop.mp4 here
```

## Critical do's & don'ts

- Hebrew UI, English team names, ILS prices.
- `dir="rtl"` on `<html>` — use logical `ms-*`/`me-*` utilities, never `ml-*`/`mr-*`.
- Dark mode only.
- Never mention suppliers, dropshipping, or wholesale in visible content.
- Payments in `/checkout` are stubs — collect card fields BUT POST to `/api/orders` which logs and returns an order number. Swap for Tranzila/Cardcom before going live.
- Guest checkout only for MVP — no user accounts.

## License

Proprietary — © JerseyDrop / Ariel Mindel.
