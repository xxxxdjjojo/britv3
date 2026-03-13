# Phase 14: Landlord Dashboard - Research

**Researched:** 2026-03-13
**Domain:** Next.js App Router dashboard, Supabase BaaS, UK landlord compliance workflows
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page Inventory (29 pages — ALL locked):**
- 9.1 Dashboard Home — portfolio overview, income summary, compliance alerts
- 9.2 My Properties — Portfolio View (grid with status, yield, occupancy)
- 9.3 Property — Individual Management (tenancy details, income, documents)
- 9.4 Add Property to Portfolio
- 9.5 Create Rental Listing
- 9.6 Tenant Screening / Applications (pipeline view)
- 9.7 Application — View Detail
- 9.8 Application — Accept / Reject
- 9.9 Tenancy Agreement — Create / Upload
- 9.10 Rent Collection — Overview
- 9.11 Rent Collection — Individual Property
- 9.12 Compliance Dashboard (gas safety, EPC, EICR, deposit protection)
- 9.13 Compliance — Upload Certificate
- 9.14 Compliance — Expiry Alerts
- 9.15 Maintenance Requests — Inbox
- 9.16 Maintenance — Individual Request
- 9.17 Maintenance — Assign Tradesperson
- 9.18 Expense Tracker
- 9.19 Income & Expense Report
- 9.20 Tax Summary / Export
- 9.21 Find a Letting Agent
- 9.22 Find Tradespeople (landlord context)
- 9.23 Inventory / Check-In Report
- 9.24 Inventory / Check-Out Report
- 9.25 Deposit Management
- 9.26 Section 21 / Section 8 Notice Builder
- 9.27 Insurance — Landlord
- 9.28 Yield Calculator
- 9.29 Portfolio Analytics

**Quality Bar:** FAANG level — real Supabase data, no mock arrays, optimistic UI updates, React Query for client state, Server Components for initial loads, RLS on all new tables, TypeScript strict mode.

**Route Structure:** All routes under `/dashboard/landlord/` — 29 specific routes locked (see CONTEXT.md).

**PDF Generation:** `@react-pdf/renderer` for Section 21/Section 8 notices, tenancy agreements, tax summary export.

**Charts:** Recharts for all charts (portfolio analytics, income/expense reports).

**Stitch UI Adaptation:** Adapt Stitch HTML to Next.js + Tailwind v4 + Shadcn + Lucide. Replace material-symbols with Lucide. Use `#1B4D3E` primary. Sidebar: `w-64 border-r` permanent desktop, collapsible mobile.

**Backend:** Supabase MCP to verify schema, extend Phase 6 tables, new tables: `tenant_applications`, `inventory_reports`, `deposit_registrations`, `legal_notices`. Defense-in-depth `supabase.auth.getUser()` on all API routes. Private storage bucket for compliance certs, tenancy agreements, inventory photos, legal notices.

### Claude's Discretion
- Exact chart types for Portfolio Analytics (suggested: area chart for income trend, bar for occupancy, donut for property type breakdown)
- Pagination strategy for large portfolios (cursor-based, 20 items per page)
- Toast notifications for async actions (upload cert, assign tradesperson, etc.)
- Loading skeletons for all data-fetched pages

### Deferred Ideas (OUT OF SCOPE)
- AI-powered rent price recommendation — Phase 15
- Automated rent arrears chasing (email sequences) — Phase 15
- Tenant portal (tenant-facing view) — Phase 15
- Integration with TDS/DPS/mydeposits APIs for real deposit registration — Phase 15
- Open Banking integration for automatic rent tracking — Phase 15
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LD-01 | Dashboard home shows real portfolio KPIs (total value, yield, occupancy rate, income summary) and compliance alerts from Supabase | Phase 6 `financial_entries` + `property_documents` tables exist; portfolio-service.ts provides foundation; extend with KPI aggregation RPC |
| LD-02 | Portfolio view lists all properties with tenancy status, rent, yield, occupancy — sortable and filterable | Phase 6 `tenancies` + `listings` tables exist; portfolio-service.ts already written; replace mock data with real queries |
| LD-03 | Individual property page shows tenancy details, income history, documents, and maintenance log from real data | Phase 6 services all exist (tenancy-service, financial-service, document-service, maintenance-service); wire to UI |
| LD-04 | Tenant screening workflow supports application review, credit check status, referencing, accept/reject with email notifications | New table `tenant_applications` required; add application status state machine + Resend email notifications |
| LD-05 | Rent collection overview and per-property views show real payment history with paid/partial/overdue status | Phase 6 `financial_entries` with `payment_status` column already exists; financial-service.ts covers this |
| LD-06 | Compliance dashboard tracks all certificate types (Gas Safety, EPC, EICR, Deposit Protection) with expiry alerts | Phase 6 `property_documents` with `document_category` enum and `expiry_date` exists; document-service.ts exists |
| LD-07 | Maintenance inbox and individual request pages support status tracking, photo uploads, and tradesperson assignment | Phase 6 `maintenance_requests` table + maintenance-service.ts exists; maintenance/page.tsx exists but uses mocks |
| LD-08 | Expense tracker and income/expense reports use real financial data with export capability | Phase 6 `financial_entries` table + financial-service.ts exists; finances/page.tsx exists but uses mocks |
| LD-09 | Tax summary exports correctly calculated figures for self-assessment | Extend financial-service.ts for tax-year aggregation; CSV via client-side; `@react-pdf/renderer` (already installed) for PDF |
| LD-10 | Section 21 and Section 8 notice builder generates legally correct PDF documents | New table `legal_notices`; `@react-pdf/renderer ^4.3.2` already installed; UK legal requirements documented in CONTEXT.md |
| LD-11 | Yield calculator and portfolio analytics provide real return calculations from property data | Client-side calculation (no new tables); Recharts `^2.15.4` already installed; yield formula documented in CONTEXT.md |
| LD-12 | Add property to portfolio flow works end-to-end | Extend existing listings/properties schema; add `rental_property` flag or dedicated property records |
| LD-13 | Create rental listing from portfolio property | Reuse existing listing creation infrastructure (Phase 2/3) |
| LD-14 | Tenancy agreement creation and PDF upload | `@react-pdf/renderer` for generation; `property-documents` bucket for storage |
| LD-15 | Deposit management tracks deposit scheme, amount, registration date per tenancy | New table `deposit_registrations`; extend `tenancies.deposit_scheme` field |
| LD-16 | Inventory check-in and check-out reports with photo uploads | New table `inventory_reports`; use existing `property-documents` storage bucket or new `inventory-photos` bucket |
| LD-17 | Find a Letting Agent page — browse agents filtered from existing marketplace | Reuse Epic 4 marketplace infrastructure (category=letting_agent) |
| LD-18 | Find Tradespeople page — landlord context browse | Reuse Epic 4 marketplace infrastructure (category filtering) |
| LD-19 | Insurance information page | Static/semi-static informational page; external link to providers |
| LD-20–LD-29 | All remaining pages in 29-page inventory | Covered by services listed above and new tables |
</phase_requirements>

