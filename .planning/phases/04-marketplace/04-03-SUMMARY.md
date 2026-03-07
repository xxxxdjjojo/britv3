---
phase: 04-marketplace
plan: 03
subsystem: api
tags: [provider-profiles, document-upload, search, supabase-storage, geocoding, zod, vitest]

# Dependency graph
requires:
  - phase: 04-marketplace
    provides: "marketplace schema, types, Zod schemas, file-validator, postcodes-io geocoding"
provides:
  - "Provider profile CRUD service (create, update, get by slug, get by user_id)"
  - "Provider search via search_providers() RPC with geocoded postcode"
  - "Provider document upload with magic-bytes validation and Supabase Storage"
  - "3 API routes: GET /api/providers/search, GET /api/providers/[slug], POST /api/providers/documents/upload"
affects: [04-marketplace, provider-dashboard, rfq-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns: [service-layer-with-supabase-client-injection, slug-generation-with-uniqueness, multipart-form-upload]

key-files:
  created:
    - britv3.0/src/services/marketplace/provider-service.ts
    - britv3.0/src/services/marketplace/provider-service.test.ts
    - britv3.0/src/app/api/providers/search/route.ts
    - britv3.0/src/app/api/providers/[slug]/route.ts
    - britv3.0/src/app/api/providers/documents/upload/route.ts

key-decisions:
  - "Provider service uses function-per-operation pattern (not class) with Supabase client injection for testability"
  - "Slug generated from business_name with uniqueness check and incrementing suffix (-2, -3, etc.)"
  - "Base location stored as PostGIS WKT format SRID=4326;POINT(lng lat) from geocoded first service postcode"

patterns-established:
  - "Service functions accept SupabaseClient as first param for server/client flexibility"
  - "API routes use safeParse for validation with structured error responses"
  - "Document upload converts File to Buffer for magic-bytes validation before storage"

requirements-completed: [MKT-01, MKT-02, MKT-13]

# Metrics
duration: 22min
completed: 2026-03-07
---

# Phase 4 Plan 3: Provider Profiles & Search Summary

**Provider profile CRUD service with geocoded search via RPC, magic-bytes document upload to Supabase Storage, and 3 public/auth API routes -- 10 tests passing**

## Performance

- **Duration:** 22 min
- **Started:** 2026-03-07T18:07:28Z
- **Completed:** 2026-03-07T18:29:28Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Provider service with 7 exported functions: createProviderProfile, updateProviderProfile, getProviderBySlug, getProviderProfile, searchProviders, uploadProviderDocument, getProviderDocuments
- 3 API routes: public search and profile-by-slug endpoints, authenticated document upload with multipart form parsing
- 10 unit tests covering CRUD, search RPC delegation, document upload flow, and slug generation with collision handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Create provider service layer** - `966b15e` (feat)
2. **Task 2: Create provider API routes** - `e73f2f1` (feat)

## Files Created/Modified
- `britv3.0/src/services/marketplace/provider-service.ts` - Provider profile CRUD, search, and document upload service
- `britv3.0/src/services/marketplace/provider-service.test.ts` - 10 unit tests with mocked Supabase client
- `britv3.0/src/app/api/providers/search/route.ts` - GET handler for provider search with query param parsing
- `britv3.0/src/app/api/providers/[slug]/route.ts` - GET handler for provider public profile by slug
- `britv3.0/src/app/api/providers/documents/upload/route.ts` - POST handler for authenticated document upload

## Decisions Made
- Provider service uses function-per-operation pattern (not class) with Supabase client injection, consistent with Phase 1 auth service convention
- Slug generated from business_name via lowercase+hyphenation with uniqueness check against existing slugs, incrementing suffix on collision
- Base location stored as PostGIS WKT (SRID=4326;POINT(lng lat)) from geocoded first service_postcode
- Document upload route checks file size before buffer conversion (413 response) and delegates magic-bytes validation to file-validator

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Next.js Turbopack build has a pre-existing ENOENT race condition on .next/turbopack; verified via TypeScript compiler (tsc --noEmit) that all new files compile without errors

## User Setup Required
None - no external service configuration required. (provider-docs storage bucket was listed as user_setup in the plan frontmatter for Supabase Dashboard configuration.)

## Next Phase Readiness
- Provider service ready for RFQ pipeline (04-04) and booking system (04-05)
- Search API ready for marketplace search UI
- Document upload ready for provider verification workflow

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (966b15e, e73f2f1) verified in git log.

---
*Phase: 04-marketplace*
*Completed: 2026-03-07*
