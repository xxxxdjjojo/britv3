# Phase 16: Tradesperson Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a complete 25-page Tradesperson/Service Provider Dashboard with DB foundation, service layer, and FAANG-quality UI covering verification, job management, financial tools, portfolio, reviews, analytics, and growth tools.

**Architecture:** Next.js App Router Server Components by default, "use client" only for interactive features (forms, maps, charts, drag-drop). Services are pure function exports accepting a Supabase client for DI. All data flows through Supabase with RLS enforcement. Stripe Connect Express for payments, MapLibre + terra-draw for service areas, Recharts for analytics, @react-pdf/renderer for invoices, dnd-kit for portfolio reorder.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Supabase (Auth + PostgreSQL + Storage + Realtime), Tailwind v4, Shadcn UI, react-hook-form + zod, Stripe Connect, MapLibre GL, terra-draw, Recharts, @react-pdf/renderer, dnd-kit, nanoid, Inngest

**Design System:** Britestate brand-primary `#1B4D3E`, lighter `#E8F5EE`, dark sidebar `#152C22`. Plus Jakarta Sans headings, Inter body. NEVER use Stitch placeholder greens (`#11d432`, `#17cf97`).

**Dependency Graph:**
```
Task 1 (DB + Types) ──────┐
                           │
Task 2 (Services: Dashboard, Verification, Profile) ──┐
Task 3 (Services: Jobs, Quotes, Invoices) ────────────┤
Task 4 (Services: Payments, Portfolio, Analytics, ...) ┤
                                                       │
Task 5 (Layout + Sidebar + Dashboard Home + Profile) ──┐
Task 6 (Verification Centre, 5 pages) ────────────────┤
Task 7 (Services & Availability, 3 pages) ────────────┤
Task 8 (Job Management, 4 pages) ─────────────────────┤
Task 9 (Financial Tools, 2 pages) ────────────────────┤
Task 10 (Payments & Billing, 3 pages) ────────────────┤
Task 11 (Portfolio & Reviews, 3 pages) ───────────────┤
Task 12 (Analytics & Growth, 3 pages) ────────────────┘
```

**Parallelization:** Tasks 2, 3, 4 can run in parallel (all depend only on Task 1). Tasks 6, 7 can run in parallel (both depend on Task 5). Tasks 8, 9, 10 can run in parallel (Wave 4). Tasks 11, 12 can run in parallel (Wave 5).

---

### Task 1: DB Foundation — Migration + TypeScript Types + Test Stubs

**Files:**
- Create: `supabase/migrations/20260313_provider_dashboard_tables.sql`
- Create: `src/types/provider-dashboard.ts`
- Create: `src/services/provider/__tests__/provider-dashboard-service.test.ts`
- Create: `src/services/provider/__tests__/provider-verification-service.test.ts`
- Create: `src/services/provider/__tests__/provider-job-service.test.ts`
- Create: `src/services/provider/__tests__/provider-payment-service.test.ts`

**Step 1: Create 4 test stub files**

Create test stubs documenting the service contracts. Each file imports `vi` from vitest, mocks `@/lib/supabase/server`, and has `describe/it` blocks defining expected function signatures and return shapes. Tests MUST fail (RED) — this is correct since services don't exist yet.

`src/services/provider/__tests__/provider-dashboard-service.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("provider-dashboard-service", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
  };

  beforeEach(() => vi.clearAllMocks());

  describe("getProviderDashboardStats", () => {
    it("returns ProviderDashboardStats shape", async () => {
      const { getProviderDashboardStats } = await import("@/services/provider/provider-dashboard-service");
      const result = await getProviderDashboardStats(mockSupabase as any, "provider-1");
      expect(result).toEqual(expect.objectContaining({
        new_leads_count: expect.any(Number),
        active_jobs_count: expect.any(Number),
        pending_reviews_count: expect.any(Number),
        monthly_earnings_pence: expect.any(Number),
        verification_complete_pct: expect.any(Number),
      }));
    });
  });

  describe("getRecentActivity", () => {
    it("returns RecentActivityItem[] shape", async () => {
      const { getRecentActivity } = await import("@/services/provider/provider-dashboard-service");
      const result = await getRecentActivity(mockSupabase as any, "provider-1", 10);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getUpcomingJobs", () => {
    it("returns UpcomingJob[] shape", async () => {
      const { getUpcomingJobs } = await import("@/services/provider/provider-dashboard-service");
      const result = await getUpcomingJobs(mockSupabase as any, "provider-1", 5);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
```

Create similar stubs for the other 3 test files with appropriate function signatures:
- `provider-verification-service.test.ts`: stubs for `getVerificationSteps`, `sendReferenceRequest`, `getProviderBadges`
- `provider-job-service.test.ts`: stubs for `getProviderLeads`, `acceptLead`, `declineLead`, `getJobDetail`
- `provider-payment-service.test.ts`: stubs for `getStripeBalance`, `getPayoutHistory`, `getTransactionDetail`

**Step 2: Run tests to verify they fail**

Run: `cd britv3.0 && pnpm test --run src/services/provider/__tests__/ 2>&1 | tail -20`
Expected: FAIL — service modules don't exist yet

**Step 3: Create SQL migration**

Create `supabase/migrations/20260313_provider_dashboard_tables.sql` with 9 tables:

