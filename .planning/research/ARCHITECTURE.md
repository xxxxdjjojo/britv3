# Architecture Research: Buyer/Renter Dashboard — v3.1 Integration

**Domain:** Buyer/Renter Dashboard pages — Next.js 16 + Supabase App Router
**Researched:** 2026-03-13
**Confidence:** HIGH (verified from live codebase, not assumptions)

---

## Context: What Already Exists

This is a **subsequent milestone** on a partially-built app. The following is in production:

| Layer | What Exists | Status |
|-------|-------------|--------|
| Auth & middleware | `src/middleware.ts`, `src/app/(protected)/dashboard/[role]/layout.tsx` | LIVE — do not modify |
| Route shell | `dashboard/[role]/page.tsx` with `useDashboard()` hook, `DashboardShell`, role dispatch | LIVE — extend, don't rewrite |
| Dashboard service | `services/dashboard/dashboard-service.ts` — Redis-cached, role-based aggregation | LIVE — add methods |
| Dashboard types | `types/dashboard.ts` — `HomebuyerDashboard`, `RenterDashboard` as discriminated union | LIVE — extend types |
| Existing sub-pages | `/saved`, `/searches`, `/viewings`, `/offers`, `/documents`, `/applications`, `/tenancy` | EXIST but use **mock data** — need to be wired to real backend |
| Homebuyer component | `components/dashboard/homebuyer/HomebuyerDashboard.tsx` | EXISTS as stub |
| Renter component | `components/dashboard/renter/RenterDashboard.tsx` | EXISTS as stub |
| Recommendations | `services/recommendations/recommendations.ts` — SQL-based matching, no AI yet | LIVE |
| Saved properties | `services/saved/saved-properties-service.ts` | LIVE |
| Saved searches | `services/saved/saved-searches-service.ts` | LIVE |
| Activity log | `services/dashboard/dashboard-service.ts::getActivityLog()` | LIVE |

