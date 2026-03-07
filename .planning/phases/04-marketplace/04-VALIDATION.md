---
phase: 4
slug: marketplace
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | `britv3.0/vitest.config.mts` (installed in Phase 1) |
| **Quick run command** | `pnpm test --run` |
| **Full suite command** | `pnpm test --run && pnpm build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run`
- **After every plan wave:** Run `pnpm test --run && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | MKT-01 | unit | `pnpm test --run` | W0 | pending |
| 04-01-02 | 01 | 1 | MKT-02 | unit | `pnpm test --run` | W0 | pending |
| 04-02-01 | 02 | 1 | MKT-03 | unit | `pnpm test --run` | W0 | pending |
| 04-02-02 | 02 | 1 | MKT-04 | unit | `pnpm test --run` | W0 | pending |
| 04-03-01 | 03 | 2 | MKT-05 | unit+integration | `pnpm test --run` | W0 | pending |
| 04-03-02 | 03 | 2 | MKT-06 | unit+integration | `pnpm test --run` | W0 | pending |
| 04-04-01 | 04 | 2 | MKT-07 | unit | `pnpm test --run` | W0 | pending |
| 04-04-02 | 04 | 2 | MKT-08 | unit | `pnpm test --run` | W0 | pending |
| 04-05-01 | 05 | 3 | MKT-09 | unit+integration | `pnpm test --run` | W0 | pending |
| 04-05-02 | 05 | 3 | MKT-10 | unit | `pnpm test --run` | W0 | pending |
| 04-06-01 | 06 | 2 | MKT-11 | unit | `pnpm test --run` | W0 | pending |
| 04-06-02 | 06 | 2 | MKT-12 | unit | `pnpm test --run` | W0 | pending |
| 04-07-01 | 07 | 4 | MKT-13 | integration | `pnpm test --run` | W0 | pending |
| 04-07-02 | 07 | 4 | MKT-13 | integration | `pnpm test --run` | W0 | pending |
| 04-08-01 | 08 | 4 | MKT-14 | integration | `pnpm test --run` | W0 | pending |
| 04-08-02 | 08 | 4 | MKT-14 | integration | `pnpm test --run` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Test files are co-located with their source files, matching the pattern used in plans:

- [ ] `src/services/marketplace/provider-service.test.ts` — stubs for MKT-01, MKT-02 (Plan 03)
- [ ] `src/services/marketplace/rfq-service.test.ts` — stubs for MKT-03, MKT-04 (Plan 04)
- [ ] `src/services/marketplace/quote-service.test.ts` — stubs for MKT-05, MKT-06 (Plan 04)
- [ ] `src/services/marketplace/booking-service.test.ts` — stubs for MKT-07, MKT-08, MKT-09 (Plan 05)
- [ ] `src/services/marketplace/review-service.test.ts` — stubs for MKT-10, MKT-11, MKT-12 (Plan 06)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Map-based coverage area selection | MKT-01 | MapLibre GL interactive drawing | Draw polygon on map, verify area saves |
| Quote comparison side-by-side UI | MKT-06 | Visual layout verification | Create 3+ quotes, verify side-by-side renders |
| Provider document upload flow | MKT-02 | Supabase Storage integration | Upload PDF/image, verify stored and retrievable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
