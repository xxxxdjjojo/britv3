# Section 6 — Area & Location Pages: Ship-Ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all Section 6 pages (area guides, sold prices, market trends) ship-ready with rich mock data, proper SEO infrastructure, dynamic content per URL, internal linking, and the two missing page types (6.4 stats dashboard, 6.8 national trends).

**Architecture:** Service layer with rich mock data → pages consume services → fallback to mock when Supabase returns empty. Each area/city gets its own realistic dataset. Existing `land-registry` service and `price_paid_data` table are the foundation for sold prices. All pages SSR with `generateMetadata()` and JSON-LD structured data.

**Tech Stack:** Next.js 16 App Router, Supabase (server client), TypeScript, Tailwind v4, Recharts (existing charts), MapLibre (existing maps), Zod validation.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/services/areas/area-data-service.ts` | City + neighbourhood data fetching with mock fallback |
| `src/services/areas/market-trends-service.ts` | Regional + national market trends data |
| `src/services/areas/sold-prices-service.ts` | Sold prices by area, wraps existing land-registry service |
| `src/services/areas/mock-data/cities.ts` | Rich mock data for 12 UK cities |
| `src/services/areas/mock-data/neighbourhoods.ts` | Rich mock data for 40+ neighbourhoods |
| `src/services/areas/mock-data/sold-prices.ts` | 200+ realistic sold price records across areas |
| `src/services/areas/mock-data/market-trends.ts` | Regional + national trend data with time series |
| `src/types/areas.ts` | All types for area, city, neighbourhood, sold price, market trend |
| `src/lib/seo/area-jsonld.ts` | JSON-LD generators for Place, BreadcrumbList, Dataset schemas |
| `src/app/(main)/areas/[city]/stats/page.tsx` | 6.4 — Area stats dashboard |
| `src/app/(main)/market-trends/national/page.tsx` | 6.8 — National market trends |
| `src/components/areas/AreaSearchCTA.tsx` | Reusable "Browse properties in [area]" CTA |
| `src/components/areas/SoldPriceRow.tsx` | Clickable sold price table row (links to individual page) |
| `src/components/areas/DataAttribution.tsx` | "Source: Land Registry | Last updated: [date]" component |
| `src/components/areas/InternalLinkCard.tsx` | Cross-linking card between area pages |

### Modified Files
| File | Changes |
|------|---------|
| `src/app/(main)/areas/[city]/page.tsx` | Replace hardcoded London data with service call; add JSON-LD; fix boroughs/transport per city |
| `src/app/(main)/areas/[city]/[area]/page.tsx` | Replace MOCK_AREA with service call; render per-area data; add JSON-LD |
| `src/app/(main)/sold-prices/[area]/page.tsx` | Wire to sold-prices-service; fix breadcrumb; make rows clickable; add canonical |
| `src/app/(main)/sold-prices/[area]/[slug]/page.tsx` | Wire to service; add disclaimer on estimated value |
| `src/app/(main)/market-trends/page.tsx` | Wire to market-trends-service; add data attribution; link to national view |
| `src/app/sitemap.ts` | Add all area, sold-prices, stats, and market-trends sub-pages |

---

## Wave 1: Types + Mock Data Foundation

### Task 1: Area Types

**Files:**
- Create: `src/types/areas.ts`

- [ ] **Step 1: Create the area types file**

```typescript
// src/types/areas.ts

export type PropertyTypeCode = "D" | "S" | "T" | "F" | "O";

export type CityData = Readonly<{
  slug: string;
  name: string;
  county: string;
  region: string;
  population: string;
  description: string;
  avgPrice: number;
  avgPriceFormatted: string;
  yoyChange: number;
  yoyChangeFormatted: string;
  activeListings: number;
  avgDaysToSell: number;
  medianPrice: number;
  transactionsLast12m: number;
  priceByType: Record<PropertyTypeCode, number>;
  boroughs: BoroughSummary[];
  transport: TransportLink[];
  coordinates: { lat: number; lng: number };
  postcodePrefix: string;
}>;

export type BoroughSummary = Readonly<{
  name: string;
  slug: string;
  avgPrice: string;
  description: string;
}>;

export type TransportLink = Readonly<{
  name: string;
  type: "rail" | "underground" | "tram" | "bus" | "airport";
  detail: string;
  emoji: string;
}>;

export type NeighbourhoodData = Readonly<{
  slug: string;
  name: string;
  citySlug: string;
  cityName: string;
  borough: string;
  postcode: string;
  description: string;
  coordinates: { lat: number; lng: number };
  avgPrice: number;
  avgPriceFormatted: string;
  yoyChange: string;
  greenSpace: string;
  walkability: "High" | "Medium" | "Low";
  noiseLevel: "Quiet" | "Moderate" | "Busy";
  demographics: {
    topGroup: string;
    medianAge: number;
    ownerOccupied: number;
    privateRented: number;
    socialRented: number;
    vibe: string;
  };
  schools: SchoolEntry[];
  localFavourites: LocalFavourite[];
  propertyMix: Record<PropertyTypeCode, number>;
  broadband: { download: number; upload: number; coverage5g: boolean };
  crimeIndex: { local: number; borough: number; city: number };
  agent: { name: string; role: string; quote: string; initials: string };
  transportLinks: TransportLink[];
}>;

export type SchoolEntry = Readonly<{
  name: string;
  ofsted: "Outstanding" | "Good" | "Requires Improvement" | "Inadequate";
  distance: string;
  type: "Primary" | "Secondary" | "All-through";
}>;

export type LocalFavourite = Readonly<{
  label: string;
  desc: string;
  category: "park" | "cafe" | "pub" | "school" | "shop" | "attraction";
}>;

export type SoldPriceRecord = Readonly<{
  id: string;
  slug: string;
  address: string;
  postcode: string;
  propertyType: PropertyTypeCode;
  propertyTypeLabel: string;
  beds: number;
  price: number;
  priceFormatted: string;
  date: string;
  dateFormatted: string;
  oldNew: "Y" | "N";
  tenure: "F" | "L";
  tenureLabel: string;
  vsAsking: number | null;
  areaSlug: string;
}>;

export type SoldPriceDetail = Readonly<{
  address: string;
  postcode: string;
  propertyType: string;
  lastPrice: number;
  lastDate: string;
  growth: string;
  estimatedValue: string;
  coordinates: { lat: number; lng: number };
  history: Array<{ price: number; date: string; change: string | null }>;
  nearby: Array<{ address: string; price: string; date: string; slug: string }>;
  areaSlug: string;
  areaName: string;
  areaGrowth: string;
}>;

