---
title: DR restore
area: infra
severity_default: P1
code_paths:
  - docs/production-support/12-dr-and-backups.md
  - supabase/migrations/README.md
  - supabase/config.toml
tables: []
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules: []
last_verified_commit: ebb22d7b
---

# DR restore

## Summary
Recover the database from backup after data loss or corruption (a bad destructive
migration, accidental deletion, or provider-side loss). Restoring is high-stakes and
irreversible-in-the-wrong-direction, so this runbook is deliberate: confirm the loss,
choose the restore point, and verify integrity before cutting back over.

## Symptoms
- Confirmed data loss/corruption (rows/tables missing or wrong).
- A destructive migration or bulk operation ran against prod in error.
- Provider-reported data-durability event.

## Customer impact
Potentially severe and broad. P1.

## Severity
P1.

## Detection
- Data-loss reports, a diff between expected and actual row counts, or a
  known-bad destructive operation.

## Diagnosis
1. **Stop the bleeding** — halt whatever is writing/deleting; take the affected
   surface offline if needed. Do not let more data be lost while deciding.
2. Scope the loss: which tables, how many rows, and the last-known-good time (this
   sets the restore point and the acceptable RPO).
3. Confirm the backup/PITR posture: what restore points actually exist. **The exact
   Supabase plan tier / PITR window is verified in
   `docs/production-support/12-dr-and-backups.md`** — read it before assuming a
   restore point exists.

## Remediation
- **Point-in-time / partial** → if only specific data was lost, prefer a targeted
  restore (restore to a scratch copy, extract the affected rows, reconcile) over a
  full rollback that discards good writes since the incident.
- **Full restore** → restore to the chosen point per the Supabase DR procedure;
  expect to lose writes after the restore point (that's the RPO cost — communicate
  it).
- Re-apply migrations only through the ledgered flow (`supabase/migrations/README.md`);
  never hand-edit schema mid-restore.
- The restore procedure is exercised and evidenced against a local stack in
  `scripts/dr/` (delivered in PR 13) — run that drill's steps, don't improvise.

## Verification
Row counts and spot-checks match the expected state at the restore point, the app
runs against the restored DB, and no further data is being lost. Confirm with real
queries against the affected tables, and record what (if anything) was lost between
the restore point and the incident.

## Escalation
Any restore decision involving data loss → incident commander + DB owner before
executing; this is never a solo call. If the breach angle applies, also
`data-breach.md`.

## Follow-up
Post-incident review; verify/adjust the DR posture and RTO/RPO in
`docs/production-support/12-dr-and-backups.md`; ensure the destructive path that
caused it has a guard.
