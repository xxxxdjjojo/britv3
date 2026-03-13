# Phase 8: DB Foundation & Security - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 8 delivers the database foundation for the v3.1 Buyer/Renter Dashboard milestone: 10 new tables with RLS policies, atomic viewing slot booking RPCs, role authorization bypass fix, server-side auth guards, a private document storage bucket, and 4 npm package installs. No UI is built in this phase — it exists to unblock every subsequent phase from being built on real data.

</domain>

<decisions>
## Implementation Decisions

### Role Route Redirect
- When a user with role=homebuyer navigates to /dashboard/landlord (or any wrong-role dashboard), silently redirect to /dashboard/homebuyer — no error page
- The fix lives in the `[role]` layout Server Component: read active_role from the session, compare against the URL param, redirect if mismatch
- No separate middleware layer needed — the layout guard is the enforcement point

### Viewing Slot Booking RPC
- Use **SELECT FOR UPDATE** within a PostgreSQL transaction to prevent double-booking — lock the slot row, check it's still available, mark it booked, all atomically
- If the slot is already taken, the RPC returns a structured error code: `SLOT_UNAVAILABLE` — the UI shows "This slot was just taken — please pick another time"
- The booking RPC is **atomic**: it updates `viewing_slots.status` AND inserts into `viewings` in one transaction. If either fails, both roll back — no orphaned records
- **Separate RPCs** for each operation: `book_viewing_slot`, `cancel_viewing`, `reschedule_viewing`
  - `cancel_viewing`: frees the slot (sets status back to available) + updates viewing status
  - `reschedule_viewing`: books the new slot atomically + frees the old slot in one transaction

### RLS Policy Scope
- **viewings and offers tables**: both buyer (row owner) and the property's agent can SELECT — RLS policy: `auth.uid() = user_id OR [listing belongs to auth.uid() as agent]`
- **Offer status UPDATE**: blocked entirely from the client via RLS — all status transitions go through server-side API routes using `SUPABASE_SERVICE_ROLE_KEY`, enforcing the state machine server-side
- **user_documents**: buyer + their assigned solicitor/agent can read — the policy joins to the offer relationship to identify the instructed parties
- **offer_status_history**: INSERT only via service role (client INSERT blocked by RLS) — both buyer and agent can SELECT their relevant rows. Audit trail integrity preserved — no client can write to this table directly

### Referral Code Strategy
- **Lazy creation on first visit**: no backfill at migration time. When a user first navigates to the Referral Tracker (Phase 12), the server checks for their code and INSERTs if missing
- Race condition handled via `INSERT INTO referral_codes ... ON CONFLICT (user_id) DO NOTHING`
- Codes are **permanent for life** — once generated, the code never changes
- `referral_codes` has a **UNIQUE constraint on `user_id`** — one code per account, no exceptions
- `referral_codes` also has a **UNIQUE constraint on `code`** — nanoid collision prevention

### Claude's Discretion
- Exact migration file naming and sequencing
- Index choice for foreign keys and query patterns (planner can decide)
- Exact nanoid length (suggest 10 chars — collision-safe for user scale)
- offer_status_history CHECK constraint list for valid status values

</decisions>

<specifics>
## Specific Ideas

- Offer state machine: 7 stages — Offer Submitted → Solicitors Instructed → Searches → Survey → Mortgage Approved → Exchange → Completion. CHECK constraint on offers.status should enumerate these plus "Withdrawn".
- Viewing types: in-person or virtual — viewing_slots and viewings should both carry a `type` field with a CHECK constraint: `('in_person', 'virtual')`
- The buyer-documents Supabase Storage bucket must be configured as **private** — never use `getPublicUrl()`, all access via `createSignedUrl()` with 1-hour expiry

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WizardStepper.tsx` (src/components/auth/): Not relevant to Phase 8 (no UI)
- No existing migrations found in britv3.0/supabase/ — Phase 8 will establish the first v3.1 migration file

### Established Patterns
- Next.js App Router Server Components with `supabase.auth.getUser()` (FOUND-03 requirement aligns with this pattern)
- Supabase client factories expected at `lib/supabase/server.ts` and `lib/supabase/client.ts`

### Integration Points
- The `[role]` dynamic segment layout (`app/(protected)/dashboard/[role]/layout.tsx`) is the enforcement point for FOUND-02
- `supabase gen types typescript` output should be committed to `src/types/database.types.ts` for use by all subsequent phases

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-db-foundation-security*
*Context gathered: 2026-03-13*
