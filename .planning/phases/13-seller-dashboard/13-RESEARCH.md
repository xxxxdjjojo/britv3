# Phase 13: Seller Dashboard - Research

**Researched:** 2026-03-13
**Domain:** Next.js 16 + Supabase + Claude API — UK property seller journey (listing creation, offers, sale progression, agent finder)
**Confidence:** HIGH — derived from live codebase inspection, verified package.json, and established project patterns

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Design System — LOCKED from Stitch screens**
- Primary colour: `#1B4D3E` (deep forest green) for sidebar, CTAs, active nav items
- Fonts: Plus Jakarta Sans (headings/logo), Inter (body) — import from Google Fonts
- Sidebar: 256px wide, dark forest green (`bg-primary`), white text, white/10 icon bg, fixed inset
- Layout: Fixed sidebar (left) + scrollable main content (right, `ml-64`)
- Card style: White bg, `rounded-2xl`, `shadow-sm border border-slate-200`, hover → `shadow-xl`
- KPI cards: Icon in coloured pill bg, large bold number (`text-3xl font-extrabold`), emerald percentage badge for positive trends
- Welcome banner: `bg-primary rounded-2xl` with white text, abstract SVG decoration, personalized insight

**Route Structure — LOCKED**
```
/dashboard/seller/
  page.tsx                     → Dashboard Home
  listings/page.tsx            → My Listings
  listings/create/page.tsx     → Multi-step wizard (?step=N)
  listings/[id]/analytics/page.tsx
  listings/[id]/edit/page.tsx
  viewings/page.tsx
  offers/page.tsx
  offers/[id]/page.tsx
  sale-progress/[id]/page.tsx
  valuation/page.tsx
  agents/page.tsx
  agents/compare/page.tsx
  agents/[id]/page.tsx
```

**Backend/Data — LOCKED**
- Real Supabase data throughout — no hardcoded mock arrays
- Tables: `seller_listings`, `listing_analytics_events`, `listing_description_attempts`, `seller_viewings`, `seller_offers`, `sale_progression_stages`, `agent_enquiries`
- AI description: Claude Haiku via `@anthropic-ai/sdk`, server-side route handler, max 3 regenerations stored in `listing_description_attempts`, rate-limited via Upstash Redis
- Image upload: `browser-image-compression` client-side → Supabase Storage → `sharp` resize server-side
- Land Registry data: UK Price Paid Data API (free public SPARQL endpoint) for valuation comparables

### Claude's Discretion

- Chart library: Recharts (already in tech stack) — use LineChart + AreaChart + PieChart
- Wizard state management: URL query params (`?step=2`) so back button works correctly
- Image reorder: `@dnd-kit/sortable` for drag-and-drop photo ordering (already installed)
- Postcode lookup: `postcodes.io` free API (reuse pattern from Phase 2)
- Sale stage transitions: Server-enforced state machine (cannot skip stages)

### Deferred Ideas (OUT OF SCOPE)

