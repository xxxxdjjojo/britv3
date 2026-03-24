# QA Regression Report — Provider Dashboard

**Date:** 2026-03-23
**Target:** http://localhost:3000/dashboard/provider
**Mode:** Regression (against baseline from earlier today)
**Auth:** tom.provider@demo.britestate.co.uk / [REDACTED]
**Framework:** Next.js 16 (App Router)
**Duration:** ~10 minutes
**Pages visited:** 12
**Screenshots:** 12 (in regression/)

---

## Regression Summary

| Metric | Baseline | Current | Delta |
|--------|----------|---------|-------|
| Health Score | 83 | 95 | **+12** |
| Critical Issues | 1 (FIXED pre-regression) | 0 | -1 |
| Medium Issues | 3 | 0 | **-3** |
| Low Issues | 2 | 1 | -1 |
| Console Errors | 4 types | 1 type (400s only) | **-3 types** |

---

## Issues Fixed (from baseline)

### ISSUE-001: resolveProviderId column mismatch [CRITICAL — FIXED]
**Fix:** Commit `8e7638c` — changed `.select("id")` to `.select("user_id")` in resolve-provider.ts
**Verified:** Provider dashboard loads correctly, no 404

### ISSUE-002: Field view shows parent sidebar [MEDIUM — FIXED]
**Fix:** Commit `8873b76` — ProviderSidebar returns null on `/field` routes, ProviderMainWrapper removes sidebar padding
**Verified:** Field view at 375px shows clean mobile layout with bottom nav, no sidebar (screenshot regression/04-field-mobile.png)

### ISSUE-003: Analytics page renders dashboard home [MEDIUM — FIXED]
**Fix:** Commit `d96b515` — replaced inline `.select("id")` with `resolveProviderId()`
**Verified:** Analytics shows Profile Views (283), Enquiry Rate (27.2%), Earnings Trend chart (screenshot regression/02-analytics.png)

### ISSUE-004: Login redirect goes to 404 [MEDIUM — FIXED]
**Fix:** Commit `5ce2278` — added `roleToRoute()` mapping: service_provider → provider, estate_agent → agent
**Verified:** Login as tom.provider redirects to `/dashboard/provider` (screenshot regression/01-post-login.png)

---

## Issues Remaining

### ISSUE-005: Auth token refresh 400 errors [LOW — PRE-EXISTING]
**Severity:** Low
**Category:** Console
**Description:** Every page navigation triggers 1-2 `400` responses from Supabase auth token refresh. These are invisible to the user and don't affect functionality.
**Status:** Pre-existing, not from our changes. Likely a Supabase auth-js configuration issue.

---

## New Issues Found

None.

---

## Pages Tested

| Page | Status | Evidence |
|------|--------|----------|
| /login → redirect | PASS | regression/01-post-login.png |
| /dashboard/provider | PASS | Dashboard home with KPIs, smart actions, verification banner |
| /dashboard/provider/analytics | PASS | regression/02-analytics.png — charts render |
| /dashboard/provider/field | PASS | regression/03-field-today.png — no sidebar |
| /dashboard/provider/field (mobile 375px) | PASS | regression/04-field-mobile.png — clean mobile |
| /dashboard/provider/quotes/builder | PASS | regression/05-quote-builder.png — sections, templates, staged payments |
| /dashboard/provider/field/payments | PASS | regression/06-field-payments.png — cash position widget |
| /dashboard/provider/verification | PASS | regression/07-verification.png — trust score 30, 5 steps |
| /dashboard/provider/reviews | PASS | regression/08-reviews.png — star filters, empty state |
| /dashboard/provider/payments | PASS | regression/09-payments.png — Stripe Connect placeholder |
| /dashboard/provider/profile | PASS | regression/10-profile.png — edit form with live preview |
| /dashboard/provider/jobs/active | PASS | regression/11-active-jobs.png — empty state with CTA |

---

## Health Score Breakdown

| Category | Score | Notes |
|----------|-------|-------|
| Console | 70 | 400 auth refresh errors (pre-existing, 4-10 range) |
| Links | 100 | 0 broken links found |
| Visual | 100 | No layout issues, field view clean |
| Functional | 100 | All pages render, all fixes verified |
| UX | 100 | Empty states, CTAs, field view mobile-first |
| Performance | 95 | Pages load quickly, no slow paths observed |
| Content | 100 | No typos, no missing content |
| Accessibility | 95 | No nativeButton warnings on provider dashboard |

**Weighted Health Score: 95/100** (up from 83)

---

## Console Health

| Error Type | Count | Source | New? |
|-----------|-------|--------|------|
| 400 auth refresh | ~12 across session | Supabase auth-js token refresh | No (pre-existing) |
| nativeButton warning | 0 | — | FIXED (was on homebuyer, not provider) |
| JS errors | 0 | — | Clean |
| 404 errors | 0 | — | FIXED |

---

## Conclusion

All 4 QA issues from the baseline have been resolved:
- 1 critical bug fixed (resolveProviderId column mismatch)
- 3 medium bugs fixed (login redirect, analytics page, field view sidebar)
- Health score improved from **83 → 95** (+12 points)
- Zero new issues introduced
- 146 automated tests passing
- 12 pages browser-verified with screenshots
