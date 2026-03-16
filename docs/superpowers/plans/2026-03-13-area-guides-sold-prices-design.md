# Area Guides & Sold Prices — FAANG Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace four existing page stubs with FAANG-quality area guide and sold prices pages, add shared chart/map components, and add an Area Guides column to the Footer.

**Architecture:** Next.js 16 App Router with Server Components throughout. Charts (Recharts) and Maps (MapLibre via `@vis.gl/react-maplibre`) are loaded via `next/dynamic({ ssr: false })` to avoid SSR issues. Tabs use `@base-ui/react/tabs` (already in `src/components/ui/tabs.tsx`) with the client boundary kept internal to the component — pages themselves stay as Server Components. All pages use mock/static data (no Supabase DB yet — the DB schema is designed but migrations not yet run).

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Shadcn (base-ui), Recharts 2.15, `@vis.gl/react-maplibre` + `maplibre-gl`, Lucide icons, Plus Jakarta Sans + Inter fonts.

---

## Key Codebase Facts (read before implementing)

- **Working directory for commands:** `britv3.0/` (not repo root)
- **Tailwind v4 color tokens:** `--color-primary` in `@theme inline` in `src/app/globals.css` must be in RGB channel format (`27 77 62`) — not hex — for opacity modifiers (`/10`, `/20`) to work. Fix this in Task 1.
- **Primary color:** `#1B4D3E` = channels `27 77 62`
- **Tabs component:** `src/components/ui/tabs.tsx` — uses `@base-ui/react/tabs`. API: `<Tabs defaultValue="tab1">`, `<TabsList>`, `<TabsTrigger value="tab1">`, `<TabsContent value="tab1">`. The file already has `"use client"` — import it from Server Components freely.
- **Recharts:** already installed (`recharts@2.15.4`). Import charts via `next/dynamic({ ssr: false })`.
- **MapLibre:** `@vis.gl/react-maplibre@8.1.0` + `maplibre-gl@5.19.0` installed. Must add `import "maplibre-gl/dist/maplibre-gl.css"` in the MapEmbed client component.
- **No tests yet:** Vitest not installed. Verification = `pnpm build` + `pnpm lint`.
- **Existing stubs to replace:**
  - `src/app/(main)/areas/[city]/page.tsx` — replace entirely
  - `src/app/(main)/areas/[city]/[area]/page.tsx` — replace entirely
  - `src/app/(main)/sold-prices/[area]/page.tsx` — keep as-is (area listing page); the NEW route is `/sold-prices/[area]/[slug]/page.tsx`
- **New files:** loading.tsx + error.tsx siblings for each route; new directory `src/components/charts/`; new directory `src/components/maps/`
- **Brand token in JSX:** Use `text-primary`, `bg-primary`, `border-primary` (Tailwind utilities) for `#1B4D3E`. Do NOT use `text-brand-primary` in new pages — that's the old pattern. New pages use design-system `primary` tokens exclusively.

---

## File Map

### New or Modified Files

| Action | Path | Purpose |
|--------|------|---------|
| **Modify** | `src/app/globals.css` | Fix `--color-primary` to channel format |
| **Create** | `src/components/maps/MapEmbed.tsx` | Shared MapLibre map wrapper (`"use client"`) |
| **Create** | `src/components/charts/AreaPriceTrend.tsx` | Recharts AreaChart (`"use client"`) |
| **Create** | `src/components/charts/PropertyDonut.tsx` | SVG donut chart (`"use client"`) |
| **Create** | `src/components/charts/ListingVolume.tsx` | Recharts BarChart (`"use client"`) |
| **Modify** | `src/components/layout/Footer.tsx` | Add Area Guides column (6th column) |
| **Replace** | `src/app/(main)/areas/[city]/page.tsx` | City Area Guide — full redesign |
| **Create** | `src/app/(main)/areas/[city]/loading.tsx` | City page skeleton |
| **Create** | `src/app/(main)/areas/[city]/error.tsx` | City page error boundary |
| **Replace** | `src/app/(main)/areas/[city]/[area]/page.tsx` | Neighbourhood Guide — full redesign |
| **Create** | `src/app/(main)/areas/[city]/[area]/loading.tsx` | Area page skeleton |
| **Create** | `src/app/(main)/areas/[city]/[area]/error.tsx` | Area page error boundary |
| **Create** | `src/components/area/PrintButton.tsx` | `"use client"` wrapper for window.print() CTA |
| **Create** | `src/app/(main)/sold-prices/[area]/[slug]/page.tsx` | Individual property sold price page |
| **Create** | `src/app/(main)/sold-prices/[area]/[slug]/loading.tsx` | Sold prices skeleton |
| **Create** | `src/app/(main)/sold-prices/[area]/[slug]/error.tsx` | Sold prices error boundary |

---

## Chunk 1: Shared Infrastructure

### Task 1: Fix Tailwind v4 Primary Color Channels + MapEmbed + Charts

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/maps/MapEmbed.tsx`
- Create: `src/components/charts/AreaPriceTrend.tsx`
- Create: `src/components/charts/PropertyDonut.tsx`
- Create: `src/components/charts/ListingVolume.tsx`

---

- [ ] **Step 1: Fix `--color-primary` in globals.css**

In `src/app/globals.css`, in the `@theme inline { }` block, change:
```css
--color-primary: var(--primary);
```
to:
```css
--color-primary: 27 77 62;
```

This changes the Tailwind `primary` color utility to use space-separated RGB channels so that `border-primary/10`, `bg-primary/5` etc. produce correct opacity-modified colors. The `:root { --primary: #1B4D3E; }` line stays unchanged (used by Shadcn components directly).

---

- [ ] **Step 2: Create `src/components/maps/MapEmbed.tsx`**

```tsx
"use client";

import { Map, Marker } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

type MapEmbedProps = Readonly<{
  latitude?: number;
  longitude?: number;
  zoom?: number;
  className?: string;
  grayscale?: boolean;
}>;

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";

export function MapEmbed({
  latitude = 51.4754,
  longitude = -0.3368,
  zoom = 13,
  className,
  grayscale = false,
}: MapEmbedProps) {
  const mapStyle = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`;

  return (
    <div
      className={className}
      style={grayscale ? { filter: "grayscale(100%) opacity(0.8)" } : undefined}
    >
      <Map
        initialViewState={{ latitude, longitude, zoom }}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
      >
        <Marker latitude={latitude} longitude={longitude} />
      </Map>
    </div>
  );
}
```

---

- [ ] **Step 3: Create `src/components/charts/AreaPriceTrend.tsx`**

```tsx
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// Note: <defs>, <linearGradient>, <stop> are native SVG elements — do NOT import from recharts.

type DataPoint = Readonly<{ year: string; price: number }>;

type AreaPriceTrendProps = Readonly<{
  data?: DataPoint[];
  className?: string;
}>;

const DEFAULT_DATA: DataPoint[] = [
  { year: "2021", price: 480000 },
  { year: "2022", price: 510000 },
  { year: "2023", price: 495000 },
  { year: "2024", price: 528000 },
  { year: "2025", price: 556000 },
  { year: "2026", price: 590000 },
];

function formatPrice(value: number) {
  return `£${(value / 1000).toFixed(0)}k`;
}