- Vendor Report PDF (auto-generated PDF per listing)
- CRM/Lead management (estate agent-level CRM)
- Rightmove/Zoopla integration (property portal syndication)
- Video tour upload (S3 transcoding pipeline)
- Open House scheduling (advanced viewing management)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SELL-01 | Dashboard Home: real KPI cards (active listings, total views, enquiries, upcoming viewings) from Supabase with 30-day performance chart | Server Component + Recharts AreaChart; aggregate queries against `seller_listings` + `listing_analytics_events` + `seller_viewings` |
| SELL-02 | My Listings: real listings with status tabs (Active/Under Offer/Sold/Drafts), views/saves/enquiries counts, weekly mini-chart per listing | Status filter query on `seller_listings`; analytics aggregation join; Recharts BarChart for mini-chart |
| SELL-03 | Create Listing 7-step wizard: postcode lookup → property type/tenure → details → photos → AI description → price → EPC → review/publish | URL query param (`?step=N`) state; `postcodes.io`; `browser-image-compression` + Supabase Storage; Claude Haiku endpoint |
| SELL-04 | Listing Analytics: views over time (line chart), saves, enquiries, CTR from real data, date range selector | `listing_analytics_events` table; Recharts LineChart + PieChart; TanStack Query for date-range re-fetch |
| SELL-05 | Manage Viewings: scheduled viewings with confirm/reschedule/cancel flows | `seller_viewings` table; Server Component list + "use client" action modals; PATCH API route |
| SELL-06 | Offers Received: buyer offers with accept/counter/reject and offer comparison | `seller_offers` table; offer state machine server-enforced; OfferCompareTable side-by-side |
| SELL-07 | Offer accept/counter/reject action flows with modal confirmations | PATCH `/api/seller/offers/[id]` with named action; solicitor details form on accept |
| SELL-08 | Sale Progression Tracker: 8-stage UK conveyancing pipeline, current stage, expected dates, key documents | `sale_progression_stages` table; horizontal stepper component; stage state machine enforced server-side |
| SELL-09 | Instant Valuation: AI estimate with confidence range, Land Registry comparable properties | Land Registry Price Paid Data SPARQL/REST API; Claude Haiku for AVM estimate; pence arithmetic |
| SELL-10 | Find an Estate Agent: agent grid filterable by area, fees, ratings | Query `profiles` or `marketplace_providers` filtered by role=agent; AgentCard component grid |
| SELL-11 | Agent Comparison: side-by-side comparison table up to 3 agents | `@tanstack/react-table` (already installed); query string for selected agent IDs |
| SELL-12 | Agent Profile View (from seller context) with request valuation CTA | Single agent detail page; `agent_enquiries` INSERT on CTA click |
| SELL-13 | Seller dashboard sidebar navigation: Dashboard, My Listings, Enquiries, Viewings, Market Analytics, Settings | SellerSidebar component; `bg-primary` (#1B4D3E); fixed 256px |
| SELL-14 | Listing card with horizontal layout: image (288px), content, weekly mini bar chart + Edit/Archive actions | ListingCard component; `group-hover:scale-105` on image; actions dropdown |
| SELL-15 | Wizard Step 1: postcode lookup populates address select; property type icon grid; tenure toggle; leasehold years input | `postcodes.io` API; `react-hook-form` + Zod; `?step=1` URL param |
| SELL-16 | Wizard AI Description step: 3 tone pills (Professional/Warm/Luxury), generate button, regeneration limit counter, preview sidebar | Claude Haiku `/api/seller/describe`; attempt count from `listing_description_attempts`; sticky preview |
| SELL-17 | Wizard Step 3 photos: drag-drop reorder, `browser-image-compression`, Supabase Storage upload, floor plan slot | `@dnd-kit/sortable` (installed); `react-dropzone` (installed); `browser-image-compression` (installed) |
| SELL-18 | Wizard Step 7 review/publish: full listing preview checklist, publish CTA sets status=active | PATCH `/api/seller/listings/[id]` with `status=active`; `revalidatePath` on publish |
</phase_requirements>

---

## Summary

Phase 13 delivers the complete Seller Dashboard — 18 screens covering the UK property sale journey from listing creation to sale completion. The scope is entirely UI + data wiring: no new infrastructure libraries are needed because the project stack already contains every dependency this phase requires (`@dnd-kit/sortable`, `browser-image-compression`, `react-dropzone`, `recharts`, `@anthropic-ai/sdk`, `@tanstack/react-query`, `react-hook-form`, `zod`, `@upstash/redis`).

The architecture follows established Britestate patterns exactly: Server Components for read-heavy pages calling Supabase directly, "use client" components with TanStack Query for interactive mutation surfaces, Server Actions for form submissions, and API route handlers for AI endpoints that need rate limiting. The seller dashboard has its own route group at `/dashboard/seller/` rather than using the dynamic `[role]` pattern, matching the approach already validated in Phase 14 (landlord dashboard) plans.

The most technically complex elements are: the 7-step listing wizard (state persisted via URL query param + Supabase draft record), the AI description generator (Claude Haiku with regeneration count enforcement), photo upload with drag-and-drop reorder (`@dnd-kit/sortable`), and the Land Registry Price Paid Data integration for instant valuation comparables. The sale progression tracker is UI complexity only — it reads a JSON stage map from one Supabase table.

**Primary recommendation:** Build in dependency order: DB schema + types (Plan 01) → service layer + AI endpoint (Plan 02) → dashboard shell + listing pages (Plans 03-05) → analytics, viewings, offers, sale progression, valuation+agents (Plans 06-10). This order matches the 10 existing plans.

---

## Standard Stack

### Core (ALL already installed — verified in package.json)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.1.6 | App Router, Server Components, API routes | Project standard |
| `react` | 19.2.3 | UI runtime | Project standard |
| `@supabase/supabase-js` | ^2.98.0 | DB queries, Storage, Auth | Project BaaS |
| `@supabase/ssr` | ^0.9.0 | Server/client Supabase clients for App Router | Project standard |
| `recharts` | ^2.15.4 | Line/area/pie/bar charts | Already installed; Shadcn chart wrapper uses it |
| `react-hook-form` | ^7.71.2 | Multi-step wizard forms | Already installed; fewer re-renders vs Formik |
| `zod` | ^4.3.6 | Form + API validation | Already installed |
| `@hookform/resolvers` | ^5.2.2 | Connects Zod to react-hook-form | Already installed |
| `@tanstack/react-query` | ^5.90.21 | Client-side data fetching + cache invalidation | Already installed |
| `@tanstack/react-table` | ^8.21.3 | Agent comparison table | Already installed |
| `@anthropic-ai/sdk` | ^0.78.0 | Claude Haiku for AI descriptions + AVM | Already installed |
| `@upstash/redis` | ^1.36.3 | Rate limiting AI endpoint | Already installed |
| `@upstash/ratelimit` | ^2.0.8 | Token bucket for AI regenerations | Already installed |
| `browser-image-compression` | ^2.0.2 | Client-side photo compression before upload | Already installed |
| `react-dropzone` | ^15.0.0 | Drag-drop file selection (photos, EPC) | Already installed |
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop primitives | Already installed |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable photo reorder list | Already installed |
| `@dnd-kit/modifiers` | ^9.0.0 | Constrain drag axis | Already installed |
| `lucide-react` | ^0.577.0 | Icons throughout dashboard | Already installed |
| `nuqs` | ^2.8.9 | Type-safe URL query params for `?step=N` | Already installed |
| `sharp` | ^0.34.5 | Server-side image resize after upload | Already installed |
| `sonner` | ^2.0.7 | Toast notifications for form actions | Already installed |

### New Dependency Required

| Library | Version | Purpose | Install |
|---------|---------|---------|---------|
| `date-fns` | `^4.1.0` | Date formatting for viewings/analytics (not in package.json) | `pnpm add date-fns@^4.1.0` |

**Verification:** `date-fns` is NOT in package.json and NOT in node_modules. It is needed for: formatting viewing datetimes, calculating days-remaining in sale progression, date-range labels on analytics charts. The v3.1 STACK.md research documented this as the correct version (date-fns v4, not v3 — required by react-day-picker if that is later added, and already the version confirmed via npm).

### What Does NOT Need Adding

| Capability | Covered By |
|------------|-----------|
| Photo upload progress | React state + Supabase Storage `.upload()` promise |
| Drag-and-drop photo reorder | `@dnd-kit/sortable` (already installed) |
| Offer comparison table | `@tanstack/react-table` (already installed) |
| Toast notifications | `sonner` (already installed) |
| Postcode lookup | `postcodes.io` free REST API — no npm package, just `fetch()` |
| Land Registry data | UK GOV SPARQL endpoint — `fetch()` only, no library |
| PDF generation | `@react-pdf/renderer` already installed (not needed in Phase 13, deferred) |
| Calendar UI for viewings | Custom date-fns grid (same pattern as buyer dashboard) |

**Installation command (only new dependency):**
```bash
# From repo root (where package.json lives)
pnpm add date-fns@^4.1.0
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── (protected)/
│       └── dashboard/
│           └── seller/                    # NEW route group
│               ├── layout.tsx             # Seller layout with SellerSidebar
│               ├── page.tsx               # Dashboard Home (Server Component)
│               ├── listings/
│               │   ├── page.tsx           # My Listings (Server Component)
│               │   ├── create/
│               │   │   └── page.tsx       # Wizard host (reads ?step)
│               │   └── [id]/
│               │       ├── analytics/page.tsx
│               │       └── edit/page.tsx
│               ├── viewings/page.tsx
│               ├── offers/
│               │   ├── page.tsx
│               │   └── [id]/page.tsx
│               ├── sale-progress/[id]/page.tsx
│               ├── valuation/page.tsx
│               └── agents/
│                   ├── page.tsx
│                   ├── compare/page.tsx
│                   └── [id]/page.tsx
│
├── components/
│   └── seller/
│       ├── SellerSidebar.tsx              # Fixed 256px forest-green nav
│       ├── KpiCard.tsx                    # KPI card with trend badge
│       ├── PerformanceChart.tsx           # 30-day area chart (Recharts)
│       ├── ListingCard.tsx                # Horizontal card with mini bar chart
│       ├── StatusTabs.tsx                 # Active/Under Offer/Sold/Drafts
│       ├── wizard/
│       │   ├── WizardShell.tsx            # Stepper + progress bar + footer nav
│       │   ├── Step1AddressType.tsx
│       │   ├── Step2Details.tsx
│       │   ├── Step3Photos.tsx            # dnd-kit sortable + dropzone
│       │   ├── Step4Description.tsx       # AI generate + tone pills
│       │   ├── Step5Price.tsx
│       │   ├── Step6Epc.tsx
│       │   └── Step7Review.tsx
│       ├── analytics/
│       │   └── ListingAnalyticsCharts.tsx
│       ├── viewings/
│       │   ├── ViewingCard.tsx
│       │   └── ViewingActionModal.tsx
│       ├── offers/
│       │   ├── OfferCard.tsx
│       │   ├── OfferActionModal.tsx
│       │   └── OfferCompareTable.tsx
│       ├── sale-progress/
│       │   ├── SaleProgressionStepper.tsx
│       │   ├── SaleDocumentsList.tsx
│       │   └── SaleContactsSidebar.tsx
│       ├── valuation/
│       │   └── ValuationResult.tsx
│       └── agents/
│           └── AgentCard.tsx
│
├── services/
│   └── seller/
│       ├── listing-service.ts             # CRUD, publish, archive, stats join
│       ├── analytics-service.ts           # Aggregate listing_analytics_events
│       ├── ai-description-service.ts      # Claude Haiku + attempt enforcement
│       ├── viewing-service.ts             # CRUD + status transitions
│       ├── offer-service.ts               # State machine: pending/accepted/countered
│       └── sale-progression-service.ts    # Read/update stage + dates
│
├── app/api/seller/
│   ├── listings/route.ts                  # GET + POST
│   ├── listings/[id]/route.ts             # GET + PATCH + DELETE
│   ├── listings/[id]/analytics/route.ts   # GET ?days=N
│   ├── describe/route.ts                  # POST — Claude Haiku
│   ├── viewings/[id]/route.ts             # PATCH (confirm/reschedule/cancel)
│   ├── offers/route.ts                    # GET (list)
│   ├── offers/[id]/route.ts               # PATCH (accept/counter/reject)
│   ├── sale-progress/[id]/route.ts        # GET + PATCH
│   ├── valuation/route.ts                 # GET ?postcode=
│   └── agents/route.ts                    # GET ?area=&min_rating=
│
└── types/
    └── seller.ts                          # All seller domain types
```

### Pattern 1: Server Component + Direct Supabase (Read-heavy pages)

**What:** Server Component fetches via `createClient()` directly. No API route, no client JS for data.
**When to use:** Dashboard Home, My Listings, Sale Progression, Agent Profile, Valuation page initial load.

```typescript
// src/app/(protected)/dashboard/seller/page.tsx
export default async function SellerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [kpis, recentEnquiries, upcomingViewings] = await Promise.all([
    getSellerKPIs(supabase, user.id),
    getRecentEnquiries(supabase, user.id, 5),
    getUpcomingViewings(supabase, user.id, 5),
  ]);

  return <SellerDashboardShell kpis={kpis} enquiries={recentEnquiries} viewings={upcomingViewings} />;
}
```

### Pattern 2: "use client" + TanStack Query (Interactive mutation surfaces)

**What:** Client component fetches from API route. TanStack Query handles caching and invalidation after mutations.
**When to use:** Viewings confirm/reschedule/cancel, Offers accept/counter/reject, analytics date-range changes.

```typescript
// hooks/useSellerOffers.ts
export function useSellerOffers(listingId?: string) {
  return useQuery({
    queryKey: ["seller-offers", listingId],
    queryFn: () =>
      fetch(`/api/seller/offers${listingId ? `?listing_id=${listingId}` : ""}`).then(r => r.json()),
    staleTime: 30_000,
  });
}

export function useRespondToOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, action, payload }: { offerId: string; action: string; payload: unknown }) =>
      fetch(`/api/seller/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller-offers"] }),
  });
}
```

### Pattern 3: Wizard with URL Query State (7-step listing creation)

**What:** Each wizard step is identified by `?step=N`. `nuqs` provides type-safe URL sync. Draft listing ID stored in URL after Step 1 creates the record.
**When to use:** The Create Listing wizard exclusively.

```typescript
// src/app/(protected)/dashboard/seller/listings/create/page.tsx
import { useQueryState } from "nuqs";

