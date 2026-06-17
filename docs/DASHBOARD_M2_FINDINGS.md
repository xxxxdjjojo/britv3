# Milestone 2 — Route/Nav/Smoke Tests: Results & Findings

> Output of M2 (automated route/nav/smoke for all 200 dashboard pages). Branch
> `test/dashboard-m2-smoke`. Companion to [`DASHBOARD_SCAFFOLDING.md`](./DASHBOARD_SCAFFOLDING.md)
> and [`DASHBOARD_TEST_MATRIX.md`](./DASHBOARD_TEST_MATRIX.md). Generated 2026-06-16.

## What was added

| Suite | File | Needs server? | Coverage |
|---|---|---|---|
| Route-contract (manifest) | `src/__tests__/routes/route-manifest.ts` + `route-contract.test.ts` | No (Vitest, pure fs) | 13 tests: every nav href resolves to a real page, route counts match fs (166 dashboard + 34 admin), nav→page parity guard (211-entry off-nav allowlist; a new unwired page fails the test) |
| Per-role static smoke | `e2e/dashboard-smoke.spec.ts` + `e2e/fixtures/smoke-helpers.ts` | Yes (Playwright + hosted Supabase) | **253 static routes across all 7 roles** — status <400, no app-error, visible heading, no unexpected console errors |
| Admin smoke + gating | `e2e/admin-smoke.spec.ts` | Yes | 30 static admin routes render as admin; non-admin redirected to `/forbidden` (no admin route reachable) |
| Negative-path access | `e2e/dashboard-access.spec.ts` | Yes | unknown route → 404 `not-found`; unauthenticated → `/login?redirectTo=`; authenticated cross-role → own dashboard |
| Seed | `supabase/seed/seed-test-users.ts` | — | added `renter` + `mortgage_broker` users; added `service_provider_details` for the E2E provider user |

## Coverage summary

- **Static dashboard + admin pages asserted:** 253 (role) + 30 (admin) = **283 page renders**.
- **Passing:** 275. **`test.fixme` (real bugs, tracked below):** 8.
- **Dynamic routes (`[id]`, `[propertyId]`, …):** page modules confirmed to exist (route-contract);
  **runtime smoke deferred to M3** (needs seeded entity-ID fixtures). This is an explicit, non-silent
  exclusion — listed, not hidden.
- All 7 roles authenticate; admin gating holds; no negative-path control is missing.

## Findings — real app bugs (for M4; NOT fixed in M2)

These are genuine defects the smoke suite caught. Each failing route is `test.fixme`'d with a
`// FINDING:` comment so the suite stays green while the breakage is explicitly tracked — never
masked by loosening assertions or broadening the console allowlist.

| # | Severity | Route(s) | Symptom | Root cause |
|---|---|---|---|---|
| F1 | High | all `service_provider` routes | redirect to dead `/onboarding/provider` → 404 when provider has no record | `(protected)/dashboard/provider/layout.tsx` catches `resolveProviderId` throw and redirects to `/onboarding/provider`, which doesn't exist (real path `/register/onboarding/provider`). *Coverage recovered by seeding a provider record; the dead-redirect bug remains.* |
| F2 | High | `/admin/email-campaigns` | HTTP 500, server component crashes | failing `email_campaigns` query (blank body) |
| F3 | High | `/admin/verifications` | server query throws | `column profiles.full_name does not exist` (`admin:verification-service`) |
| F4 | High | `/admin/moderation` | server query throws | `column properties.status does not exist` (`admin:listing-service`) |
| F5 | High | `/admin/subscriptions` | server query throws | `column subscriptions.plan does not exist` (`admin:subscription-service`) |
| F6 | Medium | `/dashboard/landlord/finance/expenses`, `/finance/report` | data query throws (shell renders) | `column properties_1.address_line_1 does not exist` |
| F7 | Medium | `/dashboard/landlord/tenants`, `/dashboard/agent/crm` | React hydration error | invalid DOM: `<button>` nested inside `<button>` |

### Cross-cutting pattern (highest-value systemic finding)
**F3–F6 are all schema drift** — the app queries columns the hosted DB does not have
(`profiles.full_name`, `properties.status`, `subscriptions.plan`, `properties.address_line_1`). This
points to the application code and the hosted `ynkqzzpcbpphjczmrfva` schema having drifted apart.
Worth a dedicated schema-reconciliation pass before M4 page-by-page fixes.

