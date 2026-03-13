# Roadmap: Britestate v3.0

## Overview

Britestate v3.0 is built in 7 phases. Each phase delivers a complete, verifiable capability. The build order prioritizes getting users into the system (auth), giving them something to search (listings), giving each role a home with communication (dashboards + messaging), enabling the service marketplace, layering AI and financial tools, adding landlord workflows, and hardening for production.

**Amended specs:** Epics 4-11 use cost-optimized `epicNfinal.md` specs. Epics 1-3 use originals. Total monthly infrastructure target: ~$50/mo at launch, scaling to ~$800/mo at 100K MAU.

## Milestones

- ✅ **v3.0 Core Platform** - Phases 1-7 (in progress, 4 phases complete)
- 🚧 **v3.1 Buyer/Renter Dashboard** - Phases 8-12 (roadmap ready)

## Phases

<details>
<summary>✅ v3.0 Core Platform (Phases 1-7) - IN PROGRESS</summary>

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Auth, GDPR, database schema, security, public pages (Epic 1) (completed 2026-03-07)
- [ ] **Phase 2: Property Portal** - Search, listings, map, image pipeline (Epic 2)
- [ ] **Phase 3: Dashboards & Communication** - Role dashboards, messaging, notifications, milestones (Epic 3 + Epic 5)
- [ ] **Phase 4: Marketplace** - Provider profiles, RFQ, quotes, bookings, reviews (Epic 4)
- [ ] **Phase 5: AI & Financial Tools** - AI descriptions, SQL recommendations, calculators, affordability (Epic 6 + Epic 8)
- [x] **Phase 6: Landlord Tools** - Portfolio, tenants, maintenance, compliance, rent tracking (Epic 7) (completed 2026-03-07)
- [ ] **Phase 7: Production Readiness** - PWA, admin panel, monitoring, security, launch (Epic 9 + Epic 10 + Epic 11)

### Phase 1: Foundation
**Goal**: Users can create accounts, authenticate securely, select and switch between roles, and have their GDPR preferences respected from day one
**Depends on**: Nothing (first phase)
**Epic**: 1 (`docs/claude epic 1 review.txt`)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10, AUTH-11, AUTH-12, AUTH-13, AUTH-14, AUTH-15, AUTH-16, AUTH-17, AUTH-18, AUTH-19
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password or Google/Apple OAuth, verify their email, and log back in with session persisting across browser refresh
  2. User can select one or more roles at registration and switch between active roles, with the correct dashboard shell loading for each role
  3. Provider verification pipeline advances through stages (email, phone, ID, insurance, qualifications) with admin review gate
  4. GDPR consent is captured at signup with granular options, user can export their data as JSON, and user can request account deletion
  5. All consent changes are recorded in an audit trail
  6. CSP headers, RBAC middleware, and public pages (home, about, terms, privacy) are in place
**Plans**: 9 plans

Plans:
- [x] 01-01-PLAN.md -- Project setup: dependencies, design system, Shadcn UI, Supabase clients, test infra
- [ ] 01-02-PLAN.md -- Database schema: migration SQL, TypeScript types, RLS policies, constants
- [ ] 01-03-PLAN.md -- Auth service layer: auth-service, useAuth hook, PKCE callback, tests
- [ ] 01-04-PLAN.md -- Auth UI pages: login, register, forgot-password, reset-password, verify-email
- [ ] 01-05-PLAN.md -- Security middleware: CSP Level 3, RBAC route protection, security headers
- [ ] 01-06-PLAN.md -- Layout & public pages: responsive shell, homepage, about, terms, privacy, error pages
- [ ] 01-07-PLAN.md -- Roles & dashboards: role selection, multi-role switching, dashboard shells, verification levels
- [ ] 01-08-PLAN.md -- GDPR compliance: consent capture, data export, account deletion, audit trail
- [ ] 01-09-PLAN.md -- Provider verification pipeline, security settings, end-to-end integration checkpoint

