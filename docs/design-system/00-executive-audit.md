# Design System Executive Audit

**Date:** 2026-07-13
**Branch:** docs/design-system-audit (based on origin/main 2bfe51e2)
**Scope:** Phase 0 audit findings + blockers shipped (PRs #153, #156, #159, #160).
**Method:** Static analysis, grep census, prior audit JSON/screenshots (wt-responsive/.gstack/goal-runs/audit/), RESPONSIVE.md, globals.css.

---

## Area Scores

| Area | Score (0–5) | Notes |
|------|-------------|-------|
| Colour | 3 / 5 | Token system solid; public green-only rule enforced by brand guard tests. Critical gap: `--ring` token exists but `:focus-visible` outline never surfaces on interactive elements (`.focus-ring` utility hardcodes blue `#2563EB` and is referenced nowhere). |
| Typography | 4 / 5 | Fluid type scale (`text-display`, `text-h1`…`text-body-lg`) defined in `@theme`. Gaps: 183 occurrences of `text-[10px]` across 85 files and 304 occurrences of `text-[11px]` across 103 files — arbitrary sizes outside the token system, mostly in dashboard stat/badge rows. |
| Spacing | 3 / 5 | `Container` primitive (`components/responsive/Container.tsx`) correct; 34 files still hand-roll `mx-auto max-w-7xl` (listed in doc 01). Vertical rhythm tokens not consistently applied — many pages use ad-hoc `py-N` instead of the stepped `py-8 sm:py-12 lg:py-16` convention. |
| Elevation | 2 / 5 | Five named shadow tokens (`--shadow-xs` through `--shadow-xl`) defined but applied inconsistently. Cards use a mix of `shadow-sm`, `shadow-md`, and `shadow` (Tailwind default, which resolves to Shadcn's default, not the TrueDeed token). No single elevation tier enforced. |
| Focus / A11y | 1 / 5 | Critical: `outline-ring/50` applied globally via `@layer base { * { @apply … outline-ring/50 } }` but this only sets the `outline-color` — there is NO `outline-style` or `outline-width` rule that makes it visible. `:focus-visible` states are invisible on buttons, links, and form controls. `.focus-ring` utility exists (globals.css:231) with `outline: 2px solid #2563EB` but is referenced nowhere in `src/`. |
| Responsiveness | 3 / 5 | Phase-0 blockers fixed (F1/F2/F3 via PRs #153/#156/#159/#160). Remaining: 11 distinct overflow findings (F4–F9), form control font issues (F11), touch target gaps (F12), safe-area missing (F14). Full PR sequence (PR-3 through PR-8) still to ship. |
| Imagery | 2 / 5 | 36 raw `<img>` occurrences across 32 non-test files (see census); ~3 are non-JSX sanitizer/service strings, and blob/QR/data-URI previews are exempt, so the PR-5 migration target is smaller. No `sizes` attributes on most. Primary offenders: `MapPropertyCard.tsx`, `ProviderSearchCard.tsx`, `FeaturedProviders.tsx`, `AgentCard.tsx`, all agent/seller listing tiles. |
| Components | 3 / 5 | 38 Shadcn UI primitives in `src/components/ui/`. Button tops out at `h-9` (36px) — no `xl` or `icon-xl` size for public CTAs. 6 separate property card implementations, 4 separate stat/KPI card implementations, 2 active public headers — duplication without container-query abstraction. |

**Overall: B- / 3.0** — token infrastructure is complete; the main gap is application discipline (arbitrary text sizes, inconsistent shadow usage) and the critical invisible focus bug.

---

## Top-10 Issues

| # | Issue | Severity | Finding | PR |
|---|-------|----------|---------|----|
| 1 | `:focus-visible` outlines invisible — `outline-ring/50` sets color only; no width/style | **Critical** | F20 | PR-1 |
| 2 | `button.tsx` max size `h-9` (36px), no `≥44px` public CTA size | **High** | F12 | PR-1 |
| 3 | 304 × `text-[11px]` (103 files) + 183 × `text-[10px]` (85 files) — arbitrary sizes below the type system floor | **High** | F11 | PR-3/PR-6 |
| 4 | 36 raw `<img>` occurrences across 32 files (~3 non-JSX; several blob/QR/data-URI exempt) — no `sizes`, no priority hints, LCP risk | **High** | F15 | PR-5 |
| 5 | 4 confirmed hover-only reveals (`opacity-0 group-hover:opacity-100`) invisible on touch; handoff cited up to 8 — verify remaining variant patterns in PR-5 | **High** | F17 | PR-5 |
| 6 | Page-level overflow at 320/360px on 5 routes: `/post-a-job`, `/areas/[city]/[area]`, `/areas`, `/new-homes/[slug]`, `/notifications` | **High** | F4–F9 | PR-6 |
| 7 | Dashboard tables (landlord rent/compliance/deposits/expenses; agent CRM/invoices) overflow at mobile widths | **High** | F18 | PR-7/PR-8 |
| 8 | 34 files hand-rolling `mx-auto max-w-7xl` instead of `<Container>` — inconsistent gutter widths | **Medium** | F21 | PR-1 |
| 9 | 6 fixed/sticky bars missing `.pb-safe` (safe-area-inset) — notched-iPhone clip | **Medium** | F14 | PR-2 |
| 10 | Broker pipeline `min-w-[900px]` kanban — hard overflow on all mobile/tablet widths | **High** | F16 | PR-8 |

---

## What's Already Fixed

The four Phase-0 blocker PRs are all squash-merged to `origin/main`:

| PR | SHA | Scope | Findings closed |
|----|-----|-------|-----------------|
| #153 | 81ec3d12 | Fluid type tokens in `@theme`, 44px touch floor via `@media (pointer:coarse)`, select 16px fix, `docs/RESPONSIVE.md`, guard tests | F10, F11 (partial), F12 (partial) |
| #156 | 52b3b6fd | Map cooperative-gesture screens on embedded MapLibre maps; thumb-zone controls | F2, F19 |
| #159 | 5a041531 | Header pivots at `lg` (tablet nav unblocked); 55-file `vh → dvh` sweep + guard test | F1, F13 |
| #160 | 5153e3c4 | Dashboard mobile "More" bottom sheet exposes full nav across all roles | F3 |

**F1, F2, F3 (the three P0 blockers) are shipped and live on production.**

The following are confirmed working on this branch (via guard tests):
- `src/__tests__/responsive/form-control-sizing.test.ts` — 16px mobile font floor + 44px coarse-pointer + fluid tokens
- `src/__tests__/responsive/dvh-heights.test.ts` — bans `h-screen`/`min-h-screen`/`calc(100vh…)` in `src/components` + `src/app`
- `src/__tests__/brand/public-brand-guard.test.ts` + `dashboard-brand-guard.test.ts` — green/blue separation enforced

---

## Notes for Future PRs

- `#2563EB` appears in four legitimate token definitions (`--color-brand-accent`, `--color-info`, `--chart-4`, dark `--chart-3`) — PR-1's focus-ring repair must not sweep these out; only target the dead `.focus-ring` utility and the missing `:focus-visible` rule.
- The `dark:` prefix is used extensively but no `ThemeProvider` is mounted — dark mode class must be applied externally (or via a hook). CLAUDE.md's claim about `prefers-color-scheme` is stale; the CSS is class-driven.
