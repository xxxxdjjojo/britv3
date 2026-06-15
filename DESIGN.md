# DESIGN.md — Market Map ("The Invisible Estate")

Design rules for the property median-sold-price map screens, extracted from the
Google Stitch project **"The Invisible Estate"** (Design Requirements PRD) and
reconciled with Britestate's existing design tokens in `src/app/globals.css`.

## Creative direction

"Quiet luxury" / editorial real-estate. The interface recedes so the map and the
data breathe. Asymmetric, generous spacing; tonal layering instead of hard
borders; restrained, intentional colour.

## Typography (already wired in `src/app/layout.tsx`)

| Role | Family | Token |
|------|--------|-------|
| Headings | Plus Jakarta Sans | `--font-heading` / `font-heading` |
| Body & UI | Inter | `--font-sans` |

- Section headers: Plus Jakarta Sans, tight tracking.
- Metadata / legend labels: Inter, all-caps, `+0.05em` letter-spacing, small.

## Colour

Brand chrome uses the existing green system (matches Stitch `primary`):

| Token | Hex | Use |
|-------|-----|-----|
| `--primary` / brand green | `#1B4D3E` (Stitch `primary-container`); deep `#003629` | Primary actions, outlines, headings accents |
| brand gold | `#FDCD74` / `#EEC068` | "High value" secondary actions, highlights |
| surfaces | `#FAF9F8` → `#FFFFFF` | Tonal layering; cards lift via off-white→white, not borders |

**No-line rule:** avoid 1px structural borders; define sections with background
shifts. Floating panels (legend, area card, map controls) use a soft "long-tail"
shadow `0 20px 50px rgba(26,28,28,0.05)` and may use glass (`bg-background/80`
`backdrop-blur`).

**Brand policy (public pages):** the chrome stays in the green/gold system. We do
**not** use the Stitch tertiary blue (`#2563EB`) on these public screens.

### Heat ramp (functional data-viz — NOT branding)

The price ramp is a semantic data encoding (lower median = green → higher = red),
defined in `src/lib/market-map/constants.ts` (`PRICE_RAMP`). It is the one
intentionally multi-hue element and is confined to the map fill + legend. Colour
is never the only signal: every area also shows its median, transaction count and
a textual confidence badge, so the information survives for colour-blind users.

- Insufficient data (`< 5` sales): neutral grey `#D8D5D1`, never a strong colour.
- Scale is computed **locally** (quantiles across the borough's areas) and the
  legend always states "Local scale".

## Motion

Prefer compositor-friendly `transform`/`opacity`. Stitch calls for a "gentle
slide": ~600ms `cubic-bezier(0.22, 1, 0.36, 1)`. Respect `prefers-reduced-motion`.

## Components

Built on the existing shadcn primitives (`src/components/ui/*`): `Card`, `Badge`,
`Button`, `Select`, `Sheet`, `Table`. Cards are borderless and lift tonally.
Confidence badges are pill-shaped (`secondary` for High, `outline`/muted for
lower confidence). Map controls and the legend float over the map with the
long-tail shadow.

## Spacing

4px base; favour generous padding. Large gaps between major blocks; group related
metadata tightly (≈1rem). Interactive targets ≥ 44px for touch.
