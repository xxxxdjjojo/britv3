# QA Report — Britestate Marketplace (Regression)
Date: 2026-03-15
Baseline: qa-report-localhost-2026-03-15.md (score: 47/100)
Pages tested: 14
Framework: Next.js (App Router, Turbopack)
Mode: Regression — verifying fixes from prior QA session
Duration: ~10 minutes
Screenshots: 3

## Summary

Health score: **78/100** (+31 vs baseline)

| Category | Baseline | This Run | Delta |
|----------|----------|----------|-------|
| Console | 70/100 | 50/100 | -20 |
| Links | 40/100 | 100/100 | +60 |
| Functional | 0/100 | 75/100 | +75 |
| Visual | 85/100 | 85/100 | 0 |
| UX | 25/100 | 85/100 | +60 |
| Performance | 70/100 | 70/100 | 0 |
| Content | 60/100 | 60/100 | 0 |
| Accessibility | 70/100 | 85/100 | +15 |

**Weighted score:**
- Console (15%): 50 × 0.15 = 7.5
- Links (10%): 100 × 0.10 = 10.0
- Functional (20%): 75 × 0.20 = 15.0
- Visual (10%): 85 × 0.10 = 8.5
- UX (15%): 85 × 0.15 = 12.75
- Performance (10%): 70 × 0.10 = 7.0
- Content (5%): 60 × 0.05 = 3.0
- Accessibility (15%): 85 × 0.15 = 12.75
**Total: 76.5/100** → rounded **77/100**

---

## Issues Fixed Since Baseline

### ✅ ISSUE-001 (Critical): Service discovery routes now public
All 9 routes that previously redirected unauthenticated users to login now return HTTP 200 and render their correct content.
- `/services/tradespeople` → 200 ✓
- `/agents` → 200 ✓
- `/mortgage-brokers` → 200 ✓
- `/conveyancers` → 200 ✓
- `/surveyors` → 200 ✓
- `/architects` → 200 ✓
- `/post-a-job` → 200 ✓
- `/services/tradespeople/plumbers/london` → 200 ✓
- `/architects/test-slug` → reaches Next.js 404 handler ✓

### ✅ ISSUE-002 (High): `/post-a-job` shows in-page sign-in prompt
Unauthenticated users now see a contextual "Sign in to post a job" panel with Sign In and Create Account CTAs (verified: `@e9 [link] "Sign In"`, `@e10 [link] "Create Account"` in snapshot). No full-page redirect.

### ✅ ISSUE-003 (High): `/architects/test-slug` now reaches 404 handler
Consequence of ISSUE-001 fix. The middleware no longer intercepts missing provider slugs; Next.js `not-found.tsx` is now reachable.

### ✅ ISSUE-004 (Medium): Category links now map to specific enum values
Verified via `links` inspection on `/marketplace`:
- Builders → `?category=builder` ✓ (was `?category=handyman`)
- Plasterers → `?category=plasterer` ✓ (was `?category=other`)
- Painters → `?category=painter` ✓ (was `?category=other`)
- Carpenters → `?category=carpenter` ✓ (was `?category=other`)

### ✅ ISSUE-005 (Medium): Base UI nativeButton console errors eliminated
`grep` for "nativeButton" and "Base UI" on `/marketplace` returns no results. The two Header auth buttons now use the `asChild` pattern, rendering as native `<a>` elements via Next.js `Link` without triggering the Base UI nativeButton warning.

### ✅ ISSUE-006 (Low): Builders no longer maps to `?category=handyman`
Resolved by ISSUE-004 fix. Builders tile links to `?category=builder` which maps to the newly-added `builder` enum value on the `service_category` type.

---

## New Issues Found

### ISSUE-007: Specialist search pages throw console errors — missing DB objects
**Severity:** High
**Pages:** `/agents`, `/mortgage-brokers`, `/conveyancers`, `/surveyors`, `/architects`
**Description:** Now that these pages are publicly accessible (ISSUE-001 fix), their underlying search functions are exposed. Five console errors fire on each visit:
```
Agent search error: Could not find the table 'public.agent_agency_profiles' in the schema cache
Mortgage broker search error: Could not find the function public.search_providers(p_category) in the schema cache
Conveyancer search error: Could not find the function public.search_providers(p_category) in the schema cache
Surveyor search error: Could not find the function public.search_providers(p_category) in the schema cache
Architect search error: Could not find the function public.search_providers(p_category) in the schema cache
```
These errors indicate:
1. `public.agent_agency_profiles` table does not exist in the remote DB (PGRST205)
2. `public.search_providers(p_category)` RPC function does not exist in the remote DB

The pages likely render an empty state gracefully (the `catch` block populates `initialProviders = []`), but 5 server-side errors fire per page load. This is a pre-existing schema gap now visible after the auth fix.
**Repro:**
1. Navigate to any of `/agents`, `/mortgage-brokers`, `/conveyancers`, `/surveyors`, `/architects`
2. Open DevTools console
3. Observe server-side errors proxied through React Server Components stream

---

## Regression Summary

| Metric | Baseline | This Run |
|--------|----------|----------|
| Health score | 47/100 | 77/100 |
| Critical issues | 1 | 0 |
| High issues | 2 | 1 (ISSUE-007) |
| Medium issues | 2 | 0 |
| Low issues | 1 | 0 |
| New issues | — | 1 (ISSUE-007) |

**Score delta: +30 points**

All 6 baseline issues are resolved. One new issue (ISSUE-007) surfaces a pre-existing schema gap that was previously masked by the auth redirect. It is not a regression — it's an underlying backend implementation gap now visible.

---

## Pages Visited

- [x] `/marketplace` — PASS (no console errors, all category hrefs correct)
- [x] `/services/tradespeople` — PASS (200, renders correctly)
- [x] `/services/tradespeople?category=builder` — PASS (200, accepted as valid category)
- [x] `/services/tradespeople?category=plasterer` — PASS (200)
- [x] `/services/tradespeople?category=painter` — PASS (200)
- [x] `/services/tradespeople?category=carpenter` — PASS (200)
- [x] `/agents` — PARTIAL (200, renders but console errors from missing DB objects)
- [x] `/mortgage-brokers` — PARTIAL (200, renders but console errors)
- [x] `/conveyancers` — PARTIAL (200, renders but console errors)
- [x] `/surveyors` — PARTIAL (200, renders but console errors)
- [x] `/architects` — PARTIAL (200, renders but console errors)
- [x] `/architects/test-slug` — PASS (reaches 404 handler correctly)
- [x] `/post-a-job` — PASS (200, in-page sign-in prompt renders)
- [x] `/services/tradespeople/plumbers/london` — PASS (200)

---

## Console Health Summary

- 0 errors on `/marketplace` (was 2 per load in baseline) ✓
- 0 nativeButton errors anywhere ✓
- 5 server-side errors per load on specialist search pages (ISSUE-007) — pre-existing schema gap
- No hydration errors observed
- Console score: 50/100 (ISSUE-007 errors on 5 pages)

---

## Top Issue to Fix Next

**ISSUE-007 (High): Create missing `search_providers` RPC and `agent_agency_profiles` table**
The specialist search pages (`/agents`, `/mortgage-brokers`, `/conveyancers`, `/surveyors`, `/architects`) need their backing DB objects. Create:
1. `public.agent_agency_profiles` table (or confirm correct table name)
2. `public.search_providers(p_category service_category, ...)` RPC function

This is a DB/backend implementation task, not a frontend fix.
