# Truedeed Phase 1 — Introductions Ledger: Design

**Date:** 2026-06-12 · **Status:** approved (user delegated remaining decisions)
**Authoritative inputs:** `docs/truedeed/attribution-tracking-spec.md` (§1–§3, §6), `docs/truedeed/dispute-playbook.md` (D1/D3 evidence requirements). Commercial decisions therein are final.

## 1. Context

Truedeed (= Britestate, same codebase) earns a £249+VAT success fee when an introduced applicant completes on an introduced property. Phase 1 builds the evidence backbone everything else stands on: an append-only, hash-chained introductions ledger; real-time branch notification with a 5-business-day rebuttal window; RLS so agents see their branch's introductions and applicants see their own; and the daily external hash anchor. No billing in this phase (Phase 4), no PPD (Phase 3).

**Decisions taken in brainstorm (final):**
- Ledger applies to **all agent listings** from day one — no membership gating in Phase 1. Network-Agreement signature capture lands with Phase 4 onboarding; nothing can be invoiced before Phase 4 exists.
- **Authenticated applicants only.** Guest enquiries (currently not persisted at all — pre-existing gap) are not ledgered; an introduction without verified identity is weak D3 evidence.
- **Hash anchor = sealed email via Resend** to `LEDGER_ANCHOR_EMAIL`, daily Inngest cron, logged in `email_logs` + audit log. Zero new credentials.
- **Ops = `profiles.is_admin`** (existing admin role) for rebuttal decisions and audit access.
- Notification is **async with retries** (Inngest): the introduction row is inserted immediately (occurred_at fixed, hash sealed), then `notified_at`/`rebuttal_deadline` are set exactly once via a SECURITY DEFINER function. The row hash deliberately excludes notification fields, so the immutability claim survives.
- **Fix `003_dashboards_communication.sql`** (`NOW()` in partial-index predicate — invalid SQL that blocks `supabase start` everywhere). Replace with a non-partial index; document why.

## 2. Schema reconciliation (spec ↔ britv3) — the gating deliverable

| Spec table | britv3 disposition |
|---|---|
| `member_orgs` | **Reuse** `agent_agency_profiles` (1:1 per agent user). **Extend** with `company_number text` (nullable; populated at Phase 4 onboarding). Signed-agreement fields deferred to Phase 4 with the rest of clause 2.1 onboarding. |
| `branches` | **Reuse** `agent_branches`. |
| `branch_members` | **Reuse** `agent_team_members` (roles already exist). |
| `applicants` | **Reuse** `auth.users` + `profiles` (homebuyer/renter roles). No new table. |
| `listings` | **Reuse** `listings`/`properties`. **Extend** `listings` with nullable `branch_id → agent_branches(id)` (today a listing belongs to an agent user only). PAON/SAON/UPRN columns deferred to Phase 3 (PPD matching needs them; nothing in Phase 1 does). |
| `introductions` | **New** — hash-chained append-only ledger. |
| `introduction_status_history` | **New** (pattern: existing `offer_status_history`). |
| `introduction_events` | **New**. |
| `rebuttals` | **New** + private Storage bucket `rebuttal-evidence`. |
| `audit_log` | **New** `truedeed_audit_log` (existing `admin_audit_log` RLS requires actor = admin = wrong shape for system-written evidence). |
| notifications | **Reuse** `platform_events` + notification service + Resend `email_logs`; **new** React Email template + **new** Resend delivery webhook (svix-signed) so delivery events become stored evidence. |

## 3. Migration — `20260612000000_truedeed_introductions.sql`

Tables follow spec §2 with these adaptations: `branch_id` nullable (derived from listing's branch when set, else attribution is to the listing's `agent_id`); `agent_id uuid not null` denormalised onto `introductions` for RLS speed; statuses/events exactly per spec enums.

- **Immutability:** revoke UPDATE/DELETE from anon+authenticated on all ledger tables; `forbid_mutation()` BEFORE-trigger on `introductions` (allows exactly one transition: `notified_at`/`rebuttal_deadline` NULL→value, every other column must be unchanged), plain forbid triggers on `introduction_events`, `introduction_status_history`, `truedeed_audit_log`. `rebuttals` updatable only via `decide_rebuttal()` SECURITY DEFINER.
- **Hash chain:** `set_intro_hash()` BEFORE INSERT — `row_hash = sha256(coalesce(prev,'genesis') || id || applicant_id || listing_id || first_contact_type || occurred_at_iso)`; serialized via advisory lock to prevent concurrent-insert chain forks.
- **State machine:** `transition_introduction(intro_id, new_status, reason, actor)` SECURITY DEFINER validating allowed transitions (active→rebutted|cancelled_manifest_error|converted_*|expired; converted_sstc→converted_exchanged→converted_completed; any non-terminal→expired).
- **RLS:** agent SELECT where `agent_id = auth.uid()` OR membership via `agent_team_members` on the introduction's branch; applicant SELECT own; **no INSERT policies** (service-role only — timestamps can't be client-forged); rebuttal INSERT only by the branch side and only while `now() <= rebuttal_deadline`; `truedeed_audit_log` admin-SELECT only.
- Companion migration fix: `003_dashboards_communication.sql` partial index → full index on `(created_at)`.

