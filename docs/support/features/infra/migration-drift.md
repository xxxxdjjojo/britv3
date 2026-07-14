---
title: Migration drift
area: infra
severity_default: P2
code_paths:
  - supabase/migrations/README.md
  - src/services/admin/diagnostics-service.ts
tables: []
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules: []
last_verified_commit: ebb22d7b
---

# Migration drift

## Summary
The migration ledger and the live prod schema disagree — a migration was applied
out-of-band, a colliding version prefix broke ordering, or the ledger wasn't
reconciled after a manual apply. Symptoms are queries failing on a column/table
that "should" exist (or vice-versa).

## Symptoms
- Code expects a column/table the live DB lacks (or an extra one exists).
- `supabase db push` / `pnpm check:migrations` complains about ordering/collisions.
- A feature works locally but 500s in prod (schema mismatch).

## Customer impact
Whatever feature depends on the drifted schema breaks. P2 (P1 if it's a core flow).

## Severity
P2.

## Detection
- `pnpm check:migrations` (guards 14-digit UTC prefixes / collisions).
- `diagnostics-service.ts` / Sentry: query errors referencing a missing column.
- Compare the migration ledger to the live schema.

## Diagnosis
1. What exactly differs — a table/column present in code but missing in prod, or an
   applied migration not recorded in the ledger?
2. Was a migration applied via MCP/manually without reconciling the ledger (a known
   pattern here — see `supabase/migrations/README.md`)?
3. Any colliding version prefixes breaking `db reset`/`db push`?

## Remediation
- **Ledger not reconciled** → record the applied migration in the ledger so history
  matches reality (per `supabase/migrations/README.md`); do not re-run an
  already-applied migration.
- **Missing migration** → apply the outstanding migration through the normal flow.
- **Prefix collision** → rename to a correct full 14-digit UTC prefix; never
  hand-pick short numeric prefixes.
- Never hand-edit prod schema to "match" code — go through a migration.

## Verification
`pnpm check:migrations` passes, the ledger matches the live schema, and the affected
feature works in prod. Confirm with the real query, not a local one.

## Escalation
Ambiguous or risky reconciliation (possible data impact) → DB owner before applying
anything.

## Follow-up
Reinforce the "apply via MCP + reconcile ledger" discipline; consider a drift check
in CI/diagnostics.
