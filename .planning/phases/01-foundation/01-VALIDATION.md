---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React Testing Library + happy-dom |
| **Config file** | `britv3.0/vitest.config.mts` — needs creation in Wave 0 |
| **Quick run command** | `pnpm test --run` |
| **Full suite command** | `pnpm test --run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run`
- **After every plan wave:** Run `pnpm test --run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | INFRA | setup | `pnpm test --run` | No — Wave 0 | pending |
| 01-01-02 | 01 | 1 | AUTH-01 | integration | `pnpm test src/__tests__/auth/signup.test.ts` | No — Wave 0 | pending |
| 01-01-03 | 01 | 1 | AUTH-02 | integration | `pnpm test src/__tests__/auth/verify-email.test.ts` | No — Wave 0 | pending |
| 01-01-04 | 01 | 1 | AUTH-03 | unit | `pnpm test src/__tests__/auth/oauth.test.ts -t "google"` | No — Wave 0 | pending |
| 01-01-05 | 01 | 1 | AUTH-04 | unit | `pnpm test src/__tests__/auth/oauth.test.ts -t "apple"` | No — Wave 0 | pending |
| 01-01-06 | 01 | 1 | AUTH-05 | integration | `pnpm test src/__tests__/auth/password-reset.test.ts` | No — Wave 0 | pending |
| 01-01-07 | 01 | 1 | AUTH-06 | integration | `pnpm test src/__tests__/auth/session.test.ts` | No — Wave 0 | pending |
| 01-02-01 | 02 | 1 | AUTH-07 | unit | `pnpm test src/__tests__/auth/role-select.test.ts` | No — Wave 0 | pending |
| 01-02-02 | 02 | 1 | AUTH-08 | unit | `pnpm test src/__tests__/auth/role-switch.test.ts` | No — Wave 0 | pending |
| 01-02-03 | 02 | 1 | AUTH-09 | unit | `pnpm test src/__tests__/dashboard/shell.test.ts` | No — Wave 0 | pending |
| 01-02-04 | 02 | 1 | AUTH-10 | unit | `pnpm test src/__tests__/auth/verification-levels.test.ts` | No — Wave 0 | pending |
| 01-02-05 | 02 | 2 | AUTH-11 | integration | `pnpm test src/__tests__/auth/provider-verification.test.ts` | No — Wave 0 | pending |
| 01-03-01 | 03 | 1 | AUTH-12 | unit | `pnpm test src/__tests__/gdpr/consent.test.ts` | No — Wave 0 | pending |
| 01-03-02 | 03 | 1 | AUTH-13 | integration | `pnpm test src/__tests__/gdpr/export.test.ts` | No — Wave 0 | pending |
| 01-03-03 | 03 | 1 | AUTH-14 | integration | `pnpm test src/__tests__/gdpr/deletion.test.ts` | No — Wave 0 | pending |
| 01-03-04 | 03 | 1 | AUTH-15 | unit | `pnpm test src/__tests__/gdpr/audit.test.ts` | No — Wave 0 | pending |
| 01-03-05 | 03 | 2 | AUTH-16 | unit | `pnpm test src/__tests__/security/csp.test.ts` | No — Wave 0 | pending |
| 01-03-06 | 03 | 2 | AUTH-17 | unit | `pnpm test src/__tests__/security/middleware.test.ts` | No — Wave 0 | pending |
| 01-03-07 | 03 | 2 | AUTH-18 | unit | `pnpm test src/__tests__/pages/public.test.ts` | No — Wave 0 | pending |
| 01-03-08 | 03 | 2 | AUTH-19 | unit | `pnpm test src/__tests__/layout/shell.test.ts` | No — Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `britv3.0/vitest.config.mts` — Vitest configuration with React plugin, path aliases, happy-dom
- [ ] `britv3.0/package.json` — Add vitest, @vitejs/plugin-react, @testing-library/react, @testing-library/dom, @testing-library/jest-dom, happy-dom, vite-tsconfig-paths as devDependencies
- [ ] `britv3.0/src/__tests__/setup.ts` — Test setup file (testing-library cleanup, custom matchers)
- [ ] `britv3.0/src/__tests__/mocks/supabase.ts` — Supabase client mock for unit tests
- [ ] `britv3.0/src/__tests__/mocks/next.ts` — Next.js navigation/headers mocks

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google OAuth redirect flow | AUTH-03 | Requires real Google OAuth consent screen | 1. Click "Sign in with Google" 2. Verify redirect to Google 3. Authorize 4. Verify callback creates account |
| Apple OAuth redirect flow | AUTH-04 | Requires real Apple developer account | 1. Click "Sign in with Apple" 2. Verify redirect to Apple 3. Authorize 4. Verify callback creates account |
| Email delivery (verification) | AUTH-02 | Requires real email delivery | 1. Sign up with real email 2. Check inbox 3. Click verification link 4. Verify account activated |
| CSP header browser enforcement | AUTH-16 | Requires real browser DevTools inspection | 1. Open DevTools Network tab 2. Check response headers for CSP 3. Verify no console violations |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