export type RegionalTrendData = Readonly<{
  region: string;
  slug: string;
  avgPrice: number;
  avgPriceFormatted: string;
  yoyChange: number;
  yoyChangeFormatted: string;
  transactionsLast12m: number;
  avgDaysToSell: number;
  askingVsSoldGap: number;
  askingVsSoldGapFormatted: string;
  avgYield: number | null;
  stockLevels: number;
}>;

export type NationalTrendData = Readonly<{
  avgPrice: number;
  avgPriceFormatted: string;
  yoyChange: number;
  yoyChangeFormatted: string;
  monthlyTransactions: number;
  avgDaysToSell: number;
  affordabilityRatio: number;
  ftbAvgPrice: number;
  ftbAvgDeposit: number;
  ftbAvgAge: number;
  activeListings: number;
  historicalPrices: Array<{ year: number; price: number }>;
  monthlyVolumes: Array<{ month: string; volume: number }>;
}>;

export type MarketTrendKPI = Readonly<{
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
}>;
```

- [ ] **Step 2: Verify the types compile**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && npx tsc --noEmit src/types/areas.ts 2>&1 | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/types/areas.ts
git commit -m "feat(areas): add comprehensive type definitions for section 6 pages"
```

---

### Task 2: Rich City Mock Data (12 cities)

**Files:**
- Create: `src/services/areas/mock-data/cities.ts`

- [ ] **Step 1: Create cities mock data**

This file must contain unique, realistic data for all 12 cities: London, Manchester, Birmingham, Bristol, Leeds, Edinburgh, Oxford, Cambridge, Liverpool, Glasgow, Nottingham, Sheffield.

Each city entry must have:
- City-specific boroughs (4–6 per city, real borough/area names)
- City-specific transport links (rail stations, airports, tram/metro where applicable)
- Realistic average prices based on 2025 market data
- Correct county, region, population
- Unique descriptions that reflect each city's property market character
- Correct coordinates

Key data points by city (approximate 2025 market values):
- London: avg £725k, 33 boroughs, Underground + Elizabeth Line + Overground
- Manchester: avg £285k, Metrolink tram, Manchester Piccadilly
- Birmingham: avg £250k, HS2, New Street station
- Bristol: avg £385k, Temple Meads, M4/M5
- Leeds: avg £250k, Leeds station, A1(M)
- Edinburgh: avg £340k, Waverley station, Edinburgh tram
- Oxford: avg £515k, Oxford station, Cowley Road
- Cambridge: avg £500k, Cambridge station, Guided Busway
- Liverpool: avg £200k, Lime Street, Merseyrail
- Glasgow: avg £190k, Glasgow Central, Glasgow Subway
- Nottingham: avg £220k, Nottingham station, NET tram
- Sheffield: avg £215k, Sheffield station, Supertram

The file should export:
```typescript
import type { CityData } from "@/types/areas";
export const CITIES: Record<string, CityData> = { ... };
export const CITY_SLUGS: string[] = Object.keys(CITIES);
```

- [ ] **Step 2: Verify file compiles**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && npx tsc --noEmit src/services/areas/mock-data/cities.ts 2>&1 | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/services/areas/mock-data/cities.ts
git commit -m "feat(areas): add rich mock data for 12 UK cities"
```

---

### Task 3: Rich Neighbourhood Mock Data (40+ neighbourhoods)

**Files:**
- Create: `src/services/areas/mock-data/neighbourhoods.ts`

- [ ] **Step 1: Create neighbourhoods mock data**

Each city needs 3–5 neighbourhoods with realistic data. Use real UK neighbourhood names with accurate characteristics. Every field in `NeighbourhoodData` must be populated.

Minimum neighbourhoods per city:
- London (6): Islington, Camden, Isleworth, Brixton, Greenwich, Hackney
- Manchester (4): Ancoats, Didsbury, Chorlton, Northern Quarter
- Birmingham (3): Edgbaston, Jewellery Quarter, Moseley
- Bristol (4): Clifton, Redland, Bedminster, Stokes Croft
- Leeds (4): Headingley, Roundhay, Chapel Allerton, Kirkstall
- Edinburgh (4): Leith, Stockbridge, Morningside, New Town
- Oxford (3): Jericho, Summertown, Cowley
- Cambridge (3): Newnham, Chesterton, Romsey
- Liverpool (3): Baltic Triangle, Aigburth, Woolton
- Glasgow (3): West End, Merchant City, Shawlands
- Nottingham (3): Hockley, West Bridgford, Beeston
- Sheffield (3): Kelham Island, Crookes, Ecclesall

Each neighbourhood must have:
- 3–4 schools with real names and realistic Ofsted ratings
- 3 local favourites (mix of parks, pubs, cafes, attractions)
- Unique description reflecting character
- Realistic demographics (varies by area type)
- Correct coordinates (approximate lat/lng)
- Property mix reflecting actual neighbourhood character
- Agent with believable name and quote

Export format:
```typescript
import type { NeighbourhoodData } from "@/types/areas";
export const NEIGHBOURHOODS: Record<string, NeighbourhoodData> = { ... };
// Key format: "city-slug/area-slug" e.g. "london/islington"
export function getNeighbourhood(citySlug: string, areaSlug: string): NeighbourhoodData | null;
export function getNeighbourhoodsForCity(citySlug: string): NeighbourhoodData[];
```

- [ ] **Step 2: Verify file compiles**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && npx tsc --noEmit src/services/areas/mock-data/neighbourhoods.ts 2>&1 | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/services/areas/mock-data/neighbourhoods.ts
git commit -m "feat(areas): add rich mock data for 40+ UK neighbourhoods"
```

---

### Task 4: Sold Prices Mock Data (200+ records)

**Files:**
- Create: `src/services/areas/mock-data/sold-prices.ts`

- [ ] **Step 1: Create sold prices mock data**

Generate 200+ realistic sold price records distributed across the 12 cities. Each record must follow the `SoldPriceRecord` type. Records should span the last 24 months with realistic price distributions per area.

Also include 5–8 `SoldPriceDetail` entries for individual property pages (one per city for the most common cities, with 3–5 historical transactions each going back to 1995+).