**Key finding:** The page scaffolding is real and renders correctly. The data layer underneath most buyer/renter sub-pages is mock/missing. The milestone is about wiring up real data, not rewriting structure.

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Vercel Edge / CDN                                  │
└──────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────────────────────────────────────────────┐
│              Next.js 16 App Router — (protected) Group                │
│                                                                       │
│  middleware.ts                                                        │
│    ↓ getUser() → role guard → /dashboard/[role] allowed               │
│                                                                       │
│  dashboard/[role]/layout.tsx (Server Component)                      │
│    ↓ verifies role via user_roles table, auto-grants if missing       │
│                                                                       │
│  dashboard/[role]/page.tsx ("use client")                            │
│    ↓ useDashboard() → GET /api/dashboard → Redis → Supabase          │
│    ↓ renders DashboardShell + StatCards + HomebuyerDashboard         │
│                                                                       │
│  Sub-pages (22 buyer/renter pages)                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ /viewings   │  │ /offers     │  │ /documents  │                  │
│  │ /saved      │  │ /searches   │  │ /applications│                 │
│  │ /ai-match   │  │ /referral   │  │ /checklist  │                  │
│  │ /alerts     │  │ /calculator │  │ /brokers    │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
│         │                │                │                          │
│    "use client"    Server Component   "use client"                   │
│    + TanStack Q    + direct Supabase  + Server Action                │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                      │
┌────────┴────────┐  ┌────────┴────────┐  ┌──────────┴──────────────┐
│   Supabase      │  │  Upstash Redis  │  │   Supabase Storage      │
│  PostgreSQL     │  │  (dashboard     │  │   (documents bucket)    │
│  + RLS          │  │   cache 5min)   │  │   (signed URLs)         │
└─────────────────┘  └─────────────────┘  └─────────────────────────┘
```

---

## Recommended Project Structure for New Pages

The existing `dashboard/[role]/` structure handles both homebuyer and renter via the same route. New feature pages follow the same pattern:

```
src/
├── app/
│   └── (protected)/
│       └── dashboard/
│           └── [role]/                  # EXISTING route group
│               ├── layout.tsx           # DO NOT MODIFY
│               ├── page.tsx             # DO NOT MODIFY (extend via child components)
│               ├── viewings/            # EXISTING — wire to real data
│               │   ├── page.tsx         # Convert from mock to Server Component
│               │   └── BookViewingModal.tsx  # NEW "use client" modal
│               ├── offers/              # EXISTING — wire to real data
│               │   ├── page.tsx         # Convert to Server Component
│               │   └── SubmitOfferForm.tsx   # NEW "use client" form
│               ├── documents/           # EXISTING — wire to real data
│               │   ├── page.tsx         # Keep "use client" for upload drag-drop
│               │   └── DocumentUploader.tsx  # NEW upload component
│               ├── ai-match/            # NEW — AI property matching
│               │   ├── page.tsx         # Server Component (fetch preferences)
│               │   └── MatchResults.tsx # "use client" (filter/sort interactions)
│               ├── alerts/              # NEW — notification settings
│               │   └── page.tsx         # "use client" (toggle switches)
│               ├── checklist/           # NEW — moving timeline
│               │   └── page.tsx         # "use client" (task completion state)
│               ├── calculator/          # NEW — affordability
│               │   └── page.tsx         # "use client" (reactive sliders)
│               ├── brokers/             # NEW — browse professionals
│               │   └── page.tsx         # Server Component (provider search)
│               └── referral/            # NEW — referral tracker
│                   └── page.tsx         # Server Component (read referral data)
│
├── components/
│   └── dashboard/
│       ├── homebuyer/
│       │   └── HomebuyerDashboard.tsx   # EXISTING stub — add real props
│       ├── renter/
│       │   └── RenterDashboard.tsx      # EXISTING stub — add real props
│       └── shared/                      # NEW — shared buyer/renter widgets
│           ├── ViewingCalendar.tsx      # Calendar state component
│           ├── OfferStatusBadge.tsx     # Offer state machine display
│           ├── DocumentVault.tsx        # Document list + upload trigger
│           └── ReferralProgress.tsx     # Referral step tracker
│
├── services/
│   ├── dashboard/
│   │   └── dashboard-service.ts        # EXISTING — add buildBuyerDashboard updates
│   ├── viewings/                        # NEW service
│   │   └── viewings-service.ts
│   ├── offers/                          # NEW service
│   │   └── offers-service.ts
│   ├── documents/                       # NEW service
│   │   └── buyer-documents-service.ts
│   ├── referrals/                       # NEW service
│   │   └── referral-service.ts
│   └── recommendations/
│       └── recommendations.ts          # EXISTING — upgrade to vector-based
│
├── hooks/                               # New client hooks
│   ├── useViewings.ts                   # NEW
│   ├── useOffers.ts                     # NEW
│   └── useAiMatch.ts                    # NEW
│
└── types/
    └── dashboard.ts                     # EXISTING — extend HomebuyerDashboard type
```

---

## Architectural Patterns for Each Feature Domain

### Pattern 1: Server Component + Supabase Direct (Preferred for read-heavy pages)

**What:** Server Component fetches data via `createClient()` directly from Supabase. No API route.
**When to use:** Static or infrequently updated read pages — Saved Properties, Brokers browse, Referral tracker, Document list.
**Trade-offs:** Fast initial load, no client JS overhead. Cannot be live-updated without a full re-render.

**Example (Saved Properties already uses this):**
```typescript
// dashboard/[role]/saved/page.tsx — already implemented correctly
export default async function SavedPropertiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const savedProperties = await getSavedProperties(supabase, user.id);
  return <SavedGrid items={savedProperties} />;
}
```

Apply this same pattern to: Referral tracker, Broker/Conveyancer browse, Offer history list.

---

### Pattern 2: "use client" + TanStack Query + API Route (For interactive or live-updated data)

**What:** Client component fetches from `/api/[resource]` route. TanStack Query handles caching, background refresh, and optimistic updates.
**When to use:** Pages where users take actions that change the displayed data — Viewings (reschedule/cancel), Offers (submit/withdraw), Moving checklist (check off tasks).
**Trade-offs:** More complex. Enables optimistic UI and real-time-ish refresh without full page reload.

**Example (pattern used by dashboard home):**
```typescript
// hooks/useViewings.ts
export function useViewings() {
  return useQuery({
    queryKey: ["viewings"],
    queryFn: () => fetch("/api/viewings/list").then(r => r.json()),
    staleTime: 60_000, // 1 min — viewings change less often than messages
  });
}

