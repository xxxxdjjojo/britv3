# Pitfalls Research

**Domain:** Buyer/Renter Dashboard — UK property portal (Next.js 16 + Supabase, adding 22 pages to existing app)
**Researched:** 2026-03-13
**Confidence:** HIGH — codebase inspected directly; findings verified against CVE advisories, official Supabase docs, and React Query maintainer guides

---

## Critical Pitfalls

### Pitfall 1: Mock-Data Pages Shipped as "Done" — No Backend Wiring

**What goes wrong:**
Every buyer/renter page currently exists as a hardcoded UI shell. Viewings, offers, documents, applications, and tenancy pages all use `const mockData = [...]` arrays at the top of the page file. The milestone marks these as complete without replacing mock data with real Supabase queries — the feature looks finished in a demo but breaks the moment a real user logs in and sees static, fictional data.

Confirmed in codebase:
- `src/app/(protected)/dashboard/[role]/viewings/page.tsx` — `const upcomingViewings = [{id: 1, ...}]`
- `src/app/(protected)/dashboard/[role]/offers/page.tsx` — `const offers = [{id: 1, ...}]`
- `src/app/(protected)/dashboard/[role]/documents/page.tsx` — `const documents = [{id: 1, ...}]`

**Why it happens:**
The UI was built to unblock design validation. Natural milestone pressure pushes teams to "keep momentum" and defer wiring. Without an explicit checklist item — "remove all const mock arrays and replace with a service + hook" — it gets skipped.

**How to avoid:**
- Establish a hard rule: no `const` data arrays in page files except in `__mock__` directories guarded by a CI import check
- Every page plan must have an acceptance criterion: "Zero hardcoded data. All counts come from a real Supabase query."
- Playwright tests must assert real data — a test that only checks JSX renders is not a passing test

**Warning signs:**
- Stat cards showing invariant values (`3`, `8`, `4.2/5`) regardless of which test user is logged in
- Action buttons (`Book Viewing`, `Accept Offer`, `Upload Document`) with no `onClick` handler or a `console.log` stub
- `const` inline array in a page file outside a `__mock__` directory

**Phase to address:**
Plan 1 of this milestone (DB migration + service layer foundation). All subsequent page plans are gated behind the "no mock data" rule.

---

### Pitfall 2: Missing DB Tables — Zero Schema Exists for These Features

**What goes wrong:**
Migrations `003_dashboards_communication.sql` and `003_property_portal.sql` define conversations, messages, transaction milestones, properties, and listings — but there are no tables for viewings, offers, buyer documents, AI match preferences, mortgage parameters, referral codes, or moving checklists. Building service layers against an imagined schema means repeated schema-change churn, type errors, and wasted work.

**Why it happens:**
The milestone started from the UI layer ("22 pages to ship") rather than the data layer. Developers assume tables exist and write TypeScript types and service functions against schemas that don't exist in Supabase.

**How to avoid:**
- Write and apply the migration in Plan 1 before any service or page code is written
- Required tables (confirmed missing): `viewings`, `viewing_slots`, `property_offers`, `buyer_documents`, `ai_match_preferences`, `mortgage_params`, `referral_codes`, `referral_events`, `moving_checklist_items`
- Run `supabase gen types typescript` immediately after migration; commit the generated types; treat as the single source of truth for the service layer
- TypeScript compilation must fail if a service file references a table not in the generated types

**Warning signs:**
- Service files reference column names not in `src/types/database.ts`
- Supabase returns `relation "viewings" does not exist` errors in the network tab
- Plans write RLS policies against tables that haven't been created yet

**Phase to address:**
Plan 1 (DB migration + TypeScript types). Hard dependency for all subsequent plans.

---

### Pitfall 3: `[role]` Dynamic Segment Does Not Enforce Role Authorization

