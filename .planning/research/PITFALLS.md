# Pitfalls Research: UK Property Portal

**Project:** Britestate v3.0
**Confidence:** HIGH (informed by v2.0 failure patterns)

## Critical Pitfalls

### 1. RLS Performance Collapse at Scale

**Severity:** CRITICAL
**Phase:** Epic 1 (Foundation)

**The Problem:** With 266 tables and 7 roles, every query passes through RLS policies. Poorly written policies (table joins, subqueries) turn simple queries into full table scans. v2.0 documented this as a SPOF.

**Warning Signs:**
- Query times increasing as data grows
- `pg_stat_statements` showing high planning time
- Dashboard load times exceeding 2s

**Prevention:**
- Store active role in JWT custom claims (`app_metadata.active_role`)
- NEVER join other tables inside RLS policies
- Use `SECURITY DEFINER` helper functions for cross-table checks
- Index every column referenced in RLS WHERE clauses
- Use materialized views for dashboard aggregations (bypass RLS)
- Enable `pg_stat_statements` from day one to monitor

### 2. Migration Explosion (204-Migration Problem)

**Severity:** HIGH
**Phase:** Epic 1 (Foundation)

**The Problem:** v2.0 accumulated 204 migration files with destructive ALTER TABLE statements. Later epics broke earlier migrations. Rolling back became impossible.

**Warning Signs:**
- Migration count growing faster than features
- ALTER TABLE DROP COLUMN in migrations
- Migrations referencing tables from other epics
- Migration conflicts during parallel development

**Prevention:**
- Define ALL 266 tables in foundational migrations (Epic 1) with essential columns
- Later epics ADD columns, ADD indexes, ADD RLS policies — never drop/modify
- Use numbered prefix convention: `001_foundation/`, `002_properties/`, etc.
- Run `supabase db reset` in CI to verify full migration chain works
- Never hand-edit migration files after they've been applied

### 3. Stripe Connect Onboarding Blocking Marketplace

**Severity:** HIGH
**Phase:** Epic 4 (Marketplace)

**The Problem:** If providers must complete full Stripe KYC before being visible in the marketplace, onboarding friction kills adoption. Marketplace appears empty.

**Warning Signs:**
- Provider signup → immediate "complete payment setup" wall
- Low provider count in marketplace
- High provider signup abandonment

**Prevention:**
- Decouple provider VISIBILITY from payment READINESS
- Providers visible in marketplace after basic verification (email + phone)
- Stripe Connect onboarding triggered only when first quote is accepted
- Use Standard Connect accounts (provider manages own Stripe dashboard)
- Show clear status: "This provider is setting up payments" vs blocking entirely

### 4. Multi-Role Auth Complexity

**Severity:** HIGH
**Phase:** Epic 1 (Foundation)

**The Problem:** v2.0 Epic 1 security audit scored multi-role authorization 9/10 severity. Multiple places checking roles (RLS, middleware, UI) diverge over time. Users see data from wrong role context.

**Warning Signs:**
- Role check logic duplicated in 3+ locations
- UI shows data from a different role than expected
- RLS policies using different role-checking logic than middleware

**Prevention:**
- Single permissions matrix: one source of truth for "role X can do Y on resource Z"
- JWT custom claims store active role — used by RLS, middleware, and UI
- `auth.user_role()` helper function used by ALL RLS policies
- Next.js middleware validates role claim on every protected route
- Client-side role context from Zustand — synced with JWT on role switch
- Role switch = new JWT issued with updated `active_role` claim

### 5. Connection Pool Exhaustion

**Severity:** HIGH
**Phase:** Epic 1 (Foundation)

**The Problem:** v2.0 identified connection pool exhaustion at 500 concurrent users as a SPOF. Supabase has connection limits per plan. Serverless functions (API routes, Server Actions) each consume connections.

**Warning Signs:**
- "too many connections" errors in production logs
- Intermittent 500 errors under moderate load
- Slow query performance during peak usage

