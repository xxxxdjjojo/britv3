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
| Tab implementation | Shadcn `<Tabs>` with server-fetched data passed as children | Correct App Router pattern; no client boundary on page |

---

## Routes & Files

| Route | File | Type |
|---|---|---|
| `/areas/[city]` | `src/app/(main)/areas/[city]/page.tsx` | Server Component — full replacement |
| `/areas/[city]` | `src/app/(main)/areas/[city]/loading.tsx` | Skeleton loader — new |
| `/areas/[city]` | `src/app/(main)/areas/[city]/error.tsx` | Error boundary — new |
| `/areas/[city]/[area]` | `src/app/(main)/areas/[city]/[area]/page.tsx` | Server Component — full replacement |
| `/areas/[city]/[area]` | `src/app/(main)/areas/[city]/[area]/loading.tsx` | Skeleton loader — new |
| `/areas/[city]/[area]` | `src/app/(main)/areas/[city]/[area]/error.tsx` | Error boundary — new |
| `/sold-prices/[area]/[slug]` | `src/app/(main)/sold-prices/[area]/[slug]/page.tsx` | Server Component — new route |
| `/sold-prices/[area]/[slug]` | `src/app/(main)/sold-prices/[area]/[slug]/loading.tsx` | Skeleton loader — new |
| `/sold-prices/[area]/[slug]` | `src/app/(main)/sold-prices/[area]/[slug]/error.tsx` | Error boundary — new |
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

> **Tailwind v4 note:** Define `--color-primary` in `globals.css` using RGB channel format (e.g. `27 77 62`), NOT as a hex string. Tailwind v4 opacity modifiers (`/10`, `/20`, etc.) require channel-format values to function correctly.

> **Card border standard:** Use `border-primary/10` for all top-level white cards. Use `border-primary/5` only for subtle inset/nested containers within a card.

---

## Component Architecture

### Client Boundaries

- **Tabs:** Use Shadcn `<Tabs>` (`src/components/ui/tabs.tsx`). The page Server Component fetches all tab data and passes it as children props to each `<TabsContent>`. The `<Tabs>` wrapper contains the only `"use client"` boundary (internal to Shadcn). Do NOT add `"use client"` to the page itself.
- **Charts:** `AreaPriceTrend.tsx` and `PropertyDonut.tsx` must be imported via `next/dynamic({ ssr: false })` in their parent Server Component. Do NOT import Recharts directly in Server Components.
- **Maps:** All MapTiler/MapLibre components must be imported via `next/dynamic({ ssr: false })`. Do NOT import MapLibre GL JS directly in Server Components. Use a shared `<MapEmbed>` dynamic component.

### New Shared Components (`src/components/charts/` — new directory)

> Note: `src/components/charts/` is a new shared directory introduced by this spec for reusable data visualisation components, consistent with the domain-directory convention in CLAUDE.md.

- `src/components/charts/AreaPriceTrend.tsx` — `"use client"` Recharts AreaChart wrapper, used on city + area pages
- `src/components/charts/PropertyDonut.tsx` — `"use client"` SVG donut chart, used on area stats tab
- `src/components/charts/ListingVolume.tsx` — `"use client"` Recharts BarChart, used on area stats tab

### Reused Existing Components

- `src/components/ui/` — Shadcn Button, Card, Tabs, Badge, Table
- `src/components/properties/PropertyCard.tsx` — grid variant (already exists)
- `src/components/layout/Header.tsx` — unchanged
- `src/components/layout/Footer.tsx` — updated

---

## Loading States

Each route has a `loading.tsx` sibling that renders a skeleton matching the page layout:

- **City page:** Hero shimmer (70vh), 3 stat card skeletons in a row, chart placeholder, 4-col borough card skeletons
- **Area page:** Split hero skeleton (text left, map placeholder right), tab bar skeleton, card grid skeletons
- **Sold prices page:** 16:9 image skeleton, 3 stat card skeletons, timeline skeleton items, table row skeletons

Use `animate-pulse bg-primary/5 rounded-xl` for skeleton blocks.

---

## Error States

Each route has an `error.tsx` sibling (`"use client"` required by Next.js). It displays:
- Branded error card with Britestate logo
- "Something went wrong loading this page" message
- Retry button (`router.refresh()`)
- "Back to area guides" link → `/areas`