// For mutations — invalidate after action:
export function useCancelViewing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/viewings/${id}/cancel`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["viewings"] }),
  });
}
```

Apply this pattern to: Viewings page, Offers submit/withdraw, Moving checklist task completion.

---

### Pattern 3: Server Action for Mutations (Preferred over API routes for form submissions)

**What:** `"use server"` functions called directly from forms. No API route boilerplate.
**When to use:** Form submissions — Submit offer, Book viewing, Upload document metadata, Save preferences.
**Trade-offs:** Type-safe end-to-end, progressive enhancement. Not suitable for file uploads (multipart) — use Supabase Storage direct upload for those.

**Example:**
```typescript
// app/actions/viewings.ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function bookViewing(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("viewings").insert({
    user_id: user.id,
    listing_id: formData.get("listing_id"),
    scheduled_at: formData.get("scheduled_at"),
    viewing_type: formData.get("type"),
    status: "pending",
  });

  revalidatePath("/dashboard/homebuyer/viewings");
}
```

Apply to: Book viewing form, Submit offer form, Save AI match preferences.

---

### Pattern 4: Offer State Machine (Critical — drives offers sub-page)

**What:** Offers have a strict state machine. UI must reflect current state and only show valid transitions.
**States:** `draft → pending → (accepted | rejected | withdrawn | counter_offered) → (exchange | fallen_through)`

```
draft
  └─→ pending (submitted to seller)
        ├─→ accepted (seller accepts) ──→ exchange
        ├─→ rejected (seller rejects) ──→ [terminal]
        ├─→ withdrawn (buyer withdraws) ──→ [terminal]
        └─→ counter_offered ──→ pending (buyer responds)
```

**Implementation approach:** Store `status` and `status_updated_at` in `offers` table. Enforce state transitions server-side in the offers API route — never allow a client to write any status it wants. Log transitions to an `offer_status_history` table for audit trail.

**UI behavior:** The offers page (`offers/page.tsx`) currently renders static mock data. When wired up, show action buttons conditionally: "Withdraw" only when `pending`, "Accept Counter" only when `counter_offered`.

---

### Pattern 5: Viewing Calendar State

**What:** Viewings page needs calendar view and list view. Calendar state (selected date, view mode) is UI-only — it lives in component state, not the URL or server.
**Recommendation:** Keep calendar view state in `useState` within the page component. Fetch viewings server-side and pass down as props. Avoid putting `selectedDate` in the URL — it adds no shareability value for a private dashboard.

```
Server Component (page.tsx)
  ↓ fetches viewings from DB (upcoming + past, grouped by date)
  ↓ passes viewings[] as props
Client Component (ViewingsCalendar.tsx "use client")
  ↓ useState: { view: 'calendar' | 'list', selectedDate: Date | null }
  ↓ renders calendar grid using viewings[] — no additional fetches
```

**Calendar library decision:** Do not add a new calendar library. Build a lightweight grid using date-fns (already available) + Tailwind. A full `react-big-calendar` or `react-day-picker` adds 50-100KB for a feature that can be done with ~100 lines of grid CSS.

---

### Pattern 6: Document Upload via Supabase Storage

**What:** Buyers/renters upload ID, proof of funds, AIP to private storage bucket.
**Data flow:**
```
Client: file selected via <input type="file">
  ↓ validate (type, size) via src/lib/file-validation.ts (EXISTING)
  ↓ compress if image via src/lib/image-compression.ts (EXISTING)
  ↓ upload to Supabase Storage (buyer-documents/{user_id}/{filename})
  ↓ on success: POST /api/documents with { path, type, name }
  ↓ API route inserts row into user_documents table
  ↓ invalidate TanStack Query ["documents"]
```

**Storage bucket:** Create `buyer-documents` bucket with private access (RLS: owner only). Use Supabase signed URLs (1-hour expiry) for download links. Never expose raw Storage paths.

**The existing `/api/providers/documents/upload/route.ts`** handles provider document upload. The buyer document upload follows the same pattern but uses a different bucket and table.

---

### Pattern 7: AI Property Matching (Vector Similarity)

**What:** "AI Property Match" page shows properties matched to user's stated preferences using pgvector similarity.
**Current state:** `services/recommendations/recommendations.ts` uses SQL criteria matching (type, price, bedrooms) — zero AI cost, no vectors. This is production-ready for MVP.

