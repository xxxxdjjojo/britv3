# Requirements: Britestate

**Defined:** 2026-03-06
**Core Value:** Users can find, compare, and transact on properties with full transparency — AI-powered matching, integrated services, and real-time transaction tracking in one place.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication (Epic 1)

- [ ] **AUTH-01**: User can create account with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can log in with Google OAuth
- [ ] **AUTH-04**: User can reset password via email link
- [ ] **AUTH-05**: User session persists across browser refresh (JWT with refresh tokens)
- [ ] **AUTH-06**: User can select role(s) after registration (homebuyer, renter, seller, landlord, agent, provider)
- [ ] **AUTH-07**: User can hold multiple roles and switch between them
- [ ] **AUTH-08**: Role-specific dashboard loads based on active role
- [ ] **AUTH-09**: User verification levels enforced (basic, standard, enhanced, professional)
- [ ] **AUTH-10**: Provider verification pipeline (email → phone → ID → insurance → qualifications → admin review)
- [ ] **AUTH-11**: GDPR consent captured at signup with granular options (marketing, analytics, third-party)
- [ ] **AUTH-12**: User can export their data in JSON format
- [ ] **AUTH-13**: User can request account deletion with automated data purge
- [ ] **AUTH-14**: Complete audit trail for consent changes

### Property Search (Epic 2)

- [ ] **SRCH-01**: User can search properties by location (postcode, area, region)
- [ ] **SRCH-02**: User can filter by property type, price range, bedrooms, bathrooms
- [ ] **SRCH-03**: User can filter by amenities, EPC rating, new build status
- [ ] **SRCH-04**: User can search via interactive map with property pins (MapLibre)
- [ ] **SRCH-05**: Map displays property clusters at zoom levels for performance
- [ ] **SRCH-06**: User can draw custom search area on map (polygon tool)
- [ ] **SRCH-07**: User can search using natural language (semantic search via Claude AI)
- [ ] **SRCH-08**: User sees match score (0-100) with breakdown by criteria
- [ ] **SRCH-09**: User receives personalized property recommendations based on behavior
- [ ] **SRCH-10**: User can save properties to shortlist
- [ ] **SRCH-11**: User can save search criteria with notification preferences
- [ ] **SRCH-12**: User receives alerts for new matching properties (email + in-app)
- [ ] **SRCH-13**: User can sort results by price, date, relevance, match score

### Listing Management (Epic 2)

- [ ] **LIST-01**: Agent/seller can create property listing with full details (address, type, bedrooms, bathrooms, area, tenure, EPC, features)
- [ ] **LIST-02**: Agent/seller can upload up to 30 photos per listing
- [ ] **LIST-03**: Agent/seller can upload floor plans and documents
- [ ] **LIST-04**: Agent/seller can set pricing with qualifiers (offers over, guide price, POA)
- [ ] **LIST-05**: AI generates property description from details with tone options
- [ ] **LIST-06**: Agent/seller can edit and update live listings
- [ ] **LIST-07**: Agent/seller can view listing analytics (views, saves, enquiries)
- [ ] **LIST-08**: Price history tracked for each listing

### Homebuyer Dashboard (Epic 3)

- [ ] **HBDB-01**: Homebuyer sees overview with saved properties count, active searches, new matches, upcoming viewings
- [ ] **HBDB-02**: Homebuyer can manage saved properties with comparison tools and notes
- [ ] **HBDB-03**: Homebuyer can manage saved searches with notification settings
- [ ] **HBDB-04**: Homebuyer sees upcoming and past viewings in calendar view
- [ ] **HBDB-05**: Homebuyer sees AI-powered property recommendations with match scores
- [ ] **HBDB-06**: Homebuyer can access financial tools (mortgage calculator, stamp duty, affordability)
- [ ] **HBDB-07**: Homebuyer can track transaction progress when in active transaction
- [ ] **HBDB-08**: Homebuyer can create RFQs and compare service quotes
- [ ] **HBDB-09**: Homebuyer sees market trends and area analysis

### Renter Dashboard (Epic 3)

