# Market-map: instant Flat/House card + tiled choropleth

**Date:** 2026-06-19
**Status:** Approved design → plan
**Branch:** `feat/market-map-instant-card` (worktree off `origin/main`)

## Context

The national market-map (merged in `06f79213`) renders a real-data choropleth and an
area card, but two things are slow/missing:

1. The address→price card uses `market_map_area_detail()`, which runs **live
   `percentile_cont` over `ppd_with_geography` (13–22M rows)** — too slow for an
   "instant" card, and it isn't a clean Flat-vs-House split.
2. The choropleth ships **per-viewport GeoJSON** from `/api/market-map`
   (`ST_AsGeoJSON`) and recomputes a national colour domain per request — pan/zoom
   lag, and a redundant second aggregate call per request.

**Goal:** postcode/area entered → **instant** Flat avg + House avg card (median +
p10–p90 range + confidence from count) → `map.flyTo(center, default_zoom)` over the
existing choropleth. Window fixed at **12 months**. No filter UI.

**Extend the existing `market_map_*` stack — do not rebuild it.**

### What already exists (reuse, do not recreate)
- `market_map_area_stats(geography_level, area_id, area_name, property_type ∈ {all,
  detached,semi-detached,terraced,flat}, window_months ∈ {12,24,36,60}, median/p10/
  p90_price_pence, transaction_count, latest_transaction_date, property_type_mix)`,
  PK `(geography_level, area_id, property_type, window_months)`, refreshed by
  `refresh_market_map_area_stats()` (loops level × window, GROUPING SETS).
- `market_map_aggregate()` → reads the precompute (indexed lookup).
- `market_map_features()` → joins aggregate to `geography_boundaries.geometry`,
  `ST_AsGeoJSON` per area (current choropleth source).
- `market_map_area_detail(level,area_id,from,to)` → live percentile drill-down (kept).
- `market_map_search(q,limit)` → `{area_id, geography_level, center, bbox,
  default_zoom}` (postcode/area-level; no house-number geocoding).

### Verified facts / corrected assumptions
- `geography_boundaries.geometry` is **generalised** (ONS BGC). ✅ no extra simplify needed.
- Deploy is **Vercel + Upstash Redis**, **not Cloudflare**. Tile caching uses Vercel
  edge CDN via `Cache-Control: immutable` keyed by a data-version (+ Redis). Same
  mechanism, different provider.
- `MarketMap.tsx` already carries `TODO(pmtiles)` markers; this spec instead uses
  **dynamic `ST_AsMVT`** (reflects each refresh immediately, no build step). PostGIS
  on Supabase supports `ST_AsMVT`.

## Phasing

- **Phase 1 (ships independently): Changes 1–3** — house rollup + instant card +
  search wiring. Low-risk SQL + UI; delivers the headline goal.
- **Phase 2: Change 4** — `ST_AsMVT` vector tiles replace per-viewport GeoJSON.

---

## Change 1 — `'house'` rollup + baked colour buckets (refresh extension)

**Data model additions to `market_map_area_stats`:**
- New `property_type` value **`'house'`** = own `percentile_cont` over transactions
  with `property_type IN ('D','S','T')`. **Its own rollup — never derived from
  `all` and `flat`.**
- New column **`bucket smallint`** = national colour bucket.

**`refresh_market_map_area_stats()` changes:**
- Per `(level, window)`: keep the existing GROUPING SETS insert (per-type + `all`),
  **add** a `'house'` aggregation (`GROUP BY grp_id WHERE property_type IN
  ('D','S','T')`).
- **Final pass:** `bucket = ntile(N) OVER (PARTITION BY geography_level,
  property_type, window_months ORDER BY median_price_pence)` over areas with
  `transaction_count >= 5`. Fixed **national, per-level** quantiles computed once.
  `N` = the stop count of `MarketMapLegend` (read at impl; align both).
- **New 1-row table `market_map_meta(data_version text)`**; refresh stamps a fresh
  token (drives Change 4 cache-busting).

**Verify:** `SELECT property_type, count(*) FROM market_map_area_stats GROUP BY 1`
includes `house`; spot-check one LSOA `house` median ≈ a hand-computed median over its
D/S/T sales; every populated row has a non-null `bucket`.