---

## Caching Strategy

- **City pages** (`/areas/[city]`) for the 8 footer cities: use `generateStaticParams` with `export const revalidate = 86400` (daily ISR). These are SEO-critical and change infrequently.
- **Neighbourhood pages** (`/areas/[city]/[area]`): `export const dynamic = 'force-dynamic'` — market data changes daily.
- **Sold prices pages** (`/sold-prices/[area]/[slug]`): `export const dynamic = 'force-dynamic'` — transaction data is live.

---

## Page 1: City Area Guide — `/areas/[city]`

### Data fetched (server-side)
- City metadata: name, description, avg price, YoY change, listing count, avg days to sell
- Top 4 boroughs by search volume: name, avg price, image
- 3 featured properties for sale in this city
- Transport overview (static per city or from DB)

### SEO Metadata
```ts
export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const { city } = params;
  const cityName = await fetchCityName(city); // e.g. "London"
  return {
    title: `Properties in ${cityName} | Britestate Area Guide`,
    description: `Explore ${cityName} property market data, prices, schools and transport.`,
    alternates: { canonical: `/areas/${city}` },
  };
}
```

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
- Each: `bg-white rounded-xl shadow-sm border border-primary/10 p-6`
- Label: `text-sm text-neutral-500`
- Value: `text-3xl font-bold text-primary` (e.g. £725,480)
- YoY badge: `text-emerald-600 font-bold flex items-center gap-1` with trending-up Lucide icon

#### 5-Year Price Trend Card
- `bg-white rounded-xl shadow-sm border border-primary/10 p-8`
- Title + subtitle
- Property type toggle pills: All / Flat / Terraced — active pill `bg-primary/10 text-primary font-bold`
- `import dynamic from 'next/dynamic'` → `const AreaPriceTrend = dynamic(() => import('@/components/charts/AreaPriceTrend'), { ssr: false })`
- `<AreaPriceTrend>`: Recharts AreaChart, line `stroke="#1B4D3E"`, area fill gradient `#1B4D3E` 20%→0%
- Year labels below axis in `text-xs text-neutral-400 uppercase tracking-widest`

#### Popular Boroughs (4-col grid)
- Section heading + "View all X boroughs →" link in `text-primary font-bold`
- Each card: `border border-primary/10 bg-white rounded-xl p-4 hover:shadow-md transition-all`
- Image: `h-24 w-full rounded-lg overflow-hidden` with `group-hover:scale-110 transition-transform`
- Borough name: `font-bold`
- Avg price: `text-sm text-neutral-500`

#### Properties For Sale (3-col grid)
- Heading + "Filter" button `border border-primary/20`
- Each card: `overflow-hidden rounded-xl border border-primary/10 bg-white shadow-sm hover:shadow-lg transition-all`
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
- Each: `bg-white rounded-xl p-6 shadow-sm border border-primary/10 hover:border-primary transition-all group`
- Icon container: `h-12 w-12 rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors`
- Label: `text-sm font-bold`

---

## Page 2: Neighbourhood Guide — `/areas/[city]/[area]`

### Data fetched (server-side)
- Area metadata: name, postcode district, borough, description, green space %, walkability, noise level
- Highest-rated verified agent covering this postcode (query `agents` table joined with `profiles`, where postcode district is in `service_area` JSONB, order by `avg_rating DESC`, limit 1)
- 4 current listings in this postcode district (price, status, address, beds, baths, image)
- Market data: price trend (5yr), quarterly listing/sold volume, school list, demographics, connectivity stats, crime index
- Local favourites (3 POIs)

### SEO Metadata
```ts
export async function generateMetadata({ params }: { params: { city: string; area: string } }): Promise<Metadata> {
  const { city, area } = params;
  const { name, postcode } = await fetchAreaMetadata(city, area);
  return {
    title: `${name} Area Guide — ${postcode} | Britestate`,
    description: `Discover ${name}: property prices, schools, transport and lifestyle.`,
    alternates: { canonical: `/areas/${city}/${area}` },
  };
}
```

### Layout

#### Breadcrumb
`Home / Area Guides / [City] / [Area]` — `text-sm text-neutral-500`

