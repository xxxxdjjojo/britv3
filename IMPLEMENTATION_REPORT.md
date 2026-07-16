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
