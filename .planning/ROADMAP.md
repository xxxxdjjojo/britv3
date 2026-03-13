# Roadmap: Britestate v3.0

## Overview

Britestate v3.0 is built in 7 phases. Each phase delivers a complete, verifiable capability. The build order prioritizes getting users into the system (auth), giving them something to search (listings), giving each role a home with communication (dashboards + messaging), enabling the service marketplace, layering AI and financial tools, adding landlord workflows, and hardening for production.

**Amended specs:** Epics 4-11 use cost-optimized `epicNfinal.md` specs. Epics 1-3 use originals. Total monthly infrastructure target: ~$50/mo at launch, scaling to ~$800/mo at 100K MAU.

## Milestones

- ✅ **v3.0 Core Platform** - Phases 1-7 (in progress, 4 phases complete)
- 🚧 **v3.1 Buyer/Renter Dashboard** - Phases 8-12 (roadmap ready)
- 📋 **v3.2 Seller Dashboard** - Phase 13 (roadmap ready)

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

- [x] **Phase 8: DB Foundation & Security** - Migration (10 new tables), RLS, role auth fix, npm packages (completed 2026-03-13)
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
**Plans**: 2 plans

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
**Plans**: 12 plans

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
**Plans**: 12 plans

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
**Plans**: 12 plans

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
**Plans**: 12 plans

Plans:
- [ ] 12-01-PLAN.md -- Referral service: nanoid code generation, referral_codes insert/fetch, referral_conversions recording on signup, referral tracker API route
- [ ] 12-02-PLAN.md -- Referral Tracker UI: link display with copy button, signup count, per-referral status list; Mortgage Comparison page with widget embed and FCA disclaimer banner

---

### 📋 v3.2 Seller Dashboard (Phase 13)

**Milestone Goal:** Deliver all 18 Seller Dashboard pages at FAANG quality — full frontend + backend + browser-tested. Covers the complete seller journey from listing creation through sale completion, with real Supabase data, AI-assisted description generation, and a 7-step conveyancing tracker.

- [ ] **Phase 13: Seller Dashboard** - Dashboard home, listing management wizard, analytics, viewings, offers, sale tracker, instant valuation, agent finder

---

### 📋 v3.3 Landlord Dashboard (Phase 14)

**Milestone Goal:** Deliver all 29 Landlord Dashboard pages at FAANG quality — full frontend + backend + browser-tested. Covers the complete landlord journey from portfolio overview through compliance management, rent collection, maintenance, financial reporting, deposit management, legal notice generation, and yield analytics — all backed by real Supabase data with Stitch-designed UI.

- [ ] **Phase 14: Landlord Dashboard** - Dashboard home, portfolio, tenancy management, compliance, rent collection, maintenance, financials, legal tools, analytics

---

### 📋 v3.4 Estate Agent Dashboard (Phase 15)

**Milestone Goal:** Deliver all 32 Estate Agent Dashboard features at FAANG quality — full frontend + backend + browser-tested. Covers the complete agency operation from listings management, lead pipeline, viewings, offers, sales progression (Kanban), CRM, team/branch management, analytics, reviews, billing, and third-party property feed integrations (Reapit, Alto, Jupix) — all backed by real Supabase data with Stitch-designed UI.

- [ ] **Phase 15: Estate Agent Dashboard** - Dashboard home, listings management, lead pipeline, viewings calendar, offers & negotiation, sale progression board, CRM, team & branch management, analytics & reporting, reviews, billing, integrations

## Phase Details (continued)

