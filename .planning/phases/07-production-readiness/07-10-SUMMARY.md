---
phase: 07-production-readiness
plan: 10
subsystem: admin-ui
tags: [admin, moderation, users, verifications, reviews]
dependency_graph:
  requires: [07-03, 07-05]
  provides: [admin-user-management, admin-listing-moderation, admin-verification-queue, admin-review-moderation]
  affects: [admin-dashboard]
tech_stack:
  added: []
  patterns: [server-component-with-client-wrapper, api-route-per-action]
key_files:
  created:
    - britv3.0/src/components/admin/UserTable.tsx
    - britv3.0/src/components/admin/UserDetailModal.tsx
    - britv3.0/src/components/admin/UserManagementClient.tsx
    - britv3.0/src/components/admin/ModerationQueue.tsx
    - britv3.0/src/components/admin/ModerationQueueClient.tsx
    - britv3.0/src/components/admin/VerificationQueue.tsx
    - britv3.0/src/components/admin/VerificationQueueClient.tsx
    - britv3.0/src/components/admin/ReviewModerationQueue.tsx
    - britv3.0/src/components/admin/ReviewModerationQueueClient.tsx
    - britv3.0/src/app/(admin)/admin/users/page.tsx
    - britv3.0/src/app/(admin)/admin/moderation/page.tsx
    - britv3.0/src/app/(admin)/admin/verifications/page.tsx
    - britv3.0/src/app/(admin)/admin/reviews/page.tsx
    - britv3.0/src/app/api/admin/users/[userId]/suspend/route.ts
    - britv3.0/src/app/api/admin/users/[userId]/activate/route.ts
    - britv3.0/src/app/api/admin/listings/[listingId]/approve/route.ts
    - britv3.0/src/app/api/admin/listings/[listingId]/reject/route.ts
    - britv3.0/src/app/api/admin/verifications/review/route.ts
    - britv3.0/src/app/api/admin/reports/resolve/route.ts
  modified:
    - britv3.0/tsconfig.json
decisions:
  - "Server-component-plus-client-wrapper pattern: pages are server components for data fetching, paired with client wrappers for interactive actions via fetch + router.refresh()"
  - "API routes (not server actions) for all admin mutations -- simpler to call from client components with fetch()"
  - "Moderation page queries properties with status=flagged and re-runs flagListing() at render time to show flag details without storing flags in DB"
  - "VerificationQueue card shows document URL from provider_details JSONB -- assumes document_url key by convention"
  - "[Rule 1 - Bug] Added webworker to tsconfig lib array to fix ServiceWorkerGlobalScope type error in sw.ts"
  - "[Rule 1 - Bug] Narrowed provider_details unknown JSONB fields with !== null/undefined guards before rendering"
metrics:
  duration: 22min
  completed: 2026-03-07
  tasks: 2
  files: 20
---

# Phase 07 Plan 10: Admin Management UI Pages Summary

Four admin management pages built: user management with search/suspend/activate, listing moderation queue for flagged properties, provider verification queue with document viewing, and review moderation queue with resolve/dismiss actions.

## What Was Built

### Task 1: User Management and Listing Moderation (commit d8d4500)

**User Management (`/admin/users`)**
- `UserTable` — table with Name/Email/Role/Status/Created/Actions columns; Suspend (active users) or Activate (suspended users) buttons plus View button
- `UserDetailModal` — overlay showing full user details including user ID and creation timestamp
- `UserManagementClient` — client component wrapping table with search form (submit triggers URL navigation), pagination links, and fetch-based suspend/activate via API routes
- `/admin/users/page.tsx` — server component calling `searchUsers()` with `?q=` and `?page=` searchParams
- API routes: `POST /api/admin/users/[userId]/suspend` and `POST /api/admin/users/[userId]/activate`

**Listing Moderation (`/admin/moderation`)**
- `ModerationQueue` — flagged listing cards with severity badges (`bg-red-100` for high, `bg-yellow-100` for medium, `bg-blue-100` for low), Approve/Reject/View actions
- `ModerationQueueClient` — client wrapper routing approve/reject to API routes
- `/admin/moderation/page.tsx` — server component querying `properties` where `status = 'flagged'`, re-running `flagListing()` at render time to reconstruct flag details
- API routes: `POST /api/admin/listings/[listingId]/approve` (sets status to `active`) and `POST /api/admin/listings/[listingId]/reject`

### Task 2: Verification Queue and Review Moderation (commit 536fc63)

**Provider Verification (`/admin/verifications`)**
- `VerificationQueue` — provider cards showing name, business name, email, submission date; collapsible notes textarea; Approve/Reject buttons; document link from `provider_details.document_url` JSONB field
- `VerificationQueueClient` — client wrapper POSTing to `/api/admin/verifications/review`
- `/admin/verifications/page.tsx` — server component calling `getVerificationQueue()`
- API route: `POST /api/admin/verifications/review` calling `reviewVerification(supabase, userId, decision, notes)`

**Review Moderation (`/admin/reviews`)**
- `ReviewModerationQueue` — report cards with report ID, reason, review ID reference, submission date; Remove review (resolves) and Dismiss report buttons
- `ReviewModerationQueueClient` — client wrapper POSTing to `/api/admin/reports/resolve` with adminId from server
- `/admin/reviews/page.tsx` — server component calling `getReportedReviews()`
- API route: `POST /api/admin/reports/resolve` calling `resolveReport(supabase, reportId, resolution, note, adminId)`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ServiceWorkerGlobalScope TypeScript error blocking build**
- **Found during:** Task 1 verification build
- **Issue:** `sw.ts` uses `ServiceWorkerGlobalScope` type which requires the `webworker` lib in tsconfig, but only `dom`, `dom.iterable`, and `esnext` were configured
- **Fix:** Added `"webworker"` to `compilerOptions.lib` array in `tsconfig.json`
- **Files modified:** `britv3.0/tsconfig.json`
- **Commit:** d8d4500

**2. [Rule 1 - Bug] Unknown JSONB type not assignable to ReactNode**
- **Found during:** Task 2 verification build
- **Issue:** `provider_details` is typed as `Record<string, unknown>`, so extracted `businessName` and `documentUrl` were `unknown` -- not directly renderable in JSX
- **Fix:** Added `!== null && !== undefined` guards before rendering, letting TypeScript narrow to a renderable check
- **Files modified:** `britv3.0/src/components/admin/VerificationQueue.tsx`
- **Commit:** 536fc63

## Self-Check: PASSED

All 19 created files confirmed on disk. Both task commits (d8d4500, 536fc63) confirmed in git log.
