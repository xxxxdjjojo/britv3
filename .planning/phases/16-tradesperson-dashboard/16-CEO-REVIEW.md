# Phase 16 — Tradesperson Dashboard: CEO Plan Review
**Reviewed:** 2026-03-15
**Mode:** SCOPE EXPANSION
**Status:** Review complete — use this document to brief a fresh execution session

---

## How to use this document

This is the authoritative brief for Phase 16 execution. It supersedes and amends the existing `16-01-PLAN.md` through `16-12-PLAN.md` where noted. Before running any `/gsd:execute-phase` command:

1. Complete the **Prerequisite cleanup** (below) — ~15 minutes
2. Read **Locked decisions** — these amend the existing plan files
3. Execute waves in order per the **Execution order** table
4. Two delight features are **in-scope** (not deferred) — see **Scope additions**

---

## What this phase builds

25 pages covering every aspect of a service provider's business on Britestate:

| Group | Pages | Description |
|-------|-------|-------------|
| Dashboard & Profile | 11.1–11.2 | KPI home, profile edit |
| Verification Centre | 11.3–11.7 | 5-step stepper, doc upload, client/peer refs, badge status |
| Services & Availability | 11.8–11.10 | Services CRUD, MapLibre service area editor, availability calendar |
| Job Management | 11.11–11.14 | New leads, active jobs, completed jobs, job detail |
| Financial Tools | 11.15–11.18 | Quote builder, invoice generator, payments overview, transaction detail |
| Portfolio & Reviews | 11.19–11.21 | Gallery (before/after), reviews dashboard, review respond |
| Growth & Analytics | 11.22–11.25 | Analytics, subscription/billing, boost/promote, referral programme |

**Plus two in-scope additions from EXPANSION mode:**
- AI line-item autocomplete on Quote Builder (11.15)
- Live payout ETA banner on Payments Overview (11.17)

---

## PREREQUISITE CLEANUP — do this before any Phase 16 execution

### Step 1: Delete the orphaned route tree (~5 minutes)

There are two provider dashboard route trees. `dashboard/service_provider/` must be deleted. `dashboard/provider/` is canonical.

Files to delete:
```
src/app/(protected)/dashboard/service_provider/earnings/page.tsx
src/app/(protected)/dashboard/service_provider/jobs/JobsBoardClient.tsx
src/app/(protected)/dashboard/service_provider/jobs/page.tsx
src/app/(protected)/dashboard/service_provider/quotes/page.tsx
src/app/(protected)/dashboard/service_provider/reviews/page.tsx
src/app/(protected)/dashboard/service_provider/verification/page.tsx
```
Then remove the now-empty `dashboard/service_provider/` directory.

### Step 2: Add 301 redirects in `next.config.ts`

```typescript
// In the redirects() array in next.config.ts:
{
  source: '/dashboard/service_provider/:path*',
  destination: '/dashboard/provider/:path*',
  permanent: true,
},
```

### Step 3: Fix the CSP in `src/middleware.ts`

The current `img-src` does not include MapTiler's CDN. The service areas map editor (11.9) will silently fail to render map tiles without this. Find the CSP directives in `buildCsp()` and update two lines:

```typescript
// BEFORE:
"img-src 'self' data: blob: https://*.supabase.co",
"connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://us.i.posthog.com",

// AFTER:
"img-src 'self' data: blob: https://*.supabase.co https://api.maptiler.com https://*.maptiler.com",
"connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://us.i.posthog.com https://api.maptiler.com",
```

### Step 4: Verify clean build

```bash
cd /Users/joanflerinbig/Documents/britv3.0
pnpm build && pnpm lint
```

Must be zero errors before proceeding to Wave 1.

---

## Locked decisions (amendments to existing plans)

These decisions were made during the CEO review. Each amends or adds to the existing plan files. The executor must apply them.

---

### Decision 1: Route tree consolidation
**Applies to:** All plans (16-01 through 16-12)
**Change:** All routes use `src/app/(protected)/dashboard/provider/` as documented in CONTEXT.md. The `service_provider/` tree is gone after the prerequisite cleanup. No plan file needs editing — they already target the right path.

---

### Decision 2: Stripe webhook handler — add to Plan 16-01 (Wave 1)

**Applies to:** 16-01-PLAN.md — add the following task to Wave 1