---

## Summary

Phase 14 builds on a strong Phase 6 foundation. The database schema for the core landlord workflow already exists (`tenancies`, `maintenance_requests`, `financial_entries`, `property_documents` with RLS). The service layer is already written (`portfolio-service.ts`, `tenancy-service.ts`, `maintenance-service.ts`, `financial-service.ts`, `document-service.ts`). Seventeen existing page files exist under `src/app/(protected)/dashboard/landlord/` — but **every single page uses hardcoded mock data arrays**. The primary work is: (1) migrate mocks to real Supabase queries, (2) add four new tables for the new workflows, (3) build the 18 pages that do not yet exist, and (4) wire PDF generation for notices and agreements.

The tech stack is fully resolved: Recharts `^2.15.4`, `@react-pdf/renderer ^4.3.2`, and all required Shadcn UI components are already installed. The Stitch designs establish a consistent sidebar layout that matches the existing Phase 6 page skeleton. The route structure in CONTEXT.md introduces a significant restructuring — current routes live under nested property paths (e.g. `/dashboard/landlord/properties/[id]/maintenance/`), while Phase 14 introduces flat top-level routes (`/dashboard/landlord/maintenance`, `/dashboard/landlord/rent`, `/dashboard/landlord/finance/`). Both need to coexist or the old paths need redirects.

**Primary recommendation:** Start with Plan 14-01 (DB schema extensions for 4 new tables) then Plan 14-02 (service layer using real data to replace all mocks). Each subsequent UI plan (Plans 14-03 through 14-10) can then wire pages to real data from Day 1, never introducing new mocks.

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, Server Components, API routes | Project standard |
| React | 19.2.3 | UI rendering | Project standard |
| Supabase | `@supabase/ssr ^0.9.0` | Auth, database, storage | Project standard |
| @tanstack/react-query | ^5.90.21 | Client-side async state, optimistic updates | Project standard |
| Recharts | ^2.15.4 | Charts — income trend, occupancy bar, yield donut | Already installed |
| @react-pdf/renderer | ^4.3.2 | PDF generation for legal notices + tenancy agreements | Already installed |
| Shadcn UI | base-nova style | UI component library | Already installed, 33 components |
| Lucide React | ^0.577.0 | Icons (replaces Material Symbols from Stitch) | Project standard |
| sonner | ^2.0.7 | Toast notifications for async actions | Already installed |
| react-hook-form | ^7.71.2 | Form handling (add property, expense tracker, etc.) | Already installed |
| zod | ^4.3.6 | Schema validation | Already installed |
| @hookform/resolvers | ^5.2.2 | Zod + RHF integration | Already installed |
| jspdf | ^4.2.0 | Alternative PDF option (already installed) | Already installed |

