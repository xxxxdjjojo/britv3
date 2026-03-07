# Phase 4: Marketplace - Research

**Researched:** 2026-03-07
**Domain:** Service provider marketplace (RFQ pipeline, booking lifecycle, reviews, provider search)
**Confidence:** HIGH

## Summary

Phase 4 builds a complete service provider marketplace with five interconnected subsystems: provider profiles/verification, RFQ-to-quote pipeline, booking lifecycle with state machine, multi-dimensional review system with rule-based moderation, and marketplace search. The epic spec (epic4final.md) is exceptionally detailed -- it provides complete SQL schemas, TypeScript implementations, API endpoint definitions, and component lists. This is a data-heavy phase with 13 new database tables, 6 new enums, 6 triggers, multiple RLS policies, and a geospatial search function.

The key architectural decisions are already locked by the amended epic spec: Inngest for async jobs (not BullMQ), postcodes.io for geocoding (not Mapbox), file-type for document validation (not VirusTotal), Supabase Storage for files (not R2), rule-based sentiment analysis (not Claude API), and incremental rating stats table (not materialized views). The implementation should follow these decisions exactly -- they were chosen for cost optimization (approx. 50/mo vs 915/mo at 100K users).

**Primary recommendation:** Structure implementation in 4 waves: (1) database migration + types, (2) provider profiles/documents + marketplace search, (3) RFQ/quote/booking pipeline with Inngest, (4) review system with moderation. Each wave builds on the previous and can be independently tested.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MKT-01 | Provider extended profile (business info, services, area, pricing, qualifications) | Epic spec S01: 16 service categories, postcodes + radius coverage, indicative pricing, slug generation. Database: `service_provider_details` table |
| MKT-02 | Provider document upload with file-type validation | Epic spec S02: `file-type` library for magic bytes, Supabase Storage, EXIF stripping, signed URLs. Database: `provider_documents` table |
| MKT-03 | RFQ creation with category, postcodes.io geocoding, budget, urgency | Epic spec S03: postcodes.io free API (15K/hr limit), provider matching algorithm (category 50pts, postcode 30pts, proximity 20pts, rating 10pts), max 10 matches |
| MKT-04 | System matches RFQ to max 10 providers by category, postcode overlap, proximity | Epic spec S03: `get_matching_providers_for_rfq` RPC function, scored matching, Inngest async notification dispatch |
| MKT-05 | Provider responds with itemized quote with versioning | Epic spec S04: JSONB line items, auto-generated quote numbers (QT-YYYYMMDD-XXXXX), duplicate prevention, verified-only |
| MKT-06 | User can compare quotes side-by-side | Epic spec S05: Up to 3 quotes comparison, QuoteComparison component |
| MKT-07 | User can create and manage bookings with conflict detection | Epic spec S06: Date range overlap prevention, `provider_availability` table, `booking_state_transitions` lookup |
| MKT-08 | Booking state machine (pending -> confirmed -> in_progress -> completed -> disputed) | Epic spec S06: 9 valid transitions, role-based permissions, audit trail in `booking_status_history`, optimistic locking |
| MKT-09 | Provider can manage availability calendar | Epic spec S06: `provider_availability` table with unavailable date ranges, conflict detection query |
| MKT-10 | User can submit multi-dimensional review with ratings | Epic spec S08: 5 dimensions (overall, punctuality, quality, value, professionalism), one per completed booking, UNIQUE constraint |
| MKT-11 | Rule-based review spam/sentiment detection (no AI) | Epic spec S08+S09: keyword scorer with intensifiers, spam indicators (contact info, links, ALL CAPS), authenticity score via DB trigger |
| MKT-12 | Provider can respond to reviews; helpfulness voting | Epic spec S10+S11: One response per review, thumbs up/down with UNIQUE(review_id, user_id), `review_helpfulness` table |
| MKT-13 | User can search and browse providers by category and location | Epic spec S12: `search_providers()` SQL function with PostGIS, GiST/GIN indexes, tsvector full-text search, < 200ms P95 |
| MKT-14 | Async job processing via Inngest (replaces BullMQ) | Inngest v4 with Next.js App Router, `/api/inngest` route handler, step functions for delayed email fallback |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, API routes | Already installed |
| @supabase/supabase-js | ^2.98.0 | Database, Storage, Auth | Already installed |
| @supabase/ssr | ^0.9.0 | Server-side Supabase client | Already installed |
| zod | ^4.3.6 | Form/API validation | Already installed |
| react-hook-form | ^7.71.2 | Form state management | Already installed |
| @hookform/resolvers | ^5.2.2 | Zod resolver for RHF | Already installed |
| Shadcn UI components | various | Cards, dialogs, badges, tabs, etc. | Already installed |
| lucide-react | ^0.577.0 | Icons | Already installed |