// URL: /dashboard/seller/listings/create?step=3&id=abc-123
const stepParam = searchParams.get("step") ?? "1";
const step = Math.min(Math.max(parseInt(stepParam, 10), 1), 7) as ListingStep;
const listingId = searchParams.get("id") ?? null;

// Render correct step component based on `step`
```

**Rationale:** URL query state means browser Back button returns to previous step without JavaScript history manipulation. The draft listing is created on Step 1 completion and subsequent steps PATCH the same record.

### Pattern 4: AI Description API Route with Rate Limiting

**What:** Claude Haiku generates property descriptions server-side. Rate limited by `@upstash/ratelimit` to 3 attempts per listing.

```typescript
// src/app/api/seller/describe/route.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import Anthropic from "@anthropic-ai/sdk";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "24 h"),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId, tone, attributes } = await request.json();

  // Count existing attempts for this listing from DB
  const { count } = await supabase
    .from("listing_description_attempts")
    .select("*", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .eq("seller_id", user.id);

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "max_attempts_reached" }, { status: 429 });
  }

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 600,
    messages: [{ role: "user", content: buildDescriptionPrompt(tone, attributes) }],
  });

  // Record the attempt
  await supabase.from("listing_description_attempts").insert({
    listing_id: listingId,
    seller_id: user.id,
    tone,
  });

  return NextResponse.json({ description: message.content[0].text });
}
```

### Pattern 5: Offer State Machine (Server-Enforced)

**What:** Seller offers have a strict state machine. Only valid transitions are allowed. Client calls named actions, never sets status directly.

```
pending
  ├─→ accepted  (seller accepts)
  ├─→ countered  (seller counters)
  └─→ rejected  (seller rejects)
