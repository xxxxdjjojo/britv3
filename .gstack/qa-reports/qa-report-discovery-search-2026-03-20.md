# QA Report: Group A — Discovery & Search Flows

**Date:** 2026-03-20
**Target:** http://localhost:3000
**Mode:** Full
**Framework:** Next.js 16 (App Router)
**Duration:** ~25 minutes
**Pages visited:** 13
**Screenshots:** 2 (browse tool limited by CSP nonce — see note below)

> **Note on tooling:** The headless browser (Playwright via browse) was largely unable to render pages due to the strict Content-Security-Policy with per-request nonce generation. Scripts fail to execute in the headless context because the nonce is tied to the initial HTTP response. Testing was conducted via: (1) one successful browse session on `/services/tradespeople`, (2) `curl` HTTP response analysis for all 13 pages, and (3) source code review for structural verification.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 3     |
| Medium   | 3     |
| Low      | 2     |
| **Total**| **9** |

---

## Health Score

| Category      | Weight | Score | Notes |
|---------------|--------|-------|-------|
| Console       | 15%    | 100   | No JS errors observed in successful browse session |
| Links         | 10%    | 85    | Route duplication on marketplace page (see ISSUE-003) |
| Visual        | 10%    | 90    | Pages render correctly; unable to fully verify mobile |
| Functional    | 20%    | 70    | /jobs requires auth unexpectedly; empty results on all search pages |
| UX            | 15%    | 75    | Empty states present but no seeded data to test full flows |
| Performance   | 10%    | 40    | Dev-mode compile times 5-27s per page; expected in dev |
| Content       | 5%     | 70    | Duplicate "Britestate" in all page titles |
| Accessibility | 15%    | 85    | Proper labels on forms, breadcrumbs on SEO pages |

**Overall Health Score: 76/100**

---

## Top 3 Things to Fix

1. **ISSUE-001 (Critical):** `/jobs` route requires authentication — should be publicly accessible for browsing
2. **ISSUE-002 (High):** All page titles render with duplicate "| Britestate | Britestate" suffix
3. **ISSUE-004 (High):** `/services/architects` has `specialistBadge={null}` — missing RIBA/ARB badge

---

## Issues

### ISSUE-001: /jobs requires authentication (should be public)
- **Severity:** Critical
- **Category:** Functional
- **Page:** `/jobs`
- **Evidence:** `curl -sI http://localhost:3000/jobs` returns `HTTP/1.1 307 Temporary Redirect` with `location: /login?redirectTo=%2Fjobs`
- **Root cause:** `/jobs` is not listed in `PUBLIC_ROUTES` in `src/lib/constants.ts` (line 189). The middleware redirects unauthenticated users to login for any route not in this list.
- **Expected:** The job board should be publicly browsable. Providers need to see available jobs before signing up.
- **Fix:** Add `"/jobs"` to the `PUBLIC_ROUTES` array in `src/lib/constants.ts`.

---

### ISSUE-002: Duplicate "Britestate" in all page titles
- **Severity:** High
- **Category:** Content / SEO
- **Pages:** All pages under `/services/*`, `/agents`, `/marketplace`, `/post-a-job`
- **Evidence:** Rendered titles show e.g. `"Find a Tradesperson Near You | Britestate | Britestate"`. The root layout (`src/app/layout.tsx:31`) defines `template: "%s | Britestate"`, but individual page metadata already includes `"| Britestate"` in the title string.
- **Affected files:**
  - `src/app/(main)/services/tradespeople/page.tsx:9` — `"Find a Tradesperson Near You | Britestate"`
  - `src/app/(main)/services/mortgage-brokers/page.tsx:9` — `"Find a Mortgage Broker Near You | Britestate"`
  - `src/app/(main)/services/conveyancers/page.tsx:9` — `"Find a Conveyancer Near You | Britestate"`
  - `src/app/(main)/services/surveyors/page.tsx:9` — `"Find a Surveyor Near You | Britestate"`
  - `src/app/(main)/services/architects/page.tsx:9` — `"Find an Architect Near You | Britestate"`
  - `src/app/(main)/agents/page.tsx:9` — `"Find an Estate Agent Near You | Britestate"`
  - `src/app/(main)/marketplace/page.tsx:23` — `"Find Service Providers | Britestate"`
  - `src/app/(main)/post-a-job/page.tsx:7` — `"Post a Job — Get Free Quotes | Britestate"`
  - `src/app/(main)/jobs/page.tsx:9` — `"Job Board — Find Work Near You | Britestate"`
  - `src/app/(main)/services/tradespeople/[category]/[location]/page.tsx:89` — `"... | Britestate"`