**Upgrade path for full AI matching:**
```
User sets preferences (bedrooms, style, commute, lifestyle keywords)
  ↓ POST /api/ai/preferences — store in user_preferences table
  ↓ Supabase Edge Function: Claude generates embedding from preference text
  ↓ pgvector: SELECT ... ORDER BY embedding <=> user_embedding LIMIT 20
  ↓ GET /api/ai/match-results — returns ranked properties
  ↓ Client renders with match_reason strings
```

**Decision for v3.1:** Start with the existing SQL-based recommendations. The AI match preferences UI and results page should be built against the SQL engine. Swap to pgvector in a future iteration when property embeddings are populated.

**New table needed:** `user_property_preferences` — stores structured preferences (budget range, property type, preferred areas, lifestyle keywords, commute tolerance).

---

### Pattern 8: Referral Tracking

**What:** Users share a referral code. When referred users sign up and complete actions, referrer earns rewards.
**Data flow:**
```
Referrer: copies unique referral_code from dashboard
  ↓ Referred user visits /join?ref=XXXXX
  ↓ On signup: referral_conversions INSERT { referrer_id, referred_id, code }
  ↓ Background: track conversion events (signup, first_viewing, first_offer)
  ↓ Referral page: SELECT from referral_conversions WHERE referrer_id = me
```

**New tables needed:** `referral_codes` (one per user, auto-generated on registration), `referral_conversions` (tracks referred sign-ups and their milestone events).

**No new API routes needed for the read side.** The referral tracker page is a Server Component that reads from `referral_conversions`. The signup flow writes to `referral_conversions` via the existing auth service.

---

## New Database Tables Required

The following tables do not exist in current migrations and must be created:

| Table | Purpose | FK Dependencies |
|-------|---------|----------------|
| `viewings` | Viewing bookings (buyer/agent/virtual) | `user_id → profiles`, `listing_id → listings` |
| `offers` | Property purchase/rental offers | `user_id → profiles`, `listing_id → listings` |
| `offer_status_history` | Audit trail for state transitions | `offer_id → offers` |
| `rental_applications` | Formal rental application submissions | `user_id → profiles`, `listing_id → listings` |
| `user_documents` | Buyer/renter uploaded documents (ID, AIP, etc.) | `user_id → profiles` |
| `user_property_preferences` | AI match preferences (budget, type, area, lifestyle) | `user_id → profiles` |
| `moving_checklist_items` | Per-user moving/buying task completion | `user_id → profiles` |
| `referral_codes` | Unique code per user for referral program | `user_id → profiles` |
| `referral_conversions` | Tracks referred sign-ups and milestones | `referrer_id → profiles`, `referred_id → profiles` |
| `property_alerts` | Alert rules per saved search (frequency, channel) | `user_id → profiles`, `saved_search_id → saved_searches` |

**Tables that already exist and just need wiring:**
- `saved_properties` — LIVE, used by saved page
- `saved_searches` — LIVE, used by searches page
- `conversations`, `messages` — LIVE, inbox already built
- `activity_log` — LIVE, partitioned by month
- `tenancies` — LIVE, used by tenancy page

---

## New API Routes Required

The following API routes must be created (beyond what currently exists):

| Route | Method | Purpose | Caching |
|-------|--------|---------|---------|
| `GET /api/viewings/list` | GET | Paginated viewings for current user | TanStack Query 60s |
| `POST /api/viewings/book` | POST | Create new viewing request | Invalidate viewings |
| `POST /api/viewings/[id]/reschedule` | POST | Update viewing datetime | Invalidate viewings |
| `POST /api/viewings/[id]/cancel` | POST | Cancel viewing | Invalidate viewings |
| `GET /api/offers/list` | GET | All offers for current user | TanStack Query 30s |
| `POST /api/offers/submit` | POST | Submit new offer | Invalidate offers |
| `POST /api/offers/[id]/withdraw` | POST | Withdraw pending offer | Invalidate offers |
| `GET /api/documents/list` | GET | User's document vault | TanStack Query 60s |
| `POST /api/documents` | POST | Register uploaded document metadata | Invalidate docs |
| `DELETE /api/documents/[id]` | DELETE | Remove document record + Storage file | Invalidate docs |
| `GET /api/ai/preferences` | GET | User's AI match preferences | TanStack Query |
| `POST /api/ai/preferences` | POST | Save/update preferences | Invalidate matches |
| `GET /api/ai/match-results` | GET | Recommended properties for user | TanStack Query 5min |
| `GET /api/referral/status` | GET | Referral code + conversion stats | Server Component |
| `GET /api/alerts` | GET | Property alert settings | TanStack Query |
| `POST /api/alerts` | POST | Create/update alert rule | Invalidate alerts |
| `GET /api/checklist` | GET | Moving checklist state | TanStack Query |
| `POST /api/checklist/[id]/complete` | POST | Mark task complete | Invalidate checklist |