### Shadcn Components Already Available
All 33 installed components are confirmed in `src/components/ui/`:
`alert`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `chart`, `checkbox`, `command`, `dialog`, `drawer`, `dropdown-menu`, `input-group`, `input`, `label`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle-group`, `toggle`, `tooltip`

**Key missing Shadcn components to add:** `calendar` (for date pickers in compliance upload), `date-picker` (same). Check with `npx shadcn add calendar` if needed.

### Installation Required
```bash
# No new package installs needed for core stack.
# If calendar component not in Shadcn:
# pnpm add react-day-picker@9 date-fns@4
# (react-day-picker may already be installed as a peer dep)
```

---

## What Phase 6 Built (Inventory)

### Database Tables (already exist)
| Table | Key Columns | Phase 14 Use |
|-------|-------------|--------------|
| `tenancies` | `property_id`, `landlord_id`, `tenant_name`, `lease_start_date`, `lease_end_date`, `rent_amount`, `payment_status`, `deposit_scheme` | LD-02, LD-03, LD-05 |
| `maintenance_requests` | `property_id`, `title`, `priority`, `status`, `assigned_provider_id`, `photo_urls[]` | LD-07 |
| `financial_entries` | `property_id`, `type` (income/expense), `category`, `amount`, `entry_date`, `payment_status` | LD-05, LD-08, LD-09 |
| `property_documents` | `property_id`, `category` (gas_safety/electrical_eicr/epc/insurance/lease_agreement/inventory), `expiry_date`, `next_reminder_date` | LD-06 |

### Services (already exist — currently using mock data in pages)
| Service | Location | Status |
|---------|----------|--------|
| `portfolio-service.ts` | `src/services/landlord/` | Written, fetches from Supabase but page uses mocks |
| `tenancy-service.ts` | `src/services/landlord/` | Written |
| `maintenance-service.ts` | `src/services/landlord/` | Written |
| `financial-service.ts` | `src/services/landlord/` | Written (includes `get_property_financial_summary` RPC) |
| `document-service.ts` | `src/services/landlord/` | Written |

### UI Components (already exist in `src/components/landlord/`)
`ComplianceAlert`, `DocumentList`, `DocumentUpload`, `FinancialEntryForm`, `FinancialSummary`, `LeasePreview`, `MaintenanceForm`, `MaintenanceList`, `MaintenanceStatusBadge`, `PortfolioGrid`, `PropertyCard`, `PropertyOverview`, `ProviderAssignment`, `RentStatusIndicator`, `TenancyForm`, `TenancyStatusBadge`

### Existing Pages (all use mock data — need wiring)
| Current Path | Phase 14 Route | Status |
|---|---|---|
| `/dashboard/landlord/portfolio` | `/dashboard/landlord/properties` (9.2) | Mock data |
| `/dashboard/landlord/properties/[id]/overview` | `/dashboard/landlord/properties/[id]` (9.3) | Mock data |
| `/dashboard/landlord/maintenance` | `/dashboard/landlord/maintenance` (9.15) | Mock data |
| `/dashboard/landlord/rent-collection` | `/dashboard/landlord/rent` (9.10) | Mock data |
| `/dashboard/landlord/compliance` | `/dashboard/landlord/compliance` (9.12) | Mock data |
| `/dashboard/landlord/finances` | `/dashboard/landlord/finance/expenses` (9.18) | Mock data |
| `/dashboard/landlord/tenants` | `/dashboard/landlord/tenants` (9.6) | Mock data |
| `/dashboard/landlord/properties/[id]/tenancies/[tenancyId]` | Part of 9.3 | Mock data |
| `/dashboard/landlord/properties/[id]/tenancies/[tenancyId]/lease` | 9.9 | Mock data |

### Storage Buckets (already exist)
- `maintenance-photos` — private, 1MB limit
- `expense-receipts` — private, 2MB limit
- `property-documents` — private, 2MB limit

---

## New Tables Required (Phase 14 DB Plan)

### Table 1: `tenant_applications`
```sql
CREATE TABLE tenant_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_user_id UUID REFERENCES auth.users(id),
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  -- Application data
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'shortlisted', 'referencing', 'approved', 'rejected', 'withdrawn')),
  monthly_income NUMERIC(10,2),
  employment_status TEXT,
  credit_check_status TEXT CHECK (credit_check_status IN ('pending', 'passed', 'failed', 'not_run')),
  references_status TEXT CHECK (references_status IN ('pending', 'received', 'verified')),
  notes TEXT,
  rejection_reason TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table 2: `inventory_reports`
```sql
CREATE TABLE inventory_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  landlord_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('check_in', 'check_out')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'complete', 'signed')),
  -- Report data (JSONB for flexible room-by-room structure)
  rooms JSONB DEFAULT '[]',
  notes TEXT,
  -- Photos stored as array of Storage paths
  photo_urls TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table 3: `deposit_registrations`
```sql
CREATE TABLE deposit_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenancy_id UUID NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(10,2) NOT NULL,
  scheme TEXT NOT NULL CHECK (scheme IN ('TDS', 'DPS', 'mydeposits', 'other')),
  scheme_reference TEXT,
  registration_date DATE,
  prescribed_info_sent_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'returned', 'disputed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table 4: `legal_notices`
```sql
CREATE TABLE legal_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  landlord_id UUID NOT NULL REFERENCES auth.users(id),
  notice_type TEXT NOT NULL CHECK (notice_type IN ('section_21', 'section_8')),
  -- Section 21 fields
  possession_date DATE,
  deposit_scheme_reference TEXT,
  epc_provided BOOLEAN,
  gas_safety_provided BOOLEAN,
  -- Section 8 fields
  grounds TEXT[],  -- e.g. ['ground_8', 'ground_10']
  arrears_amount NUMERIC(10,2),
  -- Common fields
  served_date DATE,
  pdf_storage_path TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'served')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New Storage Bucket
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('landlord-documents', 'landlord-documents', false, 5242880); -- 5MB
-- Covers: tenancy agreements, legal notices, inventory photos
```

