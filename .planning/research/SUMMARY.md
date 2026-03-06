# Research Summary

**Project:** Britestate v3.0 -- UK Property Portal
**Synthesized:** 2026-03-06
**Overall Confidence:** MEDIUM-HIGH

---

## Executive Summary

Britestate v3.0 is a multi-sided UK property portal serving 7 user roles (homebuyer, renter, seller, landlord, agent, service provider, admin) with a 266-table PostgreSQL schema, integrated service marketplace, and AI-powered features. The expert-recommended approach for this class of application is a Next.js App Router monolith backed by Supabase (auth, database, storage, realtime), with Stripe Connect for marketplace payments, MapLibre for mapping, and Anthropic Claude for AI features. The scaffold already has Next.js 16.1.6, React 19.2.3, Tailwind v4, and TypeScript 5 installed, providing a verified foundation.

The dominant technical risk is the 266-table Supabase schema combined with 7-role Row-Level Security. Research consistently flags this as the single largest source of potential performance collapse -- poorly written RLS policies will degrade every page in the application. The mitigation is well-understood: JWT-based role claims, helper functions, strict indexing, and materialized views for dashboards. This must be implemented correctly in Epic 1 because every subsequent epic depends on it.

The product differentiators are clear: no competitor combines property search, a verified service marketplace with integrated payments, AI-powered recommendations, and transaction transparency in a single platform. The build order should prioritize getting the core portal functional (auth, search, dashboards) before layering on marketplace, AI, and professional tools. GDPR compliance must start in Epic 1 -- not be retrofitted in Epic 11.

---

## Key Findings

### From STACK.md

- **Core framework verified:** Next.js 16.1.6, React 19.2.3, Tailwind v4, TypeScript 5 are in the scaffold. No decisions needed here.
- **Supabase is the entire backend:** Auth, PostgreSQL, Realtime, Storage, pgvector, PostGIS. No separate ORM or auth library -- Supabase client handles everything with RLS enforcement.
- **Stripe Connect (Standard):** Direct charges model with 2.5% platform fee. Deferred onboarding is critical for marketplace liquidity.
- **MapLibre + MapTiler:** 10x cheaper than Google Maps at scale. Client-only (requires dynamic import with `ssr: false`).
- **Two-SDK AI approach:** Vercel AI SDK for streaming UI (chat, recommendations), direct Anthropic SDK for batch operations (AVM, embeddings).
- **State management split:** TanStack Query for server state, Zustand for UI state, nuqs for URL state. Clear separation prevents overlap.
- **Version caveat:** Library versions marked with `*` are based on May 2025 training data. All must be verified with `npm view` before installation.

### From FEATURES.md

**Table Stakes (must ship or users leave):**
- Property search with location, filters, map pins, photo galleries
- Email/password + Google OAuth authentication
- Contact agent/landlord messaging with email notifications
- Mortgage and stamp duty calculators
- Responsive mobile design
- GDPR consent management

**Differentiators (competitive advantage):**
- AI semantic search and match scoring (no competitor does this)
- Integrated service marketplace with RFQ system and Stripe Connect payments
- Real-time transaction timeline and chain visualization
- Landlord portfolio management with maintenance pipeline
- 7 role-specific dashboards with role switching

**Anti-features (do NOT build):**
- Native mobile apps (PWA sufficient)
- Real-time video/voice calling
- Social feed, blockchain records, AR/VR tours
- Automated mortgage applications (FCA regulated)
- Multi-language, commercial property vertical, white-label

### From ARCHITECTURE.md

- **App Router structure:** Route groups `(auth)`, `(marketing)`, `(dashboard)` with role-specific subroutes under dashboard.
- **Four Supabase client types:** Browser client, Server Component client, Middleware client, Service Role client (for webhooks). Each has a distinct use case.
- **Data flow is direct:** Server Components query Supabase directly (no API layer for reads). Server Actions handle mutations. API Routes exist only for webhooks.
- **Prefix-based table organization:** `user_`, `prop_`, `mkt_`, `msg_`, `ai_`, `ll_`, `fin_`, `txn_`, `admin_`, `evt_` -- all in the public schema.
- **Build order validated:** Auth first, then property search, then dashboards and AI, then marketplace and finance, then professional tools, then polish.

