---
phase: 01-foundation
plan: 07
subsystem: auth
tags: [multi-role, dashboard, sidebar, role-switcher, verification-levels, supabase, react]

# Dependency graph
requires:
  - phase: 01-foundation/01-04
    provides: Auth pages, useAuth hook, auth-service
  - phase: 01-foundation/01-06
    provides: Layout shell, Header, Footer, MobileNav, Shadcn UI components
provides:
  - Multi-role selection service (selectRoles, switchRole, getUserRoles, getActiveRole)
  - Verification level computation (computeVerificationLevel)
  - useRole client hook for role state management
  - RoleSelector component for post-registration role selection
  - OnboardingFlow component for role-specific onboarding
  - RoleSwitcher dropdown component
  - Sidebar with role-specific navigation for all 6 roles
  - Dashboard shell with redirect to role-specific view
  - 6 role-specific dashboard pages with metric cards
affects: [properties, marketplace, dashboard-features, transactions]

# Tech tracking
tech-stack:
  added: []
  patterns: [role-specific-nav-config, metric-card-pattern, collapsible-sidebar]

key-files:
  created:
    - britv3.0/src/services/auth/role-service.ts
    - britv3.0/src/hooks/useRole.ts
    - britv3.0/src/components/auth/RoleSelector.tsx
    - britv3.0/src/components/auth/OnboardingFlow.tsx
    - britv3.0/src/components/layout/RoleSwitcher.tsx
    - britv3.0/src/components/layout/Sidebar.tsx
    - britv3.0/src/app/(auth)/register/role-select/page.tsx
    - britv3.0/src/app/(auth)/register/onboarding/[role]/page.tsx
    - britv3.0/src/app/(protected)/dashboard/layout.tsx
    - britv3.0/src/app/(protected)/dashboard/page.tsx
    - britv3.0/src/app/(protected)/dashboard/[role]/layout.tsx
    - britv3.0/src/app/(protected)/dashboard/[role]/page.tsx
  modified:
    - britv3.0/src/app/(protected)/layout.tsx
    - britv3.0/src/app/(protected)/settings/privacy/page.tsx

key-decisions:
  - "Role service uses server Supabase client for selectRoles/switchRole (secure), useRole hook uses browser client for real-time state"
  - "Sidebar nav items defined as typed config object per role (ROLE_NAV_ITEMS) for easy extension"
  - "Protected layout simplified to fragment-only (auth check) to avoid conflicting flex wrappers with dashboard layout"
  - "OnboardingFlow forms are skeletal -- save logic deferred to later phases when preference tables exist"

patterns-established:
  - "Role-specific config pattern: Record<UserRole, T[]> for nav items, metric cards, onboarding fields"
  - "Dashboard redirect pattern: /dashboard -> /dashboard/{active_role} via server component"
  - "Role validation pattern: layout.tsx validates role param exists in user_roles before rendering children"

requirements-completed: [AUTH-07, AUTH-08, AUTH-09, AUTH-10]

# Metrics
duration: 16min
completed: 2026-03-07
---

# Phase 1 Plan 7: Multi-Role System Summary

**Multi-role selection with 6 dashboard shells, role switcher, collapsible sidebar, and verification level computation**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-07T17:19:16Z
- **Completed:** 2026-03-07T17:35:25Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Role service with selectRoles, switchRole, getUserRoles, getActiveRole, and computeVerificationLevel
- Post-registration role selection UI at /register/role-select with 6 toggleable role cards
- Role-specific onboarding flow at /register/onboarding/[role] with skip option
- Dashboard shells for all 6 roles with role-specific metric cards and empty states
- Collapsible sidebar with role-specific navigation items
- RoleSwitcher dropdown for switching between user's roles
- 19 tests passing (role-select, role-switch, verification-levels, dashboard shell)

## Task Commits

Each task was committed atomically:

1. **Task 1: Role service, role hook, and role selection UI** - `1e207aa` (test) + `61f7057` (feat) [TDD]
2. **Task 2: Dashboard shells with role-specific sidebars and role switcher** - `ba680d5` (feat)

## Files Created/Modified
- `britv3.0/src/services/auth/role-service.ts` - Role CRUD operations and verification level computation
- `britv3.0/src/hooks/useRole.ts` - Client-side role state hook
- `britv3.0/src/components/auth/RoleSelector.tsx` - Multi-role selection card grid
- `britv3.0/src/components/auth/OnboardingFlow.tsx` - Role-specific onboarding forms
- `britv3.0/src/components/layout/RoleSwitcher.tsx` - Role switching dropdown
- `britv3.0/src/components/layout/Sidebar.tsx` - Collapsible sidebar with role-specific nav
- `britv3.0/src/app/(auth)/register/role-select/page.tsx` - Role selection page
- `britv3.0/src/app/(auth)/register/onboarding/[role]/page.tsx` - Dynamic onboarding page
- `britv3.0/src/app/(protected)/dashboard/layout.tsx` - Dashboard flex layout with sidebar
- `britv3.0/src/app/(protected)/dashboard/page.tsx` - Dashboard redirect to active role
- `britv3.0/src/app/(protected)/dashboard/[role]/layout.tsx` - Role validation layout
- `britv3.0/src/app/(protected)/dashboard/[role]/page.tsx` - Role dashboard with metrics
- `britv3.0/src/app/(protected)/layout.tsx` - Simplified to auth-only check
- `britv3.0/src/app/(protected)/settings/privacy/page.tsx` - Fixed asChild -> render prop
- `britv3.0/src/__tests__/auth/role-select.test.ts` - 3 tests for selectRoles
- `britv3.0/src/__tests__/auth/role-switch.test.ts` - 4 tests for switchRole/getUserRoles/getActiveRole
- `britv3.0/src/__tests__/auth/verification-levels.test.ts` - 8 tests for computeVerificationLevel
- `britv3.0/src/__tests__/dashboard/shell.test.ts` - 4 tests for dashboard configuration

## Decisions Made
- Role service uses server Supabase client for selectRoles/switchRole (secure), useRole hook uses browser client for real-time state
- Sidebar nav items defined as typed Record<UserRole, NavItem[]> config for easy extension in future phases
- Protected layout simplified to fragment-only wrapper to avoid conflicting flex layouts with dashboard
- OnboardingFlow forms are skeletal -- preference saving deferred to later phases when tables exist

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing asChild prop in settings/privacy page**
- **Found during:** Task 2 (build verification)
- **Issue:** `settings/privacy/page.tsx` used Radix-style `asChild` on DialogTrigger, but Base UI uses `render` prop
- **Fix:** Changed `<DialogTrigger asChild>` to `<DialogTrigger render={<Button ... />}>`
- **Files modified:** `britv3.0/src/app/(protected)/settings/privacy/page.tsx`
- **Verification:** `pnpm build` passes
- **Committed in:** ba680d5 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Pre-existing issue unrelated to plan scope. Fix required for build to pass.

## Issues Encountered
- Vitest `vi.mock` hoisting prevented direct use of `createMockSupabaseClient()` in mock factory. Solved by creating mock outside factory and using `vi.mocked(createClient).mockResolvedValue()` in beforeEach.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Multi-role system complete: role selection, switching, verification levels
- 6 dashboard shells ready for feature population in later phases
- Sidebar nav structure ready for deep-linking as features are built
- OnboardingFlow ready for real preference saving when DB tables exist

---
*Phase: 01-foundation*
*Completed: 2026-03-07*