```sql
-- Phase 16: Tradesperson Dashboard Foundation
-- 9 new tables for provider dashboard features

-- 1. provider_services — tradesperson's offered services with pricing
CREATE TABLE provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category ServiceCategory NOT NULL,
  description TEXT,
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('hourly', 'fixed', 'quote_on_request')),
  price_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX provider_services_provider_id ON provider_services(provider_id);

-- 2. provider_references — client + peer reference tracking
CREATE TYPE provider_reference_type AS ENUM ('client', 'peer');
CREATE TYPE provider_reference_status AS ENUM ('pending', 'submitted', 'verified');
CREATE TABLE provider_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(id) ON DELETE CASCADE,
  reference_type provider_reference_type NOT NULL,
  referee_name TEXT NOT NULL,
  referee_email TEXT NOT NULL,
  referee_phone TEXT,
  relationship TEXT,
  status provider_reference_status NOT NULL DEFAULT 'pending',
  reference_text TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ
);
CREATE INDEX provider_references_provider_id ON provider_references(provider_id);

-- 3. provider_badges — earned verification badges
CREATE TABLE provider_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_label TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX provider_badges_provider_id ON provider_badges(provider_id);

-- 4. provider_portfolio_items — before/after photos
CREATE TABLE provider_portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category ServiceCategory,
  before_image_path TEXT,
  after_image_path TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX provider_portfolio_items_provider_id ON provider_portfolio_items(provider_id, display_order);

-- 5. provider_invoices — generated invoices linked to bookings
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TABLE provider_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  client_id UUID NOT NULL REFERENCES auth.users(id),
  invoice_number TEXT NOT NULL UNIQUE,
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL,
  vat_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX provider_invoices_provider_id ON provider_invoices(provider_id);
CREATE INDEX provider_invoices_booking_id ON provider_invoices(booking_id);
CREATE INDEX provider_invoices_client_id ON provider_invoices(client_id);

-- 6. stripe_connect_accounts — Stripe Connect Express
CREATE TABLE stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL UNIQUE REFERENCES service_provider_details(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX stripe_connect_accounts_provider_id ON stripe_connect_accounts(provider_id);

-- 7. provider_boosts — active featured placements
CREATE TABLE provider_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('featured_profile', 'area_spotlight', 'category_top')),
  coverage_area TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_paid NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX provider_boosts_provider_id ON provider_boosts(provider_id);
CREATE INDEX provider_boosts_ends_at ON provider_boosts(ends_at);

-- 8. provider_referrals — referral programme tracking
CREATE TABLE provider_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES service_provider_details(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'verified', 'rewarded')),
  reward_amount NUMERIC(10,2) DEFAULT 50.00,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX provider_referrals_referrer_id ON provider_referrals(referrer_id);
CREATE INDEX provider_referrals_referral_code ON provider_referrals(referral_code);

-- 9. provider_service_areas — coverage zone geometries
CREATE TABLE provider_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(id) ON DELETE CASCADE,
  area_type TEXT NOT NULL CHECK (area_type IN ('circle', 'polygon')),
  label TEXT,
  geometry JSONB NOT NULL,
  radius_km NUMERIC(8,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX provider_service_areas_provider_id ON provider_service_areas(provider_id);

-- RLS policies for all 9 tables
-- Pattern: provider can CRUD their own rows via provider_id → service_provider_details.user_id = auth.uid()

ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_services_owner" ON provider_services
  USING (provider_id IN (SELECT id FROM service_provider_details WHERE user_id = auth.uid()));

ALTER TABLE provider_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_references_owner" ON provider_references
  USING (provider_id IN (SELECT id FROM service_provider_details WHERE user_id = auth.uid()));

ALTER TABLE provider_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_badges_owner" ON provider_badges
  USING (provider_id IN (SELECT id FROM service_provider_details WHERE user_id = auth.uid()));

ALTER TABLE provider_portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_portfolio_items_owner" ON provider_portfolio_items
  USING (provider_id IN (SELECT id FROM service_provider_details WHERE user_id = auth.uid()));

ALTER TABLE provider_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_invoices_owner" ON provider_invoices
  USING (provider_id IN (SELECT id FROM service_provider_details WHERE user_id = auth.uid()));
CREATE POLICY "provider_invoices_client_read" ON provider_invoices
  FOR SELECT USING (client_id = auth.uid());

ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stripe_connect_accounts_owner" ON stripe_connect_accounts
  USING (provider_id IN (SELECT id FROM service_provider_details WHERE user_id = auth.uid()));

ALTER TABLE provider_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_boosts_owner" ON provider_boosts
  USING (provider_id IN (SELECT id FROM service_provider_details WHERE user_id = auth.uid()));

ALTER TABLE provider_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_referrals_owner" ON provider_referrals
  USING (referrer_id IN (SELECT id FROM service_provider_details WHERE user_id = auth.uid()));

ALTER TABLE provider_service_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_service_areas_owner" ON provider_service_areas
  USING (provider_id IN (SELECT id FROM service_provider_details WHERE user_id = auth.uid()));
```

**Step 4: Create TypeScript types file**

Create `src/types/provider-dashboard.ts` mirroring all 9 tables:

```typescript
export type ProviderReferenceType = "client" | "peer";
export type ProviderReferenceStatus = "pending" | "submitted" | "verified";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type BoostType = "featured_profile" | "area_spotlight" | "category_top";
export type ReferralStatus = "pending" | "signed_up" | "verified" | "rewarded";
export type ServiceAreaType = "circle" | "polygon";
export type PricingType = "hourly" | "fixed" | "quote_on_request";

export type ProviderService = Readonly<{
  id: string;
  provider_id: string;
  name: string;
  category: string;
  description: string | null;
  pricing_type: PricingType;
  price_amount: number | null;
  created_at: string;
  updated_at: string;
}>;

export type ProviderReference = Readonly<{
  id: string;
  provider_id: string;
  reference_type: ProviderReferenceType;
  referee_name: string;
  referee_email: string;
  referee_phone: string | null;
  relationship: string | null;
  status: ProviderReferenceStatus;
  reference_text: string | null;
  requested_at: string;
  submitted_at: string | null;
  verified_at: string | null;
}>;

export type ProviderBadge = Readonly<{
  id: string;
  provider_id: string;
  badge_type: string;
  badge_label: string;
  description: string | null;
  earned_at: string;
  expires_at: string | null;
  is_active: boolean;
}>;

export type ProviderPortfolioItem = Readonly<{
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  category: string | null;
  before_image_path: string | null;
  after_image_path: string | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}>;

export type InvoiceLineItem = Readonly<{
  name: string;
  description?: string;
  quantity: number;
  unit_price_pence: number;
  total_pence: number;
  vat_rate?: number;
}>;

export type ProviderInvoice = Readonly<{
  id: string;
  provider_id: string;
  booking_id: string | null;
  client_id: string;
  invoice_number: string;
  line_items: InvoiceLineItem[];
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}>;

export type StripeConnectAccount = Readonly<{
  id: string;
  provider_id: string;
  stripe_account_id: string;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  created_at: string;
  updated_at: string;
}>;

export type ProviderBoost = Readonly<{
  id: string;
  provider_id: string;
  boost_type: BoostType;
  coverage_area: string | null;
  starts_at: string;
  ends_at: string;
  stripe_payment_intent_id: string | null;
  amount_paid: number | null;
  is_active: boolean;
  created_at: string;
}>;

export type ProviderReferral = Readonly<{
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referral_code: string;
  status: ReferralStatus;
  reward_amount: number;
  rewarded_at: string | null;
  created_at: string;
}>;

export type ProviderServiceArea = Readonly<{
  id: string;
  provider_id: string;
  area_type: ServiceAreaType;
  label: string | null;
  geometry: Record<string, unknown>;
  radius_km: number | null;
  created_at: string;
}>;

// Dashboard aggregates
export type ProviderDashboardStats = Readonly<{
  new_leads_count: number;
  active_jobs_count: number;
  pending_reviews_count: number;
  monthly_earnings_pence: number;
  verification_complete_pct: number;
}>;

export type RecentActivityItem = Readonly<{
  id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
  link?: string;
}>;

export type UpcomingJob = Readonly<{
  id: string;
  title: string;
  client_name: string;
  scheduled_date: string;
  status: string;
  total_amount_pence: number;
}>;

export type ConversionFunnel = Readonly<{
  viewed: number;
  enquired: number;
  quoted: number;
  booked: number;
}>;
```