### From PITFALLS.md

**Top 5 pitfalls (ordered by severity):**

1. **RLS Performance Collapse (CRITICAL):** 266 tables with RLS. Must use JWT claims, helper functions, strict indexing, materialized views. Monitor with `pg_stat_statements` from day one.

2. **Migration Explosion (HIGH):** v2.0 accumulated 204 migrations with destructive changes. Fix: define all 266 tables in foundational migrations, later epics only ADD -- never DROP or ALTER destructively.

3. **Stripe Connect Onboarding Blocking Marketplace (HIGH):** Decouple provider visibility from payment readiness. Trigger Stripe KYC only when first quote is accepted.

4. **Multi-Role Auth Complexity (HIGH):** Single permissions matrix, JWT claims as source of truth, `auth.user_role()` helper used everywhere. Role switch issues new JWT.

5. **Connection Pool Exhaustion (HIGH):** Use Supavisor, single client per request, Redis caching for hot data, Supabase Pro plan minimum.

**Secondary pitfalls:** GDPR retrofit (start in Epic 1), bundle size (dynamic imports), Realtime scaling (channel-per-conversation), E2E test fragility (parallel sharding by role), webhook reliability (idempotency keys), search performance (proper indexing).

---

## Implications for Roadmap

### Suggested Phase Structure

**Phase 1: Foundation (Epic 1)**
- Auth system with 7 roles, role switching, JWT custom claims
- Database foundation: all 266 tables stubbed with essential columns
- RLS patterns established with helper functions
- Supabase client setup (4 client types)
- GDPR consent management (table + signup capture)
- Next.js middleware for auth guards and role routing
- **Rationale:** Everything depends on auth and the database schema. Getting RLS patterns right here prevents cascading performance problems. GDPR cannot be retrofitted.
- **Pitfalls to address:** RLS performance, migration explosion, multi-role auth, connection pooling, GDPR foundation
- **Research flag:** NEEDS phase research -- multi-role JWT patterns with Supabase Auth require careful design

**Phase 2: Core Product (Epics 2 + 5)**
- Property search with PostGIS location, filters, map integration
- Property listing creation (multi-step form with auto-save)
- Media upload and optimization pipeline
- Messaging system (contact agent/landlord)
- Email notifications via Resend
- **Rationale:** Property search is the core value proposition. Messaging enables buyer-agent communication. Together they create a usable property portal.
- **Pitfalls to address:** Search performance (indexes), image costs (resize on upload), form state loss (auto-save), Realtime scaling
- **Research flag:** NEEDS phase research -- PostGIS + pgvector indexing strategy, MapLibre integration patterns

**Phase 3: Dashboards and AI (Epics 3 + 6)**
- 7 role-specific dashboards with parallel routes
- AI semantic search and property recommendations
- Match scoring with explanations
- AI-generated property descriptions
- pgvector embedding pipeline
- **Rationale:** Dashboards give each role a home. AI features are the primary differentiator -- shipping them in Phase 3 means they benefit from real property data created in Phase 2.
- **Pitfalls to address:** Bundle size (lazy-load dashboard widgets), v2.0 cargo-culting (fresh patterns for React 19)
- **Research flag:** NEEDS phase research -- embedding strategy (local vs API), AI SDK streaming patterns, dashboard parallel routes

**Phase 4: Marketplace and Finance (Epics 4 + 8)**
- Service marketplace with 27+ categories
- Provider verification pipeline
- RFQ system (request for quote)
- Stripe Connect integration (Standard accounts, direct charges)
- Payment escrow pattern
- Mortgage calculator, stamp duty calculator, cost breakdowns
- **Rationale:** Marketplace is the revenue engine (2.5% platform fee). Financial tools complement property search. Both depend on auth + property data from earlier phases.
- **Pitfalls to address:** Stripe Connect onboarding (deferred), webhook reliability (idempotency), connection pool exhaustion under payment load
- **Research flag:** NEEDS phase research -- Stripe Connect embedded components, webhook architecture, escrow capture timing

