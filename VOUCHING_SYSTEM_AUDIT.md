# Vouching System — Current-State Audit (Pre-Fix)

**Branch:** `feat/vouching-system` (off `origin/main`)
**Date:** 2026-07-12
**Scope:** The "vouching" system = the **provider references** feature — traders/professionals invite peers and past customers to vouch for them; admins review provider verification; references feed into the Verified badge.
**Status vocabulary:** WORKING · PARTIALLY_WORKING · BROKEN · NOT_IMPLEMENTED · INSECURE · UNTESTED · BLOCKED_BY_CONFIGURATION

> This is a **reality audit of the code on this branch**. Every conclusion is anchored to a real file:line, table, policy, function, or test path that was opened during the audit. Sections marked **RECOMMENDED / TARGET** describe the intended product model (per brief) and are clearly separated from what the code enforces today.

---

## 1. Executive Summary

The platform advertises a rich "vouching" workflow (traders invite 3 peers + 3 recent customers who submit vouches that feed verification). **Only the request half of one reference-request feature exists, and it is insecure.**

What exists: a `provider_references` table, a client-side service (`sendReferenceRequest`) that inserts a `pending` row, a trader-facing UI (`ReferenceTracker`) to add referees, and an admin queue that approves/rejects a provider's **overall** verification status (not individual references).

What does not exist: any way for a referee to actually submit a vouch. There is **no invitation token, no expiry, no referee-facing route, no email delivery, no per-reference admin review, and no vouch-count gating.** The statuses `submitted` and `verified` on a reference are therefore **unreachable through the product** — the only way to set them is the trader forging their own row.

The single most serious finding: **RLS lets a trader UPDATE their own `provider_references` rows, including `status` and `reference_text`.** A trader can set `status = 'verified'` and write fabricated praise directly from the browser Supabase client. This makes every "verified reference" untrustworthy.

## 2. Overall Readiness Score: **18 / 100**

Rationale: The data model and one request path exist and are unit-tested (10/10 green), which earns some credit. But the feature is non-functional end-to-end (referees literally cannot vouch), the trust guarantee is actively broken by an INSECURE RLS policy that permits self-forged verified vouches, and the entire submission/email/tokenisation/per-reference-review/gating half is NOT_IMPLEMENTED. A system whose core trust claim can be forged from the browser and whose primary user journey has no endpoint cannot be considered launch-ready.

## 3. System Architecture Map

```
Trader (browser, authed)
  └─ ReferenceTracker.tsx ──(createClient browser client)──► sendReferenceRequest()
        └─ INSERT provider_references (status='pending')      [relies on _insert_own RLS]
        └─ TODO: Inngest 'provider/reference.requested'  ← NOT wired (no email sent)

Referee (invited person)
  └─ (NO ROUTE)  ──►  cannot submit a vouch anywhere        [NOT_IMPLEMENTED]

Verification progress
  └─ VerificationStepper.tsx / getVerificationSteps()
        └─ reads provider_documents + provider_references
        └─ references are OPTIONAL steps; do not gate 'verified'

Admin (authed, permission manage_verifications)
  └─ /admin/verifications  ──► VerificationQueueClient.tsx
        └─ POST /api/admin/verifications/review
             └─ auditedAdminActionWithPermission → reviewVerification()
                  └─ UPDATE profiles.provider_verification_status  ('verified'|'rejected')
        └─ operates on the WHOLE provider, never on individual references

Public
  └─ ProviderSearchCard.tsx  isVerified = provider_verification_status === 'verified' → ShieldCheck
  └─ anon RLS "Anon can view verified provider details" gates visibility

proxy.ts
  └─ gates /dashboard/provider on provider_verification_status === 'verified' (exempts verification/billing/referrals/open pages)
```

## 4. Current State-Machine Map (what code enforces)

- **Reference status** enum `provider_reference_status` = `pending | submitted | verified` (`supabase/migrations/20260316100001_provider_dashboard_tables.sql:25`). Default `pending` (`:134`).
  - `pending` is the ONLY status set by any application code path (`sendReferenceRequest` inserts `status:'pending'`, `provider-verification-service.ts:334`).
  - `submitted` / `verified` have **no legitimate writer** — no referee route, no admin per-reference action. Reachable only via the INSECURE trader UPDATE (RLS `provider_references_update_own`) or via seed data.