### New Dependencies
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| inngest | ^4.x | Async job processing, delayed notifications | Serverless-native, no VPS, free tier 50K executions/mo |
| file-type | ^21.x | Magic bytes file validation | ESM, reads actual file bytes not extensions, detects PDF/JPEG/PNG/WebP |

### Supabase Extensions (Database)
| Extension | Purpose | Status |
|-----------|---------|--------|
| uuid-ossp | UUID generation | Already enabled (Phase 1) |
| postgis | Geospatial queries, ST_Distance, ST_DWithin | Needed (may exist from Phase 2) |
| pg_trgm | Fuzzy text search | New for Phase 4 |
| btree_gin | Multi-column GIN indexes | New for Phase 4 |

### External APIs (No SDK Needed)
| API | Purpose | Auth | Rate Limit |
|-----|---------|------|------------|
| postcodes.io | UK postcode geocoding (lat/lng) | None (free, open) | 15K requests/hour |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inngest | BullMQ + ioredis | Requires separate VPS, Redis instance, more ops overhead |
| file-type | magic-bytes.js | file-type is more mature, wider format support, actively maintained by sindresorhus |
| postcodes.io | Mapbox/Google Geocoding | Paid APIs, unnecessary for UK-only postcode lookup |
| Rule-based sentiment | Claude API | 400/mo vs 0/mo, overkill for review sentiment |

**Installation:**
```bash
cd britv3.0 && pnpm add inngest file-type
```

**Environment variables (new):**
```bash
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
# INNGEST_DEV=1  # For local development with v4
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (main)/marketplace/
│   │   ├── page.tsx                    # Provider search page
│   │   └── [slug]/page.tsx             # Provider public profile
│   ├── (protected)/dashboard/
│   │   ├── rfqs/
│   │   │   ├── page.tsx                # My RFQs list
│   │   │   ├── create/page.tsx         # Create RFQ form
│   │   │   └── [id]/page.tsx           # RFQ detail with quotes
│   │   ├── bookings/
│   │   │   ├── page.tsx                # Bookings list
│   │   │   └── [id]/page.tsx           # Booking detail + timeline
│   │   ├── provider/
│   │   │   ├── profile/page.tsx        # Provider profile editor
│   │   │   ├── documents/page.tsx      # Document upload/status
│   │   │   ├── quotes/page.tsx         # Provider's quotes
│   │   │   └── availability/page.tsx   # Availability calendar
│   │   └── reviews/page.tsx            # My reviews
│   ├── (admin)/admin/
│   │   └── moderation/page.tsx         # Review moderation queue
│   └── api/
│       ├── inngest/route.ts            # Inngest serve endpoint
│       ├── providers/
│       │   ├── search/route.ts         # Provider search
│       │   ├── [slug]/route.ts         # Provider profile
│       │   └── documents/upload/route.ts
│       ├── rfq/
│       │   ├── create/route.ts
│       │   ├── [id]/route.ts
│       │   └── list/route.ts
│       ├── quotes/
│       │   ├── create/route.ts
│       │   ├── [id]/route.ts
│       │   └── [id]/accept/route.ts
│       ├── bookings/
│       │   ├── create/route.ts
│       │   ├── list/route.ts
│       │   ├── [id]/route.ts
│       │   └── [id]/status/route.ts
│       └── reviews/
│           ├── create/route.ts
│           ├── list/route.ts
│           ├── [id]/helpful/route.ts
│           ├── [id]/flag/route.ts
│           ├── [id]/respond/route.ts
│           └── moderation/[id]/route.ts
├── components/
│   ├── marketplace/
│   │   ├── SearchFilters.tsx
│   │   ├── ProviderCard.tsx
│   │   ├── RFQCreateForm.tsx
│   │   ├── QuoteCreateForm.tsx
│   │   └── QuoteComparison.tsx
│   ├── bookings/
│   │   ├── BookingDashboard.tsx
│   │   ├── BookingTimeline.tsx
│   │   └── BookingStatusBadge.tsx
│   ├── reviews/
│   │   ├── ReviewForm.tsx
│   │   ├── ReviewsList.tsx
│   │   ├── RatingStars.tsx
│   │   └── RatingDistribution.tsx
│   ├── provider/
│   │   ├── DocumentUpload.tsx
│   │   ├── AvailabilityCalendar.tsx
│   │   └── ProviderProfileForm.tsx
│   └── admin/
│       └── ModerationQueue.tsx
├── services/
│   ├── marketplace/
│   │   ├── provider-service.ts
│   │   ├── rfq-service.ts
│   │   ├── quote-service.ts
│   │   ├── booking-service.ts
│   │   ├── review-service.ts
│   │   └── moderation-service.ts
│   └── geocoding/
│       └── postcodes-io.ts
├── inngest/
│   ├── client.ts                       # Inngest client instance
│   └── functions/
│       ├── rfq-notify-providers.ts
│       ├── email-fallback.ts
│       └── review-moderation.ts
├── lib/
│   ├── marketplace/
│   │   ├── sentiment-analyzer.ts       # Rule-based keyword scorer
│   │   ├── spam-detector.ts            # Contact info, promo, link detection
│   │   ├── booking-state-machine.ts    # Valid transitions, role checks
│   │   └── file-validator.ts           # file-type magic bytes validation
│   └── validators/
│       └── marketplace-schemas.ts      # Zod schemas for all marketplace entities
└── types/
    └── marketplace.ts                  # All marketplace TypeScript types
```

