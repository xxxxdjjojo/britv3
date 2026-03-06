# Roadmap: Britestate v3.0

## Overview

Britestate v3.0 is built in 7 phases that progress from authentication foundation through a fully functional UK property portal with AI-powered features, an integrated service marketplace, and professional landlord tools. Each phase delivers a complete, verifiable capability that subsequent phases build upon. The build order prioritizes getting users into the system (auth), giving them something to do (search + communicate), giving each role a home (dashboards), making the platform intelligent (AI), enabling revenue (marketplace), layering professional workflows (landlord + transactions), and hardening for production (PWA + admin + compliance).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Multi-role auth, GDPR consent, database schema, RLS patterns
- [ ] **Phase 2: Property Portal** - Property search, listings, map integration, messaging, notifications
- [ ] **Phase 3: Role Dashboards** - Role-specific dashboards for all 6 user types with role switching
- [ ] **Phase 4: AI & Smart Features** - Semantic search, recommendations, match scoring, AI content generation
- [ ] **Phase 5: Marketplace & Finance** - Service marketplace with payments, financial calculators
- [ ] **Phase 6: Landlord Tools & Transactions** - Portfolio management, tenant tools, transaction pipeline
- [ ] **Phase 7: Production Readiness** - PWA, admin panel, compliance, monitoring

## Phase Details

### Phase 1: Foundation
**Goal**: Users can create accounts, authenticate securely, select and switch between roles, and have their GDPR preferences respected from day one
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10, AUTH-11, AUTH-12, AUTH-13, AUTH-14
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password or Google OAuth, verify their email, and log back in with session persisting across browser refresh
  2. User can select one or more roles at registration and switch between active roles, with the correct dashboard shell loading for each role
  3. Provider verification pipeline advances through stages (email, phone, ID, insurance, qualifications) with admin review gate
  4. GDPR consent is captured at signup with granular options, user can export their data as JSON, and user can request account deletion
  5. All consent changes are recorded in an audit trail
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD
- [ ] 01-03: TBD

### Phase 2: Property Portal
**Goal**: Users can search for properties, view listings on a map, create and manage listings, and communicate with other users in real time
**Depends on**: Phase 1
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05, SRCH-06, SRCH-10, SRCH-11, SRCH-12, SRCH-13, LIST-01, LIST-02, LIST-03, LIST-04, LIST-06, LIST-07, LIST-08, COM-01, COM-02, COM-03, COM-04, COM-05, COM-06, COM-07, COM-08, COM-09, COM-10, COM-11, COM-12
**Success Criteria** (what must be TRUE):
  1. User can search properties by location, apply filters (type, price, bedrooms, amenities, EPC), sort results, and save properties to a shortlist
  2. User can search via interactive map with clustered pins, draw a custom search polygon, and click pins to view listing details
  3. Agent or seller can create a full property listing with photos (up to 30), floor plans, pricing qualifiers, and view listing analytics with price history
  4. User can send and receive real-time messages (direct and group), see read receipts and online/offline presence, search message history, and share files
  5. User can save search criteria, receive email and in-app alerts for new matches, configure notification preferences and quiet hours
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Role Dashboards
**Goal**: Each of the 6 user roles has a dedicated dashboard that surfaces relevant data, actions, and workflows for their specific needs
**Depends on**: Phase 2
**Requirements**: HBDB-01, HBDB-02, HBDB-03, HBDB-04, HBDB-05, HBDB-06, HBDB-07, HBDB-08, HBDB-09, RNDB-01, RNDB-02, RNDB-03, RNDB-04, RNDB-05, RNDB-06, RNDB-07, SLDB-01, SLDB-02, SLDB-03, SLDB-04, SLDB-05, SLDB-06, LLDB-01, LLDB-02, LLDB-03, LLDB-04, LLDB-05, LLDB-06, LLDB-07, LLDB-08, AGDB-01, AGDB-02, AGDB-03, AGDB-04, AGDB-05, AGDB-06, AGDB-07, AGDB-08, PVDB-01, PVDB-02, PVDB-03, PVDB-04, PVDB-05, PVDB-06, PVDB-07, PVDB-08, PVDB-09
**Success Criteria** (what must be TRUE):
  1. Homebuyer can view saved properties with comparison tools, manage saved searches, see upcoming viewings in calendar view, access financial tools, and track transaction progress
  2. Renter can manage saved rentals, track application status, view scheduled viewings, access tenancy details with rent and maintenance info, and complete rental profile
  3. Seller can manage listings (active/draft), handle viewing requests, manage offers (accept/reject/counter), view listing analytics, and track sale progress
  4. Landlord can see portfolio overview (properties, occupancy, income), manage tenants and rent collection, handle maintenance requests, track compliance certificates, and assign contractors
  5. Agent can manage property portfolio with bulk actions, run leads CRM with qualification stages, manage viewings calendar, handle offers with negotiation tracking, and view performance metrics
  6. Provider can view verification status, browse and respond to RFQs, manage quotes and calendar, view earnings, manage reviews, and see AI business insights
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: AI & Smart Features
**Goal**: The platform leverages AI to deliver intelligent property search, personalized recommendations, automated content generation, and smart assistants for users and providers
**Depends on**: Phase 2
**Requirements**: SRCH-07, SRCH-08, SRCH-09, LIST-05, AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08, AI-09, AI-10
**Success Criteria** (what must be TRUE):
  1. User can search using natural language queries that are interpreted into property filters, and sees results ranked by AI match score (0-100) with breakdown explanation
  2. User receives personalized property recommendations based on saved properties, search history, viewing history, and time spent on listings
  3. Agent or seller can generate AI property descriptions from listing attributes with selectable tone (professional, friendly, luxury), and listings get auto-generated SEO meta descriptions
  4. Automated Valuation Model provides estimated value, confidence score, value range, and market comparison for properties
  5. AI assistants are available for providers (pricing suggestions, response templates, job prioritization) and users (search refinement, comparison summaries, neighborhood insights)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Marketplace & Finance