### Phase 2: Property Portal
**Goal**: Users can search for properties by location and filters, view listings on an interactive map, and agents/sellers can create and manage property listings with images
**Depends on**: Phase 1
**Epic**: 2 (`docs/claude epic 2.txt`)
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05, SRCH-06, SRCH-07, SRCH-08, SRCH-09, SRCH-10, SRCH-11, SRCH-12, LIST-01, LIST-02, LIST-03, LIST-04, LIST-05, LIST-06, LIST-07, LIST-08
**Success Criteria** (what must be TRUE):
  1. User can search properties by location (postcode/area), apply filters (type, price, bedrooms, EPC), sort results, and save properties to a shortlist
  2. User can search via interactive map with clustered pins (MapLibre + MapTiler), draw a custom search polygon, and click pins to view listing details
  3. Agent or seller can create a full property listing with photos (up to 30, client-side compressed), floor plans, pricing qualifiers, and view listing analytics
  4. User can save search criteria and receive alerts for new matching properties
  5. Search uses optimized queries (materialized views, full-text search, cursor-based pagination)
**Plans**: 7 plans

Plans:
- [ ] 02-01-PLAN.md -- Dependencies, database migration (PostGIS, FTS, materialized view), TypeScript types, test mocks
- [ ] 02-02-PLAN.md -- Search service, geocoding (postcodes.io), search API route, client hooks (nuqs + react-query)
- [ ] 02-03-PLAN.md -- Listing CRUD service, image upload pipeline (compression + sharp + storage), API routes
- [ ] 02-04-PLAN.md -- Map integration: MapLibre + clustering + polygon draw-to-search (terra-draw)
- [ ] 02-05-PLAN.md -- Saved properties (shortlist) and saved searches with alert checking
- [ ] 02-06-PLAN.md -- Search page UI (list/map/split views) + property detail page + visual checkpoint
- [ ] 02-07-PLAN.md -- Listing management UI (multi-step form, image uploader) + dashboard pages (saved, searches, analytics)

### Phase 3: Dashboards & Communication
**Goal**: Each of the 6 user roles has a dedicated dashboard, and users can message each other, receive notifications, and track transaction/job milestones
**Depends on**: Phase 2
**Epics**: 3 (`docs/epic3mkd claude.txt`) + 5 (`docs/epic5final.md`)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-09, DASH-10, DASH-11, DASH-12, DASH-13, DASH-14, COM-01, COM-02, COM-03, COM-04, COM-05, COM-06, COM-07, COM-08, COM-09, COM-10, COM-11, COM-12, COM-13, COM-14, COM-15
**Success Criteria** (what must be TRUE):
  1. Each role (homebuyer, renter, seller, landlord, agent, provider) has a dashboard with relevant overview data, loaded via aggregated API with caching
  2. Users can manage their profile with photo upload and role-specific fields
  3. User can send and receive messages from listings/bookings context with file attachments, view inbox (polling-based, 30s), and track per-conversation read status
  4. AI quote drafting works for tradespeople and agents via Claude Haiku
  5. In-app notification feed and email notifications (immediate critical + daily digest) are functional with user preferences
  6. Transaction milestones (8-step) and service job milestones (5-step) display progress
**Plans**: 10 plans

Plans:
- [ ] 03-01-PLAN.md -- Dependencies, TypeScript types, database migration for Phase 3 tables
- [ ] 03-02-PLAN.md -- Redis client, sanitization utils, image compression, React Query provider, test mocks
- [ ] 03-03-PLAN.md -- Profile management: CRUD, avatar upload, provider profile, notification preferences
- [ ] 03-04-PLAN.md -- Messaging system: inbox polling, message threads, attachments, contact form, read status
- [ ] 03-05-PLAN.md -- Notification system: event-based feed, email notifications, daily digest, preferences
- [ ] 03-06-PLAN.md -- Dashboard infrastructure: aggregated API, Redis caching, activity feed, Realtime
- [ ] 03-07-PLAN.md -- AI quote drafting: Claude Haiku service, rate card, market pricing seed data
- [ ] 03-08-PLAN.md -- Milestones and files: transaction pipeline, job pipeline, files tab
- [ ] 03-09-PLAN.md -- Role-specific dashboards: 6 dashboard pages with widgets and stat cards
- [ ] 03-10-PLAN.md -- Integration: layout wiring, navigation, unit tests, visual checkpoint

