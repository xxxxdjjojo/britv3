# QA Report: Britestate v3.0

**URL:** http://localhost:3000
**Date:** 2026-03-20
**Mode:** Full (FAANG-level rigor)
**Duration:** ~15 minutes
**Framework:** Next.js 16 (App Router) + Supabase
**Pages Visited:** 25+
**Screenshots:** 28
**Test User:** emma.thompson@test.britestate.co.uk (Homebuyer role)

---

## Health Score: 28/100

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Console | 10 | 15% | 1.5 |
| Links | 70 | 10% | 7.0 |
| Visual | 70 | 10% | 7.0 |
| Functional | 10 | 20% | 2.0 |
| UX | 25 | 15% | 3.75 |
| Performance | 60 | 10% | 6.0 |
| Content | 85 | 5% | 4.25 |
| Accessibility | 40 | 15% | 6.0 |
| **Total** | | | **37.5** |

---

## Top 3 Things to Fix

1. **ALL 6 dashboards crash** — The `electrical_eicr` enum value is not in the database `document_category` enum, causing the `DashboardContent` component to throw. Every authenticated dashboard route (`/dashboard/homebuyer`, `/dashboard/landlord`, `/dashboard/seller`, `/dashboard/agent`, `/dashboard/broker`, `/dashboard/provider`) hits the error boundary and shows "Try Again / Go Home". **This is a ship-stopper.**

2. **Homebuyer routed to Landlord dashboard** — Emma Thompson (role: homebuyer) is consistently redirected to `/dashboard/landlord` after login. The middleware/role-routing logic is sending users to the wrong dashboard. This means homebuyers, renters, and sellers may never see their correct dashboard.

3. **Property detail pages return "Property Not Found"** — Clicking any property from search results navigates to a slug-based URL (e.g., `/properties/12-kensington-gardens-london-sale`) which renders "Property Not Found". The slug resolution is broken — likely the database lookup doesn't match the generated slugs.

---

## Issue Summary

| Severity | Count |
|----------|-------|
| Critical (P0) | 4 |
| High (P1) | 5 |
| Medium (P2) | 5 |
| Low (P3) | 3 |
| **Total** | **17** |

---

## Issues

### ISSUE-001: All 6 Dashboard Routes Crash with Error Boundary [P0 — CRITICAL]

**Category:** Functional
**Affected routes:** `/dashboard/homebuyer`, `/dashboard/landlord`, `/dashboard/seller`, `/dashboard/agent`, `/dashboard/broker`, `/dashboard/provider`

**Description:** Every dashboard route crashes immediately after login. The error boundary catches the exception and shows a generic error page with "Try Again" and "Go Home" buttons.

**Root Cause:** `Failed to fetch health score: invalid input value for enum document_category: "electrical_eicr"`. The code attempts to insert or query using the value `electrical_eicr` which doesn't exist in the PostgreSQL `document_category` enum type.

**Console Errors:**
```
Error: Failed to fetch health score: invalid input value for enum document_category: "electrical_eicr"
  at DashboardContent component
  Handled by ErrorBoundaryHandler
```

**Repro:**
1. Login with any user (e.g., emma.thompson@test.britestate.co.uk / [REDACTED])
2. User is redirected to `/dashboard/landlord`
3. Dashboard shows error boundary: "Try Again" / "Go Home"
4. Manually navigating to any other `/dashboard/*` route shows same error

**Evidence:** `screenshots/issue-001-wrong-dashboard.png`, `screenshots/homebuyer-dashboard.png`, `screenshots/agent-dashboard.png`, `screenshots/broker-dashboard.png`, `screenshots/provider-dashboard.png`, `screenshots/seller-dashboard.png`

**Impact:** 100% of authenticated users cannot access any dashboard. Complete loss of post-login functionality.

---

### ISSUE-002: Homebuyer Redirected to Landlord Dashboard [P0 — CRITICAL]

**Category:** Functional
**Affected routes:** `/login` → redirect target

**Description:** Emma Thompson, registered as a homebuyer, is consistently routed to `/dashboard/landlord` after login instead of `/dashboard/homebuyer`. The `LandlordLayout` component renders with landlord-specific sidebar navigation (Portfolio, Tenants, Maintenance, Finances, Compliance).

