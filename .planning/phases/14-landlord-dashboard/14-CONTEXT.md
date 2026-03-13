# Phase 14: Landlord Dashboard - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning
**Source:** PRD Express Path (user spec + Stitch reference designs)

<domain>
## Phase Boundary

Phase 14 delivers all 29 Landlord Dashboard pages at FAANG quality. The Phase 6 backend (Epic 7) already built the core data model and service layer — this phase wires all UI, extends the backend where needed, and builds the missing workflows (tenant screening, rent collection UI, compliance dashboard, Section 21/8 notices, yield calculator, portfolio analytics).

**Stitch reference designs available at:** `.planning/phases/14-landlord-dashboard/stitch/`
- `dashboard-home.html` — sidebar nav, KPI cards, compliance alerts, activity feed
- `my-properties.html` — portfolio grid with total value, yield, status tabs
- `tenant-screening.html` — application pipeline with credit check status
- `maintenance-requests.html` — inbox with priority/status badges, assign tradesperson

**Design system from Stitch (aligned to brand):**
- Primary: `#1B4D3E` (deep forest green — matches brand exactly)
- Font: Plus Jakarta Sans (headings) + Inter (body) — as per britestatestyle.txt
- Icons: Lucide React (project standard, despite Stitch using Material Symbols)
- Sidebar layout for desktop dashboard (from Stitch Dashboard Home design)
- Card-based KPIs with trend indicators
- Status badges with colour coding (green=paid/active, amber=warning, red=overdue/expired)

</domain>

<decisions>
## Implementation Decisions

### Page Inventory (29 pages — ALL locked)
- **9.1** Dashboard Home — portfolio overview, income summary, compliance alerts
- **9.2** My Properties — Portfolio View (grid with status, yield, occupancy)
- **9.3** Property — Individual Management (tenancy details, income, documents)
- **9.4** Add Property to Portfolio
- **9.5** Create Rental Listing
- **9.6** Tenant Screening / Applications (pipeline view)
- **9.7** Application — View Detail
- **9.8** Application — Accept / Reject
- **9.9** Tenancy Agreement — Create / Upload
- **9.10** Rent Collection — Overview
- **9.11** Rent Collection — Individual Property
- **9.12** Compliance Dashboard (gas safety, EPC, EICR, deposit protection)
- **9.13** Compliance — Upload Certificate
- **9.14** Compliance — Expiry Alerts
- **9.15** Maintenance Requests — Inbox
- **9.16** Maintenance — Individual Request
- **9.17** Maintenance — Assign Tradesperson
- **9.18** Expense Tracker
- **9.19** Income & Expense Report
- **9.20** Tax Summary / Export
- **9.21** Find a Letting Agent
- **9.22** Find Tradespeople (landlord context)
- **9.23** Inventory / Check-In Report
- **9.24** Inventory / Check-Out Report
- **9.25** Deposit Management
- **9.26** Section 21 / Section 8 Notice Builder
- **9.27** Insurance — Landlord
- **9.28** Yield Calculator
- **9.29** Portfolio Analytics

### Quality Bar
- FAANG level: real Supabase data, no mock arrays, optimistic UI updates
- React Query for client-side state, Server Components for initial loads
- RLS on all new tables (landlord can only see their own data)
- TypeScript strict mode throughout
- Recharts for all charts (portfolio analytics, income/expense reports)

### Route Structure
All routes under `/dashboard/landlord/` (existing pattern from Phase 6):
- `/dashboard/landlord` → 9.1 Dashboard Home
- `/dashboard/landlord/properties` → 9.2 Portfolio View
- `/dashboard/landlord/properties/[id]` → 9.3 Individual Property
- `/dashboard/landlord/properties/add` → 9.4 Add Property
- `/dashboard/landlord/properties/[id]/listing` → 9.5 Create Rental Listing
- `/dashboard/landlord/tenants` → 9.6 Tenant Screening
- `/dashboard/landlord/tenants/[applicationId]` → 9.7 Application Detail
- `/dashboard/landlord/tenants/[applicationId]/decision` → 9.8 Accept/Reject
- `/dashboard/landlord/tenants/[tenancyId]/agreement` → 9.9 Tenancy Agreement
- `/dashboard/landlord/rent` → 9.10 Rent Collection Overview
- `/dashboard/landlord/rent/[propertyId]` → 9.11 Individual Property Rent
- `/dashboard/landlord/compliance` → 9.12 Compliance Dashboard
- `/dashboard/landlord/compliance/upload` → 9.13 Upload Certificate
- `/dashboard/landlord/compliance/alerts` → 9.14 Expiry Alerts
- `/dashboard/landlord/maintenance` → 9.15 Maintenance Inbox
- `/dashboard/landlord/maintenance/[id]` → 9.16 Individual Request
- `/dashboard/landlord/maintenance/[id]/assign` → 9.17 Assign Tradesperson
- `/dashboard/landlord/finance/expenses` → 9.18 Expense Tracker
- `/dashboard/landlord/finance/report` → 9.19 Income & Expense Report
- `/dashboard/landlord/finance/tax` → 9.20 Tax Summary
- `/dashboard/landlord/find-agent` → 9.21 Find Letting Agent
- `/dashboard/landlord/find-tradespeople` → 9.22 Find Tradespeople
- `/dashboard/landlord/inventory/[propertyId]/check-in` → 9.23 Check-In Report
- `/dashboard/landlord/inventory/[propertyId]/check-out` → 9.24 Check-Out Report
- `/dashboard/landlord/deposits` → 9.25 Deposit Management
- `/dashboard/landlord/legal/notices` → 9.26 Notice Builder
- `/dashboard/landlord/insurance` → 9.27 Insurance
- `/dashboard/landlord/tools/yield-calculator` → 9.28 Yield Calculator
- `/dashboard/landlord/analytics` → 9.29 Portfolio Analytics

