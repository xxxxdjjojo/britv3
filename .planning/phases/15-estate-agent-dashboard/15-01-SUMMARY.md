---
phase: 15-estate-agent-dashboard
plan: "01"
subsystem: database
tags: [supabase, postgresql, rls, typescript, zod, agent, estate-agent]

# Dependency graph
requires:
  - phase: 08-db-foundation-security
    provides: profiles, listings, auth.users base tables and migration patterns
  - phase: 14-landlord-dashboard
    provides: landlord migration patterns for RLS policies and trigger functions
provides:
  - 15 agent-specific database tables with full RLS
  - get_agent_dashboard_kpis RPC function
  - Complete TypeScript type definitions for agent domain
  - Zod validation schemas for all agent create/update operations
affects:
  - 15-02 through 15-11 (all subsequent agent dashboard plans)
  - Phase 10 (buyer viewing booking flow — needs agent_viewing_slots rows)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "agent_branches created before agent_team_members to satisfy FK reference ordering"
    - "SECURITY DEFINER RPC for cross-table KPI aggregation (same pattern as landlord KPI RPC)"
    - "z.record(z.string(), z.unknown()) for Zod v4 JSONB fields (v4 requires two args)"
    - "Zod v4 enum arrays reuse existing LEAD_STAGES const arrays via z.enum(LEAD_STAGES)"

key-files:
  created:
    - supabase/migrations/20260313_agent_dashboard.sql
    - src/types/agent.ts
  modified: []

key-decisions:
  - "agent_branches table placed before agent_team_members in DDL so the FK from team_members.branch_id can resolve at creation time"
  - "get_agent_dashboard_kpis uses SECURITY DEFINER so cross-table joins (listings, agent_leads, agent_viewing_slots, agent_offers) are not blocked by individual table RLS"
  - "Zod v4 requires z.record(z.string(), z.unknown()) not z.record(z.unknown()) — applied to solicitor_details and preferences schemas"
  - "All monetary fields are number (TypeScript) matching BIGINT (SQL) — pence-based values, no DECIMAL"

patterns-established:
  - "Pattern: Team-member RLS subquery — agent_leads, agent_offers use subselect on agent_team_members to allow active team members to access their agent's rows"
  - "Pattern: Cascade on agent_id FK to auth.users — deleting an agent cascades removal of all their operational data"
  - "Pattern: Agent ownership policy — four policies per table (select/insert/update/delete) with agent_id = auth.uid()"

requirements-completed:
  - AGT-01
  - AGT-02
  - AGT-03
  - AGT-04
  - AGT-05
  - AGT-06
  - AGT-07
  - AGT-08
  - AGT-09
  - AGT-10
  - AGT-11
  - AGT-12
  - AGT-13
  - AGT-14
  - AGT-15
  - AGT-16
  - AGT-17
  - AGT-18
  - AGT-19
  - AGT-20
  - AGT-21
  - AGT-22
  - AGT-23
  - AGT-24
  - AGT-25
  - AGT-26
  - AGT-27
  - AGT-28
  - AGT-29
  - AGT-30
  - AGT-31
  - AGT-32

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 15 Plan 01: Agent Dashboard DB Schema and TypeScript Types Summary

**15 agent tables with RLS, KPI aggregation RPC, and Zod-validated TypeScript types covering the full estate agent domain**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T17:54:05Z
- **Completed:** 2026-03-14T17:58:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `supabase/migrations/20260313_agent_dashboard.sql` with 15 tables, 57 RLS policies, all CHECK constraints, composite indexes, and `get_agent_dashboard_kpis` RPC
- Created `src/types/agent.ts` with 15 row types, 12 enum const arrays, 7 Zod schemas, AgentDashboardKpis type, and all create/update input types
- Full pnpm build passes with zero new errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Supabase migration for agent dashboard tables** - `85c76e4` (feat)
2. **Task 2: Create TypeScript type definitions for agent domain** - `6f8d659` (feat)

## Files Created/Modified

- `supabase/migrations/20260313_agent_dashboard.sql` — 15 tables: agent_agency_profiles, agent_leads, agent_lead_activities, agent_offers, agent_offer_history, agent_sale_progressions, agent_commissions, agent_branches, agent_team_members, agent_crm_clients, agent_viewing_slots, agent_viewing_feedback, agent_api_keys, agent_feed_integrations, agent_vendor_reports; 57 RLS policies; KPI RPC
- `src/types/agent.ts` — Row types, enum consts, union types, input types, Zod schemas for all agent domain entities

## Decisions Made

- `agent_branches` placed before `agent_team_members` in DDL so the FK from `team_members.branch_id` resolves at creation time
- `get_agent_dashboard_kpis` uses `SECURITY DEFINER` (same pattern as landlord KPI RPC) to allow cross-table aggregation without RLS blocking
- Zod v4 `z.record()` requires two arguments; used `z.record(z.string(), z.unknown())` for JSONB fields

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Zod v4 breaking change: `z.record(z.unknown())` in Zod v4 expects two arguments. Fixed by using `z.record(z.string(), z.unknown())` — caught during TypeScript verification and fixed inline before commit.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 15 agent tables ready; subsequent plans (15-02 through 15-11) can import types from `src/types/agent.ts` and write queries against the migration schema
- `agent_viewing_slots` table is available for Phase 10 buyer booking flow
- KPI RPC is deployed and ready for the dashboard home page plan

---
*Phase: 15-estate-agent-dashboard*
*Completed: 2026-03-14*
