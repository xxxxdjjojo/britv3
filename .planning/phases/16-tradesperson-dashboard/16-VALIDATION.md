---
phase: 16
slug: tradesperson-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 1.x (unit), Playwright (E2E) |
| **Config file** | `britv3.0/vitest.config.ts` (Wave 0 installs if absent) |
| **Quick run command** | `pnpm --filter britv3.0 test --run` |
| **Full suite command** | `pnpm --filter britv3.0 test --run && pnpm --filter britv3.0 build` |
| **Estimated runtime** | ~30 seconds (unit) / ~120 seconds (with build) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter britv3.0 test --run`
- **After every plan wave:** Run `pnpm --filter britv3.0 test --run && pnpm --filter britv3.0 build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 16-01 | 16-01 | 1 | TPD-01..TPD-25 | unit (types/RLS) | `pnpm test --run src/services/provider` | ⬜ pending |
| 16-02 | 16-02 | 2 | TPD-01, TPD-02, TPD-03 | unit | `pnpm test --run src/services/provider-dashboard` | ⬜ pending |
| 16-03 | 16-03 | 2 | TPD-07, TPD-08, TPD-09 | unit | `pnpm test --run src/services/provider-job` | ⬜ pending |
| 16-04 | 16-04 | 2 | TPD-10, TPD-11, TPD-12, TPD-24, TPD-25 | unit | `pnpm test --run src/services/provider-payment` | ⬜ pending |
| 16-05 | 16-05 | 3 | TPD-01, TPD-02 | build + lint | `pnpm build 2>&1 | grep -c error` | ⬜ pending |
| 16-06 | 16-06 | 3 | TPD-03, TPD-04, TPD-05 | build + lint | `pnpm build 2>&1 | grep -c error` | ⬜ pending |
| 16-07 | 16-07 | 3 | TPD-04, TPD-05, TPD-06 | build + lint | `pnpm build 2>&1 | grep -c error` | ⬜ pending |
| 16-08 | 16-08 | 4 | TPD-07 | build + lint | `pnpm build 2>&1 | grep -c error` | ⬜ pending |
| 16-09 | 16-09 | 4 | TPD-08, TPD-09 | build + lint | `pnpm build 2>&1 | grep -c error` | ⬜ pending |
| 16-10 | 16-10 | 4 | TPD-10 | build + lint | `pnpm build 2>&1 | grep -c error` | ⬜ pending |
| 16-11 | 16-11 | 5 | TPD-11, TPD-12, TPD-13 | build + lint | `pnpm build 2>&1 | grep -c error` | ⬜ pending |
| 16-12 | 16-12 | 5 | TPD-14, TPD-15, TPD-24, TPD-25 | build + lint | `pnpm build 2>&1 | grep -c error` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `britv3.0/src/services/provider/__tests__/provider-dashboard-service.test.ts` — stubs for TPD-01
- [ ] `britv3.0/src/services/provider/__tests__/provider-verification-service.test.ts` — stubs for TPD-03, TPD-04, TPD-05
- [ ] `britv3.0/src/services/provider/__tests__/provider-job-service.test.ts` — stubs for TPD-07
- [ ] `britv3.0/src/services/provider/__tests__/provider-payment-service.test.ts` — stubs for TPD-10
- [ ] vitest config + test infrastructure — Wave 0 installs if not present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stripe Connect onboarding OAuth redirect | TPD-10 | Requires live Stripe test credentials and OAuth callback | Navigate to Payments page, click Connect Stripe, verify redirect to Stripe OAuth, verify callback creates account record |
| MapLibre polygon drawing saves to Supabase | TPD-05 | Requires interactive map in browser | Open Service Areas page, draw polygon, save, verify coordinates stored in provider_service_areas table |
| PDF invoice download is correct | TPD-09 | PDF rendering visual verification | Complete a job, generate invoice, download PDF, verify line items, totals, and branding match design |
| Verification document upload processes | TPD-03, TPD-04 | Requires Supabase Storage in test env | Upload Gas Safe certificate, verify file stored in storage, status changes to "Pending Review" |
| Review response appears publicly | TPD-12, TPD-13 | Requires full public profile view | Respond to a review, visit public provider profile, verify response shows under the review |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
