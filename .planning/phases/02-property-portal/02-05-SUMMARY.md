---
phase: 02-property-portal
plan: 05
subsystem: api
tags: [react-query, supabase, saved-searches, shortlist, alerts, jsonb, optimistic-updates]

# Dependency graph
requires:
  - phase: 02-property-portal
    provides: "Property types, search service, query builder, listing service"
provides:
  - "Saved properties (shortlist) service with save/unsave/get/check"
  - "Saved searches service with JSONB filter storage and alert checking"
  - "API routes for saved properties and saved searches"
  - "Client hooks with optimistic updates for saved properties"
  - "listed_after filter param for search query builder"
affects: [03-dashboards-communication, notifications, alerts]

# Tech tracking
tech-stack:
  added: []
  patterns: [optimistic-updates-react-query, fire-and-forget-rpc, jsonb-filter-storage]

key-files:
  created:
    - britv3.0/src/services/saved/saved-properties-service.ts
    - britv3.0/src/services/saved/saved-searches-service.ts
    - britv3.0/src/app/api/saved/properties/route.ts
    - britv3.0/src/app/api/saved/searches/route.ts
    - britv3.0/src/hooks/useSavedProperties.ts
    - britv3.0/src/hooks/useSavedSearches.ts
    - britv3.0/src/__tests__/saved/saved-properties.test.ts
    - britv3.0/src/__tests__/saved/saved-searches.test.ts
    - britv3.0/src/__tests__/alerts/search-alerts.test.ts
  modified:
    - britv3.0/src/types/search.ts
    - britv3.0/src/lib/search/query-builder.ts

key-decisions:
  - "Duplicate saves handled via unique constraint catch (code 23505) returning null gracefully"
  - "favorite_count tracked via fire-and-forget RPC increment_favorite_count"
  - "Saved search filters stored as JSONB, re-executed via searchProperties with listed_after cutoff"
  - "checkNewResults uses epoch start (1970-01-01) when last_alerted_at is null"

patterns-established:
  - "Optimistic updates: useMutation with onMutate snapshot, setQueryData, rollback onError"
  - "Fire-and-forget count tracking: .then().catch() pattern for non-blocking side effects"
  - "JSONB filter storage: SearchFilters type stored and re-parsed for saved search execution"

requirements-completed: [SRCH-07, SRCH-08, SRCH-09]

# Metrics
duration: 12min
completed: 2026-03-07
---

# Phase 02 Plan 05: Saved Properties & Searches Summary

**Save/unsave property shortlisting with favorite_count tracking, plus saved searches with JSONB filter storage and alert checking for new matching listings**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-07T19:00:45Z
- **Completed:** 2026-03-07T19:12:54Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Save/unsave properties with optimistic UI updates and favorite_count tracking via RPC
- Saved searches store filter criteria as JSONB with configurable alert frequency (instant/daily/weekly)
- Alert checking re-executes saved filters with listed_after cutoff to find new matching properties
- All 17 tests passing across 3 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Saved properties service and API** - `8b2120b` (feat)
2. **Task 2: Saved searches service with alert checking** - `af85c61` (feat)

## Files Created/Modified
- `britv3.0/src/services/saved/saved-properties-service.ts` - Save/unsave/get/check saved properties with favorite_count tracking
- `britv3.0/src/services/saved/saved-searches-service.ts` - CRUD for saved searches, alert checking, markAlerted
- `britv3.0/src/app/api/saved/properties/route.ts` - GET/POST/DELETE for saved properties (auth-protected)
- `britv3.0/src/app/api/saved/searches/route.ts` - GET/POST/DELETE/PATCH for saved searches (auth-protected)
- `britv3.0/src/hooks/useSavedProperties.ts` - Client hook with optimistic save/unsave mutations
- `britv3.0/src/hooks/useSavedSearches.ts` - Client hook with save/delete/load search mutations
- `britv3.0/src/types/search.ts` - Added listed_after param to SearchParams
- `britv3.0/src/lib/search/query-builder.ts` - Added listed_after filter to query builder
- `britv3.0/src/__tests__/saved/saved-properties.test.ts` - 8 tests for saved properties service
- `britv3.0/src/__tests__/saved/saved-searches.test.ts` - 5 tests for saved searches CRUD
- `britv3.0/src/__tests__/alerts/search-alerts.test.ts` - 4 tests for alert checking logic

## Decisions Made
- Duplicate saves handled via unique constraint catch (code 23505) returning null gracefully
- favorite_count tracked via fire-and-forget RPC increment_favorite_count (non-blocking)
- Saved search filters stored as JSONB, re-executed via searchProperties with listed_after cutoff
- checkNewResults uses epoch start (1970-01-01) when last_alerted_at is null (returns all results)
- useIsPropertySaved reads from cached saved list (no extra API call)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Build verification failed due to Google Fonts network fetch (unrelated to our code; pre-existing environment issue)
- Used lint verification on individual files as alternative build check

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Saved properties and searches features complete, ready for dashboard integration
- Alert checking logic ready for Phase 3 notification system integration
- listed_after filter available for any future time-bounded search queries

---
*Phase: 02-property-portal*
*Completed: 2026-03-07*
