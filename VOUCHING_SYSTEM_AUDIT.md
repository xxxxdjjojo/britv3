# Vouching System — Post-Fix Audit

**Branch:** `feat/vouching-system` (off `origin/main`)
**Date:** 2026-07-12 (post-fix update)
**Scope:** The "vouching" system = the **provider references** feature — traders/professionals invite peers and past customers to vouch for them; a referee submits a vouch via a tokenised link; admins review individual references; references feed a configurable verification gate and the Verified badge.
**Status vocabulary:** WORKING · PARTIALLY_WORKING · BROKEN · NOT_IMPLEMENTED · INSECURE · UNTESTED · BLOCKED_BY_CONFIGURATION · UNTESTED-LIVE

> This is a **post-fix reality audit**. The pre-fix pass (readiness 18/100) found the feature half-built and INSECURE (a trader could forge their own `verified` vouches from the browser). Since then the full system was **built end-to-end**: DB security rewrite, token lib, invitation/submission/rules/admin-review services, email + Inngest job, trader API, referee public surface, admin review UI. Every conclusion below is anchored to a real file:line/table/policy/test path.
>
> **CONFIRMED vs UNTESTED-LIVE.** Throughout, **CONFIRMED** = proven by a passing unit test and/or a passing db-test against real Postgres, plus code review. **UNTESTED-LIVE** = code is complete + unit/db-tested + reviewed, but the end-to-end browser/e2e path has **not** been exercised against a running app because the target DB does not yet have the new migrations applied (see §17). Nothing here has been dogfooded in a live browser.

---

## 1. Executive Summary

The vouching system is now **built end-to-end and secure in the data layer**. A trader invites a peer or past customer; an Inngest job generates a single-use, expiring token and emails the referee a tokenised link; the referee submits (or declines) a vouch on a public `/reference/[token]` page via a service-role endpoint; an admin reviews each individual reference (verify/reject/flag) from a per-trader detail page; a configurable, **default-OFF** rules gate can require N peer + M recent-customer *valid* vouches before a provider is approved.

The single most serious pre-fix finding — **a trader could UPDATE their own `provider_references` rows to `status='verified'` with fabricated `reference_text` from the browser** — is **FIXED and proven**. Migration `20260712100002` DROPs the trader insert/update/delete-own policies, keeps select-own, adds admin select+update, and installs a BEFORE UPDATE trigger freezing the identity columns (`provider_id`, `referee_email`, `reference_type`). A db-test suite (`db-tests/provider-references-vouching.test.ts`, **37/37 passing against Docker Postgres**) proves the forge is denied while admin access and the unique constraints hold.

What is **not** yet done: the new migrations have **not been applied to the target (remote) DB**, and no provider/admin test user has been seeded there, so the live browser/e2e journey is **UNTESTED-LIVE / BLOCKED_BY_CONFIGURATION**. The reviewed e2e specs will pass once schema + users exist. See §17 and `VOUCHING_REMEDIATION_PLAN.md`.

## 2. Overall Readiness Score: **78 / 100** (was 18)

**Rationale.** The pre-fix trust-breaking hole is closed and *proven at the DB* (37/37 db-tests on real Postgres) — the CRITICAL finding is not merely coded-around but contract-tested. The full journey now exists in code: tokens, single-use/expiry, referee submit/decline surface, per-reference admin review, and a configurable default-OFF gate — all covered by passing unit tests with real-behaviour assertions. All non-live gates are green: `tsc` 0 errors, `lint` 0 errors, `check:migrations` ✓, full `vitest` 6004 passed / 0 failed, db-tests 37/37.

The **22 points withheld** are for the one genuine gap: **no live end-to-end verification**. The migrations are not applied to the target DB and no test user is seeded there, so the app/e2e/browser flow has never actually run against a real deployment. That is a real, unremoved risk (a schema-application slip, an env-var gap, or a proxy-gate surprise could surface only live), so the score stays in the high-70s rather than the 90s. It is code-complete and defensively tested, not launch-verified.

