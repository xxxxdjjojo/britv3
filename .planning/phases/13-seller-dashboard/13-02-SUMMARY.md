---
phase: 13
plan: "02"
subsystem: seller-dashboard
tags: [seller, services, api-routes, analytics, ai]
dependency_graph:
  requires: [13-01]
  provides: [listing-service, analytics-service, ai-description-service, seller-api-routes]
  affects: [13-03, 13-04, 13-05, 13-06, 13-07, 13-08, 13-09, 13-10]
tech_stack:
  added: []
  patterns: [supabase-client-injection, api-route-auth-guard, claude-haiku-generation]
key_files:
  created:
    - src/types/seller.ts
    - src/services/seller/listing-service.ts
    - src/services/seller/analytics-service.ts
    - src/services/seller/ai-description-service.ts
    - src/app/api/seller/listings/route.ts
    - src/app/api/seller/listings/[id]/route.ts
    - src/app/api/seller/describe/route.ts
    - src/app/api/analytics/event/route.ts
  modified: []
decisions:
  - Fetch listing IDs as an array before analytics queries (avoids Supabase subquery TypeScript incompatibility)
  - Max 3 AI description generations enforced both in service layer and API route (defense in depth)
  - getSellerKPIs short-circuits analytics queries when seller has no listings (avoids empty IN clause)
metrics:
  duration: "~20 minutes"
  completed: "2026-03-15"
  tasks_completed: 2
  files_created: 8
---

# Phase 13 Plan 02: Seller Services and API Routes Summary

**One-liner:** Seller listing CRUD service, analytics aggregation service, and Claude Haiku AI description generation with 4 auth-guarded API routes providing the data layer for all dashboard UI plans.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Listing service + analytics service | 8481add | listing-service.ts, analytics-service.ts |
| 2 | AI description service + API routes | 8481add | ai-description-service.ts, 4 route files |

## Files Created

### Services

**`src/services/seller/listing-service.ts`**
Exports: `getSellerListings`, `getListingById`, `createListing`, `updateListing`, `publishListing`, `archiveListing`, `getSellerKPIs`
- `getSellerListings`: fetches all seller listings with per-listing view/save/enquiry counts and 7-day daily view array
- `getSellerKPIs`: aggregates 30-day/prior-period stats for dashboard KPI cards with % change calculation
- All functions accept `SupabaseClient` as first arg (dependency injection pattern)

**`src/services/seller/analytics-service.ts`**
Exports: `getListingAnalyticsSummary`, `recordAnalyticsEvent`
- Aggregates views/saves/enquiries/phone_clicks/email_clicks for a listing over N days
- Computes CTR (enquiries / views * 100) and daily_views array for Recharts

**`src/services/seller/ai-description-service.ts`**
Exports: `generateDescription`, `getAttemptCount`
- Calls `claude-haiku-4-5-20251001` with 3 tone variants (professional/warm/luxury)
- Enforces max 3 regenerations per listing via `listing_description_attempts` table
- Records each attempt with seller_id and tone for audit trail

### API Routes

**`src/app/api/seller/listings/route.ts`** — GET (list with optional status filter) + POST (create draft)

**`src/app/api/seller/listings/[id]/route.ts`** — GET (single listing) + PATCH (update/publish/archive)
- Photo count validated server-side: returns 400 if photos array > 30 items
- `action: "publish"` triggers publishListing, `action: "archive"` triggers archiveListing

**`src/app/api/seller/describe/route.ts`** — POST (generate AI description) + GET (check attempts remaining)
- Returns 429 when attempt count >= 3 before calling Claude

**`src/app/api/analytics/event/route.ts`** — POST (record analytics event)
- Validates event_type against allowed values
- Anonymous-friendly (no auth required for recording view events)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Supabase subquery TypeScript incompatibility in getSellerKPIs**
- **Found during:** Task 1 verification (TypeScript check)
- **Issue:** `.in("listing_id", supabase.from("seller_listings").select("id").eq(...))` — Supabase's TypeScript types do not accept a `PostgrestFilterBuilder` as an array argument to `.in()`, even though PostgREST supports subquery syntax at runtime
- **Fix:** Fetch listing IDs as a plain `string[]` array first, then use in subsequent `Promise.all` queries. Added short-circuit `listingIds.length === 0 ? Promise.resolve({ count: 0 })` to avoid empty IN clauses
- **Files modified:** `src/services/seller/listing-service.ts`
- **Commit:** 8481add

**2. [Rule 2 - Location] Moved files to correct src/ root (not britv3.0/src/)**
- **Found during:** Task 1 execution
- **Issue:** The prompt specified `britv3.0/src/` paths, but the actual Next.js app lives at the worktree root with `src/` directly. Plan 13-01 had similarly placed `seller.ts` in `britv3.0/src/types/seller.ts` (incorrect). The `tsconfig.json` at the worktree root maps `@/*` to `./src/*`
- **Fix:** Created all files in `src/` (worktree root) and also staged `src/types/seller.ts` (the correct location for the types created in Plan 13-01)
- **Files created at:** `src/types/seller.ts`, `src/services/seller/*`, `src/app/api/seller/*`, `src/app/api/analytics/*`

## Build Verification

```
pnpm build — PASSED
TypeScript errors in seller files — 0
Pre-existing TypeScript errors in other files — present but out of scope
```

## Self-Check: PASSED

- `src/types/seller.ts` — EXISTS
- `src/services/seller/listing-service.ts` — EXISTS
- `src/services/seller/analytics-service.ts` — EXISTS
- `src/services/seller/ai-description-service.ts` — EXISTS
- `src/app/api/seller/listings/route.ts` — EXISTS
- `src/app/api/seller/listings/[id]/route.ts` — EXISTS
- `src/app/api/seller/describe/route.ts` — EXISTS
- `src/app/api/analytics/event/route.ts` — EXISTS
- Commit 8481add — EXISTS (8 files, 757 insertions)