**Repro:**
1. Navigate to `/login`
2. Login as emma.thompson@test.britestate.co.uk / [REDACTED]
3. Observe redirect to `/dashboard/landlord` (expected: `/dashboard/homebuyer`)
4. Sidebar shows: Overview, Portfolio, Tenants, Maintenance, Finances, Compliance
5. Role switcher button shows "Landlord"

**Evidence:** `screenshots/login-result-emma.png`, `screenshots/issue-001-wrong-dashboard.png`

**Impact:** Users see wrong dashboard layout. Role-based access control is incorrect. A homebuyer could potentially access landlord features.

---

### ISSUE-003: Property Detail Pages Show "Property Not Found" [P0 — CRITICAL]

**Category:** Functional
**Affected routes:** `/properties/[slug]`

**Description:** All property detail pages show "Property Not Found" error. Clicking any property card from search results navigates to a slug-based URL that cannot resolve the property.

**Repro:**
1. Navigate to `/search?type=buy`
2. Click any property card (e.g., "12 Kensington Gardens, London")
3. Navigated to `/properties/12-kensington-gardens-london-sale`
4. Page shows: "Property Not Found — This property may have been removed or the link may be incorrect."
5. Only options are "Search Properties" and "Back to Home"

**Evidence:** `screenshots/property-detail.png`

**Impact:** Users cannot view any property details, mortgage calculator, SDLT calculator, book viewings, or save properties. Core buyer/renter journey is completely broken.

---

### ISSUE-004: Login/Register/Forgot-Password Pages Crash When Already Authenticated [P0 — CRITICAL]

**Category:** Functional
**Affected routes:** `/login`, `/register`, `/forgot-password` (when logged in)

**Description:** When a user is already authenticated and navigates to auth pages, the pages crash with the error boundary instead of redirecting to the dashboard.

**Repro:**
1. Login as any user
2. Navigate to `/login` → shows error boundary "Try Again / Go Home"
3. Navigate to `/register` → same crash
4. Navigate to `/forgot-password` → same crash

**Evidence:** `screenshots/forgot-password.png`, `screenshots/register.png`

**Impact:** Users who accidentally visit login page while logged in see a crash. Deep links shared via email/chat that go to login will break for authenticated users.

---

### ISSUE-005: Admin Login Fails Silently (No Error Message) [P1 — HIGH]

**Category:** UX
**Affected routes:** `/login`

**Description:** When logging in with admin credentials (admin@test.britestate.co.uk / [REDACTED]), the login stays on the same page with no visible error message, no toast, no inline validation. The 400 error is only visible in the console.

**Repro:**
1. Navigate to `/login` (fresh session)
2. Enter admin@test.britestate.co.uk / [REDACTED]
3. Click "Sign In"
4. Page stays on `/login` — no error shown to user
5. Console shows: `Failed to load resource: the server responded with a status of 400 ()`

**Evidence:** `screenshots/admin-login-result.png`

**Impact:** Users get no feedback on why login failed. Could be wrong password, non-existent account, or server error — user has no way to know.

---

### ISSUE-006: Map View Renders Blank (No MapLibre/MapTiler Map) [P1 — HIGH]

**Category:** Functional
**Affected routes:** `/search?type=buy` (Map view toggle)

**Description:** Clicking "Map view" on the search page shows a blank area with the text "Drag the map to explore properties" but no actual map renders. The MapLibre GL JS / MapTiler integration appears non-functional.

**Repro:**
1. Navigate to `/search?type=buy`
2. Click "Map view" toggle button
3. Map area is completely blank — no tiles, no markers, no controls
4. Right sidebar shows filters but no properties

**Evidence:** `screenshots/search-map-view.png`

**Impact:** Users cannot use map-based property discovery. Map view is a core feature for property search UX (Flow 2.3: James Okafor map search).

---

### ISSUE-007: Nested `<button>` Inside `<button>` Hydration Error [P1 — HIGH]

**Category:** Console / Accessibility
**Affected routes:** All dashboard pages (landlord sidebar)

**Description:** The `LandlordSidebar` component has a `<SheetTrigger>` wrapping a `<Button>`, creating a `<button>` nested inside a `<button>`. This is invalid HTML and causes React hydration errors.

**Console Error:**
```
In HTML, <button> cannot be a descendant of <button>. This will cause a hydration error.
```