### Phase 4: Marketplace
**Goal**: Users can find, compare, and hire verified service providers through an RFQ-to-booking pipeline with reviews
**Depends on**: Phase 3
**Epic**: 4 (`docs/epic4final.md`)
**Requirements**: MKT-01, MKT-02, MKT-03, MKT-04, MKT-05, MKT-06, MKT-07, MKT-08, MKT-09, MKT-10, MKT-11, MKT-12, MKT-13, MKT-14
**Success Criteria** (what must be TRUE):
  1. Provider can set up profile with business info, services, coverage area, pricing, and upload verification documents
  2. User can create an RFQ with requirements and budget, and system matches up to 10 providers by category and proximity
  3. Providers can respond with itemized quotes, users can compare quotes side-by-side, and accept/book
  4. Booking state machine works (pending -> confirmed -> in_progress -> completed) with conflict detection
  5. Users can leave multi-dimensional reviews, providers can respond, and rule-based spam detection filters content
**Plans**: 8 plans

Plans:
- [ ] 04-01-PLAN.md -- Database schema: marketplace migration, TypeScript types, Zod validation schemas
- [ ] 04-02-PLAN.md -- Utilities: Inngest setup, geocoding, file validator, state machine, sentiment/spam analyzers
- [ ] 04-03-PLAN.md -- Provider profiles: service layer, search API, document upload API
- [ ] 04-04-PLAN.md -- RFQ/Quote pipeline: RFQ creation, provider matching, quote CRUD, Inngest notifications
- [ ] 04-05-PLAN.md -- Bookings: state machine transitions, conflict detection, availability calendar
- [ ] 04-06-PLAN.md -- Reviews: multi-dimensional ratings, sentiment analysis, moderation queue, helpfulness voting
- [ ] 04-07-PLAN.md -- UI: public marketplace pages, search components, RFQ/quote forms, quote comparison
- [ ] 04-08-PLAN.md -- UI: dashboard pages, booking/review/provider components, visual checkpoint

### Phase 5: AI & Financial Tools
**Goal**: Platform has AI property descriptions, SQL-based recommendations, property valuations from public data, and client-side financial calculators with personalized affordability display
**Depends on**: Phase 2
**Epics**: 6 (`docs/epic6final.md`) + 8 (`docs/epic8final.md`)
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, FIN-01, FIN-02, FIN-03, FIN-04, FIN-05, FIN-06
**Success Criteria** (what must be TRUE):
  1. AI service layer wraps Claude API with token tracking, rate limiting, and daily spend kill switch
  2. Agents/sellers can generate AI property descriptions from listing attributes with 3 tone options (max 3 regenerations)
  3. Users see SQL-based property recommendations from saved searches/properties (no AI cost)
  4. Property detail pages show Land Registry Price Paid Data (free public data)
  5. Mortgage calculator and SDLT calculator work client-side with real-time results
  6. Property listing cards show personalized "Est. X/mo" based on user's saved mortgage parameters
**Plans**: 4 plans

Plans:
- [ ] 05-01-PLAN.md -- AI service layer: Claude wrapper, rate limiting, description generation, feedback
- [ ] 05-02-PLAN.md -- Calculator libs (TDD): mortgage amortization, SDLT with current HMRC rates
- [ ] 05-03-PLAN.md -- Zero-cost intelligence: SQL recommendations, Land Registry data, smart replies
- [ ] 05-04-PLAN.md -- Calculator UI: tool pages, mortgage params hook, personalized estimates, offer letter PDF

