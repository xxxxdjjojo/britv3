# Vouching Test Plan

**Branch:** `feat/vouching-system` · **Date:** 2026-07-12

Marks each test **[EXISTS]** (present on this branch), **[GAP]** (needed, absent today), or **[BLOCKED]** (needs environment/config).
Status vocabulary: WORKING · NOT_IMPLEMENTED · UNTESTED · BLOCKED_BY_CONFIGURATION.

---

## 1. Unit Tests (Vitest — colocated / `__tests__`)

| # | Test | Exists? | Location / target | Expected outcome |
|---|------|---------|-------------------|------------------|
| U1 | `sendReferenceRequest` inserts `pending`, validates email, dedups | [EXISTS] | `src/services/provider/__tests__/provider-verification-service.test.ts` (10 tests, all pass) | success result + row; invalid email rejected; duplicate email rejected |
| U2 | `getVerificationSteps` maps docs+refs to step statuses; references OPTIONAL | [EXISTS] | same file | 5 steps; reference steps `required:false` |
| U3 | `updateBadgeStatus` maps status→is_active | [EXISTS] | same file | updated badge record |
| U4 | Admin verification queue component renders + posts decision | [EXISTS] | `src/__tests__/m3/admin/VerificationQueueClient.test.tsx` | approve/reject POST `{userId, decision, notes}` |
| U5 | `sendReferenceRequest` rejects self-vouch (referee_email == provider email) | [GAP] | service | should return `{success:false}` (guard NOT_IMPLEMENTED today) |
| U6 | Tokenised referee submission service sets `submitted` only with valid token | [GAP] | future submission service | valid token → `submitted`; invalid/expired → error |
| U7 | Vouch-count / rules evaluation (configurable, default OFF) | [GAP] | future rules lib | gate OFF → no effect; ON → requires N peer + M customer valid |
| U8 | Per-reference admin review sets `approved`/`rejected`/`flagged` + writes audit metadata | [GAP] | future admin review service | correct state + `admin_audit_log.metadata` populated |

## 2. Integration Tests (db-tests — Docker Postgres harness)

| # | Test | Exists? | Location / target | Expected outcome |
|---|------|---------|-------------------|------------------|
| I1 | **RLS forge-guard:** trader CANNOT UPDATE own `provider_references.status`→`verified` | [GAP] | `db-tests/` (none touch `provider_references` today) | UPDATE denied by RLS (currently would **pass the forge** — proves V-01) |
| I2 | Trader CAN INSERT own `pending` reference; CANNOT insert for another provider | [GAP] | `db-tests/` | insert-own allowed; cross-provider denied |
| I3 | Anon CANNOT read `provider_references` | [GAP] | `db-tests/` | select denied |
| I4 | Referee token submission (service-role) sets `submitted`; token single-use | [GAP] | `db-tests/` | first submit OK; reuse denied |
| I5 | DB uniqueness on (provider, email, type) blocks duplicate under concurrency | [GAP] | `db-tests/` | second insert violates unique index |
| I6 | Admin (`manage_verifications`) review updates `profiles.provider_verification_status` | [EXISTS-adjacent] | covered indirectly by admin service tests; no dedicated db-test | status flips; non-permissioned admin blocked |

**Environment:** requires Docker daemon, `RUN_DB_TESTS=1`, `vitest.db.config.ts`, harness `db-tests/harness.ts` (spins ephemeral Postgres, `:71-96`). **Status: BLOCKED_BY_CONFIGURATION** unless Docker is available in CI/local.

## 3. E2E Tests (Playwright)

| # | Test | Exists? | Location / target | Expected outcome |
|---|------|---------|-------------------|------------------|
| E1 | Admin verification queue page loads + shows entries/empty state + approve/reject | [EXISTS] | `e2e/admin-scenario-06-verification-reviews.spec.ts:15-38` | heading visible; queue or empty state |
| E2 | Provider dashboard verification/references pages render for a verified provider | [GAP] | `e2e/` | pages load, "X/3" progress visible |
| E3 | Trader adds a reference → row appears in tracker | [GAP] | `e2e/` | new card with masked email, `pending` badge |
| E4 | Referee opens tokenised link → submits vouch → status `submitted` | [GAP] | `e2e/` (no referee route today) | submission recorded |
| E5 | Expired token link shows expiry message, cannot submit | [GAP] | `e2e/` | blocked with message |
| E6 | Admin approves an individual reference → counts toward gate | [GAP] | `e2e/` | reference `approved`; provider progresses |

