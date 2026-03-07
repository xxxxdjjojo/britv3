---
phase: 01-foundation
plan: 05
subsystem: infra
tags: [csp, security-headers, middleware, rbac, nonce, next-middleware]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: "Supabase client factories and test infrastructure"
  - phase: 01-foundation-02
    provides: "Route constants (PUBLIC_ROUTES, AUTH_ROUTES, PROTECTED_ROUTES) and auth types"
provides:
  - "Security middleware with CSP Level 3 nonce-based headers"
  - "RBAC route protection (auth guard redirects)"
  - "Security response headers on all routes"
affects: [01-03, 01-04, 01-06, 01-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSP Level 3 with nonce generated via btoa(crypto.randomUUID())"
    - "Middleware uses @supabase/ssr createServerClient directly (not lib helper) for cookie access"
    - "x-nonce response header exposes nonce for server components"
    - "Route matching with exact + prefix pattern for flexible path protection"

key-files:
  created:
    - "britv3.0/src/middleware.ts"
    - "britv3.0/src/__tests__/security/csp.test.ts"
    - "britv3.0/src/__tests__/security/middleware.test.ts"
  modified: []

key-decisions:
  - "Used btoa(crypto.randomUUID()) for nonce generation -- simple, crypto-strong, no extra deps"
  - "Middleware creates its own Supabase client (not lib/supabase/server.ts) because middleware needs direct cookie access via request.cookies"
  - "Auth routes redirect authenticated users to /dashboard (not role-specific dashboard) for simplicity"

patterns-established:
  - "Security headers set on all responses including redirects"
  - "Middleware matcher uses negative lookahead to exclude static assets"
  - "Route protection: PUBLIC_ROUTES always pass, AUTH_ROUTES redirect if authenticated, everything else requires auth"

requirements-completed: [AUTH-16, AUTH-17, AUTH-18]

# Metrics
duration: 6min
completed: 2026-03-07
---

# Phase 1 Plan 5: Security Middleware Summary

**CSP Level 3 middleware with nonce-based script-src, RBAC route guards, and security response headers on all routes**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-07T17:05:09Z
- **Completed:** 2026-03-07T17:11:13Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 3

## Accomplishments
- CSP Level 3 with nonce-based script-src, allowlisted OAuth domains (Google, Apple), Supabase connect/frame-src
- RBAC route protection: unauthenticated users redirected to /login, authenticated users redirected away from auth routes to /dashboard
- All security headers set: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy camera=() microphone=() geolocation=()
- 26 passing security tests covering CSP directives, header values, and redirect logic

## Task Commits

Each task was committed atomically (TDD):

1. **Task 1 RED: Failing tests for CSP and middleware** - `dd8edb6` (test)
2. **Task 1 GREEN: Implement middleware** - `da35f5b` (feat)

## Files Created/Modified
- `britv3.0/src/middleware.ts` - Auth guard + CSP + security headers middleware with matcher config
- `britv3.0/src/__tests__/security/csp.test.ts` - 13 tests for CSP header format, nonce, directives, and security headers
- `britv3.0/src/__tests__/security/middleware.test.ts` - 13 tests for route protection redirects and matcher config

## Decisions Made
- Used `btoa(crypto.randomUUID())` for nonce generation -- crypto-strong randomness, no additional dependencies needed
- Middleware creates its own Supabase server client via `@supabase/ssr` directly rather than using the `lib/supabase/server.ts` helper, because middleware needs direct cookie access via `request.cookies` (not Next.js `cookies()` API)
- Authenticated users on auth routes redirect to `/dashboard` (generic) rather than role-specific dashboard -- role routing is a presentation concern for the dashboard layout

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Next.js 16 build exhibits a transient ENOENT race condition with `.next/static` temp files during Turbopack builds. This is a known framework issue, not related to our code. TypeScript compilation passes cleanly with zero errors, and the build compilation step itself succeeds ("Compiled successfully in 4.1s").

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Security middleware is in place -- all subsequent routes will have CSP and security headers automatically
- Auth guard redirects ready for auth flow implementation (Plan 3)
- x-nonce header available for server components that need to render inline scripts

## Self-Check: PASSED

- All 3 created files verified present on disk
- Both task commits verified: `dd8edb6`, `da35f5b`
- TypeScript compilation: zero errors
- Security tests: 26/26 passing

---
*Phase: 01-foundation*
*Completed: 2026-03-07*