### Phase 13: Seller Dashboard
**Goal**: Sellers can manage their entire property sale journey from listing creation (7-step wizard) through offer management, sale progression tracking, and finding an estate agent — all backed by real Supabase data
**Depends on**: Phase 3 (dashboards infrastructure), Phase 5 (AI tools)
**Requirements**: SELL-01, SELL-02, SELL-03, SELL-04, SELL-05, SELL-06, SELL-07, SELL-08, SELL-09, SELL-10, SELL-11, SELL-12, SELL-13, SELL-14, SELL-15, SELL-16, SELL-17, SELL-18
**Success Criteria** (what must be TRUE):
  1. Seller dashboard home shows real KPIs (active listings, total views, enquiries, upcoming viewings) from Supabase with a 30-day performance chart
  2. My Listings page shows real listings with status tabs (Active/Under Offer/Sold/Drafts), views/saves/enquiries counts, and a weekly performance mini-chart per listing
  3. Create Listing 7-step wizard completes end-to-end: postcode lookup → property type/tenure → details → photos → AI description (Claude API with 3 tones) → price → EPC → review/publish
  4. Listing Analytics page shows views over time (line chart), saves, enquiries, and click-through from real data
  5. Manage Viewings shows scheduled viewings with date/time/type, confirm/reschedule/cancel flows
  6. Offers Received shows buyer offers with accept/counter/reject actions and offer comparison
  7. Sale Progression Tracker shows 8-stage UK conveyancing pipeline with current stage, expected dates, and key documents
  8. Instant Valuation returns AI estimate with comparable properties drawn from Land Registry data
  9. Find an Estate Agent and Agent Comparison pages show real agents filterable by area, fees, ratings
**Plans**: 11 plans

Plans:
- [ ] 13-00-PLAN.md -- Wave 0: install date-fns dependency, create all 13 Nyquist test stub files
- [ ] 13-01-PLAN.md -- DB schema: seller listings tables, offers, viewings, sale progression, agent enquiries; TypeScript types; RLS policies
- [ ] 13-02-PLAN.md -- Service layer: listing-service (CRUD, publish, analytics), AI description service (Claude API, 3 tones, rate limit), image pipeline
- [ ] 13-03-PLAN.md -- Seller Dashboard Home + My Listings page (real data, status tabs, mini-charts)
- [ ] 13-04-PLAN.md -- Create Listing wizard: Steps 1-4 (address/type/tenure, details, photos, AI description)
- [ ] 13-05-PLAN.md -- Create Listing wizard: Steps 5-7 (price/type, EPC, review/publish) + listing edit/archive
- [ ] 13-06-PLAN.md -- Listing Analytics page (Recharts line/pie charts, views/saves/enquiries/CTR)
- [ ] 13-07-PLAN.md -- Manage Viewings (calendar + list views, confirm/reschedule/cancel, post-viewing feedback)
- [ ] 13-08-PLAN.md -- Offers Received + Accept/Reject/Counter flows + offer comparison table
- [ ] 13-09-PLAN.md -- Sale Progression Tracker (8-stage pipeline, documents, key contacts, delay warnings)
- [ ] 13-10-PLAN.md -- Instant Valuation (Land Registry data, AI estimate) + Find Agent + Agent Comparison + Agent Profile

### Phase 14: Landlord Dashboard
**Goal**: Landlords can manage their entire rental property portfolio — from portfolio overview and tenancy management through compliance tracking, rent collection, maintenance coordination, financial reporting, deposit management, and legal notice generation — all backed by real Supabase data with FAANG-quality UI based on Stitch reference designs
**Depends on**: Phase 6 (Landlord Tools backend), Phase 3 (dashboards infrastructure)
**Requirements**: LD-01, LD-02, LD-03, LD-04, LD-05, LD-06, LD-07, LD-08, LD-09, LD-10, LD-11, LD-12, LD-13, LD-14, LD-15, LD-16, LD-17, LD-18, LD-19, LD-20, LD-21, LD-22, LD-23, LD-24, LD-25, LD-26, LD-27, LD-28, LD-29
**Stitch reference screens**: Landlord Dashboard - Home (1b07d7e292e84a9bb4d41aebfef61392), My Properties (9154491c0648433f9bfd718708f725f1), Tenant Screening (da652271ce7344d392bc0bab363873e5), Maintenance Requests (ed6ed66ae9874af18e5125755cdb185c)
**Success Criteria** (what must be TRUE):
  1. Dashboard home shows real portfolio KPIs (total value, yield, occupancy rate, income summary) and compliance alerts from Supabase
  2. Portfolio view lists all properties with tenancy status, rent, yield, and occupancy — sortable and filterable
  3. Individual property page shows tenancy details, income history, documents, and maintenance log from real data
  4. Tenant screening workflow supports application review, credit check status, referencing, accept/reject with email notifications
  5. Rent collection overview and per-property views show real payment history with paid/partial/overdue status
  6. Compliance dashboard tracks all certificate types (Gas Safety, EPC, EICR, Deposit Protection) with expiry alerts
  7. Maintenance inbox and individual request pages support status tracking, photo uploads, and tradesperson assignment
  8. Expense tracker and income/expense reports use real financial data with export capability
  9. Tax summary exports correctly calculated figures for self-assessment
  10. Section 21 and Section 8 notice builder generates legally correct PDF documents
  11. Yield calculator and portfolio analytics provide real return calculations from property data
