---
phase: 03-dashboards-communication
plan: 02
subsystem: infra, testing
tags: [redis, upstash, react-query, dompurify, xss, vitest, cache]

requires:
  - phase: 01-foundation
    provides: "Supabase client, auth types, env validation"
provides:
  - "Upstash Redis cache client singleton with get/set/delete/pattern helpers"
  - "XSS sanitization utilities (sanitizeHtml, sanitizeText)"
  - "Client-side image compression via Canvas API"
  - "React Query provider for protected routes"
  - "Test mock factories for Redis, Anthropic, Resend"
  - "Dashboard and messaging test fixtures"
  - "Vitest setup with global Supabase mocks"
affects: [03-dashboards-communication, 04-marketplace, 05-ai-financial-tools]

tech-stack:
  added: ["@upstash/redis", "@upstash/ratelimit", "isomorphic-dompurify", "@tanstack/react-query"]
  patterns: ["Redis graceful degradation (no-op when env vars missing)", "Factory-function test mocks with vi.fn()", "Deterministic fixtures for snapshot-safe tests"]

key-files:
  created:
    - britv3.0/src/lib/cache/redis.ts
    - britv3.0/src/lib/validation/sanitize.ts
    - britv3.0/src/lib/utils/compress-image.ts
    - britv3.0/src/lib/providers/QueryProvider.tsx
    - britv3.0/src/__tests__/mocks/redis.ts
    - britv3.0/src/__tests__/mocks/anthropic.ts
    - britv3.0/src/__tests__/mocks/resend.ts
    - britv3.0/src/__tests__/fixtures/dashboard.ts
    - britv3.0/src/__tests__/fixtures/messaging.ts
    - britv3.0/src/__tests__/lib/sanitize.test.ts
    - britv3.0/src/__tests__/lib/redis.test.ts
  modified:
    - britv3.0/src/env.ts
    - britv3.0/src/app/(protected)/layout.tsx
    - britv3.0/src/__tests__/setup.ts

key-decisions:
  - "Redis client returns null (no-op) when UPSTASH env vars missing -- prevents build failures without Redis configured"
  - "MockRedis constructor uses function declaration (not vi.fn arrow) so `new Redis()` works in tests"
  - "Protected layout wraps children with QueryProvider for client-side async state"

patterns-established:
  - "Redis graceful degradation: check env vars, return no-op if missing, log warning"
  - "Test mock factory pattern: createMockX() returns object with vi.fn() methods"
  - "Deterministic fixtures: fixed dates, no random values, snapshot-safe"

requirements-completed: [DASH-08]

duration: 26min
completed: 2026-03-07
---

# Phase 3 Plan 02: Shared Infrastructure Utilities Summary

**Redis cache client, XSS sanitization, React Query provider, test mocks/fixtures with 22 passing unit tests**

## Performance

- **Duration:** 26 min
- **Started:** 2026-03-07T18:09:47Z
- **Completed:** 2026-03-07T18:36:41Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments
- Upstash Redis client singleton with getCached/setCache/invalidateCache/invalidateCachePattern helpers and sliding-window rate limiter factory
- XSS sanitization via isomorphic-dompurify with safe tag allowlist and plain-text stripping
- Client-side image compression utility targeting 500KB via Canvas API with EXIF stripping
- React Query provider with staleTime 60s wrapping protected layout
- 3 test mock factories (Redis, Anthropic, Resend) following existing Supabase mock pattern
- 2 fixture files with deterministic data for all 6 dashboard roles and messaging domain
- 22 unit tests passing (16 sanitize + 6 Redis cache)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Redis client, sanitization utils, image compression, and React Query provider** - `43aab76` (feat)
2. **Task 2: Create test mock factories, fixtures, and setup file** - `db9fe46` (feat)
3. **Task 3: Unit tests for sanitization and Redis cache utilities** - `f154dea` (test)

## Files Created/Modified
- `britv3.0/src/lib/cache/redis.ts` - Upstash Redis client singleton with cache helpers and rate limiter factory
- `britv3.0/src/lib/validation/sanitize.ts` - XSS sanitization (sanitizeHtml with allowlist, sanitizeText strips all)
- `britv3.0/src/lib/utils/compress-image.ts` - Client-side image compression via OffscreenCanvas
- `britv3.0/src/lib/providers/QueryProvider.tsx` - React Query client provider for protected routes
- `britv3.0/src/env.ts` - Added optional UPSTASH, ANTHROPIC, RESEND env vars
- `britv3.0/src/app/(protected)/layout.tsx` - Wrapped children with QueryProvider
- `britv3.0/src/__tests__/setup.ts` - Added global Supabase mocks and afterEach restore
- `britv3.0/src/__tests__/mocks/redis.ts` - Mock Redis with in-memory Map backing store
- `britv3.0/src/__tests__/mocks/anthropic.ts` - Mock Anthropic with configurable response
- `britv3.0/src/__tests__/mocks/resend.ts` - Mock Resend email client
- `britv3.0/src/__tests__/fixtures/dashboard.ts` - Dashboard fixtures for all 6 roles
- `britv3.0/src/__tests__/fixtures/messaging.ts` - Messaging fixtures (conversations, messages, attachments)
- `britv3.0/src/__tests__/lib/sanitize.test.ts` - 16 tests for XSS sanitization
- `britv3.0/src/__tests__/lib/redis.test.ts` - 6 tests for Redis cache operations

## Decisions Made
- Redis client returns null (no-op) when UPSTASH env vars are missing to prevent build failures without Redis configured
- MockRedis constructor uses function declaration (not vi.fn arrow) so `new Redis()` works in tests
- Protected layout wraps children with QueryProvider for client-side async state management
- UPSTASH, ANTHROPIC, RESEND env vars are all optional in env.ts to allow build without external services

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Redis mock constructor compatibility**
- **Found during:** Task 3 (Unit tests)
- **Issue:** `vi.fn(() => mockRedis)` doesn't work as a constructor with `new` keyword
- **Fix:** Changed to `function MockRedis() { return mockRedis; }` declaration
- **Files modified:** britv3.0/src/__tests__/lib/redis.test.ts
- **Verification:** All 6 Redis tests pass
- **Committed in:** f154dea (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor test infrastructure fix. No scope creep.

## Issues Encountered
- Next.js 16 Turbopack build has intermittent ENOENT race condition on _buildManifest.js.tmp -- pre-existing issue confirmed by testing with stashed changes. TypeScript compilation passes cleanly for all new files.

## User Setup Required
None - all new env vars (UPSTASH, ANTHROPIC, RESEND) are optional with graceful degradation.

## Next Phase Readiness
- All shared utilities ready for downstream Phase 3 plans (dashboards, messaging, notifications)
- Test infrastructure (mocks, fixtures, setup) ready for all subsequent test plans
- QueryProvider integrated into protected layout for client-side data fetching

## Self-Check: PASSED

- All 12 created files verified on disk
- All 3 task commits verified in git log (43aab76, db9fe46, f154dea)

---
*Phase: 03-dashboards-communication*
*Completed: 2026-03-07*
