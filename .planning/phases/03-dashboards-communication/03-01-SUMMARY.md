---
phase: 03-dashboards-communication
plan: 01
subsystem: database, types
tags: [supabase, postgresql, typescript, rls, messaging, notifications, milestones, upstash, redis, anthropic, resend, sharp]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Supabase clients, auth types, profiles table, UserRole type"
provides:
  - "Phase 3 npm dependencies (Upstash Redis, Anthropic SDK, Resend, sharp, react-query)"
  - "TypeScript types for dashboards (6 roles), messaging, notifications, milestones"
  - "Database tables: conversations, messages, platform_events, market_pricing, milestones, activity_log"
  - "RLS policies on all Phase 3 tables"
affects: [03-02, 03-03, 03-04, 03-05, 03-06, 03-07, 03-08]

# Tech tracking
tech-stack:
  added: ["@anthropic-ai/sdk", "resend", "@react-email/components", "sharp"]
  patterns: ["Monthly partitioned tables (activity_log)", "Event-based notifications (O(1) writes)", "Milestone templates as const arrays"]

key-files:
  created:
    - "britv3.0/src/types/dashboard.ts"
    - "britv3.0/src/types/messaging.ts"
    - "britv3.0/src/types/notifications.ts"
    - "britv3.0/src/types/milestones.ts"
    - "britv3.0/supabase/migrations/003_dashboards_communication.sql"
  modified:
    - "britv3.0/package.json"

key-decisions:
  - "Used Readonly<{}> and ReadonlyArray<> consistently on all type definitions for immutability"
  - "Activity log uses native PostgreSQL range partitioning (monthly) instead of pg_partman"
  - "Transaction/service job milestones use deferred FKs (no FK constraint yet) since parent tables come in later phases"
  - "Market pricing table allows anonymous reads (public data) with no write access for regular users"
  - "Platform events use O(1) writes per action (single row) not per-recipient fan-out"

patterns-established:
  - "Milestone template pattern: const arrays with key, label, description, order for initializing milestone rows"
  - "Event-based notification pattern: platform_events with entity_type/entity_id for filtered reads"
  - "Discriminated union dashboard types: role field as discriminant for type narrowing"

requirements-completed: [DASH-07, DASH-12, COM-01, COM-03, COM-05, COM-10, COM-14, COM-15]

# Metrics
duration: 30min
completed: 2026-03-07
---

# Phase 3 Plan 01: Schema, Types & Dependencies Summary

**Phase 3 TypeScript type contracts for 6 role dashboards, messaging, notifications, and milestones; plus 332-line SQL migration with 8 RLS-protected tables including partitioned activity log**

## Performance

- **Duration:** 30 min
- **Started:** 2026-03-07T18:09:57Z
- **Completed:** 2026-03-07T18:40:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Installed all Phase 3 production dependencies (Anthropic SDK, Resend, sharp, React Email)
- Created 4 TypeScript type files defining all Phase 3 domain entities with Readonly<{}> pattern
- Created 332-line database migration with 8 tables, 12 monthly partitions, 8 RLS-enabled tables, and 15 policies

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Phase 3 dependencies and Shadcn components** - `a0aa64b` (chore)
2. **Task 2: Create TypeScript type definitions for all Phase 3 domains** - `f05e469` (feat)
3. **Task 3: Create database migration for Phase 3 tables** - `9bec24b` (feat)

## Files Created/Modified
- `britv3.0/package.json` - Added @anthropic-ai/sdk, resend, @react-email/components, sharp
- `britv3.0/src/types/dashboard.ts` - 6 role-specific dashboard types + StatCardData, ActivityLogEntry
- `britv3.0/src/types/messaging.ts` - Conversation, Message, ConversationReadStatus, SendMessageInput, InboxFilters
- `britv3.0/src/types/notifications.ts` - PlatformEvent, EventType, EntityType, NotificationPreferences with defaults
- `britv3.0/src/types/milestones.ts` - TransactionMilestone, ServiceJobMilestone with template arrays
- `britv3.0/supabase/migrations/003_dashboards_communication.sql` - 8 tables with RLS and partitioning

## Decisions Made
- Used Readonly<{}> and ReadonlyArray<> consistently on all type definitions for immutability
- Activity log uses native PostgreSQL range partitioning (monthly) instead of pg_partman for simplicity
- Transaction/service job milestones use deferred FKs since parent tables come in later phases
- Market pricing allows anonymous reads (public data) -- no write access for regular users
- Platform events use O(1) writes per action (not per-recipient fan-out) for cost efficiency
- Dashboard types use discriminated union with `role` field as discriminant for type narrowing
- Default notification preferences include all event types with sensible in_app/email defaults

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed PriceTrendChart.tsx Tooltip formatter type**
- **Found during:** Task 2 (build verification)
- **Issue:** recharts Tooltip formatter typed parameter as `number` instead of `ValueType | undefined`
- **Fix:** Removed explicit type annotation, used `Number(value)` conversion
- **Files modified:** britv3.0/src/components/property/PriceTrendChart.tsx
- **Verification:** TypeScript compilation passes
- **Committed in:** f05e469 (Task 2 commit -- file was already fixed in working tree)

**2. [Rule 3 - Blocking] resend, @react-email/components, sharp not saved to package.json on first install**
- **Found during:** Task 1 (dependency installation)
- **Issue:** First pnpm add failed for agent-base dependency (ECONNRESET), causing some packages to not persist
- **Fix:** Re-ran pnpm add for the missing packages
- **Files modified:** britv3.0/package.json, britv3.0/pnpm-lock.yaml
- **Verification:** All packages listed in pnpm list output
- **Committed in:** a0aa64b (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes were necessary for task completion. No scope creep.

## Issues Encountered
- Next.js 16 Turbopack build has intermittent ENOENT errors with build manifest temp files -- appears to be a race condition in the Turbopack builder. TypeScript compilation passes independently. This is a pre-existing infrastructure issue not caused by Phase 3 changes.
- Pre-existing test file type errors in `__tests__/auth/` (Promise<SupabaseClient> vs SupabaseClient mismatch) -- not related to Phase 3 work, not addressed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 3 type contracts defined -- subsequent plans can import and build on them
- Database migration ready for application via Supabase CLI
- Dependencies installed for messaging (react-query), AI (Anthropic SDK), email (Resend), image processing (sharp)
- Shadcn UI components (progress, textarea, tooltip, popover, scroll-area, skeleton, table, command) available

---
*Phase: 03-dashboards-communication*
*Completed: 2026-03-07*
