# Technology Stack

**Project:** Britestate v3.0 -- UK Property Portal
**Researched:** 2026-03-06
**Updated:** 2026-03-13 (milestone v3.1: Buyer/Renter Dashboard additions)
**Overall Confidence:** HIGH for new additions (npm-verified versions), MEDIUM-HIGH for original stack

---

## Milestone v3.1 Additions: Buyer/Renter Dashboard

> This section covers ONLY the net-new libraries needed for the 22 Buyer/Renter Dashboard pages.
> The base stack (Next.js 16, React 19, Supabase, Recharts, TanStack Query, react-dropzone, etc.)
> is already installed. Do not re-add anything already in package.json.

### New Libraries Required

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `react-day-picker` | `^9.14.0` | Calendar/date-picker for viewing schedules | v9 supports React 19 natively (v8 does not). Shadcn's Calendar component wraps this. Required for viewing scheduling, reschedule flows, and availability display. Verified current via npm. |
| `date-fns` | `^4.1.0` | Date utilities (peer dep of react-day-picker) | react-day-picker v9 uses date-fns v4 for locale and date arithmetic. Also used throughout for formatting tenancy dates, offer expiry, moving timeline. Verified current via npm. |
| `tus-js-client` | `^4.3.1` | Multi-file document upload with progress tracking | Supabase Storage natively implements the TUS resumable upload protocol. tus-js-client v4 is the official TUS client -- provides `onProgress(bytesUploaded, bytesTotal)` callbacks for per-file progress bars. Handles >6MB files (ID scans, proof-of-funds PDFs) reliably with automatic retry. react-dropzone (already installed) handles file selection UI; tus-js-client handles the actual upload. Verified current via npm. |
| `nanoid` | `^5.1.6` | Referral code generation | Generates URL-safe, cryptographically random IDs for referral links. 130-byte zero-dependency library. Server-side only (API route / Server Action). Next.js uses it internally -- already in the node_modules tree, just not declared as a direct dependency. Declare it explicitly so the version is pinned. Verified current via npm. |

### What Does NOT Need Adding

| Capability | Covered By | Reason |
|------------|-----------|--------|
| Mortgage comparison table | `@tanstack/react-table` + shadcn Table (already installed) | Sortable/filterable table for comparing broker rates. No new library. |
| AI match score display (gauge/ring) | `recharts` RadialBarChart (already installed) | Shadcn's radial chart pattern uses Recharts RadialBarChart with `startAngle`/`endAngle` to render a circular progress ring with centered score text. No new library. |
| File drop zone UI | `react-dropzone` (already installed) | Handles drag-and-drop, file type validation, multiple file selection. Pair with tus-js-client for the upload step. |
| Document upload progress bar | Tailwind + React state | Progress percentage from tus-js-client `onProgress` callback rendered with a simple `<div style={{ width: `${pct}%` }}>` div. No progress-bar library needed. |
| Referral link display / copy | shadcn Button + `navigator.clipboard` (built-in browser API) | Copy-to-clipboard is a one-liner with no library. |
| Mortgage amortization math | Custom utility (planned in Phase 5, plan 05-02) | Pure TypeScript, no library. Verified in roadmap. |

### Installation Command

```bash
# From britv3.0/
pnpm add react-day-picker@^9.14.0 date-fns@^4.1.0 tus-js-client@^4.3.1 nanoid@^5.1.6
```

Then scaffold the Shadcn Calendar component (copies component source into your project):

```bash
pnpm dlx shadcn@latest add calendar
```

### Integration Notes

**Calendar (react-day-picker + Shadcn):**
- `pnpm dlx shadcn@latest add calendar` generates `src/components/ui/calendar.tsx` which wraps react-day-picker v9
- Use `mode="single"` for date selection, `mode="range"` for date range pickers, `disabled` prop for unavailable viewing slots
- For viewing schedules: fetch booked slots from Supabase, pass as `disabled` dates to `<Calendar>`
- Pair with Shadcn `<Popover>` for dropdown date-picker pattern (Shadcn docs: Date Picker)

