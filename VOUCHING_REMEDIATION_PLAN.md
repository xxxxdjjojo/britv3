# Vouching Remediation Plan

**Branch:** `feat/vouching-system` · **Date:** 2026-07-12

Derived from the findings in `VOUCHING_SYSTEM_AUDIT.md` (findings V-01…V-11). Complexity: **S** (< ½ day) · **M** (~1 day) · **L** (2–3 days) · **XL** (> 3 days). Owner type: **DB**, **Backend**, **Frontend**, **Admin**, **Email/Jobs**, **Product**, **QA**.

The planned build-out (tokens, email, referee submission surface, decline/expire/cancel/resend, per-reference admin review, configurable rules gate default-OFF) is sequenced below. **This document does not implement anything — it plans the fix.**

---

## 1. Immediate Critical Fixes

### R1 — Fix the INSECURE `provider_references` RLS (self-forged verified vouches) 🔴 #1
- **Priority:** P0 (blocks trust; ship before any launch)
- **Owner:** DB + Backend
- **Complexity:** M
- **Dependencies:** none (can land standalone; must precede any UI that surfaces `verified`)
- **Files/systems:** new migration replacing `provider_references_update_own` (`supabase/migrations/20260316100001_provider_dashboard_tables.sql:164-175`); a service-role server route for any status/text mutation; `src/components/dashboard/provider/ReferenceTracker.tsx` (stop relying on client UPDATE); `db-tests/` forge-guard.
- **Acceptance criteria:**
  - A trader's browser client **cannot** UPDATE `status`, `reference_text`, or `verified_at` on their own rows (RLS denies it). Trader may still INSERT `pending` and DELETE `pending` own rows.
  - `submitted`/`verified` are writable **only** via service-role (referee token submission / admin review).
  - New db-test **I1/S1 passes** (forge attempt denied).

## 2. Pre-Launch Fixes

### R2 — Invitation tokens (single-use, expiring)
- **Priority:** P1 · **Owner:** DB + Backend · **Complexity:** M
- **Dependencies:** R1
- **Files/systems:** migration adding `invite_token`, `token_expires_at`, `consumed_at` to `provider_references` (or a sibling `provider_reference_invites` table); token signing lib.
- **Acceptance:** each invite has a signed, single-use, expiring token; reuse rejected; expiry enforced (db-test I4).

### R3 — Referee submission surface + server route
- **Priority:** P1 · **Owner:** Frontend + Backend · **Complexity:** L
- **Dependencies:** R1, R2
- **Files/systems:** new `src/app/reference/[token]/page.tsx` (public); new server route/service that validates token + zod input and sets `status='submitted'` under service-role; add route to `PUBLIC_ROUTES`.
- **Acceptance:** a referee with a valid token can submit a vouch; status moves `sent → submitted`; invalid/expired token blocked; self-vouch & duplicate rejected (U5, U6, E4, E5).

### R4 — Reference-request email + Inngest function
- **Priority:** P1 · **Owner:** Email/Jobs · **Complexity:** M
- **Dependencies:** R2 (needs token to embed link)
- **Files/systems:** new `src/emails/reference-request.tsx`; new `src/inngest/functions/reference-request.ts` handling `provider/reference.requested`; register in `src/app/api/inngest/route.ts`; replace the TODO at `provider-verification-service.ts:341` with an event emit.
- **Acceptance:** creating a reference emits the event and sends an email containing the tokenised link; requires `RESEND_API_KEY` + `INNGEST_SIGNING_KEY`.

### R5 — Decline / cancel / resend / expire lifecycle
- **Priority:** P1 · **Owner:** Backend + Frontend + Email/Jobs · **Complexity:** L
- **Dependencies:** R2, R3, R4
- **Files/systems:** extend `provider_reference_status` enum (or a status table) with the recommended states (`sent/declined/withdrawn/expired/…` — see `VOUCHING_STATE_MACHINE.md §3.2`); wire the dead "Send Request"/"Remind" buttons (`ReferenceTracker.tsx:174-191`); Inngest expiry sweep.
- **Acceptance:** trader can resend (new token) and cancel; referee can decline; expired invites auto-transition; dead buttons now do real work (fixes V-09).

### R6 — Per-reference admin review (approve/reject/flag) + reviewer/audit fields
- **Priority:** P1 · **Owner:** Admin + Backend + DB · **Complexity:** L
- **Dependencies:** R1, R3
- **Files/systems:** migration adding `reviewed_by`, `reviewed_at`, `review_notes`, review status; new admin service action + route (perm `manage_verifications`); admin UI beyond `VerificationQueueClient.tsx`; ensure `logAdminAction` receives `metadata` (fix `src/lib/audited-admin-action.ts:98-107` to pass decision/notes) — closes V-07.
- **Acceptance:** an admin can approve/reject/flag an individual reference; the action writes `admin_audit_log.metadata` with the reference id + decision; `submitted → approved/rejected/flagged` enforced server-side (U8, E6).