Export format:
```typescript
import type { SoldPriceRecord, SoldPriceDetail } from "@/types/areas";

export const SOLD_PRICES: Record<string, SoldPriceRecord[]> = { ... };
// Key: area slug e.g. "isleworth", "headingley", "clifton"

export const SOLD_PRICE_DETAILS: Record<string, SoldPriceDetail> = { ... };
// Key: property slug e.g. "14-south-street-isleworth-tw7-7bg"

export function getSoldPricesForArea(areaSlug: string): SoldPriceRecord[];
export function getSoldPriceDetail(slug: string): SoldPriceDetail | null;
export function getAreaSoldPriceSummary(areaSlug: string): {
  avgPrice: number;
  totalTransactions: number;
  yoyChange: number;
  avgVsAsking: number;
};
```

- [ ] **Step 2: Verify file compiles**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && npx tsc --noEmit src/services/areas/mock-data/sold-prices.ts 2>&1 | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/services/areas/mock-data/sold-prices.ts
git commit -m "feat(areas): add 200+ realistic sold price records for demo"
```

---

### Task 5: Market Trends Mock Data

**Files:**
- Create: `src/services/areas/mock-data/market-trends.ts`

- [ ] **Step 1: Create market trends mock data**

Include:
- All 12 UK regions (London, South East, South West, East of England, East Midlands, West Midlands, Yorkshire and the Humber, North West, North East, Wales, Scotland, Northern Ireland) with full `RegionalTrendData`
- National trend data (`NationalTrendData`) with:
  - Historical prices array: annual average from 1995 to 2026 (31 data points)
  - Monthly transaction volumes for last 24 months
  - FTB statistics
- Monthly KPIs for MoM and YoY comparison
- Hot/cold market lists
- Local authority yield rankings (10+ entries)
- Transaction volume time series (monthly, last 24 months, per region)

Export format:
```typescript
import type { RegionalTrendData, NationalTrendData, MarketTrendKPI } from "@/types/areas";

export const REGIONAL_TRENDS: RegionalTrendData[] = [...];
export const NATIONAL_TRENDS: NationalTrendData = { ... };
export const MARKET_KPIS: MarketTrendKPI[] = [...];
export const HOT_MARKETS: Array<{ city: string; change: string }> = [...];
export const COLD_MARKETS: Array<{ city: string; change: string }> = [...];
export const YIELD_RANKINGS: Array<{ rank: string; area: string; detail: string; yield: number }> = [...];
export function getRegionalTrend(regionSlug: string): RegionalTrendData | null;
```

- [ ] **Step 2: Verify file compiles**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && npx tsc --noEmit src/services/areas/mock-data/market-trends.ts 2>&1 | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/services/areas/mock-data/market-trends.ts
git commit -m "feat(areas): add market trends mock data with 12 regions + national"
```

---

## Wave 2: Service Layer

### Task 6: Area Data Service

**Files:**
- Create: `src/services/areas/area-data-service.ts`

- [ ] **Step 1: Create the area data service**

This service is the single entry point for all area page data. It tries Supabase first, falls back to mock data.

```typescript
// src/services/areas/area-data-service.ts

import type { CityData, NeighbourhoodData } from "@/types/areas";
import { CITIES, CITY_SLUGS } from "./mock-data/cities";
import { getNeighbourhood, getNeighbourhoodsForCity } from "./mock-data/neighbourhoods";

/**
 * Get city data by slug. Tries Supabase aggregation first,
 * falls back to mock data for demo purposes.
 */
export async function getCityData(citySlug: string): Promise<CityData | null> {
  const normalised = citySlug.toLowerCase();
  // TODO: When Supabase area tables are populated, query here first
  // const supabase = await createClient();
  // const { data } = await supabase.from("area_profiles").select("*").eq("slug", normalised).maybeSingle();
  // if (data) return transformCityRow(data);

  return CITIES[normalised] ?? null;
}

/**
 * Get neighbourhood data by city + area slug.
 */
export async function getNeighbourhoodData(
  citySlug: string,
  areaSlug: string,
): Promise<NeighbourhoodData | null> {
  // TODO: Supabase query first using key `${citySlug}/${areaSlug}`
  return getNeighbourhood(citySlug.toLowerCase(), areaSlug.toLowerCase());
}

/**
 * Get all neighbourhoods for a city (for borough grid).
 */
export async function getNeighbourhoodsForCityData(
  citySlug: string,
): Promise<NeighbourhoodData[]> {
  // TODO: Supabase query first
  return getNeighbourhoodsForCity(citySlug.toLowerCase());
}

/**
 * Get all available city slugs (for generateStaticParams).
 */
export function getAllCitySlugs(): string[] {
  return CITY_SLUGS;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && npx tsc --noEmit src/services/areas/area-data-service.ts 2>&1 | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/services/areas/area-data-service.ts
git commit -m "feat(areas): add area data service with Supabase-ready fallback"
```

---

### Task 7: Sold Prices Service

**Files:**
- Create: `src/services/areas/sold-prices-service.ts`

- [ ] **Step 1: Create the sold prices service**

Wraps the existing `land-registry` service and `price_paid_data` table. Falls back to mock data.

```typescript
// src/services/areas/sold-prices-service.ts

import type { SoldPriceRecord, SoldPriceDetail } from "@/types/areas";
import {
  getSoldPricesForArea,
  getSoldPriceDetail as getMockDetail,
  getAreaSoldPriceSummary,
} from "./mock-data/sold-prices";

/**
 * Get sold price records for an area.
 * Tries Supabase price_paid_data first, falls back to mock.
 */
export async function getAreaSoldPrices(
  areaSlug: string,
  options?: { limit?: number; offset?: number; propertyType?: string; sortBy?: string },
): Promise<{ records: SoldPriceRecord[]; total: number }> {
  const normalised = areaSlug.toLowerCase();
  // TODO: Query price_paid_data table:
  // const supabase = await createClient();
  // let query = supabase.from("price_paid_data")
  //   .select("*", { count: "exact" })
  //   .ilike("town", normalised)
  //   .order("date_of_transfer", { ascending: false });
  // if (options?.propertyType) query = query.eq("property_type", options.propertyType);
  // if (options?.limit) query = query.limit(options.limit);
  // if (options?.offset) query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1);

  const records = getSoldPricesForArea(normalised);
  return { records, total: records.length };
}

/**
 * Get individual property sold price detail.
 */
export async function getPropertySoldPrice(
  slug: string,
): Promise<SoldPriceDetail | null> {
  const normalised = slug.toLowerCase();
  // TODO: Query by slug from price_paid_data + history
  return getMockDetail(normalised);
}

/**
 * Get summary statistics for an area's sold prices.
 */
export async function getSoldPriceStats(areaSlug: string) {
  const normalised = areaSlug.toLowerCase();
  // TODO: Supabase aggregate query
  return getAreaSoldPriceSummary(normalised);
}

// NOTE: When switching from mock to live data, replace the TODO queries above
// with calls to the existing land-registry service functions:
//   import { getPricePaidData, getAreaPriceTrend, getPricePaidSummary } from "@/services/land-registry/land-registry";
// These already query the price_paid_data table with outward-code matching.
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && npx tsc --noEmit src/services/areas/sold-prices-service.ts 2>&1 | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/services/areas/sold-prices-service.ts
git commit -m "feat(areas): add sold prices service with mock fallback"
```

