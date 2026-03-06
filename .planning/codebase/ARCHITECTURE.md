# Architecture

**Analysis Date:** 2026-03-06

## Pattern Overview

**Overall:** Next.js App Router monolith with Supabase BaaS (Backend-as-a-Service)

**Current State:** The codebase is a freshly scaffolded Next.js 16 project (`create-next-app`). The `docs/` directory contains extensive PRD and project memory documents describing the full target architecture for "Britestate" -- a UK property portal. All architectural guidance below reflects the intended build-out defined in those planning docs.

**Key Characteristics:**
- Server-first React with Next.js App Router (Server Components by default, `"use client"` opt-in)
- Supabase for auth, PostgreSQL database, real-time subscriptions, and file storage
- Service layer pattern separating business logic from UI components
- Role-based architecture supporting 7 user roles (homebuyer, renter, seller, landlord, agent, service_provider, admin)
- AI integration via Anthropic Claude SDK + local embeddings with pgvector
- Stripe Connect marketplace payments

## Layers

**Presentation Layer (App Router):**
- Purpose: Route handling, page rendering, layouts
- Location: `src/app/`
- Contains: Pages (`page.tsx`), layouts (`layout.tsx`), loading states, error boundaries
- Depends on: Components, Hooks, Services
- Used by: End users via browser

**Component Layer:**
- Purpose: Reusable React UI elements
- Location: `src/components/`
- Contains: UI primitives (`ui/`), feature components (`properties/`, `auth/`, `dashboard/`, `marketplace/`, `navigation/`)
- Depends on: Hooks, Types, UI library (Shadcn/Radix)
- Used by: App Router pages

**Hook Layer:**
- Purpose: Encapsulate stateful logic and side effects
- Location: `src/hooks/`
- Contains: Custom React hooks (e.g., `useAuth`, `usePropertySearch`)
- Depends on: Services, Contexts
- Used by: Client Components

**Context Layer:**
- Purpose: Global/shared React state
- Location: `src/contexts/`
- Contains: React Context providers (auth state, theme, etc.)
- Depends on: Services
- Used by: Components, Hooks

**Service Layer:**
- Purpose: Business logic, external API calls, data transformation
- Location: `src/services/`
- Contains: Domain-organized services (`auth/`, `properties/`, `marketplace/`, `messaging/`, `payments/`, `ai/`, `analytics/`)
- Depends on: Lib (Supabase clients), Types
- Used by: Hooks, API routes, Server Components

**Library Layer:**
- Purpose: Shared utilities, SDK clients, configuration
- Location: `src/lib/`
- Contains: Supabase client factories (`supabase/server.ts`, `supabase/client.ts`), utility libraries
- Depends on: External SDKs
- Used by: Services, API routes

**API Layer:**
- Purpose: REST API endpoints, webhook handlers
- Location: `src/app/api/`
- Contains: Route handlers (`route.ts`), versioned API (`v1/`), webhooks
- Depends on: Services, Lib
- Used by: Client-side fetches, external services (Stripe webhooks)

**Type Layer:**
- Purpose: TypeScript type definitions shared across the codebase
- Location: `src/types/`
- Contains: Domain types (`Property`, `User`, etc.), API types, form types
- Depends on: Nothing
- Used by: All other layers

**Database Layer:**
- Purpose: Schema definitions and migrations
- Location: `supabase/migrations/`
- Contains: SQL migration files (204 migrations, 266 tables)
- Depends on: Nothing (managed by Supabase CLI)
- Used by: PostgreSQL via Supabase

## Data Flow

**Property Search Flow:**

1. User interacts with search UI in `src/components/properties/SearchFilters.tsx`
2. Hook `src/hooks/usePropertySearch.ts` manages state and triggers search
3. Service `src/services/properties/search-service.ts` builds query
4. For AI search: `src/services/ai/embedding-service.ts` generates vector, queries pgvector
5. Supabase client in `src/lib/supabase/` executes database query
6. Results flow back through service -> hook -> component rendering in `src/components/properties/PropertyGrid.tsx`

**Authentication Flow:**

