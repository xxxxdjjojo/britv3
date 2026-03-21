# QA Session 2 - Group B: Profile Browsing Flows

**Date:** 2026-03-20
**Environment:** http://localhost:3000 (dev server)
**Branch:** feature/buyer-auth-flow-fixes
**Tester:** Claude (automated)

---

## Executive Summary

Profile browsing infrastructure is **mostly built** with well-structured components, but **cannot be fully tested end-to-end** because the database has **zero providers** and **zero agent_agency_profiles**. Several critical bugs were found through code review and partial browser testing.

**Severity counts:** 2 Critical, 3 High, 4 Medium, 2 Low

---

## Test Results

### B-01: Tradesperson Profile Deep-Dive
**Status:** BLOCKED (no providers in DB)
**Screenshot:** `screenshots/b01-tradespeople-listing.png`

The listing page at `/services/tradespeople` renders correctly with:
- Search bar (what/where)
- Filter sidebar (service type, postcode, distance, min rating, verification checkboxes, hourly rate slider, keyword search)
- Sort dropdown (Best Match, Highest Rated, Most Reviews, Newest)
- Empty state: "No providers found - Try adjusting your filters or search terms"

**Code review confirms all profile components exist and are complete:**
- `ProviderHero`: cover photo/gradient fallback, avatar/initials fallback, business name (h1), category, verified badge, rating stars, TrustBadges, location, years experience, CTA buttons (Request Quote, Call, Message)
- `ProfileTabs`: 4 tabs (About, Services & Pricing, Portfolio, Reviews) with hash-based deep-linking
- `ServicesTab`: service cards with PricingBadge (hourly=green, fixed=blue, quote=amber), "Request Quote" button
- `PortfolioTab` + `PortfolioFilter`: category filter pills, masonry grid (`column-count` CSS), `PortfolioLightbox` using Dialog
- `ReviewsTab`: star rows, reviewer avatar/initials, relative date, provider response block
- `StarRatingBreakdown`: large rating display, star distribution bars
- `ProviderSidebar`: sticky, "Get a Free Quote" card, service dropdown (disabled), date picker (disabled), "Send Quote Request" button, Britestate Protection trust card

### B-02: Empty States
**Status:** PASS (code review)

All tabs have proper empty states:
- ReviewsTab: "No reviews yet. Be the first to review {providerName}!"
- PortfolioFilter: "{providerName} hasn't added portfolio items yet."
- ServicesTab: "No services listed yet."
- Tradespeople listing: "No providers found - Try adjusting your filters or search terms"
- Agents listing: "No estate agents found. Try adjusting your filters."

### B-03: Deep-Link via URL Hash
**Status:** PASS (code review)

`ProfileTabs` reads `window.location.hash` on mount via `useEffect` and sets the active tab if it matches a valid tab ID. Tab clicks update the URL hash via `history.replaceState`. The `#reviews` hash will correctly activate the Reviews tab.

### B-04: Estate Agent Profile Deep-Dive
**Status:** BLOCKED (no agent_agency_profiles with slug)
**Screenshot:** `screenshots/b04-agents-listing.png`

The agents listing page at `/agents` renders correctly with:
- Search bar, area filter, min rating filter
- Empty state: "No estate agents found. Try adjusting your filters."
- Agent CTA: "Are you an estate agent? Create Your Agent Profile"

**Code review confirms all agent profile components exist:**
- `AgencyHero`: cover gradient, logo/initials fallback, verified badge (always shown), "Premium Partner" badge (always shown), rating, location, Follow/Contact Agent CTAs, AgencyStatBar
- `AgentProfileTabs`: Overview, Active Listings, Sold/Let, Reviews, Our Team, Request Valuation
- `ListingsTab`, `SoldLetTab`: PropertyCard grid
- `AgentReviewsTab`: star rating, reviewer info
- `TeamMembersTab`: avatar/initials, name, role, bio
- `AgentSidebar`: "Thinking of selling?" CTA, ValuationSheet, Office Information (address, phone, hours), Map placeholder, Team preview

### B-05: Valuation Request
**Status:** PASS (code review)