---

### Task 8: Market Trends Service

**Files:**
- Create: `src/services/areas/market-trends-service.ts`

- [ ] **Step 1: Create the market trends service**

```typescript
// src/services/areas/market-trends-service.ts

import type { RegionalTrendData, NationalTrendData, MarketTrendKPI } from "@/types/areas";
import {
  REGIONAL_TRENDS,
  NATIONAL_TRENDS,
  MARKET_KPIS,
  HOT_MARKETS,
  COLD_MARKETS,
  YIELD_RANKINGS,
  getRegionalTrend,
} from "./mock-data/market-trends";

export async function getRegionalTrends(): Promise<RegionalTrendData[]> {
  // TODO: Supabase query against market_trends table
  return REGIONAL_TRENDS;
}

export async function getNationalTrends(): Promise<NationalTrendData> {
  // TODO: Supabase aggregate
  return NATIONAL_TRENDS;
}

export async function getMarketKPIs(): Promise<MarketTrendKPI[]> {
  return MARKET_KPIS;
}

export async function getRegionalTrendBySlug(slug: string): Promise<RegionalTrendData | null> {
  return getRegionalTrend(slug);
}

export { HOT_MARKETS, COLD_MARKETS, YIELD_RANKINGS };
```

- [ ] **Step 2: Verify it compiles**

- [ ] **Step 3: Commit**

```bash
git add src/services/areas/market-trends-service.ts
git commit -m "feat(areas): add market trends service"
```

---

## Wave 3: SEO Infrastructure

### Task 9: JSON-LD Structured Data Generators

**Files:**
- Create: `src/lib/seo/area-jsonld.ts`

- [ ] **Step 1: Create JSON-LD generator functions**

```typescript
// src/lib/seo/area-jsonld.ts

import type { CityData, NeighbourhoodData } from "@/types/areas";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

// NOTE: Do NOT create a breadcrumb generator here.
// Use the existing `buildBreadcrumbJsonLd` from `@/lib/seo/breadcrumb-jsonld`
// which accepts { name: string; path: string }[] — already used across the codebase.

/**
 * Place schema for city pages.
 */
export function cityPlaceJsonLd(city: CityData) {
  return {
    "@context": "https://schema.org",
    "@type": "City",
    name: city.name,
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: city.county,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: city.coordinates.lat,
      longitude: city.coordinates.lng,
    },
    url: `${BASE_URL}/areas/${city.slug}`,
    description: city.description,
  };
}

/**
 * Place schema for neighbourhood pages.
 */
export function neighbourhoodPlaceJsonLd(n: NeighbourhoodData) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: n.name,
    containedInPlace: {
      "@type": "City",
      name: n.cityName,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: n.coordinates.lat,
      longitude: n.coordinates.lng,
    },
    url: `${BASE_URL}/areas/${n.citySlug}/${n.slug}`,
    description: n.description,
  };
}

/**
 * Dataset schema for sold prices pages.
 */
export function soldPricesDatasetJsonLd(
  areaName: string,
  areaSlug: string,
  recordCount: number,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Property Sold Prices in ${areaName}`,
    description: `Historical property transaction data for ${areaName}, sourced from HM Land Registry Price Paid Data.`,
    url: `${BASE_URL}/sold-prices/${areaSlug}`,
    creator: {
      "@type": "Organization",
      name: "HM Land Registry",
      url: "https://www.gov.uk/government/organisations/land-registry",
    },
    license: "https://use-land-property-data.service.gov.uk/datasets/ppd/licence",
    temporalCoverage: "1995/..",
    distribution: {
      "@type": "DataDownload",
      contentUrl: `${BASE_URL}/sold-prices/${areaSlug}`,
      encodingFormat: "text/html",
    },
    variableMeasured: [
      { "@type": "PropertyValue", name: "Transaction Count", value: recordCount },
    ],
  };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && npx tsc --noEmit src/lib/seo/area-jsonld.ts 2>&1 | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/lib/seo/area-jsonld.ts
git commit -m "feat(seo): add JSON-LD generators for area, sold prices, breadcrumb schemas"
```

---

### Task 10: Shared UI Components

**Files:**
- Create: `src/components/areas/AreaSearchCTA.tsx`
- Create: `src/components/areas/DataAttribution.tsx`
- Create: `src/components/areas/SoldPriceRow.tsx`
- Create: `src/components/areas/InternalLinkCard.tsx`

- [ ] **Step 1: Create AreaSearchCTA component**

Server Component. Renders "Browse properties for sale in [Area]" and "To rent in [Area]" CTAs.

```typescript
// src/components/areas/AreaSearchCTA.tsx

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type AreaSearchCTAProps = Readonly<{
  areaName: string;
  citySlug: string;
  areaSlug?: string;
  variant?: "inline" | "hero";
}>;

