# DESIGN.md — TrueDeed Design System

The design language for TrueDeed. Source of truth for tokens is
`src/app/globals.css`; fonts are wired in `src/app/layout.tsx`. This doc explains
the system; the CSS is what ships.

## Creative direction

"Quiet luxury" / editorial real-estate. The interface recedes so the property,
the map, and the data breathe. Asymmetric, generous spacing; tonal layering instead
of hard borders; restrained, intentional colour. Confident but never loud.

---

## Typography

Wired in `src/app/layout.tsx` with `next/font` (`display: swap`).

| Role | Family | Token |
|------|--------|-------|
| Headings | Plus Jakarta Sans (400–700) | `--font-heading` / `font-heading` |
| Body & UI | Inter (400–600) | `--font-sans` |
| Mono | Geist Mono | code / technical |

- Section headers: Plus Jakarta Sans, tight tracking.
- Metadata / legend labels: Inter, all-caps, `+0.05em` letter-spacing, small.
- Drive hierarchy with **scale contrast**, not weight alone.

---

## Colour

Defined as CSS custom properties in `globals.css`. The brand is a **green + gold**
system; semantic colours are separate from brand.

### Brand
| Token | Hex | Use |
|-------|-----|-----|
| `--color-brand-primary` | `#1B4D3E` | Primary brand green (actions, headings accents) |
| `--color-brand-primary-dark` | `#003629` | Deepest green |
| `--color-brand-primary-light` | `#2D7A5F` | Lighter green (dark-mode primary) |
| `--color-brand-primary-mid` | `#5E8C78` | Mid green |
| `--color-brand-primary-lighter` | `#E8F5EE` | Pale green tint |
| `--color-brand-secondary` | `#A07D2E` | Gold/brown secondary |
| `--color-brand-gold` | `#FDCD74` | Bright gold CTA / "high value" |
| `--color-brand-gold-foreground` | `#7B5804` | Text on gold |
| `--color-brand-accent` | `#2563EB` | Blue — **internal/app only, never on public pages** |

### Semantic
| Intent | Colour | Light variant |
|--------|--------|---------------|
| Success | `#16A34A` | `#DCFCE7` |
| Warning | `#CA8A04` | `#FEF9C3` |
| Error | `#DC2626` | `#FEE2E2` |
| Info | `#2563EB` | `#DBEAFE` |

Neutrals run a 9-stop grayscale (`#0A0A0B` → `#F8F8FA`).

### Brand policy (public pages)
Public / marketing pages stay in the **green + gold** system. Do **not** use the
blue `--color-brand-accent` (or rainbow accents) on public surfaces — that token is
for the authenticated app only. The `pnpm check:brand` script guards this. The one
exception is the market-map heat ramp (see below), which is functional data-viz, not
branding.

---

## Surfaces, depth & motion

- **No-line rule:** avoid 1px structural borders; define sections with background
  shifts. Cards lift tonally (off-white `#FAF9F8` → white `#FFFFFF`), not with
  borders.
- Floating panels use a soft long-tail shadow `0 20px 50px rgba(26,28,28,0.05)` and
  may use glass (`bg-background/80` + `backdrop-blur`). Shadow scale: `xs–xl`.
- **Motion:** compositor-friendly `transform`/`opacity` only. Default ease
  `cubic-bezier(0.22, 1, 0.36, 1)`, ~600ms for a "gentle slide". Always respect
  `prefers-reduced-motion`.

---

## Spacing & radius

- 4px base; favour generous padding. Large gaps between major blocks; group related
  metadata tightly (≈1rem).
- Radius scale: `6, 8, 12, 16, 24, 32, 9999px`.
- Interactive targets ≥ **44×44px** (WCAG 2.5.5).

---

## Dark mode

Handled via `next-themes` + a `.dark` class with `prefers-color-scheme` as the
default. Dark mode is a first-class theme, not an inversion: background `#0A0A0B`,
surface `#11140F` (dark green tint), card `#171719`, primary shifts to the lighter
green `#2D7A5F` for contrast, borders become `rgba(255,255,255,0.1)`.

---

## Components

Built on the shadcn-style primitives in `src/components/ui/*` (over Radix + Base UI):
`Button`, `Input`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `Card`,
`Dialog`, `Drawer`, `Sheet`, `Popover`, `Badge`, `Alert`, `Progress`, `Avatar`,
`Skeleton`, `Command`, `DropdownMenu`, `Breadcrumb`, `DataTable`, `Chart`,
`Sonner` (toast), `SafeHTML`.

- Cards are borderless and lift tonally.
- Pill-shaped badges; `secondary` for emphasis, `outline`/muted for low confidence.
- Hover, focus, and active states should feel designed — focus ring is 2px at
  `#2563EB` with 2px offset.

---

## Accessibility

- Colour is never the only signal (see the market-map ramp).
- 44px touch targets; safe-area padding for notched devices.
- Reduced-motion disables animation via `@media (prefers-reduced-motion: reduce)`.
- Semantic HTML and ARIA on interactive components.

---

# Market Map — "The Invisible Estate"

Design rules for the property median-sold-price map screens, extracted from the
Google Stitch project **"The Invisible Estate"** and reconciled with the tokens
above. These screens are the purest expression of the "quiet luxury" direction:
the chrome recedes entirely so the map and data lead.

### Heat ramp (functional data-viz — NOT branding)

The price ramp is a semantic data encoding (lower median = green → higher = red),
defined in `src/lib/market-map/constants.ts` (`PRICE_RAMP`). It is the one
intentionally multi-hue element and is confined to the map fill + legend. Colour is
never the only signal: every area also shows its median, transaction count and a
textual confidence badge, so the information survives for colour-blind users.

- Insufficient data (`< 5` sales): neutral grey `#D8D5D1`, never a strong colour.
- Scale is computed **locally** (quantiles across the borough's areas) and the
  legend always states "Local scale".

### Surfaces & components

Built on the same shadcn primitives (`Card`, `Badge`, `Button`, `Select`, `Sheet`,
`Table`). Cards are borderless and lift tonally. Confidence badges are pill-shaped
(`secondary` for High, `outline`/muted for lower confidence). Map controls and the
legend float over the map with the long-tail shadow and optional glass.
