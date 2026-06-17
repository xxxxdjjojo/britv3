# Market Map — median sold price by area

Colour-coded maps of **median registered sold price** by postcode district, for
the Wandsworth MVP. Two screens:

- `/search/map` — Search Results Map (heatmap + results panel).
- `/search/market-map/[area]` — Area Price Explorer (summary, trend, tables).

## Data source

- **HM Land Registry Price Paid Data** (`price_paid_data` table, already loaded —
  ~31M rows nationally). Open Government Licence. Prices are whole pounds.
- **Postcode-district boundaries**: `src/data/geo/wandsworth-postcode-districts.json`,
  vendored via `scripts/fetch-postcode-districts.mjs` from
  [missinglink/uk-postcode-polygons](https://github.com/missinglink/uk-postcode-polygons)
  (Open Postcode Geo / OS Open Data, OGL v3). Areas are joined to data by the
  generated `outward_code` column (e.g. `SW18`) — no per-transaction geocoding.

## Aggregation rules

Per postcode district (`outward_code`), within the selected window:

- Include only `ppd_category = 'A'` (standard residential sales).
- Exclude `record_status = 'D'` (deletions), non-positive prices, and rows with
  no postcode.
- Default window: **latest 36 months** (selectable 12 / 24 / 36 / 60).
- Optional property-type filter (Detached / Semi / Terraced / Flat).
- Compute `median` (`percentile_cont(0.5)`), `p10`, `p90`, transaction count,
  latest date, and a property-type mix.

The aggregation runs as read-only parametrised SQL over the existing table
(`src/services/market-map/market-map-service.ts`); **no schema is created or
modified**.

## Confidence

From transaction count (`src/lib/market-map/confidence.ts`):

| Count | Confidence |
|-------|------------|
| ≥ 30  | High |
| ≥ 10  | Medium |
| ≥ 5   | Low |
| < 5   | Insufficient (rendered neutral grey, never a strong colour) |

## Colour algorithm

`src/lib/market-map/colour.ts`. Property prices are skewed, so we work in
`log10(median)` and clamp the domain to the **5th–95th percentile** of the
area medians, then interpolate across an 8-stop sequential brand-green ramp
(light green = lower median → deep green = higher median).
This stops one luxury area from washing out the map. The scale is **local**
(quantiles across the borough's areas); the legend states this. National fixed
percentiles + finer geography (sector / LSOA / hex) are designed-for but not
implemented in the MVP (`geography_level` is carried through end-to-end).

## API

`GET /api/market-map?area=&geography_level=&property_type=&from_date=&to_date=`
(`months` is a shorthand window). Returns a GeoJSON `FeatureCollection`; each
feature's `properties` carry `median_price`, `transaction_count`, `p10_price`,
`p90_price`, `confidence`, `colour_bucket`, `fill_colour`, `type_mix`, and the
date window. `metadata.sqm_available` is always `false`.
`GET /api/market-map/transactions` returns recent sales.

## Limitations

- Postcode-district polygons are **approximate** and can extend slightly beyond
  the borough's portion of a shared district.
- Land Registry data lags real completions and is periodically revised.
- **This is not a price-per-square-metre (£/m²) map.** We have no floor-area
  data, so a median sold price is the honest metric. £/m² would require EPC or
  equivalent floor-area data joined per property, which we do not hold.
