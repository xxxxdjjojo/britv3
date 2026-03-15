---
phase: 15
plan: 07
subsystem: estate-agent-dashboard
tags: [kanban, dnd-kit, leads, crm, pipeline]
key-files:
  created:
    - src/app/(protected)/dashboard/agent/leads/page.tsx
    - src/app/(protected)/dashboard/agent/leads/[id]/page.tsx
    - src/components/dashboard/agent/leads/LeadCard.tsx
    - src/components/dashboard/agent/leads/LeadPipelineKanban.tsx
    - src/components/dashboard/agent/leads/LeadDetailTimeline.tsx
    - src/app/api/agent/leads/activities/route.ts
  modified:
    - src/components/dashboard/agent/leads/LeadPipelineKanban.tsx
decisions:
  - Used base-ui Select onValueChange signature (string | null) correctly in LeadDetailTimeline handlers
  - DroppableColumn as inner component wrapping useDroppable for clean column drop targets
  - Optimistic updates on drag-end with revert-on-error pattern
  - DialogTrigger uses render prop (not asChild) for base-ui compatibility
  - Activities API route added to support note creation from detail timeline
metrics:
  completed: 2026-03-15
---

# Phase 15 Plan 07: Agent Lead Pipeline Kanban and Detail Pages Summary

**One-liner:** Drag-and-drop Kanban CRM pipeline with 5 stage columns, sortable lead cards, and a detail page with activity timeline and inline stage/assignment controls using @dnd-kit/core + @dnd-kit/sortable.

## What Was Built

### Pages
- `leads/page.tsx` — Server Component: fetches real leads via `getAgentLeads`, groups by stage, renders `<LeadPipelineKanban>`
- `leads/[id]/page.tsx` — Server Component: fetches lead + activities + team members in parallel, renders `<LeadDetailTimeline>`

### Components
- `LeadCard` — useSortable drag handle; anchor navigation blocked during drag via isDragging guard
- `LeadPipelineKanban` — DndContext with 5 DroppableColumn targets, optimistic stage updates via PATCH /api/agent/leads, search filter, Add Lead dialog (POST /api/agent/leads)
- `LeadDetailTimeline` — Two-column layout: activity timeline with icon-typed entries + add-note form (left); contact info, stage Select, assigned-to Select, action buttons (right)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed base-ui Select onValueChange null type**
- **Found during:** TypeScript check
- **Issue:** base-ui Select passes `string | null` to onValueChange, not plain `string`
- **Fix:** Updated `handleStageChange` and `handleAssignedToChange` signatures to accept `string | null`
- **Files modified:** `LeadDetailTimeline.tsx`

**2. [Rule 1 - Bug] Fixed DialogTrigger asChild incompatibility in LeadPipelineKanban**
- **Found during:** TypeScript check (2026-03-15 re-run)
- **Issue:** base-ui DialogTrigger.Props doesn't include `asChild`; the `Button` was nested inside `DialogTrigger asChild`
- **Fix:** Changed to `DialogTrigger render={<Button />}` pattern
- **Files modified:** `LeadPipelineKanban.tsx`
- **Commit:** 3faf8d9

**3. [Rule 2 - Missing] Fixed Select onValueChange type in LeadPipelineKanban source select**
- **Found during:** TypeScript check (2026-03-15 re-run)
- **Issue:** `setAddLeadSource` (Dispatch<SetStateAction<string>>) incompatible with base-ui `(value: string | null) => void` signature
- **Fix:** Wrapped in arrow function `(v) => setAddLeadSource(v ?? "")`
- **Files modified:** `LeadPipelineKanban.tsx`
- **Commit:** 3faf8d9

**4. [Rule 2 - Missing] Added POST /api/agent/leads/activities route**
- **Found during:** Code review of LeadDetailTimeline
- **Issue:** `LeadDetailTimeline` called `/api/agent/leads/activities` POST but route didn't exist
- **Fix:** Created `src/app/api/agent/leads/activities/route.ts` with auth guard and lead ownership check
- **Files modified:** `src/app/api/agent/leads/activities/route.ts` (new)
- **Commit:** 3faf8d9

## Self-Check

- [x] `src/app/(protected)/dashboard/agent/leads/page.tsx` — exists
- [x] `src/app/(protected)/dashboard/agent/leads/[id]/page.tsx` — exists
- [x] `src/components/dashboard/agent/leads/LeadCard.tsx` — exists
- [x] `src/components/dashboard/agent/leads/LeadPipelineKanban.tsx` — exists
- [x] `src/components/dashboard/agent/leads/LeadDetailTimeline.tsx` — exists
- [x] `src/app/api/agent/leads/activities/route.ts` — exists
- [x] Commit 2f2ee91 — original implementation
- [x] Commit 3faf8d9 — fixes and activities route

## Self-Check: PASSED
