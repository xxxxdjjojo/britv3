# Requirements: Britestate

**Defined:** 2026-03-06
**Rebuilt:** 2026-03-07 (aligned to amended epic specs ending in `final.md`)
**Core Value:** Users can find, compare, and transact on properties with full transparency -- AI-powered matching, integrated services, and real-time transaction tracking in one place.

## Source Document Map

| Epic | Source File | Status |
|------|-----------|--------|
| 1 | `docs/claude epic 1 review.txt` | Original |
| 2 | `docs/claude epic 2.txt` | Original |
| 3 | `docs/epic3mkd claude.txt` | Original |
| 4 | `docs/epic4final.md` | Amended (cost-optimized) |
| 5 | `docs/epic5final.md` | Amended (cost-optimized) |
| 6 | `docs/epic6final.md` | Amended (cost-optimized) |
| 7 | `docs/epic7final.md` | Amended (cost-optimized) |
| 8 | `docs/epic8final.md` | Amended (cost-optimized) |
| 9 | `docs/epic9final.md` | Amended (cost-optimized) |
| 10 | `docs/epic10final.md` | Amended (cost-optimized) |
| 11 | `docs/epic11final.md` | Amended (cost-optimized) |

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Foundation (Epic 1)

- [x] **AUTH-01**: User can create account with email and password
- [x] **AUTH-02**: User receives email verification after signup
- [x] **AUTH-03**: User can log in with Google OAuth (PKCE flow)
- [x] **AUTH-04**: User can log in with Apple OAuth
- [x] **AUTH-05**: User can reset password via email link
- [x] **AUTH-06**: User session persists across browser refresh (JWT with refresh tokens)
- [x] **AUTH-07**: User can select role(s) after registration (homebuyer, renter, seller, landlord, agent, provider)
- [x] **AUTH-08**: User can hold multiple roles and switch between them
- [x] **AUTH-09**: Role-specific dashboard shell loads based on active role
- [x] **AUTH-10**: User verification levels enforced (basic, standard, enhanced, professional)
- [x] **AUTH-11**: Provider verification pipeline (email, phone, ID, insurance, qualifications, admin review)
- [x] **AUTH-12**: GDPR consent captured at signup with granular options (marketing, analytics, third-party)
- [x] **AUTH-13**: User can export their data in JSON format
- [x] **AUTH-14**: User can request account deletion with automated data purge
- [x] **AUTH-15**: Complete audit trail for consent changes
- [x] **AUTH-16**: CSP Level 3 headers and security hardening
- [x] **AUTH-17**: RBAC middleware for route protection
- [x] **AUTH-18**: Public pages (home, about, terms, privacy policy)
- [x] **AUTH-19**: Responsive layout shell with navigation

### Property Search (Epic 2)

- [ ] **SRCH-01**: User can search properties by location (postcode, area, region)
- [ ] **SRCH-02**: User can filter by property type, price range, bedrooms, bathrooms
- [ ] **SRCH-03**: User can filter by amenities, EPC rating, new build status
- [ ] **SRCH-04**: User can search via interactive map with property pins (MapLibre + MapTiler)
- [ ] **SRCH-05**: Map displays property clusters at zoom levels for performance
- [ ] **SRCH-06**: User can draw custom search area on map (polygon tool)
- [ ] **SRCH-07**: User can save properties to shortlist
- [ ] **SRCH-08**: User can save search criteria with notification preferences
- [ ] **SRCH-09**: User receives alerts for new matching properties (email + in-app)
- [ ] **SRCH-10**: User can sort results by price, date, relevance
- [x] **SRCH-11**: Search uses optimized queries (materialized views, full-text search, cursor-based pagination)
- [ ] **SRCH-12**: Geocoding via postcodes.io (free UK postcode API)

### Listing Management (Epic 2)

