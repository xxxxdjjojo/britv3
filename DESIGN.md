# DESIGN.md — Multi-Scale Property Price Map

> Design contract for the market price map feature.  
> Derived from: Stitch heatmap screen (`price-heatmap.png` / `price-heatmap.html`) + project design tokens (`src/app/globals.css`).  
> Implementation tasks build the MapLibre choropleth component and both screens against this document.

---

## CRITICAL OVERRIDES FROM STITCH SCREEN

These deviations from the Stitch export are **mandatory** and must be enforced in every implementation task:

1. **No "Price per sq ft" label.** The Stitch legend reads "PRICE PER SQ FT". This wording is **removed**. The metric is **"Median sold price"** (or "Typical sold price from registered transactions").
2. **No "Square Footage" filter.** The Stitch left panel includes a "Square Footage" filter item. This is **dropped** — we have no floor-area data.
3. **No £/m² metric label anywhere.** The string "£/m²" must not appear as a UI label. It may only appear inside the mandatory disclaimer below (in the context of explaining why it is NOT available).
4. **Mandatory disclaimer.** Every screen that shows the choropleth must display, verbatim:

   > "Based on registered sold-price transactions. This is not a £/m² estimate because floor-area data is not currently available."

5. **No Stitch demo branding.** Do not use "The Invisible Estate" name, copy, or assets.
6. **Choropleth colour scale overrides Stitch colours.** The Stitch screen uses bright green-500 / yellow-400 / red-500. These are **replaced** by the brand-aligned scale defined in Section 4.

---

## 1. Design Tokens

### 1.1 Colours

All token names reference `src/app/globals.css` `@theme inline` block.

#### Brand colours (from globals.css)

| Token | Hex | Usage |
|---|---|---|
| `--color-brand-primary` | `#1B4D3E` | Primary brand green; map UI chrome, panel headers, CTAs |
| `--color-brand-primary-dark` | `#003629` | Deepest green; strong emphasis text, active states |
| `--color-brand-primary-light` | `#2D7A5F` | Lighter green; hover states, secondary actions |
| `--color-brand-primary-lighter` | `#E8F5EE` | Tint green; hover backgrounds, accent surfaces |
| `--color-brand-secondary` | `#A07D2E` | Warm gold text; secondary labels |
| `--color-brand-gold` | `#FDCD74` | Gold surface; badges, highlights from Stitch Material-3 palette |
| `--color-brand-gold-foreground` | `#7B5804` | Text on gold surfaces |

#### Neutral palette (from globals.css)

| Token | Hex | Usage |
|---|---|---|
| `--color-neutral-950` | `#0A0A0B` | Body text (darkest) |
| `--color-neutral-800` | `#2E2E33` | Secondary text |
| `--color-neutral-700` | `#46464F` | Muted text |
| `--color-neutral-500` | `#7A7A88` | Placeholder / disabled |
| `--color-neutral-300` | `#C4C4CE` | Dividers |
| `--color-neutral-200` | `#E2E2E8` | Borders (`--color-border`) |
| `--color-neutral-100` | `#F1F1F5` | Muted backgrounds |
| `--color-neutral-50` | `#F8F8FA` | Page / panel background |

#### Semantic colours (from globals.css)

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#16A34A` | Positive change indicators |
| `--color-warning` | `#CA8A04` | Caution indicators |
| `--color-error` | `#DC2626` | Destructive / errors only |

#### Restricted tokens

- `--color-brand-accent` (`#2563EB`) — **reserved for charts and error states only**. Must NOT be used for map price colours, choropleth fills, or any part of the price legend.
- `--color-info` (`#2563EB`) — same restriction. No blue in the price colour scale.

#### Choropleth price scale colours (defined here, NOT in globals.css)

These are the canonical hex values for the 9-bucket price scale. See Section 4 for full specification.

