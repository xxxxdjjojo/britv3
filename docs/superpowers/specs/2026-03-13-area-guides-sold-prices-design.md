# Area Guides & Sold Prices — FAANG-Quality Redesign Spec

**Date:** 2026-03-13
**Status:** Approved
**Design reference:** Stitch project `5956704101394866719` — screens City Area Guide London, Neighbourhood Guide TW7, Area Stats Dashboard (×2), Sold Prices Individual Property

---

## Overview

Full replacement of four existing page stubs plus a footer update, bringing Britestate's area discovery and sold-price data surfaces to FAANG quality. All pages are Next.js Server Components with SSR data from Supabase, using the Britestate design system (Plus Jakarta Sans headings, Inter body, `#1B4D3E` brand-primary).

---

## Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Area Stats Dashboard placement | Tab within Neighbourhood Guide | Keeps user in context; avoids separate route |
| Sold prices individual property | Deep-linkable SSR route `/sold-prices/[area]/[slug]` | Fast load, shareable URL |
| Expert sidebar data source | Real agent from DB — highest-rated verified agent covering postcode district | Drives actual leads |
| Footer area guide links | New "Area Guides" column in existing footer | SEO value, consistent with Rightmove/Zoopla pattern |
| Implementation approach | Full page replacement (Approach A) | Existing pages are stubs; clean slate produces higher quality |

---

## Routes & Files

| Route | File | Type |
|---|---|---|
| `/areas/[city]` | `src/app/(main)/areas/[city]/page.tsx` | Server Component — full replacement |
| `/areas/[city]/[area]` | `src/app/(main)/areas/[city]/[area]/page.tsx` | Server Component — full replacement |
| `/sold-prices/[area]/[slug]` | `src/app/(main)/sold-prices/[area]/[slug]/page.tsx` | Server Component — new route |
| Footer | `src/components/layout/Footer.tsx` | Edit — add Area Guides column |

---

## Design System Tokens (applied throughout)

```
Font headings:  Plus Jakarta Sans, weight 700
Font body:      Inter, weight 400–500
brand-primary:  #1B4D3E  (deep forest green)
brand-secondary:#D4A853  (warm gold)
brand-accent:   #2563EB  (action blue)
neutral-50:     #F8F8FA  (page background)
white cards:    bg-white shadow-sm border border-primary/10 rounded-xl
radius-lg:      12px
radius-xl:      16px
radius-2xl:     24px
```

---

## Page 1: City Area Guide — `/areas/[city]`

### Data fetched (server-side)
- City metadata: name, description, avg price, YoY change, listing count, avg days to sell
- Top 4 boroughs by search volume: name, avg price, image
- 3 featured properties for sale in this city
- Transport overview (static per city or from DB)

### Layout

#### Sticky Navigation
- Britestate logo in `brand-primary`
- Nav links: Buy / Rent / Sell / Guides (Guides active + underline)
- Rounded-full search input `bg-primary/5`
- User avatar

#### Hero (70vh minimum)
- Full-width cityscape `next/image` with `priority` and blur placeholder
- Gradient overlay: `bg-gradient-to-t from-primary/80 via-primary/20 to-transparent`
- Breadcrumb: `Guides / United Kingdom / [City]` in `text-white/80`
- H1: city name, Plus Jakarta Sans 700, 60px desktop / 40px mobile, `text-white`
- Subtitle in `text-white/90`
- Floating compact search bar at hero bottom: `bg-white rounded-2xl shadow-xl px-6 py-4`, location input + green Search button

#### Stats Bar (3 cards)
- Each: `bg-white rounded-xl shadow-sm border border-primary/5 p-6`
- Label: `text-sm text-neutral-500`
- Value: `text-3xl font-bold text-primary` (e.g. £725,480)
- YoY badge: `text-emerald-600 font-bold flex items-center gap-1` with trending-up icon

