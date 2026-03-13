---
phase: 17
slug: service-provider-public-profiles
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x + happy-dom |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `cd britv3.0 && pnpm test --run` |
| **Full suite command** | `cd britv3.0 && pnpm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd britv3.0 && pnpm test --run`
- **After every plan wave:** Run `cd britv3.0 && pnpm test && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green + `pnpm build` succeeds
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | PROF-01–14 | unit | `pnpm test --run src/__tests__/providers/metadata.test.ts` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | PROF-01–14 | unit | `pnpm test --run src/__tests__/providers/jsonld.test.ts` | ❌ W0 | ⬜ pending |
| 17-02-01 | 02 | 2 | PROF-01 | unit | `pnpm test --run src/__tests__/providers/TradespersonProfile.test.tsx` | ❌ W0 | ⬜ pending |
| 17-03-01 | 03 | 2 | PROF-02 | unit | `pnpm test --run src/__tests__/providers/ReviewsTab.test.tsx` | ❌ W0 | ⬜ pending |
| 17-03-02 | 03 | 2 | PROF-03 | unit | `pnpm test --run src/__tests__/providers/PortfolioTab.test.tsx` | ❌ W0 | ⬜ pending |
| 17-03-03 | 03 | 2 | PROF-04 | unit | `pnpm test --run src/__tests__/providers/ServicesTab.test.tsx` | ❌ W0 | ⬜ pending |
| 17-03-04 | 03 | 2 | PROF-05 | unit | `pnpm test --run src/__tests__/providers/QuoteModal.test.tsx` | ❌ W0 | ⬜ pending |
| 17-04-01 | 04 | 3 | PROF-06 | unit | `pnpm test --run src/__tests__/agents/AgencyProfile.test.tsx` | ❌ W0 | ⬜ pending |
| 17-04-02 | 04 | 3 | PROF-07–08 | unit | `pnpm test --run src/__tests__/agents/ListingsTab.test.tsx` | ❌ W0 | ⬜ pending |
| 17-05-01 | 05 | 3 | PROF-09–10 | unit | `pnpm test --run src/__tests__/agents/AgencyProfile.test.tsx` | ❌ W0 | ⬜ pending |
| 17-05-02 | 05 | 3 | PROF-11 | unit | `pnpm test --run src/__tests__/agents/ValuationForm.test.tsx` | ❌ W0 | ⬜ pending |
| 17-06-01 | 06 | 4 | PROF-12–14 | unit | `pnpm test --run src/__tests__/providers/SpecialistProfile.test.tsx` | ❌ W0 | ⬜ pending |
| 17-07-01 | 07 | 4 | PROF-01–14 | unit | `pnpm test --run src/__tests__/compare/useCompare.test.ts` | ❌ W0 | ⬜ pending |
| 17-08-01 | 08 | 4 | PROF-01–14 | manual | Build check + visual review | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/providers/TradespersonProfile.test.tsx` — stubs for PROF-01
- [ ] `src/__tests__/providers/ReviewsTab.test.tsx` — stubs for PROF-02
- [ ] `src/__tests__/providers/PortfolioTab.test.tsx` — stubs for PROF-03
- [ ] `src/__tests__/providers/ServicesTab.test.tsx` — stubs for PROF-04
- [ ] `src/__tests__/providers/QuoteModal.test.tsx` — stubs for PROF-05
- [ ] `src/__tests__/agents/AgencyProfile.test.tsx` — stubs for PROF-06, PROF-09, PROF-10
- [ ] `src/__tests__/agents/ListingsTab.test.tsx` — stubs for PROF-07, PROF-08
- [ ] `src/__tests__/agents/ValuationForm.test.tsx` — stubs for PROF-11
- [ ] `src/__tests__/providers/SpecialistProfile.test.tsx` — stubs for PROF-12, PROF-13, PROF-14
- [ ] `src/__tests__/compare/useCompare.test.ts` — stubs for compare hook
- [ ] `src/__tests__/providers/jsonld.test.ts` — stubs for JSON-LD output
- [ ] `src/__tests__/providers/metadata.test.ts` — stubs for generateMetadata

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Localized SEO category pages render with ISR | PROF-13 | Requires deployment/preview environment for ISR behavior | Deploy to Vercel preview; curl /services/plumbers/london; check Cache-Control header = s-maxage=3600 |
| OG image renders correctly in social share preview | PROF-10 | Requires external social card renderer | Use opengraph.xyz to preview share card for a provider URL |
| RLS anon access — logged-out visitor sees full profile | PROF-01 | Requires real Supabase anon key test | Open incognito window; navigate to /services/[category]/[slug]; verify data loads |
| JSON-LD validates in Google Rich Results Test | PROF-10 | External validator | Paste page URL into search.google.com/test/rich-results; expect LocalBusiness result |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