| Role | Hex | Name |
|---|---|---|
| Lower price (bucket 1) | `#2D5A3D` | Brand forest green |
| Middle price (bucket 5) | `#C9A84C` | Muted gold |
| Higher price (bucket 9) | `#6B1A1A` | Deep burgundy |
| Insufficient data | `#9E9EAB` | Neutral grey (maps to `--color-neutral-500`) |

### 1.2 Typography

Source: Stitch export + globals.css `@theme inline`.

| Role | Font family | Token |
|---|---|---|
| Body / labels / filter text | Inter | `--font-sans` → `var(--font-inter)` |
| Headings / panel titles / card names | Plus Jakarta Sans | `--font-heading` → `var(--font-plus-jakarta-sans)` |

Type scale for map UI (not full app scale — map-specific):

| Element | Size | Weight | Font |
|---|---|---|---|
| Panel section title | `text-base` (16px) | `font-bold` (700) | Plus Jakarta Sans |
| Filter label | `text-sm` (14px) | `font-medium` (500) | Inter |
| Filter sub-label / hint | `text-xs` (12px) | `font-normal` (400) | Inter |
| Map tooltip price | `text-sm` (14px) | `font-bold` (700) | Inter |
| Map tooltip label | `text-xs` (10px) | `font-bold` (700) | Inter (uppercase tracked) |
| Legend label | `text-[10px]` | `font-bold` (700) | Inter (uppercase, wide tracking) |
| Legend price markers | `text-[11px]` | `font-bold` (700) | Inter |
| Summary card title | `text-xs` (12px) | `font-bold` (700) | Inter (uppercase, wide tracking) |
| Summary card value | `text-lg` (18px) | `font-bold` (700) | Plus Jakarta Sans |
| Summary card sub-value | `text-[10px]` | `font-medium` (500) | Inter |
| Area tooltip title | `text-sm` (14px) | `font-bold` (700) | Plus Jakarta Sans |
| Area tooltip body | `text-xs` (12px) | `font-normal` (400) | Inter |
| Disclaimer | `text-[10px]` | `font-normal` (400) | Inter |
| Property card title | `text-sm` (14px) | `font-bold` (700) | Plus Jakarta Sans |
| Property card price | `text-sm` (14px) | `font-bold` (700) | Inter |

### 1.3 Spacing

Follows Tailwind v4 defaults (4px base unit). Map-specific conventions:

| Context | Value | Tailwind class |
|---|---|---|
| Filter panel internal padding | 24px | `p-6` |
| Filter panel gap between sections | 32px | `gap-y-8` |
| Filter item padding | 12px vertical / 16px horizontal | `py-3 px-4` |
| Filter item inner gap | 12px | `gap-3` |
| Legend pill horizontal padding | 24px | `px-6` |
| Legend pill vertical padding | 12px | `py-3` |
| Legend pill gap between elements | 24px | `gap-6` |
| Map UI controls gap | 8px | `gap-2` |
| Map controls from edge | 24px | `right-6 top-6` |
| Tooltip pill horizontal padding | 12px | `px-3` |
| Tooltip pill vertical padding | 6px | `py-1.5` |
| Summary card padding | 16px | `p-4` |
| Summary card inner gap | 16px | `gap-4` |
| Property card bottom strip gap | 24px | `gap-6` |
| Property card image height | 192px | `h-48` |
| Property card content padding | 20px | `p-5` |

### 1.4 Border Radius

From globals.css `@theme inline`:

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Chip / badge inner radius |
| `--radius-md` | `8px` | Filter item rows, map controls, property cards |
| `--radius-lg` | `12px` | Summary card, area tooltip card |
| `--radius-xl` | `16px` | Summary card on desktop, property cards |
| `--radius-4xl` | `9999px` | Legend pill, tooltip pills, area label badges |

### 1.5 Shadows

From globals.css `@theme inline`:

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)` | Filter item active/selected state |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)` | Map controls, tooltip pills |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.03)` | Legend pill, summary card |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.03)` | Property cards on hover |

### 1.6 Surface Treatment

