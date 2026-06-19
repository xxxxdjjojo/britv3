# Valuation Data Dictionary

**Date:** 2026-06-18
**Scope:** Data sources backing the Britestate AVM (automated valuation model) and comparable-evidence engine.
**Primary source:** `public.price_paid_data` (HM Land Registry "Price Paid Data", PPD) on the remote Supabase Postgres database (~31,092,167 rows).

All figures in this document marked *(sampled)* come from `TABLESAMPLE` or single-outward-code queries against the live table, not full-population scans. The exact SQL is shown so results are reproducible. The table is ~31M rows behind an ~8s statement timeout, so **never** run an unfiltered full-table aggregate.

---

## 1. Source: `public.price_paid_data` (HM Land Registry Price Paid)

| Property | Value |
|---|---|
| Rows | ~31,092,167 |
| Coverage | England & Wales only. **Scotland is NOT present** (see §4). |
| Date range | 1995-01-01 → 2026-02-27 (latest `max(date_of_transfer)`, queried 2026-06-18) |
| Grain | One row per registered transfer (sale event), not per property |
| Licence | Open Government Licence (OGL) v3.0 — free to use with attribution |
| Attribution | "Contains HM Land Registry data © Crown copyright and database right 2026. This data is licensed under the Open Government Licence v3.0." |
| RLS | Public `SELECT` (anon-readable) |

### Latest-date query

```sql
SELECT max(date_of_transfer) FROM price_paid_data;
-- 2026-02-27 00:00:00
```

(This ran without timing out via the `ppd_outward_date_idx` ordering; if it had timed out, the fallback is per-area `max()` such as SW18 → 2026-02-20.)

### Columns

| Column | Type | HMLR code values | Nullable | Null rate *(sampled)* | Join role |
|---|---|---|---|---|---|
| `transaction_id` | `text` | UUID-style unique key | NO (PK) | 0% | Primary key; de-dupe key |
| `price` | `bigint` | **Whole pounds** (no pence, no decimals) | NO | 0% | Valuation target / comparable value |
| `date_of_transfer` | `timestamp` | Completion date (time always 00:00) | NO | 0% | Time filter; recency weighting |
| `postcode` | `text` | Full unit postcode, e.g. `SW18 1AB` | YES | ~0.1% (20/16,290) | **Primary geo join key** (→ outward_code, postcodes.io) |
| `property_type` | `char(1)` | `D` detached, `S` semi-detached, `T` terraced, `F` flat/maisonette, `O` other | NO | 0% | Like-for-like comparable filter |
| `old_new` | `char(1)` | `Y` new build, `N` existing/established | NO | 0% | New-build premium adjustment |
| `duration` | `char(1)` | `F` freehold, `L` leasehold | NO | 0% | Tenure filter (do not mix L flats with F houses) |
| `paon` | `text` | Primary Addressable Object Name (house number/name) | YES | ~0.006% (1/16,290) | Address match (with postcode) |
| `saon` | `text` | Secondary Addressable Object Name (flat/unit within PAON) | YES | ~66% (see §3) | Flat-level address disambiguation |
| `street` | `text` | Street name | YES | ~1.4% (232/16,290) | Display; coarse address match |
| `locality` | `text` | Locality / village | YES | high (often blank) | Display only |
| `town` | `text` | Post town, e.g. `LONDON` | YES | ~0.04% | Display; coarse area label |
| `district` | `text` | Local authority district | YES | low | Coarse area grouping |
| `county` | `text` | Administrative/ceremonial county | YES | low | Coarse area grouping |
| `ppd_category` | `char(1)` | `A` standard residential open-market; `B` additional / non-open-market (repossessions, buy-to-lets sold in bulk, transfers to companies, price not necessarily market) | NO | 0% | **Filter: EXCLUDE `B` from comparables** |
| `record_status` | `char(1)` | `A` addition, `C` change, `D` deletion (monthly-file semantics) | NO | 0% | Filter: keep `A` only |
| `outward_code` | `text` | Outward half of postcode, e.g. `SW18` (derived helper column, not in raw HMLR feed) | YES | ~0.1% | **Index-backed area join key** (`ppd_outward_date_idx`) |

> Note: `outward_code` is a project-added derived column (the HMLR raw feed only ships full `postcode`). It exists specifically to make per-area lookups index-fast and avoids `LIKE 'SW18%'` scans.

### HMLR code-value distributions *(sampled, `TABLESAMPLE SYSTEM (0.05)`, ~16k rows)*

```sql
SELECT property_type, count(*) FROM price_paid_data TABLESAMPLE SYSTEM (0.05) GROUP BY property_type ORDER BY 2 DESC;
-- T 4490 | S 4262 | D 3587 | F 2841 | O 166
SELECT old_new, count(*) FROM price_paid_data TABLESAMPLE SYSTEM (0.05) GROUP BY old_new;
-- N 13741 | Y 1517   (~10% new build)
SELECT duration, count(*) FROM price_paid_data TABLESAMPLE SYSTEM (0.05) GROUP BY duration;
-- F 12143 | L 3964   (~25% leasehold)
SELECT ppd_category, count(*) FROM price_paid_data TABLESAMPLE SYSTEM (0.05) GROUP BY ppd_category;
-- A 14741 | B 827    (~5.3% category B)
SELECT record_status, count(*) FROM price_paid_data TABLESAMPLE SYSTEM (0.1) GROUP BY record_status;
-- A 30766   (no C or D observed in sample — snapshot is fully "add")
```