### Pattern 1: Booking State Machine
**What:** Enforce valid state transitions with role-based permissions
**When to use:** Any entity with a lifecycle (bookings, RFQs, quotes)
**Example:**
```typescript
// Source: epic4final.md Section 5, E04-S06
type BookingStatus = "pending_confirmation" | "confirmed" | "in_progress" | "completed" | "cancelled" | "disputed";
type TransitionActor = "user" | "provider" | "system";

const VALID_TRANSITIONS: ReadonlyArray<{
  from: BookingStatus;
  to: BookingStatus;
  allowed_by: TransitionActor[];
  requires_reason: boolean;
}> = [
  { from: "pending_confirmation", to: "confirmed", allowed_by: ["provider"], requires_reason: false },
  { from: "pending_confirmation", to: "cancelled", allowed_by: ["user", "provider"], requires_reason: true },
  { from: "confirmed", to: "in_progress", allowed_by: ["provider"], requires_reason: false },
  { from: "confirmed", to: "cancelled", allowed_by: ["user", "provider"], requires_reason: true },
  { from: "in_progress", to: "completed", allowed_by: ["provider"], requires_reason: false },
  { from: "in_progress", to: "cancelled", allowed_by: ["provider"], requires_reason: true },
  { from: "completed", to: "disputed", allowed_by: ["user"], requires_reason: true },
  { from: "cancelled", to: "confirmed", allowed_by: ["provider"], requires_reason: false },
  { from: "disputed", to: "completed", allowed_by: ["system"], requires_reason: false },
];
```

### Pattern 2: Incremental Stats Update (Not Materialized View)
**What:** Update a regular stats table via trigger on each approved review, with nightly pg_cron reconciliation
**When to use:** Aggregated statistics that need to be read-fast but don't need real-time consistency
**Why:** Avoids full-table-scan REFRESH MATERIALIZED VIEW on every review event

### Pattern 3: In-App First, Email Fallback
**What:** Send in-app notification immediately, then use Inngest step.sleep("1h") to check if unread before sending email
**When to use:** All non-critical marketplace notifications
**Why:** 70-80% email cost reduction vs immediate email for everything

### Pattern 4: RPC Functions for Complex Operations
**What:** Use Supabase RPC (database functions) for operations requiring atomicity or complex queries
**When to use:** Booking status transitions (validate + update + log in one transaction), provider search, quote acceptance
**Why:** Ensures database-level constraints, avoids race conditions, single round trip

