---
phase: 5
slug: ai-financial-tools
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| **Config file** | `britv3.0/vitest.config.mts` |
| **Quick run command** | `cd britv3.0 && pnpm test:run` |
| **Full suite command** | `cd britv3.0 && pnpm test:run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd britv3.0 && pnpm test:run`
- **After every plan wave:** Run `cd britv3.0 && pnpm test:run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | AI-01 | unit | `cd britv3.0 && pnpm vitest run src/services/ai/claude-service.test.ts` | W0 | pending |
| 05-01-02 | 01 | 1 | AI-02 | integration | `cd britv3.0 && pnpm vitest run src/services/ai/description-generator.test.ts` | W0 | pending |
| 05-01-03 | 01 | 1 | AI-06 | unit | `cd britv3.0 && pnpm vitest run src/components/ai/AiFeedback.test.tsx` | W0 | pending |
| 05-02-01 | 02 | 1 | FIN-01 | unit | `cd britv3.0 && pnpm vitest run src/lib/calculators/mortgage.test.ts` | W0 | pending |
| 05-02-02 | 02 | 1 | FIN-02 | unit | `cd britv3.0 && pnpm vitest run src/lib/calculators/sdlt.test.ts` | W0 | pending |
| 05-02-03 | 02 | 1 | FIN-05 | unit | `cd britv3.0 && pnpm vitest run src/lib/calculators/sdlt-rates.test.ts` | W0 | pending |
| 05-04-01 | 04 | 2 | FIN-03 | unit | `cd britv3.0 && pnpm vitest run src/hooks/useMortgageParams.test.ts` | W0 | pending |
| 05-04-02 | 04 | 2 | FIN-04 | unit | `cd britv3.0 && pnpm vitest run src/components/calculators/PersonalizedEstimate.test.tsx` | W0 | pending |
| 05-04-03 | 04 | 2 | FIN-06 | unit | `cd britv3.0 && pnpm vitest run src/components/property/OfferLetterPdf.test.tsx` | W0 | pending |
| 05-03-01 | 03 | 2 | AI-03 | unit | `cd britv3.0 && pnpm vitest run src/services/recommendations/recommendations.test.ts` | W0 | pending |
| 05-03-02 | 03 | 2 | AI-04 | unit | `cd britv3.0 && pnpm vitest run src/services/land-registry/land-registry.test.ts` | W0 | pending |
| 05-03-03 | 03 | 2 | AI-05 | unit | `cd britv3.0 && pnpm vitest run src/services/smart-replies/smart-replies.test.ts` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/services/ai/claude-service.test.ts` — mock Anthropic SDK, test rate limiting, token tracking, kill switch
- [ ] `src/services/ai/description-generator.test.ts` — test 3 tones, max 3 regenerations
- [ ] `src/lib/calculators/mortgage.test.ts` — known correct values (200K @ 5% / 25yr = 1169.18), edge cases (0% rate, 0 deposit)
- [ ] `src/lib/calculators/sdlt.test.ts` — all 3 buyer types at various price points, cross-reference HMRC
- [ ] `src/lib/calculators/sdlt-rates.test.ts` — validate rate bands match current HMRC rates
- [ ] `src/hooks/useMortgageParams.test.ts` — localStorage mock for save/load/clear
- [ ] `src/components/calculators/PersonalizedEstimate.test.tsx` — renders estimate when params exist, nothing when absent
- [ ] `src/components/ai/AiFeedback.test.tsx` — stores rating + optional comment
- [ ] `src/services/recommendations/recommendations.test.ts` — SQL matching excludes viewed/saved/dismissed
- [ ] `src/services/land-registry/land-registry.test.ts` — postcode lookup returns correct data
- [ ] `src/services/smart-replies/smart-replies.test.ts` — keyword matching returns correct suggestions
- [ ] `src/components/property/OfferLetterPdf.test.tsx` — PDF renders without errors

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AI description quality in British English | AI-02 | Subjective quality assessment | Generate descriptions for 3 property types, verify tone and accuracy |
| Price trend chart visual rendering | AI-04 | Visual layout verification | Load property detail page with Land Registry data, verify chart renders |
| PDF visual layout | FIN-06 | Visual document formatting | Generate offer letter, open PDF, verify formatting and content |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