**Environment:** Playwright; auth fixtures `e2e/fixtures/auth.ts`; demo users (e.g. admin, provider). Dev server running.

## 4. Security Tests

| # | Test | Exists? | Expected outcome |
|---|------|---------|------------------|
| S1 | **Trader self-forge:** authed trader browser client attempts `UPDATE provider_references SET status='verified', reference_text='fake'` | [GAP] | MUST be denied. Today it **succeeds** (V-01, `20260316100001:164-175`) — this test would fail until RLS is fixed |
| S2 | Cross-provider write (trader A writes provider B's reference) | [GAP] | denied by RLS |
| S3 | Anon read/write of `provider_references` | [GAP] | denied |
| S4 | Non-permissioned admin (`dev_admin`) calls review route | [GAP] | 403 (route requires `manage_verifications`, `route.ts:29`) |
| S5 | Token replay / forged token on referee submission | [GAP] | denied (no tokens exist yet) |
| S6 | Server route validates all referee input (zod) incl. self-vouch/duplicate | [GAP] | invalid input rejected |

## 5. Manual QA

| # | Check | Exists path? | Expected |
|---|-------|--------------|----------|
| M1 | Log in as provider (`@demo`), open Peer/Client references, add a referee | yes | row appears; email? **NO email sent** (NOT_IMPLEMENTED) |
| M2 | Confirm "Send Request" / "Remind" buttons do something | yes | **they do nothing** — decorative (`ReferenceTracker.tsx:174-191`) |
| M3 | As the same provider, attempt to see any way a referee could respond | — | **none exists** |
| M4 | Log in as admin, open `/admin/verifications`, approve a provider | yes | provider `verified`; outcome email attempted; **notes not stored** |
| M5 | Confirm no per-reference admin controls | yes | absent |
| M6 | Public: verified provider shows ShieldCheck badge | yes | badge renders (`ProviderSearchCard.tsx:44,77`) |

## 6. Test Data Requirements

- **Provider with references:** `supabase/seed/03_provider_data.sql:419-` seeds 3 references (2 `verified`, 1 `submitted`, 0 `pending`) for the seed provider. The seed contains no `pending` rows at all, so it is the only source of non-`pending` statuses in a fresh DB (the other being the insecure trader UPDATE) — `submitted`/`verified` are never reachable through a real referee flow.
- **Admin user** with `manage_verifications` (super/moderation/ops admin) for review flows.
- **Provider in `pending_review`** to appear in the admin queue (`getVerificationQueue` filters on it, `verification-service.ts:24`).
- For future token tests: a generated single-use token + an expired one.

## 7. Environment Requirements

| Requirement | For | Status |
|-------------|-----|--------|
| Docker + `RUN_DB_TESTS=1` + `vitest.db.config.ts` | integration/RLS db-tests (§2, §S1–S3) | BLOCKED_BY_CONFIGURATION (not run in audit) |
| Playwright + dev server + auth fixtures | E2E (§3) | available |
| `RESEND_API_KEY` | reference-request/reminder email tests | needed once email is implemented (currently NOT_IMPLEMENTED) |
| `INNGEST_SIGNING_KEY` + registered function | reference lifecycle events | needed once Inngest fn exists (NOT_IMPLEMENTED) |
| Supabase (local or remote) with migrations applied | all DB-backed tests | available |

## 8. Coverage Summary (today)

- **Implemented + tested:** the reference *insert* path (U1–U3) and the admin overall-verification path (U4, E1). 10/10 unit tests green.
- **Biggest untested risk:** the INSECURE self-forge (S1/I1) has **no test at all** — the CRITICAL finding is completely unguarded.
- **Entirely absent surfaces (no tests possible yet):** referee submission, tokens, expiry, per-reference admin review, count-gating, reference-request email.
