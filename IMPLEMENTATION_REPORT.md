# Vouch Gate + Referral Engine — Implementation Report

## Delivery status

This report is the evidence manifest for the five-PR remediation programme. It
must not claim remote validation that has not happened.

| Gate | Status | Evidence |
| --- | --- | --- |
| Canonical audit | Complete | `AUDIT_REPORT.md`, audit commit `df14f932` |
| PostgreSQL/RLS/RPC contracts | Implemented; aggregate run required after final integration | `db-tests/vouch-referral-contracts.test.ts`, additive `20260716*` migrations |
| Routes, attribution, provider access, billing | Implemented; aggregate run required after final integration | Vitest route/service/API suites |
| Desktop/mobile browser proof | Harness implemented; captures pending final UI integration | `playwright.vouch-referral.config.ts`, `e2e/vouch-referral-proof.spec.ts` |
| Lighthouse | Hard median budgets configured; measurements pending final production build | `lighthouserc.vouch-referral*.{json,cjs}` |
| Preview/production deploy | **Blocked** | No repository-linked TrueDeed Supabase branch or Vercel project is available in this workspace |
| In-app browser inspection | **Blocked** | The in-app browser runtime is unavailable in this task environment |

## Deterministic evidence matrix

The localhost-only seed provides `gate_empty`, `gate_3_plus_2`,
`gate_complete`, `grandfathered`, all five provider referral stages, twelve
rolling-cap credits, and valid client/peer, expired, revoked, and invalid token
states. The proof suite runs every browser assertion at exactly 1440×900 and
390×844. Before each capture it verifies route/status, uncaught and console
errors, horizontal overflow, visible labels, 44px button targets, DOM focus
order, and public PII exclusion.

Runtime evidence is written to `test-results/evidence/vouch-referral/` and is
intentionally ignored. `scripts/e2e-vouch-referral-curate.mjs` refuses to curate
an incomplete run, then copies screenshots and their SHA-256/route/fixture/
viewport/commit/timestamp manifest to `docs/screenshots/vouch-referral/`.

## Required final commands

```text
pnpm check:migrations
pnpm check:brand
pnpm check:test-collection
pnpm lint
pnpm typecheck
pnpm test -- --run
pnpm test:db
scripts/e2e-vouch-referral-local.sh
npx --yes @lhci/cli@0.14.x autorun --config=lighthouserc.vouch-referral.json
npx --yes @lhci/cli@0.14.x autorun --config=lighthouserc.vouch-referral-authenticated.cjs
node scripts/e2e-vouch-referral-curate.mjs
```

## Remote release evidence still required

Remote migration and deployment must remain blocked until an isolated Supabase
branch is proven. Once available, record the integration commit, migration
versions, preview URL, Vercel deployment ID, production rollback deployment,
test results, Lighthouse medians, screenshot manifest, PostHog events, Stripe
credit uniqueness, and Inngest retry status here. Configure the repository
variable `VOUCH_PUBLIC_SLUG` to a genuine consented 3+3 production provider so
the required post-deploy smoke cannot silently skip the public proof.

## Integration addendum (2026-07-17)

PRs 1–5 were integrated onto `codex/vouch-referral-integration` and hardened
after a four-domain security review (access gate, Stripe credits, DB/RLS,
routes/UI). Post-integration fixes applied on this branch:

- **Security coverage restored** — `tests/security/rls-audit.test.ts` (whole-schema
  RLS-enabled + policy-present audit) had been dropped by the test-collection-root
  refactor. Relocated to `db-tests/rls-audit.test.ts` and extended `SENSITIVE_TABLES`
  with `vouch_requests`, `vouches`, `referral_credits`, `fraud_flags`.
- **Ambassador badge FK guard** (`20260717090000_referral_badge_fk_guard_and_cleanup.sql`)
  — `provider_badges.provider_id` FK-references `service_provider_details(user_id)`;
  a non-provider referrer reaching 3 conversions would violate the FK and roll back
  the whole `advance_provider_referral`/credit transaction. The badge write is now
  gated behind an existing provider row (trigger + backfill); non-provider conversions
  succeed without a badge. Proven by a red-first DB test. Also dropped a now-inert
  legacy `referrals` insert policy.
- **Provider access dead-end fixed** — a `service_provider`-role user with no
  `service_provider_details` row is now treated as onboarding-incomplete (allowed on
  safe paths, denied business paths) instead of hard-503 on every route. Genuine DB
  errors still surface as 503. Gate not weakened.
- **Gate progress card surfaced** — the six-slot `VouchGateProgress` card is now
  rendered first on `/dashboard/provider/verification` (the incomplete-provider
  landing), fed by `getVouchGateStatus` + `listVouchRequests`.
- **Guard/contract reconciliation** — 7 repo guards updated to the feature's
  intended behavior (boost now gated not exempt; Stripe idempotency asserted at the
  durable-worker layer; new public routes allow-listed off-nav; brand-green CTAs on
  `/join` + `/vouch`).

### Known limitation — refund clawback (deliberate deferral)

`charge.refunded` does not transition a referral credit to `voided`. If a referred
provider's first paid invoice is later refunded, the already-applied Stripe credit
remains and continues to consume a slot in the rolling 12-per-12-month cap. This is
a **deliberate product deferral** (reversing a granted credit moves real money and
was outside PR4's scope) — not an oversight. Revisit as a follow-up if credit
clawback-on-refund is desired.

### Local verification (this branch)

- `pnpm typecheck` → exit 0
- `pnpm check:test-collection` → 868 files, one runner each
- `pnpm exec vitest run` → 6187 passed / 28 skipped / 102 todo; **1 pre-existing
  unrelated flake** (`src/services/truedeed/ppd-match-service.test.ts`, happy-dom
  async-teardown timeout, byte-identical to `main`)
- DB suite (Docker harness) → credit-ledger / badge / engine green
- `next build` deferred to CI/Vercel preview.