`ValuationSheet` is a Shadcn Sheet slide-in form with:
- Trigger: "Request a Free Valuation" button
- Form fields: Property Address (required), Postcode, Property Type (dropdown), Bedrooms (dropdown), Tenure (dropdown), Preferred Contact Time (dropdown), Name (required), Phone (required), Email (required)
- Submit action: inserts into `agent_leads` table with stage='new_enquiry'
- Success state: green checkmark, "Request Submitted! We'll be in touch within 24 hours."
- Error state: inline error message

### B-06 to B-09: Specialist Listing Pages
**Status:** PARTIAL PASS
**Screenshots:** `screenshots/b06-surveyors-listing.png`, `screenshots/b07-mortgage-brokers-listing.png`, `screenshots/b08-conveyancers-listing.png`, `screenshots/b09-architects-listing.png`

| Route | Status | Badge |
|-------|--------|-------|
| `/services/surveyors` | 200 OK | "RICS Regulated" (green badge) |
| `/services/mortgage-brokers` | 200 OK | "FCA Regulated" (green badge) |
| `/services/conveyancers` | 200 OK | "SRA Regulated" (green badge) |
| `/services/architects` | 200 OK | **No badge** (missing RIBA/ARB) |

All show "0 providers found" (no data). Pages load correctly with appropriate headings.

### B-10: Provider 404 Handling
**Status:** FAIL (CRITICAL BUG)
**Screenshot:** `screenshots/b10-provider-nonexistent-renders-seo.png`

`/services/plumbers/nonexistent-slug` returns **HTTP 200** and renders a bogus SEO page: "Verified Plumbers in Nonexistent Slug" with FAQ content for "Nonexistent Slug" as if it were a UK location.

**Root cause:** `isLocationSlug()` in `src/lib/providers/location-slugs.ts` (line 41-47) uses an overly permissive heuristic. Any slug that is <= 25 chars, has <= 2 hyphens, only letters/hyphens, and no digits passes the check. "nonexistent-slug" matches all criteria (17 chars, 1 hyphen, only letters).

**Fix:** Either tighten the heuristic or check if the slug exists as a provider first, falling through to location only if no provider match found.

### B-11: Agent 404 Handling
**Status:** PASS
**Screenshot:** `screenshots/b11-agent-404.png`

`/agents/deleted-agency` correctly returns HTTP 404 with a well-designed custom 404 page (house icon, "Page not found", "Go Home" and "Search Properties" buttons, helpful links).

### B-12: Unverified Provider Returns 404
**Status:** FAIL (CRITICAL BUG)

`fetchProviderBySlug()` in `src/services/providers/public-profile-service.ts` does **NOT** filter by `provider_verification_status === 'verified'`. It fetches any provider by slug regardless of verification status.

This is a **data leak**: unverified, rejected, or suspended providers' full profiles (business name, description, phone, services, portfolio, reviews) would be publicly accessible via their slug URL.

**Fix:** Add `.eq("profiles.provider_verification_status", "verified")` to the Supabase query in `fetchProviderBySlug()`.

### B-13: Avatar/Logo Fallbacks
**Status:** PASS (code review)

Both `ProviderHero.AvatarFallback` and `AgencyHero.LogoFallback` generate initials from the business/agency name (first letters of first two words, uppercased). Falls back to "?" or "AG" if no name.

### B-14: Agent Logo Fallback
**Status:** PASS (code review)

`AgentSidebar` team preview also has initials fallback for members without avatar_url.

### B-15: Long Text Content
**Status:** PASS WITH CAVEAT

Provider descriptions use `max-w-3xl` container but no text truncation. Very long descriptions will render fully. Service card descriptions are not truncated either. Portfolio titles use `truncate` in the masonry grid overlay. Review bodies render fully without truncation.

**Note:** No `overflow-x-hidden` on the description containers could cause horizontal overflow with very long unbroken strings.

### B-16: Review Pagination
**Status:** FAIL (HIGH)

`ReviewsTab` renders all reviews as a flat list with no pagination, "load more", or "next page" button. The page.tsx fetches only page 1 via `fetchProviderReviews(provider.id, 1)`, so only the first page of reviews is shown with no way to access additional reviews.

---

## Bugs Found