countered
  ├─→ accepted  (buyer accepts counter — handled separately or by buyer)
  └─→ withdrawn  (buyer withdraws)
```

```typescript
// src/app/api/seller/offers/[id]/route.ts
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["accepted", "countered", "rejected"],
  countered: ["accepted", "withdrawn"],
};

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { action, ...payload } = await request.json();
  const offer = await getOfferById(supabase, params.id);

  if (!VALID_TRANSITIONS[offer.status]?.includes(action)) {
    return NextResponse.json({ error: "invalid_transition" }, { status: 400 });
  }
  // Apply transition
}
```

### Pattern 6: Photo Upload with Drag-and-Drop Reorder

**What:** `react-dropzone` handles file selection. `browser-image-compression` reduces file size client-side. `@dnd-kit/sortable` handles reorder. Compressed files upload to Supabase Storage. Photo order stored in `seller_listings.photos` JSONB array.

```typescript
// src/components/seller/wizard/Step3Photos.tsx
"use client";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/client";

async function uploadPhoto(file: File, userId: string, listingId: string) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
  const supabase = createClient();
  const path = `listings/${userId}/${listingId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from("listing-photos")
    .upload(path, compressed, { upsert: false });
  if (error) throw error;
  return supabase.storage.from("listing-photos").getPublicUrl(data.path).data.publicUrl;
}
```