### Anti-Patterns to Avoid
- **Client-side state machine validation only:** Always validate transitions server-side via RPC. Client checks are UX hints, not security.
- **Trusting client MIME types:** Use file-type magic bytes validation. Client-reported MIME types are trivially spoofable.
- **Materialized views for per-event aggregations:** Use incremental counter updates. MV refresh is a full table scan.
- **Sending all notifications as email:** In-app first, email only for critical events or unread fallback.
- **Building geocoding yourself:** Use postcodes.io. It's free, UK-specific, and handles all edge cases.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File type detection | Extension checking or client MIME | `file-type` library (magic bytes) | Extensions are unreliable, MIME types spoofable, magic bytes are definitive |
| Async job queue | Custom polling, setTimeout chains | Inngest step functions | Built-in retries, sleep/delay, durable execution, observability |
| UK postcode geocoding | Google/Mapbox API calls, postcode databases | postcodes.io free API | Free, no API key, UK-specific, 15K/hr, ONS data |
| Image resizing | Sharp on serverless (50MB cold starts) | Supabase Storage image transforms | Zero server-side processing, transform at URL level |
| Sentiment analysis | Claude API per review | Rule-based keyword scorer | 0/mo vs 400/mo, <1ms vs 500ms, 90%+ accuracy for reviews |
| Review spam detection | AI/ML classifiers | Rule-based pattern matching | Contact info regex, link density, ALL CAPS ratio, repeated chars |
| Rating aggregation | Materialized view with REFRESH | Incremental counter table + pg_cron nightly reconciliation | No full-table scan per event |

**Key insight:** The epic spec explicitly eliminates 9 infrastructure dependencies. Every "don't build" item here has a specific cost-optimized alternative chosen in the spec. Deviating from these choices adds cost without proportional benefit.

## Common Pitfalls

### Pitfall 1: file-type ESM Compatibility
**What goes wrong:** `file-type` v19+ is ESM-only. Importing it with `require()` fails.
**Why it happens:** Next.js can handle ESM in App Router, but some configurations or test environments may not.
**How to avoid:** Use dynamic `import()` in API route handlers. Next.js App Router API routes support ESM natively. For Vitest, the config already uses ESM (`vitest.config.mts`).
**Warning signs:** `ERR_REQUIRE_ESM` errors during build or test.

### Pitfall 2: Quote Acceptance Race Condition
**What goes wrong:** Two users accept different quotes for the same RFQ simultaneously, both succeed.
**Why it happens:** Application-level checks without database-level enforcement.
**How to avoid:** Use a partial unique index: `CREATE UNIQUE INDEX ON quotes(service_request_id) WHERE status = 'accepted'`. This makes it impossible to have two accepted quotes per RFQ at the database level.
**Warning signs:** Multiple accepted quotes per RFQ in test data.

### Pitfall 3: PostGIS Not Enabled
**What goes wrong:** ST_Distance, ST_DWithin, geography columns fail with "function does not exist."
**Why it happens:** PostGIS extension not enabled in Supabase project.
**How to avoid:** Add `CREATE EXTENSION IF NOT EXISTS postgis;` at the top of the migration. Verify via Supabase Dashboard > Database > Extensions.
**Warning signs:** Migration fails on geography column type or spatial function calls.

### Pitfall 4: Inngest Serve Endpoint Missing
**What goes wrong:** Inngest functions never fire. Events are sent but nothing happens.
**Why it happens:** The `/api/inngest` route handler is not set up or not importing all functions.
**How to avoid:** Create `src/app/api/inngest/route.ts` with the serve handler. Register ALL Inngest functions in the functions array. In dev, run `npx inngest-cli@latest dev` alongside `pnpm dev`.
**Warning signs:** Inngest Dev Server at localhost:8288 shows no functions registered.

### Pitfall 5: RLS Policy Gaps on Marketplace Tables
**What goes wrong:** Users can read/write data they shouldn't (other users' quotes, bookings, documents).
**Why it happens:** RLS policies written too permissively or missing for some tables.
**How to avoid:** Follow the epic spec's RLS policy definitions exactly. Test each policy: can user X read user Y's quotes? Can non-moderator access moderation queue? Use Supabase's `auth.uid()` in all policies.
**Warning signs:** Supabase queries returning data for wrong users in dev testing.