### Phase 6: Landlord Tools
**Goal**: Landlords can manage their rental portfolio with tenant records, maintenance tracking, financial logging, compliance reminders, and lease generation
**Depends on**: Phase 3, Phase 4
**Epic**: 7 (`docs/epic7final.md`)
**Requirements**: LL-01, LL-02, LL-03, LL-04, LL-05, LL-06, LL-07, LL-08, LL-09, LL-10
**Success Criteria** (what must be TRUE):
  1. Landlord can view portfolio of managed rental properties and add tenant records with lease details
  2. Landlord can log maintenance requests with status tracking, photo uploads, and assign contractors via marketplace link
  3. Landlord can manually track rent payments (paid/partial/overdue) and log expenses with optional receipts
  4. Landlord can upload compliance documents with expiry dates and receive automated reminders (30-day, 7-day)
  5. Landlord can generate a standard AST lease agreement PDF client-side and view per-property financial summary
**Plans**: 5 plans

Plans:
- [ ] 06-01-PLAN.md -- Database schema, TypeScript types, Zod schemas, shared utilities (file validation, rent period, image compression)
- [ ] 06-02-PLAN.md -- Portfolio view and tenancy management: services, API routes, UI pages
- [ ] 06-03-PLAN.md -- Maintenance requests and contractor assignment: services, API routes, UI pages
- [ ] 06-04-PLAN.md -- Financial tracking: rent payments, expense logging, financial summary with RPC
- [ ] 06-05-PLAN.md -- Document management, compliance reminders, AST lease PDF generation

### Phase 7: Production Readiness
**Goal**: The application is production-hardened with PWA capabilities, a lightweight admin panel, monitoring, security verification, and launch readiness -- all on free tiers
**Depends on**: Phase 6
**Epics**: 9 (`docs/epic9final.md`) + 10 (`docs/epic10final.md`) + 11 (`docs/epic11final.md`)
**Requirements**: MOB-01, MOB-02, MOB-03, MOB-04, MOB-05, MOB-06, MOB-07, MOB-08, MOB-09, MOB-10, MOB-11, ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06, ADM-07, ADM-08, ADM-09, ADM-10, LCH-01, LCH-02, LCH-03, LCH-04, LCH-05, LCH-06, LCH-07, LCH-08, LCH-09, LCH-10, LCH-11, LCH-12, LCH-13, LCH-14, LCH-15
**Success Criteria** (what must be TRUE):
  1. App is installable as PWA with push notifications (Web Push API), offline saved properties, and responsive across all breakpoints
  2. Touch interactions are optimized (44px targets, swipe, pull-to-refresh) with role-specific mobile bottom nav
  3. Admin panel (route group) allows user management, post-moderation of listings, provider verification queue, and review moderation
  4. Sentry (errors) and PostHog (analytics) are integrated on free tiers; structured JSON logging outputs to Vercel
  5. RLS policy audit complete, Dependabot enabled, OWASP ZAP scan run, Artillery load test passes
  6. UAT complete across all roles, cross-browser verified, legal/compliance reviewed, launch runbook documented
**Plans**: 10 plans

Plans:
- [ ] 07-01-PLAN.md -- PWA infrastructure: manifest, Serwist service worker, install prompt, offline indicator
- [ ] 07-02-PLAN.md -- Monitoring and DevOps: Sentry, PostHog, structured logger, feature flags, migration CI
- [ ] 07-03-PLAN.md -- Admin foundation: database schema (is_admin, content_reports), middleware guard, dashboard with count cards
- [ ] 07-04-PLAN.md -- Push notifications: Web Push API, VAPID subscription, deep linking, offline data caching
- [ ] 07-05-PLAN.md -- Admin backend: profanity filter, moderation service, admin service extensions (TDD)
- [ ] 07-06-PLAN.md -- Help page FAQ, contact form with rate limiting, role-specific mobile bottom tab bar
- [ ] 07-07-PLAN.md -- Responsive verification, touch optimization (44px targets), pull-to-refresh, Core Web Vitals audit
- [ ] 07-08-PLAN.md -- Security hardening: RLS policy audit, Dependabot config, OWASP ZAP scan script
- [ ] 07-09-PLAN.md -- Launch prep: Artillery load test, UAT seed data and scenarios, cross-browser checklist, launch and support runbooks
- [ ] 07-10-PLAN.md -- Admin management UI: user search/suspend, moderation queue, verification queue, review moderation pages

