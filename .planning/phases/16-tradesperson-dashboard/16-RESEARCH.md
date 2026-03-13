# Phase 16: Tradesperson / Service Provider Dashboard — Research

**Researched:** 2026-03-13
**Domain:** Provider dashboard UI (25 pages), Stripe Connect, @react-pdf/renderer, MapLibre polygon drawing, Supabase Storage verification docs
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- FAANG level implementation — every page must match or exceed the Stitch reference designs
- Use `britestatestyle.txt` for all colour tokens, typography, spacing, and component rules
- All components Server Components by default; `"use client"` only where needed
- Full Britestate design system: Plus Jakarta Sans headings, Inter body, brand-primary #1B4D3E
- 25 pages implementing groups 1-7 (Dashboard, Verification, Services, Jobs, Financial, Portfolio/Reviews, Growth)
- Route root: `src/app/(protected)/dashboard/provider/`
- Data from Supabase (Phase 3+4 tables) + Stripe Connect + MapLibre + Recharts + @react-pdf/renderer
- Use existing Phase 3 DashboardShell layout
- Build provider-specific components in `src/components/dashboard/provider/`
- Stripe Connect Express pattern (Claude's discretion on exact flow)
- Prefer Supabase Realtime over polling for job notifications

### Claude's Discretion
- Exact Stripe Connect onboarding flow details (standard Connect Express pattern)
- PDF invoice/quote template styling (follow britestatestyle.txt brand tokens)
- Real-time job notification mechanism (prefer Realtime for job notifications)
- Referral programme reward structure UI (show £50/referred provider earning or percentage)

### Deferred Ideas (OUT OF SCOPE)
- Mobile app / PWA-specific UX for providers (Phase 7 handles PWA)
- AI-assisted quote generation
- SMS notifications for new leads
- Multi-user provider accounts (team members)
- Direct bank transfer payments (Stripe Connect only)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TPD-01 | Dashboard Home — KPI cards (new leads, active jobs, earnings, verification status), recent activity feed, quick action buttons, upcoming jobs list | ProviderDashboard type in dashboard.ts; getDashboardData service in dashboard-service.ts; Stitch design in dashboard-overview.html |
| TPD-02 | Profile Edit — bio editor, photo upload, qualifications, service areas, live preview | provider-service.ts createProviderProfile/updateProviderProfile; ServiceProviderDetails type; react-dropzone already installed |
| TPD-03 | Verification Centre Overview — step-by-step progress stepper (identity → insurance → qualifications → client refs → peer refs → review), badge status | provider_documents table in 002_marketplace.sql; VerificationDocumentType enum; Stitch design in verification-trust-center.html |
| TPD-04 | Upload Credentials — document upload for Gas Safe, NICEIC, CSCS etc | Supabase Storage + TUS resumable upload already patterned in Phase 10; uploadProviderDocument in provider-service.ts |
| TPD-05 | Client References Tracker — 3 client references: send/remind/status/view | New table needed: provider_references; email via Resend already installed |
| TPD-06 | Peer References Tracker — 3 peer endorsements (same structure, industry peers) | Same provider_references table with type enum ('client' | 'peer') |
| TPD-07 | Badge Status — earned badges with dates, expiry warnings, explanations | New table needed: provider_badges; computed from verification milestones |
| TPD-08 | Services Manage — add/edit/delete services, pricing (hourly/fixed/QOR), categories, descriptions | services column on service_provider_details (ServiceCategory[]); new provider_services table for per-service details |
| TPD-09 | Service Areas Map Editor — MapLibre draw radius circle OR polygon, multiple zones | terra-draw + terra-draw-maplibre-gl-adapter already installed; GeoJSON already a dependency |
| TPD-10 | Availability Calendar — monthly/weekly, available/blocked/booked slots, recurring rules | provider_availability table already in 002_marketplace.sql; new recurring_availability_rules table needed |
| TPD-11 | Jobs — New Enquiries/Leads — incoming job requests, filter, accept/decline/message, urgency badges | service_requests (RFQ) table + rfq-service.ts + Stitch design in job-leads-enquiries.html |
| TPD-12 | Jobs — Active — in-progress jobs table, status badges, next actions | bookings table (status = 'in_progress'); booking-service.ts |
| TPD-13 | Jobs — Completed — history, searchable, exportable, review prompts | bookings table (status = 'completed'); review-service.ts |
| TPD-14 | Job Detail — full view: scope, messages, timeline, quote, invoice, payment, review | joins: bookings + quotes + conversations + reviews; new provider_invoices table |
| TPD-15 | Quote Builder — line-item builder (materials + labour + VAT), totals, client details, preview, send | quotes table already exists; quote-service.ts createQuote; Stitch design in quote-builder.html |
| TPD-16 | Invoice Generator — generate from completed job or manually, PDF export, mark as paid | @react-pdf/renderer already installed (^4.3.2); new provider_invoices table |
| TPD-17 | Payments Overview — Stripe Connect balance, pending payouts, total earned, payout schedule | Stripe Connect Express API; new stripe_connect_accounts table needed |
| TPD-18 | Individual Transaction — job reference, amount, fees, net payout, status, related invoice | Stripe charges/transfers API + provider_invoices table |
| TPD-19 | Portfolio/Gallery Manage — before/after photo pairs, title, description, tags, drag-and-drop reorder | @dnd-kit already installed; Supabase Storage; new provider_portfolio_items table |
| TPD-20 | Reviews Dashboard — star rating breakdown, all reviews, filter by rating | reviews table already in 002_marketplace.sql; review-service.ts |
| TPD-21 | Reviews Respond — write public response, guidelines, character limit, preview | provider_response field on reviews table; review-service.ts respondToReview |
| TPD-22 | Analytics — profile views, enquiry rate, conversion funnel, earnings trend, top categories | Recharts already installed (^2.15.4); new provider_analytics table or computed from existing data |
| TPD-23 | Subscription & Billing — current plan display, plan comparison, billing history, Stripe payment method | Stripe Customer + Subscription API; new provider_subscriptions table |
| TPD-24 | Promote / Boost Profile — featured placement purchase, coverage area boost, duration/price, active promotions | Stripe Checkout for one-time purchases; new provider_boosts table |
| TPD-25 | Referral Programme — referral link/code, referred providers list with status, earnings from referrals | nanoid already available; referral_codes table pattern from buyer dashboard; new provider_referrals table |
</phase_requirements>

---

## Summary

Phase 16 builds 25 provider-facing dashboard pages on top of a codebase that already has the most critical dependencies installed and service layer foundations in place. The Phases 3 and 4 work delivered: `service_provider_details`, `provider_documents`, `service_requests` (RFQs), `quotes`, `bookings`, `reviews` tables with RLS; corresponding TypeScript types; and service functions for provider CRUD, quotes, bookings, and reviews. The dashboard shell (`DashboardShell`, `StatCard`, `ActivityFeed`) and `ProviderDashboard` type stub also exist.

The key new work is: (a) 8 new DB tables (provider_services, provider_references, provider_badges, provider_portfolio_items, provider_invoices, stripe_connect_accounts, provider_boosts, provider_referrals), (b) new route group `(protected)/dashboard/provider/` with 25 page files, (c) PDF generation using `@react-pdf/renderer` (already installed), (d) MapLibre service area polygon editing using `terra-draw` (already installed), and (e) Stripe Connect Express onboarding and payout display.

The Stitch reference designs use dark-mode-first Inter with a green (#17cf97 in Stitch, mapped to brand-primary #1B4D3E in Britestate design system). The four Stitch files show a consistent sidebar navigation pattern with a left sidebar that maps cleanly to a dedicated provider layout component.

**Primary recommendation:** Create a dedicated `src/app/(protected)/dashboard/provider/layout.tsx` with the full sidebar navigation serving all 25 pages, then implement pages wave-by-wave following the 7 functional groups.

---

## Standard Stack

### Core (all already installed — HIGH confidence)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | Routing, Server Components, API routes | Project standard |
| React | 19.2.3 | UI framework | Project standard |
| TypeScript | 5 | Type safety | Project standard |
| Tailwind CSS v4 | ^4 | Utility-first styling | Project standard |
| Shadcn UI + Radix | (components.json) | Component primitives | Project standard |
| @supabase/supabase-js | ^2.98.0 | DB, Auth, Storage, Realtime | Project standard |
| @tanstack/react-query | ^5.90.21 | Client-side async state | Project standard |
| recharts | ^2.15.4 | Analytics charts | Project standard — already installed |
| @react-pdf/renderer | ^4.3.2 | PDF generation for quotes/invoices | Already installed |
| maplibre-gl | ^5.19.0 | Map rendering | Already installed |
| terra-draw | ^1.25.0 | Map drawing (polygon/radius) | Already installed |
| terra-draw-maplibre-gl-adapter | ^1.3.0 | terra-draw + MapLibre glue | Already installed |
| @dnd-kit/core + sortable | ^6.3.1 / ^10.0.0 | Drag-and-drop portfolio reorder | Already installed |
| react-dropzone | ^15.0.0 | File upload UI | Already installed |
| react-hook-form | ^7.71.2 | Forms | Already installed |
| zod | ^4.3.6 | Validation | Already installed |
| sonner | ^2.0.7 | Toast notifications | Already installed |
| lucide-react | ^0.577.0 | Icons | Already installed |
| inngest | ^3.52.6 | Background jobs (reference request emails) | Already installed |
| resend | ^6.9.3 | Transactional email | Already installed |

### New Dependencies Required

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| stripe | ^17.x | Stripe Connect API — server only | Not yet installed; needed for Connect Express onboarding, balance, payouts |
| @stripe/stripe-js | ^5.x | Stripe.js client — client only | Needed for Stripe Elements in billing/subscription pages |
| nanoid | ^5 | Referral code generation | Already used in buyer dashboard pattern; check if installed |

**Check before installing:**
```bash
# From project root (not britv3.0/)
cat package.json | grep stripe
cat package.json | grep nanoid
```

**Install if missing:**
```bash
pnpm add stripe @stripe/stripe-js nanoid
```

### Already Installed — Confirmed from package.json
- `@react-pdf/renderer@^4.3.2` — PDF quotes and invoices
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` — portfolio drag-and-drop
- `terra-draw@^1.25.0` + `terra-draw-maplibre-gl-adapter@^1.3.0` — service area map editor
- `recharts@^2.15.4` — analytics charts
- `react-dropzone@^15.0.0` — credential and portfolio uploads
- `@vis.gl/react-maplibre@^8.1.0` — MapLibre React wrapper

---

## Architecture Patterns

### Recommended Project Structure

```
src/app/(protected)/dashboard/provider/
├── layout.tsx                          # Provider sidebar nav + auth guard
├── page.tsx                            # Dashboard Home (TPD-01)
├── profile/page.tsx                    # Profile Edit (TPD-02)
├── verification/
│   ├── page.tsx                        # Verification Overview (TPD-03)
│   ├── credentials/page.tsx            # Upload Credentials (TPD-04)
│   ├── client-references/page.tsx      # Client References (TPD-05)
│   ├── peer-references/page.tsx        # Peer References (TPD-06)
│   └── badges/page.tsx                 # Badge Status (TPD-07)
├── services/
│   ├── page.tsx                        # Services Manage (TPD-08)
│   └── areas/page.tsx                  # Service Areas Map (TPD-09)
├── availability/page.tsx               # Availability Calendar (TPD-10)
├── jobs/
│   ├── leads/page.tsx                  # New Enquiries (TPD-11)
│   ├── active/page.tsx                 # Active Jobs (TPD-12)
│   ├── completed/page.tsx              # Completed Jobs (TPD-13)
│   └── [id]/page.tsx                   # Job Detail (TPD-14)
├── quotes/
│   ├── builder/page.tsx                # Quote Builder (TPD-15)
│   └── [id]/invoice/page.tsx           # Invoice Generator (TPD-16)
├── payments/
│   ├── page.tsx                        # Payments Overview (TPD-17)
│   └── [id]/page.tsx                   # Individual Transaction (TPD-18)
├── portfolio/page.tsx                  # Portfolio Manage (TPD-19)
├── reviews/
│   ├── page.tsx                        # Reviews Dashboard (TPD-20)
│   └── [id]/respond/page.tsx           # Review Respond (TPD-21)
├── analytics/page.tsx                  # Analytics (TPD-22)
├── billing/page.tsx                    # Subscription & Billing (TPD-23)
├── boost/page.tsx                      # Promote/Boost (TPD-24)
└── referrals/page.tsx                  # Referral Programme (TPD-25)

src/components/dashboard/provider/
├── ProviderDashboard.tsx               # Already exists (shell stub)
├── ProviderSidebar.tsx                 # New: sidebar nav component
├── ProviderLayout.tsx                  # New: layout wrapper
├── KPICard.tsx                         # New: KPI stat card variant
├── VerificationStepper.tsx             # New: verification progress
├── CredentialUploadCard.tsx            # New: individual doc upload
├── ReferenceTracker.tsx                # New: client/peer ref tracking
├── BadgeGallery.tsx                    # New: earned badges grid
├── ServiceCard.tsx                     # New: editable service item
├── ServiceAreaMapEditor.tsx            # New: terra-draw map editor
├── AvailabilityCalendar.tsx            # New: calendar with slots
├── JobLeadCard.tsx                     # New: lead inbox card
├── JobDetailView.tsx                   # New: full job detail panel
├── QuoteBuilderForm.tsx                # New: quote line item builder
├── InvoicePreview.tsx                  # New: @react-pdf invoice preview
├── PaymentsOverview.tsx                # New: Stripe balance display
├── PortfolioGrid.tsx                   # New: dnd-kit sortable grid
├── ReviewCard.tsx                      # New: review with response
├── AnalyticsCharts.tsx                 # New: Recharts area/bar charts
├── ConversionFunnel.tsx                # New: funnel visualization
└── ReferralCard.tsx                    # New: referral stats + link

src/services/provider/
├── provider-dashboard-service.ts       # New: aggregated KPI queries
├── provider-verification-service.ts    # New: references, badges
├── provider-invoice-service.ts         # New: invoice CRUD
├── provider-analytics-service.ts       # New: analytics aggregations
├── stripe-connect-service.ts           # New: Connect Express onboarding/balance
└── provider-subscription-service.ts    # New: billing/subscription management

src/types/
└── provider-dashboard.ts               # New: extended provider types
```

### Pattern 1: Provider-Specific Route Layout

The provider dashboard needs its own layout (not the generic `[role]` layout) because it has a dedicated 25-page sidebar navigation structure:

```typescript
// src/app/(protected)/dashboard/provider/layout.tsx
// Source: mirrors src/app/(protected)/dashboard/[role]/layout.tsx pattern
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProviderSidebar } from "@/components/dashboard/provider/ProviderSidebar";

export default async function ProviderDashboardLayout(
  props: Readonly<{ children: React.ReactNode }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify service_provider role
  const { data: role } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "service_provider")
    .maybeSingle();

  if (!role) redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <ProviderSidebar userId={user.id} />
      <main className="flex-1 overflow-y-auto">
        {props.children}
      </main>
    </div>
  );
}
```

### Pattern 2: Server Component Data Loading

Follow the project's established server-component pattern (same as landlord dashboard pages):

```typescript
// src/app/(protected)/dashboard/provider/jobs/leads/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getProviderLeads } from "@/services/provider/provider-dashboard-service";
import { JobLeadsClient } from "./JobLeadsClient";

