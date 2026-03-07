---
phase: 07-production-readiness
plan: 03
subsystem: admin
tags: [admin, supabase, rls, middleware, next-app-router, tailwind]

requires:
  - phase: 01-foundation
    provides: profiles table, auth middleware, createClient server helper
  - phase: 04-marketplace
    provides: provider_reviews table used in admin counts

provides:
  - is_admin column on profiles table (010_admin.sql)
  - push_subscriptions, content_reports, listing_moderation tables with RLS
  - /admin route group with sidebar layout and middleware guard
  - AdminSidebar with nav + external dashboard links (Stripe/Sentry/PostHog/Supabase)
  - CountCard component for admin dashboard metrics
  - getAdminCounts() service function for platform-wide counts
  - Admin dashboard page at /admin with 5 count cards

affects: [07-05-admin-backend-services, 07-10-admin-ui-pages]

tech-stack:
  added: []
  patterns:
    - "Admin route group (admin)/ separate from (protected)/ with own layout"
    - "Defense-in-depth: middleware is_admin check + layout auth guard"
    - "safeCount() pattern with PromiseLike for Supabase count queries with graceful 0 fallback"
    - "LucideIcons dynamic lookup by string name (matching ROLES constant pattern)"

key-files:
  created:
    - britv3.0/supabase/migrations/010_admin.sql
    - britv3.0/src/services/admin-service.ts
    - britv3.0/src/components/admin/CountCard.tsx
    - britv3.0/src/components/admin/AdminSidebar.tsx
    - britv3.0/src/app/(admin)/layout.tsx
    - britv3.0/src/app/(admin)/admin/page.tsx
  modified:
    - britv3.0/src/middleware.ts
    - britv3.0/package.json
    - britv3.0/pnpm-lock.yaml

key-decisions:
  - "Admin route group (admin)/ is separate from (protected)/ to avoid inheriting ProtectedHeader"
  - "safeCount() accepts PromiseLike (not Promise) to match Supabase PostgREST builder return type"
  - "Middleware is_admin guard queries profiles table directly using the middleware Supabase client"
  - "AdminSidebar uses 'use client' for usePathname() active link highlighting"
  - "External dashboard links open in new tab with rel=noopener noreferrer for security"

patterns-established:
  - "Admin service functions accept SupabaseClient injection for testability"
  - "safeCount() wraps all admin queries for graceful degradation when tables don't exist"

requirements-completed: [ADM-01, ADM-02, ADM-03, ADM-10]

duration: 17min
completed: 2026-03-07
---

# Phase 7 Plan 03: Admin Panel Foundation Summary

**Protected admin panel with is_admin database guard, RLS-enforced content_reports/push_subscriptions tables, sidebar navigation with external dashboard links, and 5-metric dashboard using safeCount query pattern**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-07T20:52:40Z
- **Completed:** 2026-03-07T21:09:40Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Admin database schema: is_admin column on profiles, push_subscriptions with RLS for PWA, content_reports with open/resolved/dismissed status, listing_moderation for automated flags
- Middleware admin guard: /admin routes check profiles.is_admin, non-admin redirected to /
- Admin panel UI: sidebar with 5 nav items + 4 external dashboard links, CountCard with Lucide icon lookup, dashboard page with responsive 5-card grid

## Task Commits

1. **Task 1: Admin database migration and middleware guard** - `491ccfd` (feat)
2. **Task 2: Admin layout, sidebar, dashboard page with count cards** - `752aa16` (feat)
3. **Auto-fix: Missing dependencies** - `e6e45e1` (fix)

## Files Created/Modified

- `britv3.0/supabase/migrations/010_admin.sql` - is_admin column, push_subscriptions, content_reports, listing_moderation tables with RLS
- `britv3.0/src/middleware.ts` - Added /admin route detection with is_admin profile check
- `britv3.0/src/services/admin-service.ts` - getAdminCounts() with safeCount() pattern for 5 platform metrics
- `britv3.0/src/components/admin/CountCard.tsx` - Linked card with Lucide icon, count, title
- `britv3.0/src/components/admin/AdminSidebar.tsx` - Nav items + external dashboard links, active highlighting
- `britv3.0/src/app/(admin)/layout.tsx` - Auth guard + AdminSidebar + main content layout
- `britv3.0/src/app/(admin)/admin/page.tsx` - Dashboard with 5 CountCards in responsive grid
- `britv3.0/package.json` - Added sonner and @tanstack/react-query (auto-fix)
- `britv3.0/pnpm-lock.yaml` - Updated lockfile (auto-fix)

## Decisions Made

- safeCount() accepts `PromiseLike<{ count: number | null; error: any }>` (not `Promise<>`) to match Supabase PostgREST builder return type — this matches the [Phase 05] Supabase query chain mock pattern
- AdminSidebar uses "use client" directive for usePathname() active link detection
- CountCard uses dynamic LucideIcons lookup by string name (matching the ROLES constant icon pattern from Phase 01)
- Admin layout uses defense-in-depth: middleware is_admin check + layout getUser() auth guard

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed PromiseLike type error in safeCount()**
- **Found during:** Task 2 (admin-service.ts type check)
- **Issue:** Supabase PostgREST builder returns PromiseLike not Promise; safeCount() parameter type was too narrow
- **Fix:** Changed parameter type to `PromiseLike<{ count: number | null; error: any }>` and removed intermediate `.then()` wrappers
- **Files modified:** britv3.0/src/services/admin-service.ts
- **Verification:** `tsc --noEmit --skipLibCheck` shows no errors in admin files
- **Committed in:** 752aa16 (Task 2 commit)

**2. [Rule 3 - Blocking] Installed missing sonner and @tanstack/react-query packages**
- **Found during:** Task 1 verification (pnpm build)
- **Issue:** These packages were used across prior phases (Phase 03 messaging, Phase 05 AI) but were absent from package.json, causing 37 build errors
- **Fix:** `pnpm add sonner @tanstack/react-query` and other packages referenced by prior-phase code
- **Files modified:** britv3.0/package.json, britv3.0/pnpm-lock.yaml
- **Verification:** Packages installed; admin-specific type errors resolved
- **Committed in:** e6e45e1

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for build health. Pre-existing issues from prior phases not caused by this plan.

## Issues Encountered

- Build exits with Turbopack/Serwist incompatibility error and `ssr: false` in Server Components error — these are pre-existing issues introduced in Plan 07-01 (Serwist config) and prior phases. Not introduced by Plan 07-03. Deferred to later in phase 7.

## Next Phase Readiness

- Admin database foundation (is_admin, content_reports, push_subscriptions) ready for Plans 07-05 and 07-10
- Admin route group and UI pattern established for subsequent admin pages (users, moderation, verifications, reviews)
- Middleware is_admin guard in place — Plan 07-05 can add API routes using admin client

---
*Phase: 07-production-readiness*
*Completed: 2026-03-07*
