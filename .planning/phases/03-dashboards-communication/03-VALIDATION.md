---
phase: 3
slug: dashboards-communication
status: draft
nyquist_compliant: false
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DASH-01 | unit | `pnpm test src/services/dashboard` | W0 | pending |
| 03-01-02 | 01 | 1 | DASH-02 | unit | `pnpm test src/components/dashboard` | W0 | pending |
| 03-01-03 | 01 | 1 | DASH-03 | unit | `pnpm test src/hooks/useDashboard` | W0 | pending |
| 03-02-01 | 02 | 1 | DASH-07 | unit | `pnpm test src/components/profile` | W0 | pending |
| 03-02-02 | 02 | 1 | DASH-08 | unit | `pnpm test src/services/profile` | W0 | pending |
| 03-03-01 | 03 | 2 | COM-01 | unit | `pnpm test src/services/messaging` | W0 | pending |
| 03-03-02 | 03 | 2 | COM-02 | unit | `pnpm test src/components/messaging` | W0 | pending |
| 03-03-03 | 03 | 2 | COM-03 | unit | `pnpm test src/hooks/useMessaging` | W0 | pending |
| 03-04-01 | 04 | 2 | COM-07 | unit | `pnpm test src/services/ai-drafting` | W0 | pending |
| 03-05-01 | 05 | 3 | COM-08 | unit | `pnpm test src/services/notifications` | W0 | pending |
| 03-05-02 | 05 | 3 | COM-09 | unit | `pnpm test src/components/notifications` | W0 | pending |
| 03-06-01 | 06 | 3 | COM-14 | unit | `pnpm test src/components/milestones` | W0 | pending |
| 03-06-02 | 06 | 3 | COM-15 | unit | `pnpm test src/services/milestones` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Vitest + React Testing Library installed and configured (if not already from Phase 1)
- [ ] `src/test/setup.ts` — test setup with mocks for Supabase client
- [ ] `src/test/fixtures/dashboard.ts` — shared dashboard test fixtures
- [ ] `src/test/fixtures/messaging.ts` — shared messaging test fixtures
- [ ] `src/test/mocks/supabase.ts` — Supabase client mock factory

*If none: "Existing infrastructure covers all phase requirements."*

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
