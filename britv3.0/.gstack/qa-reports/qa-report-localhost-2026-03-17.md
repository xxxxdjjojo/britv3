# QA Report — Britestate (localhost:3000)

**Date:** 2026-03-17
**Duration:** ~12 minutes
**Mode:** Full
**Framework:** Next.js 16 (App Router)
**Pages visited:** 14
**Screenshots:** 12

---

## Health Score: 52 / 100

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Console | 40 | 15% | 6.0 |
| Links | 40 | 10% | 4.0 |
| Visual | 85 | 10% | 8.5 |
| Functional | 35 | 20% | 7.0 |
| UX | 60 | 15% | 9.0 |
| Performance | 70 | 10% | 7.0 |
| Content | 90 | 5% | 4.5 |
| Accessibility | 80 | 15% | 12.0 |
| **Total** | | | **58** |

---

## Top 3 Things to Fix

1. **Middleware over-catches routes** — Unknown paths (e.g. `/nonexistent-page`, `/blog`) redirect to login instead of showing 404 or the actual public page. Blog, which should be public, requires authentication.
2. **Broken service links from homepage and footer** — All 6 homepage service category links (`/services/plumbers`, `/services/electricians`, etc.) and 3 footer links (`/services/agents`, `/services/mortgage`, `/services/estate-agents`) return 404.
3. **Agent search DB error** — `agent_agency_profiles` → `profiles` relationship not found in PostgREST schema cache (PGRST200). The agents page always shows 0 results.

---

## Issues

### ISSUE-001: Middleware redirects unknown/public routes to login [Critical]

**Severity:** Critical
**Category:** Functional

**Description:** The auth middleware is too aggressive. Routes that don't exist (e.g. `/nonexistent-page`) return HTTP 200 and render the login page instead of the 404 page. Public routes like `/blog` also redirect to login.

**Repro steps:**
1. Navigate to `http://localhost:3000/nonexistent-page`
2. Observe: login page renders with HTTP 200 (not 404)
3. Navigate to `http://localhost:3000/blog`
4. Observe: login page renders instead of blog listing

**Evidence:** `screenshots/404-page.png`, `screenshots/blog.png`

**Impact:** Users hitting any unknown URL see a login form instead of a helpful 404. Public content (blog) is inaccessible to unauthenticated users. SEO impact: crawlers see login for all dead links.

---

### ISSUE-002: Homepage service category links all 404 [Critical]

**Severity:** Critical
**Category:** Links

**Description:** The homepage "Trusted professionals" section links to `/services/plumbers`, `/services/electricians`, `/services/builders`, `/services/estate-agents`, `/services/mortgage-brokers`, `/services/surveyors`. All return 404. The actual service routes use `/services/[category]/[slug]` format (e.g. `/services/plumbing/london`).

**Repro steps:**
1. Navigate to homepage
2. Scroll to "Trusted professionals, verified by us" section
3. Click any category (e.g. "Plumbers")
4. Observe: 404 page

**Evidence:** `screenshots/plumbers-category.png`

**Also broken (footer):**
- `/services/agents` → 404 (footer "Estate Agents" link)
- `/services/mortgage` → 404 (footer "Mortgage Brokers" link)
- `/services/estate-agents` → 404

**Impact:** 9 broken links across homepage and footer. Users cannot browse services from the main navigation paths.

---

### ISSUE-003: Agent search fails with PGRST200 DB relationship error [High]

**Severity:** High
**Category:** Functional

**Description:** The agents page (`/agents`) always shows "0 estate agents found" because the Supabase query fails with error PGRST200: "Could not find a relationship between 'agent_agency_profiles' and 'profiles' in the schema cache." The error is caught and swallowed, showing an empty state.

**Repro steps:**
1. Navigate to `http://localhost:3000/agents`
2. Observe: "0 estate agents found"
3. Check console: PGRST200 error logged

**Evidence:** `screenshots/agents-page.png`

**Console error:**
```
Agent search error: {code: PGRST200, message: Could not find a relationship
between 'agent_agency_profiles' and 'profiles' in the schema cache}
```

**Impact:** Agent discovery is completely non-functional. The page renders but has no data.

---

### ISSUE-004: Marketplace search does nothing [High]

**Severity:** High
**Category:** Functional

**Description:** The marketplace search input (`/marketplace`) accepts text and has a search button, but submitting a search (e.g. `?q=plumber`) has no effect. The page renders identically with or without a query parameter — the `q` param is not consumed by the page component.