### Secondary observations (not asserted, noted for follow-up)
- **DB/migration drift:** `mortgage_broker` is missing from the on-disk `user_role` enum migration
  (`001_foundation.sql`), though the hosted DB already has it. A fresh `supabase db reset` from the
  migrations on disk would lack it and break the seed.
- **Bogus role segment:** `/dashboard/__bogus_role__` (authenticated) returns 200 at the unchanged
  URL instead of redirecting to `/dashboard` as `[role]/layout.tsx`'s invalid-role branch implies —
  middleware appears to handle the segment before the layout. Worth a look.
- **Console allowlist (minor):** bare `stripe`/`posthog`/`sentry` substrings could, in theory, mask a
  real crash on a page whose own error text contains those words (e.g. a billing page). Consider
  anchoring to vendor URLs in a later hardening pass.

## How to run

```bash
cd <worktree or britv3>
pnpm test src/__tests__/routes                                   # route-contract (no server)
pnpm test:e2e dashboard-smoke admin-smoke dashboard-access --project=chromium   # live smoke
```
Live smoke requires the dev server (Playwright auto-starts `pnpm dev`) and the hosted Supabase with
all-role seed users. Runtime ≈ 6–8 min; `retries: 2` (scoped, not global) absorbs hosted-DB transient
fetch flake — it cannot green the deterministic F1–F7 failures.

## ⚠️ E2E determinism caveat (important)

The live smoke specs run against the **shared hosted Supabase** (`ynkqzzpcbpphjczmrfva`), which other
processes/sessions actively use. Observed consequence: each E2E spec passed when run in isolation
(e.g. provider 46/46 immediately after seeding the provider record), but a later **consolidated
full-suite re-run regressed** — provider routes 404'd again and the overall pass count dropped —
without any code change. Root cause is environmental: concurrent mutation of the shared DB
(the same churn that switched git branches mid-task) and hosted-DB transient flake under full-suite
load. The `retries: 2` absorbs single-request transients but not data that disappears between specs.

**Implication:** the E2E **test code is correct and committed**, and the **route-contract suite is
deterministically green (13/13, server-less)**. But E2E pass/fail is **not reproducible** against a
shared hosted project. These smoke specs belong in **CI with a dedicated/ephemeral Supabase** (or a
local instance) seeded fresh per run — not a shared hosted DB driven by multiple agents. Until then,
treat the E2E suite as a coverage scaffold whose green status must be read per-isolated-run, and
prioritise standing up an isolated test DB before relying on it as a gate.

## Milestone 3 — feature-level component/unit tests (delivered)

10 parallel agents wrote **deterministic Vitest + Testing-Library tests** (existing mocks, no hosted
DB) across all dashboard areas — `src/__tests__/m3/<area>/`. **726 passing, 4 skip, 42 `it.todo`,
76 files.** The `it.todo`/skip are genuine environment limits, not dropped work.

### M3 findings (real bugs / debt — for M4)
| # | Severity | Where | Issue |
|---|---|---|---|
| F8 | Medium (a11y) | `ClientList`, `NegotiationThread`, `ArchivedDraftListings` + others using `DialogTrigger asChild` | base-ui `*Trigger asChild` around a `<Button>` → **nested `<button>`** (invalid DOM; same class as F7); `asChild` is effectively a no-op in the wrapper. |
| F9 | Medium (UX) | `ProviderProfileForm` | empty pricing `<input>` → `valueAsNumber` = `NaN` → fails optional `z.number()` → submit **silently blocked, no error shown**. |
| F10 | Low (testability) | `[role]/calculators/page.tsx`, `tools/buy-vs-rent-calculator` | affordability (×4.5 stress) + buy-vs-rent logic **trapped inline in `useMemo`** → not unit-testable. Extract to `src/lib/calculators/`. (mortgage, SDLT, LBTT/LTT, yield ARE extracted + covered: 38 unit tests.) |
| F11 | Low (scope) | `src/components/provider/` | PRD-implied `VerificationStepper`, `TrustScoreGauge`, badges, references UI, service-area map editor, portfolio gallery **don't exist** — only `DocumentUpload`, `AvailabilityCalendar`, `ProviderProfileForm`. |

