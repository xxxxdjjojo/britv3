---
phase: 3
slug: dashboards-communication
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-07
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + React Testing Library |
| **Config file** | `britv3.0/vitest.config.ts` (or "none — Wave 0 installs") |
| **Quick run command** | `pnpm test --reporter=verbose` |
| **Full suite command** | `pnpm test --coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --reporter=verbose`
- **After every plan wave:** Run `pnpm test --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Test File | Status |
|---------|------|------|-------------|-----------|-------------------|-----------|--------|
| 02-T3a | 02 | 1 | DASH-08 | unit | `pnpm test src/__tests__/lib/sanitize.test.ts` | `src/__tests__/lib/sanitize.test.ts` | pending |
| 02-T3b | 02 | 1 | DASH-08 | unit | `pnpm test src/__tests__/lib/redis.test.ts` | `src/__tests__/lib/redis.test.ts` | pending |
| 03-T3 | 03 | 2 | DASH-09, DASH-10 | unit | `pnpm test src/__tests__/services/profile-service.test.ts` | `src/__tests__/services/profile-service.test.ts` | pending |
| 04-T3 | 04 | 2 | COM-01, COM-02, COM-03 | unit | `pnpm test src/__tests__/services/message-service.test.ts` | `src/__tests__/services/message-service.test.ts` | pending |
| 05-T3 | 05 | 2 | COM-10, COM-11 | unit | `pnpm test src/__tests__/services/notification-service.test.ts` | `src/__tests__/services/notification-service.test.ts` | pending |
| 06-T3 | 06 | 3 | DASH-07, DASH-12 | unit | `pnpm test src/__tests__/services/dashboard-service.test.ts` | `src/__tests__/services/dashboard-service.test.ts` | pending |
| 07-T2 | 07 | 3 | COM-06, COM-07 | unit | `pnpm test src/__tests__/services/quote-draft-service.test.ts` | `src/__tests__/services/quote-draft-service.test.ts` | pending |
| 08-T3 | 08 | 3 | COM-14, COM-15 | unit | `pnpm test src/__tests__/services/milestone-service.test.ts` | `src/__tests__/services/milestone-service.test.ts` | pending |
| 10-T2 | 10 | 4 | ALL | integration | `pnpm test --run && pnpm build` | All 8 test files | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Vitest + React Testing Library installed and configured (if not already from Phase 1)
- [ ] `src/__tests__/setup.ts` — test setup with mocks for Supabase client (Plan 02, Task 2)
- [ ] `src/__tests__/fixtures/dashboard.ts` — shared dashboard test fixtures (Plan 02, Task 2)
- [ ] `src/__tests__/fixtures/messaging.ts` — shared messaging test fixtures (Plan 02, Task 2)
- [ ] `src/__tests__/mocks/redis.ts` — Redis mock factory (Plan 02, Task 2)
- [ ] `src/__tests__/mocks/anthropic.ts` — Anthropic mock factory (Plan 02, Task 2)
- [ ] `src/__tests__/mocks/resend.ts` — Resend mock factory (Plan 02, Task 2)

All Wave 0 items are created in Plan 02 (wave 1), which runs before any test-dependent plans.

---

## Test Distribution by Plan

| Plan | Test File(s) | Test Count (est.) |
|------|-------------|-------------------|
| 02 | `sanitize.test.ts`, `redis.test.ts` | ~9 |
| 03 | `profile-service.test.ts` | ~8 |
| 04 | `message-service.test.ts` | ~9 |
| 05 | `notification-service.test.ts` | ~10 |
| 06 | `dashboard-service.test.ts` | ~7 |
| 07 | `quote-draft-service.test.ts` | ~7 |
| 08 | `milestone-service.test.ts` | ~8 |
| **Total** | **8 test files** | **~58 tests** |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard loads correct role data on role switch | DASH-04 | Requires authenticated session with multiple roles | 1. Log in as multi-role user 2. Switch roles 3. Verify dashboard data changes |
| Photo upload preview and crop | DASH-08 | Browser File API + canvas interaction | 1. Go to profile 2. Upload photo 3. Verify preview renders |
| Message polling updates inbox in real-time | COM-03 | Requires two browser sessions | 1. Open inbox in two tabs 2. Send message from tab A 3. Verify tab B updates within 30s |
| Email notification delivery | COM-09 | External service (Resend) delivery | 1. Trigger critical event 2. Check email inbox 3. Verify format and content |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify with behavioral tests or build checks
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Plan 02 creates all fixtures and setup)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] Task IDs match actual plan structure (10 plans, tests distributed per-plan)

**Approval:** pending
