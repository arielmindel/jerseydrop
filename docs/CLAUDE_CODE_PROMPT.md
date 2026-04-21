# JerseyDrop — Claude Code Build Prompt

**Copy and paste this prompt into Claude Code (Claude Desktop → `</>` Code tab).**

**Before you paste:**
1. Open Claude Desktop app
2. Click the `</>` Code tab
3. Click "Select folder..." at the bottom → create a new folder named `jerseydrop`
4. Make sure `JERSEYDROP_CATALOG.md` is in the same folder (Claude Code will read it for product data)
5. Paste the prompt below (from `Build "JerseyDrop"` to `Start now with step 1`)

---

## THE PROMPT

```
Build "JerseyDrop" — a premium e-commerce website for selling soccer jerseys in Israel, targeting the 2026 FIFA World Cup (starts June 11, 2026). This is a dropshipping business; products ship from a Chinese supplier directly to Israeli customers (10-15 business days delivery).

Domain: jerseydrop.co.il (Hebrew Israeli market — primary)

=== TECH STACK ===

- Next.js 14 (App Router) + TypeScript (strict mode)
- Tailwind CSS v3 with RTL configuration
- shadcn/ui components
- Framer Motion (for premium animations)
- Lucide React (icons)
- Heebo font (Hebrew primary) via next/font/google, weights 300/400/600/700/900
- Space Grotesk (English display accent) via next/font/google
- Zustand for cart state management (with localStorage persistence)
- Built-in RTL support (dir="rtl" on html, Hebrew locale he-IL)

=== PROJECT SETUP ===

Initialize with:
- App Router enabled
- TypeScript strict mode
- Tailwind configured for RTL
- ESLint + Prettier
- Project name: "jerseydrop"
- Vercel-ready config

File structure:
/app
  /(shop)
    /page.tsx                        → homepage
    /products/page.tsx               → all products listing
    /products/[slug]/page.tsx        → product detail with live customization preview
    /leagues/page.tsx                → leagues overview (5 top leagues + other)
    /leagues/[slug]/page.tsx         → single league page (e.g. premier-league, la-liga)
    /nations/page.tsx                → national teams overview (Tier 1 + Tier 2 + other)
    /nations/[slug]/page.tsx         → single nation page
    /retro/page.tsx                  → retro jerseys category
    /cart/page.tsx                   → full cart page
    /checkout/page.tsx               → checkout flow
    /about/page.tsx                  → about us
    /contact/page.tsx                → contact + FAQ
    /size-guide/page.tsx             → size chart modal/page
  /api
    /orders/route.ts                 → order creation stub
    /contact/route.ts                → contact form stub
  /layout.tsx                        → root layout (html dir=rtl, Heebo font)
  /not-found.tsx                     → 404 in Hebrew
/components
  /ui                                → shadcn/ui primitives
  /layout                            → Header (with MegaMenu), Footer, CartDrawer
  /home                              → HeroVideo, WorldCupCountdown, CategoryShowcase, FeaturedGrid, WhyUs, Newsletter
  /product                           → ProductCard, ProductGrid, ProductDetail, VersionToggle, SizeSelector, CustomizationForm, JerseyPreview (canvas/SVG jersey mockup with live name+number)
  /cart                              → CartItem, CartDrawer, CartSummary
  /filters                           → FilterSidebar, SortDropdown
/lib
  /products.ts                       → product data + types + helpers
  /cart.ts                           → cart store (Zustand) + utilities
  /currency.ts                       → ILS formatting
  /constants.ts                      → leagues, tiers, config
/data
  /products.json                     → full product catalog
/public
  /images/products/                  → product images (placeholders initially)
  /videos/hero/                      → hero video loop (placeholder initially)

=== DESIGN SYSTEM ===

Vibe: Streetwear meets premium. Think Nike × KITH. Bold, dark, modern, with just enough gold accents to feel elevated. The user described it as "streetwear with a premium finish".

Color palette (DARK MODE ONLY):
- Background: #0A0A0A (deep black)
- Surface: #141414 (cards / elevated elements)
- Border: #262626
- Primary accent: #00FF88 (electric neon green — "kickoff green") — CTAs, active states, focus rings
- Gold accent: #D4AF37 (premium touch) — retro badges, premium labels, subtle dividers
- Text primary: #FFFFFF
- Text secondary: #A3A3A3
- Text muted: #6B6B6B
- Destructive: #FF3B3B (sale / hot badges)
- Success: #00FF88

Typography:
- Hebrew primary: Heebo (300, 400, 600, 700, 900)
- English display: Space Grotesk (400, 500, 700, 900) — for English headings, team names, sizes, section eyebrows
- CTAs and section titles: UPPERCASE BOLD
- Hero display: 5xl-7xl, font-black, uppercase
- Body: base size, font-normal, text-neutral-300

Visual language:
- Dark mode is default and only mode
- Generous whitespace around hero and sections
- Bold product photography on dark backgrounds (let jersey colors pop)
- Subtle grain texture overlay optional on hero
- Micro-interactions on hover: cards lift (-translate-y-1), scale 1.02, neon green glow border
- Neon green glow on primary CTAs (box-shadow with green at low opacity)
- Gold accents reserved for retro/premium markers
- Framer Motion for page transitions, hero element fade-ins, stagger reveals on grids

=== LANGUAGE & DIRECTION ===

- Hebrew only. RTL layout throughout.
- All UI copy in Hebrew.
- Team names stay in English (Real Madrid, Barcelona, Argentina, Brazil, etc.) — teams keep canonical names.
- Sizes stay in English (S, M, L, XL, 2XL, 3XL, 4XL).
- Prices in ILS, formatted as "149 ₪" (number + space + ₪).

=== PAGES & FEATURES ===

1. HOMEPAGE (/)

Hero section (full viewport height, mobile ~80vh):
- **Video loop background** — muted, autoplay, loop. Use a placeholder MP4 for now (a silent dark stadium / jersey close-up loop). Overlay: black gradient 70% → 0% from bottom.
- Headline (Hebrew, large, font-black): "הגיע הזמן ללבוש את הצבעים"
- Subheadline: "חולצות רשמיות לנבחרות ולמועדונים. משלוח לכל הארץ."
- Primary CTA: "לקולקציה →" (scrolls to categories / links to /products)
- Secondary CTA: "מונדיאל 2026" (links to nations page)
- **World Cup countdown prominently placed INSIDE the Hero area** — big glowing digital-style numbers for Days / Hours / Minutes / Seconds until June 11, 2026 at 18:00 UTC. Neon green digits on black, updates every second. Label: "עד פתיחת המונדיאל". This is the hero's centerpiece — large and bold.

Category Navigation section (equal weight — user wants all categories to get equal attention):
Three large cards, side-by-side on desktop, stacked on mobile:
- "ליגות מובילות" (Top Leagues) → links to /leagues
- "נבחרות לאומיות" (National Teams) → links to /nations
- "רטרו" (Retro) → links to /retro
Each card: large background image (team jersey close-up), title, short description, "גלה →" CTA. Hover: scale 1.02, green glow, slight zoom on bg image.

League showcase strip (icon grid):
Show 5 league logos with names. On click → /leagues/[slug]:
- פרמייר ליג (Premier League — England)
- לה ליגה (La Liga — Spain)
- סריה א (Serie A — Italy)
- בונדסליגה (Bundesliga — Germany)
- ליג 1 (Ligue 1 — France)
- + ליגות נוספות (Other leagues — catch-all)

Nations showcase strip (horizontal scroll):
Flags + country names for all Tier 1 nations (Argentina, Brazil, Portugal, France, Spain, Germany, England) with "+עוד" card at the end linking to /nations.

Featured products: 8-product grid — hand-picked bestsellers (Argentina Home 2026, Brazil Home, Portugal Home, France Home, Real Madrid Home, Barcelona Home, Manchester United Home, Inter Miami Home).

Why JerseyDrop section (3 columns):
- "איכות מקורית" — שימוש בבדים מקוריים, דגמים עדכניים
- "התאמה אישית" — שם ומספר משלך (+30 ₪)
- "משלוח מהיר" — 10-15 ימי עסקים ישירות אליך

Newsletter signup: Email input + neon green CTA ("הירשמו לעדכונים").

Footer: Column 1 — logo + short brand line. Column 2 — קישורים מהירים. Column 3 — קטגוריות (Leagues/Nations/Retro). Column 4 — צור קשר (WhatsApp, Email). Bottom bar: payment icons (Visa, Mastercard, PayPal, Bit), copyright.

2. LEAGUES OVERVIEW (/leagues)

Hero banner (smaller, ~40vh): "הליגות הגדולות בעולם" + short subline.

Grid of 6 cards (5 top leagues + "אחר"):
- Premier League (פרמייר ליג) — background of English stadium/EPL logo feel, text: Arsenal, Chelsea, Liverpool, Man City, Man United, Tottenham, Newcastle...
- La Liga (לה ליגה) — Real Madrid, Barcelona, Atletico...
- Serie A (סריה א) — AC Milan, Inter, Juventus, Napoli, Roma...
- Bundesliga (בונדסליגה) — Bayern, Dortmund
- Ligue 1 (ליג 1) — PSG, Marseille, Lyon
- אחר / ליגות נוספות — Brazilian League, MLS (Inter Miami — Messi!), Eredivisie (Ajax), Primeira Liga (Benfica, Sporting), Scottish (Celtic)...

Each card: Dark image background, league name big, "X מועדונים זמינים" counter, CTA "→".

3. SINGLE LEAGUE PAGE (/leagues/[slug])

Header: League name + logo + clubs count.
Below: product grid of all jerseys belonging to clubs in that league, with filters:
- Team (dropdown)
- Version (Fan / Player)
- Size
- Price range
- Season (25-26 / 26-27 / retro)

For "אחר" page: list Brazilian, MLS, Portuguese clubs etc. — all non-top-5 leagues.

4. NATIONS OVERVIEW (/nations)

Hero: "נבחרות העולם — מונדיאל 2026" + countdown mini-widget.

Grid organized by tier:
- **Tier 1 (Must-have)** — Argentina 🇦🇷, Brazil 🇧🇷, Portugal 🇵🇹, France 🇫🇷, Spain 🇪🇸, Germany 🇩🇪, England 🏴
- **Tier 2 (Popular)** — Netherlands, Italy, Belgium, Japan, Morocco, USA, Mexico
- **Tier 3 / Other (אחר)** — Colombia, Croatia, Turkey, South Korea, Saudi Arabia, Switzerland, Norway, etc. (all remaining teams from the catalog)

Each tier section has its own heading. Within a tier: card grid. Each card = flag + country name + "Home/Away זמינים" + CTA.

5. SINGLE NATION PAGE (/nations/[slug])

Header: flag + country name large (English + Hebrew).
Jerseys: Home, Away, Third (if exists), Goalkeeper (if exists), Special (e.g., Argentina 2026 WC with trophy).
Filters: Version, Size, Price.

6. PRODUCTS LISTING (/products)

Universal products page — all jerseys filterable.
Sidebar filters:
- Category (National / Clubs / Retro / Short sleeve suit / Cotton)
- League (multi-select, appears when Category = Clubs)
- Team (searchable)
- Version (Fan / Player / Retro)
- Size (S → 4XL)
- Price range (slider 100-300 ₪)
- Tags (World Cup 2026, Messi, Ronaldo, Bestseller, New)

Sort: Popularity (default), Price asc, Price desc, Newest.

Grid: 2-col mobile, 3-col tablet, 4-col desktop.

URL-based filters (searchParams) so pages are shareable.

Product card: main image, team name (Eng + He small), version badge, price (+ strikethrough if discounted), hover scale 1.03 + neon glow.

7. PRODUCT DETAIL (/products/[slug]) — ★ KEY PAGE ★

Left / top half: Image gallery — main image large, thumbnails row, zoom on hover.

Right / bottom half:
- Team name (English large, Hebrew smaller)
- Season (e.g., 2025-26)
- Version toggle: two big buttons — "Fan Version — 139 ₪" | "Player Version — 179 ₪"
- Size selector: S / M / L / XL / 2XL / 3XL / 4XL buttons (with "מדריך מידות" modal link)
- **Customization section (centerpiece feature)** — toggle "הוספת שם ומספר (+30 ₪)":
  - When enabled: two inputs appear — "שם" (max 12 chars, latin letters + numbers only, uppercase auto-forced) and "מספר" (0-99).
  - **LIVE PREVIEW** — right beside (or below on mobile) the inputs: an SVG/Canvas rendering of a blank jersey back with the typed name above the number in an authentic football jersey font (use "Oswald" or "Bebas Neue" for the preview text via next/font/google). Colors adapt to jersey (e.g., white text for dark jerseys). This is the killer feature — as the user types, they see the jersey update live.
- Primary CTA: "הוספה לסל — X ₪" (big, neon green, with a subtle pulse animation). Click → adds to cart + opens CartDrawer.
- Secondary CTA: "קנייה מיידית" — goes directly to /checkout with this item.
- Shipping box: "משלוח ל-10-15 ימי עסקים | מכס ודמי משלוח כלולים | משלוח חינם מעל 249 ₪"
- Trust badges row: "תשלום מאובטח" / "החלפות תוך 14 יום" / "שירות לקוחות בעברית"
- Description accordion: fabric, fit, origin (generic — NEVER mention supplier or China), washing instructions
- Related products carousel: 4-8 jerseys from same league/nation, horizontal scroll.

Mobile: sticky bottom bar with price + "הוספה לסל" button when scrolled past the main CTA.

8. RETRO (/retro)

Hero: "רטרו — קלאסיקות שלא יחזרו" + gold accent.
Grid: all retro jerseys organized by decade (90s, 2000s, 2010s) with gold badges.

9. CART DRAWER (slide-in from right, since RTL)

Triggered by cart icon in header.
- Header: "הסל שלך (X פריטים)" + close button
- Items list: thumbnail, team, version, size, custom name/number (if set), quantity stepper (+/-), remove (trash icon), price
- Empty state: football icon + "הסל ריק" + "לגלות חולצות" CTA
- Totals: Subtotal, shipping (free above 249 ₪, else 29 ₪), total (bold, neon green)
- CTA: "לקופה →" (primary neon) + "המשך בקניות" (secondary text link)

10. CART PAGE (/cart)

Same content as drawer but full-width layout. For desktop users who want the bigger view.

11. CHECKOUT (/checkout)

Single-page flow (no multi-step wizard for MVP).

Left / top: form sections
- פרטי קונה: full name, email, phone
- כתובת למשלוח: city, street, building number, apartment, postal code
- **Payment method:** Primary option is כרטיס אשראי (credit card) — this is the main payment method per user preference. Secondary: PayPal. Tertiary: Bit.
- Credit card integration: for NOW, stub — collect card fields (number, expiry, CVV, holder name) into the form BUT on submit, just POST to /api/orders with the order details and show success page. Add a TODO comment pointing to Tranzila or Cardcom integration (Israeli processors — research later which is cheaper for low volume).
- PayPal: add TODO for PayPal SDK Business account integration.
- Bit: add TODO for Bit Business API.

Right / bottom (sticky on desktop): order summary
- All items with thumbnail
- Subtotal, shipping, total
- Promo code input (stub)
- Big CTA at bottom: "לתשלום — X ₪"

Success page (/checkout/success):
- Big green checkmark
- "תודה על ההזמנה! 🎉" (no emoji in actual code — just text)
- Order number (JDxxxxxx format, generated)
- "קיבלנו את ההזמנה. נשלח עדכון לאימייל ברגע שהחולצה יוצאת לדרך."
- Expected delivery: "בין 10-15 ימי עסקים"
- CTA back home

12. ABOUT (/about)

Short story: JerseyDrop נולד מהאהבה לכדורגל... (focus on the brand as Israeli independent brand — NEVER mention dropshipping or supplier).
Mission statement.
World Cup 2026 hype section with mini countdown.

13. CONTACT (/contact)

- Contact form: name, email, subject, message → POST to /api/contact (stub)
- WhatsApp CTA button (placeholder: +972-XX-XXXXXXX — user will fill in later)
- Business hours
- FAQ accordion:
  - "כמה זמן לוקח משלוח?" — 10-15 ימי עסקים
  - "איך מחזירים מוצר?" — תוך 14 יום, החזר מלא
  - "האם המחיר כולל שם ומספר?" — לא, תוספת 30 ₪ לשם+מספר
  - "מה ההבדל בין Fan ל-Player?" — Fan = גזרה רגילה, Player = מיקרו-פייבר נושם, פחות משקל
  - "יש מידות לילדים?" — בקרוב (stub)

=== PRODUCT DATA SCHEMA ===

Use the attached JERSEYDROP_CATALOG.md as source of truth. In this first pass:

1. Create types file at /lib/types.ts:

export type League =
  | "premier-league"
  | "la-liga"
  | "serie-a"
  | "bundesliga"
  | "ligue-1"
  | "other";

export type NationTier = "tier-1" | "tier-2" | "tier-3";

export type Product = {
  id: string;
  slug: string;                    // e.g., "argentina-home-2026"
  nameHe: string;                  // e.g., "ארגנטינה בית 2026"
  nameEn: string;                  // e.g., "Argentina Home 2026"
  category: "national" | "club" | "retro" | "suit" | "cotton";
  team: string;                    // canonical team name
  teamSlug: string;                // url slug for team
  league?: League;                 // for clubs only
  nation?: string;                 // for nationals only (e.g., "argentina")
  nationTier?: NationTier;         // for nationals
  season: string;                  // "2025-26" | "2026-27" | "2010" etc.
  type: "home" | "away" | "third" | "goalkeeper" | "special";
  versions: ("fan" | "player")[];
  priceFan: number;                // 139
  pricePlayer: number;             // 179
  priceRetro?: number;             // 199
  originalPrice?: number;          // strikethrough
  images: string[];                // /public/images/products/...
  sizes: ("S"|"M"|"L"|"XL"|"2XL"|"3XL"|"4XL")[];
  customizable: boolean;
  tags: string[];                  // ["world-cup-2026", "bestseller", "messi"]
  stock: "in-stock" | "low" | "preorder";
};

2. Populate /data/products.json with AT LEAST:
   - ALL Tier 1 national teams: Home + Away for Argentina (incl. 2026 WC trophy variant as "special"), Brazil, Portugal, France, Spain, Germany, England
   - Top 10 clubs: Real Madrid, Barcelona, Manchester United, Liverpool, Manchester City, Arsenal, PSG, AC Milan, Inter Miami, Bayern Munich — all Home 25-26
   - 3 retro: Argentina 2010 Home, Manchester United 13-14 Home, Real Madrid 06-07 Home

3. For images: use placeholder URLs from https://picsum.photos/seed/{slug}/600/800 initially. Add a comment at the top of products.json: "// TODO: Replace with real product images from supplier Yupoo catalogs — see JERSEYDROP_CATALOG.md"

=== KEY UX DETAILS ===

- All prices formatted as "149 ₪" (number + space + shekel sign, RTL-safe).
- World Cup countdown — accurate, updates every second, uses Date.UTC(2026, 5, 11, 18, 0, 0) as target.
- Sticky add-to-cart CTA on mobile product page.
- Cart persists in localStorage via Zustand persist middleware.
- Loading states: skeleton cards on product list, spinner on add-to-cart button.
- 404 page: Hebrew error message + CTA back to homepage, small green glow effect.
- SEO: Hebrew meta tags per page, OpenGraph images, product structured data (schema.org Product with price, availability).
- Mobile menu: hamburger icon → full-screen overlay with categories, nations, leagues.
- Header: sticky on scroll, semi-transparent with blur backdrop when scrolled.

=== ACCESSIBILITY ===

- All images have alt text (Hebrew for content, English for team names in the alt).
- Keyboard navigation works throughout.
- Focus rings visible (neon green 2px ring).
- Color contrast AA minimum.
- prefers-reduced-motion respected — hero video pauses, animations simplified.

=== DEPLOYMENT PREP ===

- Set up Vercel-ready config (vercel.json if needed).
- README.md includes:
  - Install instructions (pnpm install / npm install)
  - Environment variables (future: NEXT_PUBLIC_PAYPAL_CLIENT_ID, TRANZILA_API_KEY, BIT_API_KEY, NEXT_PUBLIC_WHATSAPP_NUMBER)
  - How to add new products (edit products.json)
  - How to update the World Cup countdown date
  - How to replace the hero video

=== BUILD ORDER (commit after each step) ===

1. Project setup: Next.js init + Tailwind RTL + Heebo/Space Grotesk fonts + global layout (Header placeholder, Footer placeholder)
2. Design system: colors in tailwind config, Button/Card/Input/Dialog primitives via shadcn, utility classes
3. Navigation: Header with MegaMenu (leagues + nations dropdowns), CartDrawer shell, Footer
4. Homepage: Hero with video loop + World Cup countdown INSIDE hero, 3 category cards, league strip, nations strip, featured grid, why-us, newsletter
5. Leagues pages: /leagues overview + /leagues/[slug] with filters
6. Nations pages: /nations overview (tier 1/2/3 sections) + /nations/[slug]
7. Products listing: /products with full filter sidebar + sort
8. Product detail: /products/[slug] with version toggle, size selector, **customization with LIVE JERSEY PREVIEW** (SVG or Canvas), add-to-cart
9. Cart drawer + cart page + Zustand store with localStorage
10. Checkout: single-page form with credit card primary + PayPal/Bit secondary (stubbed), success page
11. About + Contact + Retro + 404 + size guide modal
12. SEO meta tags, OpenGraph, robots.txt, sitemap.xml, Vercel deploy config, README

After each step, commit with a clear descriptive message and tell me what was completed before moving on.

=== CRITICAL DO'S AND DON'TS ===

DO:
- Always render RTL correctly (check padding/margin directions)
- Keep team names in English, UI in Hebrew
- Use ILS currency consistently
- Comment any payment integration stubs clearly with TODO

DON'T:
- Mention supplier, China, dropshipping, or wholesale ANYWHERE in the site content
- Use LTR-specific styles (mr/ml — use ms/me for logical properties)
- Add user accounts for MVP — guest checkout only
- Add a blog for MVP

Start now with step 1. Confirm the tech stack choice and ask me before installing anything that's not in the stack I specified.
```