**New file:** `src/app/api/webhooks/stripe/route.ts`

This is a prerequisite for Payments Overview (11.17) and Individual Transaction (11.18) showing live payout data. Without it, providers see permanently stale balances.

```
Task: Stripe Connect webhook handler

Files:
  src/app/api/webhooks/stripe/route.ts
  src/app/api/webhooks/stripe/route.test.ts   (unit tests)

Behaviour:
  POST handler (no auth middleware — Stripe calls this, not users):
  1. Read raw body as text (required for signature verification)
  2. Call stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  3. If StripeSignatureVerificationError → return 400, log WARN to Sentry
  4. Check stripe_events table for existing event.id (idempotency)
     - If found: return 200 immediately (silent skip, log INFO)
     - If not found: continue
  5. Route by event.type:
     - 'payout.paid' / 'payout.failed':
       Upsert into stripe_connect_accounts: { last_payout_amount, last_payout_status, last_payout_at }
     - 'account.updated':
       Upsert stripe_connect_accounts: { kyc_status, payouts_enabled, charges_enabled, details_submitted }
     - 'payment_intent.succeeded':
       Update provider_invoices: { status: 'paid', paid_at: now() } WHERE stripe_payment_intent_id = event.data.object.id
     - All other events: 200 OK (log DEBUG)
  6. Insert idempotency record: stripe_events(id, event_id, event_type, processed_at)
  7. Return 200 OK

Webhook secret env var: STRIPE_WEBHOOK_SECRET
Must be added to .env.example with comment: # From Stripe dashboard > Webhooks > Signing secret

Tests to write:
  - valid signature + payout.paid → upserts account, returns 200
  - invalid signature → returns 400
  - duplicate event_id → returns 200 without DB write (idempotent)
  - unknown event type → returns 200 without error
```

**New DB table — add to Wave 1 migration:**

```sql
-- Idempotency table for Stripe webhook events
CREATE TABLE stripe_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        TEXT NOT NULL UNIQUE,   -- Stripe's evt_xxx ID
  event_type      TEXT NOT NULL,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  account_id      TEXT,                   -- Stripe account_id if present
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: service_role only (webhooks use service client, not anon)
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON stripe_events
  USING (auth.role() = 'service_role');
```

**Post-deploy step:** Register the webhook endpoint in Stripe dashboard:
- URL: `https://yourdomain.com/api/webhooks/stripe`
- Events: `payout.paid`, `payout.failed`, `account.updated`, `payment_intent.succeeded`
- Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

---

### Decision 3: VerificationDocumentType enum — extend in Wave 1 migration

**Applies to:** 16-01-PLAN.md (migration) and `src/types/marketplace.ts`

The existing enum has 6 generic values. 11.4 needs UK-specific trade credentials. Add to the Wave 1 SQL migration:

```sql
-- Extend the existing VerificationDocumentType enum
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'gas_safe_certificate';
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'niceic_registration';
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'napit_registration';
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'cscs_card';
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'part_p_certificate';
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'acs_qualification';
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'public_liability_insurance';
```

Also update `src/types/marketplace.ts` — add these values to the `VerificationDocumentType` type union:
```typescript
export type VerificationDocumentType =
  | "identity_proof"
  | "qualification_certificate"
  | "insurance_certificate"
  | "business_registration"
  | "dbs_check"
  | "reference_letter"
  // UK trade-specific credentials (added Phase 16):
  | "gas_safe_certificate"
  | "niceic_registration"
  | "napit_registration"
  | "cscs_card"
  | "part_p_certificate"
  | "acs_qualification"
  | "public_liability_insurance";
```

---

### Decision 4: PostGIS service areas — confirmed, use geometry column

**Applies to:** 16-01-PLAN.md (migration)

PostGIS is confirmed enabled. The `provider_service_areas` table should use the geometry type:

```sql
-- provider_service_areas uses PostGIS geometry
CREATE EXTENSION IF NOT EXISTS postgis;  -- guard in case

CREATE TABLE provider_service_areas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID NOT NULL REFERENCES service_provider_details(id) ON DELETE CASCADE,
  name          TEXT,                          -- optional label e.g. "London Zone"
  zone          geometry(MultiPolygon, 4326) NOT NULL,
  radius_km     NUMERIC(6,2),                  -- null if polygon mode
  zone_type     TEXT NOT NULL DEFAULT 'polygon' CHECK (zone_type IN ('radius', 'polygon')),
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_service_areas_provider ON provider_service_areas(provider_id);
CREATE INDEX idx_provider_service_areas_zone ON provider_service_areas USING gist(zone);

ALTER TABLE provider_service_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers_own_areas" ON provider_service_areas
  FOR ALL USING (
    provider_id IN (
      SELECT id FROM service_provider_details WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );
```

**Error handling for bad geometry (add to service layer):**
```typescript
// In provider-service-area-service.ts, before insert:
try {
  await supabase.from('provider_service_areas').insert({ ...area });
} catch (err) {
  if (err instanceof PostgrestError && err.code === '22023') {
    // Invalid geometry — self-intersecting or out-of-bounds
    throw new Error('Invalid coverage zone — the drawn shape is invalid. Try redrawing without crossing lines.');
  }
  throw err;
}
```

---

### Decision 5: Recurring availability rules — JSONB format

**Applies to:** 16-01-PLAN.md (migration), availability service

Add `recurring_rules` column to `provider_availability` table:

```sql
ALTER TABLE provider_availability
  ADD COLUMN IF NOT EXISTS recurring_rules JSONB NOT NULL DEFAULT '[]';
```

TypeScript shape:
```typescript
type RecurringAvailabilityRule = {
  days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  start_time: string;   // "HH:MM" format, e.g. "08:00"
  end_time: string;     // "HH:MM" format, e.g. "18:00"
  effective_from: string;         // ISO date string
  effective_until: string | null; // null = indefinite
};
```

---

### Decision 6: Naming fixes — apply in Wave 1 migration

**Applies to:** 16-01-PLAN.md

Two column name ambiguities to fix before any tables are created:

1. `provider_references.reference_type` (NOT `type` — avoids SQL reserved word and TS `type` keyword conflicts)
2. `provider_boosts.duration_days` (NOT `duration` — units must be explicit)

Ensure these names are used in the migration SQL, TypeScript types, and any references in plan files.

---

### Decision 7: PDF generation — server-side authenticated API route

**Applies to:** 16-09-PLAN.md (already partially correct — this confirms and adds auth enforcement)

The existing plan already mentions `/api/provider/invoices/[id]/pdf/route.ts`. Confirm the auth pattern:

```typescript
// src/app/api/provider/invoices/[id]/pdf/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new Response('Unauthorized', { status: 401 });

  // Fetch invoice — RLS enforces provider ownership automatically
  const { data: invoice, error } = await supabase
    .from('provider_invoices')
    .select('*, line_items, provider:service_provider_details(*)')
    .eq('id', params.id)
    .single();

  if (error || !invoice) return new Response('Not found', { status: 404 });

  // Generate PDF server-side (no dynamic import needed in API routes)
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const buffer = await renderToBuffer(<InvoiceDocument invoice={invoice} />);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
```

Same pattern for `/api/provider/quotes/[id]/pdf/route.ts`.

**No static PDF storage** — generated on demand, no Supabase Storage writes.

---

### Decision 8: Analytics — pre-computed via nightly Edge Function

**Applies to:** 16-01-PLAN.md (add `provider_analytics_daily` table), 16-12-PLAN.md (analytics page reads from it)

**New table in Wave 1 migration:**

```sql
CREATE TABLE provider_analytics_daily (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID NOT NULL REFERENCES service_provider_details(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  profile_views     INTEGER NOT NULL DEFAULT 0,
  enquiries_received INTEGER NOT NULL DEFAULT 0,
  quotes_sent       INTEGER NOT NULL DEFAULT 0,
  bookings_won      INTEGER NOT NULL DEFAULT 0,
  earnings_pence    BIGINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(provider_id, date)
);

CREATE INDEX idx_provider_analytics_daily_provider_date
  ON provider_analytics_daily(provider_id, date DESC);

ALTER TABLE provider_analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers_see_own_analytics" ON provider_analytics_daily
  FOR SELECT USING (
    provider_id IN (
      SELECT id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );
```

**New Edge Function:** `supabase/functions/nightly-provider-analytics/index.ts`

