---
phase: 07-production-readiness
plan: "06"
subsystem: help-support-mobile-nav
tags: [help-page, faq, contact-form, rate-limiting, email, mobile-nav, bottom-tab-bar]
dependency_graph:
  requires: ["07-03"]
  provides: [help-page, contact-api, bottom-tab-bar]
  affects: [protected-layout, mobile-ux]
tech_stack:
  added: []
  patterns:
    - base-ui Accordion for expandable FAQ sections
    - Upstash sliding-window rate limiter (3/hr) for contact form
    - Resend for contact email dispatch with graceful degradation
    - next/dynamic with ssr:false wrapped in client component for Server Component compatibility
key_files:
  created:
    - britv3.0/src/content/help-faq.ts
    - britv3.0/src/app/(main)/help/page.tsx
    - britv3.0/src/app/(main)/contact/page.tsx
    - britv3.0/src/app/api/contact/route.ts
    - britv3.0/src/app/api/contact/route.test.ts
    - britv3.0/src/components/mobile/BottomTabBar.tsx
    - britv3.0/src/components/mobile/BottomTabBarWrapper.tsx
  modified:
    - britv3.0/src/app/(protected)/layout.tsx
decisions:
  - "BottomTabBarWrapper client component wraps dynamic(ssr:false) to avoid Next.js 16 Turbopack restriction on ssr:false in Server Components"
  - "FAQ content stored as TypeScript arrays in src/content/help-faq.ts (not MDX) for simplicity and tree-shaking"
  - "Contact route returns 200 with success:true when RESEND_API_KEY missing to avoid exposing infrastructure info"
  - "vi.hoisted() used in test file to allow mock functions declared before vi.mock() factory executes"
  - "MockResend uses ES class syntax in vi.mock factory to satisfy new Resend() constructor call"
metrics:
  duration: "20 min"
  completed_date: "2026-03-07"
  tasks_completed: 2
  files_changed: 8
---

# Phase 07 Plan 06: Help Page, Contact Form, and Mobile Bottom Tab Bar Summary

**One-liner:** FAQ accordion help center, rate-limited contact form via Resend, and role-specific mobile bottom tab bar with 5 tabs per role.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Help page, contact form, and API route with rate limiting | c400731 | Done |
| 2 | Role-specific mobile bottom tab bar | 8ff722f | Done |

## What Was Built

### Task 1: Help Page, Contact Form, and Rate-Limited Email API

**`src/content/help-faq.ts`** — 6 FAQ sections with 24 Q&A pairs covering Account & Registration, Property Search, Service Providers, Messaging, Landlord Tools, and Payments & Billing. Exported as typed `FAQ_SECTIONS` array.

**`src/app/(main)/help/page.tsx`** — Server component help center using base-ui `Accordion.Root/Item/Header/Trigger/Panel`. Each FAQ section has a heading + accordion. CTA at bottom links to `/contact`.

**`src/app/api/contact/route.ts`** — POST endpoint with:
- Zod validation: name (min 2), email (valid), subject (min 5), message (min 20, max 2000)
- Upstash `createRateLimiter(3, "1 h")` — 3 requests per hour per IP from `x-forwarded-for`
- Resend email dispatch to `SUPPORT_EMAIL` env var with inline HTML template
- Graceful degradation: returns 200 even if `RESEND_API_KEY` not set

**`src/app/(main)/contact/page.tsx`** — Client component form with:
- Client-side validation matching Zod schema
- Success / error / rate-limited state display
- Character counter for message field
- Fetch-based form submission to `/api/contact`

**Tests (`route.test.ts`):** 11 tests covering valid submission, missing fields, invalid email, message length bounds, rate limiting, email call verification, and graceful degradation.

### Task 2: Role-Specific Mobile Bottom Tab Bar

**`src/components/mobile/BottomTabBar.tsx`** — Client component with:
- `TAB_CONFIG: Record<UserRole, TabItem[]>` — 5 tabs per role
  - homebuyer: Search, Saved, Viewings, Messages, Profile
  - renter: Search, Saved, Applications, Messages, Profile
  - seller: Listings, Viewings, Offers, Messages, Profile
  - landlord: Portfolio, Tenants, Maintenance, Messages, Profile
  - agent: Listings, Leads, Viewings, Messages, Profile
  - service_provider: Jobs, Quotes, Calendar, Messages, Profile
- `useRole()` hook for active role, `usePathname()` for active tab
- Fixed bottom-0, h-16, `md:hidden`, `pb-safe` for iOS safe area

**`src/components/mobile/BottomTabBarWrapper.tsx`** — Client component that wraps `dynamic(ssr:false)` to satisfy Next.js 16 Turbopack restriction (cannot use `ssr:false` in Server Components).

**`src/(protected)/layout.tsx`** — Updated to import `BottomTabBarWrapper`, wraps `{children}` in `<main className="pb-16 md:pb-0">` to prevent content hiding under tab bar.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] vi.hoisted() required for test mock references**
- **Found during:** Task 1 RED phase
- **Issue:** `mockRateLimitFn` referenced in `vi.mock()` factory before variable declaration due to hoisting
- **Fix:** Switched to `vi.hoisted()` to declare mock functions before module evaluation
- **Files modified:** `src/app/api/contact/route.test.ts`
- **Commit:** c400731

**2. [Rule 1 - Bug] vi.mock Resend needs class syntax for constructor compatibility**
- **Found during:** Task 1 GREEN phase
- **Issue:** `vi.fn().mockImplementation(...)` is not a constructor; `new Resend()` throws TypeError
- **Fix:** Used `class MockResend { emails = { send: mockEmailSend } }` inside factory
- **Files modified:** `src/app/api/contact/route.test.ts`
- **Commit:** c400731

**3. [Rule 3 - Blocking] next/dynamic with ssr:false not allowed in Server Components**
- **Found during:** Task 2 build verification
- **Issue:** Next.js 16 Turbopack throws build error when `dynamic(..., { ssr: false })` used in a Server Component
- **Fix:** Created `BottomTabBarWrapper` as a `"use client"` wrapper that performs the dynamic import
- **Files modified:** `src/components/mobile/BottomTabBarWrapper.tsx`, `src/app/(protected)/layout.tsx`
- **Commit:** 8ff722f

**4. [Pre-existing] Intermittent Turbopack build race condition**
- **Found during:** Task 2 build verification
- **Issue:** Next.js 16 Turbopack sometimes writes `.next/browser/default-stylesheet.css` after page data collection reads it (race condition)
- **Scope:** Pre-existing (confirmed by baseline build test -- happens on same routes with unmodified code)
- **Resolution:** Out of scope; deferred. Build succeeds on retry.

## Self-Check: PASSED

All created files confirmed present. All commits (4761cd5, c400731, 8ff722f) verified in git history. Build passing (pnpm build exit 0).
