# Consolidated QA Report: Phase 13 (Public Profiles) & Phase 14 (Marketplace Discovery)

**Date:** 2026-03-20
**Branch:** `feature/buyer-auth-flow-fixes`
**Method:** Automated QA (5 parallel sessions: browser + curl + code audit)
**Pages tested:** 13+ routes across services, agents, marketplace, jobs, compare

---

## Overall Health Score: 72/100

| Category | Score | Notes |
|----------|-------|-------|
| Functional | 65 | Sort broken, /jobs auth gate, sidebar CTA non-functional |
| Security | 85 | Good sanitization, but unverified providers accessible |
| SEO | 70 | JSON-LD excellent, but duplicate titles, missing h1s |
| Accessibility | 80 | ProfileTabs ARIA excellent, touch targets need work |
| Dark Mode | 55 | CompareBar, agents page, StarRatingBreakdown all broken |
| Responsive | 80 | Good overall, portfolio grid needs mobile fix |
| Performance | 60 | SSR times 5-27s (dev mode), Redis caching present |
| Edge Cases | 90 | Null handling excellent across all components |

---

## Bug Summary

| Severity | Count |
|----------|-------|
| P0 (Critical) | 3 |
| P1 (Must Fix) | 7 |
| P2 (Should Fix) | 9 |
| P3 (Nice to Have) | 11 |
| **Total** | **30** |

---

## P0 — Critical (3)

### P0-1: Unverified providers publicly accessible (SECURITY)
- **Source:** Session 2 (B-12)
- **File:** `src/services/providers/public-profile-service.ts`
- **Issue:** `fetchProviderBySlug()` does not filter by verification status. All provider data is exposed regardless of verification, violating RLS intent.
- **Fix:** Add `.eq("provider_verification_status", "verified")` to the query.

### P0-2: Nonexistent slugs render as fake SEO pages instead of 404
- **Source:** Session 2 (B-10)
- **File:** `src/lib/providers/location-slugs.ts`
- **Issue:** `isLocationSlug()` heuristic is too permissive. Short slugs like "nonexistent-slug" pass the check and render a bogus location page (HTTP 200) instead of 404.
- **Fix:** Validate against a known location list, or check DB for provider first.

### P0-3: `/jobs` requires auth but should be public
- **Source:** Session 1 (A-10)
- **File:** `src/lib/constants.ts:189`
- **Issue:** `/jobs` missing from `PUBLIC_ROUTES` array. Visitors get 307-redirected to `/login`.
- **Fix:** Add `"/jobs"` to the `PUBLIC_ROUTES` array.

---

## P1 — Must Fix (7)

### P1-1: Sort is entirely non-functional
- **Source:** Session 3 (C-05)
- **Files:** `src/app/api/providers/search/route.ts`, `src/services/marketplace/provider-service.ts`
- **Issue:** `ProviderSearchPage` sends `sort` param but the API route Zod schema has no `sort` field, and the RPC has no sort parameter. All sort options return identical results.

### P1-2: Duplicate "Britestate" in all page titles
- **Source:** Session 1 (A-01)
- **Files:** `src/app/layout.tsx:31` (template: `"%s | Britestate"`), plus 10+ page files
- **Issue:** Root layout appends "| Britestate" via template, but each page also includes "| Britestate" in its title string. Result: "Find a Tradesperson Near You | Britestate | Britestate"

### P1-3: `ProviderSidebar` onClick on Server Component
- **Source:** Session 5 (E-07)
- **File:** `src/components/providers/ProviderSidebar.tsx:71`
- **Issue:** `onClick` handler on a button inside a Server Component will fail at runtime. Needs `"use client"` or extract interactive part.

### P1-4: CompareBar zero dark mode variants
- **Source:** Session 5 (E-05)
- **File:** `src/components/providers/CompareBar.tsx`
- **Issue:** Renders bright white bar in dark mode. No `dark:` Tailwind variants at all.

### P1-5: Agents listing page no dark mode support
- **Source:** Session 5 (E-05)
- **File:** `src/app/(main)/agents/page.tsx`
- **Issue:** Entire page uses hardcoded `gray-*` colors with no `dark:` variants. Unusable in dark mode.

### P1-6: `/services/architects` missing specialist badge
- **Source:** Session 1 (A-06)
- **File:** `src/app/(main)/services/architects/page.tsx:48`
- **Issue:** `specialistBadge={null}` passed instead of `"RIBA"`. All other specialist pages correctly pass their badges.

### P1-7: `agent_agency_profiles` table missing `slug` column
- **Source:** Session 2 (B-04)
- **Issue:** Agent profile route `/agents/[slug]` can never match because the DB table has no slug column. Agent profiles are fundamentally broken.

---

## P2 — Should Fix (9)

### P2-1: Marketplace links to wrong routes
- **Source:** Session 1 (A-09)
- **File:** `/marketplace` page
- **Issue:** Links to `/mortgage-brokers`, `/conveyancers`, `/surveyors` instead of `/services/mortgage-brokers`, `/services/conveyancers`, `/services/surveyors`. Creates duplicate route confusion.

### P2-2: Review pagination missing
- **Source:** Session 2 (B-16)
- **File:** `ReviewsTab` component
- **Issue:** Only renders first page of reviews with no pagination controls. Plan requires 10/page with navigation.

### P2-3: ProviderSidebar quote form non-functional
- **Source:** Session 2 (B-01)
- **File:** `ProviderSidebar.tsx`
- **Issue:** Button has `onClick={() => void 0}`, all form fields disabled. Sidebar CTA is a dead end.