## 3. System Architecture Map (post-fix)

```
Trader (browser, authed provider)
  └─ ReferenceTracker.tsx ──(fetch)──► POST /api/provider/references            [cookie-auth]
        └─ non-provider → 403 · self-vouch → 422 · duplicate-active → 409 · >5/hr → 429
        └─ createReferenceInvitation() [service-role write — RLS blocks trader writes]
        └─ emits Inngest 'provider/reference.requested' (non-fatal)
  └─ Resend  ──► POST /api/provider/references/[id]/resend  (cooldown → 429)
  └─ Cancel  ──► POST /api/provider/references/[id]/cancel   (→ status 'revoked')

Inngest 'provider/reference.requested' | '.resend-requested'
  └─ reference-request-email.ts  (retries:3)
        └─ GENERATES raw token → hash to DB via markSentReference (raw never persisted to state)
        └─ sendReferenceInvitation() → Resend email w/ tokenised /reference/<raw> link + email_logs record

Referee (UNAUTHENTICATED — the raw token IS the auth)
  └─ GET /reference/[token]  (server component, service-role resolve, robots noindex, NO internal ids)
        └─ resolveInvitationByToken() → valid | expired(lazy) | used | declined | invalid
  └─ ReferenceSubmissionForm ──► POST /api/references/[token]/submit  (5/hr/IP fail-open)
        └─ submitReference(): single-use (NULLs token hash), client work_date required+non-future,
           DB-serialized against double-submit → status 'submitted'   200/409/410/404/400
  └─ POST /api/references/[token]/decline → status 'declined'

Admin (authed, permission manage_verifications)
  └─ /admin/verifications (queue + VouchRulesEditor)
       └─ rows link to /admin/verifications/[userId] (trader detail)
             └─ VouchCountsBanner (peer X/N, client (Md) Y/M, met/unmet)
             └─ AdminReferencesPanel (full referee email for fraud detection)
                  └─ Verify/Reject/Flag ──► POST /api/admin/references/[id]/review
                        └─ auditedAdminActionWithPermission('manage_verifications')
                        └─ reviewReference(): submitted|flagged only; reason req for reject/flag;
                           DB-serialized; logs metadata {decision,reason} to admin_audit_log
             └─ gate-aware provider approve (confirm only when gate_enabled && !allMet; default OFF)
  └─ PUT /api/admin/vouch-rules  (audited) — edits verification_vouch_rules singleton

Public
  └─ ProviderSearchCard.tsx isVerified = provider_verification_status === 'verified' → ShieldCheck

proxy.ts
  └─ gates /dashboard/provider on provider_verification_status === "verified"
     (verification/references pages are gate-exempt; "/reference" is in PUBLIC_ROUTES)
```

## 4. Current State-Machine Map (what code now enforces)

- **Reference status** enum `provider_reference_status` now has **9 values**: `pending | sent | submitted | verified | declined | expired | revoked | rejected | flagged`. Base 3 in `20260316100001_provider_dashboard_tables.sql:25`; 6 added by `20260712100001_vouching_reference_status_values.sql:14-19`.
  - `pending` → `sent`: Inngest job generates+hashes token and calls `markSentReference` (`reference-request-email.ts`).
  - `sent`/`pending` → `submitted`: referee via service-role `submitReference` (single-use token).
  - `sent`/`pending` → `expired`: lazy on resolve (`reference-submission-service.ts:107-116`) or expiry sweep index.
  - `* ` → `declined`: referee `declineReference`.
  - active → `revoked`: trader cancel (`cancelReferenceInvitation`).
  - `submitted`/`flagged` → `verified | rejected | flagged`: **admin only**, service `reviewReference` (`verification-service.ts:179-257`).
  - The trader (subject) **can no longer write any status** — RLS DROPs their write policies (§8).
