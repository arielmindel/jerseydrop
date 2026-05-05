# JerseyDrop Design System v1

Generated 2026-05-04. Built with Tailwind v3, CSS custom properties, Framer Motion.

## Brand vibe

Streetwear meets premium athletic — Nike × KITH × Off-White. Israeli football audience, World Cup 2026 hype. **Dark mode only.** Bold, confident, modern.

## Color tokens

All colors live in `tailwind.config.ts` and are referenced by Tailwind class. Surfaces stack: bg → surface → surface-2 (lighter as you go up).

| Token | Hex | Use |
|---|---|---|
| `bg-background` | `#0B1220` | Page background (warm-dark navy, not pure black) |
| `bg-surface` | `#151B2C` | Cards, panels |
| `bg-surface-2` | `#1C2237` | Elevated cards (hover, modals) |
| `border-border` | `#2C3349` | Card borders, dividers |
| `text-foreground` | `#F8FAFC` | Primary text |
| `text-muted` | `#94A3B8` | Body / secondary text |
| `text-muted-foreground` | `#64748B` | Captions, disabled |
| `bg-accent` / `text-accent` | `#00FF88` | Primary CTAs, links, highlights — neon green |
| `bg-gold` / `text-gold` | `#D4AF37` | Retro/premium markers ONLY |
| `bg-cyan` | `#22D3EE` | Section variation |
| `bg-violet` | `#A855F7` | Section variation |
| `bg-rose` | `#F472B6` | Section variation |
| `bg-amber` | `#F59E0B` | Section variation |
| `bg-destructive` | `#FF3B5C` | Errors, sold-out |

## Type scale

Hebrew body uses **Heebo**. English caps display use **Space Grotesk**. Vintage/Jersey numbers use **Oswald**.

| Class | Size / line-height | Use |
|---|---|---|
| `text-display-xl` | 4.5rem / 1.0 | Hero (`<h1>` only — homepage) |
| `text-display-lg` | 3.5rem / 1.05 | Section heroes (team page, collection page) |
| `text-display` | 2.5rem / 1.1 | Major section headlines |
| `text-h1` | 2rem / 1.15 | Page titles |
| `text-h2` | 1.5rem / 1.2 | Card group titles |
| `text-h3` | 1.25rem / 1.3 | Card titles |
| `text-body-lg` | 1.125rem / 1.6 | Featured paragraphs |
| `text-body` | 1rem / 1.6 | Default body |
| `text-body-sm` | 0.875rem / 1.55 | Cards, lists |
| `text-caption` | 0.75rem / 1.4 | Metadata, eyebrows |
| `text-overline` | 0.6875rem / 1.0 | Section eyebrows (uppercase, tracked) |

Display fonts (Space Grotesk) get `font-display`. Hebrew bodies (Heebo) get `font-sans`. Numbers in jerseys get `font-jersey`.

## Spacing scale

Use Tailwind's default 4px-base scale, but **stick to these stops** for consistency:

| Token | px | Use |
|---|---|---|
| `1` | 4 | Inline icon→text gap |
| `2` | 8 | Tight |
| `3` | 12 | Card internal gap |
| `4` | 16 | Default |
| `6` | 24 | Card padding |
| `8` | 32 | Section internal |
| `12` | 48 | Between major sections |
| `16` | 64 | Page-level vertical |
| `24` | 96 | Hero spacing |

## Component primitives

Located in `src/components/ui/`. Use these instead of inlining classes.

- `<Button variant>` — primary | secondary | outline | ghost | destructive
- `<Card>` — wraps any content with consistent radius + border + hover lift
- `<Chip variant>` — default | accent | gold | outline (pill badges)
- `<Skeleton />` — shimmering loading placeholder
- `<SectionEyebrow>` — uppercase tracked label above headlines

## Motion tokens

| Class | Duration | Use |
|---|---|---|
| `transition-snap` | 120ms | Micro (chip toggle, hover color) |
| `transition-fast` | 180ms | Default hover |
| `transition-base` | 240ms | Card hover, button states |
| `transition-slow` | 360ms | Page transitions |
| `transition-graceful` | 480ms | Hero, large reveals |

Easings: `ease-out` for enter, `ease-in` for exit. Respect `prefers-reduced-motion` (already configured globally).

## Shadow / glow tokens

| Class | Effect |
|---|---|
| `shadow-card` | Subtle card depth (default) |
| `shadow-glow-sm` | Small accent glow on hover |
| `shadow-glow` | Stronger neon green glow on focus / primary CTA |
| `shadow-glow-cyan` / `glow-violet` / `glow-rose` | Section-specific |
| `shadow-gold` | Retro/premium products only |

## Layout grid

- Container: `max-w-[1400px]` (already set), `px-4 md:px-6 lg:px-8`
- Product grids: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- Team/league cards: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (sometimes 5 on `2xl`)
- Gap: `gap-3 md:gap-4 lg:gap-6`

## Anti-patterns

- ❌ Mixing emoji with text — always use Lucide icons
- ❌ Hardcoded hex outside config — use Tailwind tokens
- ❌ Random shadow values — use the glow scale
- ❌ Layout shift on hover (use `transform: translateY(-2px)` not margin)
- ❌ Disabling reduced-motion respect

## Implementation log

- **2026-05-04** Wave 1: tailwind config tokens, globals.css utilities, ui/ primitives
- **2026-05-04** Wave 2: home page sections refresh
- **2026-05-04** Wave 3: product detail + cart polish
- **2026-05-04** Wave 4: leagues/teams/collections card grids