### Pitfall 6: Booking Date Conflict Detection Failure
**What goes wrong:** Provider gets double-booked for overlapping dates.
**Why it happens:** Conflict check done in application code without proper indexing or transaction isolation.
**How to avoid:** Use database-level conflict detection with an exclusion constraint or a check in the booking creation RPC function. Use `daterange` overlap operator `&&` with `FOR UPDATE` row locks.
**Warning signs:** Overlapping confirmed bookings for same provider in test data.

### Pitfall 7: Supabase Storage Bucket Not Created
**What goes wrong:** Document uploads fail with "Bucket not found."
**Why it happens:** Storage buckets must be created via Supabase Dashboard or migration, not just referenced in code.
**How to avoid:** Create the `provider-docs` bucket via Supabase management API or Dashboard before implementing upload. Set appropriate bucket policies (private, max file size).
**Warning signs:** 404 errors on storage upload calls.

## Code Examples

### Postcodes.io Geocoding Service
```typescript
// Source: epic4final.md Section 5.4
// services/geocoding/postcodes-io.ts

interface PostcodeResult {
  latitude: number;
  longitude: number;
  admin_district: string;
  region: string;
}

export async function geocodePostcode(postcode: string): Promise<PostcodeResult | null> {
  const response = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`
  );
  if (!response.ok) return null;
  const data = await response.json();
  if (data.status !== 200 || !data.result) return null;
  return {
    latitude: data.result.latitude,
    longitude: data.result.longitude,
    admin_district: data.result.admin_district,
    region: data.result.region,
  };
}

// Bulk geocoding (up to 100 postcodes per request)
export async function geocodePostcodes(postcodes: string[]): Promise<Map<string, PostcodeResult>> {
  const response = await fetch("https://api.postcodes.io/postcodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postcodes: postcodes.slice(0, 100) }),
  });
  // ... parse results
}
```

### Inngest Client + Function Setup
```typescript
// Source: epic4final.md Section 5.7 + Inngest v4 docs
// inngest/client.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "britestate" });

// inngest/functions/rfq-notify-providers.ts
export const rfqNotifyProviders = inngest.createFunction(
  { id: "rfq-notify-providers", triggers: [{ event: "marketplace/rfq.created" }] },
  async ({ event, step }) => {
    const { rfqId } = event.data;

    const providers = await step.run("get-matching-providers", async () => {
      // ... fetch matching providers via Supabase RPC
    });

    await step.run("send-in-app-notifications", async () => {
      // ... insert notification rows
    });

    await step.sleep("wait-for-in-app-view", "1h");

    await step.run("send-email-fallback", async () => {
      // ... check unread notifications, send email via Resend
    });
  }
);

// app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { rfqNotifyProviders } from "@/inngest/functions/rfq-notify-providers";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [rfqNotifyProviders],
});
```

### File Validation with file-type
```typescript
// Source: epic4final.md Section 5.5
// lib/marketplace/file-validator.ts
import { fileTypeFromBuffer } from "file-type";

const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function validateFile(buffer: Buffer): Promise<{ mime: string; ext: string }> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("File too large. Maximum 10MB.");
  }
  const detectedType = await fileTypeFromBuffer(buffer);
  if (!detectedType || !ALLOWED_TYPES.has(detectedType.mime)) {
    throw new Error("Invalid file type. Only PDF, JPEG, PNG, WebP allowed.");
  }
  return { mime: detectedType.mime, ext: detectedType.ext };
}
```

### Rule-Based Sentiment Analyzer
```typescript
// Source: epic4final.md Section 5.6
// lib/marketplace/sentiment-analyzer.ts
// Full implementation provided in epic spec -- 50 positive words, 25 negative words,
// intensifier detection, normalized scoring, confidence metric.
// Key: returns { sentiment: SentimentScore; confidence: number }
// Cost: 0/mo, <1ms execution, 90%+ accuracy for service reviews
```

### Booking State Machine Validation (Server-Side)
```typescript
// Source: epic4final.md Section 5, E04-S06
// lib/marketplace/booking-state-machine.ts
export function canTransition(
  currentStatus: BookingStatus,
  newStatus: BookingStatus,
  actorRole: TransitionActor
): { allowed: boolean; requiresReason: boolean } {
  const transition = VALID_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.to === newStatus
  );
  if (!transition) return { allowed: false, requiresReason: false };
  if (!transition.allowed_by.includes(actorRole)) return { allowed: false, requiresReason: false };
  return { allowed: true, requiresReason: transition.requires_reason };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BullMQ + Redis VPS | Inngest serverless step functions | 2024-2025 | No VPS needed, free tier sufficient |