- **Provider verification status** enum `provider_verification_status` = `unverified | pending_review | verified | suspended | rejected` (`002_marketplace.sql:54-60`). Admin flips `pending_review → verified|rejected`. A default-OFF configurable gate can require valid vouch counts first.

Full diagrams in `VOUCHING_STATE_MACHINE.md` (the pre-fix "recommended" model is now largely the "current" model).

## 5. Frontend Audit

| Item | Status | Evidence |
|---|---|---|
| `ReferenceTracker` add-reference → API (not browser insert) | WORKING / UNTESTED-LIVE | `src/components/dashboard/provider/ReferenceTracker.tsx` rewired to `POST /api/provider/references`; all 9 status badges; Resend/Cancel wired; progress counts VERIFIED-only; rules-driven required count; a11y radios/labels |
| Resend / Cancel buttons (formerly decorative) | WORKING / UNTESTED-LIVE | now call `/[id]/resend` and `/[id]/cancel` (fixes pre-fix V-09) |
| Progress "X / N verified" | WORKING | counts VERIFIED-only; required N read from `verification_vouch_rules` |
| Peer/client reference pages provider-id | WORKING (FIXED) | both pages now use `const providerId = user.id;` explicitly (comment documents `service_provider_details.user_id === auth uid`); the `.select("id") ?? user.id` fallback removed (fixes pre-fix V-10) |
| Referee submission form | WORKING / UNTESTED-LIVE | `src/components/reference/ReferenceSubmissionForm.tsx` + `ReferenceTokenState.tsx` — real radios, focus-to-confirmation, aria |
| Admin trader-detail UI | WORKING / UNTESTED-LIVE | `src/app/(admin)/admin/verifications/[userId]/page.tsx` — VouchCountsBanner + AdminReferencesPanel; VouchRulesEditor on queue page |

## 6. Backend Audit

| Item | Status | Evidence |
|---|---|---|
| Trader invitation create (self-vouch + dup-active + per-provider cap=25) | WORKING (unit) / UNTESTED-LIVE | `src/services/provider/reference-invitation-service.ts` (`MAX_ACTIVE_INVITES=25:39`, self-vouch `:117`, duplicate via unique index `:152-157`) |
| Resend (cooldown + max-sends), cancel (→revoked), markSent | WORKING (unit) | same file (`cooldown :222-227`) |
| Referee submission (single-use, client work_date, DB-serialized) | WORKING (unit) / UNTESTED-LIVE | `reference-submission-service.ts:138-216` — NULLs token hash, `.not(invite_token_hash, is, null)` serialization `:196` |
| Referee decline | WORKING (unit) | `reference-submission-service.ts:222-268` |
| Token lib generate/hash(sha256)/timing-safe-match/expiry | WORKING (19 unit) | `src/lib/reference-tokens.ts` |
| Vouch-rules: getVouchRules (defaults fallback), countValidVouches (verified-only; client recency), evaluateVouchGate (pure) | WORKING (unit) | `src/services/provider/vouch-rules-service.ts` |
| Admin per-reference review (verify/reject/flag; reason req; DB-serialized) | WORKING (unit) / UNTESTED-LIVE | `src/services/admin/verification-service.ts:179-257` |
| Old insecure client `sendReferenceRequest` | REMOVED | replaced by service-role API path; no browser-mediated write remains |

## 7. Database Audit