- [ ] **RNDB-01**: Renter sees overview with saved rentals, application status, upcoming viewings
- [ ] **RNDB-02**: Renter can manage saved searches and alert settings
- [ ] **RNDB-03**: Renter can track rental applications with status updates
- [ ] **RNDB-04**: Renter can view scheduled viewings with calendar sync
- [ ] **RNDB-05**: Renter can view current tenancy details, rent payments, maintenance requests
- [ ] **RNDB-06**: Renter can complete rental profile (references, employment details)
- [ ] **RNDB-07**: Renter can message landlords and agents

### Seller Dashboard (Epic 3)

- [ ] **SLDB-01**: Seller sees overview with listing performance, viewing requests, offers
- [ ] **SLDB-02**: Seller can manage active/draft listings
- [ ] **SLDB-03**: Seller can manage viewing requests and confirm times
- [ ] **SLDB-04**: Seller can manage offers (accept/reject/counter)
- [ ] **SLDB-05**: Seller sees listing analytics (views, enquiries, market position)
- [ ] **SLDB-06**: Seller can track sale progress when in active transaction

### Landlord Dashboard (Epic 3)

- [ ] **LLDB-01**: Landlord sees portfolio overview (total properties, occupancy rate, monthly income)
- [ ] **LLDB-02**: Landlord can view property cards with status, tenant info, next rent date
- [ ] **LLDB-03**: Landlord can view tenant list with lease details and communication history
- [ ] **LLDB-04**: Landlord can track rent collection with automated reminders
- [ ] **LLDB-05**: Landlord can manage maintenance request pipeline (new/in-progress/complete)
- [ ] **LLDB-06**: Landlord can track compliance certificates with renewal reminders
- [ ] **LLDB-07**: Landlord can view income/expense tracking and tax summary
- [ ] **LLDB-08**: Landlord can assign contractors from preferred list

### Agent Dashboard (Epic 3)

- [ ] **AGDB-01**: Agent sees overview with active listings, leads pipeline, viewings today, revenue
- [ ] **AGDB-02**: Agent can manage property portfolio with bulk actions
- [ ] **AGDB-03**: Agent can manage leads CRM with qualification stages and follow-up tasks
- [ ] **AGDB-04**: Agent can manage viewings calendar with team assignment
- [ ] **AGDB-05**: Agent can manage offers across all properties with negotiation tracking
- [ ] **AGDB-06**: Agent can manage client database with relationship notes
- [ ] **AGDB-07**: Agent sees performance metrics and commission tracking
- [ ] **AGDB-08**: Agent can manage team members and assignments

### Provider Dashboard (Epic 3)

- [ ] **PVDB-01**: Provider sees overview with verification status, active jobs, rating, earnings
- [ ] **PVDB-02**: Provider can browse and respond to RFQs
- [ ] **PVDB-03**: Provider can create and track quotes
- [ ] **PVDB-04**: Provider can manage calendar and availability
- [ ] **PVDB-05**: Provider can view earnings and payment history
- [ ] **PVDB-06**: Provider can manage reviews and respond to feedback
- [ ] **PVDB-07**: Provider can manage profile, portfolio, certifications, coverage areas
- [ ] **PVDB-08**: Provider can track verification progress
- [ ] **PVDB-09**: Provider sees AI business insights and pricing suggestions

### Service Marketplace (Epic 4)

- [ ] **MKT-01**: Platform displays 27+ service categories (legal, finance, moving, trades, etc.)
- [ ] **MKT-02**: User can create RFQ with service category, requirements, property details, budget, documents
- [ ] **MKT-03**: System matches RFQ to relevant providers by location, specialization, availability, rating
- [ ] **MKT-04**: Provider can respond with itemized quote, timeline, and terms
- [ ] **MKT-05**: User can compare multiple quotes side-by-side
- [ ] **MKT-06**: User can book provider with calendar integration
- [ ] **MKT-07**: Provider can manage availability with time blocking
- [ ] **MKT-08**: Automated reminders sent 24h and 1h before appointments
- [ ] **MKT-09**: User can leave review with overall rating, category ratings, written review, photos
- [ ] **MKT-10**: Provider can respond to reviews
- [ ] **MKT-11**: Automated profanity filtering and fake review detection
- [ ] **MKT-12**: Secure payment processing via Stripe Connect (2.5% platform commission)
- [ ] **MKT-13**: Escrow capability for large jobs (authorize on booking, capture on completion)
- [ ] **MKT-14**: Milestone payments for multi-stage projects
- [ ] **MKT-15**: Invoice generation for completed jobs
- [ ] **MKT-16**: Payment dispute handling workflow