**Document Upload (tus-js-client + react-dropzone):**
- react-dropzone `onDrop` callback receives `File[]` → pass each to a `new tus.Upload(file, { endpoint: supabase_tus_endpoint, ... })`
- Supabase TUS endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`
- Set `Authorization: Bearer <user_token>` and `x-upsert: true` headers
- Track per-file state in React: `Map<filename, { progress: number; status: 'pending' | 'uploading' | 'done' | 'error' }>`
- Documents (ID scans, proof of funds, AIP letters) typically 1–15 MB — TUS chunking handles these well

**AI Match Score (Recharts RadialBarChart):**
- Use shadcn chart wrapper (`src/components/ui/chart.tsx`) with `RadialBarChart`
- Score from 0–100: set `endAngle={score * 3.6}` (360 degrees = 100%)
- Center label via recharts `<Label>` component inside `<PolarRadiusAxis>`
- Color-code by band: green ≥80, amber 50–79, red <50 via CSS custom properties
- No additional library — recharts is already installed

**Referral Code (nanoid):**
- Generate on first dashboard load if no referral code exists: `import { customAlphabet } from 'nanoid'; const gen = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 8);`
- Uppercase alphanumeric avoids I/O/0/1 confusion for human-readable codes
- Store in `user_referrals` table, expose as `/invite/[code]` route
- Server-side only: API route or Server Action — never client-side (prevents enumeration)

**Mortgage Comparison:**
- Use `@tanstack/react-table` (already installed) with shadcn `<DataTable>`
- Columns: lender, product type, initial rate %, APRC %, monthly payment (calculated), max LTV, fee
- Sort by monthly payment by default
- Broker profiles fetched from Supabase `marketplace_providers` filtered by `category = 'mortgage_broker'`
- No third-party rate feed in v3.1 -- display brokers who have added their own products

### Version Compatibility

| Package | Compatible With | Notes |
|---------|----------------|-------|
| `react-day-picker@9.14.0` | `react@19.2.3` | v9 fixed React 19 ref issues at v9.4.3; v9.14.0 is verified safe |
| `react-day-picker@9.14.0` | `date-fns@4.1.0` | v9 requires date-fns v4; v3 is not supported |
| `tus-js-client@4.3.1` | `@supabase/supabase-js@2.x` | Supabase Storage TUS endpoint is stable; headers documented at supabase.com/docs/guides/storage/uploads/resumable-uploads |
| `nanoid@5.x` | `next@16.x` | ESM-only; works in Server Components and API routes. If used in Edge Runtime, import from `nanoid` (not a subpath) |

### What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@uppy/core` + `@uppy/tus` | Uppy is a full upload UI system (300KB+); overkill when react-dropzone + tus-js-client covers the requirement cleanly | `react-dropzone` + `tus-js-client` |
| `react-datepicker` | Different package from react-day-picker; not integrated with shadcn; requires separate styling | `react-day-picker` via `shadcn calendar` |
| `react-day-picker@8.x` | Not compatible with React 19 without `--legacy-peer-deps` hacks; shadcn has migrated to v9 | `react-day-picker@9.x` |
| `date-fns@3.x` | react-day-picker v9 requires date-fns v4; mixing causes type errors | `date-fns@4.x` |
| `uuid` | Heavier than nanoid (more dependencies); less URL-friendly output | `nanoid` |
| Gauge chart libraries (react-gauge-chart, etc.) | Recharts RadialBarChart already installed and sufficient; adding a dedicated gauge library adds bundle weight | Recharts `RadialBarChart` with shadcn chart wrapper |
| React PDF for offer letters | `@react-pdf/renderer` is already installed | Already in package.json |

---

## Original Stack (Full Project)

> The sections below document the full Britestate v3.0 stack as researched on 2026-03-06.
> Most of these are already in package.json. Do not re-add unless explicitly noted.

> **Caveat on versions in the original research:** Core framework versions are VERIFIED from package.json.
> Supporting library versions in the original research are based on training data from that session
> and are marked with `*` where newer releases were expected. Versions in the Milestone v3.1 section
> above have been freshly npm-verified.