| Item | Status | Evidence |
|---|---|---|
| `provider_references` invitation columns | WORKING (migration + db-test) | `20260712100002:18-31` — invite_token_hash (sha256 hex, raw never stored), invite_expires_at/sent_at/last_sent_at/send_count, work_date, rating (1-5 CHECK), declined_reason/at, revoked_at, reviewed_at/by, review_reason |
| Reference status enum (9 values) | WORKING (migration + db-test) | `20260712100001:14-19` |
| Unique: one live token per hash | WORKING (db-test) | `uq_provider_references_token_hash` (`20260712100002:62-63`) |
| Unique: one active invite per (provider, lower(email), type) | WORKING (db-test) | `uq_provider_references_active_invite` (`:67-69`) |
| work_date-not-future CHECK | WORKING | `provider_references_work_date_not_future` (`:47-56`) |
| `verification_vouch_rules` singleton (required peer/client=3, recency 90d, expiry 30d, cooldown 24h, gate_enabled=FALSE) | WORKING (db-test) | `20260712100003:10-23`; auth-read + admin-write RLS `:36-46`; updated_at trigger |
| RLS forgery hole | FIXED (proven) | trader insert/update/delete-own DROPPed; select-own kept; admin select+update added; identity-immutability trigger (`20260712100002:83-128`) — db-test **37/37** |

## 8. Auth & Permissions Audit

| Item | Status | Evidence |
|---|---|---|
| Trader SELECT own references | WORKING | `provider_references_select_own` USING `provider_id = auth.uid()` (`20260712100002:90-92`) |
| **Trader INSERT/UPDATE/DELETE own** | **REMOVED (the fix)** | policies DROPped (`:83-85`); trader writes now go via service-role API only — db-test proves forge denied |
| Identity columns immutable on any UPDATE | WORKING (proven) | BEFORE UPDATE trigger `prevent_provider_reference_identity_change` (`:113-128`) |
| Admin SELECT / UPDATE references | WORKING | `provider_references_admin_select` / `_admin_update` USING `is_admin` (`:96-106`) |
| Referee (invited) access | via service-role token (by design) | no anon/referee RLS policy; referee endpoints use the service-role client + single-use token (`20260712100002:130-131`) |
| `verification_vouch_rules` perms | WORKING | authenticated read, admin write (`20260712100003:36-46`) |
| proxy provider gate | WORKING | `proxy.ts` compares `provider_verification_status === "verified"` (correct enum — the "approved" mismatch is NOT present on this branch) |
| Admin review route permission | WORKING | `manage_verifications` enforced via `auditedAdminActionWithPermission` (`api/admin/references/[id]/review/route.ts:40-45`) |

Full role grid in `VOUCHING_RBAC_MATRIX.md`.

## 9. Admin Audit

| Item | Status | Evidence |
|---|---|---|
| Verification queue lists `pending_review` providers | WORKING | `verification-service.ts:15-47` |
| Per-trader detail page (counts banner + references panel) | WORKING / UNTESTED-LIVE | `src/app/(admin)/admin/verifications/[userId]/page.tsx` |
| Per-reference verify/reject/flag | WORKING (unit) / UNTESTED-LIVE | `reviewReference` (`verification-service.ts:179-257`); route maps `reason_required→400`, `invalid_state→409`, `not_found→404` (`review/route.ts:16-18`) |
| Reason required for reject/flag | WORKING | `reviewReference:207-214` + route |
| Audit log records decision+reason | WORKING (FIXED) | route logs explicit `metadata:{decision,reason}` to `admin_audit_log` (`review/route.ts:60-74`); UUID-guards id (`:29`) — closes pre-fix V-07. **Note:** double-logs (wrapper base entry + explicit metadata entry) — intentional, see §16 |
| Vouch-rules editor | WORKING / UNTESTED-LIVE | `PUT /api/admin/vouch-rules` (audited) + VouchRulesEditor |
| Gate-aware provider approve | WORKING / UNTESTED-LIVE | confirm-dialog only when `gate_enabled && !allMet`; default OFF preserves existing direct-approve flow |

## 10. Security Audit (post-fix)