| Surface | Background | Treatment |
|---|---|---|
| Filter panel | `--color-neutral-50` (#F8F8FA) | No blur; solid; sticky |
| Legend pill | `rgba(255,255,255,0.90)` | `backdrop-blur-sm`; border `rgba(255,255,255,0.20)` |
| Map controls (zoom/locate) | `#FFFFFF` | Solid white; `--shadow-md` |
| Tooltip pill (sold price) | `#FFFFFF` | Solid white; `--shadow-md`; border `--color-brand-primary` when primary, `--color-neutral-200` when secondary |
| Area label badge | `var(--color-brand-primary-dark)` | Solid; white text; pill shape |
| Summary / market card | `--color-neutral-100` (#F1F1F5) | Solid; `--radius-xl` |
| Area tooltip detail card | `#FFFFFF` | Solid; `--shadow-lg`; `--radius-lg` |
| Property cards | `#FFFFFF` | Solid; `--shadow-lg`; `--radius-xl` |
| Page background / map canvas | `--color-neutral-200` | Simulated map base while tiles load |

---

## 2. Typography System Summary

Two fonts only:
- **Inter** — all body, label, and data text
- **Plus Jakarta Sans** — all headings, panel titles, card names

Do not introduce additional typefaces. The Stitch screen confirms this pairing. Fonts are loaded via Next.js `next/font`.

---

## 3. Filter Panel

### 3.1 Layout

- **Desktop (≥ 1024px):** Fixed-width left panel, `w-80` (320px), full viewport height, sticky, scrollable internally, sits left of the map canvas.
- **Mobile (< 768px) / Tablet (768px–1023px):** Collapses to a bottom sheet using the app's existing `vaul` drawer component. A "Filters" pill button floats above the map to open the sheet.

### 3.2 Filters

The filter panel contains exactly these controls:

#### Property Type

Chip group — single select. Options:

| Value | Label |
|---|---|
| `all` | All types |
| `detached` | Detached |
| `semi-detached` | Semi-detached |
| `terraced` | Terraced |
| `flat` | Flat / apartment |

Default: `all`.

#### Date Window

Chip group or dropdown — single select. Options:

| Value | Label |
|---|---|
| `12m` | Last 12 months |
| `24m` | Last 24 months |
| `36m` | Last 3 years |
| `5y` | Last 5 years |

Default: `24m`.

#### Metric

Dropdown — single select. Options:

| Value | Label |
|---|---|
| `median` | Median sold price |

Default: `median`. Only one option is available (floor-area metrics are excluded). The dropdown exists so the option can be extended without a redesign, but must not show placeholder or stub options.

#### Scale

Toggle or chip group — single select. Controls whether choropleth buckets are computed relative to the local area visible on screen or against the national distribution.

| Value | Label |
|---|---|
| `local` | Local |
| `national` | National |

Default: `national`.

### 3.3 Excluded Filters (CRITICAL)

The following filters present in the Stitch screen are **not implemented**:

- ~~Square Footage~~ — No floor-area data available.
- ~~Price Range slider~~ — Not a filter for the choropleth view (price range is represented by the colour scale, not a filter).
- ~~Bedrooms~~ — Not applicable to the sold-price choropleth.
- ~~Amenities~~ — Not applicable.

If the product adds floor-area data in a future phase, a "Price per m²" metric option may be added to the Metric dropdown, but it must NOT be shown until the data is available.

### 3.4 Filter Panel Anatomy (Desktop)

```
┌─────────────────────────────┐
│ Filters              [×]    │  ← section title (Plus Jakarta Sans, bold)
│ Refine the price map        │  ← sub-label (Inter, sm, neutral-500)
├─────────────────────────────┤
│ Property Type               │
│ [All] [Detached] [Semi] … │
├─────────────────────────────┤
│ Date Window                 │
│ [12m] [24m] [36m] [5y]     │
├─────────────────────────────┤
│ Metric                      │
│ [Median sold price ▾]       │
├─────────────────────────────┤
│ Scale                       │
│ [Local] [National]          │
├─────────────────────────────┤
│                             │
│  ───  Market Insight  ───   │  ← see Section 6
│                             │
├─────────────────────────────┤
│ [  Apply Filters  ]         │  ← primary CTA; brand-primary bg
└─────────────────────────────┘
```

### 3.5 Filter Item States

| State | Background | Text | Border/Shadow |
|---|---|---|---|
| Default | transparent | `neutral-700` | none |
| Hover | `brand-primary-lighter` | `brand-primary-dark` | none |
| Active/selected | `#FFFFFF` | `brand-primary` | `shadow-sm`; `border-brand-primary` 1px |
| Disabled | transparent | `neutral-400` | none; cursor-not-allowed |

Transition: `transition-all 300ms cubic-bezier(0.22, 1, 0.36, 1)` (matches Stitch `gentle-slide`).

---

## 4. Choropleth Colour Scale

### 4.1 Rationale

The scale encodes median sold price relative to either the local visible area or the national distribution (per the Scale filter). The colour semantics are intentionally NOT the traffic-light / heatmap cliché:

- **Green** = accessible / lower relative price (positive connotation — value opportunity)
- **Gold** = mid-range (worth considering)
- **Burgundy** = premium / higher relative price (not a danger signal — quality end of market)

This avoids alarming colour associations at the high end and aligns with the brand's green-primary palette.

### 4.2 Nine-Bucket Scale

| Bucket | Percentile range | Fill colour | Hex | Label |
|---|---|---|---|---|
| 1 | 0–11th | Forest green | `#2D5A3D` | Lowest relative price |
| 2 | 11–22nd | — | `#4A7A52` | — |
| 3 | 22–33rd | — | `#7A9E6A` | — |
| 4 | 33–44th | — | `#B5C48A` | — |
| 5 | 44–56th | Muted gold | `#C9A84C` | Middle relative price |
| 6 | 56–67th | — | `#C08A3A` | — |
| 7 | 67–78th | — | `#A06030` | — |
| 8 | 78–89th | — | `#8B3A28` | — |
| 9 | 89–100th | Deep burgundy | `#6B1A1A` | Highest relative price |

Bucket stops are linear interpolations between anchor points 1 (`#2D5A3D`), 5 (`#C9A84C`), and 9 (`#6B1A1A`).

**Insufficient data bucket:**
- Condition: fewer than 5 registered transactions in the area and date window.
- Fill: `#9E9EAB` (maps to `--color-neutral-500`).
- Opacity: 50% to distinguish visually from full-confidence areas.
- Legend: Grey swatch labelled "Insufficient data (< 5 transactions)".

### 4.3 Fill Opacity

| State | Opacity |
|---|---|
| Default (unselected area) | 65% |
| Hover | 80% |
| Selected / active | 90% |
| Insufficient data | 50% |

### 4.4 Area Stroke

| State | Stroke colour | Stroke width |
|---|---|---|
| Default | `rgba(255,255,255,0.4)` | 0.5px |
| Hover | `rgba(255,255,255,0.9)` | 1.5px |
| Selected | `#FFFFFF` | 2px |

### 4.5 Colour-Blindness Considerations

The green→gold→burgundy scale may be difficult to distinguish for deuteranopia / protanopia users. Mitigation:
- All choropleth areas render with a text label badge (area name) on hover/select.
- The area tooltip shows the numeric median price — colour is supplementary, not the sole information channel.
- A "Show labels" toggle in the filter panel can overlay price bucket numbers on areas.

---

## 5. Legend

### 5.1 Position

Horizontally centred at the top of the map canvas, `top-6`, floating above the map layer. `z-30`.

### 5.2 Anatomy

```
┌─────────────────────────────────────────────────────┐
│  Median sold price  [■■■■■■■■■]  £nnn,nnn  £n.nm  │
│                     green→gold→burgundy gradient     │
└─────────────────────────────────────────────────────┘
```

Pill shape (`--radius-4xl`). Background `rgba(255,255,255,0.90)` + `backdrop-blur-sm`. `--shadow-xl`.

### 5.3 Content Specification

Left of gradient bar:
- Label: **"Median sold price"** (NOT "Price per sq ft", NOT "£/m²")
- Font: Inter, 10px, bold, uppercase, wide tracking

Gradient bar:
- `w-48 h-2`, `--radius-4xl`, no overflow
- CSS: `background: linear-gradient(to right, #2D5A3D, #C9A84C, #6B1A1A)`
- NOT the Stitch green-500 / yellow-400 / red-500 colours

Right of gradient bar:
- Left anchor price: lowest median in visible area / national bucket floor (e.g. `£nnn,nnn`)
- Right anchor price: highest median (e.g. `£n.nm`)
- Font: Inter, 11px, bold, `--color-brand-primary-dark`
- Separator between values: `|` in `--color-neutral-300`

### 5.4 Legend Key Labels (Tooltip on hover)

When the user hovers the legend pill, expand to show swatch labels:

| Swatch | Colour | Label |
|---|---|---|
| Left end | `#2D5A3D` | Lower median sold price |
| Centre | `#C9A84C` | Middle range |
| Right end | `#6B1A1A` | Higher median sold price |
| Separate | `#9E9EAB` 50% | Insufficient data |

### 5.5 Disclaimer Placement

The mandatory disclaimer text appears directly below the legend pill, centred, in `text-[10px]` Inter, `--color-neutral-500`:

> "Based on registered sold-price transactions. This is not a £/m² estimate because floor-area data is not currently available."

On mobile, the disclaimer moves to the top of the bottom sheet filter panel.

---

## 6. Summary / Market Insight Card

Shown in the bottom of the filter panel (desktop) or in the sheet header area (mobile). Surfaces aggregate stats for the currently visible map extent or the selected area.

### 6.1 Fields

| Field | Label | Format |
|---|---|---|
| Selected area | "Area" | Text (e.g. "Greater London", "SW1A") |
| Median sold price | "Median price" | `£n,nnn,nnn` |
| Transaction count | "Transactions" | `n,nnn` |
| Confidence level | "Confidence" | "High / Medium / Low" (based on transaction count: ≥30 High, 10–29 Medium, 5–9 Low, <5 Insufficient) |
| Data period | "Period" | e.g. "Jan 2023 – Dec 2024" |

### 6.2 Layout

```
┌──────────────────────────────┐
│  MARKET INSIGHT              │  ← uppercase label, xs, neutral-400, wide tracking
├──────────────────────────────┤
│  Median price                │  ← xs, neutral-500
│  £485,000         ↑ 12.4%  │  ← lg, bold, brand-primary-dark / success
│  ─────────────────────────  │
│  Transactions                │
│  2,841                       │
│  ─────────────────────────  │
│  Confidence                  │
│  High                        │
│  ─────────────────────────  │
│  Period                      │
│  Jan 2023 – Dec 2024         │
└──────────────────────────────┘
```

Background: `--color-neutral-100`. Radius: `--radius-xl`. Padding: `p-4`. Gap between rows: `gap-4`.

---

## 7. Sold Price Tooltip Pill (Map Pin)

Shown on the map when a specific sold transaction is highlighted (e.g. from search results or a pinned address).

### 7.1 Anatomy

```
[ £2.4M  Sold Mar 2024 ]
  ↓ (stem line)
```

Pill: white background, `border-2 border-brand-primary` for primary pin, `border border-neutral-200` for secondary. `--shadow-md`. Radius `--radius-4xl`.

Content:
- Price: `text-sm font-bold text-brand-primary-dark`
- Date label: `text-[9px] font-bold uppercase bg-brand-primary-lighter text-brand-primary` rounded badge inside the pill

Stem: `w-[2px] h-4 bg-brand-primary mx-auto -mt-0.5`

Hover: `scale-110` transform, transition 300ms ease-out.

---

## 8. Area Label Badge

Shown on the map canvas to identify named areas (districts, postcodes, neighbourhoods).

- Shape: pill (`--radius-4xl`)
- Background: `var(--color-brand-primary-dark)` (#003629)
- Text: white, `text-[10px]` Inter, `font-bold`, uppercase, `tracking-wider`
- Padding: `px-3 py-1`
- Appears at appropriate zoom levels; fades in/out based on zoom threshold

---

## 9. Area Detail Tooltip / Card

Shown when the user clicks or taps a choropleth area. On desktop: popover anchored near the click point. On mobile: expands as a bottom sheet section above the filter controls.

### 9.1 Fields

| Field | Label | Format / Notes |
|---|---|---|
| Area name | — | `text-sm font-bold` Plus Jakarta Sans, `text-brand-primary-dark` |
| Median sold price | "Median sold price" | `£n,nnn,nnn`, bold |
| Transaction count | "Transactions" | `n,nnn in [date window]` |
| Date window | "Period" | e.g. "Last 24 months" |
| Property type mix | "Type breakdown" | Mini bar or percentage list: Detached n%, Semi n%, Terraced n%, Flat n% |
| Confidence level | "Confidence" | "High / Medium / Low" with colour dot (success / warning / neutral) |
| Scale | "Scale" | "Local" or "National" |
| P10 price | "Lower decile" | `£n,nnn,nnn` |
| P90 price | "Upper decile" | `£n,nnn,nnn` |

### 9.2 Layout

```
┌───────────────────────────────────┐
│ Kensington & Chelsea       [×]    │  ← area name + close
│ ─────────────────────────────── │
│ Median sold price                 │
│ £1,250,000                        │
│ ─────────────────────────────── │
│ Transactions      2,841           │
│ Period            Last 24 months  │
│ Scale             National        │
│ Confidence        High  ●         │
│ ─────────────────────────────── │
│ Price range (P10 – P90)          │
│ £480,000 ──────────── £3,200,000  │
│ ─────────────────────────────── │
│ Property type mix                 │
│ Flat 62%  Terraced 21%  ...       │
│ ─────────────────────────────── │
│ ⓘ Based on registered sold-price │
│   transactions. This is not a    │
│   £/m² estimate because floor-   │
│   area data is not currently     │
│   available.                      │
└───────────────────────────────────┘
```

Surface: `#FFFFFF`. Radius: `--radius-lg`. Shadow: `--shadow-lg`. Max width desktop: `320px`.

---

## 10. Responsive Rules

### Breakpoints (from globals.css)

| Token | Value | Named in globals.css |
|---|---|---|
| `xs` | 375px | `--breakpoint-xs` |
| `sm` | 640px | Tailwind default |
| `md` | 768px | Tailwind default |
| `lg` | 1024px | Tailwind default |
| `xl` | 1280px | Tailwind default |
| `2xl` | 1536px | Tailwind default |

Additionally, design and test at 320px (smallest supported width) and 1440px (design reference).

### Breakpoint behaviour

| Viewport | Filter panel | Legend | Property cards | Area tooltip |
|---|---|---|---|---|
| 320–374px | `vaul` bottom sheet, full-width | Pill, condensed (price only, no labels) | Hidden (swipeable sheet) | Bottom sheet section |
| 375–767px | `vaul` bottom sheet, full-width | Pill, condensed | Horizontal scroll strip, 280px cards | Bottom sheet section |
| 768–1023px | `vaul` bottom sheet, 480px wide | Full pill | Horizontal scroll strip, 320px cards | Anchored popover or sheet |
| 1024–1439px | Fixed left panel, `w-80` | Full pill centred | Horizontal scroll strip at bottom | Anchored popover |
| 1440px+ | Fixed left panel, `w-80` | Full pill centred | Horizontal scroll strip at bottom | Anchored popover |

### Bottom sheet (mobile filter panel)

Uses `vaul` `Drawer` component (already in the app's dependency tree). The sheet:
- Opens via a floating "Filters" pill button on the map (`position: fixed`, bottom `env(safe-area-inset-bottom)` + 80px)
- Has a drag handle at the top
- Snap points: `[0.4, 0.95]` — partial reveal shows active filters; full reveal shows all controls
- Background: `--color-neutral-50`, same as desktop panel
- Does NOT cover the map legend pill

### Safe area

Apply `pb-safe` (from globals.css) to the bottom of the filter sheet and the property card strip on notched devices.

---

## 11. Screen Definitions

### Screen 1 — National Search Price Map

**Route:** `/search/map`  
**Purpose:** Allow any visitor to explore median sold prices across the UK at scale. Entry point from the main search with "Map view" toggle.

#### Layout structure (desktop)

```
┌────────────────────────────────────────────┐
│  [Header / Nav]                            │  z-50
├──────────┬─────────────────────────────────┤
│ Filter   │ Map canvas                      │
│ panel    │                                 │
│ (320px)  │   [Legend pill, centred top]    │
│          │                    [Controls]   │
│          │                                 │
│ ─────── │   [Area badges]                 │
│ Market   │                                 │
│ Insight  │   [Sold price tooltip pills]    │
│ card     │                                 │
│          ├─────────────────────────────────┤
│ [Apply]  │  Property card strip (bottom)   │
└──────────┴─────────────────────────────────┘
```

#### Data layers

1. Choropleth layer: postcode district or LSOA polygons coloured by median sold price bucket
2. Sold price tooltip pins: top N recent transactions in the visible extent (max 50 pins)
3. Area label badges: district/area names at appropriate zoom levels

#### Initial state

- Map centred on the user's searched location or UK centroid (52.5°N, -1.5°W) at zoom 6
- Scale filter: `national`
- Date window: `24m`
- Property type: `all`

#### URL state

Persist in search params: `?zoom=`, `?lat=`, `?lng=`, `?type=`, `?window=`, `?scale=`, `?metric=`

---

### Screen 2 — Area Price Explorer

**Route:** `/search/market-map/:areaId`  
**Purpose:** Deep-dive into a single area (postcode district, ward, borough). Shows the choropleth zoomed to the area, the area detail card, and the property card strip filtered to that area.

#### `areaId` format

String identifier, e.g. `SW1A`, `kensington-and-chelsea`, `E01000001` (LSOA code). API resolves to the correct polygon.

#### Layout structure (desktop)

Same as Screen 1 with these differences:
- Map auto-zoomed and bounded to the selected area
- Area detail card rendered by default (not on click — it's the primary content)
- Filter panel shows the area name in the header: "Exploring: **Kensington & Chelsea**"
- Breadcrumb above the panel: `Search > Map > Kensington & Chelsea`

#### Back navigation

"← Back to map" link returns to Screen 1 preserving the previous map state via URL params.

---

## 12. Map Controls (Zoom / Locate)

Positioned `right-6 top-6`, `z-30`, stacked vertically with `gap-2`.

| Control | Icon | Action |
|---|---|---|
| Zoom in | `+` | MapLibre `map.zoomIn()` |
| Zoom out | `-` | MapLibre `map.zoomOut()` |
| (spacer) | — | `mt-4` gap |
| My location | crosshair / locate icon | `navigator.geolocation.getCurrentPosition` → fly to |

Each control: `bg-white`, `p-3`, `--radius-md`, `--shadow-lg`, hover `bg-neutral-50`, `text-brand-primary-dark`. Min size `44px × 44px` (WCAG 2.5.5 touch target, `touch-target` class from globals.css).

---

## 13. Property Card Strip (Bottom)

Horizontal scroll strip pinned to the bottom of the map canvas. Shows for-sale listings or sold comparables in the current map extent.

### 13.1 Card size

- Width: `320px` (`w-80`), flex-shrink-0
- Image height: `192px` (`h-48`), `object-cover`
- Content padding: `p-5`
- Radius: `--radius-xl`
- Shadow: `--shadow-lg`, hover `--shadow-xl` + `-translate-y-2`

### 13.2 Card content

```
┌──────────────────────────────┐
│  [Property photo]             │
│  [Badge: Certified / New]     │
├──────────────────────────────┤
│ Property name          £price │
│ ───────────────────────────  │
│ N Beds  N Baths  (no sq ft)   │
└──────────────────────────────┘
```

**No "sq ft" displayed on cards in this feature** — floor-area data is not available. If the underlying listing record has floor area, it may be shown for individual property listings, but not in the sold-price map context.

### 13.3 Strip header

```
[ N results in "[Area Name]"  ]
```

Pill: `bg-brand-primary-dark`, white text, `px-5 py-2`, `--radius-4xl`, uppercase, `text-xs font-bold tracking-widest`.

---

## 14. Motion and Transitions

| Element | Transition | Duration | Easing |
|---|---|---|---|
| Filter items hover/select | all | 300ms | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Property card hover lift | transform, shadow | 300ms | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Tooltip pill hover scale | transform | 300ms | ease-out |
| Bottom sheet open/close | handled by `vaul` | — | — |
| Choropleth area hover | fill-opacity (via MapLibre paint) | 150ms | linear |
| Map controls hover | background | 150ms | ease |
| Legend pill expand (hover) | height, opacity | 200ms | ease-out |

### Reduced motion

All CSS transitions must be wrapped in or respect:

```css
@media (prefers-reduced-motion: reduce) {
  /* transitions suppressed via globals.css rule */
}
```

MapLibre `flyTo` / `easeTo` calls: set `duration: 0` when `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

---

## 15. Accessibility

| Requirement | Implementation |
|---|---|
| WCAG 2.5.5 touch targets | `touch-target` class (44×44px min) on all interactive elements |
| Focus ring | `focus-ring` class from globals.css (`outline: 2px solid #2563EB; outline-offset: 2px`) |
| Filter panel keyboard nav | Tab order follows visual order; chip groups use `role="group"` + `role="radio"`/`role="checkbox"` |
| Map choropleth | Non-interactive decorative layer; data conveyed via area tooltip and summary card |
| Colour-blind mitigation | See Section 4.5; numeric labels and tooltips supplement colour |
| Reduced motion | See Section 14 |
| Screen reader | Legend pill has `aria-label="Price map legend: green is lower median sold price, burgundy is higher median sold price"` |
| Disclaimer | Rendered as visible text, not `aria-label` only |

---

## 16. Data Contract Notes (for API implementors)

These are the fields DESIGN.md requires the API to return. Full API spec is in a separate task.

### Choropleth area response (per area polygon)

```ts
{
  areaId: string;          // e.g. "SW1A", "E01000001"
  areaName: string;        // display name
  medianSoldPrice: number; // pence (render as £)
  transactionCount: number;
  priceBucket: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null; // null = insufficient data
  p10Price: number;        // pence
  p90Price: number;        // pence
  dateWindow: string;      // e.g. "2023-01-01/2024-12-31"
  propertyTypeMix: {
    detached: number;      // 0–1 fraction
    semiDetached: number;
    terraced: number;
    flat: number;
    other: number;
  };
  confidenceLevel: "high" | "medium" | "low" | "insufficient";
  scale: "local" | "national";
}
```

### Sold price pin response (per transaction pin)

```ts
{
  transactionId: string;
  price: number;           // pence
  soldDate: string;        // ISO date
  propertyType: string;
  lat: number;
  lng: number;
}
```

**Neither response object includes floor area, price per square foot, or price per m².** If this data is added in a future phase, it must go through a separate schema addition with its own design review.

---

## 17. What This Document Does NOT Define

- The specific MapLibre GL JS layer configuration (tile source URLs, layer IDs, paint expressions) — covered in the component implementation task.
- The Supabase schema / migration for sold price data — covered in the API task.
- The `vaul` drawer integration specifics — follow the existing app pattern.
- The property card component internals beyond what is shown above — the existing `PropertyCard` component may be reused.
- Authentication / RLS for the sold price data — covered in the API task.