---

## Architecture Patterns

### Recommended Project Structure (extending what exists)
```
src/
├── app/(protected)/dashboard/landlord/
│   ├── page.tsx                           # 9.1 Dashboard Home (NEW)
│   ├── layout.tsx                         # Sidebar shell (NEW — replaces per-page nav)
│   ├── properties/
│   │   ├── page.tsx                       # 9.2 Portfolio View (refactor existing)
│   │   ├── add/page.tsx                   # 9.4 Add Property (NEW)
│   │   └── [id]/
│   │       ├── page.tsx                   # 9.3 Individual Property (refactor existing)
│   │       └── listing/page.tsx           # 9.5 Create Rental Listing (NEW)
│   ├── tenants/
│   │   ├── page.tsx                       # 9.6 Tenant Screening (refactor existing)
│   │   ├── [applicationId]/
│   │   │   ├── page.tsx                   # 9.7 Application Detail (NEW)
│   │   │   └── decision/page.tsx          # 9.8 Accept/Reject (NEW)
│   │   └── [tenancyId]/agreement/page.tsx # 9.9 Tenancy Agreement (NEW)
│   ├── rent/
│   │   ├── page.tsx                       # 9.10 Rent Overview (refactor existing)
│   │   └── [propertyId]/page.tsx          # 9.11 Individual Rent (NEW)
│   ├── compliance/
│   │   ├── page.tsx                       # 9.12 Compliance Dashboard (refactor)
│   │   ├── upload/page.tsx                # 9.13 Upload Certificate (NEW)
│   │   └── alerts/page.tsx                # 9.14 Expiry Alerts (NEW)
│   ├── maintenance/
│   │   ├── page.tsx                       # 9.15 Inbox (refactor existing)
│   │   ├── [id]/page.tsx                  # 9.16 Individual Request (NEW)
│   │   └── [id]/assign/page.tsx           # 9.17 Assign Tradesperson (NEW)
│   ├── finance/
│   │   ├── expenses/page.tsx              # 9.18 Expense Tracker (refactor existing)
│   │   ├── report/page.tsx                # 9.19 Income & Expense Report (NEW)
│   │   └── tax/page.tsx                   # 9.20 Tax Summary (NEW)
│   ├── deposits/page.tsx                  # 9.25 Deposit Management (NEW)
│   ├── inventory/[propertyId]/
│   │   ├── check-in/page.tsx              # 9.23 (NEW)
│   │   └── check-out/page.tsx             # 9.24 (NEW)
│   ├── legal/notices/page.tsx             # 9.26 Notice Builder (NEW)
│   ├── find-agent/page.tsx                # 9.21 (NEW)
│   ├── find-tradespeople/page.tsx         # 9.22 (NEW)
│   ├── insurance/page.tsx                 # 9.27 (NEW)
│   ├── tools/yield-calculator/page.tsx    # 9.28 (NEW)
│   └── analytics/page.tsx                # 9.29 Portfolio Analytics (NEW)
├── services/landlord/
│   ├── portfolio-service.ts              # EXISTS — extend with KPI aggregation
│   ├── tenancy-service.ts                # EXISTS — wire to pages
│   ├── maintenance-service.ts            # EXISTS — wire to pages
│   ├── financial-service.ts              # EXISTS — extend with report/tax queries
│   ├── document-service.ts               # EXISTS — extend with compliance dashboard query
│   ├── tenant-application-service.ts     # NEW
│   ├── inventory-service.ts              # NEW
│   ├── deposit-service.ts                # NEW
│   └── legal-notice-service.ts           # NEW
└── components/landlord/                  # EXISTS — reuse all 17 components
```

### Pattern 1: Server Component Initial Load + React Query Hydration
**What:** Server Component fetches data, passes as `initialData` to React Query client component.
**When to use:** All data-fetched pages (portfolio, compliance dashboard, rent collection).
**Example:**
```typescript
// src/app/(protected)/dashboard/landlord/compliance/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getComplianceDashboard } from "@/services/landlord/document-service";

export default async function ComplianceDashboardPage() {
  const supabase = await createClient();
  const initialData = await getComplianceDashboard(supabase);
  return <ComplianceDashboardClient initialData={initialData} />;
}

// Client component uses React Query with initialData for optimistic updates
// "use client" + useQuery({ queryKey: ["compliance"], queryFn: ..., initialData })
```

### Pattern 2: Optimistic UI with useMutation + sonner toast
**What:** Mutation fires immediately, UI updates optimistically, toast confirms/reverts on error.
**When to use:** All write actions (log payment, upload cert, assign tradesperson, accept application).
```typescript
// Pattern from existing codebase (src/__tests__/services/dashboard-service.test.ts confirms pattern)
const mutation = useMutation({
  mutationFn: (data) => acceptApplication(supabase, applicationId, data),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ["applications"] });
    const previous = queryClient.getQueryData(["applications"]);
    queryClient.setQueryData(["applications"], (old) => optimisticUpdate(old, newData));
    return { previous };
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(["applications"], context?.previous);
    toast.error("Failed to update application");
  },
  onSuccess: () => toast.success("Application accepted"),
});
```