**Repro steps:**
1. Navigate to `http://localhost:3000/marketplace`
2. Type "plumber" in search box, click Search
3. Observe: URL updates to `/marketplace?q=plumber` but results don't filter

**Evidence:** `screenshots/marketplace-search.png` (identical to `screenshots/marketplace.png`)

**Impact:** Users cannot search for service providers from the marketplace landing page.

---

### ISSUE-005: Property listing images all show "No image" placeholder [Medium]

**Severity:** Medium
**Category:** Visual

**Description:** All property listings on the search results page (`/search`) display "No image" text in a grey placeholder box. The featured properties on the homepage have images, but search results do not.

**Repro steps:**
1. Navigate to `http://localhost:3000/search`
2. Observe: all 8 property cards show "No image"

**Evidence:** `screenshots/search-page.png`

**Impact:** Property search looks broken/empty. Users can't see properties visually, reducing engagement.

---

### ISSUE-006: Google OAuth returns raw JSON error [Medium]

**Severity:** Medium
**Category:** Functional

**Description:** Clicking "Continue with Google" on login/register navigates to Supabase auth endpoint which returns raw JSON: `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`. No error handling or user-friendly fallback.

**Repro steps:**
1. Navigate to `http://localhost:3000/register`
2. Click "Continue with Google"
3. Observe: raw JSON error page from Supabase

**Evidence:** `screenshots/register-validation.png`

**Impact:** Users attempting Google sign-in see a raw JSON error with no way to recover. This is likely an environment config issue (Google OAuth not enabled in Supabase), but the UI should handle it gracefully.

---

### ISSUE-007: Persistent 400 Bad Request on page load [Medium]

**Severity:** Medium
**Category:** Console

**Description:** Every page load triggers a 400 Bad Request error in the console. This appears to be a failed resource fetch (likely Supabase auth session check or analytics). It persists across all pages.

**Repro steps:**
1. Navigate to any page
2. Open console
3. Observe: "Failed to load resource: the server responded with a status of 400 (Bad Request)"

**Impact:** Persistent console errors indicate a misconfigured integration. Could mask other issues during debugging.

---

### ISSUE-008: Next.js Image components missing `sizes` prop [Low]

**Severity:** Low
**Category:** Performance

**Description:** Four property images on the homepage use `fill` prop without `sizes`, generating Next.js warnings. This causes suboptimal image loading — the browser downloads larger images than needed.

**Console warnings:**
```
Image with src "/images/properties/property-1.jpg" has "fill" but is missing "sizes" prop.
Image with src "/images/properties/property-2.jpg" has "fill" but is missing "sizes" prop.
Image with src "/images/properties/property-3.jpg" has "fill" but is missing "sizes" prop.
Image with src "/images/properties/property-4.jpg" has "fill" but is missing "sizes" prop.
```

**Impact:** Performance degradation on mobile — larger images downloaded than viewport requires.

---

## Console Health Summary

| Type | Count | Details |
|------|-------|---------|
| Errors | 7+ | 400 Bad Request (persistent), PGRST200 agent search (x2), 404 resource loads (x3+), Google OAuth 400 |
| Warnings | 6+ | 4x Next.js Image `sizes` prop, 2x+ Redis UPSTASH not configured |

---

## Pages Tested

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Homepage | `/` | 200 | Working, good layout |
| Search | `/search` | 200 | Working but no property images |
| Search (buy) | `/search?type=buy` | 200 | Working |
| Agents | `/agents` | 200 | Empty — DB error |
| Marketplace | `/marketplace` | 200 | Search doesn't filter |
| Login | `/login` | 200 | Working |
| Register | `/register` | 200 | Working (form layout OK) |
| Valuation | `/valuation` | 200 | Redirects to login (expected) |
| Blog | `/blog` | 200 | Redirects to login (unexpected) |
| About | `/about` | 200 | Working |
| Sold Prices | `/sold-prices` | 200 | Working |
| Help | `/help` | 200 | Working |
| Services/plumbers | `/services/plumbers` | 404 | Broken link |
| Services/agents | `/services/agents` | 404 | Broken link |
| Services/mortgage | `/services/mortgage` | 404 | Broken link |
| Property detail | `/properties/1` | 200 | Not found (expected — demo IDs) |
| Areas | `/areas` | 200 | Working |
| Areas/london | `/areas/london` | 200 | Working |
| 404 test | `/nonexistent-page` | 200 | Shows login (should be 404) |

---

## Severity Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 2 |
| Medium | 3 |
| Low | 1 |
| **Total** | **8** |