</details>

---

### 🚧 v3.1 Buyer/Renter Dashboard (Phases 8-12)

**Milestone Goal:** Deliver all 22 Buyer/Renter Dashboard pages at FAANG quality — full frontend + backend + browser-tested, speed-first. Replace every mock data array with real Supabase queries, build service layers for five new feature domains, and ship six net-new pages.

- [ ] **Phase 8: DB Foundation & Security** - Migration (10 new tables), RLS, role auth fix, npm packages
- [ ] **Phase 9: Wire Existing Pages** - Dashboard home, saved properties/searches, alerts, viewings display, messages inbox, pro browse, affordability calc
- [ ] **Phase 10: Viewings Booking, Offers & Documents** - Booking/reschedule/cancel flows, offer submit + status tracking, document vault, moving checklist
- [ ] **Phase 11: AI Match** - Preferences editor, cached results, SQL-based scoring, match reason display
- [ ] **Phase 12: Financial & Referral** - Mortgage comparison widget, referral code generation and tracker

## Phase Details

### Phase 8: DB Foundation & Security
**Goal**: All 10 new database tables exist with RLS policies and the role authorization bypass is eliminated, unblocking every subsequent phase from being built on real data
**Depends on**: Phase 7 (v3.0 core platform)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):
  1. All 10 new tables (viewings, viewing_slots, offers, offer_status_history, user_documents, ai_match_preferences, ai_match_results, moving_checklist_items, referral_codes, referral_conversions) exist in Supabase with RLS policies enforcing row ownership
  2. A homebuyer navigating to /dashboard/landlord/rent-collection is redirected to their own dashboard, not served landlord data
  3. Every buyer dashboard Server Component calls supabase.auth.getUser() server-side and returns 401 if not authenticated, independent of middleware
  4. The buyer-documents Supabase Storage bucket is private; no path returns a public URL; all access uses server-generated signed URLs
**Plans**: TBD

Plans:
- [ ] 08-01-PLAN.md -- DB migration: 10 tables, RLS policies, indexes, offer state machine constraints, viewing slot-booking RPC; supabase gen types
- [ ] 08-02-PLAN.md -- Security hardening: role route authorization fix in [role] layout, server-side auth guards on all buyer API routes, private documents bucket, npm package installation

### Phase 9: Wire Existing Pages
**Goal**: The buyer/renter dashboard home, saved content, viewing schedule, messages, and professional browse pages all show real data from Supabase — zero hardcoded arrays remain
**Depends on**: Phase 8
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, DISC-08, VIEW-01, VIEW-02, COMMS-01, COMMS-02, FIN-02, FIN-03, FIN-04, TOOLS-06
**Success Criteria** (what must be TRUE):
  1. Dashboard home stat cards (saved count, upcoming viewings, active offers, unread messages) display real counts from the database that update when underlying data changes
  2. Activity feed shows real events (price changes, new matches, viewing confirmations) drawn from the platform_events table, not a hardcoded array
  3. Saved Properties page shows the authenticated user's actual saved properties with working sort-by-date/price, remove, and 3-property side-by-side comparison
  4. Saved Searches page shows real saved searches with editable criteria, deletable entries, and per-search alert frequency toggle (instant/daily/weekly/off)
  5. Messages Inbox lists real conversations using the existing Epic 5 messaging infrastructure with unread count badges; Message Thread shows real message history
  6. Browse Mortgage Brokers, Conveyancers, and Surveyors pages return real provider results filtered from the Epic 4 marketplace by category parameter
**Plans**: TBD