### R7 — Configurable vouch-rules gate (default OFF)
- **Priority:** P1 · **Owner:** Product + Backend · **Complexity:** L
- **Dependencies:** R6 (needs `approved`/valid vouches to count)
- **Files/systems:** rules storage (config table or config lib, **configurable** counts — not hard-coded); evaluation lib; wire into the verification progression; keep existing direct admin-approval path intact when gate is OFF.
- **Acceptance:** with gate OFF, current behaviour unchanged; with gate ON, `verified` requires ≥ N peer + ≥ M recent-customer (within a configurable recency window) **valid** vouches, plus business checks + admin final decision (U7).

### R8 — DB uniqueness on (provider, referee_email, reference_type)
- **Priority:** P2 · **Owner:** DB · **Complexity:** S
- **Dependencies:** none (independent of R1)
- **Files/systems:** migration adding a unique index; keep the friendly app-level message (`provider-verification-service.ts:315-324`).
- **Acceptance:** concurrent duplicate inserts are rejected by the DB (db-test I5); UI still shows the existing "duplicate" error.

### R9 — Fix latent provider-id derivation
- **Priority:** P2 · **Owner:** Frontend · **Complexity:** S
- **Dependencies:** none
- **Files/systems:** `.../verification/peer-references/page.tsx`, `.../client-references/page.tsx` — select `user_id` (the real PK/FK key) instead of `id`; drop the `?? user.id` accidental fallback.
- **Acceptance:** provider id is derived explicitly from `user_id`; no reliance on a non-existent `id` column (closes V-10).

## 3. Post-Launch Improvements

### R10 — Self-vouch / abuse heuristics
- **Priority:** P3 · **Owner:** Backend · **Complexity:** M · **Dependencies:** R3, R6
- **Acceptance:** submissions from the provider's own contact details, or clustered/suspicious patterns, auto-`flagged` for admin.

### R11 — Recent-customer recency window enforcement
- **Priority:** P3 · **Owner:** Backend + Product · **Complexity:** M · **Dependencies:** R7
- **Acceptance:** "recent customer" vouches only count when the referenced work falls within the configurable window (e.g. 3 months).

### R12 — Referee identity binding / account linking (Flows C & D)
- **Priority:** P3 · **Owner:** Backend + Frontend · **Complexity:** L · **Dependencies:** R3
- **Acceptance:** existing users invited can link the vouch to their account; new users get a light guest path.

## 4. Monitoring Improvements

### R13 — Audit-log completeness for all vouch transitions
- **Priority:** P2 · **Owner:** Backend · **Complexity:** S · **Dependencies:** R6
- **Acceptance:** every reference state change emits an `admin_audit_log`/event with `metadata` (actor, reference id, decision); verification review metadata gap closed.

### R14 — Fraud/anomaly signals + alerting
- **Priority:** P3 · **Owner:** Ops/Backend · **Complexity:** M · **Dependencies:** R10, R13
- **Acceptance:** spikes in self-forged/flagged vouches raise a Sentry/ops alert.

## 5. Product-Policy Decisions Requiring Confirmation

| # | Decision | Why it matters |
|---|----------|----------------|
| P-1 | Exact required counts (default proposed: 3 peer + 3 recent-customer) and whether the gate ships OFF or ON | Drives R7 config defaults |
| P-2 | "Recent" window definition (e.g. 3 months) for customer vouches | Drives R11 |
| P-3 | Token TTL and resend limits | Drives R2/R5 |
| P-4 | Whether existing seed/legacy `verified` references are grandfathered or must be re-validated after R1 | Data-migration impact |
| P-5 | Whether a referee must have an account or can vouch as a guest | Drives R12 scope |
| P-6 | Whether references remain *optional* enrichment or become a *hard* verification prerequisite when the gate is ON | Affects existing verified providers |

## 6. Sequencing

```
R1 (P0) ─► R2 ─► R3 ─► R4
                 │     └► R5
                 └► R6 ─► R7 ─► R11
R8, R9  (independent, any time)
R13 after R6 · R10/R12/R14 post-launch
```

**Ship gate:** R1 must land before any surface that presents `verified` references as trustworthy. R2–R7 constitute a functional, secure vouching MVP. R8/R9 are cheap hardening. Everything in §3–§4 is incremental.