- **CRITICAL — Self-forged verified vouches → FIXED (proven).** `provider_references` trader write policies DROPped; identity-immutability trigger; admin/service-role-only status writes. Proven by `db-tests/provider-references-vouching.test.ts` (37/37, real Postgres). Status: **WORKING**.
- **HIGH — Provenance on a reference → ADDRESSED.** Referee submissions are bound to a single-use, expiring, sha256-hashed token (raw never stored); admin reviews individually. Status: **WORKING (unit/db-tested) / UNTESTED-LIVE** for the full path.
- **MEDIUM — Race-prone dedup → FIXED.** DB unique partial index `uq_provider_references_active_invite` on (provider, lower(email), type) for active statuses; app surfaces a friendly 409. Status: **WORKING (db-test)**.
- **MEDIUM — Token single-use under concurrency → ADDRESSED.** submit/decline NULL the hash and filter `.not(invite_token_hash, is, null)`; a racing second request matches 0 rows → 409/410. Status: **WORKING (unit)**.
- **LOW — Referee enumeration → ADDRESSED.** Generic "invalid" state for revoked/unknown tokens; no internal ids exposed on the public page (robots noindex). Status: **WORKING (reviewed)**.
- **LOW — Latent provider-id bug → FIXED.** Pages now use `user.id` explicitly. Status: **WORKING**.
- **INFORMATIONAL — Audit metadata gap → FIXED.** Review route writes `metadata:{decision,reason}`.

## 11. Email & Notification Audit

| Item | Status | Evidence |
|---|---|---|
| Reference-request email to referee (+ expiry/reminder variants) | WORKING (unit) / UNTESTED-LIVE | `src/emails/reference-request.tsx` (react-email) + `sendReferenceInvitation` in `email-service.ts` (Resend + `email_logs` record) |
| Inngest function for reference lifecycle | WORKING (unit) / UNTESTED-LIVE | `src/inngest/functions/reference-request-email.ts` handles `provider/reference.requested` + `.resend-requested`; generates token, hashes to DB, raw token only in email URL; retries:3; registered in `src/app/api/inngest/route.ts:46,86` |
| Reminder (resend) email | WORKING (unit) / UNTESTED-LIVE | same function via `.resend-requested` |
| Verification-outcome email (provider) | WORKING | `sendVerificationOutcome` in `reviewVerification` (`verification-service.ts:79-86`) |

## 12. Test Coverage Audit

| Test | Status | Evidence |
|---|---|---|
| Token lib unit | WORKING (19) | `src/lib/reference-tokens.ts` tests |
| Invitation / submission / rules / provider-display services unit | WORKING | `src/services/provider/*.test.ts` (mocked Supabase, real-behaviour assertions) |
| Admin review service unit | WORKING | `src/services/admin/verification-service.ts` tests |
| Trader/referee/admin API route unit | WORKING | colocated `*.route.test.ts` under each route dir |
| Email template + Inngest fn unit | WORKING | `reference-request.test.tsx`, `reference-request-email.test.ts` |
| **RLS forge-guard + admin access + unique constraints + rules perms** | WORKING (37/37 CONFIRMED) | `db-tests/provider-references-vouching.test.ts` — real Postgres (Docker) via `pnpm test:db` |
| e2e referee submission + admin review | EXISTS / BLOCKED_BY_CONFIGURATION | `e2e/reference-vouching.spec.ts`, `e2e/admin-reference-review.spec.ts`, `e2e/fixtures/reference-seed.ts`, `e2e/README-vouching.md` — reviewed correct; will pass once schema applied + users seeded |

## 13. Production-Readiness Assessment

**CODE-READY, LIVE-UNVERIFIED.** The trust hole is closed and proven at the DB; the full journey exists and is unit/db-tested and reviewed; all non-live gates are green. It is **not yet launch-verified**: the new migrations must be applied to the target DB and a provider/admin test user seeded before the app/e2e/browser flow can be exercised live (§17). Until then the end-to-end flow is **UNTESTED-LIVE / BLOCKED_BY_CONFIGURATION**.

## 14. Changes Made (the build)