- **Provider verification status** enum `provider_verification_status` = `unverified | pending_review | verified | suspended | rejected` (`supabase/migrations/002_marketplace.sql:54-60`). Admin flips `pending_review → verified|rejected` (`verification-service.ts:57-59`). No transition guards.

Full diagrams and the recommended richer model live in `VOUCHING_STATE_MACHINE.md`.

## 5. Frontend Audit

| Item | Status | Evidence |
|---|---|---|
| `ReferenceTracker` add-reference dialog inserts a row | PARTIALLY_WORKING | `src/components/dashboard/provider/ReferenceTracker.tsx:80-119` calls `sendReferenceRequest` with the **browser** client |
| "Send Request" button (on a pending row) | BROKEN | `ReferenceTracker.tsx:174-182` — `<button>` with no `onClick`; purely decorative |
| "Remind" button (on a submitted row) | BROKEN | `ReferenceTracker.tsx:185-191` — no `onClick`; decorative |
| "View" reference text dialog | WORKING | `ReferenceTracker.tsx:192-201, 288-306` shows `reference_text` (which is currently only ever seed data) |
| Progress "X / 3 submitted" | WORKING | `ReferenceTracker.tsx:74-138` counts `submitted`+`verified` |
| Peer/client reference pages | PARTIALLY_WORKING | `src/app/(protected)/dashboard/provider/verification/peer-references/page.tsx`, `.../client-references/page.tsx` |
| Provider-id derivation latent bug | PARTIALLY_WORKING | both pages `.select("id")` from `service_provider_details` (PK is `user_id`, no `id` col — see `002_marketplace.sql:99-100`) → `providerProfile?.id` is `undefined` → falls back to `user.id`, which happens to be the correct FK key. Works by accident; brittle. |
| VerificationStepper progress | WORKING | `src/components/dashboard/provider/VerificationStepper.tsx` |

## 6. Backend Audit

| Item | Status | Evidence |
|---|---|---|
| `sendReferenceRequest` inserts `pending`, validates email, dedups by email | WORKING (as far as it goes) | `provider-verification-service.ts:276-344` (zod email `:304`, dup check `:315-324`, insert `:327-337`) |
| Email/Inngest trigger on request | NOT_IMPLEMENTED | `provider-verification-service.ts:341` `// TODO: trigger Inngest event 'provider/reference.requested' once Inngest is wired up`; no `provider/reference` in `src/app/api/inngest/route.ts` (grep: none) |
| Referee submission endpoint | NOT_IMPLEMENTED | no `src/app/reference/**` (ls: does not exist); grep of `src/app` for a submission route: none |
| Reference invocation via **server** action (privileged) | NOT_IMPLEMENTED | the only caller is client-side (`ReferenceTracker.tsx:84`); insert relies on `_insert_own` RLS, not a service-role server route |
| `getProviderReferences` / `getVerificationSteps` | WORKING | `provider-verification-service.ts:132-260`; references marked **optional** (`VERIFICATION_STEPS[3-4].required = false`, `:57,:65`) |
| Decline / cancel / resend / expire flows | NOT_IMPLEMENTED | no code paths; enum has no such states |

## 7. Database Audit

| Item | Status | Evidence |
|---|---|---|
| `provider_references` table | WORKING (schema) | `20260316100001_provider_dashboard_tables.sql:126-139` |
| Columns present | — | id, provider_id (FK → `service_provider_details(user_id)` ON DELETE CASCADE), reference_type, referee_name, referee_email, referee_phone, relationship, status, reference_text, requested_at, submitted_at, verified_at (`:126-139`) |
| Invitation token / single-use / expiry columns | NOT_IMPLEMENTED | no token/expiry/nonce columns in the table def (`:126-139`) |
| Uniqueness on (provider, email, type) | NOT_IMPLEMENTED | only two indexes exist: `idx_provider_references_provider_id`, `idx_provider_references_status` (`:141-144`); dedup is app-level only (`provider-verification-service.ts:315-324`) — race-prone |
| Reviewer / audit / notes columns on the reference | NOT_IMPLEMENTED | none in table def |
| Reference status enum | WORKING | `provider_reference_status = pending|submitted|verified` (`:25`) — no decline/revoke/flag |
| Seed rows exist | INFORMATIONAL | `supabase/seed/03_provider_data.sql:419-` inserts 3 references (2 `verified`, 1 `submitted`, 0 `pending`) — the seed contains no `pending` rows at all, so it is the only source of non-`pending` statuses in a fresh DB (the other being the insecure trader UPDATE); `submitted`/`verified` are never reachable through a real referee flow |