- [ ] **LIST-01**: Agent/seller can create property listing with full details (address, type, beds, baths, area, tenure, EPC, features)
- [ ] **LIST-02**: Agent/seller can upload up to 30 photos per listing with client-side compression
- [ ] **LIST-03**: Agent/seller can upload floor plans and documents
- [ ] **LIST-04**: Agent/seller can set pricing with qualifiers (offers over, guide price, POA)
- [ ] **LIST-05**: Agent/seller can edit and update live listings
- [ ] **LIST-06**: Agent/seller can view listing analytics (views, saves, enquiries)
- [ ] **LIST-07**: Price history tracked for each listing
- [x] **LIST-08**: PostGIS geospatial support for location-based queries

### Dashboards (Epic 3)

- [ ] **DASH-01**: Homebuyer dashboard with saved properties, active searches, upcoming viewings
- [ ] **DASH-02**: Renter dashboard with saved rentals, application status, tenancy details
- [ ] **DASH-03**: Seller dashboard with listing performance, viewing requests, offers
- [ ] **DASH-04**: Landlord dashboard with portfolio overview, occupancy, income
- [ ] **DASH-05**: Agent dashboard with active listings, leads pipeline, viewings, revenue
- [ ] **DASH-06**: Provider dashboard with verification status, active jobs, rating, earnings
- [x] **DASH-07**: Aggregated dashboard API (1-2 calls instead of 8-12)
- [x] **DASH-08**: Dashboard caching via Upstash Redis
- [ ] **DASH-09**: Profile CRUD with Zod validation for all roles
- [ ] **DASH-10**: Profile picture upload with client-side compression
- [ ] **DASH-11**: Service provider extended profile (services, coverage area, pricing)
- [x] **DASH-12**: Activity log with cursor-based pagination
- [ ] **DASH-13**: Notification preferences per user
- [ ] **DASH-14**: Real-time dashboard updates via Supabase Realtime

### Service Marketplace (Epic 4 -- amended)

- [x] **MKT-01**: Provider can set up extended profile (business info, services, area, pricing, qualifications)
- [x] **MKT-02**: Provider can upload verification documents with file-type validation
- [x] **MKT-03**: User can create RFQ with service category, location (postcodes.io), budget, urgency
- [x] **MKT-04**: System matches RFQ to max 10 providers by category, postcode overlap, proximity
- [x] **MKT-05**: Provider can respond with itemized quote with versioning
- [x] **MKT-06**: User can compare quotes side-by-side
- [x] **MKT-07**: User can create and manage bookings with conflict detection
- [x] **MKT-08**: Booking state machine (pending -> confirmed -> in_progress -> completed -> disputed)
- [x] **MKT-09**: Provider can manage availability calendar
- [x] **MKT-10**: User can submit multi-dimensional review with ratings
- [x] **MKT-11**: Rule-based review spam/sentiment detection (no AI)
- [x] **MKT-12**: Provider can respond to reviews; helpfulness voting
- [x] **MKT-13**: User can search and browse providers by category and location
- [x] **MKT-14**: Async job processing via Inngest (replaces BullMQ)

**Deferred from Epic 4:**
- Stripe Connect payments (separate epic)
- Escrow / milestone payments
- Invoice generation
- Dispute resolution flow
- AI quote suggestions (Epic 6)
- SMS/WhatsApp notifications
- Calendar sync (Google/Outlook)

### Communication & Collaboration (Epic 5 -- amended)

- [x] **COM-01**: User can send direct messages from listings, bookings, RFQs (contextual initiation)
- [ ] **COM-02**: Polling-based inbox with 30s refresh (no WebSockets at MVP)
- [x] **COM-03**: Message thread with cursor-based pagination
- [ ] **COM-04**: File attachments in messages (compressed, 2MB limit)
- [x] **COM-05**: Per-conversation "last read" timestamp (not per-message)
- [ ] **COM-06**: AI quote drafting for tradespeople via Claude Haiku (~$0.001/draft)
- [ ] **COM-07**: AI quote drafting for estate agents via Claude Haiku
- [ ] **COM-08**: Trader rate card management
- [ ] **COM-09**: Market pricing intelligence data
- [x] **COM-10**: Event-based in-app notification feed (O(1) writes, no fan-out)
- [ ] **COM-11**: Email notifications -- immediate for critical events, daily digest for non-critical
- [ ] **COM-12**: Notification preferences (per-type, quiet hours, digest frequency)
- [ ] **COM-13**: Files tab on bookings/transactions for document sharing
- [x] **COM-14**: Transaction milestones (8-step UK property pipeline)
- [x] **COM-15**: Service job milestones (5-step pipeline)