---

### Core Framework (VERIFIED -- in scaffold)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.1.6 | Full-stack React framework | VERIFIED in package.json. App Router, Server Components, API routes, ISR. v16 has stable React 19 support, improved caching, Turbopack as default dev bundler | HIGH |
| React | 19.2.3 | UI library | VERIFIED in package.json. Server Components, Actions, use() hook, useOptimistic, useFormStatus -- all critical for a data-heavy portal | HIGH |
| TypeScript | ^5 | Type safety | VERIFIED in package.json. Strict mode essential for 266-table schema with shared types | HIGH |
| Tailwind CSS | ^4 | Utility-first CSS | VERIFIED in package.json. v4 uses CSS-native cascade layers, CSS-first config (no tailwind.config.js), lightning-fast builds | HIGH |
| pnpm | (workspace) | Package manager | VERIFIED -- pnpm-workspace.yaml exists. Faster installs, strict dependency resolution, disk-efficient | HIGH |

### UI Components

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| shadcn/ui | latest CLI | Component primitives | Copy-paste model gives full ownership. Built on Radix for accessibility. v2.0 used this successfully. Use `npx shadcn@latest init` with Tailwind v4 support | MEDIUM |
| Radix UI | (via shadcn) | Accessible primitives | Headless, WAI-ARIA compliant. Dialog, Dropdown, Tabs, Toast -- all needed for dashboard-heavy app | HIGH |
| Lucide React | ^0.460* | Icons | Tree-shakeable, consistent with shadcn. Drop-in replacement for Heroicons with better coverage | MEDIUM |
| class-variance-authority | ^0.7* | Component variants | Type-safe variant management for buttons, cards, badges across 7 role-specific dashboards | MEDIUM |
| tailwind-merge | ^2.6* | Class merging | Prevents Tailwind class conflicts when composing components. Essential with shadcn pattern | MEDIUM |
| clsx | ^2.1* | Conditional classes | Lightweight conditional class joining. Used alongside tailwind-merge | HIGH |

### Backend-as-a-Service: Supabase

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @supabase/supabase-js | ^2.47* | Client SDK | Core Supabase client. Handles auth, DB queries, storage, realtime subscriptions | MEDIUM |
| @supabase/ssr | ^0.5* | Next.js SSR integration | Cookie-based auth for App Router. Replaces deprecated @supabase/auth-helpers-nextjs. Creates server/client Supabase instances correctly | MEDIUM |
| supabase (CLI) | ^1.220* | Local development | Local Supabase stack for development, migrations, type generation | MEDIUM |

#### Supabase at Scale: 266 Tables Strategy

**Schema Organization (prefix-based in public schema):**
```
public (single schema, prefixed tables)
  auth_*       (user profiles, roles, verification)
  prop_*       (properties, media, features, embeddings)
  mkt_*        (providers, RFQs, quotes, bookings)
  txn_*        (offers, documents, timelines)
  msg_*        (conversations, messages, notifications)
  analytics_*  (events, metrics)
  admin_*      (audit logs, moderation, tickets)
```

**RLS Policy Patterns (CRITICAL):**

1. **Store active role in JWT custom claims** -- Use `app_metadata.active_role` so RLS checks avoid table joins entirely:
   ```sql
   -- Fast: reads from JWT, no table lookup
   CREATE POLICY "agents_view_their_listings" ON prop_listings
     FOR SELECT USING (
       auth.jwt() ->> 'active_role' = 'agent'
       AND agent_id = auth.uid()
     );
   ```

2. **Create reusable helper functions** -- With 266 tables, do NOT inline complex logic in every policy:
   ```sql
   CREATE OR REPLACE FUNCTION public.is_role(required_role text)
   RETURNS boolean AS $$
     SELECT (auth.jwt() ->> 'active_role') = required_role;
   $$ LANGUAGE sql SECURITY DEFINER STABLE;

   CREATE OR REPLACE FUNCTION public.is_property_owner(p_id uuid)
   RETURNS boolean AS $$
     SELECT EXISTS (
       SELECT 1 FROM prop_listings WHERE id = p_id AND owner_id = auth.uid()
     );
   $$ LANGUAGE sql SECURITY DEFINER STABLE;
   ```

