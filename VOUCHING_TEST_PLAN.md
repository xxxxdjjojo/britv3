# Vouching Test Plan — Post-Fix

**Branch:** `feat/vouching-system` · **Date:** 2026-07-12 (post-fix update)

Marks each test **[EXISTS]** (present + passing on this branch), **[EXISTS-BLOCKED]** (written + reviewed, but needs env/schema to run), or **[GAP]** (still absent).
Status vocabulary: WORKING · NOT_IMPLEMENTED · UNTESTED · BLOCKED_BY_CONFIGURATION · UNTESTED-LIVE.

> **CONFIRMED vs UNTESTED-LIVE.** Unit + db-tests are **CONFIRMED** (passing, real assertions; db-tests against Docker Postgres). The Playwright e2e specs are **EXISTS-BLOCKED / UNTESTED-LIVE** — reviewed-correct but not yet executed because the target DB lacks the new migrations and no provider/admin test user is seeded (see `VOUCHING_SYSTEM_AUDIT.md §17`).

---

## 1. Unit Tests (Vitest — colocated / `__tests__`)

| # | Test | Exists? | Location | Outcome |
|---|------|---------|----------|---------|
| U1 | Token lib: generate / hash(sha256) / timing-safe-match / expiry / isExpired | [EXISTS] (19) | `src/lib/reference-tokens.ts` tests | all pass |
| U2 | `createReferenceInvitation` — self-vouch → 422, duplicate-active → 409, per-provider cap=25 | [EXISTS] | `reference-invitation-service.test.ts` | guards enforced |
| U3 | `resendReferenceInvitation` (cooldown + max-sends) / `cancelReferenceInvitation` (→revoked) / `markSentReference` | [EXISTS] | same file | correct transitions |
| U4 | `resolveInvitationByToken` — valid / expired(lazy) / used / declined / invalid | [EXISTS] | `reference-submission-service.test.ts` | correct state per case |
| U5 | `submitReference` — single-use (NULLs hash), client work_date required+non-future, DB-serialized double-submit | [EXISTS] | same file | submitted; replay → used/409 |
| U6 | `declineReference` — sets declined + single-use | [EXISTS] | same file | declined |
| U7 | `getVouchRules` (defaults fallback) / `countValidVouches` (verified-only, client recency) / `evaluateVouchGate` (pure) | [EXISTS] | `vouch-rules-service.test.ts` | gate OFF → no effect; ON → requires N+M valid |
| U8 | `reviewReference` — verify/reject/flag; reason req for reject/flag; DB-serialized; submitted|flagged only | [EXISTS] | `verification-service.ts` tests | correct state + guards |
| U9 | `getProviderReferencesForAdmin` — all statuses, full referee email | [EXISTS] | same | rows returned |
| U10 | `provider-display` shared name/trade helper | [EXISTS] | `provider-display.test.ts` | display resolved |
| U11 | Email template `reference-request.tsx` (expiry + reminder variants) | [EXISTS] | `reference-request.test.tsx` | renders |
| U12 | Inngest `reference-request-email` — generates token, hashes to DB, raw only in URL, retries:3 | [EXISTS] | `reference-request-email.test.ts` | event handled |
| U13 | Trader API route — 201/409/422/403/429 | [EXISTS] | `api/provider/references/route.test.ts` (+ resend/cancel) | codes correct |
| U14 | Referee submit/decline route — 200/409/410/404/400, fail-open ratelimit | [EXISTS] | `api/references/[token]/*.test.ts` | codes correct |
| U15 | Admin review route — `manage_verifications`, reason→400/invalid→409/not_found→404, audit metadata | [EXISTS] | `api/admin/references/[id]/review/route.test.ts` | authz + mapping |
| U16 | Referee submission form component (a11y radios, focus-to-confirmation) | [EXISTS] | `ReferenceSubmissionForm.test.tsx` | renders + submits |

**Full-suite result:** `pnpm exec vitest run` → **6004 passed / 28 skipped / 102 todo / 0 failed** (CONFIRMED).

## 2. Integration Tests (db-tests — Docker Postgres harness)

| # | Test | Exists? | Location | Outcome |
|---|------|---------|----------|---------|
| I1 | **RLS forge-guard:** trader CANNOT UPDATE own `provider_references.status`→`verified` | [EXISTS] | `db-tests/provider-references-vouching.test.ts` | **denied (CONFIRMED)** |
| I2 | Trader CANNOT INSERT/DELETE own rows (write policies DROPped); CAN SELECT own | [EXISTS] | same | enforced |
| I3 | Identity columns (`provider_id`/`referee_email`/`reference_type`) immutable on UPDATE (trigger) | [EXISTS] | same | RAISE EXCEPTION |
| I4 | Admin (`is_admin`) can SELECT + UPDATE (review) | [EXISTS] | same | allowed |
| I5 | Unique: one live token-hash; one active invite per (provider, lower(email), type) | [EXISTS] | same | duplicate rejected |
| I6 | `verification_vouch_rules` — authenticated read, admin-only write | [EXISTS] | same | perms enforced |

**Suite result:** `pnpm test:db` → **37/37 pass** against real Postgres (Docker) — **CONFIRMED**.

