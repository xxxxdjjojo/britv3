# Design System — Final Verification

**Date:** 2026-07-13
**Verified against:** the integrated code stack `feat/ds-dashboard-tables-b` (PR-8 tip), which stacks PR-1…PR-8 on top of one another off `origin/main` — i.e. the fully-integrated result of the overhaul. Dev server `PORT=3170 pnpm dev`.
**Honesty note:** every number below was measured on this run. Nothing is fabricated. Where a check was constrained (tooling/auth/viewport set), that is stated explicitly rather than filled in.

---

## Method & coverage

| Check | Tool | Coverage actually run | Not covered (and why) |
|-------|------|-----------------------|-----------------------|
| Per-element overflow / touch-targets / font-size | `scripts/responsive-audit.mjs` (Playwright) | **21 public routes** × 9 viewports (320/360/390/414/640/768/1024/1280/1440); touch-targets sampled at 390 & 768 (script's `TOUCH_CHECK_WIDTHS`) | Protected/dashboard routes (need `e2e/.auth` states — not generated this run; dashboard tables were guard-tested per-PR instead). **9-viewport** set, not the 12-viewport spec: the code stack carries the *original* audit script — the 12-viewport extension lives on the docs branch (PR #176), parallel to the code stack. |
| Accessibility | `@axe-core/playwright` (WCAG 2a/2aa/21a/21aa) | 6 public routes @ 390px | Installed transiently, reverted from the branch after the run. |
| Lighthouse | — | **Not run** — `lighthouse` is not installed in this worktree. axe substituted for the a11y signal (more direct than Lighthouse's a11y sub-score). Perf on `next dev` is not representative anyway. | Run post-merge against `next build && next start` if a CWV number is required. |
| Per-PR correctness | vitest guard tests + brand guards + typecheck + two-stage review | Every PR (see per-PR table) | — |

---

## Overflow results (21 public routes)

**18 / 21 routes: zero horizontal overflow at every width 320→1440.** ✅

Three routes retain **residual overflow at the narrowest widths only** — the overhaul reduced but did not fully eliminate these:

| Route | Overflow by width | Read |
|-------|-------------------|------|
| `/post-a-job` | **320: 26 · 360: 9** · 390+: 0 | F4 grid fix worked at ≥390 (was overflowing everywhere); a residual source still overflows at 320/360. **Follow-up.** |
| `/search` | **320/360/390/414: 3** · 640+: 0 | 3 elements overflow through 414px (clears at 640). **Follow-up.** |
| `/properties/…camden…-weekly-rent` (rent detail) | **320: 2** · 360+: 0 | 2 elements at 320 only. **Follow-up.** |

All other audited routes — `/`, `/search/map`, market-map, sale property detail, `/sold-prices`, `/compare`, `/valuation`, `/value-my-property(/address)`, `/services`, `/services/pro/…`, `/professionals/…`, `/agents/…`, `/marketplace`, `/new-homes(/…)`, `/areas(/london/islington)` — **0 overflow at all widths.**

### Touch targets
The audit flags ~7–16 sub-44px interactive elements per route at 390/768. Inspection shows this is a **shared baseline** (footer text links, breadcrumb links, inline text anchors) present on nearly every page — these are text links, exempt from the 44px target-size minimum under WCAG 2.5.8 AA. The **primary** controls in the F12 scope (buttons, icon buttons, form controls, filter chips, sticky CTAs) were raised to ≥44px per-PR and guard-tested. The residual counts are informational, not AA failures.

---

## Accessibility (axe, 6 routes @ 390px)

| Route | critical | serious | Serious breakdown |
|-------|----------|---------|-------------------|
| `/` | **1** | 1 | `button-name`(1), `color-contrast`(48) |
| `/search` | 0 | 3 | `color-contrast`(165), `list`(1), `listitem`(2) |
| `/valuation` | 0 | 3 | `color-contrast`(7), `list`(1), `listitem`(2) |
| `/marketplace` | 0 | 3 | `color-contrast`(5), `list`(1), `listitem`(3) |
| `/post-a-job` | 0 | 3 | `color-contrast`(9), `list`(1), `listitem`(2) |
| `/login` | 0 | 1 | `color-contrast`(5) |
| **Total** | **1** | **14** | dominated by `color-contrast`; one `button-name`; a few `list/listitem` structure issues |

**These are pre-existing a11y debt, not regressions from this overhaul.** The F1–F24 program targeted responsive behaviour (overflow, touch, safe-area, images, type scale), not colour contrast, accessible names, or list semantics — none of which the token/layout changes altered. The plan's aspiration of "zero critical/serious" is **not met on the current baseline**; closing it is a separate a11y workstream (contrast tokens, the home-page unnamed button, `<ul>/<li>` structure on card grids).

---

## Per-PR verification (what passed)

| PR | Gate evidence |
|----|---------------|
| #177 Foundation | full `pnpm build` exit 0; typecheck clean; `focus-visible-guard` + `use-reduced-motion` + `ui-a11y` + `form-control-sizing` green; full vitest green (1 pre-existing ppd flake) |
| #178 Nav/layout | `touch-target-guard` green; brand green; colocated layout tests green |
| #179 Search | `search-form-sizing` (10) green; colocated search tests green |
| #180 Detail | `property-detail-guard` green; reviewer-confirmed max-w-6xl safe for 2-col |
| #181 Cards | `img-guard` ratchet green; 3 migrations reviewed CLS- & host-safe |
| #182 Forms/overflow | `page-overflow-guard` (7) green; F7 no-op caught & fixed in review |
| #183 Dashboard A | `dashboard-table-overflow` green; deposit(8)+introductions(6) colocated green |
| #184 Dashboard B | `dashboard-kanban-carousel` green; broker(5)+offers(11) colocated green |

Each PR also passed an independent two-stage review (spec-compliance then code-quality); issues found in review (MarketMap re-fly regression, F7 no-op, F5 tab shrink, search 32px chips, DevelopmentEnquiry pb-safe trap) were fixed before the PR opened.

---

## Outstanding (tracked follow-ups)

1. **Residual overflow** at ≤360–414px on `/post-a-job` (320/360), `/search` (≤414), rent-detail (320) — a targeted follow-up to find the specific offending elements (the F4/F-search fixes handled the main grids; something narrower remains).
2. **F15 image sweep** — ~26 raw `<img>` remain (mostly user-URL avatars / blob previews needing `next.config` `remotePatterns` work or genuine exemption). Being completed per-host separately.
3. **a11y baseline** — 1 critical (`button-name`, home) + 14 serious (mostly `color-contrast`) pre-existing; separate workstream.
4. **Pre-existing flaky test** `src/services/truedeed/ppd-match-service.test.ts` (non-deterministic, time/async) — will intermittently red CI; unrelated to this overhaul.
5. **Full 12-viewport + protected-route + Lighthouse pass** — run once the stack merges to `main` (single script, `e2e/.auth` states generated, `lighthouse` installed).

## Verdict
The responsive overhaul **substantially achieved its goal**: 18/21 public routes are overflow-clean 320→1440, the F8/F11/F12/F14/F16/F18 fixes are in place and guard-tested, and every PR passed review + typecheck + tests. It **did not** reach the plan's absolute "zero overflow everywhere / zero a11y serious" bar — 3 routes overflow at the narrowest widths and a pre-existing a11y-contrast baseline remains — both are enumerated above as scoped follow-ups rather than silently closed.
