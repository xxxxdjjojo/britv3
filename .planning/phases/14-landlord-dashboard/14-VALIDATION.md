---
phase: 14
slug: landlord-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 + React Testing Library ^16.3.2 |
| **Config file** | `britv3.0/vitest.config.mts` |
| **Quick run command** | `pnpm test -- --run --reporter=verbose src/__tests__/services/landlord/` |
| **Full suite command** | `pnpm test -- --run` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- --run src/__tests__/services/landlord/`
- **After every plan wave:** Run `pnpm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green + `pnpm build` passes
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | LD-01 | unit | `pnpm test -- --run src/__tests__/services/landlord/portfolio-service.test.ts` | ❌ Wave 0 | ⬜ pending |
| 14-01-02 | 01 | 1 | LD-04 | unit | `pnpm test -- --run src/__tests__/services/landlord/tenant-application-service.test.ts` | ❌ Wave 0 | ⬜ pending |
| 14-01-03 | 01 | 1 | LD-05 | unit | `pnpm test -- --run src/__tests__/services/landlord/financial-service.test.ts` | ❌ Wave 0 | ⬜ pending |
| 14-01-04 | 01 | 1 | LD-06 | unit | `pnpm test -- --run src/__tests__/services/landlord/document-service.test.ts` | ❌ Wave 0 | ⬜ pending |
| 14-01-05 | 01 | 1 | LD-09 | unit | `pnpm test -- --run src/__tests__/services/landlord/financial-service.test.ts` | ❌ Wave 0 | ⬜ pending |
| 14-01-06 | 01 | 1 | LD-10 | unit | `pnpm test -- --run src/__tests__/services/landlord/legal-notice-service.test.ts` | ❌ Wave 0 | ⬜ pending |
| 14-01-07 | 01 | 1 | LD-11 | unit | `pnpm test -- --run src/__tests__/landlord/yield-calculator.test.ts` | ❌ Wave 0 | ⬜ pending |
| 14-01-08 | 01 | 1 | PDF | smoke | `pnpm test -- --run src/__tests__/landlord/section21-pdf.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 14-03-01 | 03 | 2 | LD-01, LD-02 | build | `pnpm build` | — | ⬜ pending |
| 14-04-01 | 04 | 2 | LD-03, LD-04 | build | `pnpm build` | — | ⬜ pending |
| 14-05-01 | 05 | 2 | LD-05, LD-25 | build | `pnpm build` | — | ⬜ pending |
| 14-06-01 | 06 | 3 | LD-06, LD-07 | build | `pnpm build` | — | ⬜ pending |
| 14-07-01 | 07 | 3 | LD-08 | build | `pnpm build` | — | ⬜ pending |
| 14-08-01 | 08 | 3 | LD-09 | build | `pnpm build` | — | ⬜ pending |
| 14-10-01 | 10 | 4 | LD-10, LD-11 | build + unit | `pnpm build && pnpm test -- --run src/__tests__/landlord/` | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/services/landlord/portfolio-service.test.ts` — stubs for LD-01 KPI aggregation
- [ ] `src/__tests__/services/landlord/tenant-application-service.test.ts` — stubs for LD-04 state transitions
- [ ] `src/__tests__/services/landlord/financial-service.test.ts` — stubs for LD-05, LD-09
- [ ] `src/__tests__/services/landlord/document-service.test.ts` — stubs for LD-06
- [ ] `src/__tests__/services/landlord/legal-notice-service.test.ts` — stubs for LD-10 validation logic
- [ ] `src/__tests__/landlord/yield-calculator.test.ts` — stubs for LD-11 pure function
- [ ] `src/__tests__/landlord/section21-pdf.test.tsx` — PDF smoke test stubs
- [ ] `src/__tests__/fixtures/landlord.ts` — shared fixtures (mock tenancies, applications, financial entries)
- [ ] `src/__tests__/mocks/supabase-landlord.ts` — extend existing supabase mock with landlord-specific overrides

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RLS: landlord can only read own tenant_applications | LD-03 | Requires real Supabase RLS evaluation | Supabase MCP: query tenant_applications as another user's JWT, verify empty result |
| RLS: landlord can only read own deposit_registrations | LD-25 | Requires real Supabase RLS evaluation | Same pattern as above |
| Compliance expiry email alerts fire at 30d/7d | LD-07 | Requires cron/background job trigger | Manually set expiry_date = now() + 7 days, trigger cron, verify Resend log |
| Section 21 notice PDF renders correctly in browser | LD-10 | Visual verification | Open notice builder, fill form, download PDF, verify content |
| Stitch design fidelity (dashboard home layout) | LD-01 | Visual verification | Screenshot compare against Stitch reference |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