---

## מה שונה מהגרסה הראשונה

הפרומפט עודכן לפי הבחירות שלך:

1. **Video loop** ב-Hero במקום תמונה סטטית
2. **כל 3 הקטגוריות (ליגות/נבחרות/רטרו) בולטות באותה מידה** בדף הבית
3. **חלוקה רצינית לפי 5 הליגות** — /leagues/premier-league, /leagues/la-liga, /leagues/serie-a, /leagues/bundesliga, /leagues/ligue-1 + /leagues/other
4. **חלוקה לפי נבחרות** — Tier 1 / Tier 2 / אחר (tier 3 כולל כל השאר)
5. **כרטיס אשראי = התשלום הראשי** (PayPal ו-Bit משניים)
6. **Live Preview של הפאץ' השם+מספר** — הפיצ'ר הכי מרכזי בדף המוצר
7. **קאונטדאון גדול ובולט בתוך ה-Hero** (לא סתם סרט תחתון)
8. **משלוח 10-15 ימי עסקים** (הדגשת "עסקים")
9. **שחור + ניאון ירוק** (הזהב לעיצונים של רטרו בלבד)
10. **דומיין: jerseydrop.co.il**
11. **לוגו placeholder** (wordmark פשוט) — נחליף אחר כך

מוכן להעתקה. אומר לי כשאתה רוצה לעבור ל-Claude Code ואני אסביר איך להתחיל.