---
phase: 02-property-portal
plan: 03
subsystem: api
tags: [listing-crud, image-pipeline, sharp, file-type, supabase-storage, postgis, postcodes-io, webp, thumbnails]

requires:
  - phase: 02-property-portal
    provides: "Property portal schema (properties, listings, property_media, price_history tables), TypeScript types, test fixtures"
provides:
  - "Listing CRUD service (create, update, delete, get, getBySlug, getMyListings)"
  - "Image upload pipeline: validation -> processing -> WebP conversion -> thumbnail -> Supabase Storage"
  - "Document upload for floor plans and EPC certificates"
  - "Price history retrieval and listing analytics"
  - "Client-side image compression utility"
  - "API routes for listings CRUD and media management"
affects: [02-property-portal, 03-dashboards-communication]

tech-stack:
  added: []
  patterns: [server-side sharp processing, magic byte validation, fire-and-forget RPC, ownership verification pattern]

key-files:
  created:
    - britv3.0/src/services/listings/listing-service.ts
    - britv3.0/src/services/listings/media-service.ts
    - britv3.0/src/lib/upload/validate.ts
    - britv3.0/src/lib/upload/process.ts
    - britv3.0/src/lib/upload/compress.ts
    - britv3.0/src/app/api/listings/route.ts
    - britv3.0/src/app/api/listings/[id]/route.ts
    - britv3.0/src/app/api/listings/[id]/media/route.ts
    - britv3.0/src/__tests__/listings/create.test.ts
    - britv3.0/src/__tests__/listings/update.test.ts
    - britv3.0/src/__tests__/listings/pricing.test.ts
    - britv3.0/src/__tests__/listings/price-history.test.ts
    - britv3.0/src/__tests__/listings/analytics.test.ts
    - britv3.0/src/__tests__/listings/image-upload.test.ts
    - britv3.0/src/__tests__/listings/document-upload.test.ts
  modified: []

key-decisions:
  - "Listing service uses Supabase client injection (function-per-operation pattern) matching Phase 4 provider-service"
  - "PostGIS coordinates set via fire-and-forget RPC after property insert (non-blocking)"
  - "Image processing: auto-rotate, EXIF strip, WebP quality 85, 2400x1800 max; thumbnail 400x300 cover crop WebP quality 75"
  - "Client compression skips files under 500KB; compresses to 1MB max, 2400px max dimension"
  - "Max 30 images per listing enforced at service layer"
  - "Materialized view refresh is fire-and-forget after create/update/delete"

patterns-established:
  - "Ownership verification via .eq('id', id).eq('user_id', userId).single() before mutations"
  - "Field splitting (property vs listing) via Set-based key lookup for update operations"
  - "Storage path convention: {bucket}/{listingId}/{uuid}.webp with -thumb suffix for thumbnails"
  - "Document upload: separate bucket (property-documents), no thumbnail for PDFs"

requirements-completed: [LIST-01, LIST-02, LIST-03, LIST-04, LIST-05, LIST-06, LIST-07, LIST-08]

duration: 15min
completed: 2026-03-07
---

# Phase 2 Plan 03: Listing Management Summary

**Listing CRUD with geocoded PostGIS coordinates, image upload pipeline (magic-byte validation, sharp processing, WebP+thumbnail), floor plan uploads, price history tracking, and analytics API**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-07T18:41:53Z
- **Completed:** 2026-03-07T18:57:23Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Built complete listing CRUD service with create, update (ownership-verified), soft delete, get by ID/slug, and paginated my-listings
- Implemented full image upload pipeline: magic byte validation (file-type), server-side processing (sharp: auto-rotate, EXIF strip, WebP conversion, 400x300 thumbnail generation), Supabase Storage upload
- Created floor plan and document upload with separate bucket and PDF support
- Added price history retrieval and listing analytics (view_count, favorite_count, enquiry_count)
- API routes for all operations with auth middleware

## Task Commits

Each task was committed atomically (TDD: test -> feat):

1. **Task 1: Listing CRUD service and API routes**
   - `f2c8023` (test) - Failing tests for listing CRUD
   - `3b036be` (feat) - Listing service implementation + API routes
2. **Task 2: Image and document upload pipeline**
   - `76581d9` (test) - Failing tests for image/document upload
   - `0d5f666` (feat) - Upload pipeline implementation

## Files Created/Modified
- `britv3.0/src/services/listings/listing-service.ts` - Listing CRUD: create, update, delete, get, getBySlug, getMyListings, getPriceHistory, getListingAnalytics, incrementViewCount
- `britv3.0/src/services/listings/media-service.ts` - Image/document upload, delete, reorder with ownership verification
- `britv3.0/src/lib/upload/validate.ts` - Magic byte validation for images (JPEG/PNG/WebP) and documents (+PDF)
- `britv3.0/src/lib/upload/process.ts` - Sharp processing: auto-rotate, EXIF strip, WebP 85, thumbnail 400x300
- `britv3.0/src/lib/upload/compress.ts` - Client-side browser-image-compression: skip <500KB, compress to 1MB/2400px
- `britv3.0/src/app/api/listings/route.ts` - GET (my listings) and POST (create) endpoints
- `britv3.0/src/app/api/listings/[id]/route.ts` - GET, PATCH, DELETE endpoints
- `britv3.0/src/app/api/listings/[id]/media/route.ts` - POST (upload), DELETE, PATCH (reorder) for media
- `britv3.0/src/__tests__/listings/*.test.ts` - 7 test files, 31 tests total

## Decisions Made
- Listing service uses Supabase client injection matching Phase 4 provider-service pattern for testability
- PostGIS coordinates set via fire-and-forget RPC after property insert (non-blocking, retryable)
- Image processing produces 2400x1800 max WebP at quality 85; thumbnails are 400x300 cover crop at quality 75
- Client compression skips files under 500KB threshold; compresses larger files to 1MB max
- Max 30 images per listing enforced at service layer before any processing occurs
- Materialized view refresh is fire-and-forget after create/update/delete mutations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Listing CRUD and media services ready for search engine integration (Plan 02-02)
- API routes ready for dashboard integration (Phase 3)
- Image pipeline ready for property listing forms
- Upload utilities (compress, validate, process) reusable for other upload features

## Self-Check: PASSED

All 15 created files verified present. All 4 task commits (f2c8023, 3b036be, 76581d9, 0d5f666) verified in git log. 31/31 tests passing.

---
*Phase: 02-property-portal*
*Completed: 2026-03-07*
