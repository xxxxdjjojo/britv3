# Disaster Recovery & Backups

**Owner:** [INFORMATION REQUIRED]

DR here is **evidenced, not asserted**. The restore path has been executed against a
production dump and the row counts verified (see the drill below). What is *not* yet
verified is called out honestly rather than assumed from the vendor's marketing.

## Backup posture

| Layer | Mechanism | Status |
|---|---|---|
| Postgres — automated backups | Supabase daily backups + Point-in-Time Recovery (PITR) | **PITR window/tier UNVERIFIED from tooling** — the connected Supabase MCP is authenticated to a different account and cannot read this project's plan. Confirm the retention window in the Supabase dashboard (Project → Database → Backups). Tracked as OR-09. |
| Postgres — logical restore drill | `pg_dump` → local restore → row-count diff (`scripts/dr/restore-verify.md`) | ✅ **Executed 2026-07-14** — evidence in `scripts/dr/evidence/`. |
| Storage buckets (files: attachments, compliance docs, provider docs) | Supabase Storage | **Backup coverage UNVERIFIED** — Storage objects are not part of the Postgres backup. Confirm bucket-level durability/versioning. OR-09. |
| Reference/derived datasets (~19.9 GB) | Re-ingestible from source scripts | ✅ Recovery = re-run ingest, not restore (see tiering below). |
| Schema / migrations | `supabase/migrations/` in git + `README.md` ledger | ✅ Source-controlled. |

## RTO / RPO targets (proposed — ratify with the business)

| Scenario | RPO (data loss tolerance) | RTO (time to recover) |
|---|---|---|
| Accidental row/table deletion (business data) | ≤ 24 h (daily backup); minutes with PITR | < 2 h (targeted PITR restore + reconcile) |
| Full DB loss/corruption | ≤ 24 h; minutes with PITR | < 4 h (full PITR restore) |
| Bulk reference dataset loss | N/A (reproducible) | Hours (re-run ingest; not on the critical path) |
| Storage bucket loss | UNVERIFIED — see OR-09 | UNVERIFIED |

These are *targets*, not measured guarantees. The logical-restore drill measures the
business-data restore path; PITR RTO/RPO depends on the Supabase tier (unverified above).

## Tiered recovery model (why the drill excludes 19.9 GB)

Production is ~20 GB across 218 public tables, but ~19.9 GB is bulk **reference/derived**
open data — Land Registry price-paid, ONS/OS postcode geography, EPC, INSPIRE parcels,
market-map precompute, Ofcom broadband, OS UPRN. That data is **reproducible from ingest
scripts** and is not what DR exists to protect. So recovery is tiered:

- **Tier 1 — business data (irreplaceable):** users, listings, subscriptions, billing
  events, messaging, support tickets, audit log, agent/provider profiles, etc. Recovered
  by **restore** (backup/PITR). This is what the drill verifies.
- **Tier 2 — reference/derived data (reproducible):** the 11 bulk tables. Recovered by
  **re-running the ingest scripts** against source datasets — no restore required. Losing
  it degrades map/pricing features temporarily but loses nothing irreplaceable.

## Restore drill — executed evidence

**2026-07-14 — PASS.** Full record: `scripts/dr/evidence/2026-07-14-restore-verification.md`.
Reproduce: `scripts/dr/restore-verify.md` (+ `scripts/dr/verify-restore.sql`).

- Production (PostgreSQL 17.6.1) `public` business data dumped (5.0 MB, `-Fc`) and restored
  into a local Supabase Postgres 17.6.
- **206 business tables restored with row counts identical to production (192,142 rows).**
- The only 11 row-count differences were the intentionally excluded reference tables
  (restored = 0, recover via re-ingest). **Zero unexplained mismatches** — the pass criterion.
- The drill is read-only against prod; the restore lands in a disposable local DB that is
  dropped afterward; the dump (real business data) is never committed.

## Other recovery surfaces

- **Domain / DNS:** `www.truedeed.co.uk` (apex 308 → www) on the DNS provider; the
  `status.truedeed.co.uk` host is optional (OR-13). Recovery = re-point records; keep
  registrar access in the emergency-access list.
- **Emergency admin access:** super-admin accounts are the break-glass path; MFA/AAL2 is
  enforced (`src/proxy.ts`). Keep at least two super-admins provisioned so a single lost
  device can't lock out admin.
- **Secrets:** rotation procedure in `docs/support/runbooks/secret-rotation.md`. A
  credential lost with the environment is re-issued vendor-side, not restored.

## Gaps (tracked, not hidden)

- **OR-09** — PITR *tier* and Storage-bucket backup coverage unverified; the executed
  evidence is a logical restore, not a PITR exercise. Verify both in the Supabase dashboard
  and, ideally, run one PITR restore to a branch to measure real RTO.