**Step 5: Verify TypeScript compiles**

Run: `cd britv3.0 && pnpm tsc --noEmit 2>&1 | grep "provider-dashboard" | wc -l`
Expected: 0 errors for the types file

**Step 6: Commit**

```bash
git add supabase/migrations/20260313_provider_dashboard_tables.sql src/types/provider-dashboard.ts src/services/provider/__tests__/
git commit -m "feat(16-01): add provider dashboard DB migration, types, and test stubs

9 new tables with RLS policies, TypeScript types mirroring all columns,
and 4 test stub files documenting service contracts for Wave 2."
```

---

### Task 2: Services Part 1 — Dashboard, Verification, Profile

**Depends on:** Task 1
**Files:**
- Create: `src/services/provider/provider-dashboard-service.ts`
- Create: `src/services/provider/provider-verification-service.ts`
- Create: `src/services/provider/provider-profile-service.ts`
- Modify: `src/services/provider/__tests__/provider-dashboard-service.test.ts`
- Modify: `src/services/provider/__tests__/provider-verification-service.test.ts`

**Step 1: Create provider-dashboard-service.ts**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProviderDashboardStats, RecentActivityItem, UpcomingJob } from "@/types/provider-dashboard";

export async function getProviderDashboardStats(
  supabase: SupabaseClient,
  providerId: string,
): Promise<ProviderDashboardStats> {
  // Parallel queries: new leads, active jobs, pending reviews, monthly earnings, verification %
  // Use Promise.all with supabase .from() queries
  // Earnings in pence (integer) to avoid floating point
  // Return zero values on empty results, not errors
}

export async function getRecentActivity(
  supabase: SupabaseClient,
  providerId: string,
  limit = 10,
): Promise<RecentActivityItem[]> {
  // Query bookings, service_requests, reviews in parallel
  // Merge by created_at DESC, return most recent `limit`
}

export async function getUpcomingJobs(
  supabase: SupabaseClient,
  providerId: string,
  limit = 5,
): Promise<UpcomingJob[]> {
  // bookings WHERE provider_id AND status IN ('confirmed','in_progress') AND scheduled_date >= now()
  // JOIN service_requests for title, JOIN profiles for client name
  // ORDER BY scheduled_date ASC
}
```

Implement all three functions with real Supabase queries. First param always `SupabaseClient`.

**Step 2: Create provider-verification-service.ts**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProviderReference, ProviderBadge } from "@/types/provider-dashboard";

const VERIFICATION_STEPS = [
  { id: "identity", label: "Identity Verification", description: "Upload a valid photo ID" },
  { id: "insurance", label: "Insurance", description: "Upload public liability insurance" },
  { id: "qualifications", label: "Qualifications", description: "Upload trade certificates" },
  { id: "client_references", label: "Client References", description: "Get 3 client references" },
  { id: "peer_references", label: "Peer References", description: "Get 3 peer references" },
] as const;

export async function getVerificationSteps(supabase: SupabaseClient, providerId: string) {
  // Check provider_documents for identity/insurance/qualifications steps
  // Check provider_references for client_refs/peer_refs steps
  // Return steps with status: 'complete'|'in_progress'|'pending'
}

export async function getProviderReferences(supabase: SupabaseClient, providerId: string, type: "client" | "peer"): Promise<ProviderReference[]> {
  // Filter provider_references by reference_type
}

export async function sendReferenceRequest(supabase: SupabaseClient, providerId: string, input: { referee_name: string; referee_email: string; reference_type: "client" | "peer" }) {
  // Validate email with zod, insert provider_references row, trigger Inngest event
}

export async function getProviderBadges(supabase: SupabaseClient, providerId: string): Promise<ProviderBadge[]> {
  // WHERE is_active=true ORDER BY earned_at DESC
}

export async function uploadVerificationDocument(supabase: SupabaseClient, providerId: string, documentType: string, file: File) {
  // Validate file type (PDF, JPEG, PNG) and size (max 10MB)
  // Upload to Supabase Storage 'provider-documents' bucket
  // Upsert provider_documents row
}
```

**Step 3: Create provider-profile-service.ts**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getProviderProfile(supabase: SupabaseClient, userId: string) {
  // Fetch service_provider_details WHERE user_id
}

export async function updateProviderProfile(supabase: SupabaseClient, providerId: string, updates: Record<string, unknown>) {
  // Validate with zod (business_name 2-100 chars, description max 2000)
  // Update service_provider_details row
}

export async function uploadAvatar(supabase: SupabaseClient, userId: string, file: File): Promise<string> {
  // Upload to 'avatars' bucket at providers/{userId}/avatar
  // Return public URL via getPublicUrl
}
```

**Step 4: Update test stubs to pass (GREEN)**

Update the mock Supabase client in test stubs to return appropriate mock data so tests pass.

**Step 5: Verify**

Run: `cd britv3.0 && pnpm tsc --noEmit && pnpm test --run src/services/provider/__tests__/provider-dashboard-service.test.ts`
Expected: 0 TypeScript errors, tests pass

**Step 6: Commit**

```bash
git add src/services/provider/provider-dashboard-service.ts src/services/provider/provider-verification-service.ts src/services/provider/provider-profile-service.ts src/services/provider/__tests__/
git commit -m "feat(16-02): add provider dashboard, verification, and profile services