Plans:
- [ ] 09-01-PLAN.md -- Service layer: dashboard-service extensions (real stat counts), recommendations-service (SQL-based), saved-properties-service wiring
- [ ] 09-02-PLAN.md -- Wire saved properties, saved searches, alerts, notification centre pages to real Supabase queries
- [ ] 09-03-PLAN.md -- Wire viewings list/calendar display (VIEW-01, VIEW-02), messages inbox and thread wrappers (COMMS-01, COMMS-02)
- [ ] 09-04-PLAN.md -- Pro browse pages (FIN-02/03/04), affordability calculator client-side page (TOOLS-06), dashboard home wiring (DISC-01 to DISC-03)

### Phase 10: Viewings Booking, Offers & Documents
**Goal**: Buyers can book, reschedule, and cancel viewings; submit offers with AIP document attached; track their offer through the UK conveyancing pipeline; and manage a private document vault
**Depends on**: Phase 9
**Requirements**: VIEW-03, VIEW-04, VIEW-05, OFFR-01, OFFR-02, OFFR-03, OFFR-04, OFFR-05, COMMS-03, COMMS-04, COMMS-05, COMMS-06, TOOLS-01
**Success Criteria** (what must be TRUE):
  1. User can select an available viewing slot from agent-published availability, choose in-person or virtual, submit the booking via the atomic slot RPC, and receive a confirmation email
  2. User can reschedule or cancel a viewing (with reason) and receive email confirmation for each state change
  3. User can submit an offer with amount, conditions, solicitor details, and an optional AIP document attachment; the offer appears immediately in the Offers Sent page with Submitted status
  4. Offer status progresses through the 7-stage UK conveyancing pipeline (Offer Submitted through Completion) with server-side enforced transitions and an audit trail in offer_status_history; user can withdraw a pending offer
  5. User can upload documents (ID, proof of funds, AIP letter) using TUS resumable upload with a visible progress indicator; documents are stored in the private bucket with ownership-enforced RLS
  6. Document previews load via 1-hour signed URLs; document status (uploaded/verified/pending review) is visible; moving checklist items are pre-populated and update their checked state as offer stage advances
**Plans**: TBD

Plans:
- [ ] 10-01-PLAN.md -- Service layer: viewings-service (slot RPC, reschedule, cancel), email confirmations for viewing state changes
- [ ] 10-02-PLAN.md -- Viewing booking UI: slot picker calendar (react-day-picker), in-person/virtual toggle, confirm/reschedule/cancel flows
- [ ] 10-03-PLAN.md -- Service layer: offers-service (submit, state transitions, withdrawal, audit trail), offer status API routes
- [ ] 10-04-PLAN.md -- Offers UI: offers list with status badges, submit offer form with AIP attachment, 7-stage conveyancing pipeline tracker, withdraw action
- [ ] 10-05-PLAN.md -- Service layer: buyer-documents-service (TUS upload, signed URL generation, status), moving checklist service
- [ ] 10-06-PLAN.md -- Documents UI: upload interface with TUS progress bar, document list with status badges, signed URL previews; Moving Checklist page with stage-linked checkboxes

### Phase 11: AI Match
**Goal**: Buyers can set property match preferences and see AI-scored results with match reason explanations, without Claude API being called on every page load
**Depends on**: Phase 9
**Requirements**: TOOLS-02, TOOLS-03, TOOLS-04, TOOLS-05
**Success Criteria** (what must be TRUE):
  1. User can edit AI Property Match preferences (location, budget, bedrooms, must-haves, lifestyle factors including commute destination, school priority, garden importance) and save them to the ai_match_preferences table
  2. AI Match results page shows properties ranked by match score with match reason tooltip chips explaining why each property scored as it did
  3. Results are served from the ai_match_results cache (24-hour TTL) on page load — the Claude API is never called on a plain page visit, only on explicit user-triggered refresh (rate-limited to 3 per day)
  4. When pgvector embeddings are unavailable, the page falls back to SQL-based heuristic scoring (preference field count matches) and still shows ranked results with reasons