**Plans**: 10 plans

Plans:
- [ ] 14-01-PLAN.md -- DB schema extensions: landlord-dashboard tables (tenant_applications, rent_payments_extended, compliance_certs, deposit_schemes, notices), TypeScript types, RLS policies, Supabase migrations
- [ ] 14-02-PLAN.md -- Service layer: landlord-dashboard-service (portfolio stats, occupancy, yield), tenant-screening-service, rent-collection-service
- [ ] 14-03-PLAN.md -- Dashboard Home (9.1) + Portfolio View (9.2) + Individual Property (9.3) + Add Property (9.4) + Create Rental Listing (9.5)
- [ ] 14-04-PLAN.md -- Tenant Screening (9.6) + Application Detail (9.7) + Accept/Reject (9.8) + Tenancy Agreement (9.9)
- [ ] 14-05-PLAN.md -- Rent Collection Overview (9.10) + Individual Property Rent (9.11) + Deposit Management (9.25)
- [ ] 14-06-PLAN.md -- Compliance Dashboard (9.12) + Upload Certificate (9.13) + Expiry Alerts (9.14)
- [ ] 14-07-PLAN.md -- Maintenance Inbox (9.15) + Individual Request (9.16) + Assign Tradesperson (9.17)
- [ ] 14-08-PLAN.md -- Expense Tracker (9.18) + Income & Expense Report (9.19) + Tax Summary/Export (9.20)
- [ ] 14-09-PLAN.md -- Find Letting Agent (9.21) + Find Tradespeople (9.22) + Inventory Check-In (9.23) + Inventory Check-Out (9.24)
- [ ] 14-10-PLAN.md -- Section 21/Section 8 Notice Builder (9.26) + Insurance (9.27) + Yield Calculator (9.28) + Portfolio Analytics (9.29)