**Phase 5: Professional Tools (Epic 7)**
- Landlord portfolio dashboard
- Tenant management
- Compliance certificate tracking with reminders
- Maintenance request pipeline (connects to marketplace providers)
- Financial reporting and tax summaries
- **Rationale:** Landlord tools are high-value features that depend on both the dashboard framework (Phase 3) and the marketplace (Phase 4) for contractor integration.
- **Research flag:** Standard patterns -- CRUD dashboards with domain-specific business logic. May skip phase research.

**Phase 6: Polish and Production (Epics 9 + 10 + 11)**
- PWA support (offline viewing, push notifications, install prompt)
- Admin panel (user management, content moderation, audit logs)
- Full GDPR compliance (data export, deletion, audit trail)
- Monitoring setup (Sentry, PostHog)
- Performance optimization and bundle budgets
- **Rationale:** Polish and compliance wrap up the product. Admin panel needs data from all prior phases. GDPR completion builds on the foundation from Epic 1.
- **Pitfalls to address:** Bundle size (final optimization), PWA library stability (verify serwist), E2E test suite performance
- **Research flag:** NEEDS phase research for PWA (library ecosystem was fragmented). Admin and compliance are standard patterns.

### Cross-Cutting Concerns (Every Phase)

- **Testing:** Tiered strategy -- type check + lint (every push), unit tests (every push), integration (every PR), E2E (merge to main). Auth fixtures per role.
- **Bundle monitoring:** `@next/bundle-analyzer` in CI. No route exceeds 200KB initial JS.
- **Migration discipline:** Only ADD columns/indexes/policies. Run `supabase db reset` in CI.
- **Type generation:** Run `supabase gen types typescript` after every migration. Consider splitting the generated file by domain prefix.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core framework verified from scaffold. Supporting library versions need `npm view` verification before install. |
| Features | HIGH | Well-defined table stakes vs differentiators. v2.0 PRD provides strong requirements baseline. Competitor analysis is thorough. |
| Architecture | HIGH | App Router patterns, data flow, and component structure are well-documented. Build order validated against dependency graph. |
| Pitfalls | HIGH | Informed by v2.0 failure patterns (204 migrations, RLS performance, connection pooling). Prevention strategies are concrete and actionable. |

### Gaps to Address

1. **Library version verification:** All `*`-marked versions in STACK.md must be verified with `npm view` before Phase 1 installation. Supabase JS SDK may have had a major version bump.
2. **Embedding strategy:** v2.0 used local transformers; v3.0 should evaluate Supabase built-in embeddings vs OpenAI API. Needs research during Phase 3.
3. **PWA library ecosystem:** serwist was the recommended next-pwa fork in early 2025 but the ecosystem was fragmented. Verify before Phase 6.
4. **Supabase plan sizing:** 100K MAU Y1 target needs Pro plan minimum with dedicated compute add-on. Pricing should be validated.
5. **Inngest vs Edge Functions:** Decision on whether Supabase Edge Functions alone handle workflow complexity (provider verification pipeline, transaction state machine) or whether Inngest is needed. Defer to Phase 4 research.

---

## Sources

| Source | What It Informed | Confidence |
|--------|-----------------|------------|
| Scaffolded package.json | Core framework versions (Next.js 16.1.6, React 19.2.3, Tailwind v4, TS 5) | HIGH |
| v2.0 Project Memory | Architecture decisions, pitfall patterns, testing strategy, 266-table schema | HIGH |
| v2.0 PRD | Scale targets (100K MAU Y1), feature scope, role definitions | HIGH |
| Competitor analysis | Feature matrix (Rightmove, Zoopla, OnTheMarket, OpenRent, Checkatrade) | MEDIUM-HIGH |
| Training data (cutoff May 2025) | Library versions, API patterns, ecosystem state | MEDIUM to LOW |

---
*Synthesis completed: 2026-03-06*