#### Hero — Split Layout (2-col desktop, stacked mobile)

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
- MapTiler map: `import dynamic from 'next/dynamic'` → `const MapEmbed = dynamic(() => import('@/components/maps/MapEmbed'), { ssr: false })`
- `<MapEmbed>` centred on postcode district with brand-primary property pin markers
- Backdrop-blur overlay at map bottom: `bg-white/90 backdrop-blur-md p-3 rounded-lg flex justify-between items-center`
  - Left: location icon + "[Postcode] Boundary Overview"
  - Right: "Interactive Map" button `bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold`

**Mobile:** Right column (map) stacks below left column content.

#### Tab Bar
Use Shadcn `<Tabs>` (`src/components/ui/tabs.tsx`). The Server Component fetches all tab data and passes to each `<TabsContent>` as props. No `"use client"` on the page file.

5 tabs: Overview | Market Data | Transport | Schools | Lifestyle
Active tab indicator: `border-b-2 border-primary text-primary font-bold`

---

### Tab 1: Overview

#### Local Favourites (3-col grid)
- Each card: `bg-white border border-neutral-100 rounded-xl p-4 hover:shadow-md transition-shadow`
- Coloured Lucide icon (green park, orange café, blue school)
- Bold title, `text-sm text-neutral-500` description

#### Demographic Snapshot
- `bg-primary/5 border border-primary/10 rounded-2xl p-8`
- 4-col grid: Top Group / Median Age / Ownership / Vibe
- Label: `text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1`
- Value: `text-neutral-900 font-bold`

#### 2-col layout: Content left (2/3) + Expert Sidebar right (1/3)

**Expert Sidebar (sticky):**
- `sticky top-8 bg-white border border-primary/10 rounded-2xl shadow-sm p-6`
- Agent avatar: `size-16 rounded-full border-2 border-primary/20` with `bg-green-500 size-4 rounded-full border-2 border-white absolute` online dot
- Name: `text-lg font-bold`
- Role: `text-sm text-primary font-semibold` e.g. "TW7 Specialist"
- Quote: `text-sm text-neutral-600 italic`
- "Speak to [Name]" button: `w-full bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2`
- "Book a Viewing" button: `w-full border border-primary/20 text-primary font-bold py-3 rounded-xl`
- **Fallback (no agent):** Replace with "Speak to a local expert" → `/marketplace?area=[postcode]`

#### Property Listings (4-col grid, below the 2-col section)
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

Stitch reference screens: `ee4b83e958af4de1b3ac21fcab7ab8e3` / `2c4c572a831b404591eb5cada196b072`

All chart components imported via `next/dynamic({ ssr: false })`.

**Header actions (top of tab):** Share button `border border-primary/20` + "Download Full PDF" `bg-primary text-white` (triggers `window.print()`)

**2-col layout: Main (2/3) + Sidebar (1/3)**

**Main column:**

1. **Price Trend Card** — `bg-white rounded-xl border border-primary/10 shadow-sm p-6`
   - Header: "Average Property Price Trends" + `<select>` Last 5 Years / Last 12 Months
   - `const AreaPriceTrend = dynamic(...)` — Recharts AreaChart, line `stroke="#1B4D3E" strokeWidth={3}`, SVG gradient fill
   - Callout strip: `bg-primary/5 p-4 rounded-lg` — current avg `text-3xl font-black text-primary`, YoY `text-emerald-600 flex items-center`
   - Year axis labels `text-xs text-neutral-400 uppercase tracking-widest`

2. **New Listings vs Sold Volume** — `bg-white rounded-xl border border-primary/10 shadow-sm p-6`
   - `const ListingVolume = dynamic(...)` — Recharts grouped BarChart, quarterly
   - Legend: New Listings = `#1B4D3E` solid, Sold Volume = `#1B4D3E` at 30% opacity

3. **Schools Table** — `bg-white rounded-xl border border-primary/10 p-6`
   - Header: title + "X schools in catchment" pill `bg-primary/5 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase`
   - Shadcn `<Table>`: School Name / Ofsted / Distance columns
   - Ofsted badges: Outstanding=`bg-emerald-100 text-emerald-800`, Good=`bg-blue-100 text-blue-800`, Requires Improvement=`bg-amber-100 text-amber-800`
   - Source attribution: `text-[10px] text-neutral-400 italic mt-4`

**Sidebar:**