**Migrations (`supabase/migrations/`)**
- `20260712100001_vouching_reference_status_values.sql` — +6 enum values (sent, declined, expired, revoked, rejected, flagged) → 9 total.
- `20260712100002_vouching_provider_references_columns_rls.sql` — invitation/review columns; unique partial indexes; work_date CHECK; **RLS rewrite** (DROP trader writes, keep select-own, add admin select+update, identity-immutability trigger).
- `20260712100003_vouching_rules_config.sql` — `verification_vouch_rules` singleton + RLS + updated_at trigger.

**Services / lib (`src/services`, `src/lib`)**
- `src/lib/reference-tokens.ts`; `src/services/provider/reference-invitation-service.ts`; `.../reference-submission-service.ts`; `.../vouch-rules-service.ts`; `.../provider-display.ts`.
- `src/services/admin/verification-service.ts` — added `getProviderReferencesForAdmin`, `reviewReference`; removed insecure `sendReferenceRequest`.

**Email + jobs**
- `src/emails/reference-request.tsx` + `sendReferenceInvitation`; `src/inngest/functions/reference-request-email.ts` (registered in `src/app/api/inngest/route.ts`).

**Trader API + UI**
- `src/app/api/provider/references/route.ts` (+ `[id]/resend`, `[id]/cancel`); `ReferenceTracker.tsx` rewired; peer/client reference-page provider-id fix.

**Referee public surface**
- `/reference` added to `PUBLIC_ROUTES` (`src/lib/constants.ts:254`); `src/app/reference/[token]/page.tsx`; `src/components/reference/ReferenceSubmissionForm.tsx` + `ReferenceTokenState.tsx`; `src/app/api/references/[token]/submit` + `/decline`.

**Admin surface**
- `src/app/api/admin/references/[id]/review/route.ts`; `src/app/api/admin/vouch-rules/route.ts`; `src/app/(admin)/admin/verifications/[userId]/page.tsx` + `page.tsx` queue links.

**Tests**
- `db-tests/provider-references-vouching.test.ts` (37 assertions); unit tests for every service/route/component above; e2e specs + fixtures + README.

## 15. Commands Executed & Gate Results

| Command | Result |
|---|---|
| `pnpm check:migrations` | ✓ **PASS** — 163 migrations, tokens unique |
| `pnpm exec tsc --noEmit --incremental false` | ✓ **0 errors** |
| `pnpm lint` | ✓ **0 errors** (110 pre-existing warnings) |
| `pnpm exec vitest run` (full) | ✓ **6004 passed / 28 skipped / 102 todo / 0 failed** (after the dashboard-brand-guard fix moving the new admin components onto warm tokens `bg-muted`/teal) |
| `pnpm test:db` | ✓ **vouching db-test 37/37 pass** (Docker Postgres) |
| `pnpm build` | **EXIT 0 — GREEN.** With `.env.local` present the full production build passes; all vouching routes compile and appear in the manifest as dynamic (`ƒ`): `/reference/[token]`, `/api/references/[token]/submit`+`/decline`, `/api/provider/references`(+`/[id]/resend`,`/cancel`), `/api/admin/references/[id]/review`, `/api/admin/vouch-rules`, `/dashboard/provider/verification/{peer,client}-references` — none touch the SSG prerender path. (A first run without env failed only at prerendering the unrelated pre-existing `/(main)/top-properties/[slug]` SSG route on missing `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` — an env condition, not a vouching defect.) |

## 16. Tests Passed / Notes

- **Passed:** all listed unit suites; full vitest (6004/0); db-test 37/37; `check:migrations`; `tsc`; `lint`.
- **Failed:** none.
- **Intentional double-audit-log:** each admin review writes both the wrapper's base entry (metadata-less) and an explicit metadata-bearing entry `{decision,reason}` — deliberate; a metadata-bearing record is more valuable than the bare one, and the metadata-log is best-effort so a log failure never 500s an already-succeeded review (`review/route.ts:60-74`).

## 17. Configuration Blockers (the remaining risk)

