---
phase: 02-property-portal
plan: 04
subsystem: ui
tags: [maplibre, terra-draw, geojson, clustering, polygon-search, react-maplibre]

# Dependency graph
requires:
  - phase: 02-property-portal
    provides: "Search service, query builder, SearchParams type, map types"
provides:
  - "PropertyMap component with MapLibre GL JS and native clustering"
  - "MapDrawTool polygon draw-to-search via terra-draw"
  - "usePropertyMap hook for map state management"
  - "MapSearchSync for debounced viewport-to-search synchronization"
  - "propertiesToGeoJSON utility for converting properties to GeoJSON"
  - "Polygon search routing in query builder and API route"
affects: [03-dashboards-communication, search-results-page]

# Tech tracking
tech-stack:
  added: []
  patterns: ["MapLibre native GeoJSON clustering via Source cluster props", "terra-draw polygon mode with MapLibre adapter", "Debounced map bounds to search sync"]

key-files:
  created:
    - "britv3.0/src/components/map/PropertyMap.tsx"
    - "britv3.0/src/components/map/MapDrawTool.tsx"
    - "britv3.0/src/components/map/MapMarker.tsx"
    - "britv3.0/src/components/map/MapCluster.tsx"
    - "britv3.0/src/components/map/MapSearchSync.tsx"
    - "britv3.0/src/hooks/usePropertyMap.ts"
    - "britv3.0/src/lib/map/cluster.ts"
    - "britv3.0/src/__tests__/map/property-map.test.tsx"
    - "britv3.0/src/__tests__/map/clustering.test.ts"
    - "britv3.0/src/__tests__/map/polygon-search.test.ts"
  modified:
    - "britv3.0/src/types/search.ts"
    - "britv3.0/src/lib/search/query-builder.ts"
    - "britv3.0/src/app/api/search/route.ts"

key-decisions:
  - "MapRef imported from @vis.gl/react-maplibre (not maplibre-gl) for React wrapper compatibility"
  - "Polygon search takes priority over radius search when both params provided"
  - "MapSearchSync is behavior-only component (renders null) for clean separation"
  - "terra-draw finish listener uses FeatureId (string | number) type for correct typing"

patterns-established:
  - "Map components use @vis.gl/react-maplibre declarative Source/Layer pattern"
  - "GeoJSON coordinates always [lng, lat] order per GeoJSON spec"
  - "Map viewport sync uses 500ms debounce to avoid excessive search re-fetches"

requirements-completed: [SRCH-04, SRCH-05, SRCH-06]

# Metrics
duration: 12min
completed: 2026-03-07
---

# Phase 2 Plan 4: Map Integration Summary

**MapLibre GL JS map with native clustering, property pins, terra-draw polygon search, and viewport-to-search synchronization**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-07T19:00:39Z
- **Completed:** 2026-03-07T19:12:56Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Interactive PropertyMap with 3-layer native clustering (clusters, count labels, unclustered pins)
- MapDrawTool for custom polygon area search using terra-draw with MapLibre adapter
- Search service polygon routing via PostGIS search_listings_by_polygon RPC
- 18 tests passing across 3 test files (GeoJSON, clustering, polygon validation, search routing)

## Task Commits

Each task was committed atomically:

1. **Task 1: PropertyMap component with clustering** - `8575040` (feat)
2. **Task 2: Polygon draw-to-search tool** - `4b93756` (feat)

## Files Created/Modified
- `britv3.0/src/components/map/PropertyMap.tsx` - Main map with clustering via MapLibre native GeoJSON Source
- `britv3.0/src/components/map/MapDrawTool.tsx` - Polygon draw tool using terra-draw
- `britv3.0/src/components/map/MapMarker.tsx` - Property popup with price/type/bedrooms
- `britv3.0/src/components/map/MapCluster.tsx` - Cluster badge presentational component
- `britv3.0/src/components/map/MapSearchSync.tsx` - Debounced viewport-to-search sync
- `britv3.0/src/hooks/usePropertyMap.ts` - Map state hook (viewport, bounds, selection)
- `britv3.0/src/lib/map/cluster.ts` - propertiesToGeoJSON utility and cluster constants
- `britv3.0/src/types/search.ts` - Added polygon field to SearchParams
- `britv3.0/src/lib/search/query-builder.ts` - Polygon search routing via RPC
- `britv3.0/src/app/api/search/route.ts` - Accept polygon query parameter

## Decisions Made
- MapRef imported from @vis.gl/react-maplibre (not maplibre-gl) for React wrapper compatibility
- Polygon search takes priority over radius search when both params provided
- MapSearchSync renders null (behavior-only component) for clean separation of concerns
- terra-draw finish listener uses FeatureId (string | number) for correct typing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed MapRef import source**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** MapRef is not exported from maplibre-gl; it comes from @vis.gl/react-maplibre
- **Fix:** Changed import to `import type { MapRef } from "@vis.gl/react-maplibre"`
- **Files modified:** PropertyMap.tsx, MapDrawTool.tsx
- **Verification:** tsc --noEmit passes for all map files
- **Committed in:** 4b93756 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed terra-draw finish listener signature**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** FinishListener requires (id: FeatureId, context: OnFinishContext), not just (id: string)
- **Fix:** Updated callback signature to (id: string | number, _context: unknown)
- **Files modified:** MapDrawTool.tsx
- **Committed in:** 4b93756 (Task 2 commit)

**3. [Rule 1 - Bug] Renamed property-map.test.ts to .tsx**
- **Found during:** Task 1 (test execution)
- **Issue:** Test file uses JSX but had .ts extension, causing esbuild parse error
- **Fix:** Renamed to property-map.test.tsx
- **Committed in:** 8575040 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 bug, 1 blocking)
**Impact on plan:** All fixes necessary for correct TypeScript compilation and test execution. No scope creep.

## Issues Encountered
- Pre-existing build error in MaintenanceForm.tsx (Phase 6) -- zodResolver type mismatch with coerce fields. Not caused by this plan's changes.

## User Setup Required
None - no external service configuration required. NEXT_PUBLIC_MAPTILER_API_KEY env var needed at runtime for map tiles.

## Next Phase Readiness
- Map components ready for integration into search results page
- Polygon search routing in place for PostGIS spatial queries
- MapSearchSync ready to wire up with useSearch hook on the search page

---
*Phase: 02-property-portal*
*Completed: 2026-03-07*
