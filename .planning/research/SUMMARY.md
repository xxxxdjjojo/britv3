# Project Research Summary

**Project:** Britestate v3.0 — UK Property Portal (Milestone v3.1: Buyer/Renter Dashboard)
**Domain:** Buyer/Renter Dashboard — 22 pages added to an existing Next.js 16 + Supabase app
**Researched:** 2026-03-13
**Confidence:** HIGH

## Executive Summary

This milestone is not a greenfield build — it is a data-wiring and feature-completion pass on a partially-built UK property portal. Scaffolded buyer/renter dashboard pages already exist with mock data, the core auth/routing layer is live, and upstream features (marketplace, messaging, AI engine) are in place. The central task is replacing every hardcoded array with real Supabase queries, creating ten missing database tables, building service layers for five new feature domains (viewings, offers, documents, referrals, AI matching), and shipping six net-new pages (AI match, alerts, checklist, calculator, brokers browse, referral tracker). The architecture is well-defined and the patterns are already established in the codebase.

The recommended approach follows the build order the architecture research prescribes: database migration and schema generation first, then service layer, then wiring existing pages to real data, then building net-new pages, and finally updating dashboard home stat cards. This order avoids the single most common failure mode for this type of milestone — shipping mock data that looks complete in a demo but fails for real users. Every page plan must have an explicit acceptance criterion of zero hardcoded data.

The most significant risks are security-related rather than technical. Buyer documents (passports, bank statements, AIP letters) require a private Supabase Storage bucket with ownership-enforced RLS and server-generated signed URLs — never public URLs. Offer state transitions must be enforced at the database level to prevent concurrent-mutation corruption. The `[role]` dynamic route segment currently auto-grants roles without verifying the active role matches the URL, creating an IDOR surface once real data is wired. The AI matching feature must default to SQL-based recommendations (zero Claude API cost) with the Claude-powered path gated behind caching and rate limiting. These are solvable with clear acceptance criteria and cannot be deferred to a polish pass.

## Key Findings

### Recommended Stack