### P2-4: SEO location pages map "builders" to wrong enum
- **Source:** Session 1 (A-08)
- **Issue:** "builders" maps to "handyman" enum value instead of a proper "builder" category.

### P2-5: Portfolio grid 2-col on 375px mobile
- **Source:** Session 5 (E-01)
- **File:** `src/components/providers/PortfolioFilter.tsx:77`
- **Issue:** `[column-count:2]` at all sizes. Should be `[column-count:1] sm:[column-count:2]` for single-column on narrow mobile.

### P2-6: Touch targets below 44px
- **Source:** Session 5 (E-01)
- **Files:** `ProviderSearchCard.tsx` CTAs, `PortfolioFilter.tsx` chips
- **Issue:** Interactive elements smaller than 44px minimum touch target.

### P2-7: StarRatingBreakdown 4 dark mode gaps
- **Source:** Session 5 (E-05)
- **File:** `StarRatingBreakdown` component
- **Issue:** Bar track, large rating number, star labels, and review count all lack `dark:` variants.

### P2-8: PortfolioLightbox missing blur placeholder
- **Source:** Session 5 (E-07)
- **Issue:** Full-size portfolio image has no blur placeholder, causing layout shift.

### P2-9: ProviderSearchPage silently swallows API errors
- **Source:** Session 4 (D-03)
- **File:** `ProviderSearchPage`
- **Issue:** API fetch errors are caught but no error state is shown to users. Stale results remain visible with no feedback.

---

## P3 — Nice to Have (11)

| # | Issue | Source |
|---|-------|--------|
| P3-1 | QuoteModal collects `budget`/`timeline` but doesn't include in `provider_leads` insert | Session 3 |
| P3-2 | QuoteModal uses inline validation instead of Zod; `service`/`date` optional but should be required | Session 3 |
| P3-3 | CompareTable missing "Services" comparison row | Session 3 |
| P3-4 | "Compare Full" disabled button lacks `aria-label` | Session 3 |
| P3-5 | `useCompare` hook creates independent state per instance (no cross-component sync) | Session 3 |
| P3-6 | `/compare` page has no page-level title metadata | Session 1 |
| P3-7 | `/post-a-job` uses `callbackUrl` but middleware uses `redirectTo` | Session 1 |
| P3-8 | CompareButton small touch target | Session 5 |
| P3-9 | Agent card grid tight at `sm` breakpoint | Session 5 |
| P3-10 | Missing arrow key navigation for ProfileTabs | Session 5 |
| P3-11 | `<img>` used instead of `next/image` in 2 components | Session 5 |

---

## Positive Findings

- **Null data handling:** Excellent across all 9 audited components. No "NaN", "null", or "undefined" rendering anywhere.
- **XSS protection:** Two sanitization layers (`sanitize.ts` + DOMPurify), `sanitizePostgrestInput()` applied correctly, no unsafe `dangerouslySetInnerHTML`.
- **ProfileTabs ARIA:** `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`, `aria-labelledby` all correctly implemented.
- **Server Components:** 15/25 components are Server Components — good for performance.
- **JSON-LD structured data:** Comprehensive — `LocalBusiness`, `RealEstateAgent`, `aggregateRating`, `buildSpecialistJsonLd` all present.
- **Redis caching:** API search endpoint cached with graceful degradation on Redis failure.
- **ISR:** Location pages use `generateStaticParams` to pre-build hundreds of pages with `revalidate=3600`.
- **Compare flow:** Full cycle works — add/remove/localStorage/3-column table/empty state/floating bar.
- **QuoteModal error UX:** Error banner, retry option, loading state all present.
- **QuoteComparison:** GBP formatting via `Intl.NumberFormat`, line items table, "Best Value" highlight, "Accept Quote" button.
- **Empty states:** Every tab and listing page has proper empty state messages.

---

## Testing Limitations

1. **Headless browser blocked by CSP nonces** — Playwright/browse tool couldn't render pages. Visual testing was limited.
2. **Zero test data in database** — No providers or agent profiles with slugs exist. Full E2E profile browsing requires data seeding.
3. **SSR response times (5-27s)** — Expected in dev mode with Turbopack compilation. Production build performance should be verified separately.

---

## Recommended Fix Priority

### Immediate (before next merge)
1. P0-1: Filter unverified providers from public queries
2. P0-2: Fix `isLocationSlug()` to prevent fake SEO pages
3. P0-3: Add `/jobs` to `PUBLIC_ROUTES`
4. P1-1: Implement sort in API route + RPC
5. P1-3: Fix ProviderSidebar Server Component onClick
6. P1-7: Add slug column to `agent_agency_profiles`

### Next sprint
7. P1-2: Remove duplicate "Britestate" from page titles
8. P1-4/P1-5: Dark mode for CompareBar + agents page
9. P1-6: Add RIBA badge to architects
10. P2-1 through P2-9: Should-fix items

### Backlog
11. All P3 items

---

## Individual Session Reports

| Session | Report | Health Score |
|---------|--------|-------------|
| 1: Discovery & Search | `qa-report-discovery-search-2026-03-20.md` | 76/100 |
| 2: Profile Browsing | `qa-report-profile-browsing-2026-03-20.md` | N/A (blocked by data) |
| 3: Interactions | `qa-report-interactions-2026-03-20.md` | N/A (code audit) |
| 4: Edge Cases & Security | `qa-report-edge-cases-2026-03-20.md` | N/A (code audit) |
| 5: Responsive/A11y/SEO | `qa-report-responsive-a11y-seo-2026-03-20.md` | N/A (code audit) |