export default async function JobLeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const leads = await getProviderLeads(supabase, user.id);
  return <JobLeadsClient initialLeads={leads} />;
}
```

### Pattern 3: @react-pdf/renderer for Invoices and Quotes

The quote builder Stitch design shows a split-pane layout: form on left, live PDF preview on right. The recommended approach is:

1. **Server Action** generates the PDF blob using `@react-pdf/renderer` on the server (avoids large client bundle)
2. **Client preview** uses `<PDFViewer>` from `@react-pdf/renderer` rendered client-side only (`dynamic(ssr: false)`)
3. **Download** triggers server action returning blob as download

```typescript
// "use client" component with dynamic import
import dynamic from "next/dynamic";
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then(m => ({ default: m.PDFViewer })),
  { ssr: false, loading: () => <div>Loading preview...</div> }
);
```

The `jspdf` package (^4.2.0) is also installed. For complex branded invoices, `@react-pdf/renderer` is strongly preferred as it handles layout properly with React component trees. `jspdf` is a lower-level canvas API — avoid for this use case.

### Pattern 4: Terra-Draw Service Area Editor

The service areas page needs a MapLibre map with draw-to-create radius circles and custom polygons. The terra-draw stack is already installed:

```typescript
// src/components/dashboard/provider/ServiceAreaMapEditor.tsx
// "use client"
import { useMap } from "@vis.gl/react-maplibre";
import { TerraDraw, TerraDrawMapLibreGLAdapter } from "terra-draw";
import { TerraDrawCircleMode, TerraDrawPolygonMode } from "terra-draw";

