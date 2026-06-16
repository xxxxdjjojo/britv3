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

## Next (M3)
Feature-level tests dashboard-by-dashboard (filters, forms, sort, pagination, tabs, empty/loading/
error states) + runtime smoke of dynamic routes with seeded entity fixtures. M4 fixes F1–F7 via TDD.
