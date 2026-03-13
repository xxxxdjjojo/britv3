# Requirements: Britestate v3.4 — Estate Agent Dashboard

**Defined:** 2026-03-13
**Milestone:** v3.4
**Core Value:** Estate agents can manage their entire agency operation — listings, leads, viewings, offers, sales pipeline, CRM, team management, analytics, and third-party integrations — from a single FAANG-quality dashboard with real Supabase data.

## Estate Agent Dashboard Requirements (AGT)

### Dashboard & Agency Profile

- [ ] **AGT-01**: Agent dashboard home shows real KPIs (active listings, new leads, viewings this week, offers pending, performance score) with trend indicators and activity chart
- [ ] **AGT-02**: Agent can edit agency profile (name, contact info, address, description, specializations, coverage areas)
- [ ] **AGT-03**: Agent can manage agency branding (logo upload, brand colours, agency description, social links)

### Listings Management

- [ ] **AGT-04**: Agent can view My Listings — Active with property cards showing address, price, status, views, saves, enquiries count
- [ ] **AGT-05**: Agent can view My Listings — Sold/Let with completion dates, final prices, time-on-market metrics
- [ ] **AGT-06**: Agent can view My Listings — Archived/Draft with restore and delete actions
- [ ] **AGT-07**: Agent can create listings with enhanced features: auto-valuation, floorplan upload, professional photo management, EPC integration, AI descriptions
- [ ] **AGT-08**: Agent can view listing performance analytics: views over time, saves, enquiries, click-through rate, source breakdown (Recharts)

### Lead Management

- [ ] **AGT-09**: Agent can view all leads in a filterable pipeline view (New Enquiry → Qualified → Viewing Booked → Offer Made → Closed) with search and bulk actions
- [ ] **AGT-10**: Agent can view lead detail page with full timeline: enquiry source, property interest, communication history, notes, next action
- [ ] **AGT-11**: Agent can assign/reassign leads to team members with notification and audit trail

### Viewing Management

- [ ] **AGT-12**: Agent can manage viewings in calendar view (react-day-picker) with day/week/month modes, drag-to-reschedule, and availability slot publishing
- [ ] **AGT-13**: Agent can collect and view post-viewing feedback from buyers with structured form (interest level, price opinion, likelihood to offer)

### Offers & Sales Pipeline

- [ ] **AGT-14**: Agent can view offers dashboard with all received offers grouped by property, showing amount, buyer details, AIP status, conditions
- [ ] **AGT-15**: Agent can manage offer negotiation threads: accept/reject/counter with messaging, vendor notification, and audit trail
- [ ] **AGT-16**: Agent can track sales on a Kanban/pipeline board with stages: Offer Accepted → Memorandum of Sale → Solicitors Instructed → Searches → Survey → Mortgage → Exchange → Completion

### Vendor & Market Tools

- [ ] **AGT-17**: Agent can generate auto-populated vendor reports (listing performance, viewing summary, market analysis) as downloadable PDF
- [ ] **AGT-18**: Agent can use market appraisal tool: comparable sales lookup (Land Registry), area trends, suggested asking price with confidence band

### CRM

- [ ] **AGT-19**: Agent can view CRM client list with search, filter by type (buyer/seller/landlord/tenant), sort, and bulk email actions
- [ ] **AGT-20**: Agent can view CRM client profile: contact details, linked properties, communication history, preferences, notes, transaction history

### Team & Branch Management

- [ ] **AGT-21**: Agent can manage team members: invite (email), view active/inactive, performance metrics per member
- [ ] **AGT-22**: Agent can manage roles and permissions: Admin, Senior Negotiator, Negotiator, Lettings Manager, Viewer (read-only) with granular permission toggles
- [ ] **AGT-23**: Agent can manage multiple branches: add/edit branch locations, assign team members to branches, branch-level settings

### Reviews & Reputation

- [ ] **AGT-24**: Agent can view reviews dashboard: overall rating, rating distribution, recent reviews, sentiment trends
- [ ] **AGT-25**: Agent can respond to individual reviews publicly with character limit and profanity filter

### Billing & Subscription

- [ ] **AGT-26**: Agent can manage subscription and billing: view plan, upgrade/downgrade, payment history, invoice download (Stripe integration)

### Analytics & Reports

- [ ] **AGT-27**: Agent can view performance reports at agent level: listings sold, avg time-on-market, revenue, conversion rates, client satisfaction
- [ ] **AGT-28**: Agent can view performance reports at branch level: team comparison, branch KPIs, market share estimate
- [ ] **AGT-29**: Agent can view competitor analysis for their area: competing agencies, market share, avg listing prices, avg time-on-market

### Marketing & Promotion

- [ ] **AGT-30**: Agent can purchase featured listing or boost for specific properties via Stripe with duration selection and preview

### Integrations

- [ ] **AGT-31**: Agent can manage API keys: generate, revoke, view usage stats, set rate limits
- [ ] **AGT-32**: Agent can configure property feed integration with Reapit, Alto, or Jupix: connection setup, sync status, field mapping, error log