### Pattern 3: Shared Landlord Sidebar Layout
**What:** Single `layout.tsx` at `/dashboard/landlord/` renders the `w-64` sidebar from Stitch designs.
**When to use:** All 29 pages share this layout.
```typescript
// src/app/(protected)/dashboard/landlord/layout.tsx
// Sidebar nav items map to: Dashboard, Properties, Tenants, Finance, Compliance, Maintenance
// Active state: bg-primary/10 + border-l-4 border-primary (from Stitch dashboard-home.html)
// Desktop: permanent sidebar; Mobile: Sheet drawer (use Shadcn Sheet component)
```

### Pattern 4: @react-pdf/renderer for Legal Documents
**What:** Client-side PDF generation using `@react-pdf/renderer ^4.3.2` (already installed).
**When to use:** Section 21/8 notices (9.26), tenancy agreements (9.9), tax summary export (9.20).
```typescript
// "use client" component
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const Section21Notice = ({ notice }: { notice: LegalNotice }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Notice Seeking Possession of a Property Let on an Assured Shorthold Tenancy</Text>
        <Text>Housing Act 1988 Section 21(1)(b) or Section 21(4)(a)</Text>
      </View>
      {/* ... prescribed content ... */}
    </Page>
  </Document>
);
// NB: @react-pdf/renderer renders in a Web Worker — no SSR support, must be "use client"
```

### Pattern 5: Recharts via Shadcn ChartContainer
**What:** Use existing `src/components/ui/chart.tsx` wrapper (already built) rather than raw Recharts.
**When to use:** Portfolio Analytics (9.29), Income/Expense Report (9.19).
```typescript
// Already established in codebase — PriceTrendChart.tsx shows the pattern:
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
// Use ResponsiveContainer for responsive charts
// Colors: stroke="hsl(var(--primary))" for brand-aligned charts
// Or use ChartContainer from @/components/ui/chart for advanced tooltip styling
```

### Anti-Patterns to Avoid
- **Mock data in production pages:** Every page must query real Supabase data. The existing Phase 6 pages all use `const MOCK_*: MockType[] = [...]` — these must be removed and replaced with service calls.
- **SSR @react-pdf/renderer:** The library does not support server rendering. Any PDF component must be in a `"use client"` component, and use `PDFDownloadLink` or `BlobProvider`.
- **Public storage URLs for documents:** All document/certificate/notice storage paths must use `supabase.storage.from("bucket").createSignedUrl(path, 3600)` — never `getPublicUrl`. This is established as a project pattern.
- **Missing `supabase.auth.getUser()` in API routes:** Every `app/api/` route must call server-side `supabase.auth.getUser()` as defense-in-depth (not just middleware).
- **N+1 queries in portfolio view:** Use RPC / aggregated queries for portfolio stats. The `get_property_financial_summary(p_property_id)` function already exists.
- **Using the old nested route paths:** The new route structure flattens maintenance, rent, compliance to top-level. Don't nest under `/properties/[id]/maintenance/` for the main inbox view.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom HTML→canvas→PDF | `@react-pdf/renderer ^4.3.2` (already installed) | Handles page breaks, multi-page, fonts; already in package.json |
| Charts | SVG by hand | Recharts `^2.15.4` via `src/components/ui/chart.tsx` | Responsive, animated, consistent with existing PriceTrendChart |
| Form validation | Manual error checking | react-hook-form + zod (already used project-wide) | Consistent with services, validation schemas in place |
| File upload progress | XMLHttpRequest | react-dropzone `^15.0.0` (already installed) | Upload progress built-in |
| Toast notifications | Custom toast component | sonner `^2.0.7` (already installed) | Project standard; `src/components/ui/sonner.tsx` exists |
| Data tables | Custom table with sort/filter | `@tanstack/react-table ^8.21.3` (already installed) | Used in `src/components/data-table.tsx` |
| Date formatting | Manual date logic | date-fns (already available via react-day-picker peer dep) | Handles UK date formats, relative time |
| Sidebar mobile drawer | Custom overlay | Shadcn `Sheet` component (already in ui/) | Handles focus trap, animation, accessibility |
| Compliance expiry calculation | Manual `Date.diff()` | SQL column `days_until_expiry` in `get_documents_due_for_reminder()` RPC | Already exists in Phase 6 migration |

**Key insight:** The Phase 6 foundation was built specifically to avoid re-inventing these problems. The mistake to avoid is writing new mock-based components when the service layer already handles the real data queries.

---

## Common Pitfalls

### Pitfall 1: Route Collision Between Old and New Paths
**What goes wrong:** Phase 6 created `/dashboard/landlord/properties/[id]/maintenance/` paths. Phase 14 introduces top-level `/dashboard/landlord/maintenance/[id]/`. If both exist, Next.js will serve both, creating duplicate pages and broken navigation.
**Why it happens:** Phase 6 was property-centric (per-property sub-pages). Phase 14 is workflow-centric (cross-portfolio views).
**How to avoid:** In Plan 14-03, audit existing routes. Either (a) keep old paths as redirects to new paths using Next.js `redirect()`, or (b) remove old route files and replace with new ones. The existing pages at nested paths can remain as-is if they are referenced in the individual property overview (9.3), while the new top-level paths serve as the dashboard-wide inbox views.
**Warning signs:** 404s on navigation, unexpected page renders, layout.tsx not wrapping a page.