**Deferred from Epic 5:**
- Real-time WebSocket chat (post-MVP)
- Online/offline presence indicators
- Per-message read receipts
- Group chat
- Video/voice calls
- End-to-end encryption
- Twilio SMS/WhatsApp
- Smart reply suggestions (static lookup instead)
- Document versioning / e-signatures

### AI Features (Epic 6 -- amended, drastically reduced)

- [x] **AI-01**: Centralized AI service layer wrapping Claude API with token tracking, rate limiting, daily spend kill switch
- [x] **AI-02**: AI property description generation (3 tones: professional, friendly, premium; max 3 regenerations)
- [x] **AI-03**: SQL-based property recommendations from saved searches and saved properties (zero AI cost)
- [x] **AI-04**: Land Registry Price Paid Data display on property detail pages (free public data)
- [x] **AI-05**: Static smart reply suggestions based on conversation type and keyword matching (no AI)
- [x] **AI-06**: AI feedback collection (thumbs up/down for prompt engineering)

**Deferred from Epic 6:**
- AI context management / RAG system
- AI assistant via SMS/WhatsApp (Twilio costs)
- AI quote drafting (template builder instead -- moved to Epic 5)
- NLP natural language search
- Self-hosted LLM infrastructure
- Fine-tuning / retraining pipelines
- AVM model (partner with Hometrack post-revenue)
- Predictive analytics, voice AI, AR

### Landlord Tools (Epic 7 -- amended)

- [x] **LL-01**: Portfolio view of managed rental properties (reuses listings data)
- [x] **LL-02**: Tenant record storage (contact, lease terms, deposit info)
- [x] **LL-03**: Maintenance request logging with status tracking and photo uploads
- [x] **LL-04**: Simple contractor assignment via marketplace link (no auto-RFQ)
- [x] **LL-05**: Manual rent payment tracking (paid/partial/overdue derived in UI)
- [x] **LL-06**: Manual expense logging with optional receipt upload
- [ ] **LL-07**: Per-property financial summary (income minus expenses via RPC function)
- [x] **LL-08**: Document upload with expiry dates for compliance tracking
- [ ] **LL-09**: Automated compliance reminders (30-day, 7-day before expiry)
- [ ] **LL-10**: Client-side lease agreement (AST) PDF generation via jspdf/html2pdf.js

**Deferred from Epic 7 (future premium features):**
- Automated rent collection via payment gateway
- Bank statement import / reconciliation
- Automated tenant screening
- Application pipeline with status tracking
- Integration with accounting software
- E-signature integration
- Multiple lease templates
- Tenant portal

### Financial Calculators (Epic 8 -- amended, reduced)

- [x] **FIN-01**: Mortgage payment calculator (client-side amortization formula, real-time results)
- [x] **FIN-02**: SDLT calculator for England & NI (first-time buyer, home mover, additional property)
- [ ] **FIN-03**: Save mortgage parameters to localStorage + optional DB sync for cross-device
- [ ] **FIN-04**: Personalized "Est. X/mo" display on property listing cards and detail pages
- [x] **FIN-05**: SDLT rate bands in maintainable TypeScript config
- [ ] **FIN-06**: Offer letter PDF generation (client-side via @react-pdf/renderer)

**Deferred from Epic 8:**
- Offer management system (Phase 6 scope)
- Transaction timeline / chain visualization (Phase 6 scope)
- Stripe Connect integration (marketplace scope)
- E-signature API ($200-600/mo -- premium post-revenue)
- Online rent collection
- Rent vs Buy, Renovation, Moving calculators
- LBTT (Scotland) / LTT (Wales) calculators

### PWA & Mobile (Epic 9 -- amended, PWA only)

