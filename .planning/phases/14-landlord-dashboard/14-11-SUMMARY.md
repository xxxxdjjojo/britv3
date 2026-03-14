---
phase: 14-landlord-dashboard
plan: 11
subsystem: ui
tags: [typescript, react-hook-form, zod, radix-ui, react-pdf]

# Dependency graph
requires:
  - phase: 14-landlord-dashboard
    provides: All landlord dashboard components and pages (plans 01-10)
provides:
  - Zero TypeScript errors in all landlord phase files (routes, components, services)
  - Clean pnpm build with no landlord-attributable compilation errors
affects:
  - 14-landlord-dashboard verification (LD-03, LD-10, LD-12, LD-16 unblocked)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - zodResolver cast pattern: `zodResolver(schema) as Resolver<FormData>` for z.coerce.number() compatibility with react-hook-form
    - SheetTrigger asChild cast: `SheetTriggerBase as React.ComponentType<{ asChild?: boolean; children: ReactNode }>` for Radix typing gaps
    - Safe unknown cast for Supabase JSONB: rawProperty !== null && typeof rawProperty === "object" && "key" in rawProperty guard

key-files:
  created: []
  modified:
    - src/app/(protected)/dashboard/landlord/legal/notices/page.tsx
    - src/app/(protected)/dashboard/landlord/properties/[id]/page.tsx
    - src/app/api/landlord/finance/entries/route.ts
    - src/app/api/landlord/finance/entries/[id]/route.ts
    - src/components/landlord/InventoryPdfButton.tsx
    - src/components/landlord/InventoryRoomForm.tsx
    - src/components/landlord/LandlordSidebar.tsx
    - src/components/landlord/TenantScreeningClient.tsx
    - src/app/(protected)/dashboard/landlord/properties/add/page.tsx
    - src/app/(protected)/dashboard/landlord/tools/yield-calculator/page.tsx
    - src/services/landlord/document-service.ts

key-decisions:
  - "Resolver cast pattern used for z.coerce.number() schemas — zodResolver infers unknown for coerced fields, cast to Resolver<FormData> bridges the gap without changing schema or form logic"
  - "SheetTrigger asChild typed wrapper: SheetTriggerBase as ComponentType<{asChild?:boolean}> — local UI component doesn't re-export Radix asChild prop, typed wrapper avoids modifying the component"
  - "InventoryRoomForm onValueChange cast: unknown intermediary cast required because Radix onValueChange for enum types is stricter than (val: string) => void — runtime behaviour unchanged"

patterns-established:
  - "Resolver cast: when zodResolver + z.coerce.number() causes Resolver<T> mismatch, cast the result: zodResolver(schema) as Resolver<FormData>"
  - "Radix asChild wrapper: when local Shadcn wrapper doesn't expose asChild, create typed alias: const T = Base as React.ComponentType<{ asChild?: boolean; children: ReactNode }>"

requirements-completed:
  - LD-03
  - LD-10
  - LD-12
  - LD-16

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 14 Plan 11: TypeScript Gap-Fix Summary

**11 TypeScript errors across 11 landlord files resolved mechanically — pnpm build and tsc --noEmit pass with zero landlord compilation errors**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T07:06:05Z
- **Completed:** 2026-03-14T07:11:00Z
- **Tasks:** 3 (2 fix tasks + 1 verification)
- **Files modified:** 11

## Accomplishments
- Removed spurious `notice` prop from Section8PDFDownload JSX call in notices/page.tsx
- Fixed DocumentList named import to default import in property detail page
- Fixed ZodError.errors to ZodError.issues in both finance entries API routes
- Added missing reportId to InventoryPdfButton destructured props (filename now derives correctly)
- Applied Resolver cast pattern for all z.coerce.number() zodResolver usages (notices, add-property, yield-calculator pages)
- Fixed SheetTrigger asChild type in LandlordSidebar and TenantScreeningClient via typed wrapper
- Fixed null coercion for employment_status Select in TenantScreeningClient
- Replaced unsafe inline JSONB cast with unknown-guarded safe extraction in document-service

## Task Commits

1. **Task 1: Fix five build-blocking errors** - `95051fd` (fix)
2. **Task 2: Fix six TypeScript warnings** - `ca0dcbb` (fix)
3. **Task 3: Full build verification** - no code changes, verification only

## Files Created/Modified
- `src/app/(protected)/dashboard/landlord/legal/notices/page.tsx` - Remove notice prop, add Resolver casts for both form instances
- `src/app/(protected)/dashboard/landlord/properties/[id]/page.tsx` - Default import for DocumentList
- `src/app/api/landlord/finance/entries/route.ts` - ZodError.issues fix in POST route
- `src/app/api/landlord/finance/entries/[id]/route.ts` - ZodError.issues fix in PATCH route
- `src/components/landlord/InventoryPdfButton.tsx` - reportId added to function destructuring
- `src/components/landlord/InventoryRoomForm.tsx` - onValueChange handler cast for Radix enum type
- `src/components/landlord/LandlordSidebar.tsx` - SheetTrigger typed wrapper for asChild
- `src/components/landlord/TenantScreeningClient.tsx` - SheetTrigger typed wrapper, null coalescence for employment_status
- `src/app/(protected)/dashboard/landlord/properties/add/page.tsx` - Resolver cast for zodResolver
- `src/app/(protected)/dashboard/landlord/tools/yield-calculator/page.tsx` - Resolver cast for zodResolver
- `src/services/landlord/document-service.ts` - Safe unknown-guarded JSONB cast

## Decisions Made
- Resolver cast (`zodResolver(schema) as Resolver<FormData>`) used for all z.coerce.number() schemas — avoids changing schema, keeps coercion working, satisfies TypeScript without modifying react-hook-form types
- SheetTrigger typed wrapper approach chosen over modifying the Shadcn UI component — local component change would require re-running Shadcn CLI or be overwritten on updates
- `unknown` intermediary cast for InventoryRoomForm onValueChange — direct narrowing to Radix's enum signature prevents future breakage if enum values change

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] notices/page.tsx also had Resolver type errors for two useForm instances**
- **Found during:** Task 1 (Fix five build-blocking errors)
- **Issue:** notices/page.tsx had two zodResolver mismatches (section21Schema with z.coerce and section8Schema with z.coerce) that weren't listed in the plan but would have caused compile errors
- **Fix:** Added `type Resolver` import and applied Resolver cast to both useForm resolver lines
- **Files modified:** src/app/(protected)/dashboard/landlord/legal/notices/page.tsx
- **Verification:** tsc --noEmit returns zero errors for notices/page.tsx
- **Committed in:** 95051fd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug, same Resolver cast pattern applied to an additional file not listed in the plan)
**Impact on plan:** Essential — without the notices page fix, the file would still have two Resolver errors. No scope creep.

## Issues Encountered
- None — all 11 files fixed cleanly on first attempt

## Next Phase Readiness
- All landlord phase 14 TypeScript errors resolved
- LD-03, LD-10, LD-12, LD-16 requirements unblocked
- 6 pre-existing non-landlord errors remain (tests, compare/marketplace pages, ReviewsTab) — out of scope for this plan, documented for future gap-fix

---
*Phase: 14-landlord-dashboard*
*Completed: 2026-03-14*