### Phase 15: Estate Agent Dashboard
**Goal**: Estate agents can manage their entire agency operation — listings, leads, viewings, offers, sales pipeline, CRM, team/branch management, analytics, reviews, billing, and property feed integrations — from a FAANG-quality dashboard with real Supabase data and Stitch reference designs
**Depends on**: Phase 3 (dashboards infrastructure), Phase 2 (property portal), Phase 4 (marketplace reviews)
**Requirements**: AGT-01, AGT-02, AGT-03, AGT-04, AGT-05, AGT-06, AGT-07, AGT-08, AGT-09, AGT-10, AGT-11, AGT-12, AGT-13, AGT-14, AGT-15, AGT-16, AGT-17, AGT-18, AGT-19, AGT-20, AGT-21, AGT-22, AGT-23, AGT-24, AGT-25, AGT-26, AGT-27, AGT-28, AGT-29, AGT-30, AGT-31, AGT-32
**Stitch reference screens**: Estate Agent Dashboard - Home (a8dae3b02b434d68b737fc9edbf5cd5a), Agent - My Listings (14db2503597243e49aa6e396e6dcbe2f), Agent - Lead Pipeline (58783c0bdf02424eb4229ae2dbb7e2f3), Agent - Viewing Management (0946d419dbce4f7e8a1d6efcf32a057d), Offers & Negotiation (0dc20477100b455cbaf4d9191e3f3103), Sale Progression Board (abb29577be3f4659abcd8c984f80d6ea), Client CRM (87ef750a34b0461187037e8dfe098346), Team & Branch (3bd435a47d814ae2ae3f4dcb08b14052), Analytics (0231272737054f9ba60d82bb5abf5f9f), Property Inventory (83f7fee3f8174e798e087f98130faf1f), Viewings Calendar (83fc4ef9a5b54547965410687a5b7518), Lead Management (fb117d1961884f1f8f63d37511f40527), Integrations (f47b0c69154c4fbca2d7ac8fc5d05cbf), Overview Dashboard (55326c15010842808ecc0ca57c57a3dc)
**Success Criteria** (what must be TRUE):
  1. Agent dashboard home shows real KPIs (active listings, new leads, viewings this week, offers pending) with trend indicators, activity chart, and performance score from Supabase
  2. My Listings pages (Active/Sold-Let/Archived-Draft) show real data with views, saves, enquiries counts; Create Listing wizard supports valuation, floorplans, pro photos, AI descriptions
  3. Lead pipeline shows real leads in Kanban stages (New Enquiry → Qualified → Viewing Booked → Offer Made → Closed) with drag-and-drop, detail view, and team assignment
  4. Viewing calendar shows real scheduled viewings with day/week/month modes, availability publishing, and post-viewing feedback collection
  5. Offers dashboard shows real offers grouped by property; negotiation threads support accept/reject/counter with vendor notifications
  6. Sale progression Kanban tracks 8-stage UK conveyancing with server-enforced transitions and audit trail
  7. CRM client list and profile pages show real client data with communication history, linked properties, and preferences
  8. Team management supports member invite, roles/permissions (5 tiers), and multi-branch management with branch-level settings
  9. Analytics pages show real performance data: agent-level, branch-level, and competitor analysis with Recharts visualizations
  10. Reviews dashboard shows real ratings with response capability; Subscription & Billing integrates with Stripe
  11. Property feed integration supports Reapit/Alto/Jupix with connection setup, sync status, and error logging
**Plans**: 14 plans

Plans:
- [ ] 15-01-PLAN.md -- DB schema: agent_leads, agent_offers, agent_commissions, agent_team_members, agent_branches, agent_crm_clients, agent_api_keys, agent_feed_integrations, agent_viewing_slots, agent_vendor_reports; TypeScript types; RLS policies; Supabase migration
- [ ] 15-02-PLAN.md -- Service layer: agent-dashboard-service (KPIs, activity), agent-listings-service (CRUD, analytics), agent-lead-service (pipeline, assignment)
- [ ] 15-03-PLAN.md -- Service layer: agent-viewing-service (calendar, slots, feedback), agent-offer-service (negotiation, pipeline), agent-sale-service (Kanban progression)
- [ ] 15-04-PLAN.md -- Service layer: agent-crm-service (clients, profiles), agent-team-service (members, roles, branches), agent-analytics-service (reports, competitor)
- [ ] 15-05-PLAN.md -- Dashboard Home (15.1) + Agency Profile Edit (15.2) + Agency Branding (15.3)
- [ ] 15-06-PLAN.md -- My Listings Active (15.4) + Sold/Let (15.5) + Archived/Draft (15.6) + Create Listing Wizard (15.7) + Listing Analytics (15.8)
- [ ] 15-07-PLAN.md -- Lead Management All (15.9) + Lead Detail/Timeline (15.10) + Lead Assign/Reassign (15.11)
- [ ] 15-08-PLAN.md -- Viewing Calendar (15.12) + Viewing Feedback (15.13) + Offers Dashboard (15.14) + Offer Negotiation (15.15)
- [ ] 15-09-PLAN.md -- Sale Progression Kanban (15.16) + Vendor Reports (15.17) + Market Appraisal (15.18)
- [ ] 15-10-PLAN.md -- CRM Client List (15.19) + Client Profile (15.20)
- [ ] 15-11-PLAN.md -- Team Members (15.21) + Roles & Permissions (15.22) + Branch Management (15.23)
- [ ] 15-12-PLAN.md -- Reviews Dashboard (15.24) + Review Respond (15.25) + Subscription & Billing (15.26)
- [ ] 15-13-PLAN.md -- Performance Reports Agent (15.27) + Branch (15.28) + Competitor Analysis (15.29) + Featured Listing/Boost (15.30)
- [ ] 15-14-PLAN.md -- API Key Management (15.31) + Property Feed Integration (15.32)

