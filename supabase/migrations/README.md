# Supabase Migrations — Conventions

## Always create migrations with the CLI

```bash
supabase migration new <description>
```

This produces a file named `YYYYMMDDHHMMSS_<description>.sql` with a **full
14-digit UTC timestamp** prefix. **Never hand-pick short numeric prefixes**
(`003_…`, `20260324_…`, etc.).

## Why this matters

The Supabase CLI tracks each migration by its **version** — the leading numeric
token before the first underscore in the filename — and stores it in a table
whose **PRIMARY KEY is `version`**. Two files that share a leading token (e.g.
`003_property_portal.sql` and `003_dashboards.sql`, or
`20260324_a.sql` and `20260324_b.sql`) collide on that key, and
`supabase db reset` / `start` / `db push` aborts with:

```
ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"
DETAIL: Key (version)=(003) already exists.
```

A full 14-digit timestamp is unique to the second, so CLI-created migrations
never collide.

## Rules

1. **One logical change per file.** Don't bundle unrelated schema changes.
2. **14-digit UTC timestamp prefix** (`YYYYMMDDHHMMSS_`) on every file — let
   `supabase migration new` generate it.
3. **Never reuse or hand-edit a version prefix** to sort a file into a spot.
4. Migrations are **append-only**. To change applied schema, add a new
   migration; don't edit a file that has already shipped.

## Guard

`scripts/check-migration-versions.mjs` (run via `pnpm check:migrations`) fails
if any two files share a leading version token. It runs in CI
(`.github/workflows/app-ci.yml`) on every PR that touches `supabase/migrations/`,
so a collision is caught **before merge**.