KPI stats, activity feed, upcoming jobs, 5-step verification,
reference tracking, badge queries, profile CRUD with avatar upload."
```

---

### Task 3: Services Part 2 — Jobs, Quotes, Invoices

**Depends on:** Task 1
**Files:**
- Create: `src/services/provider/provider-job-service.ts`
- Create: `src/services/provider/provider-quote-service.ts`
- Create: `src/services/provider/provider-invoice-service.ts`
- Modify: `src/services/provider/__tests__/provider-job-service.test.ts`

**Step 1: Create provider-job-service.ts**

Exports: `getProviderLeads`, `getActiveJobs`, `getCompletedJobs`, `getJobDetail`, `acceptLead`, `declineLead`

Key patterns:
- `getProviderLeads`: Fetch provider's categories from `service_provider_details.services`, query `service_requests WHERE category = ANY(categories) AND status = 'open'`
- `getActiveJobs`: Include computed `days_running = Math.floor((Date.now() - scheduled_date) / 86400000)`
- `getCompletedJobs`: Cursor-based pagination using `last_id` param (not offset)
- `getJobDetail`: `Promise.all` for quote + review + invoice lookups. Return null for missing relations.
- `acceptLead`/`declineLead`: Validate provider ownership before mutation.

**Step 2: Create provider-quote-service.ts**

Exports: `createQuote`, `updateQuote`, `sendQuote`, `getQuotesByProvider`

Key patterns:
- Sequential numbering: `QT-{YYYY}-{NNNN}` using `SELECT COALESCE(MAX(...), 0) + 1` pattern
- `createQuote`: Validate line_items (qty >= 1, unit_price >= 0), compute subtotal, insert with status='draft'
- `sendQuote`: Only if status='draft', transition to 'sent', emit Inngest event `quote/sent`
- `updateQuote`: Only when status='draft'

**Step 3: Create provider-invoice-service.ts**

Exports: `generateInvoice`, `updateInvoice`, `markInvoicePaid`, `getInvoicesByProvider`

Key patterns:
- Sequential numbering: `INV-{YYYY}-{NNNN}`
- VAT: Default 20%. `vat_amount = sum(line.total_pence * (line.vat_rate ?? 0.20))`
- `markInvoicePaid`: SET status='paid', paid_at = now()

**Step 4: Update test stubs to GREEN**

**Step 5: Verify**

Run: `cd britv3.0 && pnpm tsc --noEmit && pnpm lint`
Expected: 0 errors

**Step 6: Commit**

```bash
git add src/services/provider/provider-job-service.ts src/services/provider/provider-quote-service.ts src/services/provider/provider-invoice-service.ts src/services/provider/__tests__/
git commit -m "feat(16-03): add provider job, quote, and invoice services

Lead matching by category, cursor-based completed jobs pagination,
sequential QT/INV numbering, VAT calculation, accept/decline leads."
```

---

### Task 4: Services Part 3 — Payments, Portfolio, Analytics, Boost, Referral + Stripe API Routes

**Depends on:** Task 1
**Files:**
- Create: `src/services/provider/provider-payment-service.ts`
- Create: `src/services/provider/provider-portfolio-service.ts`
- Create: `src/services/provider/provider-analytics-service.ts`
- Create: `src/services/provider/provider-boost-service.ts`
- Create: `src/services/provider/provider-referral-service.ts`
- Create: `src/app/api/stripe/connect/create-account/route.ts`
- Create: `src/app/api/stripe/connect/onboarding-link/route.ts`
- Create: `src/app/api/stripe/webhooks/connect/route.ts`
- Modify: `src/services/provider/__tests__/provider-payment-service.test.ts`

**Step 1: Create provider-payment-service.ts + 3 Stripe API routes**

Service exports: `getStripeConnectAccount`, `initiateStripeConnect`, `getOnboardingLink`, `getStripeBalance`, `getPayoutHistory`, `getTransactionDetail`

CRITICAL: Stripe SDK is server-only. Import as: `import Stripe from "stripe"; const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);`

API routes:
- `POST /api/stripe/connect/create-account`: Auth → `initiateStripeConnect` → `getOnboardingLink` → return `{ onboarding_url }`
- `POST /api/stripe/connect/onboarding-link`: Auth → fetch existing account → `getOnboardingLink` → return `{ url }`
- `POST /api/stripe/webhooks/connect`: Verify signature with `stripe.webhooks.constructEvent()`, handle `account.updated` → update `stripe_connect_accounts`, return 200

**Step 2: Create 4 remaining service files**

- `provider-portfolio-service.ts`: `getPortfolioItems`, `addPortfolioItem`, `updatePortfolioItem`, `deletePortfolioItem` (also remove storage files), `reorderPortfolioItems` (batch update display_order)
- `provider-analytics-service.ts`: `getProviderAnalytics(period: '7d'|'30d'|'90d')` returning earnings_by_month, conversion funnel, top_categories. `getConversionFunnel` from actual DB counts.
- `provider-boost-service.ts`: `getActiveBoosts`, `createBoostCheckout` (Stripe Checkout session)
- `provider-referral-service.ts`: `getReferralCode` (nanoid(8) if none exists), `getReferralStats`, `getReferrals`

**Step 3: Update test stubs to GREEN**

**Step 4: Verify**

Run: `cd britv3.0 && pnpm tsc --noEmit && pnpm build && pnpm lint`
Expected: 0 errors

**Step 5: Commit**

```bash
git add src/services/provider/ src/app/api/stripe/
git commit -m "feat(16-04): add payment, portfolio, analytics, boost, referral services + Stripe Connect routes

