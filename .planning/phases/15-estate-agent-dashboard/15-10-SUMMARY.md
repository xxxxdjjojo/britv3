---
phase: 15-estate-agent-dashboard
plan: 10
subsystem: ui
tags: [react-table, tanstack, crm, client-management, supabase, shadcn]

requires:
  - phase: 15-estate-agent-dashboard
    plan: 04
    provides: agent-crm-service types and API (was missing from main branch — recreated)
provides:
  - src/services/agent/agent-crm-service.ts
  - src/app/api/agent/crm/route.ts
  - src/app/(protected)/dashboard/agent/crm/page.tsx
  - src/components/dashboard/agent/crm/ClientList.tsx
  - src/app/(protected)/dashboard/agent/crm/[id]/page.tsx
  - src/components/dashboard/agent/crm/ClientProfile.tsx
affects: [estate-agent-dashboard, crm-workflows]

tech-stack:
  added: []
  patterns:
    - "@tanstack/react-table with manual pagination and server-side search/filter"
    - "Debounced search input calling /api/agent/crm with query params"
    - "Row selection checkboxes with bulk-action toolbar (email/tag)"
    - "Server component fetches first page; client component handles all subsequent fetches"
    - "Graceful fallback: communication/properties/transactions queries wrapped in try/catch"

key-files:
  created:
    - src/services/agent/agent-crm-service.ts
    - src/app/api/agent/crm/route.ts
    - src/app/(protected)/dashboard/agent/crm/page.tsx
    - src/components/dashboard/agent/crm/ClientList.tsx
    - src/app/(protected)/dashboard/agent/crm/[id]/page.tsx
    - src/components/dashboard/agent/crm/ClientProfile.tsx
  modified: []

key-decisions:
  - "agent-crm-service.ts recreated from scratch (15-04 built it but it was absent from main branch, same pattern as agent-listings-service)"
  - "ilike text search uses OR across name/email/phone/notes in a single Supabase query"
  - "Record<string, unknown> payload type used for update to handle dynamic last_contact_at injection without TS conflict"
  - "Supabase profiles join returns array in msgData — accessed as m.profiles?.[0]?.full_name"
  - "Graceful fallback on all related-data queries (messages, properties, transactions) — tables may not exist in all environments"

patterns-established:
  - "CRM service: ilike OR search pattern for multi-field text search"
  - "ClientList: tanstack/react-table with manual server-side pagination (offset-based, 25/page)"

requirements-completed:
  - AGT-19
  - AGT-20

duration: ~35min
completed: "2026-03-15"
---

# Phase 15 Plan 10: CRM Client List and Client Profile Summary

**CRM module with @tanstack/react-table client list (search/filter/sort/bulk actions) and a 4-tab client profile page (overview, properties, communication, transactions)**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-03-15T10:15:00Z
- **Completed:** 2026-03-15T10:53:55Z
- **Tasks:** 2
- **Files modified:** 6 created

## Accomplishments

- CRM service module with paginated search/filter CRUD across name/email/phone/notes
- Full REST API (GET/POST/PATCH/DELETE) at `/api/agent/crm`
- Client list with @tanstack/react-table: debounced search, multi-select type filter, column sorting, cursor pagination, row selection checkboxes, bulk email and tag actions, Add Client dialog
- Client profile with 4 tabs: contact details edit, property links, communication timeline, transaction history

## Task Commits

1. **Task 1: CRM Client List page** — `0b8bb78` (feat)
2. **Task 2: CRM Client Profile page** — `77fd1d5` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/services/agent/agent-crm-service.ts` — CRM CRUD service with paginated ilike search and auto-bump of last_contact_at
- `src/app/api/agent/crm/route.ts` — GET/POST/PATCH/DELETE REST endpoint for CRM clients
- `src/app/(protected)/dashboard/agent/crm/page.tsx` — Server component page with initial data fetch and summary stat cards
- `src/components/dashboard/agent/crm/ClientList.tsx` — react-table client list with search/filter/bulk actions/pagination
- `src/app/(protected)/dashboard/agent/crm/[id]/page.tsx` — Server component fetching client + related data (messages, properties, transactions)
- `src/components/dashboard/agent/crm/ClientProfile.tsx` — Tabbed client profile with inline edit, notes auto-save, linked data tabs

## Decisions Made

- `agent-crm-service.ts` was absent from the main branch (same as `agent-listings-service` in a prior plan). Recreated from the 15-04 SUMMARY description as a Rule 3 blocking fix.
- `ilike` OR search uses a single `.or()` call across four columns — avoids N+1 filter queries.
- `Record<string, unknown>` cast on update payload resolves TypeScript conflict between `UpdateCrmClientInput` and the dynamically injected `last_contact_at` field.
- Supabase foreign-key join returns `profiles` as an array even for single-row joins; accessed via `m.profiles?.[0]`.
- All related-data fetches (communication, properties, transactions) wrapped in individual `try/catch` blocks with empty fallbacks — avoids page 500 errors in environments where tables don't exist yet.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Recreated missing agent-crm-service.ts**
- **Found during:** Task 1 setup
- **Issue:** `agent-crm-service.ts` referenced in the plan's `<context>` block did not exist on the main branch. Without it the page and API route could not compile.
- **Fix:** Authored `agent-crm-service.ts` from the service description in 15-04-SUMMARY.md and the type definitions in `agent.ts`. Also created `/api/agent/crm/route.ts` as a prerequisite.
- **Files modified:** `src/services/agent/agent-crm-service.ts`, `src/app/api/agent/crm/route.ts`
- **Verification:** `npx tsc --noEmit` reports zero errors for CRM files.
- **Committed in:** `0b8bb78` (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required prerequisite; no scope creep.

## Issues Encountered

- TypeScript: `UpdateCrmClientInput` type didn't accommodate `last_contact_at` injection — fixed with `Record<string, unknown>` cast on update payload.
- TypeScript: Supabase joined `profiles` returned as `{ full_name }[]` (array), not a single object — fixed by accessing `m.profiles?.[0]`.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- CRM client list and profile pages are fully wired to the Supabase backend.
- The `agent_crm_clients` table must exist in Supabase for data to appear (created by 15-01 migration).
- Communication tab requires `conversation_participants` and `messages` tables (Phase 9 comms feature).
- Properties tab requires `property_enquiries` or `properties` tables with `user_id` FK.

---
*Phase: 15-estate-agent-dashboard*
*Completed: 2026-03-15*