#### 5-Year Price Trend Card
- `bg-white rounded-xl shadow-sm border border-primary/5 p-8`
- Title + subtitle
- Property type toggle pills: All / Flat / Terraced — active pill `bg-primary/10 text-primary font-bold`
- Recharts `AreaChart`: line `stroke="#1B4D3E"`, area fill `fill="url(#gradient)"` with `#1B4D3E` at 20% opacity fading to 0%
- Year labels below axis in `text-xs text-neutral-400 uppercase tracking-widest`

#### Popular Boroughs (4-col grid)
- Section heading + "View all X boroughs →" link in `text-primary font-bold`
- Each card: `border border-primary/10 bg-white rounded-xl p-4 hover:shadow-md transition-all`
- Image: `h-24 w-full rounded-lg overflow-hidden` with `group-hover:scale-110 transition-transform`
- Borough name: `font-bold`
- Avg price: `text-sm text-neutral-500`

#### Properties For Sale (3-col grid)
- Heading + "Filter" button `border border-primary/20`
- Each card: `overflow-hidden rounded-xl border border-primary/5 bg-white shadow-sm hover:shadow-lg transition-all`
- Image: 16:10 aspect ratio, `object-cover`
- "Premium" badge: `absolute top-3 right-3 bg-white/90 text-primary text-xs font-bold px-3 py-1 rounded-full`
- Price: `text-lg font-bold`
- Save heart button: `text-primary/40 hover:text-rose-500`
- Feature row: bed / bath / sqft with Lucide icons, `text-xs text-neutral-500`
- CTA button: `bg-primary text-white rounded-full px-8 py-3 font-bold hover:scale-105 transition-transform`

#### Transport & Connectivity (full-width)
- `bg-primary text-white p-8 lg:p-12 rounded-xl`
- 2-col layout: description + transport type cards (Tube, Elizabeth Line) in `bg-white/10 border border-white/10 rounded-lg p-4`
- Commute times: list with route + time + `bg-white/10 rounded-full h-1` progress bar

#### Local Services (6-icon grid)
- Each: `bg-white rounded-xl p-6 shadow-sm border border-primary/5 hover:border-primary transition-all group`
- Icon container: `h-12 w-12 rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors`
- Label: `text-sm font-bold`

### SEO Metadata
```ts
export const metadata: Metadata = {
  title: `Properties in ${city} | Britestate Area Guide`,
  description: `Explore ${city} property market data, prices, schools and transport.`,
  alternates: { canonical: `/areas/${city}` },
}
```

---

## Page 2: Neighbourhood Guide — `/areas/[city]/[area]`

### Data fetched (server-side)
- Area metadata: name, postcode district, borough, description, green space %, walkability, noise level
- Highest-rated verified agent covering this postcode (query agents table by service_area JSONB containing postcode district, order by rating DESC, limit 1)
- 4 current listings in this postcode district (price, status, address, beds, baths, image)
- Local favourites (3 POIs from DB or static per area)
- Demographic snapshot (from static data or Land Registry API)

### Layout

#### Breadcrumb
`Home / Area Guides / [City] / [Area]` — `text-sm text-neutral-500`

#### Hero — Split Layout (2-col on desktop, stacked mobile)

**Left column:**
- Borough badge pill: `bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full`
- H1: "Life in [Postcode] — [Area Name]", Plus Jakarta Sans 900, 56px desktop / 36px mobile, `text-neutral-900`
- Subtitle: `text-lg text-neutral-600 leading-relaxed max-w-lg`
- 3 mini stat cards in a row: each `bg-white border border-neutral-100 shadow-sm rounded-xl p-4 min-w-[140px]`
  - Value: `text-primary font-bold text-2xl`
  - Label: `text-neutral-500 text-xs font-medium uppercase tracking-tight`
  - Values: Green Space 92% / Walkability High / Noise Quiet