**What goes wrong:**
The layout at `src/app/(protected)/dashboard/[role]/layout.tsx` verifies authentication and auto-grants the role if missing — but it does not verify that the authenticated user's `active_role` matches the URL segment. A homebuyer can navigate to `/dashboard/seller/offers` or `/dashboard/landlord/rent-collection` and see the page shell. Once real data is wired, the RLS policies will block the data queries, but the route itself is accessible and shows a broken empty page — a UX failure and a potential IDOR surface if any query is misconfigured.

**Why it happens:**
The layout was designed for role-switching UX (the same user can hold multiple roles) so it auto-grants rather than blocking. The security intent was correct but the implementation is incomplete: it does not check which role is currently active.

**How to avoid:**
- The layout must compare `user.active_role === role` (or verify the user has explicitly activated that role) before rendering. If not, redirect to `/dashboard/[user.active_role]`
- As a second layer: all API routes and service functions must verify role ownership on every query — never rely on the layout redirect alone
- The middleware correctly uses `getUser()` (not `getSession()`) — maintain this pattern in all new API routes

**Warning signs:**
- Navigating to `/dashboard/landlord/rent-collection` while logged in as a homebuyer does not redirect
- API routes accept a `role` query param from the client without server-side cross-check

**Phase to address:**
Plan 1 (security hardening of the layout). Must be fixed before any real data is wired to buyer/renter pages.

---

### Pitfall 4: Supabase Storage Documents Bucket — Public Bucket or Overly Permissive RLS

**What goes wrong:**
Buyer document uploads (passport, AIP letter, bank statements, proof of funds) are sensitive identity documents. If the Storage bucket is `public: true`, or if RLS policies are absent, any authenticated user can download another user's documents by constructing the storage path. Supabase signed URLs expire (configurable, default often 2 hours) but if public URLs are used instead, documents are permanently accessible to anyone with the URL — with no revocation mechanism.

**Why it happens:**
The fastest path to "it works" is a public bucket — the Supabase dashboard defaults are permissive. Generating signed URLs requires a server-side API route, which adds code; developers shortcut to `getPublicUrl()` instead.

