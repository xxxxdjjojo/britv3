# ADR-007 — Pricing v2 Memo Pivot

- **Status:** Accepted
- **Date:** 2026-05-22
- **Memo:** `/Users/jojominime/britv3/docs/britestate_strategy_memo.md`

## Context

The pre-pivot model priced Britestate as a SaaS with three roles (Agent
£0/£297/£497, Landlord £19/£49, Provider £47/£97/£197) and a flat 2.5%
marketplace commission. The memo identified this as "hostile pricing":
agents see Britestate as a cost without a guaranteed pipeline; sellers
have no entry product; providers self-select OFF the platform if they
have any volume. The recommendation: pivot to a Hemnet-style
seller-pays model with banded marketplace commission, hand-picked seed
supply, and AI-driven acquisition.

## Decision

Replace the 3-role schema with a 7-segment schema:

| Segment | Tiers | Commission |
|---|---|---|
| Sellers (one-off) | Basic £99 / Plus £249 / Premium £449 / NSNF £0 | 0.50% / 0.35% / 0.25% / 1.00% on completion |
| Agents | Listed £0 / Pro £99 / Elite £349 | Rev-share 70/30, 85/15 on Britestate leads |
| Landlords | Free £0 / Essential £15 / Pro £39 / Portfolio £99 | 8–10% of first-month rent |
| Providers | Listed £0 / Pro £39 / Elite £149 | 12% / 10% / 6% per job |
| Niche pros | Conveyancer £79 / Surveyor £79 / Mortgage broker £49 | 6% / 6% / £35 per qualified lead |
| Developers | Single £299 / Multi £799 / Enterprise £1,999 | 0.25% / 0.20% / 0.15% on completion |
| Traders | Pro £99 / Elite £299 | 0.50% on resale |
| Boosts | 7d / 14d / 30d / AI Valuation / Story / Digest | (one-off) £15 / £25 / £45 / £29 / £79 / £39 |

Sellers funnel A/B-tests `basic` (control) vs `plus` (treatment) as the
default-highlighted tier. Marketplace commission switches from flat
2.5% to tier-banded via `calculatePlatformFee({ grossAmountPence,
providerPlanId })`.

Operational scaffolds — programmatic SEO (`/services-near/[service]/[postcode]`),
AI SDR (`/admin/sdr` + queue), invite-only signup (`/signup?invite=…`)
and a pricing-review analytics dashboard (`/admin/pricing-review`) —
are built in the same PR so the entire memo executes as one cycle.

## Alternatives considered

1. **Additive (keep old tiers, add new)** — rejected because the memo
   explicitly identifies the old pricing as the problem; running both
   creates double-listings on `/pricing` and shadow conversion bias.
2. **Feature-flagged rollout** — rejected for the same reason. The
   pricing UI tells the brand story; ambiguity here is worse than a
   one-shot cutover.
3. **Defer A/B, fees, programmatic SEO and SDR to follow-up PRs** —
   rejected because the memo is explicit that the 90-day plan is a
   single execution arc; splitting it leaves the seller-pays funnel
   ungated by analytics and the commission story uncalibrated.

## Consequences

**Positive**

- Single source of truth (`billing-config.ts`) drives `/pricing`,
  fee transparency, dashboards, Stripe price ID allowlist, and the
  Stripe provisioning script.
- Existing subscribers retain entitlements: legacy plan ids
  (`agent_professional`, `provider_member`, etc.) stay mapped in
  `plan-entitlements.ts`.
- Stripe test mode mirrored 1:1 — `verify-pricing-v2.ts` exit-codes on drift.

**Negative / risks**

- Legacy `agent_professional` (£297) subscribers see a £99 plan in the
  UI. A grandfathering decision (proration / credit / contact) is a
  business workflow, not a code one — flagged for billing ops follow-up.
- The flat 0.025 PLATFORM_FEE_RATE remains in `provider-payment-service.ts`
  for legacy display paths that have no recorded plan id. New transaction
  creation should use `calculatePlatformFee`. A future PR should
  retro-record the rate on each transaction row.
- Programmatic SEO ships 516 pre-rendered routes (cartesian of the
  default postcode/service set). Scaling to 10K requires running
  `scripts/seo/build-postcode-service-matrix.mjs` against Land Registry
  data and re-deploying.

## Rollback

1. `git revert` the memo-pivot branch.
2. Remove the new Stripe Products in test mode (or leave — they're
   idempotent and inert without env-var wiring).
3. Restore `tests/e2e/pricing-page.spec.ts` from history if needed
   (it's orphaned outside Playwright's testDir, so safe to ignore).

No migration data needs reverting — none of the new tables are
populated until the SDR or invite-only flows are used.