export function AreaPriceTrend({ data = DEFAULT_DATA, className }: AreaPriceTrendProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1B4D3E" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#1B4D3E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: "#9E9EAB", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            formatter={(value: number) => [formatPrice(value), "Avg Price"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #E2E2E8", fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#1B4D3E"
            strokeWidth={3}
            fill="url(#primaryGradient)"
            dot={false}
            activeDot={{ r: 5, fill: "#1B4D3E" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

- [ ] **Step 4: Create `src/components/charts/PropertyDonut.tsx`**

```tsx
"use client";

type Segment = Readonly<{
  label: string;
  value: number;
  color: string;
}>;

type PropertyDonutProps = Readonly<{
  segments?: Segment[];
  total?: number;
  className?: string;
}>;

const DEFAULT_SEGMENTS: Segment[] = [
  { label: "Flats", value: 45, color: "#1B4D3E" },
  { label: "Terraced", value: 25, color: "#2D7A5F" },
  { label: "Semi", value: 20, color: "#D4A853" },
  { label: "Detached", value: 10, color: "#E2E2E8" },
];

function buildArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle - 90));
  const y1 = cy + r * Math.sin(toRad(startAngle - 90));
  const x2 = cx + r * Math.cos(toRad(endAngle - 90));
  const y2 = cy + r * Math.sin(toRad(endAngle - 90));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export function PropertyDonut({ segments = DEFAULT_SEGMENTS, total = 1240, className }: PropertyDonutProps) {
  const cx = 64;
  const cy = 64;
  const outerR = 54;
  const innerR = 36;

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const start = cumulative;
    const end = cumulative + (seg.value / 100) * 360;
    cumulative = end;
    return { ...seg, start, end };
  });

  return (
    <div className={className}>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width={128} height={128} viewBox="0 0 128 128">
            {arcs.map((arc) => (
              <path
                key={arc.label}
                d={`${buildArcPath(cx, cy, outerR, arc.start, arc.end)} L ${cx + innerR * Math.cos(((arc.end - 90) * Math.PI) / 180)} ${cy + innerR * Math.sin(((arc.end - 90) * Math.PI) / 180)} A ${innerR} ${innerR} 0 ${arc.end - arc.start > 180 ? 1 : 0} 0 ${cx + innerR * Math.cos(((arc.start - 90) * Math.PI) / 180)} ${cy + innerR * Math.sin(((arc.start - 90) * Math.PI) / 180)} Z`}
                fill={arc.color}
              />
            ))}
            <text x={cx} y={cy - 4} textAnchor="middle" className="text-xs" style={{ fontSize: 14, fontWeight: 900, fill: "#1B4D3E" }}>
              {total.toLocaleString()}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 9, fill: "#9E9EAB" }}>
              units
            </text>
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: seg.color }} />
              <span className="text-xs text-neutral-600">
                {seg.label} <span className="font-bold text-neutral-900">{seg.value}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

- [ ] **Step 5: Create `src/components/charts/ListingVolume.tsx`**

```tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type QuarterData = Readonly<{
  quarter: string;
  newListings: number;
  soldVolume: number;
}>;

type ListingVolumeProps = Readonly<{
  data?: QuarterData[];
  className?: string;
}>;

const DEFAULT_DATA: QuarterData[] = [
  { quarter: "Q1 25", newListings: 84, soldVolume: 68 },
  { quarter: "Q2 25", newListings: 96, soldVolume: 77 },
  { quarter: "Q3 25", newListings: 112, soldVolume: 89 },
  { quarter: "Q4 25", newListings: 78, soldVolume: 71 },
  { quarter: "Q1 26", newListings: 91, soldVolume: 74 },
];

export function ListingVolume({ data = DEFAULT_DATA, className }: ListingVolumeProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barGap={4} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="quarter"
            tick={{ fontSize: 10, fill: "#9E9EAB" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 10, fill: "#9E9EAB" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E2E8", fontSize: 12 }} />
          <Legend
            iconType="square"
            iconSize={10}
            formatter={(value) =>
              value === "newListings" ? "New Listings" : "Sold Volume"
            }
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="newListings" fill="#1B4D3E" radius={[3, 3, 0, 0]} />
          <Bar dataKey="soldVolume" fill="rgba(27,77,62,0.3)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

- [ ] **Step 6: Update Footer with Area Guides column**

In `src/components/layout/Footer.tsx`:

Add a new constant after `LEGAL_LINKS`:
```tsx
const AREA_GUIDE_LINKS = [
  { href: "/areas/london", label: "London" },
  { href: "/areas/manchester", label: "Manchester" },
  { href: "/areas/birmingham", label: "Birmingham" },
  { href: "/areas/bristol", label: "Bristol" },
  { href: "/areas/leeds", label: "Leeds" },
  { href: "/areas/edinburgh", label: "Edinburgh" },
  { href: "/areas/oxford", label: "Oxford" },
  { href: "/areas/cambridge", label: "Cambridge" },
  { href: "/areas", label: "Browse all areas →" },
] as const;
```

In the main grid `<div>`, change `lg:grid-cols-5` to `lg:grid-cols-6` and add the new column after Legal:
```tsx
{/* Col 6: Area Guides */}
<FooterLinkColumn title="Area Guides" links={AREA_GUIDE_LINKS} />
```

Also update the comment from `{/* Main grid — 5 columns desktop */}` to `{/* Main grid — 6 columns desktop */}`.

---

- [ ] **Step 7: Verify build passes**

```bash
cd britv3.0 && pnpm build
```

Expected: Build succeeds with no TypeScript errors. If recharts import errors appear, check that `AreaPriceTrend.tsx` uses `"use client"`.

- [ ] **Step 8: Commit**

```bash
cd britv3.0 && git add src/app/globals.css src/components/maps/MapEmbed.tsx src/components/charts/ src/components/layout/Footer.tsx
git commit -m "feat(area-guides): add shared chart/map components and Area Guides footer column"
```

---

## Chunk 2: City Area Guide Page

### Task 2: City Area Guide — `/areas/[city]`

**Files:**
- Replace: `src/app/(main)/areas/[city]/page.tsx`
- Create: `src/app/(main)/areas/[city]/loading.tsx`
- Create: `src/app/(main)/areas/[city]/error.tsx`

---

- [ ] **Step 1: Replace `src/app/(main)/areas/[city]/page.tsx`**

This replaces the existing stub entirely. The page layout follows the spec exactly: hero (70vh), stats bar (3 cards), price trend chart, popular boroughs grid, properties for sale, transport section, local services, newsletter CTA.

Key implementation rules:
- Server Component — NO `"use client"` at top
- `generateStaticParams` for top 8 cities + `export const revalidate = 86400`
- `generateMetadata` per spec
- Hero image: use `<div>` placeholder with `bg-neutral-800` (no real images yet)
- `AreaPriceTrend` imported via `next/dynamic({ ssr: false })`
- All cards: `bg-white shadow-sm border border-primary/10 rounded-xl`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  TrendingUp,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Heart,
  Train,
  Zap,
  Wifi,
  GraduationCap,
  ShoppingBag,
  Trees,
  ArrowRight,
} from "lucide-react";

const AreaPriceTrend = dynamic(
  () => import("@/components/charts/AreaPriceTrend").then((m) => ({ default: m.AreaPriceTrend })),
  { ssr: false, loading: () => <div className="h-[200px] animate-pulse bg-primary/5 rounded-xl" /> }
);

export const revalidate = 86400;

export async function generateStaticParams() {
  return [
    { city: "london" },
    { city: "manchester" },
    { city: "birmingham" },
    { city: "bristol" },
    { city: "leeds" },
    { city: "edinburgh" },
    { city: "oxford" },
    { city: "cambridge" },
  ];
}

type CityPageProps = Readonly<{ params: Promise<{ city: string }> }>;

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  return {
    title: `Properties in ${cityName} | Britestate Area Guide`,
    description: `Explore ${cityName} property market data, prices, schools and transport.`,
    alternates: { canonical: `/areas/${city}` },
  };
}

const CITY_DATA: Record<string, { avgPrice: string; yoy: string; listings: string; daysToSell: string; description: string }> = {
  london: { avgPrice: "£725,480", yoy: "+4.2%", listings: "12,400", daysToSell: "34", description: "The world's most dynamic property market, spanning 33 boroughs." },
  manchester: { avgPrice: "£298,500", yoy: "+6.1%", listings: "4,200", daysToSell: "28", description: "The UK's fastest-growing major city, with booming regeneration zones." },
  birmingham: { avgPrice: "£265,000", yoy: "+5.3%", listings: "5,800", daysToSell: "31", description: "The UK's second city, transformed by the Commonwealth Games legacy." },
  bristol: { avgPrice: "£385,000", yoy: "+3.8%", listings: "2,900", daysToSell: "26", description: "A vibrant, creative city with strong demand and limited supply." },
  leeds: { avgPrice: "£249,000", yoy: "+7.2%", listings: "3,600", daysToSell: "24", description: "Yorkshire's commercial hub with excellent graduate retention." },
  edinburgh: { avgPrice: "£340,000", yoy: "+4.9%", listings: "2,100", daysToSell: "22", description: "Scotland's capital with a world-class old town and strong tourism economy." },
  oxford: { avgPrice: "£512,000", yoy: "+2.7%", listings: "1,400", daysToSell: "38", description: "One of the UK's most coveted addresses, driven by the university and science parks." },
  cambridge: { avgPrice: "£495,000", yoy: "+3.1%", listings: "1,600", daysToSell: "35", description: "Silicon Fen's knowledge economy drives sustained property demand." },
};

const BOROUGHS = [
  { name: "Westminster", avgPrice: "£1.2M", slug: "westminster" },
  { name: "Camden", avgPrice: "£850k", slug: "camden" },
  { name: "Islington", avgPrice: "£780k", slug: "islington" },
  { name: "Isleworth", avgPrice: "£542k", slug: "isleworth" },
];

const SALE_PROPERTIES = [
  { price: "1,450,000", address: "Elizabeth St, Belgravia, SW1W", beds: 3, baths: 2, sqft: "1,240", badge: "Premium" },
  { price: "875,000", address: "Tufnell Park Road, Islington, N7", beds: 2, baths: 1, sqft: "980", badge: null },
  { price: "620,000", address: "Harbour Way, Canary Wharf, E14", beds: 1, baths: 1, sqft: "640", badge: "New Build" },
];

const LOCAL_SERVICES = [
  { icon: ShoppingBag, label: "Shops & Retail" },
  { icon: GraduationCap, label: "Schools" },
  { icon: Train, label: "Transport" },
  { icon: Trees, label: "Green Spaces" },
  { icon: Wifi, label: "Connectivity" },
  { icon: Zap, label: "Utilities" },
];

export default async function CityAreaGuidePage({ params }: CityPageProps) {
  const { city } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  const data = CITY_DATA[city.toLowerCase()] ?? CITY_DATA.london;

  return (
    <>
      {/* ── Hero (70vh) ── */}
      <header className="relative min-h-[70vh] flex flex-col justify-end overflow-hidden">
        {/* Background image placeholder */}
        <div className="absolute inset-0 bg-neutral-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6 text-sm text-white/80" aria-label="Breadcrumb">
            <Link href="/areas" className="hover:text-white">Guides</Link>
            <span>/</span>
            <Link href="/areas" className="hover:text-white">United Kingdom</Link>
            <span>/</span>
            <span className="text-white font-medium">{cityName}</span>
          </nav>

          <h1 className="font-heading text-[60px] leading-none font-bold text-white mb-4 max-md:text-[40px]">
            {cityName}
          </h1>
          <p className="text-lg text-white/90 mb-10 max-w-xl">{data.description}</p>

          {/* Floating search bar */}
          <div className="bg-white rounded-2xl shadow-xl px-6 py-4 flex items-center gap-4 max-w-2xl">
            <MapPin className="size-5 text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={`Search areas in ${cityName}...`}
              className="flex-1 text-neutral-700 outline-none text-sm"
              readOnly
            />
            <Link
              href={`/search?city=${city}`}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              Search
            </Link>
          </div>
        </div>
      </header>

      {/* ── Stats Bar (3 cards) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Avg Property Price", value: data.avgPrice, sub: data.yoy, subIcon: true },
            { label: "Active Listings", value: data.listings, sub: "Properties available now", subIcon: false },
            { label: "Avg Days to Sell", value: `${data.daysToSell} days`, sub: "Faster than UK avg", subIcon: false },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-primary/10 p-6">
              <p className="text-sm text-neutral-500 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-primary font-heading">{stat.value}</p>
              {stat.subIcon ? (
                <p className="text-emerald-600 font-bold flex items-center gap-1 mt-1 text-sm">
                  <TrendingUp className="size-4" /> {stat.sub} YoY
                </p>
              ) : (
                <p className="text-sm text-neutral-400 mt-1">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 pb-24">

        {/* ── 5-Year Price Trend ── */}
        <section>
          <div className="bg-white rounded-xl shadow-sm border border-primary/10 p-8">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-neutral-900">5-Year Price Trend</h2>
                <p className="text-sm text-neutral-500 mt-1">Average property prices in {cityName}</p>
              </div>
              {/* Property type toggle pills */}
              <div className="flex gap-2">
                {["All", "Flat", "Terraced"].map((type, i) => (
                  <span
                    key={type}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold cursor-pointer ${
                      i === 0
                        ? "bg-primary/10 text-primary"
                        : "text-neutral-400 hover:text-primary"
                    }`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
            <AreaPriceTrend />
          </div>
        </section>

        {/* ── Popular Boroughs (4-col grid) ── */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-bold font-heading">Popular Boroughs</h2>
            <Link
              href={`/areas/${city}/all`}
              className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all text-sm"
            >
              View all boroughs <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {BOROUGHS.map((borough) => (
              <Link
                key={borough.name}
                href={`/areas/${city}/${borough.slug}`}
                className="group border border-primary/10 bg-white rounded-xl p-4 hover:shadow-md transition-all"
              >
                {/* Image placeholder */}
                <div className="h-24 w-full rounded-lg overflow-hidden bg-neutral-200 mb-3 group-hover:scale-[1.02] transition-transform duration-300" />
                <p className="font-bold text-neutral-900">{borough.name}</p>
                <p className="text-sm text-neutral-500">Avg {borough.avgPrice}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Properties For Sale (3-col grid) ── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold font-heading">Properties For Sale</h2>
            <button className="border border-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors">
              Filter
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SALE_PROPERTIES.map((property) => (
              <div
                key={property.address}
                className="overflow-hidden rounded-xl border border-primary/10 bg-white shadow-sm hover:shadow-lg transition-all"
              >
                {/* Image 16:10 */}
                <div className="relative" style={{ paddingTop: "62.5%" }}>
                  <div className="absolute inset-0 bg-neutral-200" />
                  {property.badge && (
                    <span className="absolute top-3 right-3 bg-white/90 text-primary text-xs font-bold px-3 py-1 rounded-full">
                      {property.badge}
                    </span>
                  )}
                  <button
                    className="absolute top-3 left-3 p-2 rounded-full bg-white/20 backdrop-blur-sm"
                    aria-label="Save property"
                  >
                    <Heart className="size-4 text-primary/40 hover:text-rose-500" />
                  </button>
                </div>
                <div className="p-5">
                  <p className="text-lg font-bold text-neutral-900">£{property.price}</p>
                  <p className="text-sm text-neutral-500 mb-3">{property.address}</p>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><Bed className="size-3.5" /> {property.beds} bed</span>
                    <span className="flex items-center gap-1"><Bath className="size-3.5" /> {property.baths} bath</span>
                    <span className="flex items-center gap-1"><Maximize2 className="size-3.5" /> {property.sqft} sqft</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <Link
              href={`/search?city=${city}&type=buy`}
              className="bg-primary text-white rounded-full px-8 py-3 font-bold hover:scale-105 transition-transform"
            >
              View all properties
            </Link>
          </div>
        </section>

        {/* ── Transport & Connectivity ── */}
        <section className="bg-primary text-white p-8 lg:p-12 rounded-xl">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-bold font-heading mb-4">Transport &amp; Connectivity</h2>
              <p className="text-white/80 mb-8 leading-relaxed">
                {cityName}&apos;s transport network provides outstanding connectivity across the region,
                with multiple options for commuters and travellers.
              </p>
              <div className="space-y-3">
                {[
                  { route: "City Centre", time: "15 min", pct: 85 },
                  { route: "Airport", time: "25 min", pct: 60 },
                  { route: "Financial District", time: "10 min", pct: 95 },
                ].map((item) => (
                  <div key={item.route}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/80">{item.route}</span>
                      <span className="font-bold">{item.time}</span>
                    </div>
                    <div className="bg-white/10 rounded-full h-1">
                      <div
                        className="bg-white/60 h-1 rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 content-start">
              {[
                { icon: Train, label: "Underground", detail: "11 lines" },
                { icon: Train, label: "Elizabeth Line", detail: "Zone 1–6" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/10 border border-white/10 rounded-lg p-4"
                >
                  <item.icon className="size-5 mb-2 text-white/70" />
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-xs text-white/60">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Local Services (6-icon grid) ── */}
        <section>
          <h2 className="text-3xl font-bold font-heading mb-8">Local Services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {LOCAL_SERVICES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="group bg-white rounded-xl p-6 shadow-sm border border-primary/10 hover:border-primary transition-all text-center"
              >
                <div className="h-12 w-12 rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center mx-auto mb-3">
                  <Icon className="size-5" />
                </div>
                <p className="text-sm font-bold text-neutral-800">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Newsletter CTA ── */}
        <section className="rounded-3xl bg-primary text-white p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
              Stay ahead of the {cityName} market
            </h2>
            <p className="text-white/80 mb-8">
              Weekly price alerts, off-market opportunities and investment insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 outline-none"
              />
              <button className="bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-neutral-100 transition-colors">
                Join the Waitlist
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
```

---

- [ ] **Step 2: Create `src/app/(main)/areas/[city]/loading.tsx`**

```tsx
export default function CityAreaGuideLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="min-h-[70vh] animate-pulse bg-primary/5 rounded-b-2xl" />

      {/* Stats cards skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-primary/10 p-6 space-y-3">
              <div className="h-3 w-24 animate-pulse bg-primary/5 rounded-xl" />
              <div className="h-8 w-32 animate-pulse bg-primary/5 rounded-xl" />
              <div className="h-3 w-20 animate-pulse bg-primary/5 rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 pb-24">
        {/* Chart skeleton */}
        <div className="h-64 animate-pulse bg-primary/5 rounded-xl" />

        {/* Borough cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-primary/10 p-4 space-y-2">
              <div className="h-24 animate-pulse bg-primary/5 rounded-lg" />
              <div className="h-4 w-20 animate-pulse bg-primary/5 rounded" />
              <div className="h-3 w-14 animate-pulse bg-primary/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
```

---

- [ ] **Step 3: Create `src/app/(main)/areas/[city]/error.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CityAreaGuideError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const router = useRouter();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white border border-primary/10 rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        <p className="text-4xl font-black text-primary font-heading mb-2">Britestate</p>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Something went wrong loading this page</h2>
        <p className="text-sm text-neutral-500 mb-8">{error.message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { reset(); router.refresh(); }}
            className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/areas"
            className="border border-primary/20 text-primary font-bold px-6 py-3 rounded-xl hover:bg-primary/5 transition-colors"
          >
            Back to area guides
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

- [ ] **Step 4: Verify build**

```bash
cd britv3.0 && pnpm build
```

Expected: No TypeScript errors. Check that `next/dynamic` import for chart doesn't cause SSR error.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/areas/\[city\]/
git commit -m "feat(area-guides): FAANG-quality city area guide page with hero, stats, trend chart, and borough grid"
```

---

## Chunk 3: Neighbourhood Guide Page

### Task 3: Neighbourhood Guide — `/areas/[city]/[area]`

**Files:**
- Replace: `src/app/(main)/areas/[city]/[area]/page.tsx`
- Create: `src/app/(main)/areas/[city]/[area]/loading.tsx`
- Create: `src/app/(main)/areas/[city]/[area]/error.tsx`

**Key notes for this page:**
- Uses Shadcn `<Tabs>` (from `@/components/ui/tabs`) for the 5-tab layout
- MapEmbed imported via `next/dynamic({ ssr: false })`
- AreaPriceTrend, ListingVolume, PropertyDonut all imported via `next/dynamic({ ssr: false })`
- Expert sidebar: mock a single agent with fallback if not found
- `export const dynamic = 'force-dynamic'`

---

- [ ] **Step 0: Create `src/components/area/PrintButton.tsx`**

Event handlers cannot live in Server Components. The "Download Full PDF" button calls `window.print()` — extract it to a tiny client component:

```tsx
"use client";

import { Download } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold"
    >
      <Download className="size-4" /> Download Full PDF
    </button>
  );
}
```

Then in the area page, import it:
```tsx
import { PrintButton } from "@/components/area/PrintButton";
```
And replace the inline button:
```tsx
// ❌ DON'T do this (onClick in Server Component):
// <button onClick={() => window.print()}>...

// ✅ DO this:
<PrintButton />
```

---

- [ ] **Step 1: Replace `src/app/(main)/areas/[city]/[area]/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Trees,
  Coffee,
  GraduationCap,
  Phone,
  Calendar,
  Share2,
  Wifi,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
// Note: Download is NOT imported here — it lives inside PrintButton.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrintButton } from "@/components/area/PrintButton";

export const dynamic = "force-dynamic";

const MapEmbed = dynamic(
  () => import("@/components/maps/MapEmbed").then((m) => ({ default: m.MapEmbed })),
  { ssr: false, loading: () => <div className="w-full h-full animate-pulse bg-primary/5 rounded-2xl" /> }
);

const AreaPriceTrend = dynamic(
  () => import("@/components/charts/AreaPriceTrend").then((m) => ({ default: m.AreaPriceTrend })),
  { ssr: false, loading: () => <div className="h-[200px] animate-pulse bg-primary/5 rounded-xl" /> }
);

const PropertyDonut = dynamic(
  () => import("@/components/charts/PropertyDonut").then((m) => ({ default: m.PropertyDonut })),
  { ssr: false, loading: () => <div className="h-[140px] animate-pulse bg-primary/5 rounded-xl" /> }
);

const ListingVolume = dynamic(
  () => import("@/components/charts/ListingVolume").then((m) => ({ default: m.ListingVolume })),
  { ssr: false, loading: () => <div className="h-[180px] animate-pulse bg-primary/5 rounded-xl" /> }
);

type AreaPageProps = Readonly<{ params: Promise<{ city: string; area: string }> }>;

export async function generateMetadata({ params }: AreaPageProps): Promise<Metadata> {
  const { city, area } = await params;
  const name = area.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const cityName = city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  // MOCK_AREA.postcode used here — in production this would be fetched from DB
  return {
    title: `${name} Area Guide — ${MOCK_AREA.postcode} | Britestate`,
    description: `Discover ${name}: property prices, schools, transport and lifestyle in ${cityName}.`,
    alternates: { canonical: `/areas/${city}/${area}` },
  };
}

const MOCK_AREA = {
  name: "Isleworth",
  postcode: "TW7",
  borough: "Hounslow",
  description: "A charming riverside suburb blending historic character with modern connectivity. From the picturesque Old Isleworth to the well-connected Spring Grove.",
  greenSpace: "92%",
  walkability: "High",
  noise: "Quiet",
  avgPrice: "£542,000",
  yoy: "+3.8%",
};

const MOCK_AGENT = {
  name: "Marcus Thompson",
  role: "TW7 Specialist",
  quote: "Isleworth is one of West London's best-kept secrets. I've helped over 150 families find their perfect home here.",
  initials: "MT",
};

const MOCK_LISTINGS = [
  { price: "£485,000", address: "14 South Street, TW7 7BG", beds: 3, baths: 2, status: "For Sale", sqft: "1,100" },
  { price: "£375,000", address: "Nazareth House, TW7 5NR", beds: 2, baths: 1, status: "Reduced", sqft: "750" },
  { price: "£650,000", address: "Twickenham Road, TW7 6DB", beds: 4, baths: 2, status: "New", sqft: "1,450" },
  { price: "£350,000", address: "Worton Road, TW7 6ER", beds: 1, baths: 1, status: "For Sale", sqft: "560" },
];

const MOCK_SCHOOLS = [
  { name: "The Blue School (CE)", ofsted: "Outstanding" as const, distance: "0.3 mi" },
  { name: "Isleworth & Syon School", ofsted: "Good" as const, distance: "0.6 mi" },
  { name: "Marlborough Primary", ofsted: "Outstanding" as const, distance: "0.8 mi" },
  { name: "Gumley House Convent", ofsted: "Outstanding" as const, distance: "1.1 mi" },
];

const MOCK_LOCAL_FAVOURITES = [
  { icon: Trees, color: "text-emerald-600", label: "Osterley Park", desc: "Stunning National Trust grounds with 18th-century house" },
  { icon: Coffee, color: "text-amber-600", label: "The London Apprentice", desc: "Historic riverside pub dating to the 16th century" },
  { icon: GraduationCap, color: "text-blue-600", label: "West Thames College", desc: "Further education and community learning hub" },
];

function OfstedBadge({ rating }: Readonly<{ rating: "Outstanding" | "Good" | "Requires Improvement" }>) {
  const classes = {
    Outstanding: "bg-emerald-100 text-emerald-800",
    Good: "bg-blue-100 text-blue-800",
    "Requires Improvement": "bg-amber-100 text-amber-800",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${classes[rating]}`}>
      {rating}
    </span>
  );
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { city, area } = await params;
  const cityName = city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Breadcrumb ── */}
        <nav className="text-sm text-neutral-500 mb-8 flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/areas" className="hover:text-primary">Area Guides</Link>
          <span>/</span>
          <Link href={`/areas/${city}`} className="hover:text-primary">{cityName}</Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">{MOCK_AREA.name}</span>
        </nav>

        {/* ── Split Hero ── */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16 items-start">
          {/* Left: Text */}
          <div>
            <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
              {MOCK_AREA.borough}
            </span>
            <h1 className="font-heading font-black text-neutral-900 mb-4 max-lg:text-[36px]" style={{ fontSize: "clamp(36px,4vw,56px)", lineHeight: 1.1 }}>
              Life in {MOCK_AREA.postcode} —<br />{MOCK_AREA.name}
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed mb-8 max-w-lg">
              {MOCK_AREA.description}
            </p>
            {/* 3 mini stat cards */}
            <div className="flex flex-wrap gap-4">
              {[
                { value: MOCK_AREA.greenSpace, label: "Green Space" },
                { value: MOCK_AREA.walkability, label: "Walkability" },
                { value: MOCK_AREA.noise, label: "Noise Level" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-neutral-100 shadow-sm rounded-xl p-4 min-w-[140px]">
                  <p className="text-primary font-bold text-2xl">{stat.value}</p>
                  <p className="text-neutral-500 text-xs font-medium uppercase tracking-tight mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Map */}
          <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl border-4 border-white">
            <MapEmbed
              latitude={51.4754}
              longitude={-0.3368}
              zoom={13}
              className="w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-3 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <MapPin className="size-4 text-primary" />
                {MOCK_AREA.postcode} Boundary Overview
              </div>
              <button className="bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold">
                Interactive Map
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="overview">
          <TabsList variant="line" className="w-full border-b border-neutral-200 mb-10 rounded-none h-auto pb-0">
            {["overview", "market", "transport", "schools", "lifestyle"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="capitalize text-sm font-semibold pb-4 px-6 data-active:text-primary data-active:border-b-2 data-active:border-primary rounded-none"
              >
                {tab === "market" ? "Market Data" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Tab 1: Overview ── */}
          <TabsContent value="overview">
            <div className="space-y-12">
              {/* Local Favourites */}
              <section>
                <h2 className="text-2xl font-bold font-heading mb-6">Local Favourites</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {MOCK_LOCAL_FAVOURITES.map(({ icon: Icon, color, label, desc }) => (
                    <div key={label} className="bg-white border border-neutral-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <Icon className={`size-6 ${color} mb-3`} />
                      <p className="font-bold text-neutral-900">{label}</p>
                      <p className="text-sm text-neutral-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Demographic Snapshot */}
              <section className="bg-primary/5 border border-primary/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold font-heading mb-6">Demographic Snapshot</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: "Top Group", value: "Families" },
                    { label: "Median Age", value: "37" },
                    { label: "Ownership", value: "58%" },
                    { label: "Vibe", value: "Suburban" },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-neutral-900 font-bold text-lg">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2-col: Content + Expert Sidebar */}
              <div className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="text-2xl font-bold font-heading">About {MOCK_AREA.name}</h2>
                  <p className="text-neutral-600 leading-relaxed">
                    Isleworth is one of West London&apos;s best-kept secrets, a riverside suburb that combines the charm of a historic village with the convenience of excellent transport links. Situated within the London Borough of Hounslow, it straddles the banks of the Thames near its confluence with the Duke of Northumberland&apos;s River.
                  </p>
                  <p className="text-neutral-600 leading-relaxed">
                    For commuters, Isleworth station provides regular South Western Railway services to Waterloo in around 37 minutes, while the Piccadilly Line is accessible from both Osterley and Hounslow East. With average house prices still below the wider London average, Isleworth represents compelling value.
                  </p>
                </div>

                {/* Expert Sidebar */}
                <div className="sticky top-8 bg-white border border-primary/10 rounded-2xl shadow-sm p-6 h-fit">
                  <div className="relative mb-4">
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      <span className="text-primary font-bold text-xl">{MOCK_AGENT.initials}</span>
                    </div>
                    <span className="absolute bottom-0 right-0 bg-green-500 size-4 rounded-full border-2 border-white" />
                  </div>
                  <p className="text-lg font-bold text-neutral-900">{MOCK_AGENT.name}</p>
                  <p className="text-sm text-primary font-semibold mb-3">{MOCK_AGENT.role}</p>
                  <p className="text-sm text-neutral-600 italic mb-6">&ldquo;{MOCK_AGENT.quote}&rdquo;</p>
                  <button className="w-full bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-3 hover:bg-primary/90 transition-colors">
                    <Phone className="size-4" /> Speak to {MOCK_AGENT.name.split(" ")[0]}
                  </button>
                  <button className="w-full border border-primary/20 text-primary font-bold py-3 rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                    <Calendar className="size-4" /> Book a Viewing
                  </button>
                </div>
              </div>

              {/* Property Listings (4-col grid) */}
              <section>
                <h2 className="text-2xl font-bold font-heading mb-6">Properties in {MOCK_AREA.postcode}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {MOCK_LISTINGS.map((listing) => (
                    <div
                      key={listing.address}
                      className="bg-white rounded-xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-40 bg-neutral-200">
                        <span className="absolute top-2 left-2 bg-white/90 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {listing.status}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-primary font-bold text-lg">{listing.price}</p>
                        <p className="font-semibold text-sm text-neutral-900 truncate">{listing.address}</p>
                        <div className="flex items-center gap-3 text-neutral-500 text-xs mt-2">
                          <span className="flex items-center gap-1"><Bed className="size-3" /> {listing.beds}</span>
                          <span className="flex items-center gap-1"><Bath className="size-3" /> {listing.baths}</span>
                          <span className="flex items-center gap-1"><Maximize2 className="size-3" /> {listing.sqft}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Newsletter CTA */}
              <section className="rounded-3xl bg-primary text-white p-10 md:p-16 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold font-heading mb-3">Get {MOCK_AREA.postcode} market updates</h2>
                  <p className="text-white/80 mb-6 text-sm">Be the first to know about new listings and price changes.</p>
                  <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      placeholder="Your email"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 outline-none text-sm"
                    />
                    <button className="bg-white text-primary font-bold px-6 py-3 rounded-xl text-sm hover:bg-neutral-100 transition-colors">
                      Join Waitlist
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </TabsContent>

          {/* ── Tab 2: Market Data ── */}
          <TabsContent value="market">
            <div className="space-y-8">
              {/* Header actions */}
              <div className="flex justify-end gap-3">
                <button className="flex items-center gap-2 border border-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors">
                  <Share2 className="size-4" /> Share
                </button>
                {/* PrintButton is "use client" — window.print() cannot be called in a Server Component */}
                <PrintButton />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Price Trend Card */}
                  <div className="bg-white rounded-xl border border-primary/10 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                      <h3 className="font-bold text-neutral-900">Average Property Price Trends</h3>
                      <select className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 outline-none focus:border-primary">
                        <option>Last 5 Years</option>
                        <option>Last 12 Months</option>
                      </select>
                    </div>
                    <AreaPriceTrend />
                    <div className="mt-4 bg-primary/5 p-4 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-xs text-neutral-500 font-medium">Current avg price</p>
                        <p className="text-3xl font-black text-primary font-heading">{MOCK_AREA.avgPrice}</p>
                      </div>
                      <p className="text-emerald-600 flex items-center gap-1 font-bold">
                        <TrendingUp className="size-4" /> {MOCK_AREA.yoy} YoY
                      </p>
                    </div>
                  </div>

                  {/* Listings vs Sold Volume */}
                  <div className="bg-white rounded-xl border border-primary/10 shadow-sm p-6">
                    <h3 className="font-bold text-neutral-900 mb-4">New Listings vs Sold Volume</h3>
                    <ListingVolume />
                  </div>

                  {/* Schools Table */}
                  <div className="bg-white rounded-xl border border-primary/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-neutral-900">Schools in Catchment</h3>
                      <span className="bg-primary/5 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        {MOCK_SCHOOLS.length} schools
                      </span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>School Name</TableHead>
                          <TableHead>Ofsted</TableHead>
                          <TableHead>Distance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {MOCK_SCHOOLS.map((school) => (
                          <TableRow key={school.name} className="hover:bg-primary/5 transition-colors">
                            <TableCell className="font-medium">{school.name}</TableCell>
                            <TableCell><OfstedBadge rating={school.ofsted} /></TableCell>
                            <TableCell className="text-neutral-500">{school.distance}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="text-[10px] text-neutral-400 italic mt-4">Source: Department for Education (DfE) 2024</p>
                  </div>
                </div>

                {/* Sidebar (1/3) */}
                <div className="space-y-6">
                  {/* Property Types Donut */}
                  <div className="bg-white rounded-xl border border-primary/10 shadow-sm p-6">
                    <h3 className="font-bold text-neutral-900 mb-4">Property Types</h3>
                    <PropertyDonut />
                  </div>

                  {/* Demographics */}
                  <div className="bg-white rounded-xl border border-primary/10 shadow-sm p-6">
                    <h3 className="font-bold text-neutral-900 mb-4">Demographics</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Owner Occupied", pct: 58 },
                        { label: "Private Rented", pct: 28 },
                        { label: "Social Rented", pct: 14 },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs text-neutral-600 mb-1">
                            <span>{item.label}</span>
                            <span className="font-bold">{item.pct}%</span>
                          </div>
                          <div className="bg-primary/5 rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${item.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connectivity */}
                  <div className="bg-primary text-white rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-bold text-sm">Ultrafast Broadband</p>
                      <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">98% Coverage</span>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 mb-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-white/60">Download</p>
                          <p className="text-2xl font-black">900<span className="text-sm font-normal ml-1">Mbps</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60">Upload</p>
                          <p className="text-2xl font-black">110<span className="text-sm font-normal ml-1">Mbps</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="size-4 text-white/60" />
                      <span className="text-white/80">5G Available</span>
                    </div>
                  </div>

                  {/* Crime Index */}
                  <div className="bg-white rounded-xl border border-primary/10 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="size-5 text-primary" />
                      <h3 className="font-bold text-neutral-900">Crime Index</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Isleworth", level: "Low", color: "bg-emerald-500", pct: 30 },
                        { label: "Hounslow", level: "Average", color: "bg-amber-400", pct: 55 },
                        { label: "London", level: "Average", color: "bg-slate-300", pct: 65 },
                      ].map((row) => (
                        <div key={row.label}>
                          <div className="flex justify-between text-xs text-neutral-600 mb-1">
                            <span>{row.label}</span>
                            <span className="font-medium">{row.level}</span>
                          </div>
                          <div className="bg-neutral-100 rounded-full h-1.5">
                            <div className={`${row.color} h-1.5 rounded-full`} style={{ width: `${row.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-neutral-400 italic mt-4">Source: Metropolitan Police Crime Statistics</p>
                  </div>
                </div>
              </div>

              {/* Full-width map */}
              <div className="relative h-80 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                <MapEmbed latitude={51.4754} longitude={-0.3368} zoom={13} className="w-full h-full" />
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 3: Transport ── */}
          <TabsContent value="transport">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-heading">Transport &amp; Connectivity</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { icon: "🚂", name: "London Waterloo", detail: "37 mins via SWR" },
                  { icon: "✈️", name: "Heathrow Airport", detail: "15 mins drive (M4)" },
                  { icon: "🚇", name: "Osterley (Piccadilly)", detail: "1.2 miles away" },
                  { icon: "🚇", name: "Hounslow East (Piccadilly)", detail: "1.5 miles away" },
                ].map((item) => (
                  <div key={item.name} className="bg-white border border-primary/10 rounded-xl p-5 flex items-center gap-4">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-bold text-neutral-900">{item.name}</p>
                      <p className="text-sm text-neutral-500">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 4: Schools ── */}
          <TabsContent value="schools">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-heading">Schools in Catchment</h2>
              <div className="bg-white rounded-xl border border-primary/10 p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>Ofsted</TableHead>
                      <TableHead>Distance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_SCHOOLS.map((school) => (
                      <TableRow key={school.name} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell><OfstedBadge rating={school.ofsted} /></TableCell>
                        <TableCell className="text-neutral-500">{school.distance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-[10px] text-neutral-400 italic mt-4">Source: Department for Education (DfE) 2024</p>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 5: Lifestyle ── */}
          <TabsContent value="lifestyle">
            <div className="space-y-8">
              <h2 className="text-2xl font-bold font-heading">Life in {MOCK_AREA.name}</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {MOCK_LOCAL_FAVOURITES.map(({ icon: Icon, color, label, desc }) => (
                  <div key={label} className="bg-white border border-neutral-100 rounded-xl p-6">
                    <Icon className={`size-8 ${color} mb-4`} />
                    <p className="font-bold text-neutral-900 text-lg mb-2">{label}</p>
                    <p className="text-sm text-neutral-500">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-neutral-600 leading-relaxed max-w-3xl">
                {MOCK_AREA.name} is known for its community spirit and slower pace of life without sacrificing the benefits of London living. Residents enjoy the proximity to the River Thames, with the &ldquo;Town Wharf&rdquo; being a popular spot for weekend strolls and local pub visits. Osterley Park, a National Trust property just minutes away, offers 140 acres of parkland for walking, cycling and outdoor events.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
```

---

- [ ] **Step 2: Create `src/app/(main)/areas/[city]/[area]/loading.tsx`**

```tsx
export default function AreaPageLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-64 animate-pulse bg-primary/5 rounded" />

      {/* Split hero skeleton */}
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="h-6 w-24 animate-pulse bg-primary/5 rounded-full" />
          <div className="h-14 w-3/4 animate-pulse bg-primary/5 rounded-xl" />
          <div className="h-4 w-full animate-pulse bg-primary/5 rounded" />
          <div className="h-4 w-5/6 animate-pulse bg-primary/5 rounded" />
          <div className="flex gap-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-36 animate-pulse bg-primary/5 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="h-[400px] animate-pulse bg-primary/5 rounded-2xl" />
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-8 border-b border-neutral-200 pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 w-20 animate-pulse bg-primary/5 rounded" />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse bg-primary/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
```

---

- [ ] **Step 3: Create `src/app/(main)/areas/[city]/[area]/error.tsx`**

Same pattern as the city error boundary — copy and adjust links:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AreaPageError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const router = useRouter();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white border border-primary/10 rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        <p className="text-4xl font-black text-primary font-heading mb-2">Britestate</p>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Something went wrong loading this page</h2>
        <p className="text-sm text-neutral-500 mb-8">{error.message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { reset(); router.refresh(); }}
            className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/areas"
            className="border border-primary/20 text-primary font-bold px-6 py-3 rounded-xl hover:bg-primary/5 transition-colors"
          >
            Back to area guides
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

- [ ] **Step 4: Verify build**

```bash
cd britv3.0 && pnpm build
```

Expected: No TypeScript errors. If Tabs `variant` prop errors appear, check that you're passing `variant="line"` (string literal, not a variable).

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/areas/\[city\]/\[area\]/
git commit -m "feat(area-guides): FAANG-quality neighbourhood guide with tabbed layout, market data, maps, and expert sidebar"
```

---

## Chunk 4: Sold Prices Individual Property Page

### Task 4: Sold Prices Individual Property — `/sold-prices/[area]/[slug]`

**Files:**
- Create: `src/app/(main)/sold-prices/[area]/[slug]/page.tsx`
- Create: `src/app/(main)/sold-prices/[area]/[slug]/loading.tsx`
- Create: `src/app/(main)/sold-prices/[area]/[slug]/error.tsx`

**Key notes:**
- `export const dynamic = "force-dynamic"`
- 404 handling: `notFound()` from `next/navigation` if slug not found (mock: always found for now)
- MapEmbed imported via `next/dynamic({ ssr: false })` with `grayscale` prop
- 2-col layout: main (2/3) + sticky sidebar (1/3)
- Mobile: Map card inserts between Hero Card and Price History

---

- [ ] **Step 1: Create `src/app/(main)/sold-prices/[area]/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { History, MapPin, Share2, Heart, ExternalLink, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const MapEmbed = dynamic(
  () => import("@/components/maps/MapEmbed").then((m) => ({ default: m.MapEmbed })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-primary/5 rounded-lg" /> }
);

type SoldPriceSlugProps = Readonly<{
  params: Promise<{ area: string; slug: string }>;
}>;

// Mock data — in production this would query: SELECT * FROM sold_prices WHERE slug = $1
const MOCK_PROPERTIES: Record<string, {
  address: string;
  postcode: string;
  type: string;
  lastPrice: number;
  lastDate: string;
  growth: string;
  estimatedValue: string;
  history: Array<{ price: number; date: string; change: string | null }>;
  nearby: Array<{ address: string; price: string; date: string }>;
  areaGrowth: string;
  area: string;
}> = {
  "14-south-street-isleworth-tw7-7bg": {
    address: "14 South Street, Isleworth",
    postcode: "TW7 7BG",
    type: "Terraced",
    lastPrice: 485000,
    lastDate: "Dec 2025",
    growth: "+18.4%",
    estimatedValue: "£512,000",
    history: [
      { price: 485000, date: "Dec 2025", change: null },
      { price: 409500, date: "Mar 2019", change: "+18.4%" },
      { price: 352000, date: "Jul 2014", change: "+16.3%" },
      { price: 210000, date: "Nov 2008", change: "+67.6%" },
    ],
    nearby: [
      { address: "22 South Street, TW7 7BG", price: "£465,000", date: "Oct 2025" },
      { address: "9 South Street, TW7 7BA", price: "£498,000", date: "Sep 2025" },
      { address: "31 South Street, TW7 7BH", price: "£452,000", date: "Aug 2025" },
      { address: "5 South Street, TW7 7BA", price: "£471,500", date: "Jul 2025" },
      { address: "18 South Street, TW7 7BG", price: "£489,000", date: "Jun 2025" },
      { address: "4 Mill Plat, TW7 6ES", price: "£508,000", date: "May 2025" },
    ],
    areaGrowth: "3.8",
    area: "Isleworth",
  },
};

async function fetchPropertyBySlug(slug: string) {
  return MOCK_PROPERTIES[slug] ?? null;
}

export async function generateMetadata({ params }: SoldPriceSlugProps): Promise<Metadata> {
  const { area, slug } = await params; // destructure both in one await — never await params twice
  const property = await fetchPropertyBySlug(slug);
  if (!property) return { title: "Property Not Found | Britestate" };
  return {
    title: `${property.address} Sold Price History | Britestate`,
    description: `See the full sold price history for ${property.address}. Last sold for £${property.lastPrice.toLocaleString()}.`,
    alternates: { canonical: `/sold-prices/${area}/${slug}` },
  };
}

export default async function SoldPricesSlugPage({ params }: SoldPriceSlugProps) {
  const { area, slug } = await params;
  const property = await fetchPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const { address, postcode, type, lastPrice, lastDate, growth, estimatedValue, history, nearby, areaGrowth } = property;

  return (
    <>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <nav className="text-sm text-primary/60 flex items-center gap-2" aria-label="Breadcrumb">
            <Link href="/sold-prices" className="hover:text-primary">Sold Prices</Link>
            <span>›</span>
            <Link href={`/sold-prices/${area}`} className="hover:text-primary capitalize">{area.replace(/-/g, " ")}</Link>
            <span>›</span>
            <span className="text-neutral-800 font-medium truncate max-w-[200px]">{address}</span>
          </nav>
          <div className="flex-shrink-0">
            <input
              type="text"
              placeholder="Search address or postcode..."
              className="rounded-full bg-primary/5 h-10 px-4 text-sm outline-none hidden sm:block w-56"
              readOnly
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Main (2/3) ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Hero Card */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-primary/10">
              {/* 16:9 image placeholder */}
              <div className="aspect-video bg-primary/10 flex items-center justify-center">
                <MapPin className="size-12 text-primary/30" />
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                  <div>
                    <h1 className="text-3xl font-black text-primary font-heading leading-tight">{address}</h1>
                    <p className="text-lg text-primary/70 mt-1">{postcode} · {type}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="border border-primary/20 rounded-lg px-4 py-2 text-sm flex items-center gap-2 hover:bg-primary/5 transition-colors">
                      <Share2 className="size-4" /> Share
                    </button>
                    <button className="border border-primary/20 rounded-lg px-4 py-2 text-sm flex items-center gap-2 hover:bg-primary/5 transition-colors">
                      <Heart className="size-4" /> Save
                    </button>
                  </div>
                </div>

                {/* 3 stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-primary/5 p-5">
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-1">Last Sold Price</p>
                    <p className="text-2xl font-black text-primary font-heading">£{lastPrice.toLocaleString()}</p>
                    <p className="text-xs text-neutral-500 mt-1">{lastDate}</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 p-5 border-l-4 border-emerald-500">
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-1">Market Performance</p>
                    <p className="text-2xl font-black text-emerald-700">{growth}</p>
                    <p className="text-xs text-neutral-500 mt-1">Since last purchase</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 p-5">
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-1">Estimated Value</p>
                    <p className="text-2xl font-black text-primary font-heading">{estimatedValue}</p>
                    <p className="text-xs text-neutral-500 mt-1">Britestate estimate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price History Card */}
            <div className="rounded-xl bg-white shadow-sm border border-primary/10 p-6 sm:p-8">
              <h2 className="font-bold text-xl text-neutral-900 font-heading flex items-center gap-2 mb-6">
                <History className="size-5 text-primary" /> Price History
              </h2>
              {/* Vertical timeline */}
              <div className="relative space-y-6 before:absolute before:left-3 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-primary/10">
                {history.map((entry, i) => (
                  <div key={entry.date} className="relative pl-10">
                    {/* Timeline dot */}
                    <span
                      className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-white ${
                        i === 0
                          ? "bg-primary"
                          : i === 1
                            ? "bg-primary/40"
                            : "bg-primary/20"
                      }`}
                    />
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-bold text-lg text-primary">£{entry.price.toLocaleString()}</p>
                        <p className="text-sm text-primary/60">{entry.date}</p>
                      </div>
                      {entry.change && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          {entry.change}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Sold Prices */}
            {nearby.length > 0 && (
              <div className="rounded-xl bg-white shadow-sm border border-primary/10 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-xl text-neutral-900 font-heading">Nearby Sold Prices</h2>
                  <Link href={`/sold-prices/${area}`} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                    View all on map <ExternalLink className="size-3" />
                  </Link>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Sold Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nearby.map((item) => (
                      <TableRow key={item.address} className="hover:bg-primary/5 transition-colors">
                        <TableCell>{item.address}</TableCell>
                        <TableCell className="font-bold text-primary text-right">{item.price}</TableCell>
                        <TableCell className="text-neutral-500 text-right">{item.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* ── Sidebar (1/3) ── */}
          <div className="space-y-6">

            {/* Map Card */}
            <div className="rounded-xl bg-white shadow-sm border border-primary/10 p-4 overflow-hidden">
              <div className="h-64 rounded-lg overflow-hidden relative">
                <MapEmbed
                  latitude={51.4754}
                  longitude={-0.3368}
                  zoom={16}
                  className="w-full h-full"
                  grayscale
                />
                <div className="absolute top-3 left-3 bg-primary text-white rounded px-3 py-1 text-[10px] font-bold shadow">
                  {postcode}
                </div>
              </div>
              <button className="w-full bg-primary text-white rounded-lg py-3 font-bold mt-4 hover:bg-primary/90 transition-colors text-sm">
                View Street View
              </button>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <span>🚂</span> Isleworth Station — 0.4 mi
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <span>🎓</span> Outstanding school — 0.3 mi
                </div>
              </div>
            </div>

            {/* Sticky Valuation CTA */}
            <div className="rounded-xl bg-primary text-white p-6 shadow-xl sticky top-24">
              <h3 className="text-xl font-bold mb-4">Thinking of selling?</h3>
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <p className="text-sm text-white/80">
                  Local prices in {property.area} have increased by{" "}
                  <span className="font-bold text-emerald-300">{areaGrowth}%</span> in the last 12 months
                </p>
              </div>
              <button className="w-full bg-white text-primary font-bold py-3 rounded-lg hover:bg-neutral-100 transition-all flex items-center justify-center gap-2">
                <TrendingUp className="size-4" /> Get a free valuation
              </button>
              <p className="text-center text-xs text-white/60 mt-4">Trusted by 10,000+ homeowners</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
```

---

- [ ] **Step 2: Create `src/app/(main)/sold-prices/[area]/[slug]/loading.tsx`**

```tsx
export default function SoldPricesSlugLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero card skeleton */}
          <div className="rounded-xl bg-white border border-primary/10 overflow-hidden">
            <div className="aspect-video animate-pulse bg-primary/5" />
            <div className="p-8 space-y-6">
              <div className="h-8 w-2/3 animate-pulse bg-primary/5 rounded-xl" />
              <div className="h-4 w-1/3 animate-pulse bg-primary/5 rounded" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse bg-primary/5 rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Price history skeleton */}
          <div className="rounded-xl bg-white border border-primary/10 p-8 space-y-6">
            <div className="h-6 w-32 animate-pulse bg-primary/5 rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="pl-10 flex justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-24 animate-pulse bg-primary/5 rounded" />
                  <div className="h-3 w-16 animate-pulse bg-primary/5 rounded" />
                </div>
                <div className="h-5 w-12 animate-pulse bg-primary/5 rounded-full" />
              </div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="rounded-xl bg-white border border-primary/10 p-8 space-y-4">
            <div className="h-6 w-40 animate-pulse bg-primary/5 rounded" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 animate-pulse bg-primary/5 rounded" />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="h-80 animate-pulse bg-primary/5 rounded-xl" />
          <div className="h-56 animate-pulse bg-primary/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
```

---

- [ ] **Step 3: Create `src/app/(main)/sold-prices/[area]/[slug]/error.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SoldPricesSlugError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const router = useRouter();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white border border-primary/10 rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        <p className="text-4xl font-black text-primary font-heading mb-2">Britestate</p>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Something went wrong loading this page</h2>
        <p className="text-sm text-neutral-500 mb-8">{error.message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { reset(); router.refresh(); }}
            className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/areas"
            className="border border-primary/20 text-primary font-bold px-6 py-3 rounded-xl hover:bg-primary/5 transition-colors"
          >
            Back to area guides
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

- [ ] **Step 4: Verify full build**

```bash
cd britv3.0 && pnpm build && pnpm lint
```

Expected: Zero TypeScript errors, zero ESLint errors. All 14 new/modified files should compile without issue.

If you see TypeScript errors about the `dynamic` import pattern, ensure the `.then((m) => ({ default: m.ComponentName }))` pattern is used correctly for named exports.

- [ ] **Step 5: Final commit**

```bash
git add src/app/\(main\)/sold-prices/\[area\]/\[slug\]/
git commit -m "feat(sold-prices): add individual property sold price history page with map, timeline, and valuation CTA"
```

---

## Verification Checklist

After all chunks are complete, verify the following URLs render correctly on `pnpm dev`:

- [ ] `http://localhost:3000/areas/london` — city guide with hero, stats cards, trend chart, borough grid
- [ ] `http://localhost:3000/areas/london/isleworth` — neighbourhood guide with 5 tabs, split hero with map, expert sidebar
- [ ] `http://localhost:3000/sold-prices/isleworth/14-south-street-isleworth-tw7-7bg` — individual sold price page with price history timeline, map, valuation CTA
- [ ] Footer on any page shows Area Guides column with 8 cities + "Browse all areas →" link
- [ ] `border-primary/10` renders as a subtle green border (not invisible) — confirms Tailwind v4 channel format fix worked
- [ ] Charts render without SSR errors (Recharts uses next/dynamic correctly)
- [ ] Map renders correctly if `NEXT_PUBLIC_MAPTILER_API_KEY` is set in `.env.local` (falls back gracefully if not set)