export function AreaSearchCTA({ areaName, citySlug, areaSlug, variant = "inline" }: AreaSearchCTAProps) {
  const searchBase = areaSlug
    ? `/search?city=${citySlug}&area=${areaSlug}`
    : `/search?city=${citySlug}`;

  if (variant === "hero") {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`${searchBase}&type=buy`}
          className="bg-primary text-white rounded-xl px-6 py-3 font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          Properties for sale in {areaName} <ArrowRight className="size-4" />
        </Link>
        <Link
          href={`${searchBase}&type=rent`}
          className="border-2 border-primary text-primary rounded-xl px-6 py-3 font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          To rent in {areaName} <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-neutral-700 font-medium">
        Ready to find your next home in <strong>{areaName}</strong>?
      </p>
      <div className="flex gap-3">
        <Link
          href={`${searchBase}&type=buy`}
          className="bg-primary text-white rounded-lg px-5 py-2.5 font-bold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          For sale <ArrowRight className="size-3.5" />
        </Link>
        <Link
          href={`${searchBase}&type=rent`}
          className="border border-primary/20 text-primary rounded-lg px-5 py-2.5 font-bold text-sm hover:bg-primary/5 transition-colors"
        >
          To rent
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create DataAttribution component**

```typescript
// src/components/areas/DataAttribution.tsx

type DataAttributionProps = Readonly<{
  source: string;
  lastUpdated?: string;
  methodology?: string;
  className?: string;
}>;

export function DataAttribution({ source, lastUpdated, methodology, className = "" }: DataAttributionProps) {
  return (
    <p className={`text-[11px] text-neutral-400 italic ${className}`}>
      Source: {source}
      {lastUpdated && <> &middot; Last updated: {lastUpdated}</>}
      {methodology && <> &middot; {methodology}</>}
    </p>
  );
}
```

- [ ] **Step 3: Create SoldPriceRow component**

```typescript
// src/components/areas/SoldPriceRow.tsx

import Link from "next/link";
import type { SoldPriceRecord } from "@/types/areas";

type SoldPriceRowProps = Readonly<{ record: SoldPriceRecord }>;

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  D: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
  S: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400" },
  T: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
  F: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400" },
  O: { bg: "bg-neutral-50 dark:bg-neutral-900/20", text: "text-neutral-600 dark:text-neutral-400" },
};

export function SoldPriceRow({ record }: SoldPriceRowProps) {
  const styles = TYPE_STYLES[record.propertyType] ?? TYPE_STYLES.O;

  return (
    <tr className="transition-colors even:bg-neutral-50 hover:bg-neutral-100 dark:even:bg-neutral-800/20 dark:hover:bg-neutral-800/30">
      <td className="px-6 py-4">
        <Link
          href={`/sold-prices/${record.areaSlug}/${record.slug}`}
          className="hover:text-primary transition-colors"
        >
          <div className="font-medium">{record.address}</div>
          <div className="text-xs uppercase text-neutral-400">{record.postcode}</div>
        </Link>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${styles.bg} ${styles.text}`}>
            {record.propertyTypeLabel}
          </span>
          <span className="text-neutral-500">{record.beds} Bed</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right text-neutral-500">{record.dateFormatted}</td>
      <td className="px-6 py-4 text-right font-bold">{record.priceFormatted}</td>
      <td className="px-6 py-4 text-right">
        {record.vsAsking !== null ? (
          <span className={`font-medium ${record.vsAsking > 0 ? "text-green-600" : record.vsAsking < 0 ? "text-red-500" : "text-neutral-400"}`}>
            {record.vsAsking > 0 ? "+" : ""}{record.vsAsking}%
          </span>
        ) : (
          <span className="text-neutral-300">—</span>
        )}
      </td>
    </tr>
  );
}
```

- [ ] **Step 4: Create InternalLinkCard component**

```typescript
// src/components/areas/InternalLinkCard.tsx

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type InternalLinkCardProps = Readonly<{
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
}>;

export function InternalLinkCard({ title, description, href, icon }: InternalLinkCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 bg-white border border-primary/10 rounded-xl p-4 hover:shadow-md hover:border-primary/20 transition-all"
    >
      {icon && <div className="flex-shrink-0 text-primary">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-neutral-900 text-sm group-hover:text-primary transition-colors">{title}</p>
        <p className="text-xs text-neutral-500 truncate">{description}</p>
      </div>
      <ArrowRight className="size-4 text-neutral-300 group-hover:text-primary transition-colors flex-shrink-0" />
    </Link>
  );
}
```

- [ ] **Step 5: Verify all components compile**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -20`

- [ ] **Step 6: Commit**

```bash
git add src/components/areas/
git commit -m "feat(areas): add shared AreaSearchCTA, DataAttribution, SoldPriceRow, InternalLinkCard components"
```

---

## Wave 4: Page Rewrites (Fix BUG-5, BUG-6, BUG-8, BUG-11)

### Task 11: Rewrite City Area Guide Page (6.1)

**Files:**
- Modify: `src/app/(main)/areas/[city]/page.tsx`

- [ ] **Step 1: Rewrite the city page**

Key changes:
1. Replace `CITY_DATA` constant with `getCityData()` service call
2. Replace `BOROUGHS` constant with `getNeighbourhoodsForCityData()` — shows city-specific neighbourhoods
3. Replace London-specific transport data with city-specific transport links
4. Add JSON-LD (`cityPlaceJsonLd` + `buildBreadcrumbJsonLd` (from `@/lib/seo/breadcrumb-jsonld`)) via `<script type="application/ld+json">`
5. Improve `generateMetadata` with:
   - Better title: `"${cityName} Property Guide — House Prices, Schools & Area Info | Britestate"`
   - Unique description with city-specific stats
   - `openGraph: { title, description, type: "website" }`
   - Canonical already present (keep)
6. Replace hardcoded property listings section with `AreaSearchCTA` component (hero variant)
7. Add `DataAttribution` under stats cards
8. Add internal links section at bottom: link to `/sold-prices/${city}`, `/market-trends`, `/areas/${city}/stats`
9. Update `generateStaticParams` to include all 12 cities from `getAllCitySlugs()`
10. Handle unknown city slug: call `notFound()` if `getCityData()` returns null
11. Add case normalisation: in the page component, if `city` !== `city.toLowerCase()`, call `redirect(`/areas/${city.toLowerCase()}`)` from `next/navigation`. This handles `/areas/Leeds` → `/areas/leeds` at the page level. (Alternatively, this could be added to `src/middleware.ts` — but page-level redirect is simpler and sufficient for static params.)

Structure after rewrite:
```
Hero (city-specific image placeholder + description + search bar)
├── Stats Bar (3 cards from service data + DataAttribution)
├── AreaSearchCTA (hero variant — "For sale" + "To rent")
├── 5-Year Price Trend (existing chart, same)
├── Popular Areas (city-specific neighbourhoods from service)
├── Transport & Connectivity (city-specific transport links)
├── Local Services (same icons, fine as generic)
├── Related Pages (InternalLinkCard × 3: sold prices, stats, market trends)
└── Newsletter CTA (same)
+ JSON-LD script tag in <head> section
```

- [ ] **Step 2: Build and verify**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -30`

Verify:
- `/areas/leeds` shows Leeds-specific boroughs and transport (not London)
- `/areas/bristol` shows Bristol-specific data
- Unknown city (e.g., `/areas/fakecity`) returns 404

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/areas/[city]/page.tsx
git commit -m "fix(areas): wire city page to service layer — city-specific data, JSON-LD, SEO metadata"
```