3. **Index every column used in RLS WHERE clauses** -- With 266 tables this is non-negotiable for performance. RLS adds a filter to every query; unindexed columns cause full table scans

4. **Use SECURITY DEFINER for cross-table lookups** -- Avoids recursive RLS checks when a policy on table A needs to check table B

5. **Materialized views for dashboards** -- Dashboard aggregations (property count by status, revenue totals, booking stats) should use materialized views refreshed on a schedule, bypassing RLS entirely for analytics queries

6. **Type generation** -- Run `supabase gen types typescript --local > src/types/database.types.ts` after every migration. With 266 tables this file will be ~15K+ lines. Consider a post-generation script to split by domain prefix

**Connection Management:**
- Transaction-mode pooling via Supabase built-in Supavisor
- Single Supabase client per request in Server Components
- Redis caching for frequently accessed data (user profiles, property counts)
- For 100K+ MAU target: Supabase Pro plan minimum, likely needs dedicated compute add-on
- Enable pg_stat_statements to monitor slow queries caused by RLS overhead

### Supabase + Next.js 16 Auth Pattern

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Payments: Stripe Connect

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| stripe | ^17.0* | Server-side SDK | Handles Connect account creation, payment intents, transfers, webhooks | MEDIUM |
| @stripe/stripe-js | ^4.9* | Client-side loader | Loads Stripe.js safely, provides loadStripe() for Elements | MEDIUM |
| @stripe/react-stripe-js | ^3.1* | React bindings | Elements, PaymentElement, ConnectComponentsProvider for embedded onboarding | MEDIUM |

#### Stripe Connect Marketplace Pattern

**Account Type: Standard Connect** (confirmed from v2.0 ADR-007)

Correct for Britestate because:
- Service providers manage their own Stripe dashboard
- Lower platform liability (Stripe handles provider KYC)
- Providers set their own payout schedules
- 2.5% platform fee via application_fee_amount on PaymentIntents

**Key Implementation Patterns:**

1. **Direct Charges model** -- Charge on provider account, take application_fee_amount:
   ```typescript
   const paymentIntent = await stripe.paymentIntents.create({
     amount: 10000, // GBP pence
     currency: 'gbp',
     application_fee_amount: 250, // 2.5%
     transfer_data: { destination: connectedAccountId },
   });
   ```

2. **Webhook-driven architecture** -- Never trust client-side for payment state:
   - `account.updated` -- Track onboarding progress
   - `payment_intent.succeeded` -- Fulfill service booking
   - `charge.refunded` -- Handle refund flow
   - `payout.failed` -- Alert provider
   - Use `stripe.webhooks.constructEvent()` with raw body (Next.js API route needs raw body parsing)

3. **Deferred onboarding** -- Providers visible in marketplace before completing KYC. Do not gate marketplace visibility on payment readiness. Gate only on accepting payments

4. **Onboarding with Connect Embedded Components** -- Use ConnectAccountOnboarding for in-app onboarding instead of redirecting to Stripe hosted page

5. **Escrow pattern for services** -- Create PaymentIntent when quote accepted, capture when service confirmed complete:
   ```typescript
   // Authorize on booking
   const paymentIntent = await stripe.paymentIntents.create({
     amount: 50000,
     currency: 'gbp',
     capture_method: 'manual', // authorize only
     application_fee_amount: 1250,
     transfer_data: { destination: providerId },
   });

   // Capture on completion (within 7 days)
   await stripe.paymentIntents.capture(paymentIntent.id);
   ```

6. **Idempotency keys** -- Prevent duplicate charges on network retries:
   ```typescript
   await stripe.paymentIntents.create(params, {
     idempotencyKey: `booking_${bookingId}`,
   });
   ```