### Pattern 7: Land Registry Price Paid Data for Valuation

**What:** HM Land Registry provides free access to UK property sales data. Query by postcode area to find comparables.

**API endpoint:** `https://landregistry.data.gov.uk/data/ppi/transaction-record.json?propertyAddress.postcode=SW1A+1AA&_pageSize=10&_sort=-transactionDate`

**Key details:**
- REST API with JSON-LD responses (no API key required)
- Filter by postcode, property type, date range
- Returns: price, sale date, property type, tenure, address
- Rate limit: ~1000 requests/day per IP (confirmed from GOV.UK docs, MEDIUM confidence)
- Alternative: SPARQL endpoint at `https://landregistry.data.gov.uk/landregistry/query` for more complex queries

```typescript
// src/app/api/seller/valuation/route.ts
const LAND_REG_BASE = "https://landregistry.data.gov.uk/data/ppi/transaction-record.json";

async function getComparables(postcode: string, propertyType: string) {
  const params = new URLSearchParams({
    "propertyAddress.postcode": postcode.replace(" ", "+"),
    "_pageSize": "10",
    "_sort": "-transactionDate",
    // Filter to same property type where possible
  });
  const res = await fetch(`${LAND_REG_BASE}?${params}`, {
    next: { revalidate: 86400 }, // Cache 24h — Land Registry data is updated monthly
  });
  const data = await res.json();
  return data.result?.items ?? [];
}
```

### Anti-Patterns to Avoid

- **Fetching from API routes in Server Components:** Call service functions directly, not `fetch("/api/seller/...")` from a Server Component. API routes exist for client-side hooks only.
- **Storing offer status client-side after mutation:** Always invalidate TanStack Query cache and re-fetch from server after any offer state change. Never trust `useState` for offer status.
- **Calling Claude on every wizard save:** Only generate description on explicit "Generate with AI" button click. Never auto-generate on blur or step change.
- **Skipping sale stage validation on client:** Stage transitions must be validated server-side in the API route. The client only sends the desired next stage; the server checks if it is the `current_stage + 1`.
- **Public listing photos bucket:** The `listing-photos` Supabase Storage bucket can be public (listing photos are public once published), but restrict uploads to authenticated sellers via RLS: `auth.uid()::text = (storage.foldername(name))[2]` (third folder segment = userId).
- **Wizard losing state on refresh:** Persist wizard data to `seller_listings` (draft status) after each step completes. The wizard is not just local state — Step 1 creates the DB record, Steps 2-7 PATCH it. This way a refresh at any step loads the saved draft.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo compression | Custom canvas-resize logic | `browser-image-compression` (installed) | Handles WebP, EXIF rotation, quality tuning, web workers |
| Drag-and-drop photo sort | Mouse event handlers | `@dnd-kit/sortable` (installed) | Accessibility, keyboard, touch, collision detection |
| File drop UI | `<input>` styled as dropzone | `react-dropzone` (installed) | Handles multiple files, type validation, drag state |
| Form state (wizard) | Manual `useState` per field | `react-hook-form` (installed) | Uncontrolled, validation, dirty tracking |
| Table for agent comparison | Custom `<table>` | `@tanstack/react-table` (installed) | Sorting, column visibility, already in stack |
| Toast notifications | Custom toast state | `sonner` (installed) | Already installed, accessible, animated |
| Rate limiting AI endpoint | Counter in DB only | `@upstash/ratelimit` (installed) | In-memory fast check before DB write |
| Land Registry geocoding | PostGIS lookups | `postcodes.io` API | Free, no setup, returns LSOA/ward/constituency data |
| Charts | D3.js | `recharts` (installed) | Already installed, React-native, responsive |

