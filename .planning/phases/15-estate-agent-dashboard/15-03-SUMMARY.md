# 15-03 Summary: Agent Service Layer — Viewings, Offers, Sale Progression

**Status:** Complete

**One-liner:** Supabase-backed service layer for agent viewing slots, offer lifecycle management, and enforced sale stage transitions, plus REST API routes for both domains.

## Files Created

### Service files
- `src/services/agent/agent-viewing-service.ts` — CRUD for viewing slots (with booked-slot guards) and viewing feedback
- `src/services/agent/agent-sale-service.ts` — Sale progression CRUD with ALLOWED_TRANSITIONS enforcement
- `src/services/agent/agent-offer-service.ts` — Offer lifecycle (create, status update, counter-offer) with auto sale progression trigger

### API routes
- `src/app/api/agent/viewings/route.ts` — GET/POST/DELETE for agent viewing slots
- `src/app/api/agent/offers/route.ts` — GET/POST/PATCH for agent offers

## Verification

TypeScript: `npx tsc --noEmit` — zero errors in all 5 new files (pre-existing unrelated errors unchanged).

## Decisions Made

1. **Sale progression trigger is best-effort** — if `createSaleProgression` throws on offer acceptance, the offer status update still succeeds. The error is logged to console to avoid silently swallowing it. This prevents a DB write in an unrelated table from rolling back a successful offer acceptance.

2. **Property filter on viewing feedback uses `!inner` join** — Supabase's PostgREST syntax requires `!inner` on the `agent_viewing_slots` join to enforce the `property_id` filter, otherwise it returns all rows.

3. **Stage transitions allow backward moves** — `ALLOWED_TRANSITIONS` includes reverse paths (e.g. `memorandum_of_sale` → `offer_accepted`) matching the spec, supporting scenarios where a step needs to be re-done.

## Deviations from Plan

None — plan executed exactly as written.
