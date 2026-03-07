---
phase: 07-production-readiness
plan: "04"
subsystem: api
tags: [pwa, push-notifications, web-push, indexeddb, offline, service-worker, serwist]

requires:
  - phase: 07-production-readiness
    plan: "01"
    provides: Serwist SW with push/notificationclick event handlers, PWA infrastructure
  - phase: 07-production-readiness
    plan: "03"
    provides: Feature flags, analytics, admin layer

provides:
  - web-push VAPID server utilities with expired subscription cleanup
  - POST/DELETE /api/push/subscribe for subscription storage in push_subscriptions table
  - POST /api/push/send for service-role-protected notification dispatch to user
  - PushManager component: browser-support check, permission flow, enable/disable with UI for all 3 states
  - useOfflineData hook: IndexedDB caching with preset limits per key
  - getOfflineData helper for reading cached data
  - SW runtime caching: NetworkFirst for /api/properties/*, CacheFirst for property images (100 max, 7d TTL)

affects: [mobile-pwa, notifications, homebuyer-dashboard, provider-dashboard]

tech-stack:
  added: [web-push@3.6.7, "@types/web-push@3.6.4"]
  patterns: [TDD for server utilities (6 tests passing), IndexedDB via native API (no extra library), SW runtime caching via Serwist NetworkFirst/CacheFirst strategies, push subscription stored as endpoint+p256dh+auth in push_subscriptions table]

key-files:
  created:
    - britv3.0/src/lib/push.ts
    - britv3.0/src/lib/push.test.ts
    - britv3.0/src/app/api/push/subscribe/route.ts
    - britv3.0/src/app/api/push/send/route.ts
    - britv3.0/src/components/pwa/PushManager.tsx
    - britv3.0/src/hooks/useOfflineData.ts
  modified:
    - britv3.0/src/app/sw.ts

key-decisions:
  - "VAPID details lazy-initialized in push.ts on first sendPushNotification call (not module load) to avoid startup errors"
  - "410 (Gone) handler deletes expired subscription via admin client then returns {success:false, reason:'expired'}"
  - "push/send route guards with Bearer SUPABASE_SERVICE_ROLE_KEY check (service-to-service auth, not user auth)"
  - "PushManager uses applicationServerKey as ArrayBuffer (urlBase64ToUint8Array().buffer) to satisfy TypeScript strict Uint8Array<ArrayBufferLike> constraint"
  - "IndexedDB implementation uses native API (no idb-keyval library) - simpler, no extra bundle cost"
  - "useOfflineData silently ignores write failures (storage quota, private browsing) to not break UI"
  - "SW runtime caching: regex matcher for /api/properties/* and function matcher for cross-origin property images"

patterns-established:
  - "PushManager placed in notification settings or after key actions -- NOT auto-shown on page load"
  - "Offline hooks read from IndexedDB on demand via getOfflineData, write on data change via useOfflineData"
  - "SW strategies always added BEFORE defaultCache spread to ensure custom matchers take priority"

requirements-completed: [MOB-03, MOB-04, MOB-05, MOB-06]

duration: 24min
completed: 2026-03-07
---

# Phase 7 Plan 04: Push Notifications & Offline Data Summary

**Web-push VAPID pipeline with subscription management API, PushManager UI component, IndexedDB offline caching hook, and SW NetworkFirst/CacheFirst runtime caching for property data and images**

## Performance

- **Duration:** 24 min
- **Started:** 2026-03-07T21:19:42Z
- **Completed:** 2026-03-07T21:44:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Full push notification server pipeline: VAPID config, sendPushNotification with 410 expiry cleanup, subscribe/unsubscribe API routes, admin send endpoint
- TDD: 6 tests covering getVapidPublicKey, sendNotification call, 410 expired handling, non-410 error re-throw (all passing)
- PushManager renders contextual UI based on permission state (granted/default/denied) -- not shown on page load
- useOfflineData hook writes to IndexedDB "britestate-offline" store with preset key limits; getOfflineData for reads
- SW updated with NetworkFirst (/api/properties/*, 24h TTL, 50 entries) and CacheFirst (cross-origin images, 7d TTL, 100 entries)

## Task Commits

1. **Task 1: Push notification server utilities and API routes (TDD)** - `1803d57` (feat)
2. **Task 2: Push manager UI, offline data hook, and SW caching** - `0008a02` (feat)

## Files Created/Modified

- `britv3.0/src/lib/push.ts` - Server-side web-push utilities (getVapidPublicKey, sendPushNotification with expiry cleanup)
- `britv3.0/src/lib/push.test.ts` - 6 TDD unit tests covering all push utility paths
- `britv3.0/src/app/api/push/subscribe/route.ts` - POST (upsert subscription) and DELETE (remove subscription) API routes
- `britv3.0/src/app/api/push/send/route.ts` - Service-role-protected notification dispatch to all user subscriptions
- `britv3.0/src/components/pwa/PushManager.tsx` - Client component with permission state UI and enable/disable flow
- `britv3.0/src/hooks/useOfflineData.ts` - IndexedDB caching hook with getOfflineData export
- `britv3.0/src/app/sw.ts` - Added NetworkFirst and CacheFirst runtime caching for properties and images

## Decisions Made

- VAPID lazy-init pattern: setVapidDetails called on first sendPushNotification (not module load) to avoid missing env var errors at startup
- push/send route uses `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` header check (not user auth) for internal service calls
- PushManager converts VAPID public key via urlBase64ToUint8Array then takes `.buffer as ArrayBuffer` cast to satisfy strict TypeScript Uint8Array type
- Native IndexedDB API used directly (no idb-keyval) -- saves bundle bytes, avoids additional dependency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Uint8Array TypeScript type mismatch in PushManager**
- **Found during:** Task 2 (build verification)
- **Issue:** `Uint8Array<ArrayBufferLike>` not assignable to `string | BufferSource | null | undefined` due to `ArrayBufferLike` vs `ArrayBuffer` strict constraint in pushManager.subscribe
- **Fix:** Changed `applicationServerKey` from raw Uint8Array to `.buffer as ArrayBuffer`
- **Files modified:** britv3.0/src/components/pwa/PushManager.tsx
- **Verification:** Build compiled successfully (TypeScript passed)
- **Committed in:** `0008a02` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed vitest mock type casting in push.test.ts**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** Complex vi.mocked() type inference failed with webpush default export due to Vitest 4.x stricter generics
- **Fix:** Used `as unknown as Record<string, any>` intermediate cast on webpush default import before vi.mocked()
- **Files modified:** britv3.0/src/lib/push.test.ts
- **Verification:** 6/6 tests still pass, no TypeScript errors in production files
- **Committed in:** `0008a02` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 type/build bugs)
**Impact on plan:** Both auto-fixes required for build correctness. No scope creep.

## Issues Encountered

- Turbopack build experienced intermittent ENOENT errors on `.next/static/**/_buildManifest.js.tmp.*` temp files during the first 2-3 build attempts. This is a known Next.js 16 + Turbopack race condition, not related to plan changes. Build succeeded on subsequent clean retry.

## User Setup Required

**External services require manual configuration before push notifications work:**

1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
   VAPID_PRIVATE_KEY=<private key>
   VAPID_SUBJECT=mailto:admin@britestate.co.uk
   ```

3. Create `push_subscriptions` table in Supabase:
   ```sql
   CREATE TABLE push_subscriptions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     endpoint TEXT NOT NULL,
     p256dh TEXT NOT NULL,
     auth TEXT NOT NULL,
     user_agent TEXT,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now(),
     UNIQUE (user_id, endpoint)
   );
   ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users manage own subscriptions" ON push_subscriptions
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);
   ```

## Next Phase Readiness

- Push notification pipeline complete: subscribe -> store -> send -> deep link
- PushManager ready to embed in notification settings pages
- useOfflineData ready to integrate into saved properties and recent views pages
- SW runtime caching active for property API responses and cross-origin images

---
*Phase: 07-production-readiness*
*Completed: 2026-03-07*