// Modes: TerraDrawCircleMode for radius, TerraDrawPolygonMode for custom
// GeoJSON features stored in provider_service_areas table (PostGIS geometry column)
```

Persist drawn zones as GeoJSON FeatureCollections in a `provider_service_areas` table (new, with a `geometry` PostGIS column).

### Pattern 5: Stripe Connect Express Onboarding

The standard Stripe Connect Express pattern for a marketplace:

1. **Account creation**: `POST /api/stripe/connect/create-account` — calls `stripe.accounts.create({ type: 'express' })`, stores `stripe_account_id` in `stripe_connect_accounts` table
2. **Onboarding link**: `POST /api/stripe/connect/onboarding-link` — calls `stripe.accountLinks.create(...)`, returns URL for redirect
3. **Webhook handler**: `POST /api/stripe/webhooks` — handles `account.updated` to update `stripe_connect_accounts.onboarding_complete`
4. **Balance read**: Server component calls `stripe.balance.retrieve({ stripeAccount: accountId })` — display available/pending balance
5. **Payout trigger**: `POST /api/stripe/connect/payout` — calls `stripe.payouts.create(...)` on the connected account

**IMPORTANT**: Stripe Connect requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env.local`. These are referenced in `britv3.0/.env.example`.

### Pattern 6: Supabase Realtime for Job Notifications