### Backend Integration (Supabase MCP)
- Use Supabase MCP to verify schema before writing migration SQL
- Extend Phase 6 tables (properties, tenancies, maintenance_requests, compliance_docs, rent_payments) where possible
- New tables needed: tenant_applications, inventory_reports, deposit_registrations, legal_notices
- All API routes use `supabase.auth.getUser()` server-side (defense-in-depth)
- Private storage bucket for: compliance certs, tenancy agreements, inventory photos, legal notices

### PDF Generation
- Section 21 / Section 8 notices: client-side PDF using `@react-pdf/renderer`
- Tenancy Agreement PDF: same library
- Tax Summary export: CSV via client-side generation + PDF option

### Stitch UI Adaptation
- Adapt Stitch HTML designs to Next.js components (Tailwind + Shadcn + Lucide)
- Replace `material-symbols-outlined` icons with Lucide equivalents
- Replace CDN Tailwind with project's Tailwind v4 config
- Use `#1B4D3E` primary colour (already matches Stitch dashboard-home design)
- Sidebar layout from Stitch: `w-64 border-r` permanent sidebar on desktop, collapsible on mobile

### Claude's Discretion
- Exact chart types for Portfolio Analytics (suggest: area chart for income trend, bar for occupancy, donut for property type breakdown)
- Pagination strategy for large portfolios (cursor-based, 20 items per page)
- Toast notifications for async actions (upload cert, assign tradesperson, etc.)
- Loading skeletons for all data-fetched pages

</decisions>

<specifics>
## Specific Ideas

### Stitch Design Patterns (from reference HTML)
1. **Sidebar nav** with active item highlighted by `border-left: 4px solid #1B4D3E` + `bg-primary/10`
2. **KPI cards** — 4-column grid on desktop, icon top-right, value large, trend indicator below
3. **Compliance alerts** — amber/red banners with certificate type, expiry date, and CTA button
4. **Property cards** in portfolio — image left, status badge top-right, yield/rent/occupancy inline
5. **Tenant screening** — Kanban-style pipeline: Received → Shortlisted → Referencing → Approved/Rejected
6. **Maintenance inbox** — list with priority badge (Urgent/Routine), category icon, property/tenant, status chip

### UK Legal Compliance Requirements
- Section 21 notice: must include prescribed information, deposit certificate reference, EPC reference
- Section 8 notice: must specify grounds (e.g., Ground 8 for 2+ months arrears), serve correctly
- Gas Safety: annual requirement, must give copy to tenant within 28 days of check
- EPC: valid for 10 years, minimum E rating (F/G = cannot let in England)
- EICR: required every 5 years or on change of tenancy
- Deposit Protection: must register within 30 days, prescribed information within 30 days

### Yield Calculator Formula
- Gross yield = (annual rent / property value) × 100
- Net yield = ((annual rent - annual costs) / property value) × 100
- Inputs: purchase price, monthly rent, monthly costs (management fee, maintenance, insurance, mortgage)

</specifics>

<deferred>
## Deferred Ideas

- AI-powered rent price recommendation (compare to similar properties) — Phase 15
- Automated rent arrears chasing (email sequences) — Phase 15
- Tenant portal (tenant-facing view of tenancy, documents, maintenance) — Phase 15
- Integration with TDS/DPS/mydeposits APIs for real deposit registration — Phase 15
- Open Banking integration for automatic rent tracking — Phase 15

</deferred>

---

*Phase: 14-landlord-dashboard*
*Context gathered: 2026-03-13 via PRD Express Path (user spec + Stitch reference designs)*