### Phase 16: Tradesperson / Service Provider Dashboard
**Goal**: Tradespeople and service providers can manage their complete business operation on Britestate — verification, profiles, services, jobs, quotes, invoices, payments, portfolio, reviews, and growth tools — from a FAANG-quality dashboard with real Supabase data and Stitch reference designs
**Depends on**: Phase 3 (dashboards infrastructure), Phase 4 (marketplace), Phase 1 (auth/verification)
**Requirements**: TPD-01, TPD-02, TPD-03, TPD-04, TPD-05, TPD-06, TPD-07, TPD-08, TPD-09, TPD-10, TPD-11, TPD-12, TPD-13, TPD-14, TPD-15, TPD-16, TPD-17, TPD-18, TPD-19, TPD-20, TPD-21, TPD-22, TPD-23, TPD-24, TPD-25
**Stitch reference screens**: Tradesperson Dashboard Overview (4b449e2a02ae419dafcebede08dca1ee), Professional Profile Settings (2389a8d176d94405b28822fad6725daa), Verification & Trust Center (8340c1a2d6fb4527a51cb5523428bbb1), Availability & Service Area (5b1d4bfaad28455792605a61f5ecf5cd), New Job Leads & Enquiries (11e53dcf42bc4c9f839fac8ac4906d70), Tradesperson Job Board (7c7383aae75645d2bf7391e3a11e1f9a), Professional Quote Builder (a2424dabe105445b836cc8cf295114a2), Portfolio & Reviews Hub (2caad1db0d6542f394a7ceb40347b32d), Business Analytics & Payouts (c43273aa8a1e4dc9879114864ad05af7), Tradesperson Public Profile (4d255ce443084b379775dbc72e4e3152), Compare Service Providers (0ddd81b9f86a4a8da58435d272bcaff7), Post a Job Wizard (ace1a12aa7fa44658cb47f342557aa0e)
**Success Criteria** (what must be TRUE):
  1. Dashboard home shows real KPIs (new leads, active jobs, pending reviews, verification status, monthly earnings) with recent activity feed from Supabase
  2. Profile edit page persists bio, photos, qualifications, and service areas to Supabase with real-time preview
  3. Verification Centre shows step-by-step progress (identity → insurance → qualifications → client refs → peer refs) with document upload, reference tracking, and badge status
  4. Services management allows add/edit/delete/price services with category selection backed by real data
  5. Service areas map editor lets providers draw or select coverage zones (radius or polygon) saved to Supabase
  6. Availability calendar shows/manages bookable slots synced with jobs; blocked dates respected in booking flow
  7. Job management pages (New Leads, Active, Completed, Detail) show real job data with status transitions, messages thread, payment info, and review prompt
  8. Quote Builder generates itemised quotes with materials/labour/tax, saveable as draft, sendable to client via email
  9. Invoice Generator creates PDF invoices from completed jobs, tracked in payment history
  10. Payments Overview shows real Stripe Connect balance, payout history, and individual transaction details
  11. Portfolio/Gallery lets providers upload before/after photos with project descriptions and category tags
  12. Reviews Dashboard shows all received reviews with star breakdown; providers can respond to reviews publicly
  13. Analytics page shows profile views, enquiry rate, conversion funnel, earnings trend via Recharts
  14. Subscription & Billing integrates with Stripe for plan management and invoice history
  15. Boost/Promote lets providers purchase featured placement; Referral Programme tracks referred providers
**Plans**: 12 plans