### CRITICAL

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| 1 | **Nonexistent provider slugs render as bogus SEO pages instead of 404** | `src/lib/providers/location-slugs.ts` lines 41-47 | SEO spam, confusing UX, potential duplicate content penalties |
| 2 | **Unverified providers' profiles are publicly accessible** | `src/services/providers/public-profile-service.ts` `fetchProviderBySlug()` | Data leak, privacy violation |

### HIGH

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| 3 | **`agent_agency_profiles` table has no `slug` column** | `supabase/migrations/20260313_agent_dashboard.sql` | Agent profile route `/agents/[slug]` always returns 404 |
| 4 | **Review pagination missing** | `src/components/providers/ReviewsTab.tsx` | Only first page of reviews visible; no way to see older reviews |
| 5 | **ProviderSidebar quote form is non-functional** | `src/components/providers/ProviderSidebar.tsx` line 72 | "Send Quote Request" button has `onClick={() => void 0}` (no-op), form fields all disabled |

### MEDIUM

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| 6 | **Hydration mismatch on listing pages** | `HeroSearchBar` + `SearchFilters` components | `style={{caret-color:"transparent"}}` added client-side only; React hydration warning in console |
| 7 | **RIBA/ARB badge missing for architects** | `src/components/providers/SpecialistHero.tsx` | Architect profiles don't show regulatory badge |
| 8 | **SpecialistHero not used on profile pages** | `src/app/(main)/services/[category]/[slug]/page.tsx` | Profile pages use generic `ProviderHero` which lacks specialist badge rendering |
| 9 | **"Premium Partner" badge always shown on AgencyHero** | `src/components/agents/AgencyHero.tsx` line 88 | All agents show "Premium Partner" regardless of actual tier |

### LOW

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| 10 | **Verified badge always shown on AgencyHero** | `src/components/agents/AgencyHero.tsx` line 77 | All agents show verified badge regardless of verification status |
| 11 | **Slow initial page loads (3-7s)** | SSR compilation | First load of any page takes 3-7 seconds in dev mode (expected for Turbopack cold compilation) |

---

## Screenshots Captured

| File | Description |
|------|-------------|
| `b01-tradespeople-listing.png` | Tradespeople listing page (0 providers) |
| `b04-agents-listing.png` | Agents listing page (0 agents) |
| `b06-surveyors-listing.png` | Surveyors listing page with RICS badge |
| `b07-mortgage-brokers-listing.png` | Mortgage Brokers listing page with FCA badge |
| `b08-conveyancers-listing.png` | Conveyancers listing page with SRA badge |
| `b09-architects-listing.png` | Architects listing page (no badge) |
| `b10-provider-nonexistent-renders-seo.png` | BUG: nonexistent slug renders as SEO page |
| `b11-agent-404.png` | Agent 404 page (correct behavior) |

---

## What Could Not Be Tested

Due to empty database (0 providers, 0 agent_agency_profiles with slug):

1. **B-01 full flow**: Cannot click into a provider profile, verify SSR content, tab navigation, sidebar CTA interaction
2. **B-04 full flow**: Cannot click into an agent profile, verify AgencyHero, active listings, sold/let, team members
3. **B-05 live**: Cannot test ValuationSheet opening and form submission
4. **B-03 live**: Cannot test hash deep-linking on a real profile page
5. **B-12 live**: Cannot verify unverified provider returns 404 (confirmed as bug via code review)
6. **B-13/B-14 live**: Cannot verify initials fallback visually (confirmed via code review)
7. **B-15 live**: Cannot test actual long text overflow
8. **B-16 live**: Cannot test pagination with many reviews

---

## Recommendations

1. **Seed test data**: Create seeded providers and agents in the database for meaningful E2E testing
2. **Fix isLocationSlug**: Add DB lookup for provider slug before falling back to location heuristic
3. **Add verification filter**: Add `.eq("profiles.provider_verification_status", "verified")` to `fetchProviderBySlug()`
4. **Add slug column**: Run migration to add `slug` column to `agent_agency_profiles`
5. **Implement review pagination**: Add "Load More" or page number buttons to ReviewsTab
6. **Wire up ProviderSidebar**: Connect quote form to QuoteModal or make form fields functional
7. **Integrate SpecialistHero**: Use SpecialistHero instead of ProviderHero when category is a specialist type