For new lead notifications, use Supabase Realtime channel subscription on `service_requests` where the provider's service categories and postcode fall within the request area. This is preferable to polling per the CONTEXT.md decision.

```typescript
// In a client component using React useEffect
const supabase = createClient();
const channel = supabase
  .channel("provider-leads")
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "service_requests",
  }, (payload) => {
    // Check if this lead matches provider's service areas/categories
    // Show sonner toast notification
  })
  .subscribe();
```

Filter server-side via Supabase Realtime filters where possible, or client-side on category/postcode match.

### Pattern 7: Availability Calendar

The calendar combines two data sources:
1. `provider_availability` table (Phase 4) — blocked/unavailable date ranges
2. `bookings` table — confirmed job bookings that auto-block time

Recommended implementation: use a simple custom monthly/weekly calendar grid (not a heavy library like react-big-calendar) built with CSS grid + date-fns (not installed — use `Date` methods directly or add date-fns if needed). The Stitch design shows a lightweight grid, not a full calendar widget.

### Anti-Patterns to Avoid

- **Importing @react-pdf/renderer in Server Components without dynamic import**: The library uses browser globals; always wrap in `dynamic(ssr: false)` or render server-side in an API route
- **Calling Stripe API client-side**: Stripe secret key must only be used in Server Actions, Route Handlers, or Server Components — never in `"use client"` files
- **Using the generic `[role]/page.tsx` for provider pages**: Provider needs its own route group because it has far more navigation depth than the generic role dashboard
- **Storing GeoJSON service areas as text**: Use PostGIS `geometry` type in the DB for proper spatial queries
- **Fetching Stripe balance on every page render**: Cache in Redis with 60-second TTL (Stripe rate limits apply)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom HTML-to-PDF canvas | @react-pdf/renderer (already installed) | Handles pagination, fonts, layout correctly |
| Map polygon drawing | Custom SVG canvas overlay | terra-draw (already installed) | Handles complex geometry, snapping, edit modes |
| Drag-and-drop portfolio reorder | Custom mouse event handlers | @dnd-kit/sortable (already installed) | Accessibility, touch support, animation hooks |
| File upload with progress | XMLHttpRequest wrapper | react-dropzone + Supabase Storage upload (pattern from Phase 10) | Resumable TUS protocol, progress events |
| Form validation | Manual field checks | react-hook-form + zod (already installed) | Type-safe, performant |
| Stripe payment collection | Manual bank details | Stripe Connect Express + Stripe Elements | PCI compliance, webhook events |
| Quote/invoice numbering | Random UUID | Sequential with prefix (e.g., `QT-2024-001`) generated server-side | Professional appearance, sortable |

