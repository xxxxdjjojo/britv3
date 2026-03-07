---
phase: 07-production-readiness
plan: "01"
subsystem: ui
tags: [pwa, serwist, service-worker, web-manifest, offline, install-prompt]

requires:
  - phase: 01-foundation
    provides: middleware CSP, root layout structure, Supabase auth flow

provides:
  - Web App Manifest (MetadataRoute.Manifest) with Britestate brand config
  - Serwist service worker with precaching, runtime caching, push/notificationclick handlers
  - Placeholder PWA icons (192px, 512px, maskable 512px) and badge.png
  - InstallPrompt component with 2-visit deferred install logic
  - OfflineIndicator component with online/offline event handling
  - worker-src 'self' CSP directive in middleware

affects: [07-04, mobile-pwa, notifications]

tech-stack:
  added: [serwist@9.5.6, "@serwist/next@9.5.6", "@serwist/window@9.5.6"]
  patterns: [Next.js MetadataRoute.Manifest for web app manifest, Serwist withSerwistInit wrapper for next.config.ts, dynamic imports with ssr:false for browser-only PWA components]

key-files:
  created:
    - britv3.0/src/app/manifest.ts
    - britv3.0/src/app/sw.ts
    - britv3.0/src/app/manifest.test.ts
    - britv3.0/src/components/pwa/InstallPrompt.tsx
    - britv3.0/src/components/pwa/OfflineIndicator.tsx
    - britv3.0/public/icons/icon-192.png
    - britv3.0/public/icons/icon-512.png
    - britv3.0/public/icons/icon-maskable.png
    - britv3.0/public/badge.png
  modified:
    - britv3.0/next.config.ts
    - britv3.0/src/middleware.ts
    - britv3.0/src/app/layout.tsx

key-decisions:
  - "Serwist 9.5.6 used for PWA service worker with defaultCache runtime strategy"
  - "Icons are placeholder solid-color PNGs (#005F73 brand color) generated with sharp -- real icons from design team later"
  - "push/notificationclick event listeners added in sw.ts for Plan 04 push notification prep"
  - "dynamic import with ssr:false used for both PWA components to avoid SSR browser API errors"
  - "sw.js not generated in Turbopack mode -- Serwist webpack plugin requires --webpack flag; noted as known limitation"
  - "britestate_visit_count localStorage key tracks visit count for deferred install prompt (shows on 2nd+ visit)"

patterns-established:
  - "PWA browser-only components always use dynamic import with ssr:false to prevent SSR errors"
  - "Service worker event listeners (push, notificationclick) included in sw.ts from the start for extensibility"

requirements-completed: [MOB-01, MOB-02, MOB-07]

duration: 45min
completed: 2026-03-07
---

# Phase 7 Plan 01: PWA Infrastructure Summary

**Serwist PWA setup with web manifest, service worker (push/click handlers), deferred install prompt after 2 visits, and offline connectivity indicator**

## Performance

- **Duration:** 45 min
- **Started:** 2026-03-07T21:00:00Z
- **Completed:** 2026-03-07T21:45:00Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Web App Manifest configured with Britestate brand (standalone display, #005F73 theme, 3 icon variants)
- Serwist service worker with precaching, defaultCache runtime, and push/notificationclick handlers for future push notifications
- Placeholder 192px, 512px, maskable 512px icons plus 96px badge PNG generated with sharp
- InstallPrompt component defers to 2nd visit via localStorage counter, hides in standalone mode
- OfflineIndicator component shows amber banner on connectivity loss using online/offline events

## Task Commits

1. **Task 1: PWA manifest, icons, service worker, and Serwist config** - `b7bada2` (feat)
2. **Task 2: Deferred install prompt and offline indicator components** - `9b53587` (feat)

## Files Created/Modified

- `britv3.0/src/app/manifest.ts` - Next.js MetadataRoute.Manifest with brand config and 3 icon variants
- `britv3.0/src/app/sw.ts` - Serwist service worker with precaching, push, and notificationclick handlers
- `britv3.0/src/app/manifest.test.ts` - Unit tests for manifest (6 tests, all passing)
- `britv3.0/src/components/pwa/InstallPrompt.tsx` - Deferred install prompt with 2-visit logic
- `britv3.0/src/components/pwa/OfflineIndicator.tsx` - Offline state banner component
- `britv3.0/public/icons/icon-*.png` - Placeholder brand-colored PWA icons
- `britv3.0/public/badge.png` - Notification badge placeholder
- `britv3.0/next.config.ts` - Wrapped with withSerwistInit, turbopack:{} for Next.js 16
- `britv3.0/src/middleware.ts` - Added worker-src 'self' CSP directive

## Decisions Made

- Serwist webpack plugin conflicts with Next.js 16 Turbopack default; `turbopack: {}` added to next.config.ts to suppress the "no turbopack config" error while Serwist generates sw.js in webpack mode during production build
- Push/notificationclick event listeners included in sw.ts now as prep for Plan 04 push notifications (MOB-07)
- Icons generated with sharp (already installed) as solid-color PNG placeholders -- design team to replace

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored all missing dependencies stripped by plan 07-02**
- **Found during:** Task 2 (build verification)
- **Issue:** Plan 07-02 had replaced package.json with a stripped version missing @tanstack/react-query, inngest, sharp, recharts, and 15+ other deps needed by the existing codebase
- **Fix:** Re-installed all missing dependencies via pnpm add, merged package.json to include all previous + new observability deps
- **Files modified:** britv3.0/package.json, britv3.0/pnpm-lock.yaml
- **Verification:** Build succeeded (BUILD_ID present in .next/)
- **Committed in:** 9b53587 (Task 2 commit, via pnpm-lock.yaml)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to restore build capability. No scope creep.

## Issues Encountered

- Next.js 16 uses Turbopack by default; Serwist's webpack plugin requires webpack mode to generate sw.js. The `turbopack: {}` config suppresses the error, and production builds complete, but sw.js generation requires webpack mode (`next build --webpack`). Documented as known limitation -- will be resolved when Serwist adds Turbopack support (tracked at https://github.com/serwist/serwist/issues/54).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Web App Manifest served at /manifest.webmanifest
- Serwist integration configured and build succeeds
- InstallPrompt and OfflineIndicator render in root layout (confirmed by plan 07-02 layout.tsx commit)
- Manifest unit tests (6/6 passing)
- Ready for Plan 04 push notifications (sw.ts has push/notificationclick handlers)

---
*Phase: 07-production-readiness*
*Completed: 2026-03-07*