## 4. Services & jobs

- `src/lib/business-days.ts` — `addBusinessDays(date, n)` for England & Wales: gov.uk `bank-holidays.json` cached in Upstash (7d TTL) with a bundled JSON snapshot fallback; pure + unit-tested.
- `src/services/truedeed/introduction-service.ts` — `recordIntroduction({applicantId, listingId, contactType})`: resolves listing→agent/branch, idempotent on `(applicant_id, listing_id)` (duplicate → appends `introduction_events` row instead), inserts ledger row + `introduction_status_history('active')` + audit log, emits Inngest `truedeed/introduction.recorded`. Also `recordIntroductionEvent()` for viewings booked/attended, messages, offers relayed.
- `src/services/truedeed/rebuttal-service.ts` — `submitRebuttal` (window-checked, evidence files → `rebuttal-evidence` bucket, `evidence_dated_at` must pre-date `occurred_at`), `decideRebuttal` (admin; uphold → `transition_introduction('rebutted')`).
- **Inngest** `truedeed-notify-introduction` (event-driven, retried): renders React Email (applicant name, listing address, timestamp, deadline — "this email is the dispute-killer"), sends via Resend, logs `email_logs`, then `mark_introduction_notified(intro_id, notified_at, deadline)` where deadline = `addBusinessDays(notified_at, 5)`, writes `platform_events` + audit log.
- **Inngest** `truedeed-hash-anchor` (cron `0 6 * * *`): latest `row_hash` + row count → anchor email to `LEDGER_ANCHOR_EMAIL` → audit log.
- **Inngest** `truedeed-expire-introductions` (cron daily): non-terminal introductions past `tail_expires_at` → `transition_introduction('expired')`.
- `/api/webhooks/resend` — svix signature verification (`RESEND_WEBHOOK_SECRET`), delivery/bounce events → `email_logs` status update + audit log (Stripe-webhook claim pattern).

## 5. Capture hooks (surgical edits to existing routes)

| Surface | Hook |
|---|---|
| `/api/properties/[id]/contact` (authenticated branch) | `recordIntroduction(type='enquiry')` |
| `/api/viewings/book` | `recordIntroduction(type='viewing_request')` + `viewing_booked` event |
| message send where `conversations.context_type='listing'` | `recordIntroduction(type='message')` (first) / `message_sent` event |
| offer submission | ensure introduction exists (`enquiry`) + `offer_relayed` event |

Hooks are fire-and-forget with error logging — an attribution failure must never break the user-facing action.

## 6. UI

- **Agent:** `dashboard/agent/introductions` — table (applicant, listing, type, occurred, status badge, rebuttal countdown), detail drawer with the event trail, "Dispute this introduction" → rebuttal modal (evidence upload + claimed prior-contact date), disabled with explanatory copy once the window expires. Follows existing agent-dashboard idioms.
- **Admin:** `admin/truedeed/rebuttals` — pending-rebuttal queue (moderation-queue pattern): introduction facts vs claimed evidence (signed URLs), uphold/reject with mandatory reason; decisions write audit log.

## 7. Testing (strict TDD; RED committed first)

- **New capability — real-Postgres suite** (`db-tests/`, `pnpm test:db`, ephemeral `postgres:15-alpine`, skipped unless `RUN_DB_TESTS=1`): prerequisite-schema stub + the new migration, then: immutability (UPDATE/DELETE rejected; the single allowed notified_at transition works exactly once), hash chain (correct linkage; tampering detectable by re-computation), RLS (agent/applicant/foreign-agent visibility via `set_config('request.jwt.claims', …)`; rebuttal insert inside vs after window), state machine (legal/illegal transitions).
- **Unit (Vitest, mocked Supabase):** business-days (holiday spans, weekends, snapshot fallback), introduction-service (idempotency, branch resolution, event fan-out), rebuttal-service (window, evidence-date validation), Resend webhook (signature, claim idempotency).
- **Component:** introductions table + rebuttal modal (states, countdown, accessibility).
- **E2E (Playwright):** buyer enquires → introduction appears in agent dashboard with deadline; rebuttal submit inside window succeeds, after window blocked; admin queue decision flow. Screenshot proof of every surface (desktop + mobile).

## 8. Out of scope (later phases)

Reported outcomes & invoice candidates (P2) · PPD ingest/matcher + PAON/SAON/UPRN (P3) · GoCardless, dunning, statutory interest, agreement signing/`company_number` population (P4) · dispute playbook tooling & metrics (P5) · guest-enquiry persistence (separate backlog item).
