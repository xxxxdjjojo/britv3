---
phase: 17-service-provider-public-profiles
plan: "04"
subsystem: ui
tags: [react, nextjs, server-components, tailwind, lucide, schema-org, seo]

requires:
  - phase: 17-service-provider-public-profiles/17-01
    provides: AgentPublicProfile, AgentPublicStats, AgentListingItem, PaginatedListings types + fetchAgentBySlug, fetchAgentStats, fetchAgentListings service functions
  - phase: 17-service-provider-public-profiles/17-02
    provides: JSON-LD pattern (buildProviderJsonLd) and ProfileTabs client island URL hash tab pattern

provides:
  - src/app/(main)/agents/[slug]/page.tsx (SSR agent profile page with generateMetadata)
  - src/app/(main)/agents/[slug]/AgentProfileTabs.tsx (client island tab switcher)
  - src/components/agents/AgencyHero.tsx (cover+logo hero with stat bar)
  - src/components/agents/AgencyStatBar.tsx (5-column stat strip)
  - src/components/agents/AgentSidebar.tsx (valuation CTA + office info)
  - src/components/agents/ListingsTab.tsx (active listings property card grid)
  - src/components/agents/SoldLetTab.tsx (sold/let price history grid)
  - src/lib/providers/jsonld.ts extended with buildAgentJsonLd (RealEstateAgent @type)

affects:
  - 17-05 (Reviews + Team tabs wire into AgentProfileTabs reviews/team props)

tech-stack:
  added: []
  patterns:
    - "AgentPublicProfile.agency nested object accessed via agency?.name pattern (not flat agency_name)"
    - "buildAgentJsonLd uses RealEstateAgent @type with aggregateRating only when avg_rating is non-null"
    - "AgentProfileTabs mirrors ProfileTabs URL hash pattern but with 4 tabs and dynamic count labels"
    - "fetchAgentListings called with page=1 (1-based) consistent with service layer convention"

key-files:
  created:
    - src/app/(main)/agents/[slug]/page.tsx
    - src/app/(main)/agents/[slug]/AgentProfileTabs.tsx
    - src/components/agents/AgencyHero.tsx
    - src/components/agents/AgencyStatBar.tsx
    - src/components/agents/AgentSidebar.tsx
    - src/components/agents/ListingsTab.tsx
    - src/components/agents/SoldLetTab.tsx
  modified:
    - src/lib/providers/jsonld.ts

key-decisions:
  - "AgentPublicProfile.agency nested object used for agency name/logo/address — plan interface had flat fields but actual 17-01 type has discriminated agency sub-object"
  - "fetchAgentListings called with page=1 not page=0 — service uses 1-based pagination (from = (page-1)*PAGE_SIZE)"
  - "SoldLetTab calcPctAsking derived inline from sold_price/price ratio — AgentListingItem has no pre-computed pct field"

patterns-established:
  - "Agent profile route mirrors tradesperson pattern: SSR page.tsx + client island ProfileTabs + server component tab panels"

requirements-completed: [PROF-06, PROF-07, PROF-08]

duration: 18min
completed: 2026-03-13
---

# Phase 17 Plan 04: Estate Agent Profile Shell Summary

**Estate agent /agents/[slug] SSR route with branded AgencyHero (cover gradient, logo, stat bar), 4-tab AgentProfileTabs client island (Active Listings/Sold Let/Reviews/Team), PropertyCard grids for active and sold/let listings, and RealEstateAgent JSON-LD structured data.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-13T23:25:00Z
- **Completed:** 2026-03-13T23:43:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Estate agent public profile at `/agents/[slug]` with SSR + generateMetadata (OG image from agency logo_url)
- AgencyHero with cover gradient/image fallback, logo with verified badge, Premium Partner badge, rating+location row, CTA buttons, embedded 5-column AgencyStatBar
- ListingsTab and SoldLetTab PropertyCard grids matching Stitch agency-public-profile.html design
- buildAgentJsonLd added to jsonld.ts — RealEstateAgent @type with address, telephone, aggregateRating