**Plans**: TBD

Plans:
- [ ] 11-01-PLAN.md -- AI match service: SQL-based scoring query, result caching in ai_match_results (24h TTL), Upstash rate limiter for refresh endpoint, pgvector fallback detection
- [ ] 11-02-PLAN.md -- AI Match UI: preferences editor form, results page with RadialBarChart score gauge, match reason tooltip chips, refresh button with rate-limit feedback

### Phase 12: Financial & Referral
**Goal**: Buyers can access a mortgage comparison tool pre-filled from their affordability calc inputs, and can generate and share a referral link whose conversions are tracked in the database
**Depends on**: Phase 9
**Requirements**: FIN-01, REF-01, REF-02, REF-03
**Success Criteria** (what must be TRUE):
  1. Mortgage Comparison page embeds the Mojo/Habito widget (or displays an illustrative product table) with a non-dismissable "Illustrative rates only — not a financial offer" banner; affordability calculator values are pre-filled as URL parameters when navigating from the calculator page
  2. User can generate a unique referral link backed by a nanoid code stored in the referral_codes table; the link is copyable from the Referral Tracker page
  3. Referral Tracker page shows total signups, and per-referral status (pending/converted), all drawn from real referral_conversions rows
  4. New user signups via a referral link record the referring user ID in referral_conversions with correct attribution
**Plans**: TBD

Plans:
- [ ] 12-01-PLAN.md -- Referral service: nanoid code generation, referral_codes insert/fetch, referral_conversions recording on signup, referral tracker API route
- [ ] 12-02-PLAN.md -- Referral Tracker UI: link display with copy button, signup count, per-referral status list; Mortgage Comparison page with widget embed and FCA disclaimer banner

## Progress

**Execution Order:**
v3.0 phases: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 (Phase 5 can run parallel to 3-4)
v3.1 phases: 8 -> 9 -> 10 -> 11 -> 12 (Phase 11 and 12 can run parallel after Phase 9)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v3.0 | 9/9 | Complete | 2026-03-07 |
| 2. Property Portal | v3.0 | 2/7 | In Progress | - |
| 3. Dashboards & Communication | v3.0 | 8/10 | In Progress | - |
| 4. Marketplace | v3.0 | 6/8 | In Progress | - |
| 5. AI & Financial Tools | v3.0 | 3/4 | In Progress | - |
| 6. Landlord Tools | v3.0 | 5/5 | Complete | 2026-03-07 |
| 7. Production Readiness | v3.0 | 9/10 | In Progress | - |
| 8. DB Foundation & Security | v3.1 | 0/2 | Not started | - |
| 9. Wire Existing Pages | v3.1 | 0/4 | Not started | - |
| 10. Viewings Booking, Offers & Docs | v3.1 | 0/6 | Not started | - |
| 11. AI Match | v3.1 | 0/2 | Not started | - |
| 12. Financial & Referral | v3.1 | 0/2 | Not started | - |

---
*Roadmap created: 2026-03-06*
*Rebuilt: 2026-03-07 (aligned to amended epic specs)*
*Phase 1 planned: 2026-03-07 (9 plans, 4 waves) -- revised from 7 plans after scope checker split*
*Phase 4 planned: 2026-03-07 (7 plans, 4 waves)*
*Phase 4 revised: 2026-03-07 (8 plans, 4 waves) -- split Plan 07 into 07+08 per scope checker*
*Phase 3 planned: 2026-03-07 (10 plans, 4 waves)*
*Phase 2 planned: 2026-03-07 (7 plans, 4 waves)*
*Phase 5 planned: 2026-03-07 (4 plans, 2 waves)*
*Phase 6 planned: 2026-03-07 (5 plans, 3 waves)*
*Phase 7 planned: 2026-03-07 (9 plans, 4 waves)*
*Phase 7 revised: 2026-03-07 (10 plans, 4 waves) -- split Plan 05 into 05+10 per scope checker*
*v3.1 milestone phases 8-12 added: 2026-03-13*