**Key insight:** Every heavy technical problem in Phase 16 already has a dependency installed. This phase is primarily UI assembly work on top of existing infrastructure, not new technology integration.

---

## Common Pitfalls

### Pitfall 1: Stitch Color Token Mismatch

**What goes wrong:** Stitch reference files use different green tokens (`#11d432`, `#17cf97`) than the Britestate design system (`#1B4D3E` brand-primary, `#2D7A5F` primary-light).
**Why it happens:** Stitch generated placeholder colors; the real design system is in `britestatestyle.txt`.
**How to avoid:** Map Stitch's `primary` class to `brand-primary` (#1B4D3E) throughout. The dark backgrounds in Stitch (`#102213`, `#11211c`) map to Britestate's dark mode tokens. Apply both light and dark mode properly via `dark:` Tailwind prefix.
**Warning signs:** Any component using hardcoded hex colors from the Stitch HTML; any component where `bg-primary` doesn't match the forest green.

### Pitfall 2: Provider Layout Route Conflict

**What goes wrong:** Adding `src/app/(protected)/dashboard/provider/layout.tsx` while `src/app/(protected)/dashboard/[role]/layout.tsx` also matches the `provider` path segment since `[role]` is a catch-all.
**Why it happens:** Next.js route groups: a static segment `provider` takes precedence over a dynamic `[role]` segment at the same level. This is correct behavior — but only if the `provider/` directory is a sibling of `[role]/`, not inside it.
**How to avoid:** The `provider/` directory at `dashboard/provider/` is a static segment that outranks `dashboard/[role]/`. The existing role layout will NOT apply to provider routes. Verify the provider layout handles its own auth guard completely.
**Warning signs:** Provider pages rendering with the wrong layout or failing auth checks silently.

### Pitfall 3: @react-pdf/renderer SSR

**What goes wrong:** Next.js tries to SSR a component that imports `@react-pdf/renderer`, throwing `ReferenceError: window is not defined`.
**Why it happens:** The library references browser globals at module load time.
**How to avoid:** Always use `dynamic(() => import("@react-pdf/renderer").then(...), { ssr: false })` for any component using PDFViewer or Document. The actual PDF generation (for server-side blob creation) can use the Node.js API via `renderToBuffer` in a Route Handler.
**Warning signs:** Build error "ReferenceError: window is not defined" during `pnpm build`.

### Pitfall 4: Missing New DB Tables

**What goes wrong:** Pages fail at runtime because the required tables (`provider_services`, `provider_references`, `provider_badges`, `provider_portfolio_items`, `provider_invoices`, `stripe_connect_accounts`, `provider_boosts`, `provider_referrals`, `provider_service_areas`) don't exist in Supabase.
**Why it happens:** Phase 16 requires new tables not created in Phases 1-4.
**How to avoid:** Wave 0 plan must create the migration SQL for all 9 new tables with RLS before any page work begins.
**Warning signs:** Supabase query returns `relation "provider_services" does not exist`.

### Pitfall 5: Stripe Connect Webhook Verification

**What goes wrong:** Stripe webhook events are processed without signature verification, creating a security vulnerability (any HTTP POST could fake payment events).
**Why it happens:** Easy to skip `stripe.webhooks.constructEvent()` during development.
**How to avoid:** Always use `stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)` in the webhook route handler. The raw body (not parsed JSON) must be passed — use `req.text()` not `req.json()` in the Route Handler.
**Warning signs:** Webhook handler that calls `req.json()` directly.

### Pitfall 6: Terra-Draw Map Editor Cleanup

**What goes wrong:** Map drawing event listeners and terra-draw instances pile up on component re-renders, causing memory leaks and duplicate draw events.
**Why it happens:** terra-draw requires manual cleanup via `.destroy()`.
**How to avoid:** Always call `draw.destroy()` in the `useEffect` cleanup return function. Keep the terra-draw instance in a `useRef`, not `useState`.
**Warning signs:** Drawing a polygon causes multiple polygons to appear; console shows duplicate event handlers.

### Pitfall 7: Availability Calendar Timezone

**What goes wrong:** Calendar shows incorrect available/booked dates due to UTC vs UK local time mismatch. Boiler service at 9am UK appears on previous day in UTC during BST (UTC+1).
**Why it happens:** Supabase stores timestamps in UTC; UK providers operate in GMT/BST.
**How to avoid:** Store availability as `DATE` (not `TIMESTAMPTZ`) for all-day blocks. For time-specific slots, store `TIMESTAMPTZ` but display with `Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London' })`. Never use `Date.toLocaleDateString()` without explicit timezone.
**Warning signs:** Booked dates appear one day early or late in the calendar view.

---

## Code Examples

Verified patterns from existing codebase:

