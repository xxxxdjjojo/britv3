# DR restore verification — procedure

Reproducible drill that proves the production database can be dumped and restored
with faithful row counts. Run it quarterly (or before a scaling/funding event) and
drop the dated evidence in `scripts/dr/evidence/`. Companion runbook for a *real*
recovery: `docs/support/runbooks/dr-restore.md`.

**This is read-only against production** (a `pg_dump` + `count(*)` queries). It never
writes to prod. The restore lands in a disposable local database that is dropped at
the end.

## Scope (tiered, deliberate)

Production is ~20 GB, but ~19.9 GB of that is bulk **reference/derived** open data
(Land Registry price-paid, ONS/OS postcode geography, EPC, INSPIRE parcels, market-map
precompute, Ofcom broadband, OS UPRN). That data is **reproducible from ingest scripts**,
not customer data — so the drill dumps it **schema-only** and restore-verifies the
**business data** (the irreplaceable rows). Reference recovery = re-run the ingest, not
a restore.

The excluded tables are chosen objectively: any `public` table whose total relation size
exceeds 50 MB. Confirm the current set before dumping:

```bash
psql "$SUPABASE_DB_URL" -tAc "select relname||' ('||pg_size_pretty(pg_total_relation_size(c.oid))||')'
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' and pg_total_relation_size(c.oid) > 52428800
  order by pg_total_relation_size(c.oid) desc;"
```

## Prerequisites

- `pg_dump` / `pg_restore` / `psql` (client ≥ prod server version; forward-compatible).
- A local **Supabase Postgres** matching the prod major version (this drill used the
  running local stack's `supabase_db_<name>` container — Postgres 17.6, PostGIS, Supabase
  roles pre-provisioned). `supabase start` in any project provides an equivalent target.
- `SUPABASE_DB_URL` for prod (from the canonical clone's `.env.local`; the pooler URL works).

> Note: the community `postgis/postgis` image has **no arm64 manifest** — on Apple Silicon
> use the Supabase Postgres image (as here) or `supabase start`, which are arm64-native and
> already carry PostGIS + the Supabase roles.

## Steps

1. **Dump prod** — `public` schema, business data only (schema kept for the excluded set):

   ```bash
   export SUPABASE_DB_URL="postgresql://...prod..."
   pg_dump "$SUPABASE_DB_URL" --schema=public --no-owner --no-privileges \
     --no-publications --no-subscriptions -Fc -f /tmp/dr_prod_public.dump \
     --exclude-table-data=public.price_paid_data \
     --exclude-table-data=public.price_paid_transactions \
     --exclude-table-data=public.postcode_geography \
     --exclude-table-data=public.epc_certificates \
     --exclude-table-data=public.parcels \
     --exclude-table-data=public.market_map_area_stats \
     --exclude-table-data=public.market_map_sold_parcels \
     --exclude-table-data=public.postcode_centroids \
     --exclude-table-data=public.broadband_coverage \
     --exclude-table-data=public.geography_boundaries \
     --exclude-table-data=public.os_open_uprn
   ```

   The dump contains real business data — **never commit it**; delete it after.

2. **Provision a fresh target DB** matching prod's extension placement. Mirror it with
   `select e.extname, n.nspname from pg_extension e join pg_namespace n on n.oid=e.extnamespace;`
   on prod. As of the 2026-07-14 drill: `extensions` schema holds `pgcrypto`/`uuid-ossp`/
   `pg_stat_statements`; `public` holds `postgis`/`citext`/`pg_trgm`/`btree_gin`.

   ```bash
   C=supabase_db_<name>   # your local Supabase Postgres container
   docker exec "$C" psql -U postgres -c "create database dr_restore_test;"
   docker exec -i "$C" psql -U postgres -d dr_restore_test <<'SQL'
   create schema if not exists extensions;
   create schema if not exists auth;
   create extension if not exists pgcrypto      with schema extensions;
   create extension if not exists "uuid-ossp"   with schema extensions;
   create extension if not exists pg_stat_statements with schema extensions;
   create extension if not exists citext;
   create extension if not exists pg_trgm;
   create extension if not exists btree_gin;
   create extension if not exists postgis;
   -- RLS policies reference these; stub so DDL restores (returns null in the copy)
   create or replace function auth.uid()  returns uuid  language sql stable as $$ select null::uuid $$;
   create or replace function auth.role() returns text  language sql stable as $$ select null::text $$;
   create or replace function auth.jwt()  returns jsonb language sql stable as $$ select '{}'::jsonb $$;
   SQL
   ```

3. **Restore** (benign errors expected — FK constraints to the GoTrue-managed
   `auth.users`, and one `spatial_ref_sys` PostGIS notice; they do not affect row counts):

   ```bash
   docker cp /tmp/dr_prod_public.dump "$C":/tmp/dr.dump
   docker exec "$C" pg_restore -U postgres -d dr_restore_test --no-owner --no-privileges /tmp/dr.dump
   ```

4. **Verify** — exact row count of every table, both sides, then diff:

   ```bash
   docker cp scripts/dr/verify-restore.sql "$C":/tmp/verify.sql
   docker exec "$C" psql -U postgres -d dr_restore_test -F$'\t' -tA -f /tmp/verify.sql | sort > /tmp/restored_counts.tsv
   psql "$SUPABASE_DB_URL"                 -F$'\t' -tA -f scripts/dr/verify-restore.sql | sort > /tmp/prod_counts.tsv
   join -t$'\t' /tmp/prod_counts.tsv /tmp/restored_counts.tsv | awk -F'\t' '$2 != $3'
   ```

   **Pass criterion:** every mismatch row is one of the excluded reference tables
   (restored = 0). Any *other* mismatch is a real restore fault — investigate before
   trusting the backup.

5. **Record & clean up:**

   ```bash
   docker exec "$C" psql -U postgres -c "drop database dr_restore_test;"
   rm -f /tmp/dr_prod_public.dump /tmp/*_counts.tsv
   ```

   Write the dated result to `scripts/dr/evidence/YYYY-MM-DD-restore-verification.md`
   (aggregate counts only — do not commit per-table business volumes or the dump).
