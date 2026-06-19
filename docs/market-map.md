# Market Price Map — Methodology, Data & API Reference

## Table of Contents

1. [Overview](#overview)
2. [Data Sources & Licence](#data-sources--licence)
3. [Metric — Median Sold Price](#metric--median-sold-price)
4. [Why This Is Not a £/m² Map](#why-this-is-not-a-m-map)
5. [Multi-Scale Geography Layers](#multi-scale-geography-layers)
6. [Colour Methodology](#colour-methodology)
7. [National vs Local Colour Scale](#national-vs-local-colour-scale)
8. [Street / Micro-Area Layer](#street--micro-area-layer)
9. [Confidence Rules](#confidence-rules)
10. [How to Populate the Data](#how-to-populate-the-data)
11. [API Reference](#api-reference)
12. [Architecture Map](#architecture-map)

---

## Overview

The property price map is a multi-scale choropleth visualisation of median registered sold prices across England and Wales. It draws on HM Land Registry Price Paid Data (PPD) joined to ONS geography boundaries, and renders at four resolution levels that swap automatically as the user zooms. (A fifth `street` / H3 micro-area level was specced but never populated — it is intentionally not served; see [Street / Micro-Area Layer](#street--micro-area-layer).)

The page is a 50/50 split on desktop: the map fills the left half, and a scrollable panel on the right holds the search bar (sticky), filters, and either the selected area's price detail or the ranked "areas in view" list. Area names and search results are shown in plain English — never raw ONS codes (`E02000244`) or jargon (`MSOA`, `local authority`) — via the humanizer in `src/lib/market-map/labels.ts`.

---

## Data Sources & Licence

| Dataset | Source | Licence |
|---------|--------|---------|
| **Price Paid Data (PPD)** | HM Land Registry | [OGL v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) |
| **ONS Postcode Directory (ONSPD)** | Office for National Statistics | [OGL v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) |
| **ONS Open Geography Boundaries** | ONS Open Geography Portal | [OGL v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) |

OGL licence notice: Contains public sector information licensed under the Open Government Licence v3.0.

### Internal tables

| Table | Content |
|-------|---------|
| `ppd_transactions` | Price Paid Data rows (price, date, postcode, property type) |
| `postcode_geography` | ONSPD lookup — postcode → LAD / MSOA / LSOA / H3 cell |
| `geography_boundaries` | ONS boundary polygons (GeoJSON) for LAD, postcode district, MSOA, LSOA |
| `market_map_aggregate` | Pre-aggregated summary view (median, p10/p90, count per area per window) |
| `postcode_district_hulls` | Derived convex-hull polygons for postcode districts |
| `postcode_sector_hulls` | Derived convex-hull polygons for postcode sectors |

---

## Metric — Median Sold Price

The sole metric shown on the map is the **median sold price** — the middle value (50th percentile) of all registered Land Registry transactions in a given area over the selected date window.

Computed in Postgres as:

```sql
percentile_cont(0.5) WITHIN GROUP (ORDER BY price_pence)
```

The result is stored in pence; the service layer divides by 100 and rounds to integer pounds before returning it to the client.

### What "sold price" means

- Registered at HM Land Registry at the time of completion.
- Includes freehold and leasehold residential sales.
- Excludes commercial transactions, right-to-buy, and some new-build developers' bulk transfers where prices may be anomalous.

---

## Why This Is Not a £/m² Map

**This map does NOT show price per square metre (£/m²).**

The mandatory disclaimer shown on every map screen reads verbatim:

> Based on registered sold-price transactions. This is not a £/m² estimate because floor-area data is not currently available.

Floor-area (square meterage) information is not included in HM Land Registry Price Paid Data. Without a reliable matched floor-area figure for each transaction, computing a per-square-metre figure would require inference from EPC records or third-party sources, which introduces significant uncertainty. Until that data is available and validated, the map displays **total median sold price only**.

The string `£/m²` must not appear as a metric label, legend heading, or filter option anywhere in the UI. Its only permitted location is inside the disclaimer sentence above.

---

## Multi-Scale Geography Layers

The map automatically selects the appropriate geography level based on the current MapLibre zoom value. The selected layer is derived by `geographyLevelForZoom(zoom)` in `src/lib/market-map/geography.ts`.

| Zoom band | Geography level | Description |
|-----------|----------------|-------------|
| z4–6 (< 7) | `local_authority` | Local authority districts (LAD) — country / region view |
| z7–9 (7–9) | `postcode_district` | Postcode districts (e.g. SW1, M1) — city / borough view |
| z10–12 (10–12) | `msoa` | Middle Layer Super Output Areas — neighbourhood view |
| z13+ (≥ 13) | `lsoa` | Lower Layer Super Output Areas — local pocket view (finest level with data) |

The layer swap is automatic on every zoom change; no user action is required. `lsoa` is the finest level returned — MapLibre overzooms the z16 LSOA vector tile beyond zoom 16, so colour persists as the user keeps zooming in. `geographyLevelForZoom` never returns `street`.

---

## Colour Methodology

Choropleth fill colours are assigned using a **9-bucket log-scale** system:

1. **Input domain**: the p5 and p95 values of median sold prices across the comparison set (national or local — see next section).
2. **Clamping**: prices below p5 are treated as p5; prices above p95 are treated as p95. This prevents extreme outliers from compressing the colour range.
3. **Log scaling**: `log10(price)` is computed to compress the wide price range (e.g. £70k–£2m) into a perceptually even spread.
4. **Bucket assignment**: the log-scaled value is mapped linearly onto 9 equal-width buckets (1–9).

### Bucket colour palette

| Bucket | Hex | Meaning |
|--------|-----|---------|
| 1 | `#2D5A3D` | Forest green — lowest relative price |
| 2 | `#4A7A52` | |
| 3 | `#7A9E6A` | |
| 4 | `#B5C48A` | |
| 5 | `#C9A84C` | Muted gold — mid-range |
| 6 | `#C08A3A` | |
| 7 | `#A06030` | |
| 8 | `#8B3A28` | |
| 9 | `#6B1A1A` | Deep burgundy — highest relative price |
| — | `#9E9EAB` | Grey — insufficient data |

Areas with fewer than 5 transactions (confidence = Insufficient) are coloured `#9E9EAB` (grey) at 50% opacity and excluded from domain computation.

---

## National vs Local Colour Scale

The UI offers two comparison modes, toggled via the Scale filter:

### National comparison (default)

Colour buckets are computed relative to the **full national price distribution** (p5–p95 across all areas in the same geography level and date window). An area coloured green in national scale is genuinely lower-priced than most of England and Wales.

### Local comparison

Colour buckets are recomputed relative to **only the areas currently in the viewport**. This mode reveals intra-area variation: even in an expensive borough, the cheapest sub-areas appear green.

The active scale is always visible in the UI via the indicator text "Scale: National comparison" or "Scale: Local comparison".

Both scales use the same log-clamped 9-bucket approach; they differ only in which price set drives p5/p95.

---

## Street / Micro-Area Layer

> **Status: not active.** This H3 micro-area layer was designed but its data was
> never populated — `/api/market-map?geography_level=street` returns **0
> features** and the `market_map_tile` RPC caps geometry at LSOA. While
> `geographyLevelForZoom` still returned `street` at zoom ≥16, deep zoom blanked
> the choropleth (no colour, empty area list, "NO DATA" legend) and broke
> hover/click enrichment (street uses H3 ids, tiles use LSOA ids). The zoom
> mapping now caps at `lsoa`; `street` is no longer requested. The design below
> is retained for if/when the H3 pipeline is built and the cells are populated.

The intended design: at zoom 16 and above, the map would switch to the `street` layer. Because no street-level polygon boundaries are available in the ONS open dataset, this layer uses **H3 hexagonal grid cells** (Uber H3 library, resolution 8) instead of administrative polygons.

Key facts about this layer (when active):

- Label in the UI and API metadata: **"micro-area sold-price band"** (not "street valuation", not "£/m²").
- A cell is only coloured when it contains **≥ 5 transactions** in the selected date window; cells with fewer transactions appear grey.
- Individual property addresses and prices are **never exposed** — only the aggregated band for the hex cell is shown.
- Cells are derived by joining `ppd_transactions` → `postcode_geography.h3_cell` via the ONSPD postcode lookup.

---

## Confidence Rules

| Confidence level | Minimum transactions | Colour |
|-----------------|---------------------|--------|
| High | ≥ 30 | Normal bucket colour |
| Medium | 10–29 | Normal bucket colour |
| Low | 5–9 | Normal bucket colour |
| Insufficient | < 5 | Grey `#9E9EAB` at 50% opacity |

Only areas with confidence ≥ Low (≥ 5 transactions) are included in the domain computation for the colour scale.

---

## Flat vs House Breakdown

Clicking an area opens a detail panel that splits the area's sold prices into **flats / maisonettes** (PPD type `F`) and **houses** (detached `D` + semi-detached `S` + terraced `T`), each with its own median, transaction count, and confidence grade. This is fetched lazily, per clicked area, via `market_map_area_detail` (so the choropleth payload stays lean). A property type with fewer than the minimum registered sales shows "Insufficient registered sales for this property type" — never a fabricated £0.

## Active Geography-Level Diagnostic

The map renders a small pill (`data-testid="active-map-granularity"`) showing the geography level **actually served** for the current view (from the API response metadata, falling back to the zoom-derived level). It confirms that zooming changes the data layer — not just the camera — and gives E2E a deterministic hook that does not depend on map pixels.

---

## How to Populate the Data

Run the following steps in order from the project root. All commands assume Supabase is running (either hosted or local — see the local-DB caveat below).

### Step 1 — Apply database migrations

```bash
supabase db push
```

This applies the six market-map migrations:
- `202606160000001_postcode_geography.sql` — postcode lookup table
- `202606160000002_geography_boundaries.sql` — ONS boundary polygons table
- `202606160000003_market_map_aggregation.sql` — aggregate RPC and views
- `202606160000004_postcode_district_hulls.sql` — derived district hulls
- `202606160000005_postcode_sector_hulls.sql` — derived sector hulls
- `202606160000006_h3_micro_area.sql` — H3 cell aggregation support

### Step 2 — Ingest ONSPD postcode directory

```bash
pnpm ingest:onspd
```

Script: `scripts/ingest-onspd.mjs`

Downloads the ONS Postcode Directory and populates `postcode_geography` with postcode → LAD / MSOA / LSOA / H3 cell mappings.

### Step 3 — Ingest ONS boundaries

```bash
pnpm ingest:boundaries
```

Script: `scripts/ingest-ons-boundaries.mjs`

Downloads LAD, MSOA, and LSOA boundary GeoJSON from the ONS Open Geography Portal and populates `geography_boundaries`.

### Step 4 — Ensure ppd_transactions is populated

```bash
pnpm ingest:land-registry
```

This is the existing Land Registry Price Paid ingest script. It must have been run before the map will show any data. The market-map queries join against `ppd_transactions`.

> A seventh migration, `20260616000007_market_map_area_detail.sql`, adds the
> `market_map_area_detail` RPC used by the flat/house breakdown (see below).

### Quick start — seed a deterministic fixture (no national ingest)

To bring the whole map up end-to-end without the multi-GB national ingest (for local demo, E2E, and DB contract tests), apply the migrations then load the bundled fixture:

```bash
node scripts/seed-market-map-fixture.mjs          # seed (idempotent)
node scripts/seed-market-map-fixture.mjs --clean  # remove fixture
```

It loads a small, clearly-fictional `ZZ`-postcode hierarchy over London (two local authorities → districts → sectors → MSOAs → LSOAs) with distinct flat and house medians and one deliberately insufficient area. It is **not** national data — replace it with the real ingest (Steps 2–4) for production.

### Local database caveat

The local Supabase instance is currently **not running** due to a `NOW()` expression inside a database index in a separate migration (flood-risk epic). This prevents `supabase start` from succeeding. The ingest scripts and migrations must be run against a remote Supabase project until the conflicting migration is resolved.

---

## API Reference

### GET `/api/market-map`

Returns a GeoJSON `FeatureCollection` of choropleth areas for the current viewport. Responses are cached in Upstash Redis (TTL 300 s) and sent with `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`.

#### Query parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `bbox` | `"w,s,e,n"` | — | Viewport bounding box in WGS-84 degrees |
| `zoom` | number | 6 | MapLibre zoom level (used to derive `geography_level`) |
| `geography_level` | string | derived | Override: `local_authority \| postcode_district \| msoa \| lsoa \| street` |
| `property_type` | string | `"all"` | `all \| detached \| semi-detached \| terraced \| flat` |
| `months` | number | 36 | Trailing months: `12 \| 24 \| 36 \| 60` |
| `from_date` | ISO date | — | Start of date window (alternative to `months`) |
| `to_date` | ISO date | — | End of date window (alternative to `months`) |
| `scale_mode` | string | `"national"` | `national \| local` |
| `area_id` | string | — | Fetch a single area by ID instead of bbox |

#### Response shape

```jsonc
{
  "type": "FeatureCollection",
  "metadata": {
    "metric": "median_sold_price",
    "currency": "GBP",
    "sqm_available": false,
    "scale_mode": "national",
    "source": "HM Land Registry Price Paid Data joined to postcode geography",
    "minimum_transactions": 5,
    "band_label": "micro-area sold-price band"  // only present at street zoom
  },
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "MultiPolygon", "coordinates": [...] },
      "properties": {
        "area_id": "E09000033",
        "area_name": "Westminster",
        "geography_level": "local_authority",
        "median_price": 850000,      // pounds (integer)
        "p10_price": 420000,
        "p90_price": 2100000,
        "transaction_count": 1842,
        "latest_transaction_date": "2024-11-28",
        "confidence": "High",         // High | Medium | Low | Insufficient
        "colour_bucket": 9,           // 1–9 | null when Insufficient
        "fill_colour": "#6B1A1A",
        "scale_mode": "national",
        "date_from": "2022-06-01",
        "date_to": "2024-06-01",
        "property_type_mix": { "F": 1240, "T": 312, "D": 180, "S": 110 }
      }
    }
  ]
}
```

#### Error responses

| Status | Body | Cause |
|--------|------|-------|
| 400 | `{ "error": "Invalid query parameters", "details": ... }` | Zod validation failure |
| 500 | — | Service error |

---

### GET `/api/market-search`

Resolves a free-text query to candidate geographic areas for the search bar autocomplete. Responses cached in Redis (TTL 600 s).

#### Query parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search string (minimum 1 character) |

#### Response shape

```jsonc
{
  "results": [
    {
      "id": "E09000033",
      "name": "Westminster",
      "geography_level": "local_authority",
      "bbox": [-0.2090, 51.4740, -0.0982, 51.5356],
      "center": [-0.1337, 51.5005],
      "default_zoom": 12
    }
  ]
}
```

#### Error responses

| Status | Body | Cause |
|--------|------|-------|
| 400 | `{ "error": "Invalid query parameters", "details": ... }` | Missing or empty `q` |

---

### GET `/api/market-map/area/[level]/[areaId]`

Sold-price breakdown for a single area (overall / flats / houses) for the selected-area detail panel. Cached in Redis (TTL 300 s).

#### Path + query parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `level` | path | Yes | `local_authority` \| `postcode_district` \| `postcode_sector` \| `msoa` \| `lsoa` \| `street` |
| `areaId` | path | Yes | Area identifier at that level (e.g. LAD code, MSOA code, district string) |
| `from_date` / `to_date` | query | No | ISO date window (defaults to last `months`) |
| `months` | query | No | `12` \| `24` \| `36` \| `60` (default 36) |

#### Response shape

```jsonc
{
  "area_id": "E01000001",
  "geography_level": "lsoa",
  "date_from": "2023-06-18",
  "date_to": "2026-06-18",
  "overall": { "median": 450000, "p10": 257000, "p90": 643000, "transaction_count": 60, "confidence": "High", "latest_transaction_date": "2025-12-15" },
  "flat":    { "median": 300000, "transaction_count": 30, "confidence": "High", "latest_transaction_date": "2025-12-15" },
  "house":   { "median": 600000, "transaction_count": 30, "confidence": "High", "latest_transaction_date": "2025-12-15" }
}
```

Prices are in **pounds**. A segment with no sales returns `median: null` (the UI shows an insufficient-data label, never £0). `house` = `D` + `S` + `T`; `flat` = `F`.

#### Error responses

| Status | Body | Cause |
|--------|------|-------|
| 400 | `{ "error": "Invalid geography level '...'" }` | Unsupported `level` |
| 404 | `{ "error": "Area detail unavailable" }` | RPC returned no data |

---

## Architecture Map

```
src/lib/market-map/                  Pure utilities (no IO, fully unit-tested)
  colour.ts                          Bucket assignment, colourForBucket, priceColour
  confidence.ts                      confidenceFor (transaction count → level)
  fit-bounds.ts                      fitBoundsFor (search result → MapLibre params)
  geography.ts                       geographyLevelForZoom (caps at lsoa), GEOGRAPHY_LEVELS
  labels.ts                          Humanizer: LEVEL_LABEL, isOnsCode, humanizeAreaName, areaHref
  postcode.ts                        Postcode normalisation / validation helpers
  stats.ts                           computeClampBounds, percentile helpers
  street.ts                          H3 cell helpers for micro-area layer (layer not active)

supabase/migrations/                 Database schema
  2026061600000[1-6]_*.sql           Six market-map migrations (see above)

scripts/
  ingest-onspd.mjs                   Downloads + loads ONS Postcode Directory
  ingest-ons-boundaries.mjs          Downloads + loads ONS boundary GeoJSON

src/services/market-map/             Service layer (async IO, calls Supabase)
  market-map-service.ts              buildFeatureCollection (pure) + getMarketMapFeatures (IO)
  micro-area-service.ts              getMicroAreaFeatures — H3 hex-cell aggregation
  search-service.ts                  searchAreas — full-text area search
  types.ts                           Shared types (MarketMapFilters, MarketMapFeatureProperties, etc.)

src/app/api/
  market-map/route.ts                GET /api/market-map — Redis cache + service call
  market-search/route.ts             GET /api/market-search — Redis cache + search service

src/hooks/
  useMarketMap.ts                    TanStack Query hook; debounces bbox/zoom; fetches /api/market-map
  useMarketSearch.ts                 Debounced search hook; fetches /api/market-search

src/components/market-map/
  MarketMap.tsx                      MapLibre choropleth canvas; emits onFeatures/onAreaSelect/onMetadata
  MarketMapExplorer.tsx              Orchestrator: URL state, search bar, filter panel, area list
  MarketMapFilters.tsx               Property type / date window / metric / scale filter panel
  MarketMapLegend.tsx                Floating legend pill (gradient + swatch + disclaimer)
  MarketMapDisclaimer.tsx            Mandatory verbatim disclaimer text
  MarketMapAreaDetail.tsx            Selected-area detail card (right panel; "View full price report" link)
  MarketMapAreaList.tsx              Ranked areas in view (right panel); each row links to the area page
  MarketMapSummaryCards.tsx          KPI cards for the selected area
  MarketMapTooltip.tsx               Hover popup content

src/app/(main)/search/
  map/page.tsx                       Screen 1 — /search/map (national view)
  market-map/[areaId]/page.tsx       Screen 2 — /search/market-map/[areaId] (area view)

e2e/
  market-map.spec.ts                 Playwright acceptance specs (see spec header for run requirements)

docs/
  market-map.md                      This file
  DESIGN.md                          Original design specification (Stitch heatmap screen)
```