## 8. Auth & Permissions Audit

| Item | Status | Evidence |
|---|---|---|
| SELECT own references | WORKING | policy `provider_references_select_own` USING `provider_id = (SELECT user_id FROM service_provider_details WHERE user_id = auth.uid())` (`20260316100001_...:148-154`) |
| INSERT own references | WORKING (by design) | `provider_references_insert_own` (`:156-162`) |
| **UPDATE own references (incl. status/reference_text/verified_at)** | **INSECURE** | `provider_references_update_own` (`:164-175`) — trader can self-set `status='verified'` and fabricate `reference_text` from the browser client. No column-level restriction; no reviewer gate. |
| DELETE own references | WORKING (by design) | `provider_references_delete_own` (`:177-183`) |
| Referee (invited) access | NOT_IMPLEMENTED | no anon/token policy for a referee to write a vouch |
| proxy provider gate | WORKING | `src/proxy.ts:425-426` compares `provider_verification_status === "verified"` (correct enum value — **not** the "approved" bug seen on other branches) |
| Admin permission for review | WORKING | `manage_verifications` held by super_admin, moderation_admin, ops_admin (`src/lib/admin-permissions.ts:37,46,53`); route enforces it (`api/admin/verifications/review/route.ts:29`) |

Full role grid in `VOUCHING_RBAC_MATRIX.md`.

## 9. Admin Audit

| Item | Status | Evidence |
|---|---|---|
| Verification queue lists `pending_review` providers | WORKING | `src/services/admin/verification-service.ts:13-45` (`getVerificationQueue`) |
| Approve/reject flips provider status | WORKING | `reviewVerification` (`verification-service.ts:47-91`); `approved→verified`, `rejected→rejected` (`:57-59`) |
| Review **notes** persisted | NOT_IMPLEMENTED | `verification-service.ts:53-59` — profiles has no notes column; `notes` is only forwarded to the outcome email, never stored |
| Per-reference approve/reject/flag | NOT_IMPLEMENTED | `VerificationQueueClient.tsx` only POSTs `{userId, decision, notes}` (`:18,:27`); no reference id anywhere |
| Audit log records the decision/notes | PARTIALLY_WORKING | route wraps in `auditedAdminActionWithPermission` (`route.ts:23-40`) which logs action/target/success but **omits `metadata`** (`src/lib/audited-admin-action.ts:98-107` — no `metadata` passed), so decision & notes are not captured in `admin_audit_log.metadata` |
| Admin email on outcome | WORKING | `verification-service.ts:69-88` best-effort `sendVerificationOutcome` |

## 10. Security Audit

- **CRITICAL — Self-forged verified vouches.** `provider_references_update_own` (`20260316100001_...:164-175`) allows a trader to UPDATE `status` to `verified` and write arbitrary `reference_text` on their own rows. Combined with `ProviderSearchCard`'s trust badge and the "3 submitted" progress UI, this lets a trader manufacture social proof. Status: **INSECURE**.
- **HIGH — No provenance on a reference.** Because there is no token or referee identity binding and no server-mediated submission, even a legitimately `submitted` reference cannot be distinguished from a forged one. Status: **INSECURE / NOT_IMPLEMENTED**.
- **MEDIUM — App-level dedup is race-prone.** No DB uniqueness on (provider, email, type) (`:141-144`); two concurrent inserts can both pass the `maybeSingle` check (`provider-verification-service.ts:315-324`).
- **LOW — Latent provider-id bug.** `.select("id")` on a table keyed by `user_id` (pages §5) silently degrades to `user.id`; a future schema change adding an `id` column would break the queries.
- **INFORMATIONAL — Audit metadata gap.** Verification review decisions are not fully attributable in `admin_audit_log` (see §9).