1. **Property Types Donut** — `bg-white rounded-xl border border-primary/10 shadow-sm p-6`
   - `const PropertyDonut = dynamic(...)` — SVG donut, centre shows total units `text-2xl font-black text-primary`
   - Legend 2×2 grid: Flats 45% / Terraced 25% / Semi 20% / Detached 10%

2. **Demographics** — `bg-white rounded-xl border border-primary/10 shadow-sm p-6`
   - Horizontal progress bars: `bg-primary/5 rounded-full h-1.5` track, `bg-primary h-1.5 rounded-full` fill
   - Age group / Household type / Income band

3. **Connectivity Card** — `bg-primary text-white rounded-xl p-6`
   - "Ultrafast Broadband" label + "98% Coverage" pill `bg-white/20`
   - `bg-white/10 rounded-lg p-4`: avg download / upload speeds `text-2xl font-black`
   - 5G signal strength row with signal icon

4. **Crime Index** — `bg-white rounded-xl border border-primary/10 shadow-sm p-6`
   - Horizontal bar rows: Isleworth Low (emerald-500), Hounslow Average (amber-400), London Average (slate-300)
   - Source: `text-[10px] text-neutral-400 italic`

**Full-width map (below 2-col):**
- `const MapEmbed = dynamic(...)` — MapTiler map `h-80 rounded-2xl border-4 border-white shadow-xl`
- Area boundary outlined, zoom controls, info card top-left

---

### Tab 3: Transport
Existing transport content restyled to match design system (transport type cards in `bg-white border border-primary/10 rounded-xl`, commute time list).

### Tab 4: Schools
Existing schools table restyled using the same Shadcn `<Table>` + Ofsted badge pattern from Tab 2.

### Tab 5: Lifestyle
Local favourites grid + editorial text content + lifestyle image.

---

## Page 3: Sold Prices Individual Property — `/sold-prices/[area]/[slug]`

### URL & Database Schema

`slug` is stored in the `sold_prices` table as a generated column, created at Land Registry data import time:
```
slug = address.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
```
The table has `CREATE UNIQUE INDEX sold_prices_slug_idx ON sold_prices(slug)`. The route fetches `WHERE slug = params.slug`. Do NOT reverse-engineer the slug from the URL — always query by slug column.

### Data fetched (server-side)
- Property record: `SELECT * FROM sold_prices WHERE slug = $1` (throws 404 if not found)
- Full price history: all transactions for this property ordered by date DESC
- Up to 6 nearby sold prices: same street or `ST_DWithin(location, $point, 400)`, last 24 months
- Area YoY growth: from `area_stats` table by postcode district

### SEO Metadata
```ts
export async function generateMetadata({ params }: { params: { area: string; slug: string } }): Promise<Metadata> {
  const property = await fetchPropertyBySlug(params.slug);
  if (!property) return { title: 'Property Not Found | Britestate' };
  return {
    title: `${property.address} Sold Price History | Britestate`,
    description: `See the full sold price history for ${property.address}. Last sold for £${property.lastPrice.toLocaleString()}.`,
    alternates: { canonical: `/sold-prices/${params.area}/${params.slug}` },
  };
}
```

### Layout

#### Sticky Header
- `sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary/10`
- Breadcrumb: `Sold Prices › [Area] › [Address]` in `text-primary/60 text-sm`
- Address search `rounded-full bg-primary/5 h-10`
- User avatar

#### 2-col layout: Main (2/3) + Sidebar (1/3)

**Mobile:** Sidebar reorders: Map Card appears between Hero Card and Price History. Sticky Valuation CTA appears between Price History and Nearby Sold Prices.

**Main Content:**

**Hero Card** — `overflow-hidden rounded-xl bg-white shadow-sm border border-primary/10`
- `aspect-video` `next/image` with priority
- Content below (`p-6 sm:p-8`): address `text-3xl font-black text-primary`, postcode + type `text-lg text-primary/70`
- Share + Save buttons `border border-primary/20 rounded-lg px-4 py-2 text-sm`
- **3 Stat Cards** (3-col row `mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4`):
  - Last Sold Price: `rounded-xl bg-primary/5 p-5` — label + `text-2xl font-black text-primary` + date
  - Market Performance: same + `border-l-4 border-emerald-500`, value `text-2xl font-black text-emerald-700`
  - Estimated Growth: `rounded-xl bg-primary/5 p-5` — label + value