Plans:
- [ ] 16-01-PLAN.md -- DB schema: provider_services, provider_references, provider_badges, provider_portfolio_items, provider_invoices, stripe_connect_accounts, provider_boosts, provider_referrals, provider_service_areas; TypeScript types; RLS policies; Supabase migration
- [ ] 16-02-PLAN.md -- Service layer: provider-dashboard-service (KPIs, activity), provider-verification-service (steps, documents, references), provider-profile-service (bio, photos, qualifications)
- [ ] 16-03-PLAN.md -- Service layer: provider-job-service (leads, status transitions, messages), provider-quote-service (builder, PDF via @react-pdf/renderer), provider-invoice-service (generator, PDF)
- [ ] 16-04-PLAN.md -- Service layer: provider-payment-service (Stripe Connect Express, payouts), provider-portfolio-service, provider-analytics-service, provider-boost-service, provider-referral-service
- [ ] 16-05-PLAN.md -- Provider dashboard layout + Dashboard Home (11.1) + My Profile Edit (11.2)
- [ ] 16-06-PLAN.md -- Verification Centre Overview (11.3) + Upload Credentials (11.4) + Client References Tracker (11.5) + Peer References Tracker (11.6) + Badge Status (11.7)
- [ ] 16-07-PLAN.md -- Services Manage (11.8) + Service Areas Map Editor (11.9, MapLibre terra-draw) + Availability Calendar (11.10)
- [ ] 16-08-PLAN.md -- Jobs New Enquiries/Leads (11.11) + Jobs Active (11.12) + Jobs Completed (11.13) + Job Detail (11.14)
- [ ] 16-09-PLAN.md -- Quote Builder/Send Quote (11.15) + Invoice Generator (11.16)
- [ ] 16-10-PLAN.md -- Payments Overview (11.17) + Individual Transaction (11.18)
- [ ] 16-11-PLAN.md -- Portfolio/Gallery Manage (11.19) + Reviews Dashboard (11.20) + Reviews Respond (11.21)
- [ ] 16-12-PLAN.md -- Analytics (11.22) + Subscription & Billing (11.23) + Promote/Boost Profile (11.24) + Referral Programme (11.25)

### Phase 17: Service Provider Public Profiles
**Goal**: Anyone (logged in or not) can browse and compare detailed public profiles for all service provider types — tradespeople, estate agents, mortgage brokers, conveyancers, and surveyors — with FAANG-quality UI based on Stitch reference designs, fully SSR for SEO indexing
**Depends on**: Phase 4 (Marketplace — providers exist in DB), Phase 16 (provider profile data)
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06, PROF-07, PROF-08, PROF-09, PROF-10, PROF-11, PROF-12, PROF-13, PROF-14
**Stitch reference screens**: Tradesperson Public Profile (4d255ce443084b379775dbc72e4e3152), Agency Public Profile (c1e2ee7115be496e939f06c7e59992cb), Compare Service Providers (0ddd81b9f86a4a8da58435d272bcaff7), Tradesperson Search Results (20984c3b777b4d80a4f52ba734bc0cc0), Marketplace Search Home (852a2fc157d24144bc3f317a3c105fe9), Localized Category Page SEO (a539f744d5a04cf5bc53d8ece9e77842), Post a Job Wizard (ace1a12aa7fa44658cb47f342557aa0e), Tradesperson Job Board (7c7383aae75645d2bf7391e3a11e1f9a)
**Success Criteria** (what must be TRUE):
  1. Tradesperson public profile (13.1) renders hero with verified badges, trust score, star rating, and cover photo from real Supabase data — zero mock data
  2. Reviews tab (13.2) shows paginated real reviews with star breakdown, verified badge, provider responses, and helpful count
  3. Portfolio/Gallery tab (13.3) displays before/after project photos in masonry grid with category filters from real Supabase Storage
  4. Services & Pricing tab (13.4) shows real service list with pricing, duration, and Request Quote CTA
  5. Request Quote modal (13.5) submits an RFQ to the Supabase marketplace pipeline with job description, budget, and contact info
  6. Estate Agent public profile (13.6) shows agency branding, team photo, active listings count, sold properties, avg days to sell, ratings from real data
  7. Agent Active Listings (13.7), Sold/Let (13.8), Reviews (13.9), and Team Members (13.10) tabs load real paginated data
  8. Request Valuation form (13.11) submits a valuation enquiry to the agent's lead pipeline in Supabase
  9. Mortgage Broker (13.12), Conveyancer/Solicitor (13.13), and Surveyor (13.14) profiles display role-specific credentials, FCA/professional registration, and specialisms from real data
  10. All profiles are SEO-optimised via Next.js metadata API: dynamic title, description, OG image, JSON-LD structured data
  11. Compare Providers modal (up to 3 side-by-side) renders a comparison table from real provider data
  12. All routes are public (no auth required); pages use SSR (generateMetadata + page Server Components) for search engine indexing
  13. Localized SEO category pages (/services/plumbers/london) are statically generated with ISR and show real provider listings