| Mapbox/Google geocoding | postcodes.io (UK-specific, free) | Always available | 0/mo vs 75+/mo |
| Sharp on serverless | Supabase Storage image transforms | 2024 | No cold start penalty, no dependency |
| Materialized views for stats | Incremental counter table + pg_cron | Best practice | No full-table-scan per event |
| Claude API for sentiment | Rule-based keyword scorer | Cost optimization | 0/mo vs 400/mo, sufficient for reviews |
| Inngest v3 | Inngest v4 | 2025 | New trigger syntax, default cloud mode, INNGEST_DEV=1 for local |

**Important version note:**
- Inngest v4 changed the function definition syntax. Use `triggers: [{ event: "..." }]` in the config object, not a separate second parameter.
- file-type v19+ is ESM-only. The project already uses ESM-compatible tooling (Next.js App Router, Vitest with .mts config).

## Open Questions

1. **PostGIS availability in current Supabase project**
   - What we know: Phase 2 (Property Search) likely enables PostGIS for map features (SRCH-04, LIST-08)
   - What's unclear: Whether Phase 2 is complete before Phase 4 starts; if not, Phase 4 migration must enable PostGIS
   - Recommendation: Include `CREATE EXTENSION IF NOT EXISTS postgis;` in Phase 4 migration (idempotent, safe to run twice)

2. **Provider verification status field location**
   - What we know: Phase 1 has `provider_verifications` table with per-stage status. Epic 4 references `profiles.provider_verification_status`
   - What's unclear: Whether to add `provider_verification_status` column to profiles table or derive from provider_verifications
   - Recommendation: Add `provider_verification_status` enum column to profiles table via ALTER TABLE in Phase 4 migration. This is simpler for RLS policies and search queries than joining to provider_verifications.

3. **Inngest v4 exact trigger syntax**
   - What we know: v4 changed from `{ event: "..." }` as 2nd arg to `triggers: [{ event: "..." }]` in config
   - What's unclear: Exact breaking changes from v3 docs that may appear in older examples
   - Recommendation: Follow v4 docs exactly. LOW risk since this is a new installation.

4. **Supabase Storage bucket creation in migrations**
   - What we know: Supabase Storage buckets are typically created via Dashboard or API, not SQL migrations
   - What's unclear: Whether to create via migration script, seed script, or manual setup
   - Recommendation: Document bucket creation as a manual step or use Supabase Management API in a setup script. Bucket name: `provider-docs` (private).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + Testing Library |