### Existing Dashboard Service Pattern (reuse for provider KPI)
```typescript
// Source: src/services/dashboard/dashboard-service.ts
// Pattern: cache-first with Redis, 5-minute TTL
export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole,
): Promise<DashboardResult> {
  const cached = await getCached<DashboardData>(cacheKey(userId));
  if (cached) return { data: cached, cached: true };
  const data = await buildDashboardData(supabase, userId, role);
  await setCache(cacheKey(userId), data, CACHE_TTL_SECONDS);
  return { data, cached: false };
}
```

### Existing Provider Profile CRUD (reuse for profile edit)
```typescript
// Source: src/services/marketplace/provider-service.ts
// ServiceProviderDetails type has: services[], service_postcodes[], service_radius,
// qualifications[], accreditations[], insurance_details, portfolio_urls[],
// pricing (JSONB), years_in_business, completed_jobs_count
export async function updateProviderProfile(
  supabase: SupabaseClient,
  userId: string,
  data: Partial<ProviderProfileInput>
): Promise<ServiceProviderDetails>
```

### Existing Quote Type (reuse/extend for quote builder)
```typescript
// Source: src/types/marketplace.ts
export type Quote = Readonly<{
  id: string;
  service_request_id: string;
  provider_id: string;
  quote_number: string;           // e.g. "QT-2024-089"
  total_amount: number;
  vat_included: boolean;
  line_items: QuoteLineItem[];    // { description, quantity, unit_price, total }
  scope_of_work: string;
  estimated_duration: string | null;
  payment_terms: string | null;
  warranty_info: string | null;
  validity_date: Date | null;
  status: QuoteStatus;
}>
```

### Existing Booking Status Types (reuse for job management)
```typescript
// Source: src/types/marketplace.ts
export type BookingStatus =
  | "pending_confirmation"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";
```

### Recharts Area Chart Pattern (analytics page)
```typescript
// "use client"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
// Use brand-primary (#1B4D3E) for fill color
// Use brand-primary-light (#2D7A5F) for stroke
const data = [{ month: "May", revenue: 5500, areaAvg: 4000 }, ...];
<ResponsiveContainer width="100%" height={256}>
  <AreaChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis tickFormatter={(v) => `£${v/1000}k`} />
    <Tooltip formatter={(v) => `£${Number(v).toLocaleString()}`} />
    <Area type="monotone" dataKey="revenue" fill="#1B4D3E" fillOpacity={0.15} stroke="#1B4D3E" />
    <Area type="monotone" dataKey="areaAvg" fill="#E8F5EE" fillOpacity={0.5} stroke="#9E9EAB" />
  </AreaChart>
</ResponsiveContainer>
```

### @react-pdf/renderer Invoice (server-side generation)
```typescript
// In a Route Handler: src/app/api/provider/invoices/[id]/pdf/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient(); // server-only
  // Fetch invoice data...
  const buffer = await renderToBuffer(<InvoiceDocument invoice={data} />);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${params.id}.pdf"`,
    },
  });
}
```

---

## New Database Tables Required

Wave 0 migration (`016_provider_dashboard.sql`) must create these 9 tables:

### 1. provider_services
```sql
CREATE TABLE public.provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category service_category NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('hourly', 'fixed', 'quote_on_request')),
  price_amount NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS: provider can CRUD own rows; public can SELECT active rows
```

### 2. provider_references
```sql
CREATE TABLE public.provider_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('client', 'peer')),
  referee_name TEXT NOT NULL,
  referee_email TEXT NOT NULL,
  referee_role TEXT,           -- e.g. "Gas Engineer • Silver Tier" for peers
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'verified', 'expired')),
  token TEXT UNIQUE NOT NULL,  -- nanoid for secure reference form URL
  token_expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS: provider can INSERT/SELECT own rows; no update (admin only verifies)
```

### 3. provider_badges
```sql
CREATE TABLE public.provider_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL
    CHECK (badge_type IN ('bronze', 'silver', 'gold', 'platinum',
                          'gas_safe', 'niceic', 'napit', 'which_trusted',
                          'top_rated', 'fast_responder', 'veteran')),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  UNIQUE (provider_id, badge_type)
);
-- RLS: SELECT for all authenticated; INSERT/UPDATE admin only
```

### 4. provider_portfolio_items
```sql
CREATE TABLE public.provider_portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category service_category,
  before_image_url TEXT,
  after_image_url TEXT,
  additional_images TEXT[],
  tags TEXT[],
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS: provider CRUD own; public SELECT
```

### 5. provider_invoices
```sql
CREATE TABLE public.provider_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id),
  quote_id UUID REFERENCES public.quotes(id),
  invoice_number TEXT NOT NULL UNIQUE,  -- e.g. "INV-2024-001"
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_address TEXT,
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(4,2) NOT NULL DEFAULT 20.00,
  vat_amount NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_terms TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS: provider CRUD own; client (by booking) can SELECT
```

### 6. stripe_connect_accounts
```sql
CREATE TABLE public.stripe_connect_accounts (
  provider_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  details_submitted BOOLEAN NOT NULL DEFAULT false,
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  default_currency TEXT NOT NULL DEFAULT 'gbp',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS: provider can SELECT own; no direct INSERT/UPDATE (server-only via service role)
```

### 7. provider_boosts
```sql
CREATE TABLE public.provider_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('featured_listing', 'area_boost', 'category_top')),
  duration_days INTEGER NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS: provider SELECT own; system INSERT via service role