### M3 tooling notes
- **`@testing-library/user-event` is not installed** — all tests use `fireEvent`.
- **happy-dom can't drive base-ui `Select`/`Slider`/`Checkbox`-in-`<label>`** → the 42 `it.todo`s are
  these interaction paths; they need a real-browser runner (Playwright component tests), not more unit work.

## Milestone 4 — bug fixes (in progress)

**Fixed via TDD (Class A — frontend/logic, deterministic, no DB):**
| # | Fix | Commit |
|---|---|---|
| F1 | provider `layout.tsx` redirect → `/register/onboarding/provider` (real route); guarded by a route-manifest test | `b82258ae` |
| F7 + F8 | `DialogTrigger`/`AlertDialogTrigger` now honor `asChild` via base-ui `render` prop → no more nested `<button>` **app-wide** (fixes `NegotiationThread`, `ClientList`, `ViewingCalendar`, …) | `79c12332` |
| F9 | `ProviderProfileForm` pricing inputs use `setValueAs` (empty → `undefined`) so an otherwise-valid submit isn't silently blocked | `bbfeb4d0` |

New regression tests added (dialog-trigger, provider-form-pricing, onboarding-redirect); the M3 tests
that had documented these bugs were updated to assert the fixed behavior. Full sweep: 737 tests green.

**Deferred (decision 2026-06-17):**
- **F2–F6 (schema drift)** → a **dedicated schema-reconciliation pass against an isolated/ephemeral
  Supabase**. Not fixed inline: the correct fix (query rename vs missing-migration) can't be
  determined from code alone (migrations are internally inconsistent re `full_name` vs
  `first_name/last_name`), and verifying requires a reliable DB — the hosted one is shared/churned,
  the local one is broken. Do NOT guess column renames or write migrations to the shared DB.
- **F10 (calculator extraction)** → bundle with a later code-quality pass (debt, not a runtime bug).
- **F11 (missing provider components)** → feature work, not a bug fix; out of M4 scope.

**Still needed:** stand up an isolated/ephemeral Supabase (unblocks F2–F6 and makes the M2 E2E smoke a
reliable gate), and add Playwright component/browser tests to close the base-ui interaction `it.todo`s.

## Milestone 5 — hosted-vs-local schema reconciliation (Task 1, delivered)

Full read-only introspection of hosted `ynkqzzpcbpphjczmrfva` vs the clean local `db reset` baseline.
**Report: [`DASHBOARD_HOSTED_RECONCILIATION.md`](./DASHBOARD_HOSTED_RECONCILIATION.md).** Headlines:

- **Every `251d34dd` migration edit is SAFE and needs no hosted change** — each one aligned an on-disk
  migration *to* hosted reality (verified column-by-column: hosted has `profiles.is_admin` not `role`,
  `display_name` not `full_name`; no `properties.status/slug/address_line_1`; no `subscriptions.plan`;
  `price/status` on `listings`; `audit_logs`/`agency_leads`/`agents`/`rental_listings` never existed).
  Do not revert them.
- **F2–F6 are app-query bugs, now fixed** (`79d41288`) against real hosted columns — verified correct.
  F2 `email_campaigns.content` jsonb; F3 `profiles.display_name`; F5 `subscriptions.plan_name`;
  F6 `properties.address_line1`. **F2/F3/F5/F6 resolved.**
- **F4 needs one hosted change:** hosted has `listing_moderation.listing_id` but **no FK to `listings`**;
  the corrected query embeds via PostgREST and requires it. Migration
  `20260617000000_listing_moderation_listing_fk.sql` adds it; verified safe (hosted table is 0 rows /
  0 orphans). **Propose to user; apply with approval only.** Until applied, `/admin/moderation` still
  fails in production.
- **Broader bidirectional drift** (11 hosted-only tables from other branches, 3 local-only tables,
  column drift on shared tables incl. `deposit_registrations` diverging *both* ways, enum drift) is
  pre-existing and out of scope — needs a deliberate migration-baseline reconciliation, not a
  blind apply.
- **Local seed gap (Task 2 blocker):** on-disk `user_role` enum lacks `mortgage_broker` (hosted has it),
  so the seed's broker user fails the enum cast on a fresh local `db reset`. Fix on-disk with
  `ALTER TYPE … ADD VALUE IF NOT EXISTS 'mortgage_broker'` (no-op on hosted). Addressed in Task 2.