**Goal**: Users can find, compare, and pay for property-related services through an integrated marketplace, and access financial planning tools for their property decisions
**Depends on**: Phase 3
**Requirements**: MKT-01, MKT-02, MKT-03, MKT-04, MKT-05, MKT-06, MKT-07, MKT-08, MKT-09, MKT-10, MKT-11, MKT-12, MKT-13, MKT-14, MKT-15, MKT-16, FIN-01, FIN-02, FIN-03, FIN-04, FIN-05, FIN-06
**Success Criteria** (what must be TRUE):
  1. User can browse 27+ service categories, create an RFQ with requirements and budget, receive matched provider quotes, and compare quotes side-by-side
  2. Provider can respond to RFQs with itemized quotes, manage availability with time blocking, and receive automated appointment reminders
  3. Payments process securely via Stripe Connect with 2.5% platform commission, escrow for large jobs, milestone payments for multi-stage projects, invoice generation, and dispute handling
  4. Users can leave reviews with ratings and photos, providers can respond, and the system filters profanity and detects fake reviews
  5. User can calculate mortgage payments with amortization, stamp duty with first-time buyer relief, total purchase costs, buy-to-let investment returns, capital gains, and compare mortgage scenarios
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: Landlord Tools & Transactions
**Goal**: Landlords can manage their entire property portfolio with tenants, maintenance, and compliance, while buyers and sellers can track property transactions through a transparent pipeline
**Depends on**: Phase 3, Phase 5
**Requirements**: LL-01, LL-02, LL-03, LL-04, LL-05, LL-06, LL-07, LL-08, LL-09, TXN-01, TXN-02, TXN-03, TXN-04, TXN-05, TXN-06, TXN-07
**Success Criteria** (what must be TRUE):
  1. Landlord can add properties to portfolio, manage tenancy agreements with templates, screen tenants, and track rent payments with automated reminders
  2. Landlord can manage maintenance requests with contractor assignment from a preferred list, track compliance certificates (gas, electrical, EPC) with renewal reminders
  3. Landlord can view financial performance per property (yield, void periods, rent vs market) and see expense categorization with annual return calculations
  4. Buyer can submit offers with price and conditions, seller/agent can accept/reject/counter, and both see a real-time transaction timeline with milestones from offer to completion
  5. Transaction flow includes chain visualization, secure document repository with version control, e-signature integration, and task assignments with delay alerts
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Production Readiness
**Goal**: The application is production-hardened with PWA capabilities, a full admin panel, GDPR compliance completion, and monitoring infrastructure
**Depends on**: Phase 6
**Requirements**: MOB-01, MOB-02, MOB-03, MOB-04, MOB-05, ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06, ADM-07, ADM-08, CMP-01, CMP-02, CMP-03, CMP-04, CMP-05, CMP-06
**Success Criteria** (what must be TRUE):
  1. All pages are responsive across mobile, tablet, and desktop with touch-friendly interactions, and the app can be installed to home screen as a PWA
  2. Previously viewed and saved properties are available offline, and users receive push notifications via Web Push API
  3. Admin can search/filter users with role management, moderate listings and reviews, manage provider verification queue, and handle support tickets with priority and assignment
  4. Platform analytics dashboard shows user growth, revenue, and performance metrics, with complete audit logging of all admin and user actions
  5. Full GDPR compliance is verified (consent management, data export, right to deletion), Sentry tracks errors, PostHog tracks analytics, Web Vitals meet targets (LCP < 2.5s, FID < 100ms, CLS < 0.1), and rate limiting protects auth and AI endpoints
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD
- [ ] 07-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Property Portal | 0/3 | Not started | - |
| 3. Role Dashboards | 0/3 | Not started | - |
| 4. AI & Smart Features | 0/2 | Not started | - |
| 5. Marketplace & Finance | 0/3 | Not started | - |
| 6. Landlord Tools & Transactions | 0/2 | Not started | - |
| 7. Production Readiness | 0/3 | Not started | - |

---
*Roadmap created: 2026-03-06*
*Last updated: 2026-03-06*