---

### Task 12: Rewrite Neighbourhood Area Guide Page (6.2/6.3)

**Files:**
- Modify: `src/app/(main)/areas/[city]/[area]/page.tsx`

- [ ] **Step 1: Rewrite the neighbourhood page**

Key changes:
1. Replace all `MOCK_*` constants with `getNeighbourhoodData()` service call
2. Add `notFound()` for unknown area slugs
3. Update `generateMetadata` with area-specific title/description/OG tags
4. Add JSON-LD (`neighbourhoodPlaceJsonLd` + `buildBreadcrumbJsonLd` (from `@/lib/seo/breadcrumb-jsonld`))
5. Fix breadcrumb to use dynamic city/area names (already partially correct)
6. Add `AreaSearchCTA` to Overview tab (above newsletter CTA)
7. Add `DataAttribution` under market data sections
8. Add internal links section: link to `/sold-prices/${area}`, `/areas/${city}`, `/areas/${city}/stats`
9. Remove duplicated schools table (present in both Market Data and Schools tabs) — keep only in Schools tab, replace in Market Data tab with a "View schools" link
10. Make property listings link to actual property pages (or remove mock listings and replace with `AreaSearchCTA`)
13. Add `generateStaticParams` that returns all neighbourhood slugs from mock data for pre-rendering:
    ```typescript
    export async function generateStaticParams() {
      const { getAllCitySlugs } = await import("@/services/areas/area-data-service");
      const { getNeighbourhoodsForCity } = await import("@/services/areas/mock-data/neighbourhoods");
      const params: Array<{ city: string; area: string }> = [];
      for (const city of getAllCitySlugs()) {
        for (const n of getNeighbourhoodsForCity(city)) {
          params.push({ city, area: n.slug });
        }
      }
      return params;
    }
    ```
11. Use neighbourhood-specific coordinates for MapEmbedClient
12. Use neighbourhood-specific demographics, schools, local favourites, transport links, property mix, broadband, crime data

- [ ] **Step 2: Build and verify**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -30`

Verify:
- `/areas/leeds/headingley` shows Headingley-specific data (not Isleworth)
- `/areas/bristol/clifton` shows Clifton-specific data
- Unknown area returns 404

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/areas/[city]/[area]/page.tsx
git commit -m "fix(areas): wire neighbourhood page to service layer — per-area data, JSON-LD, dedup schools"
```

---

### Task 13: Rewrite Sold Prices Area Page (6.5)

**Files:**
- Modify: `src/app/(main)/sold-prices/[area]/page.tsx`

- [ ] **Step 1: Rewrite the sold prices area page**

Key changes:
1. Replace `MOCK_SALES` and `QUARTERLY_TRENDS` with `getAreaSoldPrices()` and `getSoldPriceStats()` service calls
2. Fix hardcoded breadcrumb: change `href="/sold-prices/isleworth"` to `href="/sold-prices"`
3. Replace plain `<tr>` rows with `SoldPriceRow` component (clickable, links to individual property page)
4. Add `canonical` to `generateMetadata` (currently missing)
5. Add `openGraph` tags
6. Add JSON-LD (`soldPricesDatasetJsonLd` + `buildBreadcrumbJsonLd` (from `@/lib/seo/breadcrumb-jsonld`))
7. Add `DataAttribution` component below stats: "Source: HM Land Registry Price Paid Data | Last updated: March 2026 | Transactions registered in the last 2–3 months may not yet appear."
8. Add `AreaSearchCTA` below the table: "Browse active listings in [Area]"
9. Add internal link to area guide: `InternalLinkCard` linking to `/areas/[city]/[area]`
10. Wire the map panel to use `MapEmbedClient` instead of placeholder
11. Handle unknown area: show "No sold price data available" with nearby area suggestions, not a broken page

- [ ] **Step 2: Build and verify**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -30`

Verify:
- Breadcrumb "Sold Prices" links to `/sold-prices` (not `/sold-prices/isleworth`)
- Table rows are clickable links

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/sold-prices/[area]/page.tsx
git commit -m "fix(sold-prices): wire to service, fix breadcrumb, clickable rows, JSON-LD, data attribution"
```

---

### Task 14: Rewrite Sold Prices Individual Property Page (6.6)

**Files:**
- Modify: `src/app/(main)/sold-prices/[area]/[slug]/page.tsx`

- [ ] **Step 1: Update the individual property page**

Key changes:
1. Replace `MOCK_PROPERTIES` with `getPropertySoldPrice()` service call
2. Add disclaimer on estimated value: "This is an automated estimate based on historical transactions and market trends. It is not a formal valuation. For a professional valuation, contact a RICS-qualified surveyor."
3. Add `DataAttribution` component: "Source: HM Land Registry Price Paid Data | Open Government Licence v3.0"
4. Make nearby sold prices table rows link to their own `/sold-prices/[area]/[slug]` pages
5. Add `AreaSearchCTA` above the "Thinking of selling?" sidebar
6. Update breadcrumb JSON-LD
7. Add `openGraph` tags with property-specific title

- [ ] **Step 2: Build and verify**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -30`

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/sold-prices/[area]/[slug]/page.tsx
git commit -m "fix(sold-prices): wire individual property to service, add valuation disclaimer, data attribution"
```

---

### Task 15: Rewrite Market Trends Page (6.7)

**Files:**
- Modify: `src/app/(main)/market-trends/page.tsx`

- [ ] **Step 1: Update the market trends page**

Key changes:
1. Replace all hardcoded data arrays with service calls: `getRegionalTrends()`, `getMarketKPIs()`
2. Add `DataAttribution` under the KPI cards: "Source: HM Land Registry UK House Price Index, ONS | Median prices used for all averages | Last updated: March 2026"
3. Add link to national view: tab or prominent link to `/market-trends/national`
4. Add internal links: each region row links to area guides for major cities in that region
5. Add `openGraph` tags
6. Add `buildBreadcrumbJsonLd` (from `@/lib/seo/breadcrumb-jsonld`)

- [ ] **Step 2: Build and verify**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -30`

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/market-trends/page.tsx
git commit -m "fix(market-trends): wire to service layer, add data attribution, link to national view"
```

---

## Wave 5: Missing Pages (6.4 + 6.8)

### Task 16: Build Area Stats Dashboard (6.4)

**Files:**
- Create: `src/app/(main)/areas/[city]/stats/page.tsx`