Runs nightly via pg_cron at 02:00 UTC. For each active provider, computes yesterday's metrics from `bookings`, `service_requests`, `quotes`, and `provider_invoices` tables, then upserts to `provider_analytics_daily`.

**Analytics page UI note:** Add "Stats updated daily at 02:00 UTC" in small text below the chart date selector on page 11.22.

---

### Decision 9: Quote Builder — localStorage draft auto-save

**Applies to:** 16-09-PLAN.md (add to QuoteBuilderForm.tsx)

Add to `QuoteBuilderForm.tsx`:

```typescript
// Auto-save draft to localStorage every 30 seconds
const DRAFT_KEY = `quote_draft_${providerId}`;

// On mount: restore draft if present
useEffect(() => {
  const saved = localStorage.getItem(DRAFT_KEY);
  if (saved) {
    const draft = JSON.parse(saved);
    // Show restore banner
    setShowDraftBanner(true);
    setDraftData(draft);
  }
}, []);

// Auto-save interval
useEffect(() => {
  const interval = setInterval(() => {
    const values = getValues(); // react-hook-form
    if (values.lineItems?.length > 0) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    }
  }, 30_000);
  return () => clearInterval(interval);
}, [getValues]);

// Clear on successful send
const onSendSuccess = () => {
  localStorage.removeItem(DRAFT_KEY);
  router.push('/dashboard/provider/jobs/active');
};
```

Restore banner: `"You have an unsaved draft from [time ago]. Restore it?" [Restore] [Discard]`

---

### Decision 10: DRY — shared components (enforce in all UI plans)

These components appear in multiple pages. Build them ONCE and reuse:

**`<ReferenceTracker type="client" | "peer" />`**
- Used by: 11.5 (client references) and 11.6 (peer references)
- Lives at: `src/components/dashboard/provider/ReferenceTracker.tsx`
- 16-06-PLAN.md and 16-07-PLAN.md must both reference this single component

**`<JobList status="lead" | "active" | "completed" />`**
- Used by: 11.11, 11.12, 11.13
- Lives at: `src/components/dashboard/provider/JobList.tsx`
- 16-11-PLAN.md must build this component once and pass the `status` prop to filter

**`useProviderStats()` hook**
- Used by: 11.1 (dashboard), 11.17 (payments), 11.22 (analytics)
- Lives at: `src/hooks/useProviderStats.ts`
- Wraps `getProviderDashboardStats` with React Query, 5-minute stale time

---

## Scope additions (in-scope EXPANSION features)

### Addition A: AI line-item autocomplete on Quote Builder

**New file:** `src/app/api/provider/quotes/suggest-items/route.ts`
**Updated file:** `src/components/dashboard/provider/QuoteBuilderForm.tsx`
**Wave:** 4 (alongside Quote Builder in 16-09)

```
POST /api/provider/quotes/suggest-items
Body: { jobTitle: string, category: ServiceCategory }
Auth: required (provider session)

Handler:
  1. Auth guard
  2. Rate limit: max 5 calls per provider per hour (use Upstash Redis — already installed)
  3. Call Claude Haiku:
     prompt: "You are a UK tradesperson quoting tool. Given the job title and trade category,
     return a JSON array of typical line items for a quote.
     Job: {jobTitle}
     Category: {category}
     Return JSON array: [{ description: string, quantity: number, unit: 'hours'|'each'|'m2'|'m', unit_price_estimate_gbp: number }]
     Return 3-8 items. UK pricing. No preamble, JSON only."
  4. Parse response, validate shape with zod
  5. Return { items: LineItemSuggestion[] }
  6. On any Claude error: return 200 with empty items [] (graceful degradation)

Cost: ~£0.0008 per call at Claude Haiku pricing. Cap with rate limiter.
```

**UI change in QuoteBuilderForm.tsx:**
- Add "✨ Suggest line items" button above the line items table (shown when jobTitle field is filled)
- On click: POST to suggest-items, show loading spinner on button
- On success: populate line items with suggestions (replace empty rows / append to existing)
- On error or empty response: show toast "Couldn't generate suggestions. Add items manually."

---

### Addition B: Live payout ETA on Payments Overview

**Updated file:** `src/app/(protected)/dashboard/provider/payments/page.tsx`
**Updated file:** `src/components/dashboard/provider/PayoutsOverview.tsx`
**Wave:** 5 (alongside payments pages in 16-10 or 16-12)