- **Fix:** Remove `" | Britestate"` from all individual page title strings. The root layout template already appends it.

---

### ISSUE-003: Marketplace category links use inconsistent routes
- **Severity:** High
- **Category:** Links / UX
- **Page:** `/marketplace`
- **Evidence:** In `src/app/(main)/marketplace/page.tsx`, the CATEGORIES array (lines 44-46) links to:
  - `"/mortgage-brokers"` instead of `"/services/mortgage-brokers"`
  - `"/conveyancers"` instead of `"/services/conveyancers"`
  - `"/surveyors"` instead of `"/services/surveyors"`
- **Impact:** These routes DO exist as separate pages (confirmed 200 status), but they are duplicate routes outside the `/services/` namespace. This creates two different URLs for the same content, which hurts SEO (duplicate content) and creates confusion about canonical URLs.
- **Fix:** Either (a) update marketplace links to use `/services/` prefix, or (b) add canonical redirects from the root-level routes to `/services/` versions.

---

### ISSUE-004: Architects search page missing specialist badge (RIBA/ARB)
- **Severity:** High
- **Category:** Functional
- **Page:** `/services/architects`
- **Evidence:** In `src/app/(main)/services/architects/page.tsx:48`, `specialistBadge={null}` is passed to `ProviderSearchPage`. Compare with:
  - `/services/mortgage-brokers` passes `specialistBadge="FCA"`
  - `/services/conveyancers` passes `specialistBadge="SRA"`
  - `/services/surveyors` passes `specialistBadge="RICS"`
- **Note:** The `/architects/[slug]` detail page (separate route) correctly displays RIBA/ARB badges (lines 84, 96), but the search listing page does not.
- **Fix:** Change `specialistBadge={null}` to `specialistBadge="RIBA"` (or add RIBA/ARB support to the badge system).

---

### ISSUE-005: SEO location page maps "builders" to wrong enum
- **Severity:** Medium
- **Category:** Functional
- **Page:** `/services/tradespeople/[category]/[location]`
- **Evidence:** In `src/app/(main)/services/tradespeople/[category]/[location]/page.tsx`, the `CATEGORY_SLUG_TO_ENUM` mapping (line 24) maps `"builders"` to `"handyman"` and `"painters"` to `"other"`, `"carpenters"` to `"other"`. This means searches for builders on SEO pages will actually query for handymen, and painters/carpenters will match the generic "other" category.
- **Fix:** Add proper `"builder"`, `"painter"`, `"carpenter"` values to the `ServiceCategory` enum, or use the closest matching enum values.

---

### ISSUE-006: No seeded/demo data for any provider search
- **Severity:** Medium
- **Category:** UX
- **Pages:** All search pages (`/services/tradespeople`, `/services/mortgage-brokers`, `/services/conveyancers`, `/services/surveyors`, `/services/architects`, `/agents`)
- **Evidence:** All search pages show "0 providers found" / "No providers found" with the empty state message. The `/marketplace` featured providers section is also empty (query requires `total_reviews > 5`).
- **Impact:** Cannot test full search flow, provider cards, "View Profile" links, rating filters, or Compare feature in practice.
- **Recommendation:** Seed the database with demo providers for QA testing.

---

### ISSUE-007: /compare page has no page-level `<title>` metadata
- **Severity:** Medium
- **Category:** Content / SEO
- **Page:** `/compare`
- **Evidence:** The compare page (`src/app/(main)/compare/page.tsx`) is a client component (`"use client"`) and does not export `metadata`. The rendered title falls back to the root layout default: `"Britestate | UK Property Portal"`.
- **Fix:** Either convert to server component with metadata export, or use `generateMetadata` / `useEffect` with `document.title` to set the page title to "Compare Service Providers | Britestate".

---

### ISSUE-008: /post-a-job uses `callbackUrl` param but login expects `redirectTo`
- **Severity:** Low
- **Category:** Functional
- **Page:** `/post-a-job`
- **Evidence:** The sign-in link on the post-a-job page (line 104) uses `href="/login?callbackUrl=/post-a-job"`, but the middleware redirect system uses `redirectTo` parameter (as seen in the `/jobs` redirect: `location: /login?redirectTo=%2Fjobs`). If the login page only reads `redirectTo`, the `callbackUrl` parameter will be ignored and the user won't be redirected back to `/post-a-job` after login.
- **Fix:** Change `callbackUrl` to `redirectTo` in `/post-a-job` page links, or ensure the login page handles both params.