The base stack is already installed. This milestone requires exactly four new packages: `react-day-picker@^9.14.0` (React 19-compatible calendar, wraps into the shadcn Calendar component), `date-fns@^4.1.0` (required peer dependency and used throughout for date formatting), `tus-js-client@^4.3.1` (resumable document uploads via Supabase's TUS endpoint — handles passport scans and bank statements reliably), and `nanoid@^5.1.6` (server-side referral code generation). Nothing else needs to be added. See `.planning/research/STACK.md` for the complete verified version matrix and what not to add.

**Core technologies for this milestone:**
- `react-day-picker@9` via `shadcn calendar`: Viewing schedule calendar grid — v9 required for React 19 compatibility; v8 does not work without peer-dep hacks
- `date-fns@4`: Date arithmetic throughout (tenancy dates, offer expiry, moving timeline) — also required by react-day-picker v9; versions npm-verified 2026-03-13
- `tus-js-client@4`: Resumable document uploads to Supabase Storage — handles files >6MB with progress callbacks and automatic retry
- `nanoid@5`: Server-side referral code generation — ESM-only, declare explicitly to pin version even though Next.js uses it internally
- `@tanstack/react-table` (already installed): Mortgage comparison table — no new library needed
- `recharts` RadialBarChart (already installed): AI match score gauge ring — no new library needed

### Expected Features

Feature research was benchmarked against Rightmove (MyRightmove), Redfin (Deal Room), and Zillow. All 22 pages are P1 — the milestone requires all of them to constitute a usable buyer/renter dashboard. See `.planning/research/FEATURES.md` for the full competitor matrix and feature dependency graph.

**Must have (table stakes):**
- Dashboard home with activity feed, saved/search counts, and recommended listings
- Saved properties with sort, remove, and side-by-side comparison
- Saved searches with CRUD and per-search alert frequency
- Viewing schedule, booking, reschedule, and cancel with state notifications
- Offers list, submit form with AIP attachment, and UK conveyancing pipeline status tracking
- Messages inbox and thread (reuse Epic 5 infrastructure — routing and buyer-context filter only)
- Document vault — upload ID, AIP, proof of funds; secure share link to agent
- Affordability calculator (front-end form: income + deposit to max borrowing + monthly payment)
- Broker, conveyancer, and surveyor browse pages (Epic 4 marketplace filtered views — backend already built)

**Should have (competitive differentiators):**
- AI property match with preference editor and scored results with explanation chips
- Moving checklist that auto-advances based on offer state (UK-specific conveyancing stages)
- UK conveyancing pipeline in offer tracking (vs. US-modelled tools on Redfin/Zillow)
- Referral tracker with referral link, referred-user list, and reward status
- Mortgage comparison via embedded Mojo/Habito widget or illustrative product table

**Defer to v1.x after validation:**
- Co-applicant property sharing (privacy-safe alternative to social sharing)
- Browser push notifications (requires service worker)
- Calendar sync (Google/Outlook) for viewing exports
- "Hot market" urgency signals (requires postcode velocity data)
- Full 4-property comparison (currently 2)

**Never build (anti-features):**
- Real-time UK mortgage rates from all lenders — API cost, ToS violations, FCA regulatory risk
- Full conveyancing case management — Britestate is not a regulated solicitor
- AVM per saved property — 10-15% error rates damage buyer trust
- Inline mortgage application initiation — FCA regulatory liability without broker licence

### Architecture Approach

This is an extend-not-rewrite task on a well-structured App Router monolith. The routing layer (`dashboard/[role]/layout.tsx`, middleware), dashboard service, and Redis caching are live and must not be modified except for targeted additions. The milestone follows a clear layered build order: DB migration generates TypeScript types that gate service layer development; services gate API route and page wiring; wired pages gate dashboard home stat card updates. Three rendering patterns from the existing codebase must be applied correctly to each new page: Server Component + direct Supabase call for read-heavy static pages, `"use client"` + TanStack Query + API route for interactive or live-updated data, and Server Actions for form submissions. See `.planning/research/ARCHITECTURE.md` for the full build dependency graph, data flow per feature, anti-patterns list, and the complete inventories of new tables and new API routes.

**Major components:**
1. **DB migration** (`supabase/migrations/20260313_buyer_renter_tables.sql`) — creates 10 missing tables, RLS policies, performance indexes, offer state machine CHECK constraints, and the viewing slot-booking RPC; generates updated `src/types/database.types.ts`
2. **Service layer** — five new service files (viewings, offers, buyer-documents, referrals, recommendations upgrade) plus extensions to the existing dashboard service
3. **Mock-to-real conversion** — five existing pages (`/viewings`, `/offers`, `/documents`, `/applications`, `/searches`) converted from hardcoded arrays to real service queries
4. **Net-new pages** — six new pages (`/ai-match`, `/alerts`, `/checklist`, `/calculator`, `/brokers`, `/referral`) following the appropriate rendering pattern for each domain
5. **Dashboard home updates** — `HomebuyerDashboard` and `RenterDashboard` types extended; stat cards wired to real counts from newly wired features

### Critical Pitfalls

1. **Mock data shipped as production-complete** — All five existing buyer/renter sub-pages contain hardcoded `const` arrays confirmed by codebase inspection. Acceptance criterion for every page plan: zero hardcoded data; all counts come from a real Supabase query. Playwright tests must use a real Supabase test user, not static DOM assertions.

2. **Missing database schema** — No tables exist for viewings, offers, buyer documents, AI match preferences, referrals, or moving checklists (confirmed in `supabase/migrations/`). Write and apply the single foundational migration in Plan 1 before any service code. Run `supabase gen types typescript` immediately after; commit the output; treat it as the single source of truth.

3. **`[role]` route authorization bypass** — The layout auto-grants roles but does not verify `user.active_role === role` (confirmed in `src/app/(protected)/dashboard/[role]/layout.tsx`). A homebuyer can navigate to `/dashboard/landlord/rent-collection`. Fix in Plan 1 security hardening before any real data is wired. RLS provides a second layer but the layout redirect must be correct.

4. **Private document bucket not enforced** — Buyer documents (passports, bank statements) must use a private Supabase Storage bucket with user-UID-prefixed paths and server-generated signed URLs (1-hour expiry). `getPublicUrl()` on a private bucket must never appear in the codebase. Bucket and RLS policy defined in the DB migration plan, not deferred.

5. **Offer state machine without DB enforcement** — Concurrent mutations (agent accepts while buyer withdraws) corrupt offer state without a DB-level CHECK constraint and optimistic locking on transitions. A unique partial index prevents duplicate active offers. State transitions enforced server-side only — the client never supplies `newStatus` directly.

6. **AI match fires Claude API on every page load** — Default results must use SQL-based matching (zero Claude cost). AI-enhanced results only regenerate on explicit user request, cached in `ai_match_results` with `generated_at` timestamp (24-hour TTL), rate-limited to 3 regenerations per user per day via Upstash.

7. **Mortgage rates presented without FCA disclaimer** — All rate displays must carry a non-dismissable "Illustrative rates only — not a financial offer" banner. The page title is "Mortgage Calculator," not "Compare Mortgage Rates." Seed data flagged `is_illustrative: true`. No copy claiming rates are from real lenders.

8. **Viewing double-bookings** — Slot booking must be a single Supabase RPC (atomic check + increment + insert) to prevent TOCTOU race conditions. Two separate Supabase calls (read availability, then insert) are not safe.

## Implications for Roadmap

Based on combined research, the milestone should be structured in five phases following the architecture's build dependency graph. The order is non-negotiable: each phase gates the next.

### Phase 1: Database Foundation and Security Hardening
**Rationale:** All other work is blocked until the schema exists and TypeScript types are generated from it. The role authorization bypass must be fixed before real data is wired — it cannot be deferred. This is the highest-leverage plan in the milestone.
**Delivers:** Migration with all 10 new tables, RLS policies, performance indexes, offer state machine constraints, viewing slot-booking RPC; generated `database.types.ts`; `[role]` layout role equality check; `buyer-documents` private Storage bucket with ownership RLS
**Addresses:** Unblocks all 22 feature pages
**Avoids:** Mock data shipping (tables do not exist, so service layer cannot be written without them); role authorization bypass (security fix before data wiring); Storage document exposure (bucket and RLS defined before document service is built)

### Phase 2: Service Layer
**Rationale:** With schema and generated types in place, service files can be written cleanly against real column names. Building services before pages ensures pages are never temporarily wired to placeholder logic.
**Delivers:** `viewings-service.ts`, `offers-service.ts`, `buyer-documents-service.ts`, `referral-service.ts`, extended `dashboard-service.ts`, extended `recommendations.ts`
**Uses:** Supabase server client, TanStack Query patterns from existing codebase, Upstash rate limiting for AI match refresh endpoint
**Implements:** Offer state machine enforcement (valid transitions only), viewing slot RPC call, document signed-URL generation pattern, SQL-based recommendation queries

### Phase 3: Wire Existing Pages to Real Data
**Rationale:** Highest impact at lowest risk — converts the five mock-data pages to production-ready pages without creating new routes. Validates the service layer against real data immediately and unblocks integration tests on core buyer flows.
**Delivers:** `/viewings`, `/offers`, `/documents`, `/applications`, `/searches` converted from `const mockData` to real Supabase queries
**Avoids:** Mock data shipping pitfall — this phase exists specifically to eliminate all hardcoded `const` arrays from page files
**Implements:** Pattern 1 (Server Component + direct Supabase) and Pattern 2 (`"use client"` + TanStack Query + API route) from architecture research, applied to the correct page for each

### Phase 4: Net-New Pages
**Rationale:** No pre-existing scaffold to modify — these are fully new routes. Building them after the service layer means they have real data from day one and follow established patterns.
**Delivers:** `/ai-match`, `/alerts`, `/checklist`, `/calculator`, `/brokers`, `/referral`
**Uses:** `react-day-picker` (Shadcn Calendar), `tus-js-client` (document upload, pattern established in Phase 3), `nanoid` (referral codes, service created in Phase 2)
**Implements:** AI match with SQL-based recommendations (pgvector upgrade deferred to a later iteration); affordability calculator as pure client-side math (no backend dependency — can be built any time for early wins); broker/conveyancer/surveyor browse as Epic 4 marketplace filtered views with no new backend work

### Phase 5: Dashboard Home Integration
**Rationale:** Stat cards on the dashboard home (`HomebuyerDashboard`, `RenterDashboard`) should reflect real counts from the now-wired features. Building this last means the counts are accurate from the moment they ship.
**Delivers:** Extended `HomebuyerDashboard` and `RenterDashboard` types, updated `buildHomebuyerDashboard()` and `buildRenterDashboard()` methods, real stat counts for pending offers, upcoming viewings, AI match count, and referral conversion count
**Depends on:** Phases 1-3 so that counts are real and not zero from missing data

### Phase Ordering Rationale

- Database-first order eliminates the most common failure mode: service code written against an imagined schema diverges from the actual migration. TypeScript compilation failing on missing table references is the enforcement mechanism.
- Security fixes (role authorization, Storage RLS) are in Phase 1 because they cannot be safely patched after real user PII exists in the system.
- Existing-page wiring before new-page creation ensures the hardest technical problem (replacing mock data correctly) is solved before the easier problem (building new pages from scratch).
- The affordability calculator is the one exception to the strict phase order — it is purely client-side math with no backend dependency and can be built independently in any phase if the team needs an early win.

### Research Flags

Phases that need careful planning attention before implementation begins:
- **Phase 1 (DB migration):** The offer state machine CHECK constraints and the viewing slot-booking RPC require PostgreSQL transaction expertise. The migration must be reviewed for the atomic booking pattern and optimistic locking approach before it is applied. ARCHITECTURE.md has implementation code examples to follow exactly.
- **Phase 3 (document upload wiring):** The `tus-js-client` + Supabase Storage TUS endpoint integration has specific required headers (`Authorization`, `x-upsert`) and a signed upload URL flow that differs from the standard Supabase Storage client upload. STACK.md section on tus-js-client integration must be followed precisely.
- **Phase 4 (AI match):** The pgvector HNSW index and embedding pipeline are explicitly deferred. Do not wire the preferences form to a live Claude API call. SQL-based recommendations are the v3.1 target; ARCHITECTURE.md Pattern 7 defines the exact query.

Phases with standard well-documented patterns where additional research is unlikely to be needed:
- **Phase 2 (service layer):** Follows existing patterns in the codebase — `viewings-service.ts` mirrors `saved-properties-service.ts` structurally.
- **Phase 5 (dashboard home):** Extends existing types and service methods with new count fields. Low complexity, no novel patterns.
- **Broker/conveyancer/surveyor browse pages (Phase 4):** These are filtered views of the existing `/api/providers/search` endpoint with `category` query param. No new backend work.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Four new packages version-pinned from live npm registry (2026-03-13); existing packages verified in package.json; React 19 compatibility confirmed for react-day-picker v9 |
| Features | HIGH | Benchmarked against Rightmove, Redfin, and Zillow; cross-referenced with Britestate PRD Section 3.4; UK-specific requirements (AIP, proof of funds, conveyancing stages) verified against UK property sources |
| Architecture | HIGH | Derived from live codebase inspection — not assumptions; mock data confirmed in viewings/offers/documents pages; missing tables confirmed in migrations directory; existing patterns (TanStack Query, Server Actions, Redis caching) verified in source files |
| Pitfalls | HIGH | Mock data and missing schema confirmed by direct file inspection; role authorization gap confirmed in `layout.tsx` source; CVE-2025-29927 referenced with Next.js 16.1.6 confirmed patched; Storage security pitfalls from official Supabase docs; React Query mutation pitfalls from TkDodo maintainer guides |

**Overall confidence:** HIGH

### Gaps to Address

- **Mortgage comparison data source:** Whether to embed a Mojo/Habito widget or build an internal illustrative product table is unresolved. Either is acceptable for v3.1. Decision should be made at the start of the financial tools plan based on third-party partner availability. The regulatory constraint (illustrative only, no real lender rates) is firm regardless.
- **Viewing slot availability from the seller side:** The booking flow requires sellers/agents to have pre-created availability slots in the `viewing_slots` table. If the seller/agent dashboard has not yet shipped slot creation, the buyer booking flow will have nothing to book against. Verify this is in scope for a concurrent milestone before implementing the buyer booking UI.
- **Referral code backfill for existing users:** The `referral_codes` migration creates codes for new users on registration. Existing users created before this migration need either a backfill script or auto-generation on first dashboard visit. Confirm approach in Plan 1 before writing the migration.
- **pgvector embeddings as an upgrade path:** The switch from SQL-based to vector-based recommendations requires property embeddings to be populated. Deferred from this milestone; should be tracked as a follow-on task when property data volumes justify it.

## Sources

### Primary (HIGH confidence)
- Live codebase inspection — `src/app/(protected)/dashboard/[role]/viewings/page.tsx`, `offers/page.tsx`, `documents/page.tsx`, `layout.tsx`, `supabase/migrations/`, `src/services/`, `src/types/dashboard.ts` — confirms mock data, missing tables, role auth gap
- `npm view` commands run 2026-03-13 — react-day-picker v9.14.0, date-fns v4.1.0, tus-js-client v4.3.1, nanoid v5.1.6
- daypicker.dev — v9 React 19 compatibility, feature set, shadcn integration
- supabase.com/docs/guides/storage/uploads/resumable-uploads — TUS endpoint, tus-js-client integration patterns
- supabase.com/docs/guides/storage/security/access-control — private bucket RLS policies
- github.com/gpbl/react-day-picker issues — React 19 compatibility confirmed fixed at v9.4.3
- ui.shadcn.com/charts/radial — RadialBarChart score display pattern using existing Recharts
- CVE-2025-29927 (Next.js middleware authorization bypass, CVSS 9.1) — Next.js 16.1.6 confirmed patched
- Britestate PRD 2026 — Section 3.4 Role-Specific Dashboards (homebuyer + renter)

### Secondary (MEDIUM confidence)
- Rightmove Help Centre — MyRightmove features, property alerts, saved searches, sent enquiries tracking
- Redfin Support — Deal Room overview, pre-approval upload, document upload
- TkDodo — Mastering Mutations in React Query; Concurrent Optimistic Updates in React Query
- Homemove.com — UK conveyancing process timeline and stages
- PropertyBuyersToday / GetAgent — AIP and proof of funds requirements in UK property transactions
- Revival Pixel — UK property portal UX best practices 2026
- Numalis / Idea Usher — AI property recommendation patterns

### Tertiary (LOW confidence — needs validation before use)
- Moneyfacts Group API — referenced as the correct UK mortgage rate data source for a future paid integration; not evaluated for cost or contract feasibility in this research pass
- pgvector benchmarks (DataCraft-Innovations) — HNSW index performance at 5K+ embeddings; relevant only when AI match is upgraded from SQL to vector path

---
*Research completed: 2026-03-13*
*Supersedes previous SUMMARY.md (2026-03-06) which covered the full project; this version covers the v3.1 Buyer/Renter Dashboard milestone specifically*
*Ready for roadmap: yes*
