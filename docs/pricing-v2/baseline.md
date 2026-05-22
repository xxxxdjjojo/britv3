# Britestate Memo Pivot — Phase 0 Baseline

Captured: 2026-05-22
Branch: feat/memo-pivot-full (off main @ 29701a08)

## Test baselines (file counts)
- Unit test files: see baseline output below
- E2E spec files: see baseline output below

## Pre-change facts (from audit Explore agents)
- /pricing page: 4 tabs (Homeowners, Tradespeople, Estate Agents, Landlords)
- Agent plans: Performance £0 / Professional £297/mo / Enterprise £497/mo
- Landlord plans: Essential £19/mo / Professional £49/mo
- Provider plans: Member £47/mo / Professional £97/mo / Elite £197/mo
- PLATFORM_FEE_RATE: flat 2.5% (src/services/provider/provider-payment-service.ts)
- Existing E2E asserts these OLD prices in tests/e2e/pricing-page.spec.ts

## Branch state at Phase 0
- main HEAD: 29701a08 (ci: trigger prod redeploy with framework=nextjs configured)
- Working tree had pre-existing WIP (land-registry workstream) NOT touched by this branch

## Outcome target
- 7 segments: Sellers, Agents, Landlords, Providers, Providers-Niche, Developers, Traders + Boosts
- Banded commission: Provider Listed 12% / Pro 10% / Elite 6%
- Stripe test mode: 7 Products + ~35 Prices
- ≥30 screenshots in docs/pricing-v2/screenshots/