### Maps: MapLibre GL JS + MapTiler

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| maplibre-gl | ^4.7* | Vector map renderer | Open-source fork of Mapbox GL. No token lock-in, full WebGL rendering, clustering, custom layers | MEDIUM |
| react-map-gl | ^7.1* | React wrapper for MapLibre | Uber's maintained React bindings. Works with MapLibre via mapLib prop. Declarative map components | MEDIUM |
| @maptiler/sdk | ^2.3* | MapTiler API client | Geocoding, tile URLs, static maps. UK-specific data via OS data integration | MEDIUM |

#### MapLibre + Next.js Integration Pattern

**Critical: MapLibre is client-only.** It requires WebGL and the DOM. In Next.js App Router:

1. **Dynamic import with SSR disabled:**
   ```typescript
   // src/components/properties/PropertyMap.tsx
   'use client';
   import dynamic from 'next/dynamic';
   const MapComponent = dynamic(
     () => import('./MapInner'),
     { ssr: false, loading: () => <MapSkeleton /> }
   );
   ```

2. **CSS import in layout** (not in component -- avoids duplication):
   ```typescript
   // src/app/(main)/search/layout.tsx
   import 'maplibre-gl/dist/maplibre-gl.css';
   ```

3. **react-map-gl with MapLibre:**
   ```typescript
   import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';

   <Map
     mapLib={import('maplibre-gl')}
     mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`}
     initialViewState={{ longitude: -1.5, latitude: 53.0, zoom: 6 }}
   >
     <NavigationControl position="top-right" />
     {properties.map(p => <Marker key={p.id} longitude={p.lng} latitude={p.lat} />)}
   </Map>
   ```

4. **Clustering** -- Use react-map-gl built-in `<Source type="geojson" cluster>` with supercluster for property clustering at scale

5. **PostGIS integration** -- Store property locations as `geography(Point, 4326)` in Supabase:
   ```sql
   -- Radius search
   SELECT * FROM prop_listings
   WHERE ST_DWithin(location, ST_MakePoint(-0.1278, 51.5074)::geography, 5000); -- 5km

   -- Bounding box for map viewport
   SELECT * FROM prop_listings
   WHERE location && ST_MakeEnvelope(-0.5, 51.3, 0.2, 51.7, 4326);
   ```

### AI: Anthropic Claude

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ai (Vercel AI SDK) | ^4.1* | Unified AI interface | streamText(), generateObject() with Zod schemas. Provider-agnostic abstraction. Built for Next.js App Router | MEDIUM |
| @ai-sdk/anthropic | ^1.1* | Anthropic provider | Vercel AI SDK provider for Claude. Handles streaming, structured output | MEDIUM |
| @anthropic-ai/sdk | ^0.37* | Direct Claude client | Official TypeScript SDK. Use for server-side batch operations, tool use, complex prompting | MEDIUM |

#### AI Architecture: Two-SDK Approach

**Use Vercel AI SDK for user-facing features:**
- useChat() and useCompletion() hooks for streaming chat UI
- generateObject() with Zod for structured property recommendations
- streamText() for AI-generated property descriptions
- Built-in token counting, rate limiting hooks

**Use direct @anthropic-ai/sdk for backend operations:**
- Batch AVM (Automated Valuation Model) calculations
- Embedding generation pipelines
- Complex multi-turn tool use (property analysis agents)
- Background AI tasks in Edge Functions

**Vector Storage:**
- pgvector in Supabase for embedding similarity search
- v2.0 used @xenova/transformers for local embeddings -- for v3.0, evaluate whether Supabase built-in embedding functions or OpenAI embeddings (cheaper for batch) are more appropriate. This needs phase-specific research during Epic 6

### Data Fetching and State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @tanstack/react-query | ^5.62* | Server state | Caching, deduplication, background refetch, optimistic updates. v2.0 used this. Essential for property search result caching and infinite scroll | MEDIUM |
| zustand | ^5.0* | Client state | Lightweight store for UI state (sidebar open, selected properties, comparison list, active role). NOT for server data -- that is TanStack Query | MEDIUM |
| nuqs | ^2.2* | URL state | Type-safe URL search params for Next.js App Router. Property search filters (price, bedrooms, area, property type) persisted in URL for shareability | MEDIUM |

### Forms and Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| react-hook-form | ^7.54* | Form management | Uncontrolled forms = fewer re-renders. Critical for complex multi-step forms (property listing: 15+ fields, provider onboarding, RFQ) | MEDIUM |
| zod | ^3.24* | Schema validation | Runtime type validation. Shared schemas between client forms, Server Actions, and API routes. Single source of truth for data shape | HIGH |
| @hookform/resolvers | ^3.9* | Form-schema bridge | Connects Zod schemas to react-hook-form. Define once, validate everywhere | MEDIUM |

### Email

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| resend | ^4.1* | Email API | Simple API, React Email support, good deliverability. UK sending supported | MEDIUM |
| @react-email/components | ^0.0.28* | Email templates | JSX email templates. Consistent rendering across clients. Type-safe props for transactional emails (booking confirmations, RFQ notifications) | MEDIUM |

### Caching and Rate Limiting

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @upstash/redis | ^1.34* | Redis client | Serverless Redis via HTTP. No connection management in serverless environment (Next.js API routes/Edge). Cache property counts, user sessions, search results | MEDIUM |
| @upstash/ratelimit | ^2.0* | Rate limiting | Token bucket / sliding window. Plug into Next.js middleware for API protection. Critical for AI endpoints (cost control) and auth endpoints (brute force prevention) | MEDIUM |

### Monitoring and Analytics

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @sentry/nextjs | ^8.40* | Error tracking | App Router support, server/client error capture, performance monitoring, session replay | MEDIUM |
| posthog-js | ^1.190* | Product analytics | Feature flags, session recording, event tracking, funnels. GDPR-friendly with EU cloud option | MEDIUM |
| posthog-node | ^4.3* | Server-side analytics | Server event capture for API routes. Matches client-side tracking for full-funnel analysis | MEDIUM |

### Background Jobs

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Edge Functions | (platform) | Webhook processing | Process Stripe webhooks, send emails, AI batch jobs. Deno-based, integrated with Supabase auth | MEDIUM |
| Inngest | ^3.0* | Complex workflows | Multi-step workflows (provider verification pipeline, transaction state machine). Consider if Edge Functions become insufficient for complex orchestration | LOW |

> Note: Inngest is a recommendation from v2.0 patterns. Evaluate whether Supabase Edge Functions alone can handle the workflow complexity. If yes, skip Inngest to reduce stack complexity.

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @playwright/test | ^1.49* | E2E testing | Cross-browser, auto-waiting, network mocking, visual comparison. v2.0 had 136 E2E test files with Playwright | MEDIUM |
| vitest | ^2.1* | Unit/integration | Vite-native, ESM-first, Jest-compatible API. Faster than Jest for TypeScript. v2.0 used this | MEDIUM |
| @testing-library/react | ^16.1* | Component testing | DOM-based testing, accessible queries. Standard React testing approach | MEDIUM |
| msw | ^2.6* | API mocking | Service worker-based mocking. Mock Supabase, Stripe, Claude API calls in tests without hitting real services | MEDIUM |
| happy-dom | ^15.0* | Test environment | Lightweight DOM implementation for Vitest. Faster than jsdom | MEDIUM |

#### Testing Strategy for 266-Table, 7-Role Portal

**E2E (Playwright) -- Critical User Journeys:**
- Each epic gets its own test directory: `tests/e2e/epic-1/`, `tests/e2e/epic-2/`
- Auth fixtures per role (pre-authenticated states stored as JSON):
  ```typescript
  // tests/fixtures/auth.ts
  export const test = base.extend<{ homebuyer: Page; agent: Page }>({
    homebuyer: async ({ browser }, use) => {
      const ctx = await browser.newContext({ storageState: 'tests/.auth/homebuyer.json' });
      await use(await ctx.newPage());
    },
  });
  ```
- `test.describe.configure({ mode: 'serial' })` for dependent flows (search -> view -> contact agent)
- Parallel test sharding by role for CI speed
- Mock Stripe with test mode keys (sk_test_), mock Claude with MSW

**Unit (Vitest) -- Business Logic:**
- Service layer: price calculations, filter logic, RFQ matching algorithms
- Zod schema validation edge cases
- Utility functions: format GBP currency, date formatting, postcode validation
- Target: >85% coverage on /services/ and /utils/

**Integration -- API Routes:**
- Test Next.js API routes with Supabase local instance (`supabase start`)
- Verify RLS policies with different user role JWTs
- Stripe webhook signature validation with test secrets

**Test Execution Tiers (CI pipeline):**
1. Type check + lint (fastest, every push)
2. Unit tests with Vitest (fast, every push)
3. Integration tests (medium, every PR)
4. E2E with Playwright (slow, every PR merge to main)

### File Upload and Media

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Storage | (via SDK) | File storage | Integrated with auth/RLS. S3-compatible. Image transformations built-in. Signed URLs for private documents | HIGH |
| sharp | ^0.33* | Image processing | Server-side image optimization. Resize property photos on upload. Next.js uses this internally for next/image | MEDIUM |

### Date and Formatting

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| date-fns | ^4.1.0 | Date utilities | Tree-shakeable, immutable. Format tenancy dates, mortgage terms, listing ages. Also required by react-day-picker v9. Version npm-verified 2026-03-13 | HIGH |
| Intl API | (built-in) | Currency/number | `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })` for all price display. No library needed | HIGH |

### PWA

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| serwist | ^9.0* | PWA support | Service worker generation, offline support, install prompts. Maintained fork of next-pwa for App Router | LOW |

> PWA library ecosystem was fragmented in early 2025. next-pwa was unmaintained; serwist emerged as community fork. VERIFY current status before adopting. This is a Phase 9 concern (Epic 9: Mobile/PWA).

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| State (server) | TanStack Query v5 | SWR | TQ has better mutations, optimistic updates, infinite queries for property pagination |
| State (client) | Zustand | Redux, Jotai | Redux is overkill; Jotai is atomic (good for forms, not dashboards); Zustand is simplest for UI state |
| Forms | react-hook-form | Formik | RHF has fewer re-renders (uncontrolled), better TS support, smaller bundle |
| E2E Testing | Playwright | Cypress | Playwright: better App Router support, multi-browser, no dashboard paywall, faster parallel execution |
| Unit Testing | Vitest | Jest | Vitest is ESM-native, faster with Vite, same API as Jest |
| CSS | Tailwind v4 | CSS Modules, Emotion | Already scaffolded; v4 is faster; utility-first scales across 319+ pages |
| Maps | MapLibre + MapTiler | Google Maps, Mapbox | 10x cheaper at scale; open-source renderer; v2.0 validated this |
| Email | Resend | SendGrid, Postmark | Better DX with React Email; simpler API; good for startup scale |
| AI SDK | Vercel AI SDK + direct | Direct Anthropic only | Vercel AI SDK provides streaming hooks for Next.js; use both |
| URL State | nuqs | manual searchParams | nuqs provides type-safe, serialized URL params with transitions support |
| Validation | Zod | Yup, io-ts | Zod has best TS inference; first-class in AI SDK, react-hook-form ecosystem |
| ORM | Supabase client | Prisma, Drizzle | Supabase client handles DB access with RLS; adding an ORM creates a parallel data layer and bypasses RLS |
| Auth | Supabase Auth | NextAuth/Auth.js | Supabase Auth is the auth layer -- adding a second creates confusion |
| API layer | Server Actions + API routes | tRPC | Overkill with Supabase -- Server Actions + Supabase client are sufficient |
| File upload (document) | react-dropzone + tus-js-client | Uppy full suite | Uppy is 300KB+ and includes UI chrome that fights with custom design; the combination of react-dropzone + tus-js-client gives the same upload capability at a fraction of the weight |
| Calendar | react-day-picker v9 via shadcn | react-datepicker | react-datepicker is not integrated with shadcn UI and requires separate styling; react-day-picker v9 is the shadcn-native choice |

---

## Installation

> **For milestone v3.1 (Buyer/Renter Dashboard), run only this:**

```bash
# From britv3.0/
pnpm add react-day-picker@^9.14.0 date-fns@^4.1.0 tus-js-client@^4.3.1 nanoid@^5.1.6

