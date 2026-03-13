---
phase: 17-service-provider-public-profiles
plan: "02"
subsystem: ui
tags: [next.js, server-components, json-ld, seo, providers, tailwind]

requires:
  - phase: 17-01
    provides: ServiceProviderPublicProfile type, fetchProviderBySlug, fetchProviderReviews, fetchPortfolioItems, fetchProviderServices, SLUG_TO_CATEGORY

provides:
  - src/lib/providers/jsonld.ts (buildProviderJsonLd — LocalBusiness schema.org JSON-LD)
  - src/components/providers/ProviderHero.tsx (cover + avatar + identity + badges + CTAs)
  - src/components/providers/TrustBadges.tsx (flex-wrap badge pills with BADGE_CONFIG)
  - src/components/providers/ProviderSidebar.tsx (sticky quote form + Britestate Protection card)
  - src/components/providers/CompareButton.tsx (localStorage compare list, max 3)
  - src/components/providers/StarRatingBreakdown.tsx (avg score + star distribution bars)
  - src/app/(main)/services/[category]/[slug]/ProfileTabs.tsx (URL hash-persistent client island)
  - src/app/(main)/services/[category]/[slug]/page.tsx (SSR shell with generateMetadata + JSON-LD)

affects:
  - "Plan 17-03 (fills in services/portfolio/reviews tab content)"
  - "Plan 17-04 (agent profile page uses same shell pattern)"
  - "Plan 17-07 (useCompare hook replaces CompareButton localStorage fallback)"

tech-stack:
  added: []
  patterns:
    - "Server Component hero with cover photo using next/image fill + gradient overlay"
    - "Client island (ProfileTabs) receives typed ReactNode props per tab (about/services/portfolio/reviews) from Server Component parent"
    - "URL hash persistence for tab state via history.replaceState in useEffect"
    - "JSON-LD injected via dangerouslySetInnerHTML script tag in page.tsx"
    - "CompareButton with localStorage fallback while useCompare hook not yet available"

key-files:
  created:
    - src/lib/providers/jsonld.ts
    - src/components/providers/ProviderHero.tsx
    - src/components/providers/TrustBadges.tsx
    - src/components/providers/ProviderSidebar.tsx
    - src/components/providers/CompareButton.tsx
    - src/components/providers/StarRatingBreakdown.tsx
    - src/app/(main)/services/[category]/[slug]/ProfileTabs.tsx
    - src/app/(main)/services/[category]/[slug]/page.tsx
  modified: []

key-decisions:
  - "ProfileTabs receives typed ReactNode props (about/services/portfolio/reviews) rather than children + data-tab attributes — avoids cross-boundary Server/Client children iteration complexity"
  - "CompareButton implements localStorage compare logic directly as fallback since useCompare hook ships in Plan 17-07 — avoids dynamic import failure"
  - "ProviderHero maps qualifications[] to accreditation badge objects since the actual type has qualifications not accreditations — preserves type safety"
  - "page.tsx calls fetchProviderReviews with provider.id (service_provider_details PK) not user_id, and uses 1-based pagination consistent with service API"

patterns-established:
  - "Pattern 1: Hero-with-tabs layout — ProviderHero above, ProfileTabs + ProviderSidebar in flex row below"
  - "Pattern 2: Client island receives Server Component content as typed ReactNode props, not children"

requirements-completed:
  - PROF-01

duration: 20min
completed: 2026-03-13
---

# Phase 17 Plan 02: Tradesperson Profile Shell Summary

**SSR profile page at /services/[category]/[slug] with LocalBusiness JSON-LD, hero section (cover/avatar/badges/CTAs), URL-hash-persistent tab island, and sticky quote sidebar**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-13T22:08:38Z
- **Completed:** 2026-03-13T22:29:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- SSR page shell with `generateMetadata` (provider name + category in title), `notFound()` for missing slugs, and `Promise.all` for parallel initial data fetch
- `buildProviderJsonLd()` generates schema.org LocalBusiness JSON with aggregateRating (only when stats exist)
- `ProviderHero` renders 300px cover photo with gradient overlay, 160px circle avatar with verified shield, identity block (rating, location, experience), TrustBadges row, and CTA buttons
- `ProfileTabs` client island with 4 tabs (About/Services & Pricing/Portfolio/Reviews), URL hash persistence via `history.replaceState`, CSS `block/hidden` panel toggling

