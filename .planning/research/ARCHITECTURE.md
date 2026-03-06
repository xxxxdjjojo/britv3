# Architecture Research: UK Property Portal

**Project:** Britestate v3.0
**Confidence:** HIGH

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CDN / Edge (Vercel)                          │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                 Next.js 16 App Router                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ Server       │ │ API Routes   │ │ Server Actions           │ │
│  │ Components   │ │ (webhooks)   │ │ (mutations)              │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ Client       │ │ Middleware   │ │ Route Handlers           │ │
│  │ Components   │ │ (auth guard) │ │ (Stripe webhooks)        │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │                    │                      │
┌────────┴────────┐  ┌───────┴────────┐  ┌──────────┴──────────┐
│   Supabase      │  │ External APIs  │  │  Background Jobs    │
│  ┌───────────┐  │  │ ┌────────────┐ │  │ ┌────────────────┐  │
│  │ Auth      │  │  │ │ Stripe     │ │  │ │ Edge Functions │  │
│  │ PostgreSQL│  │  │ │ MapTiler   │ │  │ │ (webhooks,     │  │
│  │ Realtime  │  │  │ │ Claude AI  │ │  │ │  email, AI)    │  │
│  │ Storage   │  │  │ │ Resend     │ │  │ └────────────────┘  │
│  │ pgvector  │  │  │ │ PostHog    │ │  └─────────────────────┘
│  │ PostGIS   │  │  │ │ Sentry     │ │
│  └───────────┘  │  │ └────────────┘ │
└─────────────────┘  └────────────────┘
```

## Component Architecture

### Layer 1: Routing & Auth (Epic 1)

**Next.js App Router Structure:**
```
src/app/
├── (auth)/                    # Auth group (no dashboard layout)
│   ├── login/
│   ├── register/
│   ├── verify/
│   └── reset-password/
├── (marketing)/               # Public pages (marketing layout)
│   ├── page.tsx               # Landing page
│   ├── about/
│   ├── pricing/
│   └── contact/
├── (dashboard)/               # Protected pages (dashboard layout)
│   ├── layout.tsx             # Sidebar + role-aware navigation
│   ├── homebuyer/
│   ├── renter/
│   ├── seller/
│   ├── landlord/
│   ├── agent/
│   ├── provider/
│   └── admin/
├── api/
│   ├── webhooks/
│   │   ├── stripe/
│   │   └── supabase/
│   └── ai/
├── layout.tsx                 # Root layout (providers, fonts)
└── middleware.ts              # Auth guard, role routing
```

**Key Pattern:** Route groups `(auth)`, `(marketing)`, `(dashboard)` share different layouts without affecting URL structure.

### Layer 2: Data Access

**Supabase Client Strategy:**
```
src/lib/supabase/
├── client.ts          # Browser client (createBrowserClient)
├── server.ts          # Server Component client (createServerClient with cookies)
├── middleware.ts       # Middleware client (for auth refresh)
├── admin.ts           # Service role client (for webhooks, admin operations)
└── types.ts           # Generated types from database schema
```

**Data Flow:**
1. Server Components → `createServerClient()` → direct Supabase queries (no API layer needed)
2. Client Components → TanStack Query → `createBrowserClient()` → Supabase queries
3. Mutations → Server Actions → `createServerClient()` → Supabase mutations
4. Webhooks → API Routes → `createServiceRoleClient()` → bypass RLS

### Layer 3: Shared Logic

```
src/lib/
├── supabase/          # Supabase clients (above)
├── stripe/            # Stripe client, helpers
├── ai/                # Claude AI client, prompt templates
├── validators/        # Zod schemas (shared client/server)
├── constants/         # App-wide constants, enums
├── utils/             # Pure utility functions
└── hooks/             # Shared React hooks
```

### Layer 4: UI Components

```
src/components/
├── ui/                # shadcn/ui primitives (button, dialog, input, etc.)
├── forms/             # Reusable form components (property form, RFQ form)
├── layouts/           # Layout components (sidebar, header, footer)
├── maps/              # MapLibre components (map, markers, clusters)
├── property/          # Property-specific (card, gallery, details)
├── marketplace/       # Marketplace components (provider card, quote)
├── messaging/         # Chat components (conversation, message bubble)
├── dashboard/         # Dashboard widgets (stats card, chart, activity feed)
└── shared/            # Cross-feature (avatar, rating, badge, empty state)
```

## Database Architecture

### Schema Organization (266 Tables)

**Approach:** Prefix-based naming within public schema (Supabase default).

| Domain | Prefix | Example Tables | Epic |
|--------|--------|---------------|------|
| Auth/Users | `user_` | `user_profiles`, `user_roles`, `user_preferences` | 1 |
| Properties | `prop_` | `prop_listings`, `prop_media`, `prop_features`, `prop_embeddings` | 2 |
| Search | `search_` | `search_saved`, `search_alerts` | 2 |
| Marketplace | `mkt_` | `mkt_providers`, `mkt_rfqs`, `mkt_quotes`, `mkt_bookings` | 4 |
| Communication | `msg_` | `msg_conversations`, `msg_messages`, `msg_notifications` | 5 |
| AI | `ai_` | `ai_recommendations`, `ai_embeddings`, `ai_valuations` | 6 |
| Landlord | `ll_` | `ll_tenants`, `ll_maintenance`, `ll_compliance` | 7 |
| Financial | `fin_` | `fin_calculations`, `fin_reports` | 8 |
| Transactions | `txn_` | `txn_offers`, `txn_documents`, `txn_timeline` | 10 |
| Admin | `admin_` | `admin_audit_log`, `admin_moderation`, `admin_tickets` | 10 |
| Analytics | `evt_` | `evt_page_views`, `evt_search_events`, `evt_conversions` | 11 |

### RLS Architecture

**Central Pattern:**
```sql
-- Helper function used by all RLS policies
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text AS $$
  SELECT coalesce(
    auth.jwt() -> 'app_metadata' ->> 'active_role',
    'anonymous'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Example policy pattern
CREATE POLICY "Users read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Agents read their listings"
  ON prop_listings FOR SELECT
  USING (
    agent_id = auth.uid()
    OR status = 'active'  -- Public listings visible to all
  );
```

**Key Rules:**
- Never JOIN other tables inside RLS policies (performance killer)
- Store role in JWT claims, not looked up per query
- Use `SECURITY DEFINER` functions for cross-table checks
- Index all columns referenced in RLS WHERE clauses

### Migration Strategy

**Foundational Migrations (Epic 1):**
- All core tables created upfront with proper types and constraints
- Domain tables stubbed with essential columns
- Indexes and RLS policies added per epic

**Per-Epic Migrations:**
- Add columns and constraints for that epic's features
- Add RLS policies for new access patterns
- Add indexes for new query patterns
- Never ALTER TABLE destructively — add, don't modify

## Data Flow Patterns

### Property Search Flow
```
User types query
  → Client: debounced input → URL params (nuqs)
  → Server Component: reads params → Supabase query with filters
  → PostgreSQL: PostGIS for location, pgvector for semantic, full-text for keywords
  → Server Component: renders property cards
  → Client: MapLibre displays pins from same data
```

### Real-Time Messaging Flow
```
User sends message
  → Client: Server Action → insert into msg_messages
  → Supabase Realtime: broadcasts to conversation channel
  → Other participants: receive via useEffect subscription
  → Notification: Edge Function triggers email via Resend (if offline)
```

### Stripe Connect Payment Flow
```
Customer books service
  → Server Action: create Stripe PaymentIntent (direct charge to provider)
  → Client: Stripe.js handles payment UI
  → Stripe webhook: payment_intent.succeeded
  → API Route: update booking status, trigger notification
  → Provider: receives payout (minus 2.5% platform fee)
```

### AI Recommendation Flow
```
User interacts with properties (save, view, search)
  → Event logged to analytics tables
  → Background job: compute user embedding from behavior
  → pgvector: similarity search against property embeddings
  → TanStack Query: fetch recommendations on dashboard load
  → Client: display with match scores and explanations
```

## Build Order (Dependency-Driven)

```
Phase 1: Foundation
├── Epic 1: Auth + database foundation + RLS patterns
│   (Everything depends on this)
│
Phase 2: Core Product
├── Epic 2: Property search + listings
│   (Depends on: Epic 1 for auth, creates core data model)
├── Epic 5: Communication
│   (Depends on: Epic 1 for auth, Epic 2 for property inquiries)
│
Phase 3: Dashboards & AI
├── Epic 3: Role-specific dashboards
│   (Depends on: Epics 1-2 for data to display)
├── Epic 6: AI features
│   (Depends on: Epic 2 for property data + embeddings)
│
Phase 4: Marketplace & Finance
├── Epic 4: Service marketplace + Stripe Connect
│   (Depends on: Epic 1 for provider auth, Epic 3 for provider dashboard)
├── Epic 8: Financial tools
│   (Depends on: Epic 2 for property data)
│
Phase 5: Professional Tools
├── Epic 7: Landlord tools
│   (Depends on: Epics 1-3 for landlord dashboard, Epic 4 for contractor integration)
│
Phase 6: Polish & Production
├── Epic 9: Mobile/PWA
│   (Can overlay on top of any completed epic)
├── Epic 10: Admin panel
│   (Needs data from Epics 1-8 to manage)
├── Epic 11: Compliance & monitoring
│   (GDPR consent starts in Epic 1, full compliance wraps up here)
```

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| App Router over Pages Router | Server Components for data fetching, Streaming SSR, Server Actions |
| No API layer for reads | Server Components query Supabase directly — simpler, faster |
| Server Actions for mutations | Type-safe mutations without custom API routes |
| API Routes only for webhooks | External services (Stripe, Supabase) need stable URL endpoints |
| Single database, prefixed tables | Supabase manages one PostgreSQL instance — schemas add complexity |
| JWT claims for authorization | Performance — no DB lookup per request for role checks |
| TanStack Query for client data | Caching, background refetch, optimistic updates — not reimplemented |
| Zustand for UI state only | Lightweight — server state belongs in TanStack Query |

---
*Research completed: 2026-03-06*