Stripe Express onboarding, balance/payout retrieval, portfolio CRUD
with storage cleanup, analytics funnel, boost checkout, nanoid referral codes."
```

---

### Task 5: Layout + Sidebar + Dashboard Home + Profile Edit

**Depends on:** Task 2
**Files:**
- Create: `src/app/(protected)/dashboard/provider/layout.tsx`
- Create: `src/components/dashboard/provider/ProviderSidebar.tsx`
- Replace: `src/app/(protected)/dashboard/provider/page.tsx` (new Dashboard Home)
- Create: `src/components/dashboard/provider/KPICard.tsx`
- Create: `src/components/dashboard/provider/ActivityFeed.tsx`
- Create: `src/components/dashboard/provider/UpcomingJobsList.tsx`
- Replace: `src/app/(protected)/dashboard/provider/profile/page.tsx`
- Create: `src/components/dashboard/provider/ProfileEditForm.tsx`

**Stitch references:** Read `stitch/dashboard-overview.html` and `stitch/profile-settings.html` for exact layout.

**Step 1: Create layout.tsx (Server Component)**

- `createClient()` → `getUser()` → redirect to `/login` if no user
- Query `user_roles WHERE user_id AND role = 'service_provider'` → redirect to `/dashboard` if no match
- Fetch `service_provider_details` for sidebar info
- Render: `<div className="flex min-h-screen bg-neutral-50"><ProviderSidebar /><main className="flex-1 overflow-y-auto">{children}</main></div>`

**Step 2: Create ProviderSidebar.tsx ("use client")**

25 nav items in 7 groups using Britestate brand tokens:
- Group 1 Overview: Dashboard Home (/)
- Group 2 Profile & Trust: My Profile, Verification Centre
- Group 3 Services: Manage Services, Service Areas, Availability
- Group 4 Jobs: New Leads, Active Jobs, Completed Jobs
- Group 5 Financial: Quote Builder, Invoice Generator, Payments
- Group 6 Growth: Portfolio, Reviews, Analytics
- Group 7 Account: Subscription, Boost Profile, Referral Programme

Active state via `usePathname()`. User profile at bottom with avatar + business_name.

**Step 3: Create Dashboard Home page.tsx (Server Component)**

- Fetch in parallel: `getProviderDashboardStats`, `getRecentActivity(limit=8)`, `getUpcomingJobs(limit=5)`
- Verification banner if `verification_complete_pct < 100`: `bg-brand-primary text-white rounded-xl p-8`
- 4 KPICards: New Leads, Active Jobs, Pending Reviews, Monthly Earnings
- Two-column grid: ActivityFeed (left) + UpcomingJobsList (right)
- Quick action buttons: New Quote, Log Payment, Add Portfolio Item, Invite to Review

**Step 4: Create KPICard, ActivityFeed, UpcomingJobsList components**

- `KPICard.tsx` (Server Component): white card, rounded-xl, shadow-sm, icon in brand-primary-lighter bg
- `ActivityFeed.tsx` (Server Component): list with icon per type, relative timestamps
- `UpcomingJobsList.tsx` (Server Component): table with job title, client, date, status badge, amount

**Step 5: Create Profile page + ProfileEditForm**

- Profile page.tsx: Server Component shell fetching `getProviderProfile`, pass to `ProfileEditForm`
- `ProfileEditForm.tsx` ("use client"): react-hook-form + zod, avatar upload (react-dropzone circle), bio textarea (max 2000 chars), business name, phone, qualifications (multi-entry), service categories (multi-select), save button with sonner toast

**Step 6: Verify**

Run: `cd britv3.0 && pnpm build && pnpm lint`
Expected: 0 errors

**Step 7: Commit**

```bash
git add src/app/\(protected\)/dashboard/provider/ src/components/dashboard/provider/
git commit -m "feat(16-05): add provider layout, sidebar, dashboard home, and profile edit

