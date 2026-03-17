# QA Report — Marketplace Discovery (Phase 14)

**Date:** 2026-03-17
**Target:** http://localhost:3000
**Mode:** Full
**Framework:** Next.js 16 (App Router)
**Duration:** ~15 min
**Pages visited:** 12
**Screenshots:** 14

---

## Health Score: 72/100

| Category | Weight | Score | Notes |
|----------|--------|-------|-------|
| Console | 15% | 40 | PGRST200 FK error on every agents search + 400s |
| Links | 10% | 85 | "Find Services" nav → /marketplace not /services |
| Visual | 10% | 90 | Cookie banner overlap on mobile agents page |
| Functional | 20% | 65 | Agents search broken (FK error), all specialist pages show 0 results |
| UX | 15% | 80 | Good empty states, clear CTAs, mobile responsive |
| Performance | 10% | 85 | Missing `sizes` prop on 4 hero images |
| Content | 5% | 95 | Clean copy, consistent branding |
| Accessibility | 15% | 85 | Good form labels, semantic HTML, cookie banner occlusion on mobile |

---

## Top 3 Things to Fix

1. **PGRST200: Missing FK between `agent_agency_profiles` and `profiles`** — Every search on /agents triggers a server error. The query tries to join these tables but the DB lacks the relationship. No agents can be found until this is fixed.

2. **"Find Services" nav links to `/marketplace` instead of `/services`** — The header nav takes users to the old marketplace page instead of the new Service Directory. The /services page is the intended discovery entry point.

3. **Cookie banner overlaps agents filter on mobile** — The cookie consent banner sits on top of the min-rating radio buttons and verification checkboxes on 375px viewports, making filters unusable until dismissed.

---

## Issues

### ISSUE-001: Agents search broken — PGRST200 FK relationship missing
- **Severity:** Critical
- **Category:** Functional
- **Page:** `/agents`, `/agents?q=*`
- **Repro:**
  1. Navigate to http://localhost:3000/agents
  2. Page loads with "0 estate agents found"
  3. Open console — see PGRST200 error immediately
  4. Search for anything — same error
- **Console error:** `Could not find a relationship between 'agent_agency_profiles' and 'profiles' in the schema cache`
- **Impact:** No agents can ever be displayed. The entire agents search page is non-functional.
- **Screenshot:** `/tmp/qa-agents-mobile.png`

### ISSUE-002: "Find Services" nav link goes to /marketplace not /services
- **Severity:** Medium
- **Category:** UX / Navigation
- **Page:** All pages (global header)
- **Repro:**
  1. On any page, click "Find Services" in the top nav
  2. Lands on `/marketplace` (old marketplace page)
  3. Expected: `/services` (new Service Directory)
- **Impact:** Users don't discover the new Service Directory page. Two separate entry points (/marketplace and /services) create confusion.

### ISSUE-003: Cookie banner overlaps agents filter on mobile
- **Severity:** Medium
- **Category:** Visual / Accessibility
- **Page:** `/agents` (375px viewport)
- **Repro:**
  1. Open /agents on mobile viewport (375x812)
  2. Cookie consent banner covers the "MIN RATING" radio buttons
  3. Cannot interact with rating filter until banner is dismissed
- **Impact:** Filters are partially hidden on mobile for first-time visitors.
- **Screenshot:** `/tmp/qa-agents-mobile.png`

### ISSUE-004: Missing `sizes` prop on hero property images
- **Severity:** Low
- **Category:** Performance
- **Page:** Homepage (`/`)
- **Details:** 4 Next.js Image components with `fill` prop are missing the `sizes` attribute:
  - `/images/properties/property-1.jpg`
  - `/images/properties/property-2.jpg`
  - `/images/properties/property-3.jpg`
  - `/images/properties/property-4.jpg`
- **Impact:** Browser downloads larger images than needed, hurting LCP on slower connections.

### ISSUE-005: 400 Bad Request on homepage resource load
- **Severity:** Low
- **Category:** Console
- **Page:** Homepage (`/`)
- **Details:** A 400 error fires on initial homepage load. Likely a Supabase auth/session check failing silently.
- **Impact:** Non-blocking — page renders correctly despite the error.

### ISSUE-006: Specialist pages show 0 providers (expected but UX gap)
- **Severity:** Low (Informational)
- **Category:** UX
- **Pages:** `/services/mortgage-brokers`, `/services/conveyancers`, `/services/surveyors`, `/services/architects`
- **Details:** All specialist search pages load correctly but show "0 providers found" with "No providers found — Try adjusting your filters or search terms". This is expected (no seed data) but the empty state could better guide users (e.g., "Be the first to list" CTA for providers, or "Check back soon" for consumers).

### ISSUE-007: Tradespeople card click requires scroll on /services
- **Severity:** Low
- **Category:** UX
- **Page:** `/services`
- **Details:** Clicking the "Tradespeople" card in the "Browse by profession" grid stays on `/services` and doesn't scroll down to the "Popular trades" section. The card links to `/services/tradespeople` which works, but the click interaction on the card itself appeared to not navigate (tested via browse tool @e9 click — stayed on same page). May be a client-side navigation timing issue.

---

## Console Health Summary

| Error | Count | Pages |
|-------|-------|-------|
| PGRST200 FK relationship error | 3+ | /agents, /agents?q=* |
| 400 Bad Request | 3 | /, /marketplace |
| 404 Not Found | 3 | Various (pre-existing, from earlier session) |
| Image missing `sizes` prop (warning) | 4 | / |
| Redis UPSTASH not configured (warning) | 4 | Various |

---

## Pages Tested

| Page | Status | Notes |
|------|--------|-------|
| `/` (Homepage) | 200 | Working, 400 console error |
| `/services` | 200 | Service Directory loads correctly |
| `/services/mortgage-brokers` | 200 | Loads, 0 providers (no data) |
| `/services/conveyancers` | 200 | Loads, 0 providers |
| `/services/surveyors` | 200 | Loads, 0 providers |
| `/services/architects` | 200 | Loads, 0 providers |
| `/services/tradespeople` | 200 | Loads, 0 providers |
| `/services/tradespeople?category=plumber` | 200 | Category filter passes through |
| `/services/plumber/test-provider` | 200 | Provider profile renders with empty state |
| `/jobs` | 200 | Job Board loads, filters work, 0 jobs (no data) |
| `/agents` | 200 | Loads but PGRST200 error, 0 agents |
| `/agents?area=London&min_rating=4.0` | 200 | Filters preserved in URL |
| `/post-a-job` | 200 | Auth gate working correctly |
| `/marketplace` | 200 | Legacy marketplace page working |

---

## Mobile Responsiveness

| Page | 375px | Notes |
|------|-------|-------|
| `/services` | Pass | Categories stack vertically, readable |
| `/agents` | Fail | Cookie banner overlaps filter controls |
| `/jobs` | Pass | Filters and content stack correctly |

---

## What's Working Well

- **Service Directory** (`/services`) — Clean grid layout, clear categorization, "Post a Job" CTA prominent
- **Job Board** (`/jobs`) — Postcode masking works, category/urgency filters functional, good empty state
- **Provider profiles** — Breadcrumbs, FAQ section, "Also Looking For" cross-links
- **URL structure** — Clean `/services/[category]/[slug]` pattern
- **Sanitization** — `sanitizePostgrestInput()` correctly strips filter-injection chars
- **Auth gates** — /post-a-job correctly requires sign-in