- [ ] **Step 1: Create the stats dashboard page**

Route: `/areas/[city]/stats`

This is a data-dense page focused entirely on structured statistics. No narrative content — just numbers, charts, and tables.

Sections:
1. **Header**: breadcrumb + city name + "Property Statistics" + DataAttribution
2. **KPI row** (6 cards): Avg Asking Price, Avg Sold Price (median), YoY Change, Transactions (12m), Avg Days to Sell, Affordability Ratio
3. **Price by property type**: 4-column card grid (Detached, Semi, Terraced, Flat) with avg price per type
4. **Price by bedroom count**: bar chart (1-bed through 5-bed+)
5. **Price trend chart**: reuse `AreaPriceTrendClient` with city data
6. **Sales volume chart**: monthly transactions last 24 months (bar chart)
7. **Stock levels**: current listings for sale vs to rent, compared to 3-month and 12-month averages
8. **Comparison CTA**: "Compare [City] with another area" — links to a comparison mode (placeholder for now)
9. **Internal links**: link to area guide, sold prices, market trends

Metadata:
- Title: `"${cityName} House Prices & Statistics | Property Market Data | Britestate"`
- Description: `"Average house prices in ${cityName}: ${avgPrice}. View property market statistics, price trends, and transaction volumes. Data from HM Land Registry."`
- JSON-LD: `Dataset` schema
- Breadcrumb: Home > Areas > [City] > Statistics

`generateStaticParams` should return all 12 city slugs.

- [ ] **Step 2: Build and verify**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -30`

Verify: `/areas/leeds/stats` renders with Leeds-specific data.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/areas/[city]/stats/
git commit -m "feat(areas): build area stats dashboard (6.4) — price breakdowns, trends, stock levels"
```

---

### Task 17: Build National Market Trends Page (6.8)

**Files:**
- Create: `src/app/(main)/market-trends/national/page.tsx`

- [ ] **Step 1: Create the national market trends page**

Route: `/market-trends/national`

Sections:
1. **Header**: breadcrumb + "UK National Property Market" + DataAttribution
2. **National KPI row** (6 cards): UK Avg Price, YoY Change, Monthly Transactions, Avg Days to Sell, Affordability Ratio (price-to-earnings), Active Listings Nationally
3. **First-Time Buyer stats**: Avg FTB Price, Avg Deposit, Avg FTB Age (3-card row)
4. **Historical price chart**: Line chart from 1995 to 2026 with annotated events:
   - 2008: Financial crisis
   - 2013: Help to Buy launched
   - 2020: COVID stamp duty holiday
   - 2022: Mini-budget market freeze
   - 2023: Interest rate peak
   This should be a client component using Recharts with custom annotations.
5. **Monthly transaction volume chart**: Area chart, last 24 months
6. **Regional comparison table**: all 12 regions with avg price, YoY change, transactions, days to sell — sortable columns. Each region links to `/market-trends` (regional view).
7. **Supply/demand indicators**: Current listings nationally vs 12-month average (with % change)
8. **Data sources section**: Explicit attribution to Halifax HPI, Nationwide HPI, HMRC transaction data, Land Registry UK HPI with update cadence per source
9. **Internal links**: link to regional view (`/market-trends`), area guides hub (`/areas`)

Metadata:
- Title: `"UK House Prices & National Market Trends 2026 | Britestate"`
- Description: `"UK average house price: £298,000 (March 2026). National property market trends, transaction volumes, affordability data, and regional comparisons. Source: Land Registry, ONS."`
- JSON-LD: `Dataset` schema
- Breadcrumb: Home > Market Trends > National

- [ ] **Step 2: Create the historical price chart client component**

Create: `src/components/charts/HistoricalPriceChart.tsx` — a client component using Recharts `AreaChart` with:
- X-axis: years (1995–2026)
- Y-axis: average price
- Annotated reference lines for key events
- Responsive container

And its client wrapper: `src/components/charts/HistoricalPriceChartClient.tsx` with dynamic import.

- [ ] **Step 3: Build and verify**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -30`

Verify: `/market-trends/national` renders with all sections.

- [ ] **Step 4: Commit**

```bash
git add src/app/(main)/market-trends/national/ src/components/charts/HistoricalPriceChart.tsx src/components/charts/HistoricalPriceChartClient.tsx
git commit -m "feat(market-trends): build national market trends page (6.8) with historical chart"
```

---

## Wave 6: Sitemap + Final SEO

### Task 18: Update Sitemap

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Add all Section 6 pages to sitemap**

Add to the sitemap function:
1. All city area guide pages: `/areas/london`, `/areas/manchester`, etc.
2. All neighbourhood pages: `/areas/london/islington`, `/areas/leeds/headingley`, etc.
3. All city stats pages: `/areas/london/stats`, etc.
4. All sold-prices area pages: `/sold-prices/isleworth`, `/sold-prices/headingley`, etc.
5. Individual sold-price property pages from mock data slugs
6. National market trends: `/market-trends/national`

Import city slugs from `getAllCitySlugs()` and neighbourhood data from the mock-data module.

```typescript
// Add after existing marketplacePages:

/* --- Area guide pages --- */
const { getAllCitySlugs } = await import("@/services/areas/area-data-service");
const { getNeighbourhoodsForCity } = await import("@/services/areas/mock-data/neighbourhoods");

const citySlugs = getAllCitySlugs();
const areaGuidePages: MetadataRoute.Sitemap = [];