### Pitfall 2: Existing Pages Wire to Wrong Data Tables
**What goes wrong:** `rent-collection/page.tsx` uses a `TenantRow[]` mock. The Phase 6 table `financial_entries` stores rent records with `payment_status` — but the `tenancies` table also has a `deposit_scheme` field. It's tempting to query tenancies for rent status, but payment records live in `financial_entries`.
**Why it happens:** The data model has two sources of rent truth: `tenancies` (the contract) and `financial_entries` (the payment records).
**How to avoid:** Rent Collection pages (9.10/9.11) query `financial_entries WHERE category = 'rent' AND property_id = ...`, joined to `tenancies` for tenant name. Never query tenancies alone for payment status.

### Pitfall 3: @react-pdf/renderer Cannot Be Server-Rendered
**What goes wrong:** Importing `@react-pdf/renderer` in a Server Component causes a build error (`Error: Cannot use import statement in module`). The library uses browser APIs.
**Why it happens:** The library depends on `canvas` and browser Font APIs not available in Node.js runtime.
**How to avoid:** All PDF components must be in `"use client"` components. Use `dynamic(() => import('./NoticePdfDownload'), { ssr: false })` if the component is nested inside a Server Component tree.

### Pitfall 4: Stitch Primary Color Inconsistency
**What goes wrong:** Two Stitch designs (my-properties.html, maintenance-requests.html) use `primary: "#ec5b13"` (orange) instead of `#1B4D3E` (green). Building directly from those HTML files would produce brand-inconsistent components.
**Why it happens:** The Stitch designs were generated with different color configurations across the four files.
**How to avoid:** Always use `#1B4D3E` as primary — confirmed in CONTEXT.md and in `dashboard-home.html` and `tenant-screening.html`. The Stitch orange components must be recolored. The layout structure and component anatomy from those designs is correct; only the color tokens differ.

### Pitfall 5: Missing Landlord Dashboard Home Page
**What goes wrong:** The current `/dashboard/landlord/` route does not have a `page.tsx` — only sub-routes exist. If a landlord navigates to `/dashboard/landlord`, they get a 404 or the role switcher.
**Why it happens:** Phase 6 built sub-pages but not the dashboard home.
**How to avoid:** Plan 14-03 must create `/dashboard/landlord/page.tsx` (9.1) as the first deliverable, since all other plans reference it via the sidebar layout.

### Pitfall 6: tenant_applications Table RLS Must Scope to landlord_id
**What goes wrong:** Incorrectly writing RLS as `applicant_user_id = auth.uid()` instead of `landlord_id = auth.uid()` would let tenants see each other's applications or landlords see applications for other landlords' properties.
**Why it happens:** RLS on new tables is easy to get wrong when the table has both `landlord_id` and `applicant_user_id`.
**How to avoid:** RLS policy: landlord access via `landlord_id = auth.uid()`. Applicant access (future) via separate policy. Write test for this in Plan 14-01.

### Pitfall 7: Section 21 Legal Validity Requirements
**What goes wrong:** Generating a Section 21 notice PDF without including all prescribed information renders it invalid and unenforceable.
**Why it happens:** The Deregulation Act 2015 added requirements beyond the Housing Act 1988.
**How to avoid:** The Section 21 notice builder (9.26) must include: (a) deposit protection scheme name and reference, (b) confirmation EPC was provided to tenant, (c) confirmation Gas Safety Certificate was provided within 28 days. The `legal_notices` table must track `deposit_scheme_reference`, `epc_provided`, `gas_safety_provided` as required fields before the PDF can be generated. Block PDF generation if any required field is missing.

---

## Code Examples

### Aggregated Portfolio KPIs (Dashboard Home — LD-01)
```typescript
// src/services/landlord/portfolio-service.ts — extend with:
export async function getPortfolioKPIs(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  // Single RPC for all KPIs — avoids N queries
  const { data, error } = await supabase.rpc("get_landlord_portfolio_kpis", {
    p_landlord_id: user.id,
  });
  if (error) throw error;
  return data;
}
// Corresponding SQL function aggregates:
// - total property count, occupied count, vacancy rate
// - total monthly rent from active tenancies
// - compliance alerts count (expiry_date < NOW() + 30 days)
// - open maintenance requests count
```

### Compliance Dashboard Query (LD-06)
```typescript
// From document-service.ts — extend with:
export async function getComplianceSummary(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("property_documents")
    .select(`
      id, name, category, expiry_date, next_reminder_date,
      properties!inner(id, address_line_1, city, postcode)
    `)
    .in("category", ["gas_safety", "electrical_eicr", "epc"])
    .order("expiry_date", { ascending: true });
  // Group by category for dashboard tiles
  // Status logic: expiry_date < today = expired, < today+30 = expiring, else = valid
}
```