## Task Commits

1. **Task 1: AgencyHero + AgencyStatBar + AgentSidebar + ListingsTab + SoldLetTab** - `65de10d` (feat)
2. **Task 2: AgentProfileTabs client island + agents/[slug]/page.tsx** - `29eb8fa` (feat)

## Files Created/Modified

- `src/components/agents/AgencyHero.tsx` — Cover + logo hero with verified ShieldCheck badge, identity block, CTA buttons, embeds AgencyStatBar
- `src/components/agents/AgencyStatBar.tsx` — 5-column stat strip: active listings, sold/let, avg days, % asking, rating
- `src/components/agents/AgentSidebar.tsx` — Valuation CTA card (bg-[#2563EB]), office info (MapPin/Phone/Clock), map placeholder, team preview skeleton
- `src/components/agents/ListingsTab.tsx` — 2-col PropertyCard grid for active listings; status badge (For Sale/For Rent/Under Offer), price H3, address, bed/bath stats
- `src/components/agents/SoldLetTab.tsx` — Sold/let grid; sold price in text-[#1B4D3E], asking price struck through, % of asking pill, sold date
- `src/app/(main)/agents/[slug]/AgentProfileTabs.tsx` — "use client" tab island with URL hash persistence; tab labels include dynamic counts
- `src/app/(main)/agents/[slug]/page.tsx` — SSR page with generateMetadata, parallel fetchAgentStats+fetchAgentListings×2, JSON-LD injection
- `src/lib/providers/jsonld.ts` — Added buildAgentJsonLd export (RealEstateAgent, aggregateRating, address, telephone)

## Decisions Made

- `AgentPublicProfile` actual type uses nested `agency` object (name/logo_url/address) rather than the flat fields shown in the plan's interface spec. Adapted all components to use `agency?.name ?? display_name` pattern.
- `fetchAgentListings` uses 1-based page numbers (`page=1` for first page) consistent with service implementation — plan snippet showed `page: 0` which would have been incorrect.
- `SoldLetTab` computes `pct` inline via `Math.round((sold_price / price) * 100)` since `AgentListingItem` has no pre-computed percentage field.

## Deviations from Plan

None - plan executed exactly as written (adapted to actual types from 17-01).

## Issues Encountered

- Build produced ENOENT on a `.next/static` temp file during first attempt (stale lock file from concurrent process). Removed `.next/lock` and reran — compiled successfully in 108s.
- Pre-existing TypeScript errors in landlord dashboard files (properties/add, compliance upload, InventoryRoomForm) unrelated to this plan — out of scope per deviation boundary rule.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `/agents/[slug]` route fully functional with all structural tabs rendered
- Reviews tab shows placeholder "Reviews — Plan 17-05"
- Team tab shows placeholder "Team — Plan 17-05"
- Plan 17-05 wires ReviewsTab and TeamTab into AgentProfileTabs by passing real content as reviews/team props

---
*Phase: 17-service-provider-public-profiles*
*Completed: 2026-03-13*

## Self-Check: PASSED

Files verified:
- FOUND: src/components/agents/AgencyHero.tsx
- FOUND: src/components/agents/AgencyStatBar.tsx
- FOUND: src/components/agents/AgentSidebar.tsx
- FOUND: src/components/agents/ListingsTab.tsx
- FOUND: src/components/agents/SoldLetTab.tsx
- FOUND: src/app/(main)/agents/[slug]/AgentProfileTabs.tsx
- FOUND: src/app/(main)/agents/[slug]/page.tsx
- FOUND: src/lib/providers/jsonld.ts

Commits verified:
- 65de10d: feat(17-04): add AgencyHero, AgencyStatBar, AgentSidebar, ListingsTab, SoldLetTab
- 29eb8fa: feat(17-04): add AgentProfileTabs client island, agents/[slug] page, buildAgentJsonLd