**Reuse existing routes where possible:**
- Messages: `/api/messages` — EXISTING, used by inbox
- Saved properties: `/api/saved/properties` — EXISTING
- Saved searches: `/api/saved/searches` — EXISTING
- Provider search for broker browse: `/api/providers/search` — EXISTING (filter by category)
- Dashboard data: `/api/dashboard` — EXISTING (extend for new fields)

---

## Data Flow for Each Feature

### Viewing Schedule Flow

```
ViewingsPage (Server Component preferred, or TanStack Query)
  ↓
GET /api/viewings/list
  ↓
viewings-service.ts::getViewings(userId, { upcoming: true })
  ↓
Supabase: SELECT v.*, l.title, l.address FROM viewings v
          JOIN listings l ON v.listing_id = l.id
          WHERE v.user_id = userId AND v.status != 'cancelled'
          ORDER BY v.scheduled_at ASC
  ↓ returns ViewingWithListing[]
  ↓
Client: renders calendar grid (date-fns) + list view toggle
Button "Reschedule" → POST /api/viewings/[id]/reschedule → invalidate query
Button "Cancel" → POST /api/viewings/[id]/cancel → invalidate query
```

**Calendar state management:** `useState` in `ViewingCalendar.tsx`. Selected date filters the already-fetched viewings array — no additional network requests.

### Offer Tracking Flow

```
OffersPage (Server Component for initial load)
  ↓
Supabase direct: SELECT o.*, l.title, l.price FROM offers o
                 JOIN listings l ON o.listing_id = l.id
                 WHERE o.buyer_id = userId
                 ORDER BY o.created_at DESC
  ↓ renders OfferRow with OfferStatusBadge (derived from status field)
  ↓
SubmitOfferForm ("use client" modal)
  → POST /api/offers/submit
  → validates: amount > 0, listing exists, user not already has pending offer
  → INSERT into offers
  → INSERT into offer_status_history { status: 'pending' }
  → revalidatePath("/dashboard/homebuyer/offers")
```

**State machine enforcement:** API route (not client) validates that status transitions are legal. Client never writes `status` directly — only calls named actions (submit, withdraw, accept-counter).

### AI Property Match Flow

```
AiMatchPage (Server Component)
  ↓
getUserPreferences(userId) → user_property_preferences
  ↓ if no preferences → render PreferencesForm
  ↓ if preferences exist → render match results

Match results (TanStack Query client):
  GET /api/ai/match-results
  ↓ recommendations.ts::getRecommendations(userId) — SQL-based in v3.1
  ↓ returns PropertyRecommendation[] with match_score
  ↓ renders PropertyMatchCard with score badge

Save preferences:
  POST /api/ai/preferences → updates user_property_preferences
  → invalidateQueries(["ai-match-results"])
```

### Document Upload Flow

```
DocumentsPage ("use client" — needs drag-drop)
  ↓
1. User selects file
2. validateFile(file) from src/lib/file-validation.ts (EXISTING)
3. If image: compressImage(file) from src/lib/image-compression.ts (EXISTING)
4. supabase.storage.from("buyer-documents").upload(path, file)
   path = `${userId}/${Date.now()}_${filename}`
5. On success: POST /api/documents { path, type, name, size }
6. API route: INSERT into user_documents + invalidate TanStack cache

Download:
  GET /api/documents/[id]/signed-url
  → supabase.storage.from("buyer-documents").createSignedUrl(path, 3600)
  → return { url } with 1h expiry
```