1. User submits credentials via `src/components/auth/LoginForm.tsx`
2. API route `src/app/api/auth/login/route.ts` processes request
3. Service `src/services/auth/auth-service.ts` calls Supabase Auth
4. Session stored in Supabase, cookie set for SSR
5. Auth context `src/contexts/` provides session to client components
6. Protected routes in `src/app/(protected)/` check auth via middleware

**Marketplace Booking Flow:**

1. User creates RFQ via `src/components/marketplace/QuoteForm.tsx`
2. API route `src/app/api/v1/marketplace/rfq/route.ts` handles creation
3. Service `src/services/marketplace/rfq-service.ts` stores in database
4. Providers notified via `src/services/messaging/notification-service.ts`
5. Provider submits quote through `src/services/marketplace/quote-service.ts`
6. Booking created via `src/services/marketplace/booking-service.ts`
7. Payment processed through `src/services/payments/stripe-service.ts` (Stripe Connect)

**State Management:**
- Server state: React Server Components fetch data directly via Supabase
- Client state: React Context for auth/session, component-level `useState`/`useReducer`
- Async state: `@tanstack/react-query` for client-side data fetching and caching
- Real-time: Supabase real-time subscriptions for messaging

## Key Abstractions

**Supabase Client Factory:**
- Purpose: Provide correctly scoped Supabase clients for server vs client contexts
- Examples: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`
- Pattern: Factory functions returning typed Supabase clients with appropriate auth context

**Domain Services:**
- Purpose: Encapsulate all business logic for a domain area
- Examples: `src/services/properties/property-service.ts`, `src/services/marketplace/rfq-service.ts`
- Pattern: Stateless service classes/modules with methods for CRUD and business operations

**Route Groups:**
- Purpose: Organize routes by access level without affecting URL structure
- Examples: `src/app/(auth)/`, `src/app/(main)/`, `src/app/(protected)/`
- Pattern: Next.js route groups with shared layouts and middleware guards

**Role-Based Dashboards:**
- Purpose: Separate dashboard experiences per user role
- Examples: `src/app/dashboard/homebuyer/`, `src/app/dashboard/agent/`, `src/app/dashboard/provider/`
- Pattern: Nested routes under `/dashboard/[role]/` with role-specific layouts and widgets

## Entry Points

**Application Root:**
- Location: `src/app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Root HTML structure, font loading (Geist Sans/Mono), global CSS, context providers

**Homepage:**
- Location: `src/app/page.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Landing page render (currently scaffold placeholder)

**API Routes:**
- Location: `src/app/api/*/route.ts`
- Triggers: HTTP requests from client or external services
- Responsibilities: Request validation, service delegation, response formatting

**Webhook Handlers:**
- Location: `src/app/api/webhooks/route.ts`
- Triggers: External service callbacks (Stripe payment events, etc.)
- Responsibilities: Signature verification, event processing, side effects

**Background Workers:**
- Location: `workers/`
- Triggers: Scheduled tasks, queue processing
- Responsibilities: Embedding generation, batch analytics, cleanup jobs

## Error Handling

**Strategy:** Layered error handling with Next.js error boundaries and API-level try/catch

**Patterns:**
- Use Next.js `error.tsx` files per route segment for UI error boundaries
- API routes return structured JSON errors with appropriate HTTP status codes
- Services throw typed errors caught by API route handlers
- Circuit breaker pattern for AI service calls (fallback from Claude to DeepSeek)
- Supabase RLS provides database-level access control as a security backstop

## Cross-Cutting Concerns

**Logging:** Sentry for error tracking in production; `console` in development
**Validation:** TypeScript strict mode at compile time; runtime validation in API routes
**Authentication:** Supabase Auth with session cookies; middleware guards on `(protected)` routes
**Authorization:** Row-Level Security (RLS) policies on every Supabase table; role checks in API routes
**Analytics:** PostHog for product analytics; custom behavioral analytics via `src/services/analytics/`
**Rate Limiting:** Upstash Redis for API rate limiting
**Email:** Resend for transactional emails

---

*Architecture analysis: 2026-03-06*
