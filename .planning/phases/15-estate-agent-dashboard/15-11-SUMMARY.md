---
phase: 15-estate-agent-dashboard
plan: 11
subsystem: ui
tags: [react, next-js, supabase, typescript, team-management, branches, permissions]

# Dependency graph
requires:
  - phase: 15-estate-agent-dashboard
    provides: agent types (agent.ts), DB schema for agent_team_members and agent_branches

provides:
  - Team members page with invite dialog, role assignment, branch assignment, and performance metrics
  - Roles & permissions page with 5-tier permission matrix (Switch toggles per permission per role)
  - Branch management page with CRUD dialogs and member assignment
  - agent-team-service.ts with getTeamMembers, inviteTeamMember, updateTeamMemberRole, assignMemberToBranch, removeTeamMember, getBranches, createBranch, updateBranch, deleteBranch
  - /api/agent/team route (GET/POST/PATCH/DELETE)
  - /api/agent/branches route (GET/POST/PATCH/DELETE)

affects: [16-tradesperson-dashboard, any phase using team or branch data]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component fetches members + branches in parallel via Promise.all, passes to client component
    - Base-ui Select onValueChange receives string|null — always wrap with (v) => setX(v ?? fallback)
    - Base-ui DialogTrigger and DropdownMenuTrigger do not support asChild — render Button inside Trigger without asChild
    - Permissions matrix informational in this phase — enforced via role check in service layer, persisted as JSONB custom_permissions in future

key-files:
  created:
    - src/services/agent/agent-team-service.ts
    - src/app/api/agent/team/route.ts
    - src/app/api/agent/branches/route.ts
    - src/components/dashboard/agent/team/TeamMemberList.tsx
    - src/components/dashboard/agent/team/RolesPermissions.tsx
    - src/components/dashboard/agent/team/BranchManager.tsx
    - src/app/(protected)/dashboard/agent/team/page.tsx
    - src/app/(protected)/dashboard/agent/team/roles/page.tsx
    - src/app/(protected)/dashboard/agent/team/branches/page.tsx
  modified: []

key-decisions:
  - "agent-team-service.ts recreated from worktree (absent from main branch — same recovery pattern as agent-listings-service and agent-crm-service)"
  - "Permissions matrix is informational in Phase 15 — enforced via role check in service layer; custom_permissions JSONB on agent profile available for future dynamic enforcement"
  - "PATCH /api/agent/team uses action discriminator (update_role | assign_branch) to multiplex two operations into one endpoint — established pattern from offers API"
  - "deleteBranch guards against deletion of branch with active members — returns descriptive error before hitting DB DELETE"

patterns-established:
  - "Team + branch data fetched in parallel (Promise.all) in Server Component and passed as initialProps to client"
  - "onValueChange for base-ui Select wrapped as (v) => setState(v ?? 'fallback') to handle null return"
  - "DialogTrigger/DropdownMenuTrigger do not accept asChild — Button rendered directly inside trigger element"

requirements-completed:
  - AGT-21
  - AGT-22
  - AGT-23

# Metrics
duration: 19min
completed: 2026-03-15
---

# Phase 15 Plan 11: Team & Branch Management Summary

**5-tier role permission matrix + team member invite/management grid + branch CRUD with member assignment across 3 page routes and 6 new files**

## Performance

- **Duration:** 19 min
- **Started:** 2026-03-15T14:00:11Z
- **Completed:** 2026-03-15T14:19:11Z
- **Tasks:** 2
- **Files modified:** 9 (created)

## Accomplishments
- Team members page fetches real DB data, renders responsive grid with invite dialog (email/name/role/branch), role-change dialog, branch-assign dialog, and remove-member confirmation
- Roles & permissions page shows 5-tier matrix (Admin, Senior Negotiator, Negotiator, Lettings Manager, Viewer) with per-permission Switch toggles and save action
- Branch management page provides full CRUD: add/edit branch dialogs with address/contact/head-office fields, delete (guarded for branches with active members), avatar row of assigned members, and "Assign Member" dialog

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Team Members page with invite and performance** - `6332d26` (feat)
2. **Task 2: Build Roles & Permissions and Branch Management pages** - `82ae959` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/services/agent/agent-team-service.ts` - Full team + branch service (recovered from worktree)
- `src/app/api/agent/team/route.ts` - GET/POST/PATCH/DELETE for team members
- `src/app/api/agent/branches/route.ts` - GET/POST/PATCH/DELETE for branches
- `src/components/dashboard/agent/team/TeamMemberList.tsx` - Team member grid with invite/role/branch/remove dialogs
- `src/components/dashboard/agent/team/RolesPermissions.tsx` - 5-tier permission matrix with Switch toggles
- `src/components/dashboard/agent/team/BranchManager.tsx` - Branch CRUD with member assignment
- `src/app/(protected)/dashboard/agent/team/page.tsx` - Server Component (replaces mock-data client page)
- `src/app/(protected)/dashboard/agent/team/roles/page.tsx` - Server Component
- `src/app/(protected)/dashboard/agent/team/branches/page.tsx` - Server Component

## Decisions Made
- `agent-team-service.ts` recreated from worktree (same missing-file recovery pattern as agent-listings-service and agent-crm-service in prior plans)
- PATCH /api/agent/team uses `action` discriminator field (`update_role` | `assign_branch`) — multiplexes two update operations into one endpoint, consistent with offers API pattern
- Permissions matrix is informational in Phase 15 — role-based checks enforced in service layer; custom_permissions JSONB available for future dynamic enforcement without schema changes
- `deleteBranch` pre-checks active member count before DELETE to provide a clear error rather than a DB constraint violation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Recreated missing agent-team-service.ts**
- **Found during:** Task 1
- **Issue:** `agent-team-service.ts` absent from main branch (same pattern as agent-listings-service and agent-crm-service in earlier plans)
- **Fix:** Recreated from worktree source with one addition: `deleteBranch` function (needed by BranchManager and branches API route)
- **Files modified:** `src/services/agent/agent-team-service.ts`
- **Verification:** TypeScript compiles cleanly
- **Committed in:** `6332d26` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed base-ui Select/Dialog/DropdownMenu asChild + null handler TypeScript errors**
- **Found during:** Task 1 TypeScript check
- **Issue:** base-ui Select `onValueChange` returns `string | null`, base-ui DialogTrigger and DropdownMenuTrigger don't support `asChild` prop — 7 TypeScript errors
- **Fix:** Wrapped `onValueChange` with `(v) => setState(v ?? fallback)` pattern; removed `asChild` from trigger elements
- **Files modified:** `src/components/dashboard/agent/team/TeamMemberList.tsx`
- **Verification:** `npx tsc --noEmit` produces no errors
- **Committed in:** `6332d26` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking service file recovery, 1 bug/TS error fix)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- Branch creation API route needed alongside team API route (plan only specified team route) — added `/api/agent/branches` as required infrastructure for BranchManager component

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- All three team management pages complete and TypeScript-clean
- `/api/agent/team` and `/api/agent/branches` routes ready for frontend use
- Performance metrics on team member cards show 0 (leads/viewings/deals) — will populate when agent lead and viewing data is available in Phase 16+
- Branch management ready for Phase 16 tradesperson/service integration

---
*Phase: 15-estate-agent-dashboard*
*Completed: 2026-03-15*

## Self-Check: PASSED

All 9 files exist on disk. Both task commits (6332d26, 82ae959) verified in git log.