- [ ] **MOB-01**: Web App Manifest with installable standalone mode
- [ ] **MOB-02**: Deferred install prompt after 2nd visit
- [ ] **MOB-03**: Push notifications via Web Push API + VAPID keys ($0/mo)
- [ ] **MOB-04**: Notification deep linking to relevant pages
- [ ] **MOB-05**: Push notification preferences
- [ ] **MOB-06**: Offline access to saved properties (50), recent views (20), appointments
- [ ] **MOB-07**: Static page caching (stale-while-revalidate via @serwist/next)
- [ ] **MOB-08**: Responsive verification across 320px-1280px breakpoints
- [ ] **MOB-09**: Touch optimization (44px targets, swipe gestures, pull-to-refresh)
- [ ] **MOB-10**: Role-specific bottom tab bar on mobile (<768px)
- [ ] **MOB-11**: Core Web Vitals targets (LCP < 2.5s, FID < 100ms, CLS < 0.1)

**Deferred from Epic 9:**
- Native iOS/Android apps (post-revenue, 50K+ MAU)
- Capacitor native shell wrapper
- Offline data creation
- App Store / Play Store distribution

### Admin Panel (Epic 10 -- amended, simplified)

- [ ] **ADM-01**: Admin route group `(admin)/` with sidebar layout, protected by middleware
- [ ] **ADM-02**: is_admin boolean on profiles (no granular RBAC at MVP)
- [ ] **ADM-03**: Admin dashboard with 5 count cards linking to management sections
- [ ] **ADM-04**: User management (search, view details, suspend/activate)
- [ ] **ADM-05**: Post-moderation of listings (auto-flag profanity, price anomaly, duplicate detection)
- [ ] **ADM-06**: Provider verification queue with document review via signed URLs
- [ ] **ADM-07**: Review moderation queue (flagged/reported reviews)
- [ ] **ADM-08**: Static help page with FAQ from MDX files
- [ ] **ADM-09**: Contact form with rate limiting (email to support inbox via Resend)
- [ ] **ADM-10**: External dashboard links (Stripe, Sentry, PostHog, Supabase)

**Deferred from Epic 10:**
- Custom CMS / WYSIWYG editor (use MDX or Notion)
- Custom support ticket system (use Freshdesk Free at Month 3)
- Financial dashboard (use Stripe Dashboard)
- Separate Next.js admin app
- Granular RBAC with 3+ roles (add at 5+ admins)
- Pre-moderation workflow

### Launch Readiness (Epic 11 -- amended, free tiers only)

- [ ] **LCH-01**: Sentry Free integration for client + server error tracking
- [ ] **LCH-02**: PostHog Free integration for product analytics (10+ tracked events)
- [ ] **LCH-03**: Structured JSON logger outputting to Vercel logs
- [ ] **LCH-04**: GitHub Action for automated Supabase migration on push to main
- [ ] **LCH-05**: Feature flags via environment variables (upgrade path: PostHog free flags)
- [ ] **LCH-06**: Full RLS policy audit across all tables with test cases
- [ ] **LCH-07**: Dependabot vulnerability scanning enabled
- [ ] **LCH-08**: OWASP ZAP automated security scan against staging
- [ ] **LCH-09**: Artillery load test (100 VUs, 5 key endpoints, <2s avg, <1% error)
- [ ] **LCH-10**: Manual UAT with seeded staging data across all user roles
- [ ] **LCH-11**: Cross-browser testing (Chrome, Firefox, Safari, Edge, iOS Safari, Android Chrome)
- [ ] **LCH-12**: Supabase PITR backup verification with test restore
- [ ] **LCH-13**: Final legal/compliance review (GDPR, terms, privacy, disclaimers)
- [ ] **LCH-14**: Launch runbook with deployment steps and rollback procedures
- [ ] **LCH-15**: Internal support runbook (1-page)

