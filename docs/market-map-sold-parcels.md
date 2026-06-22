# Sold-properties parcel layer (high-zoom £/m²)

A street-zoom map layer that shows **individual real Land-Registry sales**, each
snapped to its **HM Land Registry INSPIRE title parcel** and coloured by **£/m²**.
It sits on top of the existing area choropleth (`market_map_*`) and only appears
at `z >= 14`; below that the choropleth carries the map. England & Wales only.

Pilot LAD: **Tower Hamlets (E09000030)**. Designed to expand LAD-by-LAD.

## Why it looks the way it does

- **Only real sales are coloured.** A parcel is shown only if ≥1 Land-Registry
  sale was matched to it. Everywhere else stays on the area choropleth — that is
  correct, not a gap. There are **no modelled/estimated colours** at parcel level.
- **£/m² needs a floor area.** The £/m² (and the national colour bucket) is only
  computed where the sale matched an EPC with a usable `total_floor_area`. A sale
  with a price but no area gets a **neutral grey** parcel, never a guessed colour.
- **Flats share one parcel.** INSPIRE is **freehold only**, so a block of flats is
  a single polygon. Flat sales are listed on that one parcel (`sale_count > 1`),
  never split into per-flat parcels — that is a hard limit of the source data.

## Data sources (all free, OGL / commercial-OK)

| Source | Table | Ingest | Licence |
|---|---|---|---|
| HM Land Registry INSPIRE Index Polygons (per-LA GML, EPSG:27700) | `parcels` | `scripts/ingest-inspire.ts` | OGL v3.0 |
| OS Open UPRN (UPRN → coordinate) | `os_open_uprn` | `scripts/ingest-os-open-uprn.ts` | OGL v3.0 |
| HM Land Registry Price Paid Data | `price_paid_data` | (existing) | OGL v3.0 |
| EPC domestic certificates (floor area + UPRN) | `epc_certificates` | `scripts/ingest-epc.ts --lad <code>` | EPC Open Data |
| ONSPD postcode geo (LAD + centroid) | `postcode_geography` | (existing) | OGL v3.0 |

## Precision path (sale → exact parcel)

```
PPD sale --normalised address (postcode + PAON)--> EPC row --> { total_floor_area, uprn }
       --> os_open_uprn[uprn] --> precise lng/lat
       --> ST_Contains(parcels.geometry, point) --> the title parcel
```

The PPD↔EPC address match reuses the **same normalisers** as the unit-tested
matcher in `src/lib/epc/match-epc.ts`, reproduced in SQL as
`md_norm_postcode()` / `md_norm_paon()` (parity asserted by the same vectors).
Sales whose UPRN is absent from OS Open UPRN fall back to the **postcode
centroid** (flagged `estimated_location: true` in each sale and shown as
"Approx. location" in the popup).

Match coverage equals the PPD↔EPC match rate, which is bounded by EPC density.
The pilot LAD's full EPC history is ingested (`ingest-epc.ts --lad E09000030`)
to maximise it.

## Build / refresh

```bash
# 1. Parcels (per-LA INSPIRE GML — download from
#    https://use-land-property-data.service.gov.uk/datasets/inspire/download)
node --experimental-strip-types scripts/ingest-inspire.ts \
  --gml ".../Land_Registry_Cadastral_Parcels.gml" \
  --lad-cd E09000030 --lad-name "Tower Hamlets" --commit

# 2. EPC density for the pilot LAD (full certificate history)
node --experimental-strip-types scripts/ingest-epc.ts --lad E09000030 --commit

# 3. UPRN → coordinate (filtered to EPC UPRNs)
node --experimental-strip-types scripts/ingest-os-open-uprn.ts \
  --csv ".../osopenuprn_YYYYMM.csv" --commit

# 4. Materialise the sold parcels + national £/m² buckets, bump tile version
select public.refresh_market_map_sold_parcels('E09000030');
```

`refresh_market_map_sold_parcels(lad)` is idempotent: it replaces that LAD's rows,
re-bakes the national `ntile(9)` £/m² bucket across the whole table, and bumps
`market_map_meta.data_version` so the edge-cached tiles refresh.

## Serving

- `market_map_sold_parcels_tile(z,x,y)` → `ST_AsMVT` (layer `sold_parcels`),
  **`z >= 14` only**. Sold parcels are sparse, so high-zoom tiles are tiny.
- Route `GET /api/market-map/sold/{z}/{x}/{y}?v=<data_version>` — immutable edge
  cache; `204` below `z14` and for empty tiles. The full sale list (`sales`) is
  baked into each feature, so the popup needs **no extra fetch**.
- Client: `MarketMap.tsx` adds the `sold-parcels` vector source + fill (warm
  £/m² ramp, `colourForSoldBucket`), fades the choropleth back at street zoom,
  and renders `SoldParcelPopup` on click.

## Required attributions (shown in the map attribution control)

- Contains HM Land Registry data © Crown copyright and database right 2026.
  Licensed under the Open Government Licence v3.0. *(PPD + INSPIRE)*
- © Crown copyright and database rights 2026 Ordnance Survey AC0000851063.
  *(INSPIRE geometry + OS Open UPRN)*
- Energy Performance of Buildings Data © Crown copyright 2026. *(EPC)*

## Tests

- `src/lib/inspire/parse-inspire-gml.test.ts` — GML parse + EPSG:27700→4326.
- `src/lib/market-map/sold-colour.test.ts` — ramp, parsing, £ / £/m² formatting.
- `src/components/market-map/SoldParcelPopup.test.tsx` — single sale + flat block.
- `src/app/api/market-map/sold/sold-route.test.ts` — z<14 → 204, coord guards.
- `e2e/sold-parcels.spec.ts` — live tile bytes + click-to-popup sale detail.
- `md_norm_*` parity with `match-epc.ts` verified by shared vectors.
