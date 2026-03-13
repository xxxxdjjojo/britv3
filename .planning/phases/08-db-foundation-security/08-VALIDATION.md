---
phase: 8
slug: db-foundation-security
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.mts` (repo root) |
| **Quick run command** | `pnpm test --run` |
| **Full suite command** | `pnpm test --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run`
- **After every plan wave:** Run `pnpm test --run && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green + `pnpm build` clean
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-01-01 | 01 | 1 | FOUND-01 | manual | `supabase db push` (migration apply) | N/A | ⬜ pending |
| 8-01-02 | 01 | 1 | FOUND-01 | manual | Supabase dashboard table check | N/A | ⬜ pending |
| 8-01-03 | 01 | 1 | FOUND-01 | smoke | `pnpm test --run src/__tests__/foundation/package-imports.test.ts` | ❌ W0 | ⬜ pending |
| 8-02-01 | 02 | 2 | FOUND-04 | smoke | `pnpm test --run src/__tests__/foundation/package-imports.test.ts` | ❌ W0 | ⬜ pending |
| 8-02-02 | 02 | 2 | FOUND-02 | unit | `pnpm test --run src/__tests__/dashboard/role-guard.test.ts` | ❌ W0 | ⬜ pending |
| 8-02-03 | 02 | 2 | FOUND-03 | unit | `pnpm test --run src/__tests__/dashboard/auth-guard.test.ts` | ❌ W0 | ⬜ pending |
| 8-02-04 | 02 | 2 | FOUND-03 | manual | Verify signed URL endpoint returns 401 without auth | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/dashboard/role-guard.test.ts` — stubs for FOUND-02; mocks `createClient`, tests that `profile.active_role !== role` triggers `redirect()`
- [ ] `src/__tests__/dashboard/auth-guard.test.ts` — stubs for FOUND-03; verifies buyer page Server Components call `getUser()` and return 401/redirect on null user
- [ ] `src/__tests__/foundation/package-imports.test.ts` — stubs for FOUND-04; imports `nanoid`, `date-fns`, `react-day-picker`, `tus-js-client` and asserts they resolve without error

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 10 tables exist in Supabase with RLS enabled | FOUND-01 | SQL migration state cannot be verified by Vitest | Apply migration → Supabase dashboard → confirm all 10 tables present with RLS enabled |
| buyer-documents bucket is private | FOUND-01 | Storage bucket config is not testable via Vitest | Supabase dashboard → Storage → confirm `buyer-documents` is not public; attempt anon key access and verify 403 |
| Homebuyer redirected from /dashboard/landlord | FOUND-02 | Integration test requires live Supabase session | Log in as homebuyer → navigate to /dashboard/landlord → confirm redirect to /dashboard/homebuyer |
| Signed URL works for document download | FOUND-03 | Requires live Storage bucket | Upload test doc as homebuyer → call `/api/documents/[id]/signed-url` → confirm time-limited URL returned |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
