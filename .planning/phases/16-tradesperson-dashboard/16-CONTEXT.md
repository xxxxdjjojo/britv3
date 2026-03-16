# Phase 16: Tradesperson / Service Provider Dashboard — Context

**Gathered:** 2026-03-13
**Status:** Ready for planning
**Source:** User specification + Stitch reference designs

<domain>
## Phase Boundary

Phase 16 delivers the complete Tradesperson / Service Provider Dashboard — 25 pages covering every aspect of a service provider's business management on Britestate. This includes their day-to-day operations (jobs, quotes, invoices), trust-building tools (verification, badges, reviews), business growth (analytics, boost/promote, referrals), and financial management (payments, Stripe Connect).

This is a FAANG-quality implementation: real Supabase data, Stitch reference UI designs, full Britestate design system compliance.

</domain>

<decisions>
## Implementation Decisions

### Design Quality Bar
- FAANG level implementation — every page must match or exceed the Stitch reference designs
- Use `britestatestyle.txt` for all colour tokens, typography, spacing, and component rules
- All components Server Components by default; `"use client"` only where needed
- Full Britestate design system: Plus Jakarta Sans headings, Inter body, brand-primary #1B4D3E

### 25 Pages to Implement

#### Group 1: Dashboard & Profile
- **11.1 Dashboard Home** — KPI cards (new leads, active jobs, earnings, verification status), recent activity feed, quick action buttons, upcoming jobs list
- **11.2 My Profile Edit** — Bio editor, photo upload, qualifications, service areas, live preview panel

#### Group 2: Verification Centre (5 pages)
- **11.3 Verification Centre Overview** — Step-by-step progress stepper (identity → insurance → qualifications → client refs → peer refs → review), overall badge status, completion percentage
- **11.4 Upload Credentials** — Document upload for: public liability insurance, Gas Safe certificate, NICEIC registration, NAPIT, CSCS card, Part P, ACS qualifications, trade-specific docs
- **11.5 Client References Tracker** — Track 3 client references: send request, reminder, status (pending/submitted/verified), view submitted reference
- **11.6 Peer References Tracker** — Track 3 peer references (same structure as client refs but from industry peers)
- **11.7 Badge Status** — Display all earned badges with earned date, expiry warnings, "What does this mean?" explanations

#### Group 3: Services & Availability
- **11.8 Services Manage** — Add/edit/delete services, set pricing (hourly/fixed/quote-on-request), category selection, service descriptions
- **11.9 Service Areas Map Editor** — MapLibre-based map editor; draw radius circle OR custom polygon coverage zone; multiple zones supported
- **11.10 Availability Calendar** — Monthly/weekly calendar view; set available/blocked/booked slots; recurring availability rules; sync with jobs

#### Group 4: Job Management (4 pages)
- **11.11 Jobs — New Enquiries/Leads** — Incoming job requests, filter by category/area/budget, accept/decline/message, urgency badges
- **11.12 Jobs — Active** — In-progress jobs table/cards with status badges, next actions, days running
- **11.13 Jobs — Completed** — Completed jobs history, searchable, exportable, review prompts
- **11.14 Job Detail** — Full job view: scope of work, message thread, timeline, quote attached, invoice generated, payment status, leave/view review

#### Group 5: Financial Tools
- **11.15 Quote Builder / Send Quote** — Line-item builder (materials + labour + VAT), totals calculation, client details, preview mode, send via email/platform message
- **11.16 Invoice Generator** — Generate from completed job or manually, line items, payment terms, PDF export, mark as paid
- **11.17 Payments Overview** — Stripe Connect balance, pending payouts, total earned this month/year, payout schedule, quick stats
- **11.18 Individual Transaction** — Transaction details: job reference, amount, fees, net payout, status, related invoice

#### Group 6: Portfolio & Reviews
- **11.19 Portfolio/Gallery Manage** — Upload before/after photo pairs, project title, description, category tags, reorder drag-and-drop, set featured
- **11.20 Reviews Dashboard** — Star rating breakdown chart, all reviews listed by date, filter by rating, aggregate stats
- **11.21 Reviews Respond** — Write public response to a review, response guidelines, character limit, preview

#### Group 7: Growth & Analytics
- **11.22 Analytics** — Profile views over time (line chart), enquiry rate, conversion funnel (viewed → enquired → quoted → booked), earnings trend, top service categories
- **11.23 Subscription & Billing** — Current plan display, plan comparison/upgrade table, billing history, Stripe payment method management
- **11.24 Promote / Boost Profile** — Featured placement purchase UI, coverage area boost selector, duration/price options, active promotions status
- **11.25 Referral Programme** — Referral link/code, referred providers list with status, earnings from referrals, payout threshold

### Stitch Reference Designs
All 14 Stitch screens from project `5956704101394866719` must be used as pixel-accurate reference:

| Screen | Stitch ID | HTML File |
|--------|-----------|-----------|
| Tradesperson Dashboard Overview | 4b449e2a02ae419dafcebede08dca1ee | stitch/dashboard-overview.html |
| Professional Profile Settings | 2389a8d176d94405b28822fad6725daa | stitch/profile-settings.html |
| Verification & Trust Center | 8340c1a2d6fb4527a51cb5523428bbb1 | stitch/verification-trust-center.html |
| New Job Leads & Enquiries | 11e53dcf42bc4c9f839fac8ac4906d70 | stitch/job-leads-enquiries.html |
| Tradesperson Job Board | 7c7383aae75645d2bf7391e3a11e1f9a | stitch/job-board.html |
| Professional Quote Builder | a2424dabe105445b836cc8cf295114a2 | stitch/quote-builder.html |
| Portfolio & Reviews Hub | 2caad1db0d6542f394a7ceb40347b32d | stitch/portfolio-reviews.html |
| Business Analytics & Payouts | c43273aa8a1e4dc9879114864ad05af7 | stitch/analytics-payouts.html |
| Availability & Service Area | 5b1d4bfaad28455792605a61f5ecf5cd | stitch/availability-service-area.html |
| Tradesperson Public Profile | 4d255ce443084b379775dbc72e4e3152 | (screenshot only) |
| Tradesperson Search Results | 20984c3b777b4d80a4f52ba734bc0cc0 | (screenshot only) |
| Marketplace Search Home | 852a2fc157d24144bc3f317a3c105fe9 | (screenshot only) |
| Compare Service Providers | 0ddd81b9f86a4a8da58435d272bcaff7 | (screenshot only) |
| Post a Job Wizard | ace1a12aa7fa44658cb47f342557aa0e | (screenshot only) |