### Referral Tracking Flow

```
ReferralPage (Server Component — static read)
  ↓
const supabase = await createClient()
const code = await getReferralCode(supabase, userId)        -- referral_codes
const conversions = await getReferralConversions(supabase, userId)  -- referral_conversions
  ↓
renders: referral link, share buttons, conversion table
  [user X signed up via your link — Signed Up / Viewed Property / Made Offer]
```

**No real-time subscription needed.** Referral data is low-velocity. Server Component with `revalidate = 300` is sufficient.

---

## Integration Points: What Changes vs. What Is New

### MODIFY (existing files, add behavior)

| File | Change |
|------|--------|
| `types/dashboard.ts` | Extend `HomebuyerDashboard` to include `ai_match_count`, `pending_offers_count`, `referral_conversion_count`; extend `RenterDashboard` similarly |
| `services/dashboard/dashboard-service.ts` | Add queries to `buildHomebuyerDashboard()` and `buildRenterDashboard()` for new stat fields |
| `components/dashboard/homebuyer/HomebuyerDashboard.tsx` | Wire to actual `HomebuyerDashboard` data type, render real counts |
| `components/dashboard/renter/RenterDashboard.tsx` | Same as above |

### CONVERT (mock data → real backend)

| File | Action |
|------|--------|
| `dashboard/[role]/viewings/page.tsx` | Replace static arrays with Server Component data fetch |
| `dashboard/[role]/offers/page.tsx` | Replace static arrays with TanStack Query or Server Component |
| `dashboard/[role]/documents/page.tsx` | Wire to user_documents table + Supabase Storage upload |
| `dashboard/[role]/applications/page.tsx` | Wire to rental_applications table |
| `dashboard/[role]/searches/page.tsx` | Wire to saved_searches (already partially done via hooks) |

### CREATE NEW (net new files)

| File | Type | Purpose |
|------|------|---------|
| `dashboard/[role]/ai-match/page.tsx` | Server + Client hybrid | AI preferences + match results |
| `dashboard/[role]/alerts/page.tsx` | Client Component | Notification alert settings |
| `dashboard/[role]/checklist/page.tsx` | Client Component | Moving/buying checklist |
| `dashboard/[role]/calculator/page.tsx` | Client Component | Affordability calculator |
| `dashboard/[role]/brokers/page.tsx` | Server Component | Browse mortgage brokers/conveyancers |
| `dashboard/[role]/referral/page.tsx` | Server Component | Referral tracker |
| `services/viewings/viewings-service.ts` | Service | Viewing CRUD + state transitions |
| `services/offers/offers-service.ts` | Service | Offer state machine enforcement |
| `services/documents/buyer-documents-service.ts` | Service | Document vault CRUD |
| `services/referrals/referral-service.ts` | Service | Referral code + conversions |
| `hooks/useViewings.ts` | Hook | TanStack Query wrapper for viewings |
| `hooks/useOffers.ts` | Hook | TanStack Query wrapper for offers |
| `hooks/useAiMatch.ts` | Hook | TanStack Query wrapper for AI match results |
| `supabase/migrations/20260313_buyer_renter_tables.sql` | Migration | All new tables for this milestone |

---

## Build Order — Dependency Graph

Build in this order to minimize blocked work and ensure each step is immediately testable:

```
Step 1: Database migration (all new tables)
  Creates: viewings, offers, offer_status_history, rental_applications,
           user_documents, user_property_preferences, moving_checklist_items,
           referral_codes, referral_conversions, property_alerts
  RLS: owner-only read/write on all tables
  Unblocks: everything below

Step 2: Service layer for each domain
  viewings-service.ts — no dependencies except step 1
  offers-service.ts — no dependencies except step 1
  buyer-documents-service.ts — depends on Supabase Storage bucket (create alongside)
  referral-service.ts — no dependencies except step 1
  Unblocks: API routes and page wiring

Step 3: Wire existing pages (highest impact, lowest risk)
  /saved, /searches — already partially wired, polish
  /viewings — convert from mock to real viewings-service
  /offers — convert from mock to real offers-service
  /documents — wire Storage upload + buyer-documents-service
  /applications — wire rental_applications table
  Unblocks: integration tests on core flows

Step 4: Build new pages (no pre-existing scaffold)
  /ai-match — depends on user_property_preferences (step 1) + recommendations service
  /alerts — depends on property_alerts table (step 1)
  /referral — depends on referral tables (step 1)
  /brokers — reuses existing /api/providers/search, filter by category
  /checklist — depends on moving_checklist_items (step 1)
  /calculator — pure client UI, no backend dependency (build any time)
  Unblocks: nothing (terminal nodes)

Step 5: Dashboard home stat card updates
  Extend HomebuyerDashboard/RenterDashboard types
  Update buildHomebuyerDashboard() / buildRenterDashboard()
  Depends on: steps 1-3 so stat counts reflect real data
```

