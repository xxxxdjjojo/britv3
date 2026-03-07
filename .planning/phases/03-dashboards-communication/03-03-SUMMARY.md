---
phase: 03-dashboards-communication
plan: 03
subsystem: api, ui
tags: [profile, zod, sharp, avatar, notifications, react-hook-form, supabase-storage]

# Dependency graph
requires:
  - phase: 03-01
    provides: notification types and EventType enum
  - phase: 03-02
    provides: redis cache helpers, sanitizeText, compressImage utilities
provides:
  - Profile CRUD service with Zod validation and text sanitization
  - Avatar upload pipeline (client compress, server validate, Sharp resize, Supabase Storage)
  - Service provider extended profile management
  - Notification preferences CRUD with per-type toggles
  - Profile page with tabbed layout
  - Profile service unit tests (8 tests)
affects: [dashboards, settings, onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns: [service-with-injected-client, magic-byte-file-validation, client-server-image-pipeline]

key-files:
  created:
    - britv3.0/src/services/profile/profile-service.ts
    - britv3.0/src/app/api/profile/route.ts
    - britv3.0/src/app/api/profile/picture/route.ts
    - britv3.0/src/app/api/service-provider/profile/route.ts
    - britv3.0/src/components/profile/ProfileForm.tsx
    - britv3.0/src/components/profile/AvatarUpload.tsx
    - britv3.0/src/components/profile/ProviderProfileForm.tsx
    - britv3.0/src/components/profile/NotificationPreferences.tsx
    - britv3.0/src/app/(protected)/profile/page.tsx
    - britv3.0/src/app/(protected)/profile/ProfilePageClient.tsx
    - britv3.0/src/app/(protected)/profile/settings/page.tsx
    - britv3.0/src/__tests__/services/profile-service.test.ts
  modified: []

key-decisions:
  - "Profile service uses injected Supabase client for testability (same pattern as provider-service)"
  - "Zod v4 uses .issues not .errors on ZodError objects"
  - "Provider details stored in profiles.provider_details JSONB column (not separate table)"
  - "Profile page uses numeric Tab indices (base-ui pattern) with conditional provider tab"

patterns-established:
  - "Profile service: function-per-operation with Supabase client injection"
  - "Avatar pipeline: client compressImage -> server magic-byte validate -> Sharp 400x400 WebP -> Storage"
  - "Notification preferences: debounced auto-save (500ms) with explicit save fallback"

requirements-completed: [DASH-09, DASH-10, DASH-11, DASH-13]

# Metrics
duration: 31min
completed: 2026-03-07
---

# Phase 03 Plan 03: Profile Management Summary

**Profile CRUD with Zod validation, avatar upload via Sharp resize to WebP, service provider extended profile, and notification preference toggles with debounced auto-save**

## Performance

- **Duration:** 31 min
- **Started:** 2026-03-07T18:43:12Z
- **Completed:** 2026-03-07T19:14:00Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Profile service with 6 exported functions: getProfile, updateProfile, uploadAvatar, updateProviderProfile, getNotificationPreferences, updateNotificationPreferences
- Avatar upload pipeline: client-side compression, server-side magic byte validation (JPEG/PNG/WebP), Sharp resize to 400x400 WebP, Supabase Storage with 1-year cache
- Profile page with tabbed layout (General, Provider, Notifications) using base-ui Tabs
- 8 profile service unit tests covering CRUD, validation, sanitization, cache invalidation, and role guards

## Task Commits

Each task was committed atomically:

1. **Task 1: Profile service layer and API routes** - `cfad803` (feat)
2. **Task 2: Profile UI components and pages** - `6d0e51f` (feat)
3. **Task 3: Profile service unit tests** - `aae4f90` (test)

## Files Created/Modified
- `britv3.0/src/services/profile/profile-service.ts` - Profile CRUD service with Zod schemas and Sharp avatar processing
- `britv3.0/src/app/api/profile/route.ts` - GET/PATCH profile API routes
- `britv3.0/src/app/api/profile/picture/route.ts` - POST avatar upload with 5MB limit
- `britv3.0/src/app/api/service-provider/profile/route.ts` - GET/PUT provider profile with role guard
- `britv3.0/src/app/api/notifications/preferences/route.ts` - GET/PUT notification preferences
- `britv3.0/src/components/profile/ProfileForm.tsx` - Profile edit form with react-hook-form
- `britv3.0/src/components/profile/AvatarUpload.tsx` - Avatar upload with compression and progress
- `britv3.0/src/components/profile/ProviderProfileForm.tsx` - Dynamic services, postcodes, pricing form
- `britv3.0/src/components/profile/NotificationPreferences.tsx` - Per-type toggles with debounced auto-save
- `britv3.0/src/app/(protected)/profile/page.tsx` - Server component profile page shell
- `britv3.0/src/app/(protected)/profile/ProfilePageClient.tsx` - Client tabbed profile layout
- `britv3.0/src/app/(protected)/profile/settings/page.tsx` - Standalone notification settings page
- `britv3.0/src/__tests__/services/profile-service.test.ts` - 8 unit tests for profile service

## Decisions Made
- Profile service uses injected Supabase client parameter (not global import) for testability, following the established provider-service pattern
- Zod v4 uses `.issues` not `.errors` on ZodError objects -- fixed all API routes accordingly
- Provider details stored in `profiles.provider_details` JSONB column rather than a separate table, keeping the schema simpler
- Profile page uses numeric Tab indices (base-ui Tabs pattern) with conditional provider tab insertion

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ZodError property name for Zod v4**
- **Found during:** Task 1 (API routes)
- **Issue:** `error.errors` does not exist in Zod v4; the correct property is `error.issues`
- **Fix:** Changed all 3 API route catch blocks to use `error.issues`
- **Files modified:** route.ts files for profile, service-provider, notifications
- **Verification:** TypeScript compilation passes clean
- **Committed in:** cfad803 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for correctness. No scope creep.

## Issues Encountered
- Pre-existing `pnpm build` failure due to missing `MarketplaceSearch` component in marketplace page -- unrelated to profile work, verified via `tsc --noEmit` that our files have zero TypeScript errors
- Pre-existing middleware test failures (5 tests in middleware.test.ts) -- unrelated to profile service

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Profile management complete, ready for dashboard pages that display profile data
- Notification preferences ready for notification delivery system to respect user settings
- Avatar upload pipeline ready -- requires Supabase Storage "avatars" bucket to be created in production

## Self-Check: PASSED

All 12 created files verified on disk. All 3 task commits (cfad803, 6d0e51f, aae4f90) verified in git log.

---
*Phase: 03-dashboards-communication*
*Completed: 2026-03-07*
