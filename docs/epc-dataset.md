# EPC dataset pipeline

Britestate uses the **bulk-downloaded EPC domestic dataset** (not a live per-request
API — impractical at portal scale). Certificates are ingested into the database,
linked to properties by address, and denormalised onto `properties` so the detail
page and renovation ROI read EPC instantly.

```
certificates-YYYY.csv  ──ingest──▶  epc_certificates  ──link──▶  properties.epc_*
   (on disk, per year)                (one row / property)         (denormalised)
                                                          └──▶ listings.uprn (backfill)
```

## 1. The dataset

Download the **domestic** EPC certificates from the official source
(<https://epc.opendatacommunities.org/>). The pipeline expects the flat per-year
layout on disk:

```
/Users/jojominime/Downloads/domestic-csv/
  certificates-2012.csv
  certificates-2013.csv
  ...
  certificates-2026.csv
```

- Use the **`certificates-*.csv`** files only — **ignore `recommendations-*`**.
- Each file is quoted CSV with a wide (~93-column) header. Column order is **not**
  stable across years, so parsing resolves columns **by name**
  (`src/lib/epc/parse-epc-row.ts`).
- A property recurs across years. The ingest processes files **newest → oldest**
  and keeps the **latest certificate per property** (by `inspection_date`).

Source sentinels (`""`, `NO DATA!`, `INVALID!`, `N/A`, `Not Recorded`) collapse to
`NULL`. Only a lean subset of columns is kept.

## 2. Schema

Migration: `supabase/migrations/20260619140000_epc_dataset.sql`.

| Object | Purpose |
|---|---|
| `epc_certificates` | One row per property (PK `certificate_number`); `property_key` unique arbiter for the keep-latest upsert; btree on `postcode`, `uprn`, `lower(paon)`. RLS on, **no client policy** (internal). |
| `epc_ingest_runs` | Per-file ingest audit (`file_sha256`, counts, `status`) — mirrors `ppd_ingest_runs`. Lets a re-run skip already-ingested files. |
| `properties.epc_*` | Denormalised: `epc_rating`/`epc_score` (existing) plus `epc_potential_rating`, `epc_potential_score`, `epc_floor_area_sqm`, `epc_property_type`, `epc_built_form`, `epc_construction_age_band`, `epc_inspection_date`, `epc_lmk_key`, `epc_match_confidence`. |

`property_key` = `uprn:<uprn>` when present, else `pc:<POSTCODE>|<PAON>`.

## 3. Ingest

`scripts/ingest-epc.ts` streams each file line-by-line (a file is **never** loaded
into memory) and keep-latest-upserts on `property_key`. Dry run is the default
(parses + counts, **no DB**); `--commit` writes.

```bash
# dry run a single year, capped (fast sanity check — no DB)
node --experimental-strip-types scripts/ingest-epc.ts --year 2026 --limit 5000

# write a single year
node --experimental-strip-types scripts/ingest-epc.ts --commit --year 2026

# write everything (newest → oldest, multi-GB / long)
node --experimental-strip-types scripts/ingest-epc.ts --commit
```

Flags: `--dir <path>` (default `~/Downloads/domestic-csv`), `--year YYYY`,
`--limit N`, `--commit`. Re-running a committed file is a no-op (sha256 match in
`epc_ingest_runs`). Requires `SUPABASE_DB_URL` (or `.env.local`) and the pinned
`scripts/certs/supabase-prod-ca-2021.crt`.

## 4. Linking

`scripts/link-epc-to-properties.ts` matches each property to its certificate and
denormalises the EPC onto `properties`.

- Properties have **no UPRN**, so matching gates on **canonical postcode** then
  compares the **PAON** (leading token of `address_line1`) using the shared,
  unit-tested matcher (`src/lib/epc/match-epc.ts`), newest certificate wins.
- We only denormalise at **confidence ≥ 0.9** — **under-link rather than
  mis-link** (a wrong EPC band is worse than a missing one).
- When the matched certificate carries a UPRN we **backfill `listings.uprn`**, so
  subsequent PPD matching has the exact join key (and future EPC links can match
  on UPRN at confidence 1.0).

```bash
# dry run (reports match counts, no writes)
node --experimental-strip-types scripts/link-epc-to-properties.ts

# write
node --experimental-strip-types scripts/link-epc-to-properties.ts --commit
```

## 5. Matching rules (summary)

| Signal | Confidence |
|---|---|
| Exact UPRN | 1.0 |
| Canonical postcode + PAON (range-expanded, e.g. `12-14`) | 0.9 |
| Anything weaker | unlinked |

## 6. Space

`epc_certificates` is intentionally lean (btree only, **no trigram**; one latest
row per property). Pre-flight estimate: ~+7–8 GB on top of the ~17 GB DB → ~25 GB.
Supabase disk scales; ingest a `--year` slice first and confirm before a full load.

## 7. Tests

- `src/lib/epc/parse-epc-row.test.ts` — header-indexed parse + sentinel handling.
- `src/lib/epc/match-epc.test.ts` — UPRN / postcode+PAON matching, under-link.
- `db-tests/epc-dataset.test.ts` — schema, keep-latest upsert, indexes, RLS
  (real Postgres; `pnpm test:db`).