**Environment:** Docker daemon + `RUN_DB_TESTS=1` + `vitest.db.config.ts`; harness seeds a minimal `provider_references` stub + enums + `service_provider_details`, then applies migrations A/B/C in order.

## 3. E2E Tests (Playwright)

| # | Test | Exists? | Location | Outcome |
|---|------|---------|----------|---------|
| E1 | Admin verification queue loads + entries/empty state | [EXISTS] (pre-existing) | `e2e/admin-scenario-06-verification-reviews.spec.ts` | passes |
| E2 | Trader adds reference → row appears; referee gets tokenised link | [EXISTS-BLOCKED] | `e2e/reference-vouching.spec.ts` | UNTESTED-LIVE |
| E3 | Referee opens tokenised link → submits vouch → status `submitted` | [EXISTS-BLOCKED] | `e2e/reference-vouching.spec.ts` | UNTESTED-LIVE |
| E4 | Expired/used token shows correct state, cannot submit | [EXISTS-BLOCKED] | `e2e/reference-vouching.spec.ts` | UNTESTED-LIVE |
| E5 | Admin reviews an individual reference (verify/reject/flag) → counts update | [EXISTS-BLOCKED] | `e2e/admin-reference-review.spec.ts` | UNTESTED-LIVE |
| E6 | Fixtures / seed for the above | [EXISTS] | `e2e/fixtures/reference-seed.ts`, `e2e/README-vouching.md` | reviewed |

**Environment / blocker:** the specs are written and reviewed-correct. They are **BLOCKED_BY_CONFIGURATION**: the target DB does not yet have migrations `20260712100001..3` applied and no provider/admin test user is seeded. Once schema + users exist (per `e2e/README-vouching.md` and `supabase/migrations/README.md`), they will run.

## 4. Security Tests

| # | Test | Exists? | Outcome |
|---|------|---------|---------|
| S1 | Trader self-forge `UPDATE ... status='verified'` | [EXISTS] (I1) | **denied — CONFIRMED** by db-test |
| S2 | Cross-provider write / identity reassignment | [EXISTS] (I2/I3) | denied (policy + trigger) |
| S3 | Anon read/write of `provider_references` | [EXISTS] (I2) | denied |
| S4 | Non-permissioned admin (`dev_admin`) calls review route | [EXISTS] (U15) | 403 (route requires `manage_verifications`) |
| S5 | Token replay after submit/decline | [EXISTS] (U5/U6) | denied (hash NULLed + serialized) |
| S6 | Referee input validation (zod) incl. work_date-not-future, min text | [EXISTS] (U5) | invalid rejected |
| S7 | Token enumeration on public page (generic invalid; no ids) | [EXISTS] (U14 + reviewed) | no enumeration |

## 5. Manual QA (BLOCKED_BY_CONFIGURATION until migrations applied)

| # | Check | Expected | Live status |
|---|-------|----------|-------------|
| M1 | Provider adds a referee | row appears + email sent | UNTESTED-LIVE |
| M2 | Resend / Cancel buttons | resend re-emails (cooldown); cancel → revoked | UNTESTED-LIVE |
| M3 | Referee opens tokenised link, submits | status → submitted | UNTESTED-LIVE |
| M4 | Admin verify/reject/flag an individual reference | status updates; audit metadata written | UNTESTED-LIVE |
| M5 | Admin edits vouch-rules; gate-aware approve | confirm only when gate ON && unmet | UNTESTED-LIVE |
| M6 | Public verified provider shows ShieldCheck | badge renders | (pre-existing WORKING) |

## 6. Test Data Requirements

- **Provider (trader) test user** with `service_provider_details` for the invite/tracker flow.
- **Admin user** with `manage_verifications` (super/moderation/ops) for review.
- **Provider in `pending_review`** to appear in the queue.
- **A submitted reference** to review (via the referee flow or `e2e/fixtures/reference-seed.ts`).
- **A generated + an expired token** for token-state tests.

## 7. Environment Requirements

| Requirement | For | Status |
|-------------|-----|--------|
| Docker + `RUN_DB_TESTS=1` + `vitest.db.config.ts` | db-tests (§2, S1–S3) | ✅ **run — 37/37 pass** |
| Migrations `20260712100001..3` applied to target DB | e2e / live / manual QA | ❌ **NOT applied — the blocker** |
| Provider + admin test user seeded on target DB | e2e / live | ❌ not seeded |
| Playwright + dev server + auth fixtures | e2e (§3) | available (blocked by schema/users) |
| `RESEND_API_KEY` + `INNGEST_SIGNING_KEY` | live email delivery | wired; live send UNTESTED-LIVE |

## 8. Coverage Summary (post-fix)

- **Implemented + CONFIRMED:** the full service layer (U1–U16), the DB security contract (I1–I6, **37/37**), and the security cases (S1–S7). The pre-fix CRITICAL forge (S1/I1) is now **proven denied** — previously it had no test at all.
- **Remaining gap:** the **live e2e run** (E2–E5) is written + reviewed but **UNTESTED-LIVE / BLOCKED_BY_CONFIGURATION** — it needs the migrations applied to the target DB and test users seeded. This is the single outstanding test action.
