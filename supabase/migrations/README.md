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

## Applying migrations to prod (manual flow)

The auto-apply `Supabase Migrations` workflow (`.github/workflows/migrate.yml`)
was retired on 2026-06-18 because the prod `schema_migrations` ledger has
diverged from main:

- The baseline-squash work (PR #39, `chore/supabase-baseline-squash`) was
  merged into `codex/link-render-qa`, not main. Prod's ledger was reconciled
  to match the squashed state (17 historical tokens + `00000000000000`
  baseline marked applied), but main's tree still carries the un-squashed
  short-token historical files.
- Several historical files were also edited after they were applied to prod
  (violating the append-only rule above), which `supabase db push` flags as
  drift between file statements and stored ledger rows.

Until that history is reconciled (re-running the baseline-squash on main is
the canonical fix; see PR #39 for the recipe), apply new migrations manually:

1. Merge the PR introducing the new migration.
2. Pull main locally.
3. Execute the migration's SQL directly against prod (Supabase SQL editor or
   `psql "$SUPABASE_DB_URL" -f supabase/migrations/<file>.sql`).
4. Record it in the ledger:
   `supabase migration repair --db-url "$SUPABASE_DB_URL" --status applied <version-token>`
5. Verify with `supabase migration list --db-url "$SUPABASE_DB_URL"`.

Phase 5 (PR #46, `bd4999f0`) shipped this way and is the working precedent.

## Never drop a migration whose dependent code still ships

A migration and the code that depends on it are one unit. If you remove or
"deduplicate" a migration, you MUST remove the code that reads the schema it
created — and vice versa. Dropping one without the other leaves the schema
source-of-truth broken and the feature liable to fail at runtime.

Real incident: PR #49 dropped the Phase 5 disputes migrations
(`20260612000005_truedeed_disputes.sql`, `…_06_gdpr.sql`) as "duplicates", but
`src/services/truedeed/dispute-service.ts` (and the admin disputes UI/API) kept
querying `invoice_disputes` and the `decide_invoice_dispute` RPC. No migration
on `main` created them — the feature would break on any fresh DB. Restored in
PR #70.

Before dropping a migration, grep the app for the objects it defines
(table/function/view/policy names). If anything references them, keep the
migration or land the code removal in the same PR.
