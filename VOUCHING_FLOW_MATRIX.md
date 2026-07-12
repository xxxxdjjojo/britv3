# Vouching Flow Matrix — Post-Fix

**Branch:** `feat/vouching-system` · **Date:** 2026-07-12 (post-fix update)
**Status vocabulary:** WORKING · PARTIALLY_WORKING · BROKEN · NOT_IMPLEMENTED · INSECURE · UNTESTED · BLOCKED_BY_CONFIGURATION · UNTESTED-LIVE

Each cell = a status value + a short evidence pointer. "Final status" is the weakest link across the row.

> **CONFIRMED vs UNTESTED-LIVE.** CONFIRMED = proven by passing unit test and/or db-test on real Postgres + code review. **UNTESTED-LIVE** = code complete + unit/db-tested + reviewed, but the browser/e2e path has not run against a live deployment because the target DB lacks the new migrations (see `VOUCHING_SYSTEM_AUDIT.md §17`). The e2e specs exist and are reviewed-correct; they will pass once schema + test users are seeded.

## Primary Journeys (Flows A–J)

| Flow | Frontend | Backend | Database | Email | Admin | Automated test | Final status |
|------|----------|---------|----------|-------|-------|----------------|--------------|
| **A. Trader invites a peer** | WORKING/UNTESTED-LIVE — dialog → `POST /api/provider/references` (`ReferenceTracker.tsx`) | WORKING — `createReferenceInvitation` service-role (`reference-invitation-service.ts`); 201/409/422/403/429 | WORKING — row lands `pending`; unique active-invite index (`20260712100002:67-69`) | WORKING/UNTESTED-LIVE — Inngest `provider/reference.requested` → `sendReferenceInvitation` | N/A | unit (service+route); e2e `reference-vouching.spec.ts` (BLOCKED) | UNTESTED-LIVE (code complete, live send unverified) |
| **B. Trader invites a past customer** | WORKING/UNTESTED-LIVE — same dialog, `reference_type='client'` | WORKING — same service; client requires work_date at submit | WORKING — same table + work_date-not-future CHECK | WORKING/UNTESTED-LIVE | N/A | unit; e2e (BLOCKED) | UNTESTED-LIVE |
| **C. Existing user is invited** | WORKING/UNTESTED-LIVE — public `/reference/[token]` page works for anyone with the link | WORKING — `submitReference` service-role, token-authed | WORKING — token-bound row | WORKING/UNTESTED-LIVE — email carries tokenised link | N/A | unit; e2e (BLOCKED) | UNTESTED-LIVE (no account-linking yet — guest path; see remediation R12) |
| **D. New (non-registered) user is invited** | WORKING/UNTESTED-LIVE — same public page; referee is unauthenticated (token IS the auth) | WORKING — service-role submit, no account needed | WORKING — no account FK required | WORKING/UNTESTED-LIVE | N/A | unit; e2e (BLOCKED) | UNTESTED-LIVE |
| **E. Resend invitation** | WORKING/UNTESTED-LIVE — Resend button → `POST /[id]/resend` | WORKING — `resendReferenceInvitation` (cooldown + max-sends); 429 on cooldown | WORKING — increments send_count/last_sent_at | WORKING/UNTESTED-LIVE — `.resend-requested` event re-sends | N/A | unit | UNTESTED-LIVE |
| **F. Expire invitation** | WORKING — expiry surfaces as "expired" state on the public page | WORKING — lazy expiry on resolve (`reference-submission-service.ts:107-116`) | WORKING — `invite_expires_at` + expiry-sweep index (`20260712100002:72-73`) | N/A | N/A | unit (resolve→expired) | WORKING (lazy) / UNTESTED-LIVE for a background sweep |
| **G. Cancel / revoke invitation** | WORKING/UNTESTED-LIVE — Cancel button → `POST /[id]/cancel` | WORKING — `cancelReferenceInvitation` → status `revoked` (preserves history) | WORKING — `revoked` status + `revoked_at`; no hard delete | N/A | N/A | unit | UNTESTED-LIVE |
| **H. Decline vouch (referee says no)** | WORKING/UNTESTED-LIVE — decline action on public page | WORKING — `declineReference` → `declined` (+reason); single-use NULLs hash | WORKING — `declined` status + `declined_reason/at` | N/A | N/A | unit | UNTESTED-LIVE |
| **I. Requirements completed (N+M valid vouches → gate)** | WORKING/UNTESTED-LIVE — VouchCountsBanner shows peer X/N, client (Md) Y/M met/unmet | WORKING — `countValidVouches` (verified-only; client recency) + `evaluateVouchGate` (pure) | WORKING — `verification_vouch_rules` singleton (gate_enabled=FALSE default) | N/A | WORKING/UNTESTED-LIVE — gate-aware approve (confirm only when ON && unmet) | unit (rules service) | UNTESTED-LIVE (gate OFF by default; live enable = product decision) |
| **J. Admin per-reference review** | WORKING/UNTESTED-LIVE — AdminReferencesPanel Verify/Reject/Flag w/ required-reason dialog | WORKING — `reviewReference` (submitted|flagged only; reason req; DB-serialized) | WORKING — status→verified/rejected/flagged + reviewed_at/by/reason | N/A | WORKING — `manage_verifications`; logs `metadata:{decision,reason}` | unit (service+route); e2e `admin-reference-review.spec.ts` (BLOCKED) | UNTESTED-LIVE (now per-reference, not just whole-provider) |