### @react-pdf/renderer Section 21 Notice
```typescript
// "use client" component only
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  title: { fontSize: 14, fontWeight: "bold", marginBottom: 10 },
  section: { marginBottom: 8 },
  body: { fontSize: 10, lineHeight: 1.5 },
});

export function Section21NoticePDF({ notice }: { notice: LegalNotice }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>
            Notice Requiring Possession of a Property Let on an Assured Shorthold Tenancy
          </Text>
          <Text style={styles.body}>Housing Act 1988 Section 21(1)(b) or Section 21(4)(a)</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.body}>To: {notice.tenantName}</Text>
          <Text style={styles.body}>Property: {notice.propertyAddress}</Text>
          <Text style={styles.body}>
            I/We give you notice that I/We require possession of the above-mentioned premises on {notice.possessionDate}.
          </Text>
        </View>
        {/* Prescribed information items */}
        <View style={styles.section}>
          <Text style={styles.body}>Deposit Protection Scheme: {notice.depositSchemeReference}</Text>
          <Text style={styles.body}>EPC provided to tenant: {notice.epcProvided ? "Yes" : "No"}</Text>
        </View>
      </Page>
    </Document>
  );
}
```

### Recharts Portfolio Analytics Chart
```typescript
// "use client"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

// Income trend (Claude's discretion — area chart)
<ResponsiveContainer width="100%" height={280}>
  <AreaChart data={monthlyIncome}>
    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
    <XAxis dataKey="month" className="text-xs" />
    <YAxis tickFormatter={(v) => `£${(v/1000).toFixed(0)}K`} className="text-xs" />
    <Tooltip formatter={(v) => [`£${Number(v).toLocaleString()}`, "Income"]} />
    <Area type="monotone" dataKey="income" stroke="#1B4D3E" fill="#1B4D3E" fillOpacity={0.15} strokeWidth={2} />
  </AreaChart>
</ResponsiveContainer>

// Property type breakdown (Claude's discretion — donut)
const COLORS = ["#1B4D3E", "#D4A853", "#3B82F6", "#6B7280"];
<PieChart width={240} height={240}>
  <Pie data={propertyTypes} cx={120} cy={120} innerRadius={60} outerRadius={100} dataKey="count">
    {propertyTypes.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
  </Pie>
</PieChart>
```