| Config file | `britv3.0/vitest.config.mts` |
| Quick run command | `cd britv3.0 && pnpm test:run` |
| Full suite command | `cd britv3.0 && pnpm test:run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MKT-01 | Provider profile CRUD with 16 categories, service area, pricing | unit | `cd britv3.0 && pnpm vitest run src/services/marketplace/provider-service.test.ts -t "provider profile"` | Wave 0 |
| MKT-02 | Document upload with magic bytes validation | unit | `cd britv3.0 && pnpm vitest run src/lib/marketplace/file-validator.test.ts` | Wave 0 |
| MKT-03 | RFQ creation with postcode geocoding | unit + integration | `cd britv3.0 && pnpm vitest run src/services/marketplace/rfq-service.test.ts` | Wave 0 |
| MKT-04 | Provider matching by category, postcode, proximity | unit | `cd britv3.0 && pnpm vitest run src/services/marketplace/rfq-service.test.ts -t "matching"` | Wave 0 |
| MKT-05 | Quote creation with line items and versioning | unit | `cd britv3.0 && pnpm vitest run src/services/marketplace/quote-service.test.ts` | Wave 0 |
| MKT-06 | Side-by-side quote comparison | unit (component) | `cd britv3.0 && pnpm vitest run src/components/marketplace/QuoteComparison.test.tsx` | Wave 0 |
| MKT-07 | Booking creation with conflict detection | unit | `cd britv3.0 && pnpm vitest run src/services/marketplace/booking-service.test.ts -t "conflict"` | Wave 0 |
| MKT-08 | Booking state machine transitions | unit | `cd britv3.0 && pnpm vitest run src/lib/marketplace/booking-state-machine.test.ts` | Wave 0 |
| MKT-09 | Provider availability calendar | unit | `cd britv3.0 && pnpm vitest run src/services/marketplace/booking-service.test.ts -t "availability"` | Wave 0 |
| MKT-10 | Multi-dimensional review submission | unit | `cd britv3.0 && pnpm vitest run src/services/marketplace/review-service.test.ts` | Wave 0 |
| MKT-11 | Rule-based sentiment + spam detection | unit | `cd britv3.0 && pnpm vitest run src/lib/marketplace/sentiment-analyzer.test.ts src/lib/marketplace/spam-detector.test.ts` | Wave 0 |
| MKT-12 | Provider review response + helpfulness voting | unit | `cd britv3.0 && pnpm vitest run src/services/marketplace/review-service.test.ts -t "response|helpful"` | Wave 0 |
| MKT-13 | Provider search by category and location | unit | `cd britv3.0 && pnpm vitest run src/services/marketplace/provider-service.test.ts -t "search"` | Wave 0 |
| MKT-14 | Inngest function registration and event handling | unit | `cd britv3.0 && pnpm vitest run src/inngest/functions/*.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd britv3.0 && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `cd britv3.0 && pnpm test:run && pnpm build && pnpm lint`
- **Phase gate:** Full suite green + build passes before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/marketplace/sentiment-analyzer.test.ts` -- covers MKT-11 sentiment scoring
- [ ] `src/lib/marketplace/spam-detector.test.ts` -- covers MKT-11 spam detection
- [ ] `src/lib/marketplace/booking-state-machine.test.ts` -- covers MKT-08 state transitions
- [ ] `src/lib/marketplace/file-validator.test.ts` -- covers MKT-02 magic bytes validation
- [ ] `src/services/marketplace/provider-service.test.ts` -- covers MKT-01, MKT-13
- [ ] `src/services/marketplace/rfq-service.test.ts` -- covers MKT-03, MKT-04
- [ ] `src/services/marketplace/quote-service.test.ts` -- covers MKT-05
- [ ] `src/services/marketplace/booking-service.test.ts` -- covers MKT-07, MKT-09
- [ ] `src/services/marketplace/review-service.test.ts` -- covers MKT-10, MKT-12
- [ ] `src/inngest/functions/*.test.ts` -- covers MKT-14

## Sources

### Primary (HIGH confidence)
- `britv3.0/docs/epic4final.md` -- Complete epic spec with SQL schemas, TypeScript code, API endpoints, component list
- `britv3.0/supabase/migrations/001_foundation.sql` -- Existing schema patterns, enum conventions, RLS approach
- `britv3.0/package.json` -- Current dependency versions
- `britv3.0/src/types/auth.ts` -- Existing type conventions (Readonly<{}>, branded types pattern)

### Secondary (MEDIUM confidence)
- [Inngest Next.js Quick Start](https://www.inngest.com/docs/getting-started/nextjs-quick-start) -- v4 setup, trigger syntax, serve endpoint
- [Inngest Pricing](https://www.inngest.com/pricing) -- Free tier: 50K executions/month
- [postcodes.io API docs](https://postcodes.io/docs/api/) -- Rate limit 15K/hr, no auth needed
- [file-type npm](https://www.npmjs.com/package/file-type) -- v21.x, ESM-only, fileTypeFromBuffer API

### Tertiary (LOW confidence)
- Inngest v4 breaking changes -- verified via Quick Start docs but exact migration guide not reviewed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- epic spec defines exact libraries with rationale, all verified as current
- Architecture: HIGH -- epic spec provides complete SQL schemas, TypeScript implementations, API endpoints
- Pitfalls: HIGH -- based on known issues with ESM, PostGIS, Inngest setup, and race conditions documented in spec
- Database schema: HIGH -- epic spec provides table-by-table definitions with indexes and RLS policies

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days -- stable domain, libraries are mature)