**Prevention:**
- Use Supavisor (Supabase's built-in connection pooler) in transaction mode
- Single Supabase client per request — never create multiple
- Redis caching (Upstash) for frequently accessed data (user profiles, property counts)
- Minimize database calls per page render — batch queries in Server Components
- Monitor connection count via Supabase dashboard
- Supabase Pro plan minimum for production (higher connection limits)

### 6. GDPR Retrofit Across 266 Tables

**Severity:** HIGH
**Phase:** Epic 1 (start) → Epic 11 (complete)

**The Problem:** GDPR compliance is scoped to Epic 11 but consent management and data retention cannot be retrofitted across 266 tables. Every table with PII needs deletion support.

**Warning Signs:**
- "We'll add GDPR later" mentality
- Tables storing PII without soft-delete or retention policies
- No consent tracking from signup

**Prevention:**
- Epic 1 MUST include: consent management table, consent capture at signup, data export endpoint skeleton
- Every table with user PII gets `created_at`, `updated_at`, and references `user_id` for cascade deletion
- Design data model with `ON DELETE CASCADE` from the start
- Implement `DELETE /api/user/data` in Epic 1 (even if incomplete)
- Epic 11 fills remaining gaps (audit logging, consent audit trail)

### 7. Bundle Size Explosion

**Severity:** MEDIUM
**Phase:** All Epics (cumulative)

**The Problem:** A portal with 7 dashboards, maps, Stripe, AI features, and rich UI components can easily exceed 1MB initial JavaScript. Core Web Vitals degrade.

**Warning Signs:**
- LCP exceeding 2.5s target
- `next build` showing large route bundles (>250KB)
- Map component loading on pages that don't need it

**Prevention:**
- Dynamic imports for heavy features: MapLibre (`ssr: false`), Stripe Elements, AI chat
- Route-based code splitting (Next.js does this automatically per route)
- Use `next/dynamic` with loading skeletons
- Bundle analysis: `@next/bundle-analyzer` in build pipeline
- Set bundle budget: no route >200KB initial JS
- Lazy-load dashboard widgets below the fold

### 8. Real-Time Scaling (Supabase Realtime Limits)

**Severity:** MEDIUM
**Phase:** Epic 5 (Communication)

**The Problem:** Supabase Realtime has channel limits per project. With messaging, notifications, presence, and property alerts all using Realtime, channel count grows fast.

**Warning Signs:**
- Realtime connections dropping
- Messages not delivering in real-time
- Presence indicators unreliable

**Prevention:**
- Channel-per-conversation (not channel-per-user)
- Batch notifications — don't send individual Realtime events for each notification
- Use database polling (TanStack Query refetch) as fallback for non-critical updates
- Check Supabase plan limits for concurrent Realtime connections
- Consider Realtime only for active conversations — use email (Resend) for offline users

### 9. E2E Test Fragility Across 7 Roles

**Severity:** MEDIUM
**Phase:** All Epics

**The Problem:** E2E tests for 7 different user roles create a combinatorial explosion. Tests become slow and flaky. v2.0 had 136 E2E test files and 480+ tests — CI took 15+ minutes.

**Warning Signs:**
- CI E2E suite exceeding 10 minutes
- Flaky tests causing false failures
- Tests depending on specific data state from other tests

**Prevention:**
- Auth fixtures per role (pre-authenticated Playwright storage states)
- Parallel test sharding by role (each role's tests run independently)
- Database seeding scripts per epic (repeatable, isolated test data)
- Tiered execution: unit → integration → E2E (only E2E on merge)
- Use `test.describe.configure({ mode: 'parallel' })` where possible
- Mock external services (Stripe test mode, MSW for Claude AI)

### 10. Multi-Step Form State Loss

**Severity:** MEDIUM
**Phase:** Epics 2, 4 (Property listing, RFQ creation)

**The Problem:** Property listing forms have 15+ fields across multiple steps. Page refresh or navigation loses all progress. Users abandon incomplete listings.

**Warning Signs:**
- High form abandonment rate
- User complaints about lost progress
- Browser back button breaking form state

**Prevention:**
- Save draft to database on each step (Server Actions + debounced auto-save)
- URL state for current step (`/create-listing?step=3`)
- `beforeunload` event warning on unsaved changes
- Resume from last saved step on return
- Show clear progress indicator (step 3 of 5)

### 11. Search Performance at Scale

**Severity:** MEDIUM
**Phase:** Epic 2 (Property Search)

**The Problem:** Property search combines multiple filter types (location, price, bedrooms, features) with full-text search and vector similarity. Complex queries against 1M+ listings degrade performance.

**Warning Signs:**
- Search results taking >2s to return
- PostGIS queries not using spatial indexes
- Full-text search not using GIN indexes
- pgvector similarity search doing sequential scans

**Prevention:**
- PostGIS spatial index on property location column
- GIN index on text search columns
- HNSW index on pgvector embedding column (faster than IVFFlat for search)
- Pagination with cursor-based infinite scroll (not offset)
- Filter application order: cheapest filters first (price range → location → text → vector)
- Cache popular searches in Redis (TTL: 5 minutes)

### 12. Webhook Reliability

**Severity:** MEDIUM
**Phase:** Epic 4 (Stripe), Epic 5 (Supabase)

**The Problem:** Webhooks are fire-and-forget. If the endpoint is down, Stripe retries but eventually gives up. Lost webhooks mean payment states diverge from database.

**Warning Signs:**
- Payment succeeded in Stripe but booking status still "pending" in database
- Duplicate webhook events causing duplicate notifications
- Webhook endpoint returning 5xx errors

**Prevention:**
- Idempotency keys on all webhook handlers (process each event exactly once)
- Store webhook event ID in database, skip duplicates
- Webhook signature verification (`stripe.webhooks.constructEvent()`)
- Dead letter queue: log failed webhook events for manual retry
- Reconciliation job: periodically compare Stripe payment state with database
- Health check endpoint for webhook receiver

### 13. Image Storage Costs

**Severity:** LOW
**Phase:** Epic 2 (Media Upload)

**The Problem:** 30 photos per listing × 1M listings = 30M images. Supabase Storage pricing based on bandwidth and storage volume.

**Warning Signs:**
- Storage costs growing faster than revenue
- Large original images served without optimization
- Duplicate images not deduplicated

**Prevention:**
- Resize images on upload (sharp) — max 2000px wide, JPEG quality 80
- Use Supabase Storage image transformations for thumbnails
- next/image with proper `sizes` prop for responsive loading
- Set cache headers for long-lived image URLs
- Consider CDN (Vercel's or separate CloudFront) for image serving

### 14. v2.0 Pattern Cargo-Culting

**Severity:** LOW
**Phase:** All Epics

**The Problem:** The temptation to copy v2.0 patterns directly without evaluating whether they're right for the v3.0 stack (Next.js 16 vs 15, React 19 vs 18, Tailwind v4 vs v3).

**Warning Signs:**
- Using Pages Router patterns in App Router
- forwardRef when React 19 doesn't need it
- tailwind.config.js when Tailwind v4 uses CSS-first config
- getServerSideProps when Server Components exist

**Prevention:**
- Treat v2.0 docs as REQUIREMENTS reference, not code reference
- Each epic gets fresh stack research for current patterns
- Challenge any pattern with "is this still the right way in Next.js 16 / React 19?"
- Keep PRD requirements, discard implementation details

## Summary: Phase-Level Risk Map

| Phase/Epic | Critical Risks | Must Address |
|-----------|---------------|--------------|
| Epic 1 | RLS patterns, migration strategy, multi-role auth, connection pooling, GDPR foundation | Foundation for everything — get this wrong and every epic suffers |
| Epic 2 | Search performance, image costs, form state loss | PostGIS + pgvector indexes, image optimization pipeline |
| Epic 4 | Stripe Connect onboarding, webhook reliability | Deferred onboarding, idempotent webhook handlers |
| Epic 5 | Realtime scaling | Channel strategy, fallback patterns |
| Epic 9 | Bundle size | Dynamic imports, bundle budgets |
| Epic 11 | GDPR completion | Must start in Epic 1, complete here |

---
*Research completed: 2026-03-06*
