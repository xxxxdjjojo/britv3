# Direct-to-Trader Quote Workflow — Design Spec

**Date:** 2026-07-02
**Branch:** `feat/direct-quote-workflow` (worktree `wt-direct-quote`, base `c8c857ec`)
**Status:** Approved by user (pipeline: unified RFQ with real targeting; guests: allowed, email-only follow-up; scope: full CTA sweep)

## Problem

"Get a quote" on trader surfaces is broken end-to-end:

1. **The direct-quote pipeline is a black hole.** `QuoteModal` (trader profile) inserts into `provider_leads` — no dashboard UI reads it, no notification fires. Every direct quote request ever submitted has silently vanished.
2. **The real RFQ pipeline is broadcast-only.** `service_requests.target_provider_id` exists (PR #146) but nothing filters on it: leads queries, the public `/jobs` board, and `rfq-notify-providers` all treat every RFQ as broadcast.
3. **Broken CTAs:**
   - `FeaturedExpertCard` "Request Quote" emits `?intent=quote`; nothing consumes it — user lands on the profile, no modal opens (`src/components/placements/FeaturedExpertCard.tsx:117-126`).
   - `ProviderSearchCard` "Get a Quote" needs 2 further clicks (`src/components/providers/ProviderSearchCard.tsx:182-187`).
   - `/marketplace/[slug]` "Request Quote" links back to the marketplace grid — circular (`src/app/(main)/marketplace/[slug]/ProviderProfile.tsx:129-134`).
   - Specialist pages (conveyancers/surveyors/mortgage-brokers/architects) "Get a Quote"/"Book Survey" anchor to `#quote` on a sidebar that has no form (`src/components/providers/SpecialistSidebar.tsx:36-50`, `SpecialistHero.tsx:221-227`).
   - Dead buttons: `MessageThread.tsx:246` "Request Quote" pill; broker `dashboard/broker/products/page.tsx:332-337`.
   - `/post-a-job` ignores all query params (`src/app/(main)/post-a-job/page.tsx`) despite `/services-near` linking with `?service=&postcode=`.
4. **Notification gaps:** homeowner `quote_received` event is fully built (email/push/prefs/unsubscribe) but never emitted by either quote-send path; provider new-RFQ email is a TODO stub.

## Market research (verified live, July 2026)

Checkatrade/Bark/TrustATrader consensus for direct-to-one-trader: same-page modal or lightweight dedicated route with the trader's identity persistent; 3–5 short steps (job type → postcode → description/timing → contact last); the request goes to that trader only; trader receives an inbox lead + notification; homeowner gets confirmation + a thread/dashboard entry.

## Design

### A. Core flow (1 click to form)

- CTAs on the trader profile open the quote modal in place.
- CTAs on cards/other pages navigate to `tradespersonProfilePath(slug)` + `?intent=quote`; the profile auto-opens the modal on arrival. This finally consumes the param `FeaturedExpertCard` already emits.
- The modal (evolved from `QuoteModal`, renamed `RequestQuoteModal`) keeps trader name/avatar persistent. Steps: job details (category preselected from trader services, description, postcode, timing/urgency, budget) → contact (**skipped when logged in**) → confirmation.
- Submit targets the RFQ pipeline with `target_provider_id`. `provider_leads` writes stop.

### B. Backend: enforce targeting

**Migration** (`service_requests`):
- `user_id` nullable + `CHECK (user_id IS NOT NULL OR contact_email IS NOT NULL)`.
- Add `contact_name TEXT`, `contact_email TEXT`, `contact_phone TEXT` (guest submissions).
- RLS: amend provider-visibility policy ("Verified providers can view open RFQs") with `AND (target_provider_id IS NULL OR target_provider_id = auth.uid())` — fail-closed at the DB.
- No anon INSERT policy — guest inserts go through a service-role server route only.

**API:**
- Logged-in: existing `POST /api/rfq/create` (schema already accepts `target_provider_id`, `source`).
- Guest: new guest branch (service-role client) with zod validation, rate limiting, honeypot field. Guest RFQs store contact fields, `user_id = NULL`.

**Distribution filtering:**
- `getProviderLeads` (`provider-job-service.ts`): include RFQs targeted at *this* provider (listed first, badged "Direct request"); exclude RFQs targeted at others. Targeted leads bypass the 48h recency window.
- `listProviderMatchedRfqs` (`rfq-service.ts`): same include/exclude rule.
- Public `/jobs` board: `target_provider_id IS NULL` only.
- `rfq-notify-providers` (Inngest): targeted RFQ → notify only the target provider (skip top-10 scoring).

### C. Notifications (both directions)

- **Trader:** in-app notification + email on direct request (implement real email in place of the TODO stub; prod delivery is gated on the known Resend account/domain issue — event/in-app path works regardless).
- **Homeowner:** emit `quote_received` platform event in **both** quote-send paths — marketplace `createQuote` (`quote-service.ts`) and provider `sendQuote` (`provider-quote-service.ts`). Guests receive quote details by email (with sign-up nudge) since they have no account; no in-app path for guests (user-accepted trade-off).
- Downstream lifecycle (accept → booking → invoice → payment) already exists (PR #140) and is reused unchanged. Guest RFQs: quotes are emailed; acceptance for guests happens off-platform or after sign-up (out of scope to build a token-accept page).

### D. Full CTA sweep

| Surface | Fix |
|---|---|
| `FeaturedExpertCard` | `?intent=quote` now consumed — modal auto-opens |
| `ProviderSearchCard` | link → profile `?intent=quote` (1 click to form) |
| `/marketplace/[slug]` ProviderProfile | "Request Quote" → profile `?intent=quote` (kill circular link) |
| Specialist pages (conveyancer/surveyor/broker/architect) | Working enquiry: if the specialist is a provider in the pipeline, same targeted modal; else a functional contact form → messaging. Verified during implementation. |
| `MessageThread` "Request Quote" pill | Wired to the counterpart trader's quote flow; removed if the thread has no trader counterpart |
| Broker dashboard products "Request Quote" | Wired or removed with rationale |
| `/post-a-job` | Reads `service`/`postcode` searchParams → prefills `RFQCreateForm` |

`provider_leads`: stop writing; keep the table. Check prod row count first — genuine historical leads get a one-time backfill into targeted RFQs; test noise gets documented and left.

### E. Analytics

Keep existing placement events (`enquiry_started` etc.). Add submission attribution: RFQ rows carry `source` (existing column) — set per entry surface (`profile_page`, `sponsored_placement`, `search_card`, `marketplace_profile`, `messaging`, etc.).

### F. Testing (TDD, red-first)

Committed failing before implementation:
1. **CTA link-integrity test** (extends existing guard-test pattern): every quote CTA resolves to a live route or a modal trigger; no `href` to dead routes; `FeaturedExpertCard`/`ProviderSearchCard`/marketplace links carry `intent=quote`.
2. **Modal behaviour:** profile opens modal on `?intent=quote`; logged-in flow skips contact step; submit posts `target_provider_id`.
3. **API:** targeted create (auth), guest create (validation, honeypot, missing-email rejection).
4. **Distribution:** targeted RFQ appears for the target provider (first, badged), not for others; excluded from `/jobs` query.
5. **Notifications:** `quote_received` emitted by both send paths; targeted RFQ notifies only the target provider.

Gates (per standing feedback): full `src/__tests__` suite + full build, not feature-subset. Adversarial design-parity review pass on all restyled/edited surfaces. Live verification on prod after merge with Playwright screenshots (375/768/1440): card → modal in one click; submission confirmation; trader dashboard direct lead; homeowner quote notification.

### G. Process

Worktree `wt-direct-quote` off `origin/main`. TDD commit cadence (red tests → commit → green → commit). Parallel subagent lanes: backend (migration/API/distribution/notifications), modal + profile intent handling, CTA sweep. Migration applied to prod via Supabase MCP with ledger reconciliation (established pattern). PR to `main`, CI green, live verify + screenshots.

### Error handling

Zod at every boundary; guest route rate-limited + honeypot; RLS fail-closed; postcode format validated (existing CHECK + zod); modal submit failures render visible error state (no silent catch); notification emission failures logged, never block quote creation.

### Out of scope

- Token-based guest quote-accept page (guests interact via email; can sign up to manage).
- Rebuilding the broadcast RFQ wizard UX.
- Fixing prod Resend account/domain (user action; tracked in Gate-A P0.1).