Also produces:
```
React does not recognize the `asChild` prop on a DOM element.
```

**Impact:** Hydration mismatch causes SSR/CSR divergence. Screen readers will be confused by nested interactive elements. This is an accessibility violation (WCAG 4.1.1 Parsing).

---

### ISSUE-008: Settings Sidebar "Profile" Link Returns 404 [P1 — HIGH]

**Category:** Links
**Affected routes:** `/settings/profile`

**Description:** The settings sidebar navigation includes a "Profile" link pointing to `/settings/profile`, which returns a 404 page. The "Account" link (which is the actual profile page at `/settings/account`) is missing from the sidebar — the sidebar shows: Privacy & Data, Security, Notifications, Profile, Preferences.

**Repro:**
1. Navigate to any settings page (e.g., `/settings/account`)
2. Click "Profile" in the left sidebar
3. 404 page renders

**Evidence:** `screenshots/settings-profile.png`

**Impact:** Users cannot navigate to their profile from the settings sidebar. Broken navigation loop.

---

### ISSUE-009: Rent Search Shows "Chain Free" Filter (Irrelevant for Rentals) [P1 — HIGH]

**Category:** UX
**Affected routes:** `/search?type=rent`

**Description:** The rental search page shows a "Chain Free" must-have filter, which is a concept only relevant to property purchases, not rentals. The filter panel doesn't adapt based on search type.

**Repro:**
1. Navigate to `/search?type=rent`
2. Expand "Must-Haves" filter section
3. See: Garden, Parking, Garage, Chain Free ← irrelevant for rentals

**Evidence:** `screenshots/search-rent.png`

**Impact:** Confusing UX for renters. Professional property platforms (Rightmove, Zoopla) don't show "Chain Free" for rental searches.

---

### ISSUE-010: Search Results Only Show London Properties (No Filtering by Location) [P2 — MEDIUM]

**Category:** Functional
**Affected routes:** `/search?type=buy`, `/search?type=rent`

**Description:** The search page location input defaults to "London" and only shows London properties. All 5 buy results and 2 rent results are London-based. There is no evidence that the location filter actually queries different areas. This blocks all test flows for Manchester (Emma), Bristol (James), Liverpool (Priya), Birmingham (Fatima), Leeds (David/Gary), and Guildford (Robert/Tom).

**Evidence:** `screenshots/search-buy.png`, `screenshots/search-rent.png`

**Impact:** Users outside London cannot find relevant properties. Property search is the core feature — it must work across all UK regions.

---

### ISSUE-011: No Pagination on Search Results [P2 — MEDIUM]

**Category:** UX
**Affected routes:** `/search?type=buy`

**Description:** The buy search shows exactly 5 results with no pagination controls, no "Load more" button, and no "Showing X of Y results" indicator. For a property portal, this suggests results are either hard-coded or the API doesn't support pagination.

**Evidence:** `screenshots/search-buy.png`

**Impact:** Users can't browse beyond the first 5 results. In production with hundreds of listings, this would be a critical functional gap.

---

### ISSUE-012: Settings "Account" Link Missing from Sidebar [P2 — MEDIUM]

**Category:** UX
**Affected routes:** `/settings/*`

**Description:** The settings sidebar shows: Privacy & Data, Security, Notifications, Profile, Preferences. The "Account" page (`/settings/account`) exists and works but has no link in the sidebar. Combined with ISSUE-008 (Profile link is 404), users can only reach Account settings via direct URL.

**Evidence:** `screenshots/settings-account.png`

**Impact:** Navigation discoverability issue. Users may not find account settings.

---

### ISSUE-013: "Dashboard" Header Link Points to Crashing Route [P2 — MEDIUM]

**Category:** Links
**Affected routes:** All public pages when authenticated