**Price History Card** — `rounded-xl bg-white shadow-sm border border-primary/10 p-6 sm:p-8`
- Title with Lucide `History` icon
- Vertical timeline: `relative space-y-6 before:absolute before:left-3 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-primary/10`
- Each entry: `relative pl-10` — circle `absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-white` (latest=`bg-primary`, older=`bg-primary/40`, oldest=`bg-primary/20`), price `font-bold text-lg text-primary`, date `text-sm text-primary/60`, change badge `text-xs font-medium text-emerald-600`

**Nearby Sold Prices** — `rounded-xl bg-white shadow-sm border border-primary/10 p-6 sm:p-8`
- Header: title + "View all on map" link `text-sm font-semibold text-primary hover:underline`
- Shadcn `<Table>`: Address / Price / Sold Date — price column `font-bold text-primary text-right`, row `hover:bg-primary/5 transition-colors`

**Sidebar:**

**Map Card** — `rounded-xl bg-white shadow-sm border border-primary/10 p-4 overflow-hidden`
- `const MapEmbed = dynamic(...)` — `h-64 rounded-lg` MapTiler with CSS `filter: grayscale(100%) opacity(0.8)`
- Large Lucide `MapPin` in primary with address tooltip `bg-primary text-white rounded px-3 py-1 text-[10px] font-bold absolute`
- "View Street View" button `w-full bg-primary text-white rounded-lg py-3 font-bold mt-6`
- Location Insights list: train distance + school rating with Lucide icons

**Sticky Valuation CTA** — `rounded-xl bg-primary text-white p-6 shadow-xl sticky top-24`
- "Thinking of selling?" `text-xl font-bold mb-4`
- `bg-white/10 rounded-lg p-4 mb-6`: "Local prices in [Area] have increased by [growth]% in the last 12 months" — growth value `font-bold text-emerald-300`
- "Get a free valuation" button: `w-full bg-white text-primary font-bold py-3 rounded-lg hover:bg-neutral-100 transition-all`
- `text-center text-xs text-white/60 mt-4`: "Trusted by 10,000+ homeowners"

---

## Footer Update — `src/components/layout/Footer.tsx`

Add "Area Guides" as a 6th column. Update desktop grid from `grid-cols-5` to `grid-cols-6`. On tablet (md), collapse to 3×2 grid. "Legal" links can remain as their own column or be consolidated into "Company" if space is tight.

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
    { label: "Browse all areas →", href: "/areas" },
  ]
}
```

---

## Data Fallbacks

- **No agent found for postcode:** Generic "Speak to a local expert" CTA → `/marketplace?area=[postcode]`
- **No sold price history:** "No transaction history available for this property" — hide Price History card
- **No nearby comparables:** Hide Nearby Sold Prices section entirely
- **Missing property image:** Brand-primary placeholder `bg-primary/10` with centered `Home` Lucide icon
- **Property slug not found (404):** `notFound()` from `next/navigation` — renders the app's 404 page

---

## Performance Requirements

- **City pages:** `generateStaticParams` for top 8 cities + `export const revalidate = 86400` (daily ISR)
- **Area + sold prices pages:** `export const dynamic = 'force-dynamic'` (live data)
- **Hero images:** `next/image` with `priority` and `blurDataURL`
- **Charts + Maps:** `next/dynamic({ ssr: false })` — never imported directly in Server Components
- **Sold prices TTFB target:** <1s via Supabase server client with `slug` unique index query

---

## Stitch Reference Screens

| Screen | Stitch ID | Used for |
|---|---|---|
| City Area Guide - London | `e8a02df784044c35ae25fee3e0084e4f` | Page 1 layout reference |
| City Area Guide (generated) | `6d6593256d85426ca184e510f2d414ba` | Page 1 full-page reference |
| Neighbourhood Guide - TW7 | `c412b96661fa4d5581931dda853d2d26` | Page 2 layout reference |
| Area Stats Dashboard | `2c4c572a831b404591eb5cada196b072` | Market Data tab reference |
| Sold Prices - Individual Property | `7d2582e8380c41b4910e9bc2ec3b223a` | Page 3 layout reference |
