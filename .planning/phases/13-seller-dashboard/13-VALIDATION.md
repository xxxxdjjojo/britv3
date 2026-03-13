---
phase: 13
slug: seller-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 + happy-dom |
| **Config file** | `vitest.config.mts` (repo root) |
| **Quick run command** | `pnpm test --run src/__tests__/seller/` |
| **Full suite command** | `pnpm test --run` |
| **E2E framework** | Playwright ^1.58.2 |
| **E2E quick run** | `pnpm test:e2e --grep "seller"` |
| **E2E full suite** | `pnpm test:e2e` |
| **Estimated runtime** | ~15 seconds (unit) / ~60 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run src/__tests__/seller/`
- **After every plan wave:** Run `pnpm test --run`
- **Before `/gsd:verify-work`:** `pnpm test --run && pnpm build` — both must pass
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-* | 01 | 1 | SELL-01,02,03,05,06,07,08 | unit | `pnpm test --run src/__tests__/seller/listing-service.test.ts` | ❌ W0 | ⬜ pending |
| 13-02-* | 02 | 2 | SELL-16,17,18 | unit | `pnpm test --run src/__tests__/seller/ai-description.test.ts` | ❌ W0 | ⬜ pending |
| 13-03-* | 03 | 3 | SELL-01,02 | unit | `pnpm test --run src/__tests__/seller/dashboard-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 13-04-* | 04 | 3 | SELL-03,16,17 | unit | `pnpm test --run src/__tests__/seller/wizard-state.test.ts` | ❌ W0 | ⬜ pending |
| 13-05-* | 05 | 3 | SELL-03,18 | unit | `pnpm test --run src/__tests__/seller/listing-service.test.ts` | ❌ W0 | ⬜ pending |
| 13-06-* | 06 | 4 | SELL-04 | unit | `pnpm test --run src/__tests__/seller/analytics-service.test.ts` | ❌ W0 | ⬜ pending |
| 13-07-* | 07 | 4 | SELL-05 | unit | `pnpm test --run src/__tests__/seller/viewing-transitions.test.ts` | ❌ W0 | ⬜ pending |
| 13-08-* | 08 | 4 | SELL-06,07 | unit | `pnpm test --run src/__tests__/seller/offer-state-machine.test.ts` | ❌ W0 | ⬜ pending |
| 13-09-* | 09 | 5 | SELL-08 | unit | `pnpm test --run src/__tests__/seller/sale-progression.test.ts` | ❌ W0 | ⬜ pending |
| 13-10-* | 10 | 5 | SELL-09,10,11 | unit | `pnpm test --run src/__tests__/seller/land-registry-parser.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All seller test files are new (no existing seller tests detected):

- [ ] `src/__tests__/seller/dashboard-kpis.test.ts` — stubs for SELL-01
- [ ] `src/__tests__/seller/listing-service.test.ts` — stubs for SELL-02, SELL-18
- [ ] `src/__tests__/seller/wizard-state.test.ts` — stubs for SELL-03
- [ ] `src/__tests__/seller/analytics-service.test.ts` — stubs for SELL-04
- [ ] `src/__tests__/seller/viewing-transitions.test.ts` — stubs for SELL-05
- [ ] `src/__tests__/seller/offer-card.test.tsx` — stubs for SELL-06
- [ ] `src/__tests__/seller/offer-state-machine.test.ts` — stubs for SELL-07
- [ ] `src/__tests__/seller/sale-progression.test.ts` — stubs for SELL-08
- [ ] `src/__tests__/seller/land-registry-parser.test.ts` — stubs for SELL-09
- [ ] `src/__tests__/seller/agent-search.test.ts` — stubs for SELL-10
- [ ] `src/__tests__/seller/agent-compare.test.tsx` — stubs for SELL-11
- [ ] `src/__tests__/seller/ai-description.test.ts` — stubs for SELL-16
- [ ] `src/__tests__/seller/photo-upload.test.ts` — stubs for SELL-17

*Framework already installed: Vitest ^4.0.18 + happy-dom — no additional setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard KPI chart renders correct 30-day shape | SELL-01 | Visual chart rendering | Open seller dashboard, verify AreaChart shows 30 data points |
| Listing photos display in correct order after drag-reorder | SELL-12 | DnD visual interaction | Upload 3+ photos, drag to reorder, verify order persists on save |
| AI description tones produce visually distinct copy | SELL-13 | Qualitative content review | Trigger AI generation, compare Professional/Friendly/Luxury tones |
| Sale progression timeline renders correct active stage | SELL-14 | Visual state machine UI | Navigate to sale progression, verify correct stage highlighted |
| Agent comparison table is readable at mobile breakpoint | SELL-15 | Responsive layout | Open agent comparison on 375px viewport, verify no overflow |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