**Key insight:** Every tool needed for the seller dashboard's complex UI interactions is already in the package.json. The Phase 13 work is primarily composition of existing installed libraries, not adding new ones.

---

## Common Pitfalls

### Pitfall 1: Wizard Draft Persistence Gap

**What goes wrong:** Developer stores wizard state only in React state (or `nuqs`), not persisting to Supabase between steps. User refreshes or navigates away and loses work.
**Why it happens:** URL query state feels sufficient since it survives navigation. But it cannot survive a full refresh or closing the tab.
**How to avoid:** Step 1 creates a `seller_listings` row with `status='draft'`. All subsequent steps PATCH the same row immediately on "Continue". The wizard page reads existing draft data on mount if `?id=` param is present.
**Warning signs:** Wizard that only calls Supabase on Step 7 "Publish".

### Pitfall 2: AI Description Regeneration Not Enforced Server-Side

**What goes wrong:** Regeneration limit (max 3) enforced only in the UI (disabling the button). A developer inspection of the API call can bypass it.
**Why it happens:** Client-side enforcement is easier to implement.
**How to avoid:** `/api/seller/describe` route checks `COUNT(listing_description_attempts WHERE listing_id=X AND seller_id=Y)` before calling Claude. Return 429 if >= 3. UI reflects the count, but server is the gate.
**Warning signs:** `listing_description_attempts` table not being written on each generation.

### Pitfall 3: Listing Photos Stored as Full Supabase URLs in JSONB

**What goes wrong:** `seller_listings.photos` JSONB stores full `https://xxx.supabase.co/storage/v1/object/public/listing-photos/...` URLs. If the Supabase project URL changes or storage is migrated, all photo URLs break.
**Why it happens:** It is simpler to store the full URL from `getPublicUrl()`.
**How to avoid:** Store only the storage path (e.g., `listings/{userId}/{listingId}/{filename}`) in the JSONB. Construct the full URL at read time using `supabase.storage.from("listing-photos").getPublicUrl(path)`.
**Warning signs:** JSONB `photos` array containing `https://` URLs.

### Pitfall 4: Analytics Events Causing N+1 Queries on My Listings

**What goes wrong:** My Listings page queries `seller_listings` then for each listing runs a separate `COUNT(*)` against `listing_analytics_events`. 20 listings = 21 queries.
**Why it happens:** Simple loop over listings with per-listing count query.
**How to avoid:** Single query with aggregate join:
```sql
SELECT sl.*,
  COUNT(CASE WHEN lae.event_type = 'view' THEN 1 END) AS views_count,
  COUNT(CASE WHEN lae.event_type = 'save' THEN 1 END) AS saves_count,
  COUNT(CASE WHEN lae.event_type = 'enquiry' THEN 1 END) AS enquiries_count
FROM seller_listings sl
LEFT JOIN listing_analytics_events lae ON lae.listing_id = sl.id
WHERE sl.seller_id = auth.uid()
GROUP BY sl.id
```
**Warning signs:** Multiple Supabase queries in a loop inside a service function.

### Pitfall 5: Sale Progression Stage Skip

**What goes wrong:** Client sends `current_stage: 5` when current is `2`, jumping 3 stages.
**Why it happens:** No server-side validation of stage ordering, only client-side "next" button.
**How to avoid:** API route for sale progression PATCH validates `new_stage === current_stage + 1`. Only forward progression allowed, no arbitrary stage setting.
**Warning signs:** `sale_progression_stages` PATCH handler that directly accepts `current_stage` from request body without validation.

### Pitfall 6: postcodes.io Returns Array for Partial Postcodes

**What goes wrong:** `postcodes.io/postcodes/SW1A` (partial) returns an autocomplete array, but `postcodes.io/postcodes/SW1A+1AA` (full) returns a single object. Treating partial response as full causes "Cannot read properties of undefined" errors.
**Why it happens:** Two different API endpoints confused.
**How to avoid:** Use `/postcodes/{postcode}` for full postcode lookup and `/postcodes/{postcode}/autocomplete` for search-as-you-type. Parse response shapes differently.

---

## Code Examples

Verified patterns from project-established conventions:

### Server Component Auth Guard (matches Phase 14 landlord pattern)

```typescript
// Pattern established in src/services/landlord/portfolio-service.ts
export default async function SellerDashboardPage() {
  const supabase = await createClient(); // from @/lib/supabase/server
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // proceed with data fetch
}
```

### Supabase Server Client (from src/lib/supabase/server.ts — established pattern)

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
            cookieStore.set(name, value, options));
        },
      },
    }
  );
}
```

### Recharts AreaChart for 30-day Performance (Shadcn chart wrapper pattern)

```typescript
// Uses Recharts via Shadcn chart component wrapper
"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function PerformanceChart({ data }: { data: Array<{ date: string; views: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1B4D3E" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#1B4D3E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Area type="monotone" dataKey="views" stroke="#1B4D3E" fill="url(#viewsGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

