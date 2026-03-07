---
phase: 07-production-readiness
plan: 02
subsystem: observability
tags: [sentry, posthog, logging, feature-flags, ci-cd, monitoring]
dependency_graph:
  requires: []
  provides:
    - structured-json-logger
    - feature-flag-env-reader
    - sentry-error-tracking
    - posthog-analytics
    - supabase-migration-ci
  affects:
    - britv3.0/src/app/layout.tsx
    - britv3.0/src/middleware.ts
tech_stack:
  added:
    - "@sentry/nextjs"
    - "posthog-js"
    - "@posthog/next"
  patterns:
    - structured JSON logging to stdout/stderr
    - environment-variable feature flags with upgrade path to PostHog
    - graceful degradation when DSN/keys not configured
    - CSP header extension for third-party monitoring services
key_files:
  created:
    - britv3.0/src/lib/logger.ts
    - britv3.0/src/lib/logger.test.ts
    - britv3.0/src/lib/features.ts
    - britv3.0/src/lib/features.test.ts
    - britv3.0/.github/workflows/migrate.yml
    - britv3.0/sentry.server.config.ts
    - britv3.0/sentry.edge.config.ts
    - britv3.0/src/instrumentation.ts
    - britv3.0/src/instrumentation-client.ts
    - britv3.0/src/lib/posthog.ts
    - britv3.0/src/components/providers/PostHogProvider.tsx
  modified:
    - britv3.0/src/middleware.ts
    - britv3.0/src/app/layout.tsx
    - britv3.0/tsconfig.json
    - britv3.0/next.config.ts
decisions:
  - "Feature flags use NEXT_PUBLIC_ENABLE_{NAME} env vars with JSDoc upgrade path to PostHog remote flags"
  - "PostHogProvider imported directly (not dynamic) since it has use client directive"
  - "turbopack: {} added to next.config.ts to resolve Next.js 16 Turbopack/Serwist webpack conflict"
  - "webworker added to tsconfig lib to resolve ServiceWorkerGlobalScope type in sw.ts"
metrics:
  duration: "21 min"
  completed: "2026-03-07"
  tasks_completed: 2
  files_changed: 15
---

# Phase 7 Plan 02: Observability and CI/CD Integration Summary

**One-liner:** Sentry error tracking (server/edge/client), PostHog pageview analytics, structured JSON logger, env-var feature flags, and GitHub Actions Supabase migration CI — all with graceful no-config degradation.

## Tasks Completed

### Task 1: Structured Logger, Feature Flags, GitHub Actions Migration CI

**TDD approach (RED → GREEN):**

1. Wrote failing tests for `logger.ts` and `features.ts`
2. Implemented `log(level, message, context?)` outputting JSON to stdout (info/warn) or stderr (error)
3. Implemented `isFeatureEnabled(name)` reading `NEXT_PUBLIC_ENABLE_{NAME}` env vars
4. Implemented `features()` returning all known flags as Record<string, boolean>
5. Created `.github/workflows/migrate.yml` triggering on push to main when `supabase/migrations/**` changes

**15 tests pass** covering all log levels, JSON structure, ISO timestamp format, context spreading, env var behavior.

### Task 2: Sentry and PostHog Integration with CSP Updates

1. `sentry.server.config.ts` and `sentry.edge.config.ts`: Sentry.init() guarded by `SENTRY_DSN` presence
2. `src/instrumentation.ts`: dynamic imports based on `NEXT_RUNTIME` for server/edge Sentry init
3. `src/instrumentation-client.ts`: client Sentry init guarded by `NEXT_PUBLIC_SENTRY_DSN`
4. `src/lib/posthog.ts`: `initPostHog()` guarded by `typeof window` and `NEXT_PUBLIC_POSTHOG_KEY`
5. `src/components/providers/PostHogProvider.tsx`: client component tracking pageviews on pathname changes
6. `src/app/layout.tsx`: wraps children with PostHogProvider
7. `src/middleware.ts`: added `*.ingest.sentry.io`, `us.i.posthog.com` to connect-src/script-src; `worker-src 'self' blob:`

**Build passes**: 71 routes compiled and generated successfully.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Turbopack/Serwist webpack config conflict**
- **Found during:** Task 2 build verification
- **Issue:** Next.js 16 Turbopack build failed: "This build is using Turbopack, with a webpack config and no turbopack config"
- **Fix:** Added `turbopack: {}` to `next.config.ts` to explicitly declare Turbopack config
- **Files modified:** `britv3.0/next.config.ts`
- **Commit:** 20d933f

**2. [Rule 1 - Bug] ServiceWorkerGlobalScope type not found in tsconfig**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** `src/app/sw.ts` declares `ServiceWorkerGlobalScope` but tsconfig lib didn't include `webworker`
- **Fix:** Added `"webworker"` to `lib` array in `tsconfig.json`
- **Files modified:** `britv3.0/tsconfig.json`
- **Commit:** 20d933f

**3. [Rule 1 - Bug] dynamic() with ssr:false not allowed in Server Component layout**
- **Found during:** Task 2 build verification
- **Issue:** Next.js 16 Turbopack rejects `dynamic()` with `ssr: false` in Server Components (root layout.tsx). This affected pre-existing InstallPrompt/OfflineIndicator components and my PostHogProvider.
- **Fix:** Replaced dynamic imports with direct named/default imports. PostHogProvider has "use client" so it safely renders client-side. InstallPrompt and OfflineIndicator also have "use client".
- **Files modified:** `britv3.0/src/app/layout.tsx`
- **Commit:** 20d933f

## Self-Check: PASSED

All artifacts verified:
- britv3.0/src/lib/logger.ts — FOUND
- britv3.0/src/lib/features.ts — FOUND
- britv3.0/.github/workflows/migrate.yml — FOUND
- britv3.0/src/lib/posthog.ts — FOUND
- britv3.0/src/components/providers/PostHogProvider.tsx — FOUND
- britv3.0/sentry.server.config.ts — FOUND
- .next/BUILD_ID (build artifact) — FOUND
- commit eb9c34d (task 1) — FOUND
- commit 20d933f (task 2) — FOUND