**Rollback:** re-run prior migration body (drops `house` rows on next refresh; drop
`bucket` column + `market_map_meta`).

---

## Change 2 — instant card RPC (`market_map_area_card`)

`market_map_area_card(p_level text, p_area_id text, p_window int default 12)`
returns `jsonb`:
```json
{ "flat":  {"median_pence":…,"p10":…,"p90":…,"count":…,"latest_date":…},
  "house": {"median_pence":…,"p10":…,"p90":…,"count":…,"latest_date":…} }
```
- Pure indexed lookup on `market_map_area_stats` (PK), `flat` row + `house` row.
- Card service calls **this**, not `market_map_area_detail` (kept for optional fresh
  drill-down only).

**Verify:** card p95 **<150ms** warm against eu-west-1; `EXPLAIN` shows **no
`ppd_with_geography` scan** (index-only/PK lookup on the precompute).

**Rollback:** `DROP FUNCTION market_map_area_card`; revert card service to prior call.

---

## Change 3 — wire search → card + flyTo (parallel)

On search-result select:
- (a) call `market_map_area_card({geography_level, area_id, 12})` and render
  Flat/House **immediately**;
- (b) `map.flyTo({center, zoom: default_zoom})`.
- Fire **(a) and (b) in parallel** — the card must NOT wait on map movement.
- `count === 0` → show **"Insufficient sales"**, never £0.
- Confidence = `confidenceFor(transaction_count)` buckets (Insufficient<5 / Low≥5 /
  Medium≥10 / High≥30) → **dot index** (MeilleursAgents-style), rendered on each of
  Flat / House.

**Verify:** result select renders card with no perceptible wait; map flight does not
block the card; a known low-volume area shows "Insufficient sales" not £0.

**Rollback:** revert the result-select handler + card component to prior commit.

---

## Change 4 — `ST_AsMVT` vector tiles (replace per-viewport GeoJSON)

- **`market_map_tile(z,x,y, property_type default 'all', window default 12)`** →
  `bytea` MVT via `ST_AsMVT` over `geography_boundaries ⋈ market_map_area_stats`,
  **geography_level chosen by `z`** (reuse `geographyLevelForZoom`: LAD/postcode_district
  low-z, MSOA mid, LSOA high). MVT feature props: `area_id`, baked `bucket`,
  `median_price_pence`, `transaction_count` (for hover/popup).
- **Route** `app/api/market-map/tiles/[z]/[x]/[y]/route.ts` → MVT bytes,
  `Content-Type: application/vnd.mapbox-vector-tile`,
  **`Cache-Control: public, max-age=31536000, immutable`** with the `data_version`
  in the path/query so a new refresh produces fresh tile URLs. Vercel edge CDN + Redis.
- **Client:** MapLibre `<Source type="vector">` + fill `Layer` coloured by a
  `step`/`match` paint expression on the baked `bucket` property — colours never
  recompute on pan. **Remove the per-request national-domain aggregate call** (now
  redundant — buckets are baked).
- **Map fill = `property_type='all'`** (overall median). Flat/House split lives only
  in the card.

**Verify:** pan/zoom issues **only cached tile requests** (Network tab, 304/`cf`-style
hits or Vercel edge `HIT`); first paint **<1s**; the choropleth matches the previous
GeoJSON output for a sample viewport.

**Rollback:** revert the client `<Source>` to GeoJSON + restore the national-domain
call; `DROP FUNCTION market_map_tile`; remove the tiles route.

---

## DO NOT
- Rebuild `market_map_*` — extend it.
- Compute the card via a live percentile over `ppd_with_geography`.
- Derive `house` from `all` and `flat` — it is its own rollup.
- Ship country-wide GeoJSON to colour client-side — use `ST_AsMVT` tiles.
- Add a National/Local scale toggle or a date picker — fixed national buckets, 12mo.

## Commits
Surgical, one logical change each, **each with a rollback note** in the body.
Migrations via `supabase migration new` (full 14-digit prefix). Land via PR →
squash-merge → delete branch (CLAUDE.md branch discipline).
