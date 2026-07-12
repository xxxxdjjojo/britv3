# Vouching Flow Matrix — Current State (Pre-Fix)

**Branch:** `feat/vouching-system` · **Date:** 2026-07-12
**Status vocabulary:** WORKING · PARTIALLY_WORKING · BROKEN · NOT_IMPLEMENTED · INSECURE · UNTESTED · BLOCKED_BY_CONFIGURATION

Each cell = a status value + a short evidence pointer. "Final status" is the weakest link across the row (a flow is only as functional as its most-broken stage).

## Primary Journeys (Flows A–J)

| Flow | Frontend | Backend | Database | Email | Admin | Automated test | Final status |
|------|----------|---------|----------|-------|-------|----------------|--------------|
| **A. Trader invites a peer (trader)** | PARTIALLY_WORKING — dialog inserts row (`ReferenceTracker.tsx:80-119`) | PARTIALLY_WORKING — `sendReferenceRequest` inserts `pending` (`provider-verification-service.ts:327-337`) | WORKING — row lands in `provider_references` (`20260316100001:126-139`) | NOT_IMPLEMENTED — TODO only (`:341`) | N/A | WORKING (insert path) `provider-verification-service.test.ts` | PARTIALLY_WORKING (invite recorded, referee never contacted) |
| **B. Trader invites a past customer** | PARTIALLY_WORKING — same dialog, `reference_type='client'` (`ReferenceTracker.tsx:85-92`) | PARTIALLY_WORKING — same service, `client` type | WORKING — same table | NOT_IMPLEMENTED | N/A | WORKING (unit) | PARTIALLY_WORKING |
| **C. Existing user is invited** | NOT_IMPLEMENTED — no referee surface (no `src/app/reference/**`) | NOT_IMPLEMENTED — no submission route | NOT_IMPLEMENTED — no account-linking columns | NOT_IMPLEMENTED | N/A | NOT_IMPLEMENTED | NOT_IMPLEMENTED |
| **D. New (non-registered) user is invited** | NOT_IMPLEMENTED — no public vouch page | NOT_IMPLEMENTED | NOT_IMPLEMENTED — no token binding | NOT_IMPLEMENTED | N/A | NOT_IMPLEMENTED | NOT_IMPLEMENTED |
| **E. Resend invitation** | BROKEN — "Send Request" button has no handler (`ReferenceTracker.tsx:174-182`) | NOT_IMPLEMENTED | NOT_IMPLEMENTED | NOT_IMPLEMENTED | N/A | NOT_IMPLEMENTED | BROKEN |
| **F. Expire invitation** | NOT_IMPLEMENTED | NOT_IMPLEMENTED | NOT_IMPLEMENTED — no `expires_at` col (`:126-139`) | NOT_IMPLEMENTED | NOT_IMPLEMENTED | NOT_IMPLEMENTED | NOT_IMPLEMENTED |
| **G. Cancel / revoke invitation** | PARTIALLY_WORKING — trader can DELETE row via RLS but no UI button | PARTIALLY_WORKING — `provider_references_delete_own` (`:177-183`) | PARTIALLY_WORKING — hard delete only, no `cancelled`/`revoked` state | NOT_IMPLEMENTED | NOT_IMPLEMENTED | UNTESTED | PARTIALLY_WORKING |
| **H. Decline vouch (referee says no)** | NOT_IMPLEMENTED | NOT_IMPLEMENTED | NOT_IMPLEMENTED — enum has no `declined` (`:25`) | NOT_IMPLEMENTED | NOT_IMPLEMENTED | NOT_IMPLEMENTED | NOT_IMPLEMENTED |
| **I. Requirements completed (3+3 vouches → gate)** | PARTIALLY_WORKING — "X/3 submitted" UI (`ReferenceTracker.tsx:74-138`) but references are OPTIONAL | NOT_IMPLEMENTED — no count-gate; `required:false` (`provider-verification-service.ts:57,65`) | N/A — no rules storage | N/A | PARTIALLY_WORKING — admin sets `verified` directly, unrelated to counts (`verification-service.ts:57-59`) | UNTESTED | NOT_IMPLEMENTED (no enforced requirement) |
| **J. Admin review** | WORKING — queue + approve/reject (`VerificationQueueClient.tsx`) | WORKING — `reviewVerification` (`verification-service.ts:47-91`) | WORKING — updates `profiles.provider_verification_status` | WORKING — `sendVerificationOutcome` (`:77-84`) | WORKING — permission `manage_verifications` (`route.ts:29`) | WORKING (component) `VerificationQueueClient.test.tsx`; e2e page-load only (`admin-scenario-06...:15-38`) | WORKING (but operates on whole provider, **not** per-reference — see note) |

> **Flow J note:** admin review acts on the provider's *overall* `provider_verification_status`, never on an individual `provider_references` row. There is no per-reference admin approve/reject/flag. Review notes are not persisted (`verification-service.ts:53-59`), and the decision is not written to `admin_audit_log.metadata` (`audited-admin-action.ts:98-107`).

## Edge Cases

| Edge case | Frontend | Backend | Database | Email | Admin | Automated test | Final status |
|-----------|----------|---------|----------|-------|-------|----------------|--------------|
| **Expired-token reuse** | NOT_IMPLEMENTED — no tokens exist | NOT_IMPLEMENTED | NOT_IMPLEMENTED — no token/expiry cols (`:126-139`) | N/A | N/A | NOT_IMPLEMENTED | NOT_IMPLEMENTED |
| **Forged vouch (trader self-verifies)** | INSECURE — trader UI + browser client | INSECURE — no server mediation; client UPDATE allowed | INSECURE — `provider_references_update_own` permits status→`verified` + fake `reference_text` (`:164-175`) | N/A | NOT_IMPLEMENTED — no per-reference check to catch it | UNTESTED — no RLS guard (`grep db-tests`: none) | INSECURE |
| **Self-vouch (trader vouches for self)** | PARTIALLY_WORKING — no check on referee_email vs own email (`ReferenceTracker.tsx`) | PARTIALLY_WORKING — `sendReferenceRequest` has no self-email guard (`provider-verification-service.ts:276-344`) | PARTIALLY_WORKING — no constraint | NOT_IMPLEMENTED | NOT_IMPLEMENTED | UNTESTED | PARTIALLY_WORKING (nothing prevents it) |
| **Duplicate request (same email)** | PARTIALLY_WORKING — surfaces service error string (`ReferenceTracker.tsx:94-96`) | PARTIALLY_WORKING — app-level `maybeSingle` dedup (`provider-verification-service.ts:315-324`) | PARTIALLY_WORKING — no unique index (`:141-144`), race-prone | N/A | N/A | WORKING (unit covers dup) `provider-verification-service.test.ts` | PARTIALLY_WORKING |

## Reading the matrix

- **PARTIALLY_WORKING** dominates the invite rows because the request is recorded but nothing reaches the referee and nothing can be submitted back.
- **NOT_IMPLEMENTED** dominates every referee-side and lifecycle (expire/decline/resend) row.
- The **INSECURE** forged-vouch edge case is the highest-priority fix (finding V-01 in `VOUCHING_SYSTEM_AUDIT.md`).
- Only **Flow J (admin review of overall status)** is genuinely end-to-end WORKING, and even it does not touch individual vouches.