```

### 8. provider_referrals
```sql
CREATE TABLE public.provider_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id),
  referred_id UUID REFERENCES public.profiles(id),
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'signed_up', 'verified', 'rewarded')),
  reward_amount NUMERIC(10,2) DEFAULT 50.00,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS: provider SELECT own referrals where referrer_id = auth.uid()
```

### 9. provider_service_areas
```sql
CREATE TABLE public.provider_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  area_type TEXT NOT NULL CHECK (area_type IN ('radius', 'polygon')),
  radius_km NUMERIC(6,2),           -- for radius type
  geometry GEOMETRY(GEOMETRY, 4326), -- PostGIS for polygon type
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS: provider CRUD own; requires PostGIS (already in 002_marketplace.sql via CREATE EXTENSION IF NOT EXISTS postgis)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jsPDF canvas API for invoices | @react-pdf/renderer React components | ~2022 | React-native PDF templates; proper text layout |
| Custom map drawing libraries | terra-draw v1.25 | 2024 | Unified draw API across map providers |
| DnD HTML5 API | @dnd-kit with keyboard/touch | 2021 | Accessible, works with Strict Mode React |
| Stripe Standard Connect | Stripe Express Connect | 2019 | Reduced onboarding friction; platform handles disputes |
| Polling for real-time updates | Supabase Realtime channels | 2022 | WebSocket push, no 30s lag |

**Deprecated/outdated:**
- `jspdf` for complex branded documents: Still installed but use `@react-pdf/renderer` for all invoice/quote PDF generation in this phase. `jspdf` was used for the simple AST lease in Phase 6 (landlord) where formatting is simpler.
- `react-big-calendar` / `fullcalendar`: Not installed and not needed — the Stitch design uses a lightweight custom grid.

---

## Open Questions

1. **Stripe environment setup**
   - What we know: `STRIPE_SECRET_KEY` is in `.env.example`; the `stripe` npm package is not yet installed
   - What's unclear: Whether Stripe Connect test accounts are configured in the dev environment
   - Recommendation: Wave 0 installs `stripe` + `@stripe/stripe-js`; Wave 4 (payments) documents that developers need to create a Stripe Connect platform account and set `STRIPE_CONNECT_CLIENT_ID` in `.env.local`

2. **Verification badge earning logic**
   - What we know: The Stitch design shows Bronze/Silver/Gold/Platinum tiers with clear progression
   - What's unclear: The exact criteria for each badge tier (e.g., is Gold = identity + insurance + qualifications + 2 references?)
   - Recommendation: Define badge criteria in a constants file; earn badges via a Supabase trigger or server-side function called when verification documents are approved

3. **Provider-specific route vs existing `[role]/service_provider` route**
   - What we know: The existing `[role]/page.tsx` renders `<ProviderDashboard>` for `service_provider` role; there is currently no dedicated `provider/` subdirectory
   - What's unclear: Whether the existing `/dashboard/service_provider` URL should redirect to `/dashboard/provider` or remain
   - Recommendation: Keep `/dashboard/[role]/page.tsx` for the simple landing page (it already works). Phase 16 adds `/dashboard/provider/` as a deeper route group for the 25 full pages. Navigation links in `ProviderSidebar` point to `/dashboard/provider/*`.

4. **Analytics data source**
   - What we know: Profile views can be logged in a new `provider_analytics` table; enquiry/booking data already exists
   - What's unclear: Whether profile view tracking was implemented in earlier phases
   - Recommendation: Add a `provider_profile_views` table in Wave 0 migration; log a view server-side whenever a public provider profile page is loaded; aggregate for analytics

---

## Validation Architecture

