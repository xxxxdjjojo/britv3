# Roadmap: Britestate v3.0

## Overview

Britestate v3.0 is built in 7 phases. Each phase delivers a complete, verifiable capability. The build order prioritizes getting users into the system (auth), giving them something to search (listings), giving each role a home with communication (dashboards + messaging), enabling the service marketplace, layering AI and financial tools, adding landlord workflows, and hardening for production.

**Amended specs:** Epics 4-11 use cost-optimized `epicNfinal.md` specs. Epics 1-3 use originals. Total monthly infrastructure target: ~$50/mo at launch, scaling to ~$800/mo at 100K MAU.

## Phases

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

## Phase Details

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

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7
(Phase 5 depends only on Phase 2, so it can optionally run in parallel with Phases 3-4)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 9/9 | Complete   | 2026-03-07 |
| 2. Property Portal | 2/7 | In Progress|  |
| 3. Dashboards & Communication | 8/10 | In Progress|  |
| 4. Marketplace | 6/8 | In Progress|  |
| 5. AI & Financial Tools | 3/4 | In Progress|  |
| 6. Landlord Tools | 5/5 | Complete   | 2026-03-07 |
| 7. Production Readiness | 1/10 | In Progress|  |

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