Auth-guarded layout with 25-item sidebar, 4 KPI cards, verification
banner, activity feed, upcoming jobs, and full profile edit form."
```

---

### Task 6: Verification Centre (5 pages)

**Depends on:** Task 2, Task 5
**Files:**
- Create: `src/app/(protected)/dashboard/provider/verification/page.tsx`
- Create: `src/components/dashboard/provider/VerificationStepper.tsx`
- Create: `src/components/dashboard/provider/TrustScoreGauge.tsx`
- Create: `src/app/(protected)/dashboard/provider/verification/credentials/page.tsx`
- Create: `src/components/dashboard/provider/CredentialUploadCard.tsx`
- Create: `src/app/(protected)/dashboard/provider/verification/client-references/page.tsx`
- Create: `src/app/(protected)/dashboard/provider/verification/peer-references/page.tsx`
- Create: `src/components/dashboard/provider/ReferenceTracker.tsx`
- Create: `src/app/(protected)/dashboard/provider/verification/badges/page.tsx`
- Create: `src/components/dashboard/provider/BadgeGallery.tsx`

**Stitch reference:** Read `stitch/verification-trust-center.html`

**Step 1: Verification Overview + Credentials pages**

- Overview: Two-column layout — VerificationStepper (left) + TrustScoreGauge (right)
- `VerificationStepper.tsx` (Server Component): Vertical 5-step list with connecting lines, circular progress rings per status (complete = `bg-[#1B4D3E]` checkmark, in_progress = dashed border, pending = neutral-300)
- `TrustScoreGauge.tsx` ("use client"): SVG circular gauge, animated stroke-dasharray, score ranges: 0-40 "Building", 40-70 "Verified", 70-100 "Trusted"
- `CredentialUploadCard.tsx` ("use client"): react-dropzone per document type (PDF/JPEG/PNG, max 10MB), status badge, calls `uploadVerificationDocument` Server Action

**Step 2: References + Badges pages**

- Client References + Peer References: Both use `ReferenceTracker.tsx` ("use client"), 3 reference slots, send/remind/view actions, add dialog with react-hook-form
- Badge Status: `BadgeGallery.tsx` (Server Component), grid of badge cards with icon per badge_type, expiry warning if within 30 days, grayscale for expired

Badge type icon mapping: identity_verified → ShieldCheck, insurance_verified → Award, gas_safe → Flame, electrical_certified → Zap, cscs_holder → HardHat, top_rated → Star, references_complete → Users

**Step 3: Verify**

Run: `cd britv3.0 && pnpm build && pnpm lint`
Expected: 0 errors

**Step 4: Commit**

```bash
git add src/app/\(protected\)/dashboard/provider/verification/ src/components/dashboard/provider/
git commit -m "feat(16-06): add verification centre — 5 pages with stepper, trust gauge, credentials, references, badges

5-step progress stepper, SVG trust score gauge, credential upload with
file validation, 3-slot reference tracker, badge gallery with expiry warnings."
```

---

### Task 7: Services & Availability (3 pages)

**Depends on:** Task 2, Task 5
**Files:**
- Create: `src/app/(protected)/dashboard/provider/services/page.tsx`
- Create: `src/components/dashboard/provider/ServiceCard.tsx`
- Create: `src/app/(protected)/dashboard/provider/services/areas/page.tsx`
- Create: `src/components/dashboard/provider/ServiceAreaMapEditor.tsx`
- Replace: `src/app/(protected)/dashboard/provider/availability/page.tsx`
- Create: `src/components/dashboard/provider/AvailabilityCalendar.tsx`
- Create: `src/app/api/provider/service-areas/route.ts`
- Create: `src/app/api/provider/availability/route.ts`

**Stitch reference:** Read `stitch/availability-service-area.html`

**Step 1: Services page + Service Areas map**

- Services page: Server Component shell → ServicesClient ("use client"), add/edit/delete services via dialogs, ServiceCard per service
- `ServiceCard.tsx` ("use client"): name heading, category pill, pricing display (£45/hr, £200 fixed, Quote on Request), edit/delete buttons
- Service Areas: **dynamic import with ssr: false** for ServiceAreaMapEditor (MapLibre requires browser)
- `ServiceAreaMapEditor.tsx` ("use client"): MapLibre + terra-draw with polygon/circle/select modes, toolbar, save to API
- API route: POST validates GeoJSON, inserts provider_service_areas

**Step 2: Availability Calendar**

- `AvailabilityCalendar.tsx` ("use client"): Month/week toggle, CSS grid (7 cols), date cell states (available=white, blocked=neutral-100 diagonal stripes, booked=bg-[#E8F5EE] border-[#1B4D3E], today=ring-2 ring-[#1B4D3E])
- Click available → toggle blocked (POST /api/provider/availability), click blocked → toggle available
- Booked dates NOT toggleable
- API route: POST/GET for provider_availability upsert/fetch

**Step 3: Verify**

Run: `cd britv3.0 && pnpm build && pnpm lint`
Expected: 0 errors (ensure no SSR errors from MapLibre)

**Step 4: Commit**

```bash
git add src/app/\(protected\)/dashboard/provider/services/ src/app/\(protected\)/dashboard/provider/availability/ src/components/dashboard/provider/ src/app/api/provider/
git commit -m "feat(16-07): add services management, service areas map editor, and availability calendar

CRUD services with pricing, MapLibre + terra-draw polygon/circle zones,
monthly calendar with booked/blocked/available states."
```

---

### Task 8: Job Management (4 pages)

**Depends on:** Task 3, Task 5
**Files:**
- Create: `src/app/(protected)/dashboard/provider/jobs/leads/page.tsx`
- Create: `src/components/dashboard/provider/JobLeadCard.tsx`
- Create: `src/app/(protected)/dashboard/provider/jobs/active/page.tsx`
- Create: `src/app/(protected)/dashboard/provider/jobs/completed/page.tsx`
- Create: `src/app/(protected)/dashboard/provider/jobs/[id]/page.tsx`
- Create: `src/components/dashboard/provider/JobDetailView.tsx`
- Create: `src/components/dashboard/provider/JobTimeline.tsx`

**Stitch references:** Read `stitch/job-leads-enquiries.html` and `stitch/job-board.html`

**Step 1: New Leads + Active Jobs + Completed Jobs**

- New Leads: Server Component shell → JobLeadsClient ("use client") with Supabase Realtime subscription on `service_requests` INSERT events. Filter bar with category tabs.
- `JobLeadCard.tsx` ("use client"): client avatar, title, description excerpt, budget, location, urgency badge (urgent=red, high=amber, medium=neutral, low=green), Accept/Decline/Message buttons
- Active Jobs: Server Component table with days_running badge (green ≤3d, amber 4-7d, red >7d)
- Completed Jobs: URL search params for text search + pagination, review prompt for unreviewed jobs

**Step 2: Job Detail page**

- Server Component: `getJobDetail(supabase, providerId, bookingId)` → 404 if not found
- `JobDetailView.tsx` ("use client"): Two-column — left (header, scope, message thread, timeline) + right sidebar (status panel with transitions, quote summary, invoice, review, payment status)
- `JobTimeline.tsx` (Server Component): vertical timeline — Enquiry → Quote Sent → Confirmed → In Progress → Completed. Completed steps = brand-primary filled, future = neutral-300 dashed.
- Status transitions: pending→confirmed/cancelled, confirmed→in_progress/cancelled, in_progress→completed

**Step 3: Verify**

Run: `cd britv3.0 && pnpm build && pnpm lint`

**Step 4: Commit**

```bash
git add src/app/\(protected\)/dashboard/provider/jobs/ src/components/dashboard/provider/
git commit -m "feat(16-08): add job management — leads with Realtime, active/completed lists, detail view

Real-time lead notifications via Supabase Realtime, category filtering,
days_running badges, full job detail with timeline and status transitions."
```

---

### Task 9: Financial Tools — Quote Builder + Invoice Generator

**Depends on:** Task 3, Task 5
**Files:**
- Create: `src/app/(protected)/dashboard/provider/quotes/builder/page.tsx`
- Create: `src/components/dashboard/provider/QuoteBuilderForm.tsx`
- Create: `src/components/dashboard/provider/QuotePreview.tsx`
- Create: `src/app/(protected)/dashboard/provider/quotes/[id]/invoice/page.tsx`
- Create: `src/components/dashboard/provider/InvoiceGenerator.tsx`
- Create: `src/components/dashboard/provider/InvoicePreview.tsx`
- Create: `src/app/api/provider/quotes/route.ts`
- Create: `src/app/api/provider/invoices/route.ts`
- Create: `src/app/api/provider/invoices/[id]/pdf/route.ts`

**Stitch reference:** Read `stitch/quote-builder.html`

**Step 1: Quote Builder**

- Split-pane layout (lg:grid-cols-2): form left, preview right
- `QuoteBuilderForm.tsx` ("use client"): react-hook-form `useFieldArray` for line items. Columns: Description, Qty, Unit Price, VAT % (0/5/20 default 20), Line Total (computed). Default 2 rows. Add/remove rows. Totals computed in real time. Save Draft → POST /api/provider/quotes. Send to Client → POST then sendQuote.
- `QuotePreview.tsx` ("use client"): watches form data, renders branded document preview with Britestate header
- API route: POST (create/update quote), GET (list quotes)

**Step 2: Invoice Generator with PDF**

- Route: `/quotes/{quoteId}/invoice` — pre-fills from quote line items
- `InvoiceGenerator.tsx` ("use client"): Similar split-pane, additional fields (due date, payment terms, notes)
- `InvoicePreview.tsx` ("use client"): `@react-pdf/renderer` PDFViewer via `dynamic(() => import("@react-pdf/renderer").then(m => ({ default: m.PDFViewer })), { ssr: false })`
- Invoice PDF: Britestate branded header (#1B4D3E bar), INV number, line items table, totals, payment terms, footer
- API route `/invoices/[id]/pdf`: Server-side `renderToBuffer(<InvoiceDocument />)` → `Response` with `Content-Type: application/pdf`

CRITICAL: `@react-pdf/renderer` in API routes does NOT need dynamic import. Dynamic import only needed for `<PDFViewer>` in client components.

**Step 3: Verify**

Run: `cd britv3.0 && pnpm build && pnpm lint`

**Step 4: Commit**

```bash
git add src/app/\(protected\)/dashboard/provider/quotes/ src/components/dashboard/provider/ src/app/api/provider/quotes/ src/app/api/provider/invoices/
git commit -m "feat(16-09): add quote builder and invoice generator with PDF export

Split-pane quote builder with real-time totals, branded PDF invoices
via @react-pdf/renderer, sequential QT/INV numbering, VAT calculation."
```

---

### Task 10: Payments & Billing (3 pages)

**Depends on:** Task 4, Task 5
**Files:**
- Create: `src/app/(protected)/dashboard/provider/payments/page.tsx`
- Create: `src/components/dashboard/provider/PaymentsOverview.tsx`
- Create: `src/components/dashboard/provider/StripeConnectOnboarding.tsx`
- Create: `src/app/(protected)/dashboard/provider/payments/[id]/page.tsx`
- Create: `src/components/dashboard/provider/TransactionDetail.tsx`
- Create: `src/app/(protected)/dashboard/provider/billing/page.tsx`
- Create: `src/components/dashboard/provider/SubscriptionBilling.tsx`

**Stitch reference:** Read `stitch/analytics-payouts.html`

**Step 1: Payments Overview + Transaction Detail**

- Payments page: If no Stripe account or not onboarded → show `StripeConnectOnboarding` banner. If connected → fetch balance + payouts → `PaymentsOverview`
- `StripeConnectOnboarding.tsx` ("use client"): brand-primary banner, "Connect Stripe" button → POST /api/stripe/connect/create-account → redirect to onboarding_url
- `PaymentsOverview.tsx` ("use client"): Available balance card (bg-[#1B4D3E] text-white), Pending card, Payout History table, Request Payout button
- Transaction Detail: Charge details with fee breakdown (gross, Stripe fee, platform 2.5%, net), linked booking/invoice

**Step 2: Subscription & Billing**

- `SubscriptionBilling.tsx` ("use client"): Current plan banner, 3-plan comparison table (Starter £29/mo, Professional £79/mo, Premium £149/mo), feature rows, current plan highlighted with `bg-[#E8F5EE] border-[#1B4D3E]`, upgrade CTA → Stripe Checkout, payment method section via Stripe Customer Portal, billing history table

Plan features (hardcoded):
- Free: 5 leads/month, basic profile
- Starter: 25 leads, standard profile, basic analytics
- Professional: 100 leads, verified badge priority, full analytics, 2 boost credits
- Premium: unlimited leads, top placement, full analytics, 5 boost credits, priority support

**Step 3: Verify**

Run: `cd britv3.0 && pnpm build && pnpm lint`

**Step 4: Commit**

```bash
git add src/app/\(protected\)/dashboard/provider/payments/ src/app/\(protected\)/dashboard/provider/billing/ src/components/dashboard/provider/
git commit -m "feat(16-10): add payments overview, transaction detail, and subscription billing

Stripe Connect onboarding banner, balance/payout display, fee breakdown,
3-tier plan comparison with upgrade flow."
```

---

### Task 11: Portfolio & Reviews (3 pages)

**Depends on:** Task 4, Task 5
**Files:**
- Create: `src/app/(protected)/dashboard/provider/portfolio/page.tsx`
- Create: `src/components/dashboard/provider/PortfolioGrid.tsx`
- Create: `src/components/dashboard/provider/PortfolioItemCard.tsx`
- Create: `src/app/(protected)/dashboard/provider/reviews/page.tsx`
- Create: `src/components/dashboard/provider/ReviewsBreakdown.tsx`
- Create: `src/components/dashboard/provider/ReviewCard.tsx`
- Create: `src/app/(protected)/dashboard/provider/reviews/[id]/respond/page.tsx`
- Create: `src/components/dashboard/provider/ReviewResponseForm.tsx`
- Create: `src/app/api/provider/portfolio/route.ts`
- Create: `src/app/api/provider/reviews/[id]/respond/route.ts`

**Stitch reference:** Read `stitch/portfolio-reviews.html`

**Step 1: Portfolio with dnd-kit drag-drop**

- `PortfolioGrid.tsx` ("use client"): dnd-kit `DndContext` + `SortableContext` with `rectSortingStrategy`, `useSensors(PointerSensor, KeyboardSensor)`, `handleDragEnd` calls `reorderPortfolioItems`, grid 3-col desktop / 2-col tablet / 1-col mobile
- `PortfolioItemCard.tsx` ("use client"): `useSortable` hook, GripVertical drag handle, before/after image pair with labels, title, category pill, edit/delete buttons, "Set as Featured" toggle
- Add Project dialog: title (max 100), description (max 500), category select, before/after photo uploads to Supabase Storage
- API route: POST (add), GET (list), PATCH /reorder (batch update display_order)

**Step 2: Reviews Dashboard + Review Response**

- Reviews page (Server Component): Compute aggregates from `getReviews`, filter by URL `?rating=` param
- `ReviewsBreakdown.tsx` (Server Component): Large average rating, horizontal bar chart per star level (bar width proportional to percentage, fill brand-primary), sub-dimension averages (Communication, Quality, Value)
- `ReviewCard.tsx` (Server Component): reviewer info, star rating, comment, sub-dimension pills, provider response section (if exists), "Reply to review" link
- Review Respond page: Read-only original review + `ReviewResponseForm.tsx` ("use client") with 500-char max textarea, guidelines box (amber), preview section
- API route: POST with ownership check, 409 if already responded, min 10 chars, max 500

**Step 3: Verify**

Run: `cd britv3.0 && pnpm build && pnpm lint`

**Step 4: Commit**

```bash
git add src/app/\(protected\)/dashboard/provider/portfolio/ src/app/\(protected\)/dashboard/provider/reviews/ src/components/dashboard/provider/ src/app/api/provider/
git commit -m "feat(16-11): add portfolio gallery with drag-reorder and reviews dashboard

dnd-kit sortable grid for before/after photos, star rating breakdown
chart, one-time review response with 500-char limit."
```

---

### Task 12: Analytics & Growth Tools (3 pages)

**Depends on:** Task 4, Task 5
**Files:**
- Create: `src/app/(protected)/dashboard/provider/analytics/page.tsx`
- Create: `src/components/dashboard/provider/AnalyticsCharts.tsx`
- Create: `src/components/dashboard/provider/ConversionFunnel.tsx`
- Create: `src/app/(protected)/dashboard/provider/boost/page.tsx`
- Create: `src/components/dashboard/provider/BoostSelector.tsx`
- Create: `src/app/(protected)/dashboard/provider/referrals/page.tsx`
- Create: `src/components/dashboard/provider/ReferralCard.tsx`
- Create: `src/app/api/provider/boost/route.ts`
- Create: `src/app/api/provider/referrals/route.ts`

**Stitch reference:** Read `stitch/analytics-payouts.html`

**Step 1: Analytics with Recharts**

- Analytics page: URL param `?period=` (7d/30d/90d, default 30d), Server Component fetches `getProviderAnalytics`
- `AnalyticsCharts.tsx` ("use client"): Recharts `ResponsiveContainer` + `AreaChart` for earnings trend (gradient fill from #1B4D3E to transparent), `BarChart` for top 5 categories (horizontal bars, fill #1B4D3E). Period selector tabs.
- `ConversionFunnel.tsx` (Server Component): 4-stage funnel (Profile Views → Enquiries → Quotes → Bookings), custom CSS/SVG (not Recharts), conversion rate % between stages, colours gradient from neutral to brand-primary. Empty state for new providers.

**Step 2: Boost + Referrals**

- Boost page: Active promotions section + 3 purchasable options (Featured Profile £29/wk, Area Spotlight £49/wk, Category Top £79/wk) with duration selector, "Boost Now" → Stripe Checkout
- `BoostSelector.tsx` ("use client"): Option cards with price, feature list with tick marks, duration selector (1/2/4 weeks), active badge if same type already active
- Referrals page: `getReferralCode` (auto-creates with nanoid(8)), `getReferralStats`, `getReferrals`
- `ReferralCard.tsx` ("use client"): Referral URL input with "Copy Link" button (navigator.clipboard), WhatsApp/Email share buttons, 3 stat cards (Invited, Signed Up, Earned), referred providers table with status badges

**Step 3: Verify**

Run: `cd britv3.0 && pnpm build && pnpm lint`
Expected: 0 errors. All 25 provider routes now exist.

**Step 4: Commit**

```bash
git add src/app/\(protected\)/dashboard/provider/analytics/ src/app/\(protected\)/dashboard/provider/boost/ src/app/\(protected\)/dashboard/provider/referrals/ src/components/dashboard/provider/ src/app/api/provider/
git commit -m "feat(16-12): add analytics charts, boost/promote, and referral programme

Recharts area/bar charts with period selector, 4-stage conversion funnel,
3-tier boost purchase, nanoid referral codes with copy-to-clipboard."
```

---

## Final Verification

After all 12 tasks complete:

```bash
cd britv3.0 && pnpm build && pnpm lint && pnpm test --run
```

Manually verify:
- [ ] Navigating to /dashboard/provider as unauthenticated → redirects to /login
- [ ] Navigating to /dashboard/provider as non-provider → redirects to /dashboard
- [ ] Sidebar shows all 25 nav items in 7 groups
- [ ] Dashboard home shows 4 KPI cards with real data
- [ ] Verification stepper shows 5 steps with correct status
- [ ] Service areas map loads MapLibre without SSR errors
- [ ] Quote builder totals update in real time
- [ ] PDF invoice downloads with Britestate branding
- [ ] Portfolio drag-drop reorders and persists
- [ ] Analytics Recharts charts render client-side only
- [ ] Referral link copy button works
- [ ] ALL colours are Britestate brand (#1B4D3E), zero Stitch placeholders (#11d432, #17cf97)

## Requirements Coverage

| Req | Feature | Task |
|-----|---------|------|
| TPD-01 | Dashboard home KPIs | 2, 5 |
| TPD-02 | Profile edit | 2, 5 |
| TPD-03 | Verification 5-step progress | 2, 6 |
| TPD-04 | Document upload (PDF/JPEG/PNG, 10MB) | 2, 6 |
| TPD-05 | Service areas map editor | 2, 7 |
| TPD-06 | Client references (3 refs) | 2, 6 |
| TPD-07 | Peer references (3 refs) | 2, 6 |
| TPD-08 | Services management | 2, 7 |
| TPD-09 | Availability calendar | 2, 7 |
| TPD-10 | Badge status with expiry | 2, 6 |
| TPD-11 | Job leads with accept/decline | 3, 8 |
| TPD-12 | Active jobs with days_running | 3, 8 |
| TPD-13 | Completed jobs with search | 3, 8 |
| TPD-14 | Job detail (scope, messages, timeline) | 3, 8 |
| TPD-15 | Quote Builder with VAT | 3, 9 |
| TPD-16 | Invoice Generator with PDF | 3, 9 |
| TPD-17 | Payments Overview (Stripe balance) | 4, 10 |
| TPD-18 | Transaction Detail | 4, 10 |
| TPD-19 | Portfolio with drag-reorder | 4, 11 |
| TPD-20 | Reviews Dashboard (star breakdown) | 4, 11 |
| TPD-21 | Review Response | 4, 11 |
| TPD-22 | Analytics (charts, funnel) | 4, 12 |
| TPD-23 | Subscription & Billing | 4, 10 |
| TPD-24 | Boost/Promote | 4, 12 |
| TPD-25 | Referral Programme | 4, 12 |