**Right column:**
- `relative h-[400px] rounded-2xl overflow-hidden shadow-xl border-4 border-white`
- MapTiler map centred on postcode district with `brand-primary` property pin markers
- Backdrop-blur overlay at map bottom: `bg-white/90 backdrop-blur-md p-3 rounded-lg flex justify-between items-center`
  - Left: location icon + "[Postcode] Boundary Overview"
  - Right: "Interactive Map" button `bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold`

#### Tab Bar
5 tabs: Overview | Market Data | Transport | Schools | Lifestyle
Active tab: `border-b-2 border-primary text-primary font-bold`
Tabs are client-side tab-switcher (`"use client"`); each tab's content is pre-rendered server-side and shown/hidden via CSS.

---

### Tab 1: Overview

#### Local Favourites (3-col grid)
- Each card: `bg-white border border-neutral-100 rounded-xl p-4 hover:shadow-md transition-shadow`
- Coloured icon (green park, orange café, blue school)
- Bold title, muted description

#### Demographic Snapshot
- `bg-primary/5 border border-primary/10 rounded-2xl p-8`
- 4-col grid: Top Group / Median Age / Ownership / Vibe
- Label: `text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1`
- Value: `text-neutral-900 font-bold`

#### Expert Sidebar (sticky, right column)
- `sticky top-8 bg-white border border-primary/10 rounded-2xl shadow-sm p-6`
- Agent avatar: `size-16 rounded-full border-2 border-primary/20` with `bg-green-500 size-4 rounded-full border-2 border-white` online dot
- Name: `text-lg font-bold`
- Role: `text-sm text-primary font-semibold` e.g. "TW7 Specialist"
- Quote: `text-sm text-neutral-600 italic`
- "Speak to [Name]" button: `w-full bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2`
- "Book a Viewing" button: `w-full border border-primary/20 text-primary font-bold py-3 rounded-xl`
- **Data:** Query `agents` table, join `profiles`, where postcode district is in `service_area`, order by `avg_rating DESC`, limit 1. Falls back to generic "Speak to a local expert" CTA routing to `/marketplace?area=[postcode]` if no agent found.

#### Property Listings (4-col grid)
- Each: `bg-white rounded-xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-md transition-shadow`
- Image: `h-40 bg-cover bg-center relative`
- Status badge: `absolute top-2 left-2 bg-white/90 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase`
- Price: `text-primary font-bold text-lg`
- Address: `font-semibold text-sm truncate`
- Feature row: bed / bath / sqft `text-neutral-500 text-xs`

#### Newsletter CTA
- `rounded-3xl bg-primary text-white p-10 md:p-16 text-center relative overflow-hidden`
- Decorative circles: `absolute` positioned `bg-white/5 rounded-full`
- Email input + "Join the Waitlist" `bg-white text-primary font-bold rounded-xl`

---

### Tab 2: Market Data

This is the Area Stats Dashboard (Stitch screen `ee4b83e958af4de1b3ac21fcab7ab8e3` / `2c4c572a831b404591eb5cada196b072`).

**Main column (2/3):**

1. **Price Trend Card** — `bg-white rounded-xl border border-primary/5 shadow-sm p-6`
   - Header: "Average Property Price Trends" + Last 5 Years / Last 12 Months select
   - Recharts `AreaChart` with SVG gradient fill, line `stroke="#1B4D3E" strokeWidth={3}`
   - Callout strip: `bg-primary/5 p-4 rounded-lg` — current avg `text-3xl font-black text-primary`, YoY `text-emerald-600`
   - Year axis labels

2. **Listings vs Sold Volume** — grouped Recharts `BarChart`, quarterly data, legend (New Listings = `#1B4D3E`, Sold Volume = `#1B4D3E` at 30% opacity)

3. **Schools Table** — `bg-white rounded-xl border border-primary/5 p-6`
   - Header: title + "X schools in catchment" pill
   - `<table>` with columns: School Name / Ofsted / Distance
   - Ofsted badges: Outstanding=`bg-emerald-100 text-emerald-800`, Good=`bg-blue-100 text-blue-800`, Requires Improvement=`bg-amber-100 text-amber-800`
   - Source: `text-[10px] text-neutral-400 italic` "Data sourced from Ofsted (last updated Feb 2024)"