### Communication (Epic 5)

- [ ] **COM-01**: User can send direct messages to other users
- [ ] **COM-02**: User can participate in group conversations
- [ ] **COM-03**: Messages delivered in real-time via Supabase Realtime
- [ ] **COM-04**: User sees read receipts on sent messages
- [ ] **COM-05**: User sees online/offline presence indicators
- [ ] **COM-06**: User can search message history
- [ ] **COM-07**: User can share files and images in conversations
- [ ] **COM-08**: Link previews displayed for shared URLs
- [ ] **COM-09**: In-app notification bell with unread count
- [ ] **COM-10**: Email notifications sent via Resend (configurable per type)
- [ ] **COM-11**: User can set quiet hours and digest frequency
- [ ] **COM-12**: Notifications for: new messages, property matches, viewing confirmations, offer updates, reviews, verification status, payments

### AI Features (Epic 6)

- [ ] **AI-01**: Semantic search understands natural language queries and maps to property filters
- [ ] **AI-02**: Property recommendations based on saved properties, search history, viewing history, time on listings
- [ ] **AI-03**: Content-based filtering (property attributes) combined with collaborative filtering (user patterns)
- [ ] **AI-04**: Match scoring (0-100) with breakdown and explanation for each property
- [ ] **AI-05**: Automated Valuation Model with estimated value, confidence score, value range, market comparison
- [ ] **AI-06**: AI-generated property descriptions from attributes with tone options (professional, friendly, luxury)
- [ ] **AI-07**: AI assistant for providers — pricing suggestions, response templates, job prioritization
- [ ] **AI-08**: AI assistant for users — search refinement, property comparison summaries, neighborhood insights
- [ ] **AI-09**: SEO meta description generation for property listings
- [ ] **AI-10**: Weekly personalized property digest emails based on preferences

### Landlord Tools (Epic 7)

- [ ] **LL-01**: Landlord can add properties to portfolio with full details
- [ ] **LL-02**: Landlord can manage tenancy agreements with templates
- [ ] **LL-03**: Landlord can screen tenants (application review, reference checks)
- [ ] **LL-04**: Landlord can track rent payments with automated reminders and payment history
- [ ] **LL-05**: Landlord can manage maintenance requests with contractor assignment
- [ ] **LL-06**: Landlord can track compliance certificates (gas, electrical, EPC) with renewal reminders
- [ ] **LL-07**: Landlord can view yield by property, void period tracking, rent vs market comparison
- [ ] **LL-08**: Landlord can view expense categorization and annual return calculation
- [ ] **LL-09**: Landlord can manage preferred contractor list with ratings

### Financial Tools (Epic 8)

- [ ] **FIN-01**: Mortgage calculator with monthly payment, total repayment, amortization schedule
- [ ] **FIN-02**: Stamp duty calculator with UK rates, first-time buyer relief, additional property surcharge
- [ ] **FIN-03**: Total cost calculator aggregating property price, stamp duty, legal fees, survey, mortgage fees, moving costs
- [ ] **FIN-04**: Investment analysis for buy-to-let (gross yield, net yield, cash-on-cash return, ROI)
- [ ] **FIN-05**: Capital gains estimate and net proceeds calculation for sellers
- [ ] **FIN-06**: Mortgage comparison scenarios (different rates, terms, deposit amounts)

### Mobile & PWA (Epic 9)