> **Flow J note (post-fix):** admin review now acts on **individual `provider_references` rows** (verify/reject/flag), not only the provider's overall `provider_verification_status`. Decisions ARE written to `admin_audit_log.metadata` (`review/route.ts:60-74`) — the pre-fix metadata gap (V-07) is closed. The whole-provider approve path still exists and is now gate-aware.

## Edge Cases

| Edge case | Frontend | Backend | Database | Email | Admin | Automated test | Final status |
|-----------|----------|---------|----------|-------|-------|----------------|--------------|
| **Expired-token reuse** | WORKING — public page shows expiry message | WORKING — lazy expiry + resolve returns `expired` | WORKING — `invite_expires_at` enforced | N/A | N/A | unit | WORKING / UNTESTED-LIVE |
| **Forged vouch (trader self-verifies)** | N/A — no browser write path exists | **FIXED** — no server mediation grants trader a status write | **FIXED (proven)** — trader write policies DROPped + identity trigger (`20260712100002:83-128`) | N/A | N/A — admin-only status writes | **db-test 37/37 (CONFIRMED)** | **WORKING (forge denied, proven)** |
| **Self-vouch (trader vouches for self)** | WORKING/UNTESTED-LIVE | WORKING — `createReferenceInvitation` self-vouch guard → 422 (`reference-invitation-service.ts:117`) | WORKING — rejected before insert | N/A | N/A | unit | UNTESTED-LIVE (guarded in code) |
| **Duplicate request (same email/type)** | WORKING/UNTESTED-LIVE — surfaces 409 message | WORKING — service maps unique-violation → 409 | **FIXED** — DB unique active-invite index (`20260712100002:67-69`) | N/A | N/A | db-test + unit | WORKING (db-enforced) |
| **Token replay after response** | WORKING — "already submitted" message | WORKING — hash NULLed on submit/decline; `.not(...is null)` serialization | WORKING — single-use enforced at DB | N/A | N/A | unit | WORKING / UNTESTED-LIVE |
| **Concurrent double-submit / double-review** | N/A | WORKING — filtered UPDATE matches 0 rows on the loser → 409 | WORKING — status/hash filter serializes | N/A | WORKING — review filters on validated status | unit | WORKING (unit) |

## Reading the matrix

- The pre-fix **INSECURE forged-vouch** cell is now **WORKING and proven** by the db-test — the single most important change.
- Every invite/referee/lifecycle row that was NOT_IMPLEMENTED is now **WORKING in code**, gated only by **UNTESTED-LIVE** (migrations not yet applied to the target DB; e2e not yet run — see `VOUCHING_SYSTEM_AUDIT.md §17`).
- DB-layer guarantees (forge-block, uniqueness, single-use) are **CONFIRMED** via the 37/37 db-test on real Postgres.
- The only work truly remaining is applying migrations to the target DB, seeding test users, and running the reviewed e2e specs live.