### Indexes (query-planning relevance)

| Index | Definition | Use |
|---|---|---|
| PK | `(transaction_id)` | Row identity / de-dupe |
| `ppd_outward_date_idx` | `(outward_code, date_of_transfer DESC)` | **Area + recency lookups** (the main AVM access path) |
| `ppd_exact_match_idx` | `(postcode, paon, date_of_transfer DESC) WHERE postcode IS NOT NULL` | Exact single-address history |
| `ppd_flat_match_idx` | `(postcode, paon, saon)` | Flat-level address resolution |

---

## 2. Source: postcodes.io geocoding (`src/services/geocoding/postcodes-io.ts`)

| Property | Value |
|---|---|
| Type | External HTTP API (`https://api.postcodes.io`), not a DB table |
| Coverage | All live UK postcodes (England, Wales, Scotland, NI) — broader than PPD |
| Returns | `postcode`, `latitude`, `longitude`, `admin_district`, `region` |
| Bulk | `geocodePostcodes()` — max 100 postcodes per request |
| Latest date | Live service; tracks ONS postcode directory releases (quarterly) |
| Join key | `postcode` ↔ `price_paid_data.postcode` |
| Failure mode | Returns `null` on invalid postcode / network error (no throw) |
| Licence | Open Government Licence (OGL) + OS data under PSGA terms; free |
| Attribution | "Contains OS data © Crown copyright and database right 2026; ONS data; Royal Mail data — all under the Open Government Licence v3.0." |

Used to convert a PPD `postcode` to lat/long for distance-ranked comparable search and map display. Because postcodes.io covers Scotland but PPD does not, a successful geocode does **not** guarantee comparable evidence exists (see Audit §Address-as-property warning).

---

## 3. Sources: `public.properties` and `public.listings`

| Table | Rows *(queried)* | Role |
|---|---|---|
| `public.properties` | 103 | Britestate's own property records (subject properties / portfolio) |
| `public.listings` | 104 | Marketing listings linked to properties |

Address/geo-relevant columns on `properties`: `address_line1`, `address_line2`, `postcode`, `bedrooms`, `epc_rating` (`char`), `epc_score` (`int`).

These are **small first-party tables** (~100 rows), not a market dataset. They supply subject-property attributes (beds, EPC band) but carry **no floor-area / square-metre field** and **no PPD `transaction_id` foreign key** — joins to PPD are by `postcode` (+ address text), which is fuzzy.

Join key to PPD: `properties.postcode` ↔ `price_paid_data.postcode` (then address-text match on `paon`/`address_line1`).

---

## 4. Sources NOT available (explicit gaps)

| Wanted source | Status | Impact on valuation |
|---|---|---|
| **Floor area (m²)** | **Not available.** EPC is present only as `epc_rating`/`epc_score` on `properties`; there is no EPC floor-area / total-floor-area dataset, and PPD has no size field. | Cannot compute £/m². AVM is constrained to type + tenure + location + recency. |
| **HPI (House Price Index)** | **Not present** — no `hpi`/`house_price_index` table exists. | No published index to time-adjust older comparables; recency weighting must be derived in-app. |
| **UPRN** | Not present in PPD or `properties`. | No authoritative unique-property join; address matching is text-based. |
| **Scotland transactions** | Not in PPD (HMLR covers England & Wales only; Scotland is Registers of Scotland). | Scottish postcodes geocode fine but return zero comparables (verified §4 of the Audit). |

### Scotland-absence verification

```sql
SELECT count(*) FROM price_paid_data WHERE outward_code='EH1'; -- Edinburgh -> 0
SELECT count(*) FROM price_paid_data WHERE outward_code='G1';  -- Glasgow   -> 0
SELECT count(*) FROM price_paid_data WHERE outward_code='G2';  -- Glasgow   -> 0
-- Wales present:
SELECT count(*) FROM price_paid_data WHERE outward_code='CF10'; -- Cardiff  -> 13150
SELECT count(*) FROM price_paid_data WHERE outward_code='LL57'; -- Bangor   -> 10870
```

---

## 5. Recommended comparable-selection filter (canonical)

For open-market comparables, every AVM query should apply:

```sql
WHERE outward_code = :oc                       -- index-backed area scope
  AND date_of_transfer >= :since               -- recency window
  AND ppd_category = 'A'                        -- exclude non-open-market (B)
  AND record_status = 'A'                       -- exclude change/delete records
  AND property_type = :type                     -- like-for-like
  AND duration = :tenure                        -- don't mix freehold/leasehold
```

Optionally exclude `old_new = 'Y'` (or model the new-build premium separately) when valuing established stock.