## Task Commits

Each task was committed atomically:

1. **Task 1: JSON-LD + ProviderHero + TrustBadges + ProviderSidebar + CompareButton + StarRatingBreakdown** - `17603af` (feat)
2. **Task 2: ProfileTabs client island + page.tsx SSR shell** - `29e3184` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `src/lib/providers/jsonld.ts` - buildProviderJsonLd() — pure LocalBusiness JSON-LD generator
- `src/components/providers/ProviderHero.tsx` - Cover photo, avatar, identity, TrustBadges, CTA buttons
- `src/components/providers/TrustBadges.tsx` - 8-type BADGE_CONFIG badge pills (britestate_verified, gas_safe, niceic, fca, rics, sra, clc, insured)
- `src/components/providers/ProviderSidebar.tsx` - Sticky quote form + Britestate Protection trust card
- `src/components/providers/CompareButton.tsx` - localStorage compare list (max 3) with direct fallback
- `src/components/providers/StarRatingBreakdown.tsx` - Avg score display, star distribution bars
- `src/app/(main)/services/[category]/[slug]/ProfileTabs.tsx` - Client island tab switcher with URL hash persistence
- `src/app/(main)/services/[category]/[slug]/page.tsx` - SSR shell with generateMetadata, JSON-LD, notFound(), data fetching

## Decisions Made

- `ProfileTabs` uses typed `ReactNode` props (about/services/portfolio/reviews) rather than children iteration — avoids complex Server/Client boundary issues with React.Children.map
- `CompareButton` implements localStorage logic directly for now, to be replaced when `useCompare` hook ships in Plan 17-07
- `ProviderHero` maps `qualifications[]` to accreditation objects since the actual `ServiceProviderPublicProfile` type has `qualifications` not `accreditations` (the plan's interface spec was slightly different from 17-01 output)
- `page.tsx` calls `fetchProviderReviews(provider.id, 1)` with `provider.id` (not `user_id`) and page 1 (not 0) matching the 1-based service API

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adapted to actual ServiceProviderPublicProfile field names**
- **Found during:** Task 1 (ProviderHero, TrustBadges)
- **Issue:** Plan spec used `business_description`, `accreditations[]`, `response_time_hours`, `completed_jobs_count` but 17-01 type has `description`, `qualifications[]`, `insurance_verified`
- **Fix:** Used actual field names from providers.ts; mapped `qualifications[]` to badge accreditation objects; derived `insuranceDetails` from `insurance_verified` boolean
- **Files modified:** ProviderHero.tsx, TrustBadges.tsx, ProviderSidebar.tsx
- **Verification:** `npx tsc --noEmit` — 0 errors in Phase 17 files
- **Committed in:** 17603af (Task 1 commit)

**2. [Rule 1 - Bug] Fixed fetchProviderReviews call signature in page.tsx**
- **Found during:** Task 2 (page.tsx)
- **Issue:** Plan called `fetchProviderReviews(provider.user_id, 0)` but function takes providerId (service_provider_details.id) and uses 1-based page numbers
- **Fix:** Changed to `fetchProviderReviews(provider.id, 1)`
- **Files modified:** src/app/(main)/services/[category]/[slug]/page.tsx
- **Verification:** `npx tsc --noEmit` — 0 errors
- **Committed in:** 29e3184 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 — type/API alignment with actual 17-01 output)
**Impact on plan:** Both auto-fixes necessary for type safety and runtime correctness. No scope creep.

## Issues Encountered

- Pre-existing `database.types.ts` TypeScript errors (line 4341+) exist in the repo; verified these are pre-existing and not introduced by this plan. Phase 17 files have zero TypeScript errors.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Profile shell complete; Plan 17-03 can import ProfileTabs props pattern to fill in services/portfolio/reviews tab content
- `buildProviderJsonLd` and `ProviderHero` are ready for reuse in Plan 17-04 (agent profile page)
- `CompareButton` localStorage logic is functional as a standalone fallback; Plan 17-07 will provide the `useCompare` hook for richer state management

---
*Phase: 17-service-provider-public-profiles*
*Completed: 2026-03-13*