- [ ] **MOB-01**: All pages responsive across mobile, tablet, and desktop
- [ ] **MOB-02**: Touch-friendly interactions on all interactive elements
- [ ] **MOB-03**: Progressive Web App with install-to-home-screen capability
- [ ] **MOB-04**: Offline property viewing for saved/recently viewed properties
- [ ] **MOB-05**: Push notifications via Web Push API

### Admin Panel (Epic 10)

- [ ] **ADM-01**: Admin can search and filter users with role management
- [ ] **ADM-02**: Admin can control account status and override verification
- [ ] **ADM-03**: Admin can review and moderate listings
- [ ] **ADM-04**: Admin can moderate reviews and handle flagged messages
- [ ] **ADM-05**: Admin can manage provider verification queue with approval/rejection workflow
- [ ] **ADM-06**: Admin can manage support tickets with priority levels and assignment
- [ ] **ADM-07**: Admin sees platform analytics dashboard (user growth, revenue, performance)
- [ ] **ADM-08**: Complete audit logging of all admin and user actions

### Transaction Management (Epic 10)

- [ ] **TXN-01**: Buyer can submit offer with price, conditions, timeline
- [ ] **TXN-02**: Seller/agent can accept, reject, or counter offers
- [ ] **TXN-03**: Real-time transaction timeline with milestones (offer accepted → exchange → completion)
- [ ] **TXN-04**: Chain visualization for linked property transactions
- [ ] **TXN-05**: Document repository with secure upload/download and version control
- [ ] **TXN-06**: E-signature integration for contracts
- [ ] **TXN-07**: Task assignments and delay alerts in transaction flow

### Compliance & Monitoring (Epic 11)

- [ ] **CMP-01**: Full GDPR compliance with consent management, data export, right to deletion
- [ ] **CMP-02**: Complete audit trail for all data access and modifications
- [ ] **CMP-03**: Error tracking and performance monitoring via Sentry
- [ ] **CMP-04**: Product analytics and event tracking via PostHog
- [ ] **CMP-05**: Web Vitals monitoring (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] **CMP-06**: Rate limiting on auth and AI endpoints via Upstash Redis

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-V2-01**: Magic link passwordless authentication
- **AUTH-V2-02**: MFA/2FA with TOTP and SMS
- **AUTH-V2-03**: Apple Sign-In

### Search

- **SRCH-V2-01**: Travel time / commute search to work location
- **SRCH-V2-02**: School catchment area overlay
- **SRCH-V2-03**: Crime statistics overlay
- **SRCH-V2-04**: Planning applications nearby overlay
- **SRCH-V2-05**: Flood risk zone overlay
- **SRCH-V2-06**: 3D building visualization

### Media

- **LIST-V2-01**: Video tour upload (up to 5 minutes)
- **LIST-V2-02**: 360 virtual tour embedding
- **LIST-V2-03**: Satellite/street view toggle on map

### Communication

- **COM-V2-01**: SMS notifications
- **COM-V2-02**: Typing indicators in messaging

### Platform

- **PLT-V2-01**: Native mobile apps (iOS/Android)
- **PLT-V2-02**: Multi-language support
- **PLT-V2-03**: Live chat support

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time video chat | External tools (Zoom, Teams) solve this; massive complexity |
| Social feed / timeline | Property portal, not social network; dilutes core value |
| Blockchain property records | No market demand, regulatory complexity |
| AR/VR property tours | Future tech, hardware dependency, high cost |
| Automated mortgage applications | FCA-regulated activity; legal risk |
| Full accounting suite | Xero/QuickBooks exist; would compete with established tools |
| Voice search | Low adoption, complex NLP for property domain |
| Predictive maintenance AI | Insufficient data for new platform |
| White-label for agents | Agency branding adds massive theming/multi-tenancy complexity |
| Commercial property vertical | Different market dynamics and user base |
| International expansion | UK-only for this build |
| Price negotiation automation | Legal liability, users need human judgment for property deals |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (To be populated by roadmapper) | | |

**Coverage:**
- v1 requirements: 126 total
- Mapped to phases: 0
- Unmapped: 126

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-06 after initial definition*