# Scaffold Shadcn Calendar component
pnpm dlx shadcn@latest add calendar
```

> **Full original stack installation (for reference -- most already installed):**

```bash
# Core (already installed)
# next@16.1.6, react@19.2.3, react-dom@19.2.3, tailwindcss@4, typescript@5

# Supabase
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add -D supabase

# UI Components
pnpm dlx shadcn@latest init
pnpm add class-variance-authority tailwind-merge clsx lucide-react

# Data Fetching and State
pnpm add @tanstack/react-query zustand nuqs

# Forms and Validation
pnpm add react-hook-form @hookform/resolvers zod

# Payments (Stripe Connect)
pnpm add stripe @stripe/stripe-js @stripe/react-stripe-js

# Maps
pnpm add maplibre-gl react-map-gl @maptiler/sdk

# AI
pnpm add ai @ai-sdk/anthropic @anthropic-ai/sdk

# Email
pnpm add resend @react-email/components

# Caching and Rate Limiting
pnpm add @upstash/redis @upstash/ratelimit

# Monitoring
pnpm add @sentry/nextjs posthog-js posthog-node

# Utilities
pnpm add date-fns sharp

# Testing (dev dependencies)
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @playwright/test msw happy-dom
```

---

## Architecture-Relevant Stack Notes

### Next.js 16 Specific Patterns

1. **Turbopack is default in dev** -- No --turbopack flag needed. Significantly faster HMR for a 319-page app
2. **Server Actions** -- Use for mutations (create property listing, submit RFQ, update profile). Type-safe with Zod validation
3. **Parallel Routes** -- Use for dashboard layouts where sidebar + main content load independently
4. **Intercepting Routes** -- Use for property quick-view modals (click property card -> modal overlay, direct URL -> full page)
5. **Route Groups** -- `(auth)`, `(main)`, `(protected)`, `(dashboard)` for layout separation without URL impact
6. **Metadata API** -- Dynamic `generateMetadata()` for property pages (title, description, OG images for social sharing)
7. **Route Handlers** -- `/app/api/webhooks/stripe/route.ts` for Stripe webhooks with raw body parsing

### React 19 Specific Patterns

1. **use() hook** -- Read promises and context in render. Use for Supabase data loading in Server Components
2. **useOptimistic()** -- Optimistic UI for messaging, bookmarks, favorites, property saves
3. **useFormStatus()** -- Pending states for form submissions (property listing, quote requests)
4. **useActionState()** -- Server Action state management with progressive enhancement
5. **Server Components are default** -- Only add `'use client'` when needed (interactivity, browser APIs, map rendering)
6. **ref as prop** -- No more forwardRef boilerplate for component composition

---

## Sources

| Source | What It Informed | Confidence |
|--------|-----------------|------------|
| `npm view react-day-picker version` | v9.14.0 confirmed current | HIGH |
| `npm view date-fns version` | v4.1.0 confirmed current | HIGH |
| `npm view tus-js-client version` | v4.3.1 confirmed current | HIGH |
| `npm view nanoid version` | v5.1.6 confirmed current | HIGH |
| daypicker.dev | v9 React 19 compatibility, feature set | HIGH |
| supabase.com/docs/guides/storage/uploads/resumable-uploads | TUS endpoint, tus-js-client integration pattern | HIGH |
| github.com/gpbl/react-day-picker issues #2665 | React 19 compat fixed at v9.4.3 | HIGH |
| ui.shadcn.com/charts/radial | RadialBarChart score display pattern using existing Recharts | HIGH |
| Scaffolded package.json (britv3.0/) | Full list of already-installed packages | HIGH |
| v2.0 Project Memory | Architecture decisions, testing strategy | HIGH |

---
*Original stack research: 2026-03-06*
*Milestone v3.1 additions researched: 2026-03-13*