**How to avoid:**
- Create a **private** bucket named `buyer-documents` with `public: false`
- Storage RLS policy: INSERT requires `(storage.foldername(name))[1] = auth.uid()` (the path must start with the user's own UID)
- SELECT (download) requires the same ownership check
- Never return raw storage paths to the client — always generate signed URLs server-side with a short TTL (600 seconds for download, 300 seconds for upload)
- Upload flow: client requests a signed upload URL from `/api/documents/upload-url` → client uploads directly to Supabase Storage (bypassing your server) → client calls `/api/documents/confirm` to record the metadata row in `buyer_documents`
- File type validation must happen server-side using the `file-type` package (already in `package.json`) — MIME type from the client request is spoofable

**Warning signs:**
- `createSignedUrl` called inside a React component (would expose service role key if misused)
- `storage.from('documents').getPublicUrl(path)` anywhere in the codebase
- Bucket created without an explicit RLS policy (Supabase blocks all access by default but developers often add `WITH CHECK (true)` to unblock quickly, which is equally dangerous)

**Phase to address:**
Document upload plan. Bucket and RLS policies defined in the DB migration plan before any document service is built.

---

### Pitfall 5: Offer Workflow Has No State Machine — Concurrent Mutations Corrupt State

**What goes wrong:**
Property offers have a lifecycle: `draft → submitted → under_review → accepted / rejected / withdrawn / expired`. Without explicit state machine enforcement at the DB level, concurrent mutations corrupt the offer state. An agent accepts an offer while a buyer simultaneously withdraws it — both succeed, leaving the offer in an ambiguous state. Offers also require a one-active-per-property rule that is easy to violate without a DB constraint.

**Why it happens:**
The existing codebase has a booking state machine for marketplace bookings. The same pattern needs to be applied to offers, but because the offers page is currently mock data, this transition logic has never been designed.

**How to avoid:**
- Migration: `CHECK` constraint enforcing valid `status` values; a trigger validating that `old.status → new.status` is an allowed transition
- API route uses optimistic locking: read current status, validate transition, `UPDATE offers SET status = $new WHERE id = $id AND status = $expected` — check `rowCount = 1`; if 0, return `409 Conflict`
- Unique partial index to prevent duplicate active offers: `CREATE UNIQUE INDEX ON property_offers (property_id, buyer_id) WHERE status NOT IN ('rejected','withdrawn','expired')`
- Expose transitions as typed constants: `OFFER_TRANSITIONS: Record<OfferStatus, OfferStatus[]>`

**Warning signs:**
- `UPDATE offers SET status = $newStatus WHERE id = $id` without a current-state check
- No `CHECK` constraint on the `status` column in the migration
- "Withdraw Offer" button is shown even when the offer is already accepted (invalid transition)

**Phase to address:**
Offer workflow plan. State machine and DB constraints defined before the service layer is written.

---

### Pitfall 6: Viewing Scheduling Ignores Availability — Double-Bookings and Phantom Slots

**What goes wrong:**
Viewing scheduling requires checking agent/property availability before creating a booking. Once real data is wired, buyers can book the same time slot twice, or book a slot the agent has blocked — creating double-bookings that require manual resolution and destroy trust in the platform.

**Why it happens:**
Availability checking requires more backend logic than a simple INSERT (availability windows, blocked dates, existing bookings). The path of least resistance is to skip it and "rely on agents to sort it out."

**How to avoid:**
- Migration: `viewing_slots` table with `(property_id, start_at, end_at, max_attendees, booked_count)` and a `CHECK (booked_count <= max_attendees)` constraint
- The booking INSERT is a single Supabase RPC (transaction): check `booked_count < max_attendees`, increment `booked_count`, insert viewing row — atomically, to prevent TOCTOU race conditions
- Cancellation must decrement `booked_count` in the same RPC pattern
- Reschedule = cancel existing + book new in a single transaction; on failure, keep the original booking

**Warning signs:**
- `INSERT INTO viewings` without reading slot availability first
- No `viewing_slots` table or capacity tracking in the migration
- Booking endpoint is two separate Supabase calls (read then write) rather than a single RPC

**Phase to address:**
Viewing schedule plan. Slot management RPC defined in the migration plan.

---

### Pitfall 7: AI Match Feature Fires Claude API on Every Page Load

**What goes wrong:**
The AI Property Match page is planned as a dashboard feature. The naive implementation calls the Claude API on every page visit to generate fresh recommendations. At any meaningful user base, this becomes a runaway cost center. A single Claude Sonnet call costs ~$0.003–$0.015 per call. At 10K daily active users hitting the AI match page, this is $30–$150/day purely from this page.

**Why it happens:**
"AI-powered" features are exciting to build but cost modeling is done after the fact. The existing dashboard cache (5-minute Redis TTL) is not automatically applied to AI-generated results.

**How to avoid:**
- AI match results are stored in `ai_match_results` with a `generated_at` timestamp
- Service layer checks: if `generated_at` is within the last 24 hours, return cached DB results — do not call Claude
- Only regenerate on explicit "Refresh Matches" button click OR when the user updates their preferences
- Rate-limit the refresh endpoint: max 3 regenerations per user per day (Upstash already installed)
- Use the existing `src/services/ai/quote-draft-service.ts` pattern as the template — it already has token tracking
- The PRD specifies SQL-based recommendations as the default (no AI cost). AI matching is the opt-in premium path. Do not conflate them — the default results tab must work without any Claude call

**Warning signs:**
- Claude API call inside a React Query `queryFn` with `staleTime: 0` or `staleTime` not set
- No `generated_at` column in the match results table
- AI match endpoint has no rate limiting middleware

**Phase to address:**
AI match plan. Cost model and caching strategy defined before the service layer is written.

---

### Pitfall 8: Mortgage Comparison Presents Rates as Real Offers — FCA Regulatory Risk

**What goes wrong:**
The mortgage comparison tool shows UK mortgage rates. Presenting fictitious or stale rates as real lender offers without a prominent disclaimer creates regulatory risk under FCA guidance on financial promotions. The UK mortgage market has seen significant rate movements in 2023–2026 — hardcoded rates from a seed file become dangerously stale within weeks.

**Why it happens:**
Building a real UK mortgage rate integration requires either a paid API (Moneyfacts is the industry standard; not free) or scraping (fragile and against ToS). Developers take the path of least resistance: hardcode representative rates with no disclaimer.

**How to avoid:**
- The feature must be clearly labeled a **calculator, not a comparison product** — "representative APR for illustration purposes only" with a prominent, non-dismissable disclaimer
- Use realistic illustrative rates from a seed migration, clearly flagged with `is_illustrative: true`
- The page title must say "Mortgage Calculator" not "Compare Mortgage Rates"
- The "Browse Mortgage Brokers" feature (linking to the marketplace) is the safe equivalent of rate comparison — direct users to FCA-regulated advisors rather than presenting rates as offers
- If real rate data is desired in future: Moneyfacts Group API (commercial) or PropertyData.co.uk mortgage rates API are the correct integrations

**Warning signs:**
- Rate data presented without a visible disclaimer
- No `is_illustrative` flag on mortgage product seed data
- Page copy that implies rates are from real lenders ("Compare rates from 50+ lenders")

**Phase to address:**
Financial tools plan. Disclaimer copy and data labeling defined before the calculator UI is built.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep inline mock data arrays in page files | Pages look complete, fast design review | Mock data gets shipped; real users see static fiction | Never — use a `__mock__` import that CI blocks from production builds |
| Use `service_role` key in API routes for complex queries | Bypasses RLS errors during development | Single route compromise exposes all user data | Never — use the server Supabase client authenticated with `auth.getUser()` |
| Public Supabase Storage bucket for buyer documents | No signed URL logic needed | Passport scans and AIP letters permanently public | Never for PII documents |
| Skip optimistic updates, rely on refetch after mutation | Simpler mutation code | 200–500ms UI lag on every offer/viewing action feels sluggish | Acceptable in initial implementation but flagged for a UX polish pass |
| Single `/api/dashboard` endpoint for all roles | Less code to maintain | Endpoint becomes 300+ lines, hard to test, and slow | Refactor into role-scoped sub-routes if any single role's query count exceeds 10 |
| Client-side-only mortgage calculator | Fast to build, no server cost | Cannot server-render, harder to share/link to pre-filled state | Acceptable — mortgage calc is an appropriate client-only tool |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Storage (documents) | Generating signed URLs inside a React component using the anon key | Generate signed URLs in a server-side API route using the server Supabase client; never expose the service role key |
| Supabase Storage (documents) | Using `getPublicUrl()` on a private bucket | Private buckets require `createSignedUrl()` — `getPublicUrl()` returns a URL that returns 403 for private buckets anyway, causing confusing failures |
| Supabase RPC (slot booking) | Separate SELECT + INSERT from the client | Single RPC function with `SERIALIZABLE` or `FOR UPDATE` isolation to prevent race conditions between availability check and booking insert |
| Claude API (AI match) | Calling the Anthropic SDK in a React component or React Query `queryFn` | Route through `/api/ai/match` with server-side token tracking and Upstash rate limiting |
| Upstash Redis (rate limiting in middleware) | Creating the Redis client at module level in middleware (Edge Runtime) | Create the Upstash client per-request in middleware; module-level instantiation causes issues in Edge Runtime |
| Supabase Auth (session verification) | Calling `supabase.auth.getSession()` in server components or API routes | Always use `supabase.auth.getUser()` — `getSession()` trusts the JWT without re-verifying with the Supabase auth server |
| React Query (optimistic updates) | Mutating the cached object directly in `onMutate` before cloning | `setQueryData` with a mutated reference skips React's re-render detection; always spread: `{ ...prev, items: [...prev.items, newItem] }` |
| React Query (optimistic updates rollback) | Closing a dialog on form submit before mutation settles | If the mutation fails, rollback has nothing to roll back to — the dialog is gone. Show dialog until mutation settles, then close on success |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries in dashboard aggregation (fetching saved property details one-by-one) | Dashboard API takes 2–4 seconds to respond | Single JOIN query or Supabase `.in()` for batch fetch | 20+ saved properties per user |
| No pagination on saved properties list | Page loads all rows for users with large shortlists | Cursor-based pagination with `limit: 20`, "load more" pattern using `useInfiniteQuery` | 100+ saved properties |
| No index on `viewings.user_id` and `viewings.scheduled_at` | Viewing queries full-scan the table | `CREATE INDEX viewings_user_sched_idx ON viewings(user_id, scheduled_at DESC)` in migration | 10K+ viewings across all users |
| `staleTime: 0` on offer status queries | Offer status refetches on every window focus event | Set `staleTime: 30_000`; use Supabase Realtime subscription for live offer status updates instead of polling | High-traffic multi-tab usage |
| Unthrottled AI match regeneration | User hammers "Refresh Matches", burns through Claude API budget in minutes | Upstash rate limit: 3 per user per day + disable the Refresh button client-side after use | Any user who discovers the endpoint |
| pgvector cosine search without HNSW index | AI match query takes 500ms+ on 5K+ property embeddings | `CREATE INDEX ON properties USING hnsw (embedding vector_cosine_ops)` in the migration that adds the embedding column | 5K+ property listings with embeddings enabled |
| Large file uploads routed through a Next.js API route | Route handler buffers the entire file in memory; Next.js default body limit is 4MB | Use Supabase signed upload URL — client uploads directly to Supabase Storage, bypassing your API route entirely | Any file over 4MB (common for bank statements, passport scans) |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Buyer offer amounts visible to competing buyers via insufficient RLS | Price discovery gives competing buyers an unfair advantage; potential legal liability | `property_offers` RLS SELECT policy: `auth.uid() = buyer_id OR auth.uid() IN (SELECT agent_id FROM listings WHERE id = listing_id)` — never expose offers to other buyers |
| Referral codes that are sequential or short | Users guess codes and claim rewards without a legitimate referral | Use `encode(gen_random_bytes(8), 'base64')` for referral codes (12+ char); rate-limit `/api/referral/redeem` at 5 attempts per IP per hour |
| Document storage paths that include user PII | Storage paths like `documents/john-smith-passport.pdf` expose names in signed URLs | Always use `auth.uid()/<random-uuid>.pdf` as the storage path; store the original filename only in the `buyer_documents.original_filename` column |
| Offer status transitions validated client-side only | A buyer calls the offer-accept endpoint directly by modifying the network request | All state transitions validated server-side in the API route AND enforced by a DB trigger; the API route never accepts a client-supplied `newStatus` without checking the current DB state |
| Missing RLS on `ai_match_preferences` | Any authenticated user reads another user's AI match criteria and saved search logic | `USING (auth.uid() = user_id)` on all SELECT/INSERT/UPDATE/DELETE operations |
| Next.js middleware as the only auth layer | CVE-2025-29927 (CVSS 9.1): `x-middleware-subrequest` header bypass allows attackers to skip all middleware checks. **Next.js 16.1.6 is patched** but the pattern of middleware-only auth is fragile | Add server-side `supabase.auth.getUser()` check in every API route and Server Component that returns sensitive data — defense in depth, never rely solely on middleware |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Viewing booking form submits without confirming slot availability | User thinks they have a viewing; agent has no record | Show real-time slot availability before submission; disable the slot button if `booked_count >= max_attendees`; show spinner on submit; display confirmation with calendar invite link |
| Offer submission has no in-flight state feedback | User double-clicks Submit, creates duplicate offers | Disable submit button on first click; show "Submitting..." state using React Hook Form `isSubmitting`; unique partial index as the safety net |
| AI match results page shows a blank screen while Claude API responds (1–3 seconds) | Users assume the page is broken | Show property card skeletons immediately; populate them as results arrive |
| Mortgage comparison shows rates without a disclaimer | Users make financial decisions based on illustrative rates; FCA risk | Prominent "Illustrative rates only — not a financial offer" banner above all rate displays; not dismissable; not below the fold |
| Document upload gives no feedback on progress for large files | Users upload 5MB bank statements and see nothing for 10 seconds | Use Supabase Storage upload with `onUploadProgress` callback; show a percentage progress bar |
| Viewing reschedule fails halfway — original booking cancelled, new one errors | User has no viewing, was not warned | Reschedule is atomic: cancel + rebook in a single DB transaction; if the transaction fails, the original booking is preserved; display a clear error |
| Referral tracker shows "0 referrals" with no empty state guidance | New users think the feature is broken | Empty state with a pre-filled share link, one-click copy button, and a "How referrals work" explainer |

---

## "Looks Done But Isn't" Checklist

Things that appear complete in a browser demo but are missing critical production pieces.

- [ ] **Viewings page:** Has UI with mock data — verify that `viewings` table exists in Supabase, RLS is applied, and the page queries real data via a service + React Query hook
- [ ] **Book Viewing button:** Opens a modal — verify that form submission calls an API route (not `console.log`); verify slot conflict checking is active via RPC
- [ ] **Offers page:** Shows offer table — verify a buyer can only see their own offers (RLS), not all offers for the property
- [ ] **Submit Offer form:** Has fields and Submit button — verify duplicate offer prevention (unique partial index) is enforced; verify state machine rejects invalid transitions
- [ ] **Documents page:** Has upload button — verify the button triggers the Supabase signed URL upload flow, not a direct client `fetch` to Storage; verify bucket is private
- [ ] **Document download:** Has download icon — verify it calls a server-side API route that generates a short-lived signed URL (not a public URL); verify URL is not logged
- [ ] **AI Match page:** Shows property cards — verify results come from DB cache (not a live Claude call on every visit); verify "Refresh" is rate-limited
- [ ] **Mortgage comparison:** Shows rates — verify all rates have a visible "Illustrative only" label; verify none are presented as real lender offers
- [ ] **Referral tracker:** Shows referral count — verify that `referral_events` rows are created only by trusted server-side code, not by a client-callable endpoint
- [ ] **Moving checklist:** Has checklist items — verify items are per-user in the DB, not a shared global list
- [ ] **Role guard on `[role]` layout:** Auto-grants role — verify that a homebuyer navigating to `/dashboard/landlord/rent-collection` is redirected to `/dashboard/homebuyer`, not shown an empty landlord page

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Mock data shipped to production | MEDIUM | Feature-flag affected pages off; add migration + service layer; re-enable behind flag once wired and browser-tested |
| Public Storage bucket with sensitive documents | HIGH | Immediately convert bucket to private; existing public URLs remain accessible until Supabase purges CDN cache (contact support); notify affected users under GDPR Article 33 within 72 hours; audit Storage access logs |
| Duplicate offers due to missing unique constraint | MEDIUM | Write a data-fix migration to mark duplicates as `withdrawn` (keep the earliest); add the unique partial index; email affected buyers |
| AI match runaway API cost | LOW | Add an `ai_match_enabled` boolean to Upstash feature flags (kill-switch); disable the Claude call; serve cached results only; cost is bounded if Upstash rate limit was in place |
| Role authorization bypass (homebuyer sees seller/landlord page) | LOW | Add `active_role` check to the layout server component; if RLS was correctly set, no data was exposed — this is a UI fix only |
| Double-booked viewings | MEDIUM | RPC to identify conflicts (same slot, multiple bookings); notify both parties via Resend email; offer alternative slots; add the atomic RPC slot check before re-enabling the booking endpoint |

---

## Pitfall-to-Phase Mapping

How milestone plans should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Mock data shipped as real | Plan 1 (migration) — all subsequent page plans gated | Playwright test with a real Supabase test user asserts no static data is present |
| Missing DB schema | Plan 1 (migration + TypeScript types) | `supabase gen types` runs in CI; TypeScript fails if service references missing table |
| `[role]` route authorization bypass | Plan 1 (security hardening of layout) | Playwright: log in as homebuyer, navigate to `/dashboard/landlord/rent-collection`, assert redirect to homebuyer dashboard |
| Supabase Storage document security | Document upload plan | Test: attempt `getPublicUrl` on the documents bucket — assert it returns 403; test: download another user's document path — assert 403 |
| Offer state machine corruption | Offer workflow plan | Unit tests on state transition service; Playwright: concurrent accept + withdraw requests — assert consistent final state |
| Viewing double-booking | Viewing schedule plan | Playwright: two concurrent booking requests for the same slot — assert only one succeeds and the second returns `409` |
| AI match runaway cost | AI match plan | Smoke test: 4 refresh requests in succession from one user — assert 4th returns `429 Too Many Requests` |
| Mortgage rate regulatory risk | Financial tools plan | Visual review: all rate displays show disclaimer visible without scroll; no copy claims rates are from real lenders |

---

## Appendix: Project-Wide Pitfalls (v3.0 Roadmap)

The following pitfalls apply to the entire v3.0 build (pre-existing research from 2026-03-06):

### RLS Performance Collapse at Scale
With 266 tables and 7 roles, every query passes through RLS policies. Poorly written policies (joins, subqueries) turn simple queries into full table scans. Store active role in JWT custom claims. Never join other tables inside RLS policies. Use `SECURITY DEFINER` helper functions for cross-table checks.

### Migration Explosion (204-Migration Problem)
v2.0 accumulated 204 migration files with destructive ALTER TABLE statements. Prevention: define all tables in foundational migrations, later epics only ADD columns/indexes/policies, never drop.

### Stripe Connect Onboarding Blocking Marketplace
Decouple provider visibility from payment readiness. Stripe Connect onboarding triggers only when the first quote is accepted.

### Multi-Role Auth Complexity
Single permissions matrix as one source of truth. JWT custom claims store active role used by RLS, middleware, and UI. Role switch = new JWT.

### Connection Pool Exhaustion
Use Supavisor in transaction mode. Single Supabase client per request. Redis caching for frequently accessed data.

### Bundle Size Explosion
Dynamic imports for MapLibre (`ssr: false`), Stripe Elements, AI chat. Set a 200KB initial JS budget per route.

---
*Pitfalls research for: Buyer/Renter Dashboard — Britestate v3.1 milestone*
*Researched: 2026-03-13*
*Supersedes previous PITFALLS.md (2026-03-06) which is now the Appendix section above*

## Sources

- Codebase inspection — `src/app/(protected)/dashboard/[role]/viewings/page.tsx`, `offers/page.tsx`, `documents/page.tsx` — confirmed all use hardcoded mock data
- Codebase inspection — `supabase/migrations/` — confirmed no tables exist for viewings, offers, buyer documents, referrals, AI match preferences, or mortgage params
- Codebase inspection — `src/app/(protected)/dashboard/[role]/layout.tsx` — confirmed role auto-grant without `active_role` equality check
- [CVE-2025-29927: Next.js Middleware Authorization Bypass](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass) — CVSS 9.1; Next.js 16.1.6 is patched
- [Critical Next.js Vulnerability — The Hacker News](https://thehackernews.com/2025/03/critical-nextjs-vulnerability-allows.html)
- [Supabase Storage Access Control Docs](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Storage Buckets Fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [TkDodo — Mastering Mutations in React Query](https://tkdodo.eu/blog/mastering-mutations-in-react-query)
- [TkDodo — Concurrent Optimistic Updates](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
- [Supabase pgvector Docs](https://supabase.com/docs/guides/database/extensions/pgvector)
- [pgvector Benchmarks and Reality Check](https://medium.com/@DataCraft-Innovations/postgres-vector-search-with-pgvector-benchmarks-costs-and-reality-check-f839a4d2b66f)
- [Moneyfacts Group API — UK Mortgage Rate Data](https://www.moneyfactsgroup.co.uk/data-provision/api/)