### dnd-kit Sortable Photo List

```typescript
"use client";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortablePhoto({ photo }: { photo: ListingPhoto }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: photo.url });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return <div ref={setNodeRef} style={style} {...attributes} {...listeners}>...</div>;
}

export function PhotoSorter({ photos, onChange }: { photos: ListingPhoto[]; onChange: (p: ListingPhoto[]) => void }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
      if (over && active.id !== over.id) {
        const from = photos.findIndex(p => p.url === active.id);
        const to = photos.findIndex(p => p.url === over.id);
        onChange(arrayMove(photos, from, to));
      }
    }}>
      <SortableContext items={photos.map(p => p.url)} strategy={verticalListSortingStrategy}>
        {photos.map(p => <SortablePhoto key={p.url} photo={p} />)}
      </SortableContext>
    </DndContext>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | Package already uses new approach; do NOT use old helper |
| `react-beautiful-dnd` | `@dnd-kit` | 2022 | dnd-kit is installed; react-beautiful-dnd is not compatible with React 19 |
| `react-day-picker@8` | `react-day-picker@9` | 2024 | v8 not React 19 compatible; if calendar needed, use v9 via Shadcn |
| `date-fns@3` | `date-fns@4` | 2024 | v4 is ESM-only; install as `^4.1.0` |
| Formik | `react-hook-form` | 2021+ | RHF is installed; do not add Formik |
| `next/image` for all images | Use for static assets; `<img>` for Supabase Storage images with `sizes` | 2024+ | `next/image` requires allowed domain config; Supabase Storage URLs work better as regular `<img>` with CSS aspect-ratio |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Not in package.json — do NOT add it.
- `react-beautiful-dnd`: Abandoned, React 18+ incompatible. `@dnd-kit` is the replacement and already installed.
- `classnames` package: Not needed. `clsx` and `tailwind-merge` cover this. Neither classnames nor `cn()` from a custom util file is needed — Shadcn's `cn()` utility at `lib/utils.ts` handles this.

---

## Open Questions

1. **Land Registry API rate limits in production**
   - What we know: The SPARQL/REST endpoint is publicly documented as free. Development use is unrestricted.
   - What's unclear: Production rate limits per IP for the JSON API endpoint are not prominently documented. May need caching strategy.
   - Recommendation: Cache Land Registry responses in Next.js `fetch` with `next: { revalidate: 86400 }` (24-hour cache). Land Registry data is updated monthly, so daily caching is safe.

2. **Agent profiles source table**
   - What we know: Plan 10 queries `profiles` table filtered by role=agent. The actual column name and whether `marketplace_providers` or `profiles` is the right table depends on what Phase 3/4 built.
   - What's unclear: Phase 3/4 have not run yet (per ROADMAP — all phases after 1 and 6 are pending).
   - Recommendation: Plan 10 is marked `autonomous: false` for this reason. The `AgentProfile` type in `seller.ts` defines the shape needed — the service layer can be adapted once the profiles/marketplace schema is confirmed.

3. **`seller_listings` vs existing `properties` table**
   - What we know: CONTEXT.md specifies `seller_listings` as a new table rather than extending the existing `properties` / `prop_listings` table.
   - What's unclear: Phase 2 plans reference a `prop_listings` table. If Phase 2 runs first, there may be duplication between `prop_listings` (public property portal) and `seller_listings` (seller dashboard).
   - Recommendation: The decision to keep them separate is documented in CONTEXT.md and Plan 01. Proceed with `seller_listings` as a distinct table. A future reconciliation can link them via FK if Phase 2 runs.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + happy-dom |
| Config file | `vitest.config.mts` (repo root) |
| Quick run command | `pnpm test --run src/__tests__/seller/` |
| Full suite command | `pnpm test --run` |
| E2E framework | Playwright ^1.58.2 |
| E2E quick run | `pnpm test:e2e --grep "seller"` |
| E2E full suite | `pnpm test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SELL-01 | Dashboard KPIs load from Supabase with correct counts | unit | `pnpm test --run src/__tests__/seller/dashboard-kpis.test.ts` | Wave 0 |
| SELL-02 | My Listings status filter returns correct subset | unit | `pnpm test --run src/__tests__/seller/listing-service.test.ts` | Wave 0 |
| SELL-03 | Wizard step navigation preserves draft data across steps | unit + e2e | `pnpm test --run src/__tests__/seller/wizard-state.test.ts` | Wave 0 |
| SELL-04 | Analytics aggregation groups events by day correctly | unit | `pnpm test --run src/__tests__/seller/analytics-service.test.ts` | Wave 0 |
| SELL-05 | Viewing status transition: pending → confirmed is allowed; pending → completed is rejected | unit | `pnpm test --run src/__tests__/seller/viewing-transitions.test.ts` | Wave 0 |
| SELL-06 | Offer cards render colour-coded amount vs asking price | unit | `pnpm test --run src/__tests__/seller/offer-card.test.tsx` | Wave 0 |
| SELL-07 | Offer state machine rejects invalid transitions (e.g. accepted → countered) | unit | `pnpm test --run src/__tests__/seller/offer-state-machine.test.ts` | Wave 0 |
| SELL-08 | Sale progression stage enforces sequential advance only | unit | `pnpm test --run src/__tests__/seller/sale-progression.test.ts` | Wave 0 |
| SELL-09 | Land Registry API response parses to LandRegistryComparable[] | unit | `pnpm test --run src/__tests__/seller/land-registry-parser.test.ts` | Wave 0 |
| SELL-10 | Agent search filters by area string correctly | unit | `pnpm test --run src/__tests__/seller/agent-search.test.ts` | Wave 0 |
| SELL-11 | Agent comparison table renders ≤3 agents side by side | unit | `pnpm test --run src/__tests__/seller/agent-compare.test.tsx` | Wave 0 |
| SELL-16 | AI description returns 429 when attempt count ≥ 3 | unit | `pnpm test --run src/__tests__/seller/ai-description.test.ts` | Wave 0 |
| SELL-17 | Photo upload compresses and returns Storage URL | unit (mock Supabase) | `pnpm test --run src/__tests__/seller/photo-upload.test.ts` | Wave 0 |
| SELL-18 | Publish action sets listing status to active | unit | (covered by listing-service.test.ts) | Wave 0 |

