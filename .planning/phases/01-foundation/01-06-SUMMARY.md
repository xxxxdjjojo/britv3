---
phase: 01-foundation
plan: 06
subsystem: ui
tags: [layout, header, footer, mobile-nav, public-pages, error-pages, protected-routes, responsive, next-app-router]

# Dependency graph
requires:
  - phase: 01-01
    provides: Design system tokens, Shadcn UI components, Supabase clients
provides:
  - Responsive layout shell (Header, Footer, MobileNav)
  - Logo and LoadingSpinner shared components
  - Homepage with hero, features, trust badges, how-it-works, CTA
  - About, Terms, Privacy public pages
  - Branded 404 and 500 error pages
  - Protected route layout guard with Supabase auth redirect
  - (main) and (protected) route group layouts
affects: [01-07, 01-08, 01-09]

# Tech tracking
tech-stack:
  added: []
  patterns: [Route group layouts for public vs protected, Plus Jakarta Sans + Inter via next/font/google, Sheet-based mobile navigation]

key-files:
  created:
    - britv3.0/src/app/layout.tsx
    - britv3.0/src/app/(main)/layout.tsx
    - britv3.0/src/app/(main)/page.tsx
    - britv3.0/src/app/(main)/about/page.tsx
    - britv3.0/src/app/(main)/terms/page.tsx
    - britv3.0/src/app/(main)/privacy/page.tsx
    - britv3.0/src/app/(protected)/layout.tsx
    - britv3.0/src/app/not-found.tsx
    - britv3.0/src/app/error.tsx
    - britv3.0/src/components/layout/Header.tsx
    - britv3.0/src/components/layout/Footer.tsx
    - britv3.0/src/components/layout/MobileNav.tsx
    - britv3.0/src/components/shared/Logo.tsx
    - britv3.0/src/components/shared/LoadingSpinner.tsx
    - britv3.0/src/__tests__/layout/shell.test.ts
    - britv3.0/src/__tests__/pages/public.test.ts
  modified:
    - britv3.0/src/app/layout.tsx

key-decisions:
  - "Header uses scroll detection for shadow-sm instead of always-on shadow"
  - "MobileNav slides from left using Sheet component with close-on-click"
  - "Protected layout uses Supabase server client getUser() not getSession() for security"
  - "Homepage uses static data arrays instead of CMS -- suitable for MVP"
  - "Removed old root page.tsx; homepage now served from (main) route group"

patterns-established:
  - "Route groups: (main) for public pages with Header+Footer, (protected) for auth-guarded routes"
  - "Shared components: Logo and LoadingSpinner in components/shared/ with size/variant props"
  - "Layout components: Header, Footer, MobileNav in components/layout/"
  - "Error pages: Branded not-found.tsx and error.tsx at app root"

requirements-completed: [AUTH-19]

# Metrics
duration: 8min
completed: 2026-03-07
---

# Phase 1 Plan 6: Layout Shell & Public Pages Summary

**Responsive layout shell with sticky header, mobile Sheet nav, 4 public pages (home/about/terms/privacy), branded error pages (404/500), and protected route guard via Supabase auth**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-07T17:04:59Z
- **Completed:** 2026-03-07T17:13:42Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Responsive layout shell with sticky Header (desktop nav + auth buttons), Sheet-based MobileNav, and 4-column Footer
- Homepage with hero gradient, trust badges, features grid, how-it-works steps, and brand-primary CTA section
- About, Terms (with placeholder notice), and Privacy (GDPR sections) public pages
- Protected layout guard checking Supabase auth and redirecting to /login
- Branded 404 and 500 error pages with Britestate design tokens

## Task Commits

Each task was committed atomically:

1. **Task 1: Root layout, shared components, header, and footer** - `ea3cf64` (feat)
2. **Task 2: Public pages, error pages, and protected layout** - `0bdc7b3` (feat)

## Files Created/Modified
- `britv3.0/src/app/layout.tsx` - Root layout with Plus Jakarta Sans + Inter fonts, Sonner toaster
- `britv3.0/src/app/(main)/layout.tsx` - Public layout wrapping Header + children + Footer
- `britv3.0/src/app/(main)/page.tsx` - Homepage with hero, trust badges, features, how-it-works, CTA
- `britv3.0/src/app/(main)/about/page.tsx` - About page with mission, values, team placeholder
- `britv3.0/src/app/(main)/terms/page.tsx` - Terms of service with placeholder legal text
- `britv3.0/src/app/(main)/privacy/page.tsx` - Privacy policy with GDPR rights sections
- `britv3.0/src/app/(protected)/layout.tsx` - Auth guard layout redirecting unauthenticated users
- `britv3.0/src/app/not-found.tsx` - Branded 404 page with FileQuestion icon
- `britv3.0/src/app/error.tsx` - Error boundary with try-again and go-home buttons
- `britv3.0/src/components/layout/Header.tsx` - Sticky header with scroll shadow, responsive nav
- `britv3.0/src/components/layout/Footer.tsx` - 4-column footer with Company/Support/Legal sections
- `britv3.0/src/components/layout/MobileNav.tsx` - Sheet-based mobile navigation panel
- `britv3.0/src/components/shared/Logo.tsx` - SVG brand mark + text with size/variant props
- `britv3.0/src/components/shared/LoadingSpinner.tsx` - Animated brand-primary spinner
- `britv3.0/src/__tests__/layout/shell.test.ts` - 5 component import/export tests
- `britv3.0/src/__tests__/pages/public.test.ts` - 6 page module export tests

## Decisions Made
- Header uses scroll detection for shadow-sm instead of always-on shadow for cleaner appearance
- Protected layout uses `getUser()` instead of `getSession()` for security (validates JWT server-side)
- Removed default Next.js root page.tsx; homepage served from (main) route group to enable layout shell
- Homepage uses static data arrays rather than CMS -- appropriate for MVP stage

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Layout shell complete and ready for all feature pages
- Public pages serve as content foundation
- Protected layout guard functional (will need useAuth hook from 01-05 for Header auth state display)
- Error pages provide branded fallbacks for all routes

## Self-Check: PASSED

- All 16 created files verified present on disk
- Commits ea3cf64 and 0bdc7b3 verified in git log
- Build passes with all routes (/, /about, /terms, /privacy, /_not-found)
- 11 tests pass (5 layout shell + 6 public pages)

---
*Phase: 01-foundation*
*Completed: 2026-03-07*
