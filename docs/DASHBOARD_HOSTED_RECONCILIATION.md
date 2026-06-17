# Hosted-vs-Local Schema Reconciliation Report

> Task 1 of the dashboard test-and-fix effort (branch `test/dashboard-m2-smoke`, PR #41).
> Generated 2026-06-17. Companion to [`DASHBOARD_M2_FINDINGS.md`](./DASHBOARD_M2_FINDINGS.md).
>
> **Method.** Read-only introspection of the hosted project `ynkqzzpcbpphjczmrfva`
> (`SUPABASE_DB_URL`, pooler) vs a clean local baseline built by `supabase db reset`
> (all 81 on-disk migrations). `information_schema.columns`, `information_schema.tables`,
> `pg_enum`, and `pg_constraint` were dumped from both and diffed
> (artifacts under `.schema-diff/`, git-ignored). **No writes were issued to hosted.**

## TL;DR

- **Hosted baseline:** 157 base tables / 1628 columns. **Local baseline:** 149 base tables / 1539 columns.
- **Every edit in commit `251d34dd` is SAFE and requires NO hosted change.** Each one corrected an
  on-disk migration that had drifted *away* from the hosted schema; the post-edit migration now
  matches hosted reality on every disputed point (verified column-by-column below). Do **not** revert them.
- **The F2–F6 app-query fixes (`79d41288`) are correct against hosted** — each rewritten query
  targets a column/table that exists in hosted (`plan_name`, `address_line1`, `display_name`,
  `email_campaigns.content` jsonb, `listing_moderation`).
- **One change genuinely needs to be applied to hosted:** the new migration
  `20260617000000_listing_moderation_listing_fk.sql`. Hosted has `listing_moderation.listing_id`
  but **no FK to `listings`**, and the F4 fix relies on a PostgREST embed that requires it.
  Verified safe to apply (0 rows, 0 orphans on hosted). **Propose; apply only with user approval.**
- **Broader bidirectional drift exists** (tables and columns present on one side only) from parallel
  feature branches. It is **not** introduced by this branch and must **not** be blind-applied.
  It needs a deliberate migration-baseline reconciliation as separate work.
- **One local-only on-disk fix is needed for Task 2** (not a hosted change): add `mortgage_broker`
  to the `user_role` enum. Hosted already has it; the on-disk enum does not, which breaks the local seed.

---

## Part A — Verdict on each `251d34dd` edit (the question asked)

`251d34dd` ("reconcile broken migrations so `supabase db reset` applies cleanly") edited 12 historical
migrations. For each, the verdict is **hosted already matches** (post-edit migration == hosted), or
**internal SQL-correctness fix** (no hosted schema implication). **None conflict with hosted.**

| # | Migration / edit | Claim in commit | Hosted reality (verified) | Verdict |
|---|---|---|---|---|
| 1 | `017_public_profiles` — `service_provider_details` PK is `user_id` not `id` | PK = user_id | `service_provider_details` has `user_id`, **no `id`** | ✅ hosted matches |
| 1 | `017_public_profiles` — drop `service_provider_details.city` ref in `get_seo_category_locations` | column doesn't exist | **no `city`** column on hosted | ✅ hosted matches |
| 1 | `017_public_profiles` — relocate premature `provider_services` anon policy | ordering only | `provider_services` table exists on hosted | ✅ no schema impact |
| 2 | `20260313_agent_dashboard` — `COUNT(*) FILTER` before `::NUMERIC` cast | SQL syntax | view/function correctness; same result shape | ✅ internal fix |
| 3 | `admin_wave1/wave2`, `email_logs`, `feature_flag_rpc` — gate admin RLS on `profiles.is_admin` not `role` | profiles has `is_admin`, not `role` | `profiles.is_admin` **present**, `profiles.role` **absent** | ✅ hosted matches |
| 3 | profiles search index uses `display_name` not `full_name`/`email` | those columns don't exist | `display_name` **present**; `full_name`/`email` **absent** | ✅ hosted matches |
| 4 | `20260318_property_detail_pages` — idempotent CREATEs; drop policy/index on `properties.status`/`slug` | columns don't exist | `properties.status` **absent**, `properties.slug` **absent** | ✅ hosted matches |
| 5 | `202603190_backend_blueprint_indexes` — price/status on `listings`; `price_history` keyed by `listing_id`/`changed_at` | columns live there | `listings.price` + `listings.status` **present**; `price_history(listing_id, changed_at, …)` **present** | ✅ hosted matches |
| 6 | `provider_expansion` — split `'completing'` enum add into own migration; FK column `allowed_by` not `allowed_actors` | PG txn rule + FK col | `'completing'` present on both sides (no enum diff); internal correctness | ✅ internal fix |
| 7 | `20260429 rls_policies` / `database_indexes` — neutralize audit worksheets on `agency_leads`, `agents`, `rental_listings` | tables are fictional | **all three absent** on hosted | ✅ hosted matches (objects never existed) |
| 8 | `gdpr_deletion_safety` — skip partition-inherited FK copies before DROP | operational correctness | no schema divergence | ✅ internal fix |
| 9 | `20260616 harden_admin_rls` — drop the `audit_logs` block | table never existed | `audit_logs` **absent** on hosted | ✅ hosted matches |

**Conclusion (Part A):** `251d34dd` did not invent a divergent schema — it removed on-disk references
to objects/columns hosted never had, and switched admin gating to the column hosted actually uses
(`is_admin`). The local baseline it produces is **consistent with hosted** on every point it touched.
**No hosted migration is required to reconcile these edits, and they should not be reverted.**

---

## Part B — F2–F6 app fixes (`79d41288`) vs hosted

The F2–F6 findings were app code querying columns the hosted DB does not have. The fix rewrote the
queries to the **real** hosted columns. Verified against hosted:

| Finding | App now uses | Hosted has it? | Status |
|---|---|---|---|
| F2 `/admin/email-campaigns` | insert `{ body }` into `email_campaigns.content` (jsonb NOT NULL) | `content` is `jsonb NOT NULL` ✅ | correct |
| F3 `/admin/verifications` | `profiles.display_name` + `provider_verification_status` enum | `display_name` present ✅ | correct |
| F4 `/admin/moderation` | read `listings` + `properties(title)` + **embed `listing_moderation`** | table present, `listing_id uuid NOT NULL` present ✅ — **but no FK** ⚠️ | needs FK (see Part C) |
| F5 `/admin/subscriptions` | `subscriptions.plan_name` (not `plan`) | `plan_name` present ✅ | correct |
| F6 landlord finance | `properties.address_line1` (not `address_line_1`) | `address_line1` present ✅ | correct |

All five query rewrites match hosted columns. **F4 additionally depends on a foreign key that hosted
lacks** — without it PostgREST cannot embed `listing_moderation` from `listings`, so `/admin/moderation`
would still fail in production even with the corrected query.

---

## Part C — The one change to propose for hosted (needs approval)

**Migration:** `supabase/migrations/20260617000000_listing_moderation_listing_fk.sql`
(adds `listing_moderation.listing_id → listings(id)` FK; added on this branch by `79d41288`).

**Why hosted needs it:** hosted has the column (`listing_id uuid NOT NULL`) and the table, but its only
FK is `listing_moderation_reviewed_by_fkey`. The F4 fix queries
`listings + listing_moderation` via a PostgREST embed, which **requires** a declared FK relationship.

**Safety (verified read-only on hosted):**
- `listing_moderation` has **0 rows** and **0 orphans** → `ADD CONSTRAINT` validates instantly, cannot fail.
- Purely additive (a constraint), no data mutation, no column/type change.
- Idempotent guard recommended (apply only `IF NOT EXISTS` / check `pg_constraint` first).

**Recommendation:** **SAFE to apply to hosted, with user approval.** This is the only schema change the
dashboard fixes actually require in production.

**✅ APPLIED TO HOSTED 2026-06-17** (with user approval). A guarded, transactional
`ADD CONSTRAINT` + `CREATE INDEX IF NOT EXISTS` was run against `ynkqzzpcbpphjczmrfva` (re-verified
0 rows / 0 orphans immediately before). Hosted now carries
`listing_moderation_listing_id_fkey :: FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE`
plus `idx_listing_moderation_listing_id` — byte-for-byte identical to the local definition from migration
`20260617000000`. `/admin/moderation`'s PostgREST embed is now unblocked in production. Only this one
constraint+index was applied; no other hosted change was made.

---

## Part D — Broader drift (do NOT blind-apply; separate reconciliation)

This drift predates and is unrelated to this branch's commits. It reflects parallel feature branches
(e.g. the mobility-backfill cron and other worktrees) whose migrations reached hosted but not this
branch, and this branch's migrations that have not been pushed to hosted.

### Tables on hosted but missing locally (11) — from other branches' migrations
`agencies`, `broadband_coverage`, `business_verifications`, `kyc_verifications`, `mobility_scores`,
`ppd_sync_log`, `price_paid_data`, `price_paid_transactions`, `service_areas`, `social_links`,
`transport_stops`.
→ Their defining migrations live on other branches. **Out of scope here**; informational. Dashboard
smoke does not depend on them (the M2 suite passed against hosted without local copies).

### Tables locally but missing on hosted (3) — this branch's migrations not yet pushed
`kernel_deleted_users`, `legal_notices`, `provider_leads`.
→ Additive; would be created when the on-disk migration chain is pushed to hosted. No action now.

### Column drift on shared tables (both directions)
- **Hosted-ahead** (local lacks): `agent_profiles.*` (11 cols incl. `slug`, `specialties`, `photo_url`,
  `years_experience`), `deposit_registrations.{certificate_number, registered_at}`, `listings.created_by`,
  `profiles.{onboarding_complete, onboarding_step, profile_score, provider_details}`,
  `provider_references.{cancelled_at, last_reminded_at, reminder_count, submission_token_hash}`,
  `service_provider_details.trust_score`, `tenancies.monthly_rent`.
- **Local-ahead** (hosted lacks): `billing_events.{attempt_count, last_attempt_at, last_error, status}`,
  `deposit_registrations.{amount, landlord_id, notes, prescribed_info_sent_date, registration_date,
  scheme_reference}`, `financial_entries.{rent_period_start, rent_period_end}`,
  `maintenance_requests.{assigned_provider_id, assigned_provider_name}`, `profiles.stripe_customer_id`,
  `reviews.{verification_source_id, verification_status, verification_type, verified_at}`,
  `tenancies.tenant_user_id`.

> ⚠️ Note `deposit_registrations` is drifting in **both** directions — hosted and local define partly
> different column sets for the same table. This is the clearest sign the two migration histories have
> genuinely forked and need a deliberate baseline reconciliation, not a one-way apply.

### Enum drift
| Enum | Hosted-only values | Local-only values |
|---|---|---|
| `user_role` | `mortgage_broker` | — |
| `tenancy_status` | `expired`, `pending` | — |
| `maintenance_status` | `reported` | — |
| `document_category` | `electrical`, `tenancy_agreement` | `lease_agreement` |
| `request_status` | — | `ERROR`, `PENDING`, `SUCCESS` |

→ `document_category` looks like a value rename (`lease_agreement` ↔ `tenancy_agreement`) that landed on
only one side — a data-integrity risk worth a dedicated check. The rest is additive drift.

**Recommendation (Part D):** Do **not** blind-apply migrations either direction. Stand up a deliberate
migration-baseline reconciliation (e.g. `supabase db diff` against a fresh shadow DB, then author a
single squashed baseline both environments adopt). Treat the `document_category` rename as a flagged
data-integrity item. This is its own task, separate from the dashboard effort.

---

## Part E — Local-only fixes required for Task 2 (not hosted changes)

Two pieces of **function/enum drift** broke the all-role seed against a fresh local `db reset`. In both
cases hosted is already correct (fixed out-of-band) but no committed migration captured the fix, so the
on-disk schema lagged. Both fixes are authored as forward migrations that are **no-ops against hosted**.

### E1 — `user_role` enum missing `mortgage_broker`
The local `user_role` enum (from `001_foundation.sql`) has only 6 values; **hosted has 7** (adds
`mortgage_broker`). The seed assigns a `mortgage_broker` user, written into `user_roles.role` and
`profiles.active_role` (both `user_role`-typed). Against the local baseline this **fails the enum cast**.

**Fix:** `supabase/migrations/20260617000001_user_role_add_mortgage_broker.sql` —
`ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'mortgage_broker';`. No-op on hosted.

### E2 — `assign_role_atomic` missing the `text → user_role` cast
The on-disk `assign_role_atomic` (`20260318_atomic_role_assignment.sql`) inserts/updates the **text**
parameter `p_role` directly into the `user_role`-typed columns with **no cast**, raising
`column "role" is of type user_role but expression is of type text` (SQLSTATE 42804) for **every**
non-admin role on a fresh DB. **Hosted's function already casts `p_role::user_role`** (verified via
`pg_get_functiondef`) — its body was fixed out-of-band; the on-disk migration never was. (Note: hosted's
body also dropped the `valid_roles` validation block; the fix below keeps that block.)

**Fix:** `supabase/migrations/20260617000002_fix_assign_role_atomic_enum_cast.sql` — a
`CREATE OR REPLACE` that keeps the validation block and adds `p_role::user_role` casts. Idempotent;
behaviourally equivalent to hosted for the cast. ⚠️ If this migration is ever pushed to hosted it would
also *add* the `valid_roles` validation back to hosted's function (hosted currently has none) — a safe
hardening, but call it out before any hosted push.

---

## Action summary

| Action | Target | Risk | Status |
|---|---|---|---|
| Keep `251d34dd` edits as-is | — | none | ✅ no hosted change needed |
| Keep F2/F3/F5/F6 query fixes | — | none | ✅ correct vs hosted |
| Apply `listing_moderation→listings` FK | **hosted** | low (0 rows/0 orphans) | ✅ **applied to hosted 2026-06-17 (user-approved)** |
| Add `mortgage_broker` to `user_role` enum (E1) | local on-disk migration | none (no-op on hosted) | ✅ Task 2 |
| Cast `p_role::user_role` in `assign_role_atomic` (E2) | local on-disk migration | none (no-op on hosted) | ✅ Task 2 |
| Full migration-baseline reconciliation of broader drift | both | medium | 📋 separate task — do not blind-apply |