**Description:** When logged in, the header shows "E Dashboard" link (where E is the user's initial). This links to `/dashboard/landlord` which crashes (ISSUE-001). There's no way for the user to reach a working dashboard.

**Evidence:** All authenticated page screenshots show this link

**Impact:** Primary navigation to dashboard is broken for all authenticated users.

---

### ISSUE-014: LCP Image Not Set to `loading="eager"` [P2 — MEDIUM]

**Category:** Performance
**Affected routes:** `/search?type=buy`

**Description:** Next.js warns that the property image identified as LCP (Largest Contentful Paint) doesn't have `loading="eager"`, which would delay the largest visual element.

**Console Warning:**
```
Image with src "/images/properties/property-1.jpg" was detected as the Largest Contentful Paint (LCP). Please add the `loading="eager"` property.
```

**Impact:** Slower perceived load time on search results. Impacts Core Web Vitals score.

---

### ISSUE-015: Cookie Consent Banner Overlaps Footer [P3 — LOW]

**Category:** Visual
**Affected routes:** All pages (first visit)

**Description:** The cookie consent banner appears at the bottom of the page and overlaps with the footer content. On desktop it's a mild annoyance; on mobile it covers a significant portion of the viewport.

**Evidence:** `screenshots/homepage.png`, `screenshots/search-buy.png`

**Impact:** Minor visual disruption. Users can dismiss it, but the overlap is not polished.

---

### ISSUE-016: `scroll-behavior: smooth` Warning on All Pages [P3 — LOW]

**Category:** Console
**Affected routes:** All pages

**Description:** Every page logs: `Detected scroll-behavior: smooth on the <html> element. To disable smooth scrolling during route transitions, add data-scroll-behavior="smooth" to your <html> element.`

**Impact:** Non-functional warning but adds noise to console. Easy fix per Next.js docs.

---

### ISSUE-017: 404 Page Loses Auth State (Shows "Sign In" When Logged In) [P3 — LOW]

**Category:** UX
**Affected routes:** Any 404 page when authenticated

**Description:** When a logged-in user hits a 404 page, the header shows "Sign In" instead of the dashboard link, suggesting the 404 page doesn't check auth state.

**Evidence:** `screenshots/settings-profile.png` (reached via broken "Profile" link)

**Impact:** Minor inconsistency. User appears logged out on 404 pages.

---

## Pages That Work Correctly

| Page | Status | Notes |
|------|--------|-------|
| Homepage (`/`) | ✅ Pass | Clean layout, all sections render, no console errors |
| Search Buy (`/search?type=buy`) | ⚠️ Partial | Results render, filters work, but map view broken, no pagination |
| Search Rent (`/search?type=rent`) | ⚠️ Partial | Works but shows "Chain Free" filter, only London results |
| Login (`/login`) | ⚠️ Partial | Works when logged out, crashes when logged in |
| Register (`/register`) | ⚠️ Partial | Works when logged out, crashes when logged in |
| Forgot Password (`/forgot-password`) | ⚠️ Partial | Works when logged out, crashes when logged in |
| Role Select (`/register/role-select`) | ✅ Pass | All 4 professional role cards render |
| Onboarding Homebuyer | ✅ Pass | Step 1 (Location) renders correctly |
| Onboarding Landlord | ✅ Pass | Step 1 (Portfolio) renders correctly |
| Onboarding Seller | ✅ Pass | Step 1 (Property) renders correctly |
| Onboarding Agent | ✅ Pass | Step 1 (Agency) renders correctly |
| Onboarding Broker | ✅ Pass | Step 1 (Firm) renders correctly |
| Services (`/services`) | ✅ Pass | All service categories render |
| Marketplace (`/marketplace`) | ✅ Pass | All trade categories render |
| Blog (`/blog`) | ✅ Pass | Articles, categories, newsletter form |
| Settings Account | ✅ Pass | Form fields render, data pre-filled |
| Settings Security | ✅ Pass | Password, 2FA, OAuth, sessions |
| Settings Privacy | ✅ Pass | Privacy modes, toggles, GDPR actions |
| Settings Notifications | ✅ Pass | All notification toggles render |
| Settings Preferences | ✅ Pass | Locale, date format, accessibility |
| Verify Email | ✅ Pass | Resend button, change email link |
| 404 Page | ✅ Pass | Custom design, helpful links |
| Admin (Access Denied) | ✅ Pass | Correct access control for non-admin |

---

## Test Flow Coverage

| Flow | User | Status | Blocker |
|------|------|--------|---------|
| 1.1 Registration | Emma | ⚠️ Partial | Registration form renders but can't test full flow (would create real account) |
| 1.3 Onboarding | Emma | ✅ Renders | All 4 steps accessible |
| 1.4 Dashboard | Emma | ❌ BLOCKED | Dashboard crashes (ISSUE-001) |
| 1.5 Property Search | Emma | ⚠️ Partial | Search works but map broken, only London |
| 1.6 Property Detail | Emma | ❌ BLOCKED | "Property Not Found" (ISSUE-003) |
| 1.8 Settings | Emma | ⚠️ Partial | 5 of 6 settings pages work, Profile 404 |
| 2.1 Google OAuth | James | ⚠️ N/A | Cannot test OAuth in headless browser |
| 2.3 Map Search | James | ❌ BLOCKED | Map view blank (ISSUE-006) |
| 4.1 Guest Browse | Alex | ⚠️ Partial | Can browse search but property detail broken |
| 6.2 Seller Onboarding | Robert | ✅ Renders | Form renders correctly |
| 8.2 Landlord Onboarding | David | ✅ Renders | Form renders correctly |
| 8.3 Landlord Dashboard | David | ❌ BLOCKED | Dashboard crashes (ISSUE-001) |
| 10.2 Agent Onboarding | Tom | ✅ Renders | Form renders correctly |
| 10.4 Agent Dashboard | Tom | ❌ BLOCKED | Dashboard crashes (ISSUE-001) |
| 13.2 Provider Onboarding | Gary | ✅ Renders | Form renders correctly (via role-select) |
| 13.3 Provider Dashboard | Gary | ❌ BLOCKED | Dashboard crashes (ISSUE-001) |
| 17.2 Broker Onboarding | Andrew | ✅ Renders | Form renders correctly |
| 17.3 Broker Dashboard | Andrew | ❌ BLOCKED | Dashboard crashes (ISSUE-001) |
| 19.1 Admin Login | Joan | ❌ BLOCKED | Login fails silently (ISSUE-005) |
| 19.2 Admin Dashboard | Joan | ❌ BLOCKED | Cannot authenticate |
| 20.4 Role Switching | Raj | ❌ BLOCKED | Dashboard crashes before reaching switcher |
| Chain A-E | All | ❌ BLOCKED | Require dashboards and property detail |

---

## Console Health Summary

| Severity | Count | Details |
|----------|-------|---------|
| Errors | 18+ | Enum mismatch (`electrical_eicr`), hydration (`button` nesting), `asChild` prop, 400 responses |
| Warnings | 2 | `scroll-behavior: smooth`, LCP `loading="eager"` |

The `electrical_eicr` enum error alone accounts for 6+ error entries (repeated across error boundary catches). The `button` nesting hydration error appears on every dashboard load.

---

## Mobile Responsiveness

| Page | Mobile (375x812) | Notes |
|------|-------------------|-------|
| Homepage | ✅ Good | Responsive layout, stacked cards, readable |
| Search | ✅ Good | Cards stack vertically, filters collapse |
| Marketplace | ✅ Good | Hamburger menu, responsive grid |

Mobile responsiveness is solid on the pages that actually render. Dashboard mobile testing blocked by crashes.

---

## Recommendations (Priority Order)

1. **IMMEDIATE:** Add `electrical_eicr` to the `document_category` PostgreSQL enum (or fix the code to use the correct enum value). This single fix will unblock all 6 dashboards.

2. **IMMEDIATE:** Fix the role-routing logic in middleware to route users to the correct dashboard based on their actual role (homebuyer → `/dashboard/homebuyer`).

3. **IMMEDIATE:** Fix property detail slug resolution so `/properties/[slug]` correctly maps to database records.

4. **HIGH:** Add auth-state redirect logic to `/login`, `/register`, `/forgot-password` — when already authenticated, redirect to dashboard instead of crashing.

5. **HIGH:** Display user-facing error messages on login failure (show toast or inline error for 400 responses).

6. **HIGH:** Fix MapLibre/MapTiler integration (check API key configuration in `.env.local`).

7. **MEDIUM:** Fix settings sidebar — rename "Profile" to "Account" or create the `/settings/profile` route.

8. **MEDIUM:** Remove "Chain Free" filter from rental search.

9. **LOW:** Fix nested `<button>` in `LandlordSidebar` (`SheetTrigger` + `Button` composition).

10. **LOW:** Add `data-scroll-behavior="smooth"` to `<html>` element per Next.js docs.

---

*Report generated by QA testing against docs/TEST-USER-FLOWS.md (20 user flows, 5 cross-user chains)*
*QA Engineer: Claude Code automated browser testing*
