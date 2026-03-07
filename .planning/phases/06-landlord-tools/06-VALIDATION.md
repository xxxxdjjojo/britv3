---
phase: 6
slug: landlord-tools
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + happy-dom |
| **Config file** | `britv3.0/vitest.config.mts` |
| **Quick run command** | `pnpm test:run src/__tests__/landlord/ --reporter=verbose` |
| **Full suite command** | `pnpm test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:run src/__tests__/landlord/ --reporter=verbose`
- **After every plan wave:** Run `pnpm test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | LL-01 | unit | `pnpm test:run src/__tests__/landlord/portfolio.test.ts -x` | No — W0 | pending |
| 06-01-02 | 01 | 1 | LL-02 | unit | `pnpm test:run src/__tests__/landlord/tenancy-form.test.ts -x` | No — W0 | pending |
| 06-02-01 | 02 | 1 | LL-03 | unit | `pnpm test:run src/__tests__/landlord/maintenance.test.ts -x` | No — W0 | pending |
| 06-02-02 | 02 | 1 | LL-04 | unit | `pnpm test:run src/__tests__/landlord/provider-assignment.test.ts -x` | No — W0 | pending |
| 06-03-01 | 03 | 2 | LL-05 | unit | `pnpm test:run src/__tests__/landlord/rent-status.test.ts -x` | No — W0 | pending |
| 06-03-02 | 03 | 2 | LL-06 | unit | `pnpm test:run src/__tests__/landlord/expense.test.ts -x` | No — W0 | pending |
| 06-03-03 | 03 | 2 | LL-07 | unit | `pnpm test:run src/__tests__/landlord/financial-summary.test.ts -x` | No — W0 | pending |
| 06-04-01 | 04 | 2 | LL-08 | unit | `pnpm test:run src/__tests__/landlord/document-upload.test.ts -x` | No — W0 | pending |
| 06-04-02 | 04 | 2 | LL-09 | unit | `pnpm test:run src/__tests__/landlord/compliance-reminders.test.ts -x` | No — W0 | pending |
| 06-04-03 | 04 | 2 | LL-10 | unit | `pnpm test:run src/__tests__/landlord/lease-pdf.test.ts -x` | No — W0 | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/landlord/portfolio.test.ts` — stubs for LL-01
- [ ] `src/__tests__/landlord/tenancy-form.test.ts` — stubs for LL-02
- [ ] `src/__tests__/landlord/maintenance.test.ts` — stubs for LL-03
- [ ] `src/__tests__/landlord/provider-assignment.test.ts` — stubs for LL-04
- [ ] `src/__tests__/landlord/rent-status.test.ts` — stubs for LL-05
- [ ] `src/__tests__/landlord/expense.test.ts` — stubs for LL-06
- [ ] `src/__tests__/landlord/financial-summary.test.ts` — stubs for LL-07
- [ ] `src/__tests__/landlord/document-upload.test.ts` — stubs for LL-08
- [ ] `src/__tests__/landlord/compliance-reminders.test.ts` — stubs for LL-09
- [ ] `src/__tests__/landlord/lease-pdf.test.ts` — stubs for LL-10
- [ ] Zod schema tests for all 4 entity types (tenancy, maintenance, financial entry, document)
- [ ] Rent period calculation utility tests (edge cases: Feb 29, month-end, weekly vs monthly)
- [ ] File validation utility tests (magic byte checks for PDF, JPG, PNG + rejection)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF download triggers browser save dialog | LL-10 | Browser file download API | Generate lease PDF, verify file downloads and opens correctly |
| Photo upload shows compressed preview | LL-03 | Visual rendering check | Upload a >2MB photo, confirm preview shows and file <500KB uploaded |
| Compliance reminder email received | LL-09 | Requires pg_cron + Edge Function in live Supabase | Set document expiry to tomorrow, wait for cron, check notification |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