**Sidebar (1/3):**

1. **Property Types Donut** — SVG donut chart, centre shows total units, legend 2×2 grid
   - Flats 45% / Terraced 25% / Semi 20% / Detached 10%

2. **Demographics** — horizontal progress bars for Age group / Household type / Income band
   - `bg-primary/5 rounded-full h-1.5` track, `bg-primary` fill

3. **Connectivity Card** — `bg-primary text-white rounded-xl p-6`
   - "Ultrafast Broadband" + "98% Coverage" pill `bg-white/20`
   - `bg-white/10 rounded-lg p-4` with avg download/upload speeds
   - 5G signal strength row

4. **Crime Index** — horizontal bar chart: Isleworth Low (emerald), Hounslow Average (amber), London Average (slate)
   - Source attribution in italic

**Full-width map:** MapTiler map `h-80 rounded-2xl`, area boundary outlined, zoom controls, "TW7 Isleworth / Zone 4 • West London" info card top-left

**Header actions:** Share button `border border-primary/20` + "Download Full PDF" `bg-primary text-white` (PDF export via browser print for now)

---

### Tab 3: Transport
(Existing transport content from current page, preserved and restyled to match design system)

### Tab 4: Schools
(Existing schools table content, restyled to match Market Data tab style)

### Tab 5: Lifestyle
(Local favourites + editorial content)

### SEO Metadata
```ts
export const metadata: Metadata = {
  title: `${area} Area Guide — ${postcode} | Britestate`,
  description: `Discover ${area}: property prices, schools, transport and lifestyle.`,
  alternates: { canonical: `/areas/${city}/${area}` },
}
```

---

## Page 3: Sold Prices Individual Property — `/sold-prices/[area]/[slug]`

### URL Schema
`slug` = URL-friendly address: `14-elm-road-tw7-6nf`
Generated from: `address.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`

### Data fetched (server-side)
- Property record by slug (address match + postcode)
- Full price history for this property (all transactions from Land Registry)
- Up to 6 nearby sold prices (same street or within 0.25 miles, last 24 months)
- Area YoY growth percentage

### Layout

#### Sticky Header
- `sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary/10`
- Breadcrumb: `Sold Prices › [Area] › [Address]` in `text-primary/60`
- Address search `rounded-full bg-primary/5`
- User avatar

#### Main Content (2/3 width)

**Hero Card** — `overflow-hidden rounded-xl bg-white shadow-sm border border-primary/5`
- `aspect-video` property image with `next/image`
- Content below: address H2 `text-3xl font-black text-primary`, postcode + type `text-lg text-primary/70`
- Share + Save buttons `border border-primary/20`
- **3 Stat Cards** (3-col row, all `rounded-xl bg-primary/5 p-5`):
  - Last Sold Price: label + `text-2xl font-black text-primary`
  - Market Performance: same but `border-l-4 border-emerald-500`, value `text-emerald-700`
  - Estimated Growth: label + value

**Price History Card** — `rounded-xl bg-white shadow-sm border border-primary/5 p-6 sm:p-8`
- Title with history icon
- Vertical timeline: `relative space-y-6 before:absolute before:left-3 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-primary/10`
- Each entry: circle node (latest=`bg-primary`, older=`bg-primary/40`, oldest=`bg-primary/20`), price bold, date muted, % change badge emerald

**Nearby Sold Prices** — `rounded-xl bg-white shadow-sm border border-primary/5 p-6 sm:p-8`
- Table: Address | Price | Sold Date
- "View all on map" link
- Row hover: `hover:bg-primary/5 transition-colors`

#### Sidebar (1/3 width)