## 11. Email & Notification Audit

| Item | Status | Evidence |
|---|---|---|
| Reference-request email to referee | NOT_IMPLEMENTED | no template in `src/emails/` matching referen*/vouch* (ls: none); TODO left in service (`provider-verification-service.ts:341`) |
| Reminder ("Remind" button) email | NOT_IMPLEMENTED | button is decorative (`ReferenceTracker.tsx:185-191`) |
| Inngest function for reference lifecycle | NOT_IMPLEMENTED | none in `src/inngest/functions/` (ls list has no reference file); not registered in `src/app/api/inngest/route.ts` (grep: none) |
| Verification-outcome email (provider) | WORKING | `sendVerificationOutcome` invoked in `reviewVerification` (`verification-service.ts:77-84`) |

## 12. Test Coverage Audit

| Test | Status | Evidence |
|---|---|---|
| `sendReferenceRequest` / `getVerificationSteps` / `updateBadgeStatus` unit | WORKING (10/10 green) | `src/services/provider/__tests__/provider-verification-service.test.ts` — ran: 1 file, 10 tests passed |
| Admin verification queue component | WORKING | `src/__tests__/m3/admin/VerificationQueueClient.test.tsx` (exists) |
| RLS contract test for `provider_references` (forge-guard) | NOT_IMPLEMENTED / UNTESTED | grep of `db-tests/` for `provider_references`: none — the INSECURE UPDATE policy is unguarded by any test |
| e2e for referee submission / vouch flow | NOT_IMPLEMENTED | no such spec; `e2e/admin-scenario-06-verification-reviews.spec.ts` only checks the admin queue page loads (`:15-38`), not per-reference vouching |
| db-tests harness | BLOCKED_BY_CONFIGURATION (locally) | `db-tests/harness.ts` spins a Docker Postgres (`:71-96`); requires Docker + `RUN_DB_TESTS=1` + `vitest.db.config.ts`; not run in this audit (Docker not exercised) |

## 13. Production-Readiness Assessment

**NOT READY.** Blocking reasons: (1) the trust guarantee is forgeable (INSECURE RLS); (2) the primary journey has no endpoint — a referee cannot vouch (NOT_IMPLEMENTED); (3) no email delivery means even the request half is invisible to referees; (4) no per-reference review or count-gating means references are decorative. The admin overall-verification path and the public badge work, but they rest on data that cannot be trusted.

## 14. Commands Executed

| Command | Result |
|---|---|
| `git rev-parse --abbrev-ref HEAD` | `feat/vouching-system` |
| `git grep -n "provider_references" -- src supabase` | table in one migration, service in `provider-verification-service.ts`, type mirror, seed rows — see §5–§7 |
| `ls src/app/reference` | **does not exist** (confirms no referee route) |
| `git grep -n "provider/reference" src/inngest src/app/api/inngest` | **no matches** (no Inngest event) |
| `ls src/emails/ \| grep -i "referen\|vouch"` | **no match** (no email template) |
| `ls src/inngest/functions/` | no reference/vouch function present |
| `grep -rln "provider_references" db-tests/` | **no matches** (no RLS/db test) |
| `pnpm exec vitest run src/services/provider/__tests__/provider-verification-service.test.ts` | **1 file, 10 tests passed** (2.25s) |

## 15. Tests Passed

- `provider-verification-service.test.ts` — **10 passed / 0 failed**.

## 16. Tests Failed

- None run failed. (The relevant *gaps* are untested surfaces, not failing tests — see §12.)

## 17. Configuration Blockers

- **db-tests (RLS contract) — BLOCKED_BY_CONFIGURATION:** require Docker daemon + `RUN_DB_TESTS=1` + `vitest.db.config.ts`; not executed here.
- **Email — BLOCKED_BY_CONFIGURATION (and NOT_IMPLEMENTED):** `RESEND_API_KEY` would be needed once a template/Inngest function exists; neither exists yet.
- **Inngest — NOT_IMPLEMENTED:** `INNGEST_SIGNING_KEY` present in env contract, but no reference function registered.

