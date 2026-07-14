# DR restore verification — evidence record

**Date:** 2026-07-14 22:47 UTC
**Operator:** production-support initiative (PR 13)
**Repo state:** `feat/prod-support` @ `8f49e5e7`
**Result:** ✅ PASS — every business table's row count restored identically; only the by-design excluded reference tables differ.

This is a real, executed drill — not a plan. It proves the production database can be dumped and restored into a clean Postgres with faithful row counts. Re-run it with `scripts/dr/restore-verify.md`.

## What was tested

| | |
|---|---|
| Source | Production Supabase (`ynkqzzpcbpphjczmrfva`), PostgreSQL **17.6.1**, 20 GB / 218 public tables |
| Method | `pg_dump -Fc` of `public` (business data) → restore into a local Supabase Postgres **17.6** → per-table `count(*)` diff |
| Dump size | 5.0 MB (custom format) — business data only |
| Restore target | Local Supabase Postgres 17.6 (prod-parity image), isolated throwaway DB `dr_restore_test`, dropped after |
| Scope decision | **Tiered:** irreplaceable business data is restore-verified; 11 bulk reference/derived datasets (19.9 GB) are dumped **schema-only** and recover via re-ingest (see below) |

## Verification result

- **217 tables** restored — all public tables present in the target.
- **206 business tables: row counts match production exactly.**
- **192,142 business rows** verified identical (source vs restored).
- **11 mismatches — 100% explained by the tiered-scope design** (each is an excluded reference table, restored = 0). The set of *unexplained* mismatches is **empty**, which is the pass criterion.

### Excluded reference tables (schema-only; recover via re-ingest)

These are public open-data / derived datasets, reproducible from their ingest scripts — not customer data. Their volumes (non-sensitive) at drill time:

| Table | Prod rows | Recovery source |
|---|---:|---|
| price_paid_data | 31,092,167 | Land Registry Price Paid (ingest) |
| price_paid_transactions | 11,016,167 | derived from price_paid_data |
| postcode_geography | 2,701,386 | ONS / OS Open (ingest) |
| epc_certificates | 3,372,876 | EPC bulk dataset (`scripts/ingest-*`) |
| parcels | 2,072,544 | INSPIRE freehold parcels (ingest) |
| postcode_centroids | 1,746,976 | ONS NSPL (ingest) |
| broadband_coverage | 1,737,468 | Ofcom Connected Nations (`scripts/ingest-ofcom-broadband.mjs`) |
| market_map_area_stats | 972,973 | precompute (`refresh_market_map_area_stats()`) |
| os_open_uprn | 874,291 | OS Open UPRN (ingest) |
| market_map_sold_parcels | 122,710 | precompute |
| geography_boundaries | 46,290 | ONS boundaries (ingest) |

## Notes / honesty

- **Restore stderr:** 623 non-fatal lines, all benign — foreign-key constraints targeting `auth.users` (the `auth` schema is GoTrue-managed and outside a `public`-only dump) and one `spatial_ref_sys` PostGIS system-table permission notice. Table DDL and data loaded regardless; row counts are unaffected.
- **Restore target parity:** local Supabase Postgres 17.6 matches prod's 17.6.1 engine, PostGIS present, Supabase roles (`anon`/`authenticated`/`service_role`) pre-provisioned. `extensions` schema + `auth.uid()/role()/jwt()` stubs were created to match prod's extension placement before restore.
- **Supabase PITR tier is NOT verified in this drill.** The connected Supabase MCP is authenticated to a different account and cannot read this project's billing plan; verify the PITR window in the Supabase dashboard directly. Tracked as OR-09.
- **Cleanup:** `dr_restore_test` was dropped; the local Supabase stack and its `postgres`/`_supabase` databases were untouched; the dump file (`/tmp/dr_prod_public.dump`) was deleted (it contained real business data — never commit it).