- **Live end-to-end — BLOCKED_BY_CONFIGURATION / UNTESTED-LIVE:** the app `.env` points at remote prod, which does **not** yet have the three new migrations. Auto-apply is retired; migrations must be applied manually per `supabase/migrations/README.md`, **and** a provider + admin test user seeded, before the app/e2e/browser flow can run live. Until then the trader→email→referee→admin journey is covered by unit + db-tests + reviewed e2e only.
- **e2e run — BLOCKED_BY_CONFIGURATION:** specs exist and are reviewed-correct; they need the schema applied + seeded users to execute.
- **Email/Inngest live delivery — UNTESTED-LIVE:** `RESEND_API_KEY` + `INNGEST_SIGNING_KEY` are wired; live send has not been exercised.

## 18. Prioritised Findings (post-fix)

| ID | Area | Finding | Status | Severity | Evidence | User impact | Resolution / remaining |
|----|------|---------|--------|----------|----------|-------------|------------------------|
| V-01 | Database / Auth | Trader could UPDATE own references → forge `verified` | **FIXED (WORKING, proven)** | CRITICAL (was) | `20260712100002:83-128`; db-test 37/37 | Forge closed; badge trustworthy | Done — apply migration to prod to make it live |
| V-02 | Backend / Product | No referee submission surface | **WORKING (unit) / UNTESTED-LIVE** | HIGH (was) | `src/app/reference/[token]/page.tsx`; submit route 200/409/410/404/400 | Journey now functions in code | Live e2e run pending §17 |
| V-03 | Email | Reference-request email never sent | **WORKING (unit) / UNTESTED-LIVE** | HIGH (was) | `reference-request.tsx`; `reference-request-email.ts` (registered) | Referee now emailed a link | Live send pending §17 |
| V-04 | Database | No invitation token / expiry / single-use | **FIXED (WORKING)** | HIGH (was) | invite_* columns + unique token-hash index; single-use NULL-on-response | Secure expiring link exists | Done |
| V-05 | Admin | No per-reference review | **WORKING (unit) / UNTESTED-LIVE** | MEDIUM (was) | `reviewReference` + review route + admin UI | Admin can verify/reject/flag each vouch | Live e2e pending §17 |
| V-06 | Product | Vouch counts not enforced | **WORKING (unit, default OFF) / UNTESTED-LIVE** | MEDIUM (was) | `verification_vouch_rules`; `evaluateVouchGate`; gate-aware approve | Configurable gate exists (OFF by default) | Live enable is a product decision |
| V-07 | Admin / Audit | Review decision/notes not stored | **FIXED (WORKING)** | MEDIUM (was) | review route logs `metadata:{decision,reason}` | Decisions attributable | Done |
| V-08 | Database | No DB uniqueness on (provider, email, type) | **FIXED (WORKING, db-test)** | MEDIUM (was) | `uq_provider_references_active_invite` | Duplicate active invites blocked | Done |
| V-09 | Frontend | "Send Request"/"Remind" decorative | **FIXED (WORKING) / UNTESTED-LIVE** | LOW (was) | Resend/Cancel wired to `/[id]/resend`,`/[id]/cancel` | Buttons do real work | Live e2e pending §17 |
| V-10 | Frontend | Provider-id fallback accident | **FIXED (WORKING)** | LOW (was) | pages use `const providerId = user.id` | No latent breakage | Done |
| V-11 | Test | Forge + flow untested | **FIXED (WORKING)** | MEDIUM (was) | db-test 37/37 + unit suites; reviewed e2e | Regressions guarded | Live e2e run remains (§17) |

---

*Companion documents:* `VOUCHING_FLOW_MATRIX.md`, `VOUCHING_STATE_MACHINE.md`, `VOUCHING_RBAC_MATRIX.md`, `VOUCHING_TEST_PLAN.md`, `VOUCHING_REMEDIATION_PLAN.md`.