## 18. Prioritised Findings

| ID | Area | Finding | Status | Severity | Evidence | User impact | Recommended fix |
|----|------|---------|--------|----------|----------|-------------|-----------------|
| V-01 | Database / Auth | Trader can UPDATE own `provider_references` status→`verified` and fabricate `reference_text` from the browser | INSECURE | CRITICAL | `supabase/migrations/20260316100001_provider_dashboard_tables.sql:164-175` | Fake "verified" vouches manufacture trust; badge/progress become meaningless | Drop/replace `provider_references_update_own`; make status/text writable only by a service-role server route mediating referee submission + admin review |
| V-02 | Backend / Product | No referee-facing route or submission endpoint — `submitted`/`verified` statuses are unreachable through the product | NOT_IMPLEMENTED | HIGH | no `src/app/reference/**` (ls); grep of `src/app`: none | The core "someone vouches for you" journey does not function | Build tokenised `/reference/[token]` submission surface + server route that sets `submitted` |
| V-03 | Email | Reference-request email never sent; referee is never notified | NOT_IMPLEMENTED | HIGH | `provider-verification-service.ts:341` TODO; no template in `src/emails/`; no Inngest fn | Referees never learn they were asked to vouch | Add React Email template + Inngest `provider/reference.requested` function |
| V-04 | Database | No invitation token / expiry / single-use | NOT_IMPLEMENTED | HIGH | table def `:126-139` has no token/expiry | No secure, expiring, single-use link possible | Add `invite_token`, `token_expires_at`, `consumed_at` columns |
| V-05 | Admin | No per-reference admin review; admin only flips whole-provider status | NOT_IMPLEMENTED | MEDIUM | `VerificationQueueClient.tsx:18,27` posts only `{userId, decision}` | Admin cannot validate/flag individual vouches | Add per-reference approve/reject/flag actions + reviewer columns |
| V-06 | Product | Vouch counts not enforced; references are optional and do not gate `verified` | NOT_IMPLEMENTED | MEDIUM | `provider-verification-service.ts:57,65` (`required:false`); admin sets `verified` directly | Advertised "3 peer + 3 customer" requirement is unmet | Add configurable count-gate (default OFF) |
| V-07 | Admin / Audit | Verification review decision & notes not stored (no notes column; audit metadata omitted) | PARTIALLY_WORKING | MEDIUM | `verification-service.ts:53-59`; `audited-admin-action.ts:98-107` (no `metadata`) | Review decisions not fully attributable/reconstructable | Persist decision+notes to a review table and pass `metadata` to `logAdminAction` |
| V-08 | Database | No DB uniqueness on (provider, email, type); dedup is race-prone app-level check | PARTIALLY_WORKING | MEDIUM | indexes `:141-144`; check `provider-verification-service.ts:315-324` | Duplicate vouch requests possible under concurrency | Add unique index; keep app-level friendly error |
| V-09 | Frontend | "Send Request" and "Remind" buttons are decorative (no handlers) | BROKEN | LOW | `ReferenceTracker.tsx:174-191` | Trader clicks do nothing; misleading | Wire to resend endpoint (post V-03) or remove until then |
| V-10 | Frontend | Provider-id derivation `.select("id")` on a `user_id`-keyed table works only by fallback accident | PARTIALLY_WORKING | LOW | pages §5; PK `002_marketplace.sql:99-100` | Latent breakage if an `id` column is later added | Select `user_id` and use it directly |
| V-11 | Test | INSECURE UPDATE policy and the whole vouch flow are untested | UNTESTED | MEDIUM | `grep db-tests provider_references`: none; no referee e2e | Regressions/security holes go undetected | Add RLS forge-guard db-test + e2e vouch spec |

---

*Companion documents:* `VOUCHING_FLOW_MATRIX.md`, `VOUCHING_STATE_MACHINE.md`, `VOUCHING_RBAC_MATRIX.md`, `VOUCHING_TEST_PLAN.md`, `VOUCHING_REMEDIATION_PLAN.md`.
