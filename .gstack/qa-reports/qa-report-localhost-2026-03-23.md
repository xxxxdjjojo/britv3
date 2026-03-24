# QA Report — Provider Dashboard Business Logic Expansion

**Date:** 2026-03-23
**Target:** http://localhost:3000/dashboard/provider
**Mode:** Full
**Auth:** tom.provider@demo.britestate.co.uk / [REDACTED]
**Framework:** Next.js 16 (App Router)
**Duration:** ~25 minutes
**Pages visited:** 8
**Screenshots:** 15

---

## Summary

| Category | Score | Issues |
|----------|-------|--------|
| Console | 70 | 3 Base UI warnings, 1 fetch error |
| Links | 85 | 1 broken (analytics routing) |
| Visual | 90 | 1 medium (field view sidebar leak) |
| Functional | 75 | 2 issues (login redirect, resolveProviderId column bug — FIXED) |
| UX | 85 | 1 medium (field view not isolated) |
| Performance | 95 | No issues observed |
| Content | 95 | No issues |
| Accessibility | 80 | 3 Base UI nativeButton warnings |

**Health Score: 83/100**

---

## Top 3 Things to Fix

1. **FIXED: resolveProviderId queried non-existent `id` column** — `service_provider_details` PK is `user_id`, not `id`. This caused the entire provider dashboard to 404. Fixed in commit `8e7638c`.

2. **Field view inherits parent sidebar** — The `/dashboard/provider/field/` route group is nested under `/dashboard/provider/` which includes `ProviderSidebar`. The field view should be sidebar-free. Needs to be moved to a parallel route group or the parent layout needs conditional rendering.

3. **Analytics page renders dashboard home** — Navigating to `/dashboard/provider/analytics` shows the dashboard home page instead of the analytics page. Likely a server-side error caught by error boundary that falls back to parent.

---

## Issues

### ISSUE-001: resolveProviderId column mismatch [CRITICAL — FIXED]
**Severity:** Critical
**Category:** Functional
**Status:** FIXED in commit `8e7638c`

**Description:** `resolveProviderId` at `src/lib/provider/resolve-provider.ts:28` selected `.select("id, business_name")` from `service_provider_details`, but that table has no `id` column — the PK is `user_id`. This caused `profile.id` to be `undefined`, breaking the entire provider dashboard with a redirect to `/onboarding/provider` (which doesn't exist → 404).

**Fix applied:** Changed to `.select("user_id, business_name")` and `providerId: profile.user_id`. Tests updated. All 5 tests pass.

**Evidence:** Screenshots 03-06 (404 pages), Screenshot 07 (working after fix)

---

### ISSUE-002: Field view shows parent sidebar [MEDIUM]
**Severity:** Medium
**Category:** Visual / UX

**Description:** The field view at `/dashboard/provider/field/` is designed to be a mobile-first experience without the sidebar. However, because it's a nested route under `/dashboard/provider/`, it inherits the parent `ProviderSidebar` from the parent layout. On desktop, the field view shows both the sidebar AND the bottom navigation bar.

**Repro:**
1. Navigate to http://localhost:3000/dashboard/provider/field
2. Observe: sidebar visible on left, bottom nav visible at bottom
3. Expected: no sidebar, only bottom nav

**Fix suggestion:** Either:
- A) Move field view to `src/app/(protected)/dashboard/provider-field/` (parallel route group, not nested)
- B) Add conditional sidebar rendering in the parent layout based on pathname
- C) Use Next.js route groups: `(management)` and `(field)` under provider

**Evidence:** Screenshot 11 (field view with sidebar)

---

### ISSUE-003: Analytics page renders dashboard home [MEDIUM]
**Severity:** Medium
**Category:** Functional

**Description:** Navigating to `/dashboard/provider/analytics` renders the dashboard home page instead of the analytics page. The analytics page likely throws a server-side error (possibly related to the ProviderContext or resolveProviderId), and the error boundary falls back to the parent page.

**Repro:**
1. Navigate to http://localhost:3000/dashboard/provider/analytics
2. Observe: dashboard home content appears instead of analytics charts

**Evidence:** Screenshot 14

---

### ISSUE-004: Login redirects to 404 after auth [LOW]
**Severity:** Low
**Category:** Functional

**Description:** After successful login, the app redirects to a URL that results in a 404. The login POST succeeds (auth session is set), but the redirect target doesn't resolve correctly. Navigating directly to `/dashboard/provider` works after login.

**Repro:**
1. Go to /login
2. Enter credentials, click Sign In
3. Page shows 404 instead of dashboard
4. Manually navigate to /dashboard/provider → works

**Evidence:** Screenshots 05 (404 after login), 07 (manual nav works)

---

### ISSUE-005: Base UI nativeButton console warnings [LOW]
**Severity:** Low
**Category:** Accessibility / Console

**Description:** Console shows 3 Base UI warnings: "A component that acts as a button expected a native `<button>` because the `nativeButton` prop is true." These appear on the homebuyer dashboard but likely affect provider dashboard buttons too.

**Evidence:** Console output from Phase 3

---

## What's Working Well

1. **Dashboard home** — KPIs (2 leads, 2 active jobs, £620 earnings), verification banner, smart actions card all rendering correctly
2. **Smart Actions** — "Request review from client" suggestion appearing with correct priority
3. **Cash Position Widget** — Showing on field payments page: £295 invoiced, £620 received, £630 net position
4. **Quote Builder v2** — Section headers button, template save button, staged payments checkbox all present and interactive
5. **Verification flow** — Trust Score gauge (30), 5-step verification pipeline with "Get started" CTAs
6. **New Leads** — Empty state with real-time listener, proper messaging
7. **Field View bottom nav** — 4 tabs rendering correctly, active state detection working
8. **ProviderContext** — Business name "Richards Plumbing & Heating" correctly resolved and displayed
9. **Provider Sidebar** — All 14 navigation sections rendering with correct links

---

## Console Health

| Error Type | Count | Source |
|-----------|-------|--------|
| Base UI nativeButton warning | 3 | Button component rendering non-`<button>` elements |
| Failed to fetch (Supabase auth) | 1 | Auth session refresh timing |
| 400 responses | 2 | Auth-related (token refresh) |
| 404 responses | 3 | Login redirect issue |

**Console Score: 70/100** (4-10 errors range)

---

## Pages Visited

| Page | Status | Notes |
|------|--------|-------|
| /login | OK | Form renders, auth works |
| /dashboard/provider | OK | All widgets render after fix |
| /dashboard/provider/jobs/leads | OK | Empty state + realtime |
| /dashboard/provider/quotes/builder | OK | v2 features visible |
| /dashboard/provider/verification | OK | Trust score + 5 steps |
| /dashboard/provider/analytics | BUG | Renders home instead |
| /dashboard/provider/field | OK* | Works but shows sidebar |
| /dashboard/provider/field/jobs | OK* | Works but shows sidebar |
| /dashboard/provider/field/payments | OK | Cash position + bottom nav |