Screenshots all available via lh3.googleusercontent.com (see roadmap Stitch reference IDs).

### Technical Architecture Decisions

#### Route Structure
All provider dashboard pages under: `britv3.0/src/app/dashboard/provider/`
- `page.tsx` → Dashboard Home (11.1)
- `profile/page.tsx` → Profile Edit (11.2)
- `verification/page.tsx` → Verification Overview (11.3)
- `verification/credentials/page.tsx` → Upload Credentials (11.4)
- `verification/client-references/page.tsx` → Client References (11.5)
- `verification/peer-references/page.tsx` → Peer References (11.6)
- `verification/badges/page.tsx` → Badge Status (11.7)
- `services/page.tsx` → Services Manage (11.8)
- `services/areas/page.tsx` → Service Areas Map (11.9)
- `availability/page.tsx` → Availability Calendar (11.10)
- `jobs/leads/page.tsx` → New Enquiries (11.11)
- `jobs/active/page.tsx` → Active Jobs (11.12)
- `jobs/completed/page.tsx` → Completed Jobs (11.13)
- `jobs/[id]/page.tsx` → Job Detail (11.14)
- `quotes/builder/page.tsx` → Quote Builder (11.15)
- `quotes/[id]/invoice/page.tsx` → Invoice Generator (11.16)
- `payments/page.tsx` → Payments Overview (11.17)
- `payments/[id]/page.tsx` → Individual Transaction (11.18)
- `portfolio/page.tsx` → Portfolio Manage (11.19)
- `reviews/page.tsx` → Reviews Dashboard (11.20)
- `reviews/[id]/respond/page.tsx` → Review Respond (11.21)
- `analytics/page.tsx` → Analytics (11.22)
- `billing/page.tsx` → Subscription & Billing (11.23)
- `boost/page.tsx` → Promote/Boost (11.24)
- `referrals/page.tsx` → Referral Programme (11.25)

#### Data Sources
- All data from Supabase (Phase 3 provider tables + Phase 4 marketplace tables)
- Stripe Connect for payments/payouts
- MapLibre + MapTiler for service area map editor
- Recharts for analytics charts
- react-pdf or @react-pdf/renderer for PDF invoice/quote generation

#### Component Strategy
- Use existing Phase 3 dashboard shell layout (DashboardLayout)
- Build provider-specific components in `src/components/dashboard/provider/`
- Reuse Phase 4 marketplace components where applicable
- All new components follow: TypeScript, "use client" only when needed, Shadcn UI base

### Claude's Discretion
- Exact Stripe Connect onboarding flow details (standard Connect Express pattern)
- PDF invoice/quote template styling (follow britestatestyle.txt brand tokens)
- Real-time job notification mechanism (polling vs Supabase Realtime — prefer Realtime for job notifications)
- Referral programme reward structure UI (show £50/referred provider earning or percentage)

</decisions>

<specifics>
## Specific Ideas

### From Stitch Designs (must implement pixel-accurately):

**Dashboard Overview (stitch/dashboard-overview.html)**:
- Forest green sidebar with logo, nav items, user profile at bottom
- KPI cards row: New Leads, Active Jobs, Pending Reviews, Monthly Earnings
- Two-column layout: Recent Activity + Upcoming Jobs
- Verification status banner if incomplete

**Profile Settings (stitch/profile-settings.html)**:
- Form with avatar upload (large circular upload zone)
- Bio textarea with character count
- Qualifications multi-entry section
- Service categories with specialisms

**Verification Center (stitch/verification-trust-center.html)**:
- Vertical stepper with progress rings
- Each step expandable with upload action
- Trust score circular gauge
- Badge gallery at bottom

**Job Leads (stitch/job-leads-enquiries.html)**:
- Card-based lead inbox
- Each card: job title, client avatar, description excerpt, budget, location, category icon, urgency badge
- Accept/Decline/Message actions
- Filter bar: All | Plumbing | Electrical | etc.

**Quote Builder (stitch/quote-builder.html)**:
- Split layout: form left, preview right
- Line items table with materials + labour rows
- VAT calculation
- Total with breakdown
- Client selector, send button

**Analytics & Payouts (stitch/analytics-payouts.html)**:
- Revenue chart (Recharts area chart) with period selector
- Funnel: Profile Views → Enquiries → Quotes → Bookings
- Payout history table with Stripe transfer details

</specifics>

<deferred>
## Deferred Ideas

- Mobile app / PWA-specific UX for providers (Phase 7 handles PWA)
- AI-assisted quote generation (could be added as Phase 16.1 insert later)
- SMS notifications for new leads (use email + in-app for now)
- Multi-user provider accounts (team members) — deferred to future phase
- Direct bank transfer payments (Stripe Connect only for Phase 16)

</deferred>

---

*Phase: 16-tradesperson-dashboard*
*Context gathered: 2026-03-13*