**Deferred from Epic 11:**
- React Native CI/CD (no native apps)
- AWS infrastructure (Claude API, no self-hosted AI)
- Paid monitoring (Datadog, New Relic, Logtail)
- PagerDuty on-call
- Third-party penetration testing (Month 6)
- LaunchDarkly / paid feature flags
- Terraform / IaC
- Formal DR drills

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication
- **AUTH-V2-01**: Magic link passwordless authentication
- **AUTH-V2-02**: MFA/2FA with TOTP and SMS
- **AUTH-V2-03**: Apple Sign-In enhancement (biometric prompt)

### Search
- **SRCH-V2-01**: NLP/semantic natural language search (Claude AI)
- **SRCH-V2-02**: Match score (0-100) with breakdown by criteria
- **SRCH-V2-03**: AI-powered personalized recommendations (behavior tracking)
- **SRCH-V2-04**: Travel time / commute search
- **SRCH-V2-05**: School catchment area overlay
- **SRCH-V2-06**: Crime statistics overlay
- **SRCH-V2-07**: Flood risk zone overlay

### Media
- **LIST-V2-01**: Video tour upload (up to 5 minutes)
- **LIST-V2-02**: 360 virtual tour embedding
- **LIST-V2-03**: Satellite/street view toggle on map

### Communication
- **COM-V2-01**: Real-time WebSocket messaging
- **COM-V2-02**: Online/offline presence indicators
- **COM-V2-03**: Per-message read receipts
- **COM-V2-04**: Group chat
- **COM-V2-05**: SMS notifications via Twilio

### AI
- **AI-V2-01**: AI provider assistant via in-app chat
- **AI-V2-02**: AI context management / RAG system
- **AI-V2-03**: Automated Valuation Model (partner with Hometrack)
- **AI-V2-04**: AI-generated SEO meta descriptions

### Marketplace
- **MKT-V2-01**: Stripe Connect payments (2.5% commission)
- **MKT-V2-02**: Escrow for large jobs
- **MKT-V2-03**: Milestone payments for multi-stage projects
- **MKT-V2-04**: Invoice generation
- **MKT-V2-05**: Payment dispute handling

### Platform
- **PLT-V2-01**: Native mobile apps (iOS/Android) via Capacitor or React Native
- **PLT-V2-02**: Multi-language support
- **PLT-V2-03**: Integrated live chat support

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Self-hosted LLM on AWS | Claude API is 280x cheaper at startup scale |
| Real-time video chat | External tools (Zoom, Teams) solve this |
| Social feed / timeline | Property portal, not social network |
| Blockchain property records | No market demand, regulatory complexity |
| AR/VR property tours | Future tech, high cost |
| Automated mortgage applications | FCA-regulated activity |
| Full accounting suite | Xero/QuickBooks exist |
| Voice search | Low adoption |
| White-label for agents | Massive theming complexity |
| Commercial property vertical | Different market |
| International expansion | UK-only for this build |
| Native mobile apps at launch | PWA covers mobile; native post-revenue |
| Twilio SMS/WhatsApp at launch | $3K-5K/mo; use in-app messaging |
| Custom CMS for help center | Use MDX files or Notion |
| Custom support ticket system | Use Freshdesk Free |
| Datadog / New Relic at launch | Free tiers (Sentry, PostHog) sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 to AUTH-19 | Phase 1 | Pending |
| SRCH-01 to SRCH-12 | Phase 2 | Pending |
| LIST-01 to LIST-08 | Phase 2 | Pending |
| DASH-01 to DASH-14 | Phase 3 | Pending |
| COM-01 to COM-15 | Phase 3 | Pending |
| MKT-01 to MKT-14 | Phase 4 | Pending |
| AI-01 to AI-06 | Phase 5 | Pending |
| FIN-01 to FIN-06 | Phase 5 | Pending |
| LL-01 to LL-10 | Phase 6 | Pending |
| MOB-01 to MOB-11 | Phase 7 | Pending |
| ADM-01 to ADM-10 | Phase 7 | Pending |
| LCH-01 to LCH-15 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 139 total
- Mapped to phases: 139
- Unmapped: 0

---
*Requirements defined: 2026-03-06*
*Rebuilt: 2026-03-07 (aligned to amended epic specs)*