### Yield Calculator (Client-Side, No API — LD-11)
```typescript
// Pure client-side calculation — no Supabase query needed
// src/app/(protected)/dashboard/landlord/tools/yield-calculator/page.tsx
"use client";

function calculateYield(inputs: YieldInputs) {
  const annualRent = inputs.monthlyRent * 12;
  const annualCosts = (
    inputs.managementFee +
    inputs.maintenance +
    inputs.insurance +
    inputs.mortgage
  ) * 12;
  const grossYield = (annualRent / inputs.propertyValue) * 100;
  const netYield = ((annualRent - annualCosts) / inputs.propertyValue) * 100;
  return { grossYield: grossYield.toFixed(2), netYield: netYield.toFixed(2) };
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Mock data arrays in page files | Real Supabase queries via service layer | Phase 14's core task |
| Per-property sub-routes for maintenance/compliance | Top-level dashboard routes for cross-portfolio views | New route structure needed |
| jspdf for PDF generation | `@react-pdf/renderer` (React declarative PDFs) | More maintainable, better layout control |
| Nested property management pages | Flat workflow-centric routes | Better UX for landlords managing multiple properties |

**Deprecated/outdated in this codebase:**
- The `compliance-guide` route (`/dashboard/landlord/compliance-guide/`) appears to be a standalone educational page from Phase 6. Phase 14 supersedes it with the full compliance dashboard (9.12–9.14). Keep it or redirect as needed.
- The nested route `/dashboard/landlord/portfolio/` should be replaced by `/dashboard/landlord/properties/` per Phase 14 route structure.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + React Testing Library ^16.3.2 |
| Config file | `/Users/joanflerinbig/Documents/britv3.0/vitest.config.mts` |
| Environment | happy-dom |
| Setup file | `src/__tests__/setup.ts` |
| Quick run command | `pnpm test -- --run --reporter=verbose src/__tests__/services/landlord/` |
| Full suite command | `pnpm test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LD-01 | Portfolio KPI aggregation returns correct totals | unit | `pnpm test -- --run src/__tests__/services/landlord/portfolio-service.test.ts` | ❌ Wave 0 |
| LD-04 | `acceptApplication()` transitions status to 'approved', fires email | unit | `pnpm test -- --run src/__tests__/services/landlord/tenant-application-service.test.ts` | ❌ Wave 0 |
| LD-05 | `getRentCollection()` groups payments by paid/partial/overdue correctly | unit | `pnpm test -- --run src/__tests__/services/landlord/financial-service.test.ts` | ❌ Wave 0 |
| LD-06 | Compliance summary returns documents grouped by status (expired/expiring/valid) | unit | `pnpm test -- --run src/__tests__/services/landlord/document-service.test.ts` | ❌ Wave 0 |
| LD-09 | Tax summary calculates correct income/expense/net for a UK tax year (Apr–Mar) | unit | `pnpm test -- --run src/__tests__/services/landlord/financial-service.test.ts` | ❌ Wave 0 |
| LD-10 | Section 21 notice builder blocks PDF generation if epc_provided = false | unit | `pnpm test -- --run src/__tests__/services/landlord/legal-notice-service.test.ts` | ❌ Wave 0 |
| LD-11 | Yield calculator returns correct gross/net yield given known inputs | unit | `pnpm test -- --run src/__tests__/landlord/yield-calculator.test.ts` | ❌ Wave 0 |
| RLS | `tenant_applications` RLS: landlord can only read own rows | integration | manual Supabase MCP verify | manual-only |
| PDF | @react-pdf/renderer renders Section 21 without crash | smoke | `pnpm test -- --run src/__tests__/landlord/section21-pdf.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test -- --run src/__tests__/services/landlord/`
- **Per wave merge:** `pnpm test -- --run`
- **Phase gate:** Full suite green + `pnpm build` passes before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/services/landlord/portfolio-service.test.ts` — covers LD-01 KPI aggregation
- [ ] `src/__tests__/services/landlord/tenant-application-service.test.ts` — covers LD-04 state transitions
- [ ] `src/__tests__/services/landlord/financial-service.test.ts` — covers LD-05, LD-09
- [ ] `src/__tests__/services/landlord/document-service.test.ts` — covers LD-06
- [ ] `src/__tests__/services/landlord/legal-notice-service.test.ts` — covers LD-10 validation logic
- [ ] `src/__tests__/landlord/yield-calculator.test.ts` — covers LD-11 pure function
- [ ] `src/__tests__/fixtures/landlord.ts` — shared fixtures (mock tenancies, applications, financial entries)
- [ ] `src/__tests__/mocks/supabase-landlord.ts` — landlord-specific mock overrides (or extend existing `src/__tests__/mocks/supabase.ts`)

Note: Existing `src/__tests__/mocks/supabase.ts` and fixture infrastructure is available — landlord tests follow the same pattern as `dashboard-service.test.ts`.

---

## Open Questions

1. **Route Migration Strategy: Old vs New Paths**
   - What we know: Phase 6 created nested routes (e.g., `/dashboard/landlord/properties/[id]/maintenance/[requestId]`) that must coexist with or replace Phase 14 flat routes (`/dashboard/landlord/maintenance/[id]`).
   - What's unclear: Should the old per-property maintenance/tenancy/document pages be kept as-is (referenced from the individual property page 9.3) while new top-level routes serve as portfolio-wide inboxes? Or should old paths be removed and replaced?
   - Recommendation: Keep both — the individual property page (9.3) links to per-property sub-views, while top-level routes provide portfolio-wide views. Add `next.config.ts` redirects from old `/portfolio/` path to new `/properties/` path only.

2. **Missing Dashboard Home (page.tsx at `/dashboard/landlord/`)**
   - What we know: No `page.tsx` exists at the landlord root. The `[role]` layout may be handling routing.
   - What's unclear: What happens when a landlord authenticates? Where do they land?
   - Recommendation: Plan 14-03 must create the root `page.tsx` (9.1 Dashboard Home) as priority #1 before any other page, since the sidebar layout wraps all pages.

3. **`listings` vs dedicated `rental_properties` table**
   - What we know: Phase 6 services query the `listings` table for portfolio data (confirmed in `portfolio-service.ts`). The Phase 14 CONTEXT.md says "Extend Phase 6 tables where possible."
   - What's unclear: The `listings` table was designed for property search (Phase 2). Adding rental-specific fields (e.g., `is_rental_portfolio_item`) may require extending it or adding a separate `rental_properties` table.
   - Recommendation: Add a `rental_properties` view or a boolean flag `is_rental = true` on listings rather than a separate table. Verify with Supabase MCP before writing migration SQL.

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/services/landlord/*.ts` — confirmed 5 service files exist
- Codebase inspection: `supabase/migrations/20260307_epic7_property_management.sql` — confirmed 4 Phase 6 tables with RLS
- Codebase inspection: `package.json` — confirmed all required packages installed including recharts ^2.15.4, @react-pdf/renderer ^4.3.2
- Codebase inspection: `src/app/(protected)/dashboard/landlord/**` — confirmed 17 existing page files, all using mock data
- Codebase inspection: `src/components/landlord/` — confirmed 17 reusable landlord components
- Codebase inspection: `src/components/ui/` — confirmed 33 Shadcn UI components installed

### Secondary (MEDIUM confidence)
- Stitch HTML reference designs (4 files) — verified Tailwind classes, component structure, layout patterns
- CONTEXT.md Phase 14 spec — verified route structure, new tables, UK legal requirements
- ROADMAP.md Phase 14 section — verified 10-plan breakdown and success criteria

### Tertiary (LOW confidence)
- UK Housing Law requirements (Section 21/8, Gas Safety, EPC, EICR, Deposit Protection) — sourced from CONTEXT.md specifics section; not independently verified against current legislation but consistent with Deregulation Act 2015 and Housing Act 1988 requirements as known to training data

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed via package.json inspection
- Existing Phase 6 inventory: HIGH — confirmed via file system inspection
- Architecture patterns: HIGH — consistent with existing codebase patterns (dashboard-service.test.ts, PriceTrendChart.tsx)
- UK legal requirements: MEDIUM — sourced from CONTEXT.md; legal details not independently verified
- New table schemas: MEDIUM — designed to fit existing pattern but require Supabase MCP verification before migration

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (30 days — stable stack, no fast-moving dependencies)
