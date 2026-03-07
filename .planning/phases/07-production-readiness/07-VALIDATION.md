---
phase: 7
slug: production-readiness
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (unit) |
| **Config file** | `britv3.0/vitest.config.ts` |
| **Quick run command** | `cd britv3.0 && pnpm test:run` |
| **Full suite command** | `cd britv3.0 && pnpm test:run && pnpm build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd britv3.0 && pnpm test:run`
- **After every plan wave:** Run `cd britv3.0 && pnpm test:run && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green + Lighthouse PWA audit pass + Artillery pass
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | MOB-01 | unit | `pnpm test:run -- src/app/manifest.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | MOB-03 | unit | `pnpm test:run -- src/lib/push.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | ADM-02 | unit | `pnpm test:run -- src/middleware.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | LCH-03 | unit | `pnpm test:run -- src/lib/logger.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-05 | 01 | 1 | LCH-05 | unit | `pnpm test:run -- src/lib/features.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | ADM-05 | unit | `pnpm test:run -- src/lib/profanity.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | ADM-05 | unit | `pnpm test:run -- src/services/moderation-service.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-03 | 02 | 2 | MOB-10 | unit | `pnpm test:run -- src/components/mobile/BottomTabBar.test.tsx` | ❌ W0 | ⬜ pending |
| 07-02-04 | 02 | 2 | ADM-09 | unit | `pnpm test:run -- src/app/api/contact/route.test.ts` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 3 | LCH-09 | integration | `npx artillery run tests/load/staging.yml` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/manifest.test.ts` — stubs for MOB-01
- [ ] `src/lib/push.test.ts` — stubs for MOB-03
- [ ] `src/lib/profanity.test.ts` — stubs for ADM-05
- [ ] `src/lib/logger.test.ts` — stubs for LCH-03
- [ ] `src/lib/features.test.ts` — stubs for LCH-05
- [ ] `src/services/moderation-service.test.ts` — stubs for ADM-05 price/duplicate
- [ ] `src/components/mobile/BottomTabBar.test.tsx` — stubs for MOB-10
- [ ] `src/app/api/contact/route.test.ts` — stubs for ADM-09
- [ ] `tests/load/staging.yml` — Artillery config for LCH-09
- [ ] PWA icon assets in `public/icons/` — needed for manifest

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive across breakpoints | MOB-08 | Visual verification needed | Chrome DevTools device emulation at 320px, 768px, 1024px, 1280px |
| Touch targets >= 44px | MOB-09 | Physical device interaction | Test on iOS Safari + Android Chrome, verify tap targets |
| Core Web Vitals targets | MOB-11 | Lighthouse audit required | Run Lighthouse mobile audit, verify LCP < 2.5s, FID < 100ms, CLS < 0.1 |
| RLS audit complete | LCH-06 | SQL queries against live DB | Run `SELECT tablename FROM pg_tables WHERE schemaname='public'` and verify RLS enabled |
| OWASP ZAP scan | LCH-08 | External tool required | `docker run zaproxy/zap-stable zap-baseline.py -t <staging-url>` |
| UAT across all roles | LCH-10 | Human testers needed | Follow UAT script per role with seeded staging data |
| Cross-browser testing | LCH-11 | Multiple browser engines | Manual test on Chrome, Firefox, Safari, Edge, iOS Safari, Android Chrome |
| PITR backup verification | LCH-12 | Dashboard verification | Check Supabase dashboard PITR status |
| Legal/compliance review | LCH-13 | Human review needed | GDPR checklist, terms review, disclaimer audit |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