**Plans**: 8 plans

Plans:
- [ ] 17-01-PLAN.md -- DB: provider_public_profiles materialized view + public read RLS policies; public-profile-service (fetch by slug, reviews pagination, portfolio, services, listings); SEO metadata generators
- [ ] 17-02-PLAN.md -- Tradesperson Public Profile page shell (13.1): hero section (avatar, verified badges, trust score, rating, cover photo), Overview tab, tab navigation; SSR + metadata
- [ ] 17-03-PLAN.md -- Tradesperson profile tabs: Reviews (13.2) + Portfolio/Gallery masonry (13.3) + Services & Pricing (13.4) + Request Quote Modal (13.5)
- [ ] 17-04-PLAN.md -- Estate Agent Public Profile (13.6): agency hero with branding, stats bar (listings, sold, avg days, rating), tab shell + Active Listings (13.7) + Sold/Let (13.8)
- [ ] 17-05-PLAN.md -- Estate Agent profile tabs: Reviews (13.9) + Team Members (13.10) + Request Valuation modal (13.11)
- [ ] 17-06-PLAN.md -- Mortgage Broker (13.12) + Conveyancer/Solicitor (13.13) + Surveyor (13.14) profiles — shared specialist profile template with role-specific credential sections
- [ ] 17-07-PLAN.md -- Compare Service Providers modal (up to 3, side-by-side table) + Marketplace Search Home category landing
- [ ] 17-08-PLAN.md -- Localized Category SEO pages (/services/[category]/[location]) with ISR + JSON-LD structured data + Tradesperson Job Board public view

## Progress

**Execution Order:**
v3.0 phases: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 (Phase 5 can run parallel to 3-4)
v3.1 phases: 8 -> 9 -> 10 -> 11 -> 12 (Phase 11 and 12 can run parallel after Phase 9)
v3.4 phases: 15 (depends on Phase 3 + Phase 2 + Phase 4)
v3.5 phases: 16 (depends on Phase 3 + Phase 4)
v3.6 phases: 17 (depends on Phase 4 + Phase 16)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v3.0 | 9/9 | Complete | 2026-03-07 |
| 2. Property Portal | v3.0 | 2/7 | In Progress | - |
| 3. Dashboards & Communication | v3.0 | 8/10 | In Progress | - |
| 4. Marketplace | v3.0 | 6/8 | In Progress | - |
| 5. AI & Financial Tools | v3.0 | 3/4 | In Progress | - |
| 6. Landlord Tools | v3.0 | 5/5 | Complete | 2026-03-07 |
| 7. Production Readiness | v3.0 | 9/10 | In Progress | - |
| 8. DB Foundation & Security | 2/2 | Complete   | 2026-03-13 | - |
| 9. Wire Existing Pages | v3.1 | 0/4 | Not started | - |
| 10. Viewings Booking, Offers & Docs | v3.1 | 0/6 | Not started | - |
| 11. AI Match | v3.1 | 0/2 | Not started | - |
| 12. Financial & Referral | v3.1 | 0/2 | Not started | - |
| 13. Seller Dashboard | v3.2 | 0/10 | Not started | - |
| 14. Landlord Dashboard | 5/10 | In Progress|  | - |
| 15. Estate Agent Dashboard | v3.4 | 0/14 | Not started | - |
| 16. Tradesperson Dashboard | v3.5 | 0/12 | Not started | - |
| 17. Service Provider Public Profiles | 2/8 | In Progress|  | - |

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
*Phase 13 planned: 2026-03-13 (10 plans, 6 waves)*
*Phase 13 revised: 2026-03-13 (11 plans, 7 waves) -- added Wave 0 plan for Nyquist test stubs and date-fns install*
*Phase 17 added: 2026-03-13 (Service Provider Public Profiles, 8 plans)*