**Start with the calculator page** if you need early wins — it's purely client-side math with no backend dependency and can be built and tested independently at any point.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fetching from API routes in Server Components

**What people do:** Call `fetch("/api/viewings/list")` inside a Server Component.
**Why it's wrong:** Makes a localhost HTTP round-trip inside the server. Just call the service function directly: `await getViewings(supabase, userId)`.
**Do this instead:** Server Components call service functions directly. API routes exist only for Client Components (via hooks) and external webhooks.

### Anti-Pattern 2: Using the dashboard cache for sub-page data

**What people do:** Stuff viewing/offer arrays into the Redis-cached `/api/dashboard` response.
**Why it's wrong:** Dashboard cache is 5 minutes. Viewing confirmations and offer status changes need near-real-time accuracy. Stale offer status is a critical UX failure.
**Do this instead:** Dashboard home only caches summary counts (`upcoming_viewings_count: 3`). Sub-pages fetch full data with shorter or no caching.

### Anti-Pattern 3: Storing offer status on the client

**What people do:** Allow `useState` to track offer status after a mutation, without revalidating from the server.
**Why it's wrong:** Another browser tab or a seller action could change the status. Client state diverges from truth.
**Do this instead:** After every mutation, invalidate the TanStack Query cache for offers. The server is the source of truth.

### Anti-Pattern 4: Unrestricted Storage uploads

**What people do:** Create a `buyer-documents` bucket with public access and store files at predictable paths.
**Why it's wrong:** Exposes user identity documents to unauthenticated requests.
**Do this instead:** Private bucket, RLS policy `(bucket_id = 'buyer-documents' AND auth.uid()::text = (storage.foldername(name))[1])`. Serve via 1-hour signed URLs only.

### Anti-Pattern 5: Building the AI match page against live Claude API

**What people do:** Wire the preferences form directly to Claude on every preferences update.
**Why it's wrong:** API cost is unbounded. Every preference save triggers an embedding generation call.
**Do this instead:** Queue embedding generation as a background job. User sees SQL-based matches immediately; AI-enhanced matches appear async once the embedding pipeline runs.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–5k users | Current monolith + Redis cache is sufficient. No changes needed. |
| 5k–50k users | Add materialized views for dashboard counts. Move offer status machine to Supabase Edge Function to offload API server. |
| 50k+ users | Partition `offers` and `viewings` tables by `created_at` (monthly, same as `activity_log`). Supabase dedicated compute add-on. |

### Scaling Priorities

1. **First bottleneck:** The `/api/dashboard` route runs 4-6 parallel Supabase queries per request. Redis caching (already implemented, 5min TTL) handles this until ~10k DAU. Beyond that, switch to materialized views.
2. **Second bottleneck:** AI embedding generation if activated at scale. Batch nightly instead of per-preference-save.

---

## Sources

- Live codebase inspection (HIGH confidence): `src/services/dashboard/dashboard-service.ts`, `src/app/(protected)/dashboard/[role]/`, `src/middleware.ts`, `src/types/dashboard.ts`, `supabase/migrations/*.sql`
- Existing patterns verified: Redis caching pattern, TanStack Query usage, Server Component + direct Supabase fetch, Supabase Storage upload (`src/lib/upload/`, `/api/providers/documents/upload/route.ts`)
- Architectural decisions from `.planning/research/ARCHITECTURE.md` (prior session, 2026-03-06) — HIGH confidence, written before first code committed

---

*Architecture research for: Britestate v3.1 Buyer/Renter Dashboard*
*Researched: 2026-03-13*
*Confidence: HIGH — derived from live codebase, not assumptions*