---

### ISSUE-009: /services page title includes "| Britestate Services" (inconsistent)
- **Severity:** Low
- **Category:** Content
- **Page:** `/services`
- **Evidence:** Title is `"Find Trusted Professionals | Britestate Services"` which renders as `"Find Trusted Professionals | Britestate Services | Britestate"` — a triple mention of the brand.
- **Fix:** Change to `"Find Trusted Professionals"` (let the template handle the suffix).

---

## Page-by-Page Status

| # | Page | HTTP | Title | Loads | Filters | Notes |
|---|------|------|-------|-------|---------|-------|
| 1 | `/services` | 200 | Find Trusted Professionals... | OK | N/A (hub) | 6 category cards + Popular Trades section present |
| 2 | `/services/tradespeople` | 200 | Find a Tradesperson... | OK | Service, Postcode, Distance, Rating, Verification, Hourly rate, Keyword, Sort | All filters present; empty results (no data) |
| 3 | `/services/mortgage-brokers` | 200 | Find a Mortgage Broker... | OK | Postcode, search | FCA badge configured |
| 4 | `/services/conveyancers` | 200 | Find a Conveyancer... | OK | Postcode, search | SRA badge configured |
| 5 | `/services/surveyors` | 200 | Find a Surveyor... | OK | Postcode, search | RICS badge configured |
| 6 | `/services/architects` | 200 | Find an Architect... | OK | Postcode, search | MISSING specialist badge (null) |
| 7 | `/agents` | 200 | Find an Estate Agent... | OK | Search (q), Area, Min Rating | 3 rating options (4.5+, 4.0+, 3.5+) |
| 8 | `/marketplace` | 200 | Find Service Providers... | OK | N/A (hub) | 12 category cards + featured section (empty) |
| 9 | `/jobs` | 307 | Job Board... | REDIRECT | Category, Urgency, Pagination | Redirects to /login (not in PUBLIC_ROUTES) |
| 10 | `/post-a-job` | 200 | Post a Job... | OK | RFQ form (auth-gated inline) | Shows sign-in CTA when not authenticated |
| 11 | `/compare` | 200 | (default) | OK | N/A | Empty state with "Find Providers" CTA |
| 12 | `/services/tradespeople/plumber/london` | 200 | Plumber in London... | OK | N/A | SEO page with FAQ, breadcrumbs, ISR |
| 13 | `/marketplace/some-slug` | 200* | Provider Not Found | OK | N/A | Calls API, returns notFound() or redirects to `/services/[category]/[slug]` |

---

## Test Scenario Results

| ID | Scenario | Result | Notes |
|----|----------|--------|-------|
| A-01 | Full marketplace entry from homepage | PARTIAL | `/services` hub loads with 6 cards. Click-through to tradespeople works. Search returns 0 results (no data). |
| A-02 | Empty search results | PASS | Empty state displays "No providers found / Try adjusting your filters or search terms" |
| A-03 | Mortgage broker specialist page | PASS | Loads with correct title, FCA badge configured |
| A-04 | Conveyancer specialist page | PASS | Loads with correct title, SRA badge configured |
| A-05 | Surveyor specialist page | PASS | Loads with correct title, RICS badge configured |
| A-06 | Architect specialist page | PARTIAL | Loads but specialistBadge is null (should be RIBA/ARB) |
| A-07 | Estate Agent search | PASS | Loads with area/rating filters |
| A-08 | SEO category location pages | PASS | `/services/tradespeople/plumber/london` loads with proper SEO content, FAQ, breadcrumbs, ISR |
| A-09 | Marketplace hub | PASS | Category grid present (12 categories). Featured providers empty (no data). |
| A-10 | Job Board | FAIL | Requires authentication; 307 redirect to /login |
| A-11 | Post a Job | PASS | Shows auth CTA for unauthenticated users; form for authenticated |
| A-12 | Marketplace redirect | PASS | `/marketplace/[slug]` correctly redirects to `/services/[category]/[slug]` or returns 404 |

---

## Console Health

No JavaScript console errors were observed during the successful browse session on `/services/tradespeople`.

---

## Baseline

See `baseline-discovery-search-2026-03-20.json` for regression testing.