**Map Card** — `rounded-xl bg-white shadow-sm border border-primary/5 p-4 overflow-hidden`
- `h-64 rounded-lg` MapTiler map with `grayscale(100%) opacity-80` CSS filter
- Large location pin with address tooltip `bg-primary text-white rounded px-3 py-1 text-[10px] font-bold`
- "View Street View" button `w-full bg-primary text-white rounded-lg py-3 font-bold`
- Location Insights: train distance + school rating

**Sticky Valuation CTA** — `rounded-xl bg-primary text-white p-6 shadow-xl sticky top-24`
- "Thinking of selling?" `text-xl font-bold`
- Growth stat block: `bg-white/10 rounded-lg p-4` — "Local prices in [Area] have increased by **+4.2%** in the last 12 months"
- Growth % in `text-emerald-300 font-bold`
- "Get a free valuation" button: `w-full bg-white text-primary font-bold py-3 rounded-lg`
- Social proof: `text-center text-xs text-white/60`

### SEO Metadata
```ts
export const metadata: Metadata = {
  title: `${address} Sold Price History | Britestate`,
  description: `See the full sold price history for ${address}. Last sold for £${lastPrice}.`,
  alternates: { canonical: `/sold-prices/${area}/${slug}` },
}
```

---

## Footer Update — `src/components/layout/Footer.tsx`

Add "Area Guides" as a new column (6th, or replace "Legal" with combined column if needed for layout).

```tsx
{
  heading: "Area Guides",
  links: [
    { label: "London", href: "/areas/london" },
    { label: "Manchester", href: "/areas/manchester" },
    { label: "Birmingham", href: "/areas/birmingham" },
    { label: "Bristol", href: "/areas/bristol" },
    { label: "Leeds", href: "/areas/leeds" },
    { label: "Edinburgh", href: "/areas/edinburgh" },
    { label: "Oxford", href: "/areas/oxford" },
    { label: "Cambridge", href: "/areas/cambridge" },
  ],
  cta: { label: "Browse all areas →", href: "/areas" }
}
```

Footer grid: update from `grid-cols-5` to `grid-cols-6` on desktop, or consolidate "Legal" links into "Company" column.

---

## Component Reuse

These pages reuse existing components where available:
- `src/components/ui/` — Shadcn Button, Card, Tabs, Badge, Table
- `src/components/layout/Header.tsx` — unchanged
- `src/components/layout/Footer.tsx` — updated

New shared components to extract (used across ≥2 pages):
- `src/components/properties/PropertyCard.tsx` — grid variant (already exists, reuse)
- `src/components/charts/AreaPriceTrend.tsx` — Recharts AreaChart wrapper (new, used on city + area pages)
- `src/components/charts/PropertyDonut.tsx` — SVG donut (new, used on area stats tab)

---

## Performance Requirements

- All pages: SSR, `generateMetadata` for SEO
- Hero images: `next/image` with `priority` and `blurDataURL` placeholder
- Map components: dynamic import with `ssr: false` to avoid hydration mismatch
- Recharts: dynamic import with `ssr: false`
- Sold prices page: target <1s TTFB via Supabase server client with indexed queries

---

## Data Fallbacks

- **No agent found for postcode:** Show generic "Speak to a local expert" CTA linking to `/marketplace?area=[postcode]`
- **No sold price history:** Show "No transaction history available for this property"
- **No nearby comparables:** Hide the section entirely
- **Missing property image:** Show brand-primary placeholder with property icon

---

## Stitch Reference Screens

| Screen | Stitch ID | Used for |
|---|---|---|
| City Area Guide - London | `e8a02df784044c35ae25fee3e0084e4f` | Page 1 layout reference |
| City Area Guide (generated) | `6d6593256d85426ca184e510f2d414ba` | Page 1 full-page reference |
| Neighbourhood Guide - TW7 | `c412b96661fa4d5581931dda853d2d26` | Page 2 layout reference |
| Area Stats Dashboard | `2c4c572a831b404591eb5cada196b072` | Market Data tab reference |
| Sold Prices - Individual Property | `7d2582e8380c41b4910e9bc2ec3b223a` | Page 3 layout reference |
