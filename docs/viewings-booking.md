# Viewings & Booking

How a buyer/renter books a viewing directly with the host (estate agent for
sales, landlord for rentals), and how a host manages availability.

## Canonical model

| Table | Purpose |
|-------|---------|
| `viewing_slots` | **The** availability table. Host-published slots the buyer modal reads. Columns: `id, listing_id, agent_id, start_time, end_time, type('in_person'\|'virtual'), status('available'\|'booked'\|'cancelled'), booked_by, notes`. `agent_id` is the generic host (agent **or** landlord = `listings.user_id`). |
| `viewings` | A booked or **requested** viewing. `slot_id` is nullable (slot-less "requested" viewings). `status ∈ pending, confirmed, cancelled, rescheduled, completed, declined`. `preferred_time` holds the requester's proposed time for slot-less requests. |
| `agent_viewing_feedback` | Post-viewing feedback (unchanged). Its `viewing_slot_id` now points at `viewing_slots`. |

> `agent_viewing_slots` is **legacy** — kept only for historical rows. All new
> availability is written to `viewing_slots`. `getAgentViewingSlots`/`createViewingSlot`
> in `agent-viewing-service.ts` read/write `viewing_slots` but keep the legacy
> `AgentViewingSlot` shape (`property_id ⇐ listing_id`, `is_booked ⇐ status==='booked'`).

Property address is on `properties` (`address_line1, city, postcode`) via
`listings.property_id` — never on `listings`. Use
`resolveListingAddresses(supabase, listingIds)`.

## RPCs (SECURITY DEFINER)

| RPC | Called by | Returns |
|-----|-----------|---------|
| `claim_viewing_slot(p_slot_id, p_user_id)` | `POST /api/properties/[id]/book-viewing` | `{success, slot_id, viewing_id}` or `{error:'slot_taken'\|'unauthorized'}`. Atomic `FOR UPDATE`; sets `booked_by`, inserts a `viewings` row, emits a `viewing_scheduled` platform_event. |
| `request_viewing(p_listing_id, p_user_id, p_preferred_time, p_notes)` | `POST /api/properties/[id]/request-viewing` | `{success, viewing_id}` or `{error:'already_requested'\|'own_listing'\|'listing_not_found'\|'unauthorized'}`. Inserts a slot-less `pending` viewing, emits `viewing_requested`. |
| `respond_viewing_request(p_viewing_id, p_action, p_slot_id)` | `POST /api/viewings/requests/[id]` | `{success, action}` or `{error:'not_found'\|'forbidden'\|'slot_taken'\|'invalid_action'}`. Host confirm/decline; confirm may atomically attach an available slot; emits `viewing_request_responded`. |

All three are `authenticated`-only (REVOKE PUBLIC/anon).

## RLS

`viewing_slots` SELECT is public for **available** slots (`status='available' OR
auth.uid()=agent_id OR auth.uid()=booked_by`) — this is the fix for the
"Could not load available slots" bug (previously agent-only, so buyers saw
nothing). INSERT requires the caller to own the listing.

## Flows

**Book (slots exist):** modal `GET /viewing-slots` → pick a slot →
`POST /book-viewing` → `claim_viewing_slot` → booker gets a confirmation email,
host gets a bell notification + email.

**Request (no slots):** modal shows a preferred-time form →
`POST /request-viewing` → `request_viewing` → host gets a notification + email →
host confirms/declines from **Viewings** on their dashboard
(`ViewingRequestsPanel`) → `POST /api/viewings/requests/[id]`.

**Host availability:** agent → `/dashboard/agent/viewings`; landlord →
`/dashboard/landlord/viewings`. Both render the calendar + the pending-requests
panel.

## Notifications

`viewing-notifications.ts` (`sendViewingBookedEmails` / `sendViewingRequestEmails`)
runs fire-and-forget from the routes, resolves the other party's email via the
admin client, and skips self-emails. Bell feed is driven by the platform_events
the RPCs emit; `getUserEntityIds` includes the user's owned listings (host
events) and their own viewings (request-response events).

## Gotchas

- Mock/demo listings have non-UUID ids (`"1".."12"`). API routes uuid-guard
  (`isUuid`) and return `{slots:[]}` / 404 instead of a Postgres uuid-cast 500.
- Do not use `z.uuid()` for listing ids — it rejects some valid Postgres UUIDs.
- Host email templates HTML-escape user-controlled values (`display_name`,
  address) — see `esc()` in `email-service.ts`.