for (const city of citySlugs) {
  // City page
  areaGuidePages.push({
    url: `${BASE_URL}/areas/${city}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  });
  // Stats page
  areaGuidePages.push({
    url: `${BASE_URL}/areas/${city}/stats`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  });
  // Neighbourhood pages
  const neighbourhoods = getNeighbourhoodsForCity(city);
  for (const n of neighbourhoods) {
    areaGuidePages.push({
      url: `${BASE_URL}/areas/${city}/${n.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
}

// National market trends
areaGuidePages.push({
  url: `${BASE_URL}/market-trends/national`,
  lastModified: now,
  changeFrequency: "weekly",
  priority: 0.7,
});
```

Include `areaGuidePages` in the return array.

- [ ] **Step 2: Build and verify**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): add all section 6 pages to dynamic sitemap"
```

---

### Task 19: Areas Hub Page Updates

**Files:**
- Modify: `src/app/(main)/areas/page.tsx`

- [ ] **Step 1: Update the areas hub**

Key changes:
1. Wire market overview banner stats to use data from `market-trends-service` instead of hardcoded values
2. Add link to "View Market Trends" pointing to `/market-trends`
3. Add link to "Sold Prices" in the navigation

- [ ] **Step 2: Build and verify**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/areas/page.tsx
git commit -m "fix(areas): wire hub page stats to service, add market-trends and sold-prices links"
```

---

### Task 20: Sold Prices Hub Page Updates

**Files:**
- Modify: `src/app/(main)/sold-prices/page.tsx`

- [ ] **Step 1: Update the sold prices hub**

Make the popular areas grid data-driven from the mock data. Each area card should show the actual average sold price and transaction count from the mock data, and link correctly to `/sold-prices/[area-slug]`.

- [ ] **Step 2: Build and verify**

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/sold-prices/page.tsx
git commit -m "fix(sold-prices): wire hub to mock data for realistic area stats"
```

---

## Wave 7: Final Build Verification

### Task 21: Full Build + Lint Verification

- [ ] **Step 1: Run full build**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -40`

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run lint**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm lint 2>&1 | tail -20`

Expected: No lint errors.

- [ ] **Step 3: Verify key routes render**

Manually verify these routes render correctly (check build output for static generation):
- `/areas` — hub page
- `/areas/leeds` — Leeds-specific boroughs/transport
- `/areas/leeds/headingley` — Headingley-specific data
- `/areas/london/stats` — London stats dashboard
- `/sold-prices/isleworth` — Isleworth sold prices with clickable rows
- `/sold-prices/isleworth/14-south-street-isleworth-tw7-7bg` — Individual property
- `/market-trends` — Regional trends
- `/market-trends/national` — National trends

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore(areas): final build verification — section 6 ship-ready"
```

---

## Implementation Notes

### Mock Data Strategy
All mock data is in `src/services/areas/mock-data/`. Each service function has a `// TODO:` comment showing the exact Supabase query that will replace the mock. When Supabase tables are populated with real data, the transition is a one-line change per function: uncomment the query, remove the fallback.

### What's NOT in this plan (intentional deferral)
- **Interactive filters/sort on sold prices table** (BUG-15): Buttons exist but are non-functional. Making them work requires client-side state management with URL query params. Defer to a follow-up task.
- **Regional selector pills on market trends** (BUG-16): Making them interactive requires client-side filtering. Defer.
- **Rental yield data per region** (BUG-18): Market trends page shows yield only in sidebar. Full rental data per region requires additional data source (Rightmove/Zoopla rental index or ONS). Defer.
- **New build filter on sold prices** (BUG-21): Requires adding `old_new` filter UI to the sold prices page. The data field exists in `SoldPriceRecord.oldNew` but the filter UI is deferred with BUG-15.
- **Regional comparison tool** (BUG-23): "Compare two regions" feature requires client-side multi-select state. Defer.
- **Price per sq ft** (BUG-24): Requires EPC floor area data integration (separate API: EPC Register). Defer.
- **Tab overflow on mobile** (BUG-25): 5 tabs at 390px need horizontal scroll container. Quick CSS fix but deferred to QA polish pass.
- **Mobile table layout** (BUG-26): Sold prices table uses `overflow-x-auto` which works but is not ideal. Stacked card layout for mobile deferred to design pass.
- **Placeholder images** (BUG-27): All image slots remain as styled grey placeholders. Defer to design asset pipeline.
- **Sold prices map placeholder** (BUG-29): Map panel on sold prices area page says "coming soon". Requires plotting sold price markers on MapLibre. Defer to map feature pass.
- **URL state for filters** (BUG-31): Filter/sort selections should persist in URL query params. Deferred with BUG-15.
- **Postcode-based sold prices routing** (`/sold-prices/LS6`): Requires postcode→area mapping table. Defer.
- **Welsh language URLs**: Requires i18n routing. Defer.
- **Performance optimisation** (2G testing, CLS, LCP): Defer to QA pass after ship.
- **Export PDF / CSV functionality**: Requires server-side document generation. Defer.

### Existing market trends region change
The existing market trends page uses 11 regions (combining "East Midlands" + "West Midlands" as "Midlands" and "East of England" as "East"). This plan's mock data uses the correct ONS 12-region breakdown. Task 15 will update the page to use 12 regions. This is a **breaking change** to the visible region list — the implementer should update both the data arrays AND the regional selector pills.

### BUGs Addressed by This Plan
| Bug | Fix | Task |
|-----|-----|------|
| BUG-1 (all mock data) | Service layer with rich per-area mock data | Tasks 2–8 |
| BUG-2 (no valuation disclaimer) | Add RICS disclaimer text | Task 14 |
| BUG-3 (false data source claim) | DataAttribution component on all pages | Tasks 10, 13, 15 |
| BUG-4 (no JSON-LD) | JSON-LD generators + script tags | Tasks 9, 11–17 |
| BUG-5 (same data all areas) | Service call per URL param | Tasks 11, 12 |
| BUG-6 (London data on all cities) | City-specific service data | Task 11 |
| BUG-7 (sitemap missing pages) | Dynamic sitemap generation | Task 18 |
| BUG-8 (case sensitivity) | notFound() for unknown slugs | Tasks 11, 12 |
| BUG-9 (no canonical on sold prices) | Add canonical in generateMetadata | Task 13 |
| BUG-10 (no og:image) | Add openGraph to all generateMetadata | Tasks 11–17 |
| BUG-11 (missing cities in staticParams) | Use getAllCitySlugs() | Task 11 |
| BUG-12 (no CTA on sold prices) | AreaSearchCTA component | Task 13 |
| BUG-13 (no rental CTA) | AreaSearchCTA with both sale + rent | Tasks 10, 11, 12 |
| BUG-14 (non-clickable rows) | SoldPriceRow component | Tasks 10, 13 |
| BUG-17 (no neighbourhood search CTA) | AreaSearchCTA on area page | Task 12 |
| BUG-19 (no "last updated") | DataAttribution on all pages | Tasks 10–17 |
| BUG-20 (no latency disclaimer) | DataAttribution with latency text | Task 13 |
| BUG-22 (no methodology) | DataAttribution with "Median prices" | Task 15 |
| BUG-28 (hardcoded breadcrumb) | Dynamic breadcrumb links | Task 13 |
| BUG-30 (duplicate schools table) | Remove from Market Data tab | Task 12 |
| 6.4 missing | Built as stats dashboard | Task 16 |
| 6.8 missing | Built as national trends | Task 17 |
