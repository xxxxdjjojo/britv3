---
phase: 15
plan: 02
subsystem: estate-agent-dashboard
tags: [services, api-routes, leads, listings, kpis]
key-files:
  created:
    - src/types/agent.ts
    - src/services/agent/agent-dashboard-service.ts
    - src/services/agent/agent-listings-service.ts
    - src/services/agent/agent-lead-service.ts
    - src/app/api/agent/dashboard/route.ts
    - src/app/api/agent/leads/route.ts
decisions:
  - Copied agent.ts from britv3.0/src/types to src/types (correct app location at worktree root)
  - listings table queried by user_id not agent_id per existing DB schema
  - getListingAnalytics falls back to zero-value struct if listing_analytics_events_agent table absent
metrics:
  completed: "2026-03-14"
---

# Phase 15 Plan 02: Agent Dashboard Service Layer Summary

Service layer and REST API routes for the estate agent dashboard: KPI aggregation via Supabase RPC, cursor-paginated listings CRUD (using user_id ownership), and a full lead CRM with stage pipeline, assignment, and activity audit trail.

## Files Created

| File | Purpose |
|------|---------|
| `src/services/agent/agent-dashboard-service.ts` | KPI fetch via RPC, activity feed, performance score |
| `src/services/agent/agent-listings-service.ts` | Listings CRUD with cursor pagination and analytics |
| `src/services/agent/agent-lead-service.ts` | Lead CRM: create, stage update, assignment, activity log |
| `src/app/api/agent/dashboard/route.ts` | GET KPIs + PATCH agency profile |
| `src/app/api/agent/leads/route.ts` | GET leads, POST create, PATCH stage/assign |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] agent.ts not in app src/types**
- **Found during:** All tasks (path alias `@/types/agent` resolves to worktree root src/)
- **Issue:** Task 1 placed `agent.ts` in `britv3.0/src/types/` but the actual Next.js app root is the worktree root, so `@/types/agent` could not resolve
- **Fix:** Copied `agent.ts` to `src/types/agent.ts` at the correct app root
- **Files modified:** `src/types/agent.ts` (created)

## Self-Check: PASSED

- `src/services/agent/agent-dashboard-service.ts` — exists
- `src/services/agent/agent-listings-service.ts` — exists
- `src/services/agent/agent-lead-service.ts` — exists
- `src/app/api/agent/dashboard/route.ts` — exists
- `src/app/api/agent/leads/route.ts` — exists
- `npx tsc --noEmit` — no errors in new files