```typescript
// Fetch payout schedule from Stripe Connect account
const account = await stripe.accounts.retrieve(stripeAccountId);
const schedule = account.settings?.payouts?.schedule;

// Compute next payout date
function getNextPayoutDate(schedule: Stripe.Account.Settings.Payouts.Schedule): Date {
  if (schedule.interval === 'manual') return null;
  if (schedule.interval === 'daily') {
    return addDays(startOfTomorrow(), 0);
  }
  if (schedule.interval === 'weekly') {
    // schedule.weekly_anchor = 'monday' | 'tuesday' etc.
    return nextDayOfWeek(schedule.weekly_anchor);
  }
  if (schedule.interval === 'monthly') {
    return nextMonthDay(schedule.monthly_anchor);
  }
}
```

**UI:** Banner at top of Payments Overview (shown only when Stripe Connect is linked and payouts_enabled):
```
┌─────────────────────────────────────────────────────────┐
│ 💰  Next payout: £1,247.50 arriving Tuesday 18 March    │
└─────────────────────────────────────────────────────────┘
```
Background: `brand-primary-lighter` (#E8F5EE), border-left: 4px solid `brand-primary`.
If account not connected or no pending payout: banner not shown.

---

## Error handling — required in every new service

Apply these patterns everywhere. No silent failures.

```typescript
// Pattern 1: Stripe API calls
try {
  const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
  return balance;
} catch (err) {
  if (err instanceof Stripe.errors.StripeConnectionError) {
    // Return cached value from stripe_connect_accounts table
    return getCachedStripeBalance(supabase, providerId);
  }
  if (err instanceof Stripe.errors.StripeInvalidRequestError) {
    // Account not connected or deauthorised
    throw new StripeAccountNotConnectedError(providerId);
  }
  throw err;
}

// Pattern 2: PDF generation timeout
const PDF_TIMEOUT_MS = 10_000;
const pdfPromise = renderToBuffer(<InvoiceDocument {...} />);
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('PDF generation timed out')), PDF_TIMEOUT_MS)
);
const buffer = await Promise.race([pdfPromise, timeoutPromise]);
// Caller catches Error and returns 500 with user message

// Pattern 3: PostGIS geometry validation
if (geometryFeatures.length === 0) {
  throw new Error('No coverage zone drawn. Draw at least one zone on the map.');
}
// Let postgis throw on invalid geometry, catch PostgrestError with code '22023'

// Pattern 4: Resend email failures
try {
  await resend.emails.send({ ... });
} catch (err) {
  // Log but don't throw — reference row is already saved
  console.error('[reference-request] Resend failed:', { providerId, refereeEmail, err });
  // Return success with warning flag
  return { success: true, emailSent: false };
}
```

---

## Test requirements — write these, they don't exist yet

For each test listed, create or add to the relevant `__tests__/` file.

```
UNIT TESTS:
  [ ] Stripe webhook: valid sig + payout.paid → upserts account, returns 200
  [ ] Stripe webhook: invalid sig → returns 400
  [ ] Stripe webhook: duplicate event_id → 200, no DB write (idempotent)
  [ ] Quote VAT calculation: 20% / 5% / 0% rates → correct totals
  [ ] PDF generation: null line items → graceful error, not crash
  [ ] localStorage draft: stale draft (>7 days old) → not restored
  [ ] Referral self-signup: provider uses own code → rejected at API route
  [ ] Next payout ETA: weekly schedule → correct next Monday date
  [ ] AI suggest items: Claude error → returns [] not throws

INTEGRATION TESTS:
  [ ] RLS: Provider A cannot SELECT Provider B's provider_invoices row
  [ ] RLS: Provider A cannot SELECT Provider B's provider_analytics_daily rows
  [ ] PostGIS: self-intersecting polygon → PostgrestError with code 22023
  [ ] Supabase Realtime: new service_request insert → job_notifications channel fires

SECURITY TESTS:
  [ ] GET /api/provider/invoices/[id]/pdf with Provider B's session → 404 (not 403 — don't confirm existence)
  [ ] GET /api/provider/quotes/[id]/pdf with no session → 401
  [ ] POST /api/provider/quotes/suggest-items with 6th request in 1hr → 429
```

---

## Performance requirements

| Page | Requirement | Implementation |
|------|-------------|----------------|
| 11.22 Analytics | < 100ms query | Read from `provider_analytics_daily` (pre-computed) |
| 11.19 Portfolio | Paginate at 12 items | `LIMIT 12 OFFSET ?`, lazy-load images |
| 11.1 Dashboard | < 200ms | Parallel queries via `Promise.all` in `getProviderDashboardStats` |
| 11.11 New Leads | Realtime push | Supabase Realtime subscription on `service_requests` table |
| PDF generation | < 10s | Set timeout promise race, return 500 if exceeded |

---

## Feature flag

Add to `.env.example` and `.env.local`:

```bash
# Enable Stripe Connect provider payments (set false to hide payments pages during rollout)
FEATURE_STRIPE_CONNECT_ENABLED=true

# Stripe webhook signing secret (from Stripe dashboard > Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...
```

In payments-related pages (11.17, 11.18), check `process.env.FEATURE_STRIPE_CONNECT_ENABLED === 'true'` before rendering. If false, show "Payments coming soon" placeholder.

---

## Observability — add to every new codepath

```typescript
// Required log entries per service:

// 1. Stripe webhook (every event):
console.log('[stripe-webhook]', { eventType: event.type, eventId: event.id, accountId, outcome: 'processed' | 'duplicate' | 'unknown' });

// 2. PDF generation:
console.log('[pdf-generate]', { type: 'invoice' | 'quote', id: params.id, lineItemCount, renderMs, fileSizeBytes });

// 3. AI quote suggestions:
console.log('[ai-suggest-items]', { providerId, jobTitle, category, itemsReturned, latencyMs, tokensUsed });

// 4. Service area save:
console.log('[service-area-save]', { providerId, vertexCount, zoneType, outcome: 'saved' | 'invalid_geometry' });

// 5. Stripe balance fetch (degraded mode):
console.warn('[stripe-balance]', { providerId, outcome: 'api_error_using_cache', error: err.message });
```

**New alerts to configure in Sentry/PostHog:**
- Stripe webhook signature failure rate > 2% → alert
- PDF generation timeout rate > 5% → alert
- AI suggest-items error rate > 10% → alert
- Provider Realtime connection drop rate > 15% → alert

---

## Execution order

### Pre-execution (NOW, before any waves)
1. Prerequisite cleanup: delete `service_provider/` routes, add redirects, fix CSP
2. Add `STRIPE_WEBHOOK_SECRET` and `FEATURE_STRIPE_CONNECT_ENABLED` to `.env.example`
3. `pnpm build && pnpm lint` must be GREEN

### Wave 1 — Foundation (16-01)
All 8 new DB tables + stripe_events idempotency table + Stripe webhook handler + TypeScript types + test stubs.

Amended checklist for 16-01:
- [ ] All 8 core tables (provider_services, provider_references, provider_badges, provider_portfolio_items, provider_invoices, stripe_connect_accounts, provider_boosts, provider_referrals)
- [ ] `stripe_events` idempotency table (NEW — see Decision 2)
- [ ] `provider_analytics_daily` table (NEW — see Decision 8)
- [ ] `provider_service_areas` with PostGIS geometry (confirmed — see Decision 4)
- [ ] `recurring_rules JSONB` column on provider_availability (NEW — see Decision 5)
- [ ] Extend `VerificationDocumentType` enum with 7 UK trade credential values (NEW — see Decision 3)
- [ ] `provider_references.reference_type` column name (not `type`) (FIX — see Decision 6)
- [ ] `provider_boosts.duration_days` column name (not `duration`) (FIX — see Decision 6)
- [ ] `src/app/api/webhooks/stripe/route.ts` with idempotency + signature verification (NEW — see Decision 2)
- [ ] Update `src/types/marketplace.ts` with new VerificationDocumentType values
- [ ] TypeScript types file: `src/types/provider-dashboard.ts`
- [ ] 4 test stub files

### Wave 2 — Service layer (16-02, 16-03, 16-04)
Service layer for dashboard, verification, jobs, payments. No changes from existing plans except:
- 16-02: `getProviderReferences` must use `reference_type` (not `type`) column name
- 16-03: `provider_quote_service` must accept `null` VAT rate (treat as 0%)
- 16-04: Stripe balance fetch must catch `StripeConnectionError` and fall back to cached value in `stripe_connect_accounts` table

### Wave 3 — Provider layout + Group 1 & 2 pages (16-05, 16-06, 16-07)
Dashboard home, profile edit, verification centre (5 pages).

Amended checklist:
- [ ] 16-05: `<ReferenceTracker>` component built in this wave — **not** repeated in 16-06/16-07
- [ ] 16-06: Imports `<ReferenceTracker type="client" />` — does NOT duplicate the component
- [ ] 16-07: Imports `<ReferenceTracker type="peer" />` — does NOT duplicate the component
- [ ] All credential upload UI (11.4) uses the extended `VerificationDocumentType` values with human-readable labels (e.g. `gas_safe_certificate` → "Gas Safe Certificate")

### Wave 4 — Services, Calendar, Quote Builder (16-08, 16-09)
Map editor, availability calendar, quote builder, invoice generator.

Amended checklist:
- [ ] 16-08 (Map Editor): catch PostGIS geometry errors, show toast "Invalid zone shape"
- [ ] 16-09 (Quote Builder): add localStorage auto-save every 30s (see Decision 9)
- [ ] 16-09 (Quote Builder): add "✨ Suggest line items" button → `/api/provider/quotes/suggest-items` (see Scope Addition A)
- [ ] 16-09 (Invoice Generator): PDF via authenticated server route (see Decision 7)
- [ ] 16-09: add `/api/provider/quotes/suggest-items/route.ts` (new file)
- [ ] 16-09: add `/api/provider/quotes/[id]/pdf/route.ts` (confirms and enforces auth gate)
- [ ] 16-09: add `/api/provider/invoices/[id]/pdf/route.ts` (confirms and enforces auth gate)

### Wave 5 — Jobs, Payments, Analytics (16-10, 16-11, 16-12)
Job management (11.11–11.14), payments (11.17–11.18), analytics (11.22–11.25).

Amended checklist:
- [ ] 16-11 (Jobs): build `<JobList status={...} />` once, reuse for 11.11, 11.12, 11.13
- [ ] 16-10 or 16-12 (Payments): add payout ETA banner (see Scope Addition B)
- [ ] 16-12 (Analytics): reads from `provider_analytics_daily` — NOT from real-time joins
- [ ] 16-12 (Analytics): add "Stats updated daily at 02:00 UTC" note in UI
- [ ] 16-12 (Subscription, 11.23): check `FEATURE_STRIPE_CONNECT_ENABLED` before rendering payment methods
- [ ] 16-12 (Boost, 11.24): check `FEATURE_STRIPE_CONNECT_ENABLED` before Stripe Checkout redirect

---

## Post-Phase 16 deployment checklist

After all waves are complete and `pnpm build` is green:

```
[ ] Register Stripe webhook in Stripe dashboard
    URL: https://{domain}/api/webhooks/stripe
    Events: payout.paid, payout.failed, account.updated, payment_intent.succeeded
    Copy signing secret to STRIPE_WEBHOOK_SECRET env var

[ ] Schedule nightly-provider-analytics Edge Function
    In Supabase dashboard: Edge Functions > nightly-provider-analytics
    pg_cron: SELECT cron.schedule('nightly-provider-analytics', '0 2 * * *', ...)

[ ] Smoke test checklist:
    [ ] 11.1: Dashboard loads with real KPI numbers
    [ ] 11.9: MapLibre map renders with tiles (tiles visible, not blank)
    [ ] 11.11: New lead arrives via Realtime (not just polling)
    [ ] 11.15: Quote Builder saves draft to localStorage on timer
    [ ] 11.15: "✨ Suggest line items" returns AI suggestions
    [ ] 11.16: PDF download returns application/pdf response
    [ ] 11.17: Payout ETA banner visible if Stripe Connect linked
    [ ] 11.22: Analytics page loads quickly (< 200ms) from pre-computed table
    [ ] Webhook: send test event from Stripe dashboard, verify processed
    [ ] Security: try /api/provider/invoices/[other-provider-invoice-id]/pdf → 404

[ ] Set FEATURE_STRIPE_CONNECT_ENABLED=true in production env vars
```

---

## What's in TODOS.md (deferred from this review)

Items added during CEO review — not blocking Phase 16 but captured for future work:

| Priority | Item | Depends on |
|----------|------|------------|
| P1 | Lead Quality Score on 11.11 — AI-computed 1–5★ badge on enquiry cards | Phase 16 analytics + marketplace data volume |
| P1 | Britestate Verified Trust Mark — surface provider badges on public profile + search results | Phase 16 badges system |
| P2 | Competitive Pricing Nudge on 11.8 — "Market rate in your area: £65–£85/hr" | Sufficient quotes data volume |
| P2 | One-tap Re-quote on 11.13 — pre-fill Quote Builder from completed job | 11.13 and 11.15 both shipped |

---

## Quick reference: new files created in Phase 16

```
src/app/(protected)/dashboard/provider/
  layout.tsx                           (provider sidebar navigation)
  page.tsx                             (11.1 Dashboard Home)
  profile/page.tsx                     (11.2 Profile Edit)
  verification/page.tsx                (11.3 Verification Overview)
  verification/credentials/page.tsx    (11.4 Upload Credentials)
  verification/client-references/page.tsx (11.5 Client References)
  verification/peer-references/page.tsx   (11.6 Peer References)
  verification/badges/page.tsx         (11.7 Badge Status)
  services/page.tsx                    (11.8 Services Manage)
  services/areas/page.tsx              (11.9 Service Areas Map)
  availability/page.tsx                (11.10 Availability Calendar)
  jobs/leads/page.tsx                  (11.11 New Enquiries)
  jobs/active/page.tsx                 (11.12 Active Jobs)
  jobs/completed/page.tsx              (11.13 Completed Jobs)
  jobs/[id]/page.tsx                   (11.14 Job Detail)
  quotes/builder/page.tsx              (11.15 Quote Builder)
  quotes/[id]/invoice/page.tsx         (11.16 Invoice Generator)
  payments/page.tsx                    (11.17 Payments Overview)
  payments/[id]/page.tsx               (11.18 Individual Transaction)
  portfolio/page.tsx                   (11.19 Portfolio/Gallery)
  reviews/page.tsx                     (11.20 Reviews Dashboard)
  reviews/[id]/respond/page.tsx        (11.21 Review Respond)
  analytics/page.tsx                   (11.22 Analytics)
  billing/page.tsx                     (11.23 Subscription & Billing)
  boost/page.tsx                       (11.24 Promote/Boost)
  referrals/page.tsx                   (11.25 Referral Programme)

src/components/dashboard/provider/
  ReferenceTracker.tsx                 (shared: 11.5 + 11.6)
  JobList.tsx                          (shared: 11.11 + 11.12 + 11.13)
  QuoteBuilderForm.tsx                 (11.15, with AI assist + localStorage draft)
  QuotePreview.tsx                     (11.15 live preview panel)
  InvoiceGenerator.tsx                 (11.16)
  InvoicePreview.tsx                   (11.16, dynamic import @react-pdf/renderer)
  PayoutsOverview.tsx                  (11.17, includes payout ETA banner)

src/services/provider/
  provider-dashboard-service.ts
  provider-verification-service.ts
  provider-profile-service.ts
  provider-job-service.ts
  provider-quote-service.ts
  provider-invoice-service.ts
  provider-payment-service.ts
  provider-service-area-service.ts
  provider-analytics-service.ts

src/hooks/
  useProviderStats.ts                  (shared React Query hook)

src/app/api/provider/
  quotes/route.ts
  quotes/[id]/send/route.ts
  quotes/[id]/pdf/route.ts             (server PDF, auth-gated)
  quotes/suggest-items/route.ts        (AI line-item suggestions — NEW)
  invoices/route.ts
  invoices/[id]/route.ts
  invoices/[id]/pdf/route.ts           (server PDF, auth-gated)
  invoices/[id]/paid/route.ts

src/app/api/webhooks/
  stripe/route.ts                      (Stripe Connect webhook — NEW)

supabase/
  migrations/20260313_provider_dashboard_tables.sql
  functions/nightly-provider-analytics/index.ts    (NEW)
```

---

*Review completed: 2026-03-15*
*Phase: 16-tradesperson-dashboard*
*Use `/gsd:execute-phase` after completing prerequisite cleanup.*