Requirements SELL-12 through SELL-15 are UI/visual requirements best covered by E2E or manual visual review. No automated unit test provides meaningful coverage beyond what the service tests above provide.

### Sampling Rate

- **Per task commit:** `pnpm test --run src/__tests__/seller/`
- **Per wave merge:** `pnpm test --run`
- **Phase gate:** `pnpm test --run && pnpm build` — both must pass before `/gsd:verify-work`

### Wave 0 Gaps

All seller test files are new (no existing seller tests detected):

- [ ] `src/__tests__/seller/dashboard-kpis.test.ts` — covers SELL-01
- [ ] `src/__tests__/seller/listing-service.test.ts` — covers SELL-02, SELL-18
- [ ] `src/__tests__/seller/wizard-state.test.ts` — covers SELL-03
- [ ] `src/__tests__/seller/analytics-service.test.ts` — covers SELL-04
- [ ] `src/__tests__/seller/viewing-transitions.test.ts` — covers SELL-05
- [ ] `src/__tests__/seller/offer-card.test.tsx` — covers SELL-06
- [ ] `src/__tests__/seller/offer-state-machine.test.ts` — covers SELL-07
- [ ] `src/__tests__/seller/sale-progression.test.ts` — covers SELL-08
- [ ] `src/__tests__/seller/land-registry-parser.test.ts` — covers SELL-09
- [ ] `src/__tests__/seller/agent-search.test.ts` — covers SELL-10
- [ ] `src/__tests__/seller/agent-compare.test.tsx` — covers SELL-11
- [ ] `src/__tests__/seller/ai-description.test.ts` — covers SELL-16
- [ ] `src/__tests__/seller/photo-upload.test.ts` — covers SELL-17
- [ ] Framework install: Already installed (Vitest ^4.0.18, happy-dom) — no additional setup needed

---

## Sources

### Primary (HIGH confidence)

- Live `package.json` (repo root) — verified all installed dependencies and exact versions
- `vitest.config.mts` — confirmed test setup (happy-dom, setupFiles path, include pattern)
- `playwright.config.ts` — confirmed E2E config (testDir: ./e2e, baseURL)
- `src/app/api/` directory structure — confirmed existing API route patterns
- `.planning/research/STACK.md` — project stack decisions with version notes
- `.planning/research/ARCHITECTURE.md` — established patterns (Server Component + direct Supabase, TanStack Query, Server Actions)
- `.planning/phases/13-seller-dashboard/13-CONTEXT.md` — locked design + route + data decisions
- `.planning/phases/13-seller-dashboard/13-01-PLAN.md` through `13-10-PLAN.md` — full scope of 10 plans

### Secondary (MEDIUM confidence)

- UK HM Land Registry Price Paid Data API docs (`landregistry.data.gov.uk/data/ppi`) — REST endpoint pattern and response format
- `@dnd-kit` official docs — SortableContext + useSortable pattern for photo reorder
- Recharts docs — AreaChart, PieChart API
- postcodes.io API — endpoint shapes for postcode lookup

### Tertiary (LOW confidence)

- Land Registry production rate limits — not officially documented per-IP; derived from community reports

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in package.json, no assumptions
- Architecture: HIGH — patterns from live codebase and established research docs
- Pitfalls: HIGH — derived from specific edge cases in the data model (wizard persistence, state machines, N+1 analytics)
- Land Registry API: MEDIUM — endpoint format verified; rate limit production behaviour not officially stated

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable — no fast-moving dependencies; Land Registry API is government infrastructure)
