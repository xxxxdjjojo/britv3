---
phase: 05-ai-financial-tools
plan: 03
subsystem: ai
tags: [recommendations, land-registry, smart-replies, sql, recharts, supabase]

requires:
  - phase: 01-foundation
    provides: Supabase client factories (server.ts)
provides:
  - SQL-based property recommendation service (getRecommendations)
  - Land Registry price paid data service (getPricePaidData, getAreaPriceTrend, getPricePaidSummary)
  - Static smart reply suggestion engine (getSuggestedReplies)
  - PriceHistory server component with recharts area chart
affects: [property-detail-pages, messaging, search, dashboard]

tech-stack:
  added: [recharts (already installed)]
  patterns: [thenable-supabase-mocks, zero-cost-intelligence, config-driven-suggestions]

key-files:
  created:
    - britv3.0/src/services/recommendations/recommendations.ts
    - britv3.0/src/services/recommendations/recommendations.test.ts
    - britv3.0/src/services/smart-replies/config.ts
    - britv3.0/src/services/smart-replies/smart-replies.ts
    - britv3.0/src/services/smart-replies/smart-replies.test.ts
    - britv3.0/src/services/land-registry/types.ts
    - britv3.0/src/services/land-registry/land-registry.ts
    - britv3.0/src/services/land-registry/land-registry.test.ts
    - britv3.0/src/components/property/PriceHistory.tsx
    - britv3.0/src/components/property/PriceTrendChart.tsx
  modified: []

key-decisions:
  - "Supabase query chain mocks use thenable pattern (chain.then) to match PostgREST builder behavior"
  - "Smart replies use type-first + keyword-augmented selection capped at 4 suggestions"
  - "Land Registry outward code extraction handles both spaced and unspaced UK postcodes"
  - "PriceTrendChart extracted as client component for recharts; PriceHistory remains server component"

patterns-established:
  - "Thenable mock chain: createQueryChain() that is both chainable and awaitable for Supabase tests"
  - "Zero-cost intelligence: SQL matching + static config instead of AI API calls"
  - "Server/client component split: data-fetching server component wrapping interactive client chart"

requirements-completed: [AI-03, AI-04, AI-05]

duration: 23min
completed: 2026-03-07
---

# Phase 5 Plan 3: Zero-Cost Intelligence Features Summary

**SQL-based property recommendations, Land Registry price data with recharts area chart, and config-driven smart reply suggestions -- all zero AI cost**

## Performance

- **Duration:** 23 min
- **Started:** 2026-03-07T18:09:50Z
- **Completed:** 2026-03-07T18:32:42Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Property recommendations match saved search criteria (type, price, bedrooms, location) with exclusion of viewed/saved/dismissed properties
- Land Registry price paid data service queries by postcode outward code with 5-year trend aggregation
- Smart replies return max 4 context-appropriate suggestions from static config with keyword augmentation
- PriceHistory component renders recharts area chart and recent sales table as server component
- All 24 tests passing across 3 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: SQL-based recommendations service and smart replies config** - `dac31b4` (test: failing tests), `03f93bf` (feat: implementation)
2. **Task 2: Land Registry price data service and PriceHistory component** - `854a2b7` (feat)

## Files Created/Modified
- `src/services/recommendations/recommendations.ts` - SQL-based property recommendation engine using saved searches
- `src/services/recommendations/recommendations.test.ts` - 6 tests covering matching, exclusions, limits, empty states
- `src/services/smart-replies/config.ts` - Static config mapping conversation types and keywords to reply suggestions
- `src/services/smart-replies/smart-replies.ts` - Pure function returning deduped, capped suggestions by type + keywords
- `src/services/smart-replies/smart-replies.test.ts` - 9 tests covering all conversation types, keywords, dedup, limits
- `src/services/land-registry/types.ts` - PricePaidRecord, AreaPriceTrend, PricePaidSummary types
- `src/services/land-registry/land-registry.ts` - Price data queries by postcode outward code with trend aggregation
- `src/services/land-registry/land-registry.test.ts` - 9 tests for data retrieval, aggregation, edge cases
- `src/components/property/PriceHistory.tsx` - Server component rendering area chart and sales table
- `src/components/property/PriceTrendChart.tsx` - Client component wrapping recharts AreaChart

## Decisions Made
- Used thenable mock pattern for Supabase query chains (PostgREST builders are both chainable and thenable)
- Smart replies type-specific suggestions take priority; keyword matches augment up to max 4
- Land Registry outward code extraction handles spaced and unspaced postcodes via lastIndexOf
- PriceTrendChart extracted as separate client component since recharts requires client-side rendering

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Next.js build has pre-existing filesystem lock issues (ENOENT on .next temp files) unrelated to this plan's code
- Pre-existing lint errors in marketplace code (quote-service.ts, rfq-service.ts) -- not in scope
- Both issues documented but not fixed per scope boundary rules

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Recommendation service ready for integration into dashboard and property search pages
- Land Registry service and PriceHistory component ready for property detail pages
- Smart replies ready for integration into messaging/communication features
- All zero-cost features operational without any API key requirements

## Self-Check: PASSED

All 10 created files verified present. All 3 commit hashes verified in git log.

---
*Phase: 05-ai-financial-tools*
*Completed: 2026-03-07*
