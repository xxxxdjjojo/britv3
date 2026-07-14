# Testing & Guard Layer

**Owner:** [INFORMATION REQUIRED]

Two things keep this system honest over time: **failure-mode tests** that pin how each integration behaves when its dependency misbehaves, and a **CI guard layer** that fails the build when docs or routes drift from the code. This document inventories both, and records where a documented behaviour has *no* test yet (those land in `14-open-risks.md`, never silently).

## Failure-mode tests (the "what happens when it breaks" suite)

Happy paths were already covered. PR 12 backfilled the failure modes that turn a small incident into a large one — forged webhooks, duplicate deliveries, a rate-limiter with Redis down, and dependency pings during an outage.

| Failure mode | Test | What it pins |
|---|---|---|
| Stripe webhook — forged/invalid signature | `src/app/api/webhooks/stripe/route.test.ts` | `constructEvent` throw → 400 **before** the service-role client or idempotency claim run; missing `stripe-signature` → 400 |
| Stripe webhook — duplicate delivery | `src/app/api/webhooks/stripe/route.test.ts` | already-processed claim (`should_process=false`) → 200 no-op, no re-dispatch; claim write failure → 500 (Stripe retries) |
| `claim_billing_event` — double-claim idempotency | `src/services/billing/billing-events.test.ts` | helper contract (fresh → `should_process=true`; re-claim of processed → `false`; still-processing → `true`); **SQL contract**: `should_process = (status <> 'processed')`, `ON CONFLICT` preserves a processed row, `attempt_count` increments, `service_role`-only EXECUTE |
| Resend webhook — invalid signature | `src/app/api/webhooks/resend/route.test.ts` | bad signature → 400 with **no DB access**; svix-id idempotency |
| GoCardless webhook — invalid signature | `src/app/api/webhooks/gocardless/route.test.ts` | bad signature → 498 with no processing; missing secret → 500 no verification; event-id idempotency |
| Referencing webhook — invalid signature | `src/app/api/webhooks/referencing/route.test.ts` | adapter reject → 400 with **no admin client created**; matched → 200; unknown ref → 200 `matched:false` (ack, stop retries); outcome write throws → 500 (redeliver) |
| Auth rate limiter — Redis down | `src/__tests__/lib/auth-rate-limiter.test.ts` | **fails CLOSED in production** (unconfigured → deny; request-time throw → deny, never 500); in-memory fallback only outside production |
| Dependency pings — outage | `src/services/admin/health-service.test.ts` | every ping degrades to down/degraded and **never throws**; missing config reported honestly (`Redis: Not configured`, `Supabase: Service not configured`); `getDeepHealthStatus` returns all six even when every dependency is down |
| Diagnostics — degraded data | `src/services/admin/diagnostics-service.test.ts` | classifiers escalate by threshold; `getDiagnostics` degrades to `unknown` (never throws) when a query errors |

### Rate-limiter fail-open vs fail-closed (verified)

The plan flagged this as unverified; it is now pinned by test and behaves as a **deliberate split**, not an accident:

- **`createAuthRateLimiter`** (login, signup, MFA verify, password reset, account deletion) — **fails CLOSED** in production. No Redis → deny; a Redis throw at request time is caught and denied (an uncaught throw would 500 and let the request bypass the limiter on retry). Non-production falls back to a per-instance in-memory limiter so dev/CI work without Upstash.
- **`createRateLimiter`** (non-auth, e.g. email) — **fails OPEN**: no Redis → a no-op limiter that always allows. Availability over abuse-protection where the endpoint isn't security-sensitive.

Operational consequence during an Upstash outage: auth endpoints get stricter (may block legitimate logins — that's the accepted cost), non-auth endpoints lose rate limiting. See `docs/support/features/infra/upstash-redis-down.md` and OR-10.

## CI guard layer (anti-rot)

These guards fail the build when documentation or navigation claims something the code doesn't back. They are the mechanism that stops this pack from decaying into fiction.

| Guard | File | Enforces |
|---|---|---|
| Playbook grounding | `src/__tests__/docs/playbook-grounding.test.ts` | every playbook/runbook's front-matter resolves: `code_paths` exist on disk, `tables` appear in migrations, `tier1_actions` exist in the registry, `alert_rules` are known keys, required headings present |
| Pack completeness | `src/__tests__/docs/production-support-pack.test.ts` | every numbered pack doc + incident doc exists and is non-empty (PR 14 tightens this to "no stub markers remain") |
| Route/orphan integrity | `src/__tests__/navigation/orphan-routes.test.ts` | every route is reachable from nav or explicitly allow-listed |

## Detection coverage — every playbook "Detection" is grounded

Requirement: each feature playbook's Detection must cite an alert rule, a diagnostics signal, or a test — not a hope. Current state:

- **Grounded in an alert rule or diagnostics signal:** uptime, Stripe DLQ/billing, email failure counts, GDPR deadline, provider pings (via `alert-rules.ts` + `diagnostics-service.ts`).
- **Grounded in a test only (no dedicated alert rule):** webhook signature rejection, rate-limiter fail-closed, health-ping degradation — Detection points at Sentry (`module:*` tags) + the tests above.
- **Not yet detectable (surfaced as open risk, not faked):**
  - **Bounce → suppression** — the Resend webhook records `email_logs.status='bounced'` but does **not** feed a suppression list; repeat sends to a hard-bounced address are not auto-blocked. No test asserts suppression because the path doesn't exist. → **OR-14**.
  - **AI cost/usage anomaly** — there is no `ai_usage` table, so `ai.cost_spike` has no data source and cannot fire. The AI playbooks (`docs/support/features/ai/*`) carry empty `alert_rules`/`tables` honestly. → **OR-15**.

## Running the suite

```bash
pnpm test                 # full Vitest suite (unit + colocated route/service tests)
pnpm exec vitest run src/__tests__/docs   # grounding + pack guards only
pnpm check:migrations     # migration prefix/collision guard
pnpm lint && pnpm build   # required-green before any land
```
