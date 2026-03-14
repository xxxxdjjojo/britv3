---
phase: 15-estate-agent-dashboard
plan: 03
subsystem: api
tags: [supabase, typescript, services, viewings, offers, sale-progression, conveyancing]

# Dependency graph
requires:
  - phase: 15-01
    provides: agent.ts type definitions — AgentViewingSlot, AgentOffer, AgentSaleProgression, SALE_STAGES

provides:
  - agent-viewing-service.ts — viewing slot CRUD with booking protection and feedback collection
  - agent-offer-service.ts — offer lifecycle with status transitions, counter-offer, and audit trail
  - agent-sale-service.ts — 8-stage UK conveyancing Kanban with ALLOWED_TRANSITIONS enforcement
  - GET/POST/DELETE /api/agent/viewings — viewing slot management API
  - GET/POST/PATCH /api/agent/offers — offer management API including counter-offer action

affects: [15-04, 15-05, 15-06, phase-10-buyer-dashboard, viewing-booking-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ALLOWED_TRANSITIONS map enforces valid stage progression (forward-one or back-one)
    - Offer acceptance automatically triggers createSaleProgression via service-to-service call
    - Audit trail inserted in agent_offer_history on every status change
    - API PATCH routes use action discriminator field to route update_status vs counter logic

key-files:
  created:
    - src/services/agent/agent-viewing-service.ts
    - src/services/agent/agent-offer-service.ts
    - src/services/agent/agent-sale-service.ts
    - src/app/api/agent/viewings/route.ts
    - src/app/api/agent/offers/route.ts

key-decisions:
  - "ALLOWED_TRANSITIONS map defines forward-one and back-one transitions per stage — skipping stages throws an error with descriptive message"
  - "createSaleProgression called inside updateOfferStatus (not the API route) — keeps acceptance logic in service layer, not HTTP layer"
  - "Sale progression creation failure after offer acceptance is logged but non-fatal — offer status change is committed regardless"
  - "PATCH /api/agent/offers uses action field (update_status | counter) to multiplex two operations into one endpoint"

patterns-established:
  - "Stage transition validation: fetch current stage, lookup in ALLOWED_TRANSITIONS map, throw descriptive error on violation"
  - "Audit trail pattern: every status mutation inserts into history table with previous_status, new_status, actor_id, note"
  - "Booking protection: fetch is_booked before update/delete, throw error if already booked"

requirements-completed: [AGT-12, AGT-13, AGT-14, AGT-15, AGT-16]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 15 Plan 03: Viewing, Offer, and Sale Progression Services Summary

**Viewing slot CRUD with booking protection, offer negotiation with full audit trail, and 8-stage UK conveyancing pipeline with ALLOWED_TRANSITIONS enforcement — 3 services + 2 API routes**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T18:01:15Z
- **Completed:** 2026-03-14T18:05:27Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Viewing slots: create/update/delete with booked-slot protection; feedback collection with interest/price/likelihood fields
- Offer pipeline: create at pending, accept/reject/counter/withdraw with automatic audit trail entries in agent_offer_history
- Sale progression: 8-stage UK conveyancing Kanban (offer_accepted → memorandum_of_sale → ... → completion) with ALLOWED_TRANSITIONS preventing stage skipping
- Offer acceptance auto-triggers createSaleProgression to initialize the conveyancing pipeline
- API routes provide authenticated REST interface for viewings (GET/POST/DELETE) and offers (GET/POST/PATCH with action discriminator)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create viewing, offer, and sale progression services** - `7b8d4f6` (feat)
2. **Task 2: Create API routes for viewings and offers** - `929201a` (feat)

## Files Created/Modified

- `src/services/agent/agent-viewing-service.ts` — 6 exported functions: getAgentViewingSlots, createViewingSlot, updateViewingSlot, deleteViewingSlot, getViewingFeedback, submitViewingFeedback
- `src/services/agent/agent-offer-service.ts` — 6 exported functions: getAgentOffers, getOfferById, createOffer, updateOfferStatus, counterOffer, getOfferHistory
- `src/services/agent/agent-sale-service.ts` — 4 exported functions + ALLOWED_TRANSITIONS: getAgentSaleProgressions, createSaleProgression, updateSaleStage, getSaleProgressionById
- `src/app/api/agent/viewings/route.ts` — GET/POST/DELETE handler with auth guard
- `src/app/api/agent/offers/route.ts` — GET/POST/PATCH handler with action-based routing

## Decisions Made

- ALLOWED_TRANSITIONS map enforces sequential forward-one or back-one transitions per UK conveyancing stage — skipping is not permitted and throws a descriptive error
- createSaleProgression called inside updateOfferStatus (service layer) rather than the API route, keeping business logic co-located with offer state machine
- Sale progression creation failure after offer acceptance is logged (console.error) but non-fatal — the offer status is committed regardless to avoid partial rollback complexity
- PATCH /api/agent/offers uses action discriminator (update_status | counter) to multiplex two logical operations into one endpoint

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Standalone `npx tsc --noEmit file.ts` doesn't resolve `@/*` path aliases without a tsconfig project flag; used `--project tsconfig.json` for full project-wide checks instead. All agent files pass with zero errors.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Viewing calendar UI (15-04) can import getAgentViewingSlots, createViewingSlot, deleteViewingSlot directly
- Offers dashboard UI (15-05) can import getAgentOffers, updateOfferStatus, counterOffer
- Sale progression Kanban (15-06) can import getAgentSaleProgressions, updateSaleStage with ALLOWED_TRANSITIONS
- Phase 10 buyer viewing-booking flow can book against viewing slots created by this service — resolves the pending blocker noted in STATE.md

---
*Phase: 15-estate-agent-dashboard*
*Completed: 2026-03-14*

## Self-Check: PASSED

All 5 files exist and both task commits (7b8d4f6, 929201a) verified in git log.