> nyquist_validation is true in .planning/config.json — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0 + happy-dom |
| Config file | `vitest.config.mts` (project root) |
| Quick run command | `pnpm test --reporter=dot --run` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TPD-01 | Provider KPI aggregation returns correct counts | unit | `pnpm test -- provider-dashboard-service.test -x` | Wave 0 |
| TPD-02 | updateProviderProfile saves bio, photo URL, qualifications | unit | `pnpm test -- provider-service.test -x` | Extends existing |
| TPD-03 | Verification progress computed correctly from documents | unit | `pnpm test -- provider-verification-service.test -x` | Wave 0 |
| TPD-04 | Document upload stores in correct Supabase Storage path | unit | `pnpm test -- provider-verification-service.test -x` | Wave 0 |
| TPD-05 | Reference request creates token with correct expiry | unit | `pnpm test -- provider-verification-service.test -x` | Wave 0 |
| TPD-06 | Peer reference invite sends email via Resend | unit (mock) | `pnpm test -- provider-verification-service.test -x` | Wave 0 |
| TPD-07 | Badge earned when verification criteria met | unit | `pnpm test -- provider-verification-service.test -x` | Wave 0 |
| TPD-08 | Provider service CRUD validates pricing type | unit | `pnpm test -- provider-service.test -x` | Wave 0 |
| TPD-09 | Service area GeoJSON saved and retrieved correctly | unit | `pnpm test -- provider-service.test -x` | Wave 0 |
| TPD-10 | Availability blocking prevents booking conflict | unit | Extends `booking-service.test.ts` | Extends existing |
| TPD-11 | Job leads filtered by provider's service categories | unit | `pnpm test -- provider-dashboard-service.test -x` | Wave 0 |
| TPD-12 | Active jobs query returns only in_progress bookings | unit | Extends `booking-service.test.ts` | Extends existing |
| TPD-13 | Completed jobs paginate correctly | unit | Extends `booking-service.test.ts` | Extends existing |
| TPD-14 | Job detail joins booking + quote + messages + review | unit | `pnpm test -- provider-dashboard-service.test -x` | Wave 0 |
| TPD-15 | Quote total calculated correctly with VAT | unit | Extends `quote-service.test.ts` | Extends existing |
| TPD-16 | Invoice number auto-increments correctly | unit | `pnpm test -- provider-invoice-service.test -x` | Wave 0 |
| TPD-17 | Stripe balance fetch returns correct structure | unit (mock Stripe) | `pnpm test -- stripe-connect-service.test -x` | Wave 0 |
| TPD-18 | Transaction detail includes fees and net payout | unit (mock Stripe) | `pnpm test -- stripe-connect-service.test -x` | Wave 0 |
| TPD-19 | Portfolio items sort order saved correctly | unit | `pnpm test -- provider-service.test -x` | Wave 0 |
| TPD-20 | Review rating breakdown aggregates correctly | unit | Extends `review-service.test.ts` | Extends existing |
| TPD-21 | Review response saved and linked to review | unit | Extends `review-service.test.ts` | Extends existing |
| TPD-22 | Analytics funnel conversion rate calculated correctly | unit | `pnpm test -- provider-analytics-service.test -x` | Wave 0 |
| TPD-23 | Subscription tier limits enforced | unit | `pnpm test -- provider-subscription-service.test -x` | Wave 0 |
| TPD-24 | Boost expiry checked before displaying active | unit | `pnpm test -- provider-subscription-service.test -x` | Wave 0 |
| TPD-25 | Referral code generation is unique | unit | `pnpm test -- provider-verification-service.test -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test --reporter=dot --run src/services/provider`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green + `pnpm build` passes before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/services/provider/provider-dashboard-service.test.ts` — covers TPD-01, TPD-11, TPD-14
- [ ] `src/services/provider/provider-verification-service.test.ts` — covers TPD-03-07, TPD-25
- [ ] `src/services/provider/provider-invoice-service.test.ts` — covers TPD-16
- [ ] `src/services/provider/stripe-connect-service.test.ts` — covers TPD-17, TPD-18 (mock Stripe SDK)
- [ ] `src/services/provider/provider-analytics-service.test.ts` — covers TPD-22
- [ ] `src/services/provider/provider-subscription-service.test.ts` — covers TPD-23, TPD-24
- [ ] `supabase/migrations/016_provider_dashboard.sql` — creates 9 new tables

---

## Sources

### Primary (HIGH confidence)
- `/Users/joanflerinbig/Documents/britv3.0/package.json` — exact installed versions confirmed
- `/Users/joanflerinbig/Documents/britv3.0/src/services/marketplace/provider-service.ts` — existing provider CRUD functions
- `/Users/joanflerinbig/Documents/britv3.0/src/types/marketplace.ts` — existing Quote, Booking, Review, ServiceProviderDetails types
- `/Users/joanflerinbig/Documents/britv3.0/src/types/dashboard.ts` — existing ProviderDashboard type stub
- `/Users/joanflerinbig/Documents/britv3.0/supabase/migrations/002_marketplace.sql` — existing DB schema (service_requests, quotes, bookings, reviews, provider_documents, provider_availability)
- `/Users/joanflerinbig/Documents/britv3.0/src/app/(protected)/dashboard/[role]/layout.tsx` — auth guard pattern
- `/Users/joanflerinbig/Documents/britv3.0/britestatestyle.txt` — authoritative design tokens

### Secondary (MEDIUM confidence)
- Stitch reference HTML files — pixel-accurate UI designs for 5 of 25 pages (dashboard, verification, leads, quote builder, analytics/payouts)
- `/Users/joanflerinbig/Documents/britv3.0/.planning/phases/16-tradesperson-dashboard/16-CONTEXT.md` — locked design and architecture decisions
- `/Users/joanflerinbig/Documents/britv3.0/.planning/ROADMAP.md` — Phase 3+4 plans confirm what was built

### Tertiary (LOW confidence, verify at build time)
- Stripe Connect Express API surface — recommend verifying current API at https://stripe.com/docs/connect/express-accounts before implementation
- terra-draw v1.25 circle mode API — verify mode name and constructor signature from npm package source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed from package.json; new tables designed from existing schema patterns
- Architecture: HIGH — patterns observed directly in landlord/marketplace codebase; route structure follows established conventions
- New DB tables: MEDIUM — schema designed from first principles; verify against full PRD `project memory 2026.txt` for any additional fields
- Stripe Connect: MEDIUM — standard Express pattern; exact API surface should be verified against current Stripe docs
- Pitfalls: HIGH — directly observed from reading existing code and known Next.js/library constraints

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable stack; Stripe API may have minor updates)
