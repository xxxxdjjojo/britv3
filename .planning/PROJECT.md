# Britestate

## What This Is

Britestate is an all-in-one UK property portal that consolidates property search, service marketplace, transaction management, and landlord tools into a single AI-powered platform. It serves 7 user roles — homebuyers, renters, sellers, landlords, estate agents, service providers, and admins — replacing the 12+ fragmented platforms currently needed to complete a property journey.

This is a ground-up rebuild (v3.0) using the proven PRD from v2.0 as the specification, built on a modern stack (Next.js 16, React 19, Tailwind v4) with Supabase as the backend-as-a-service.

## Core Value

Users can find, compare, and transact on properties with full transparency — AI-powered matching, integrated services, and real-time transaction tracking in one place.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Epic 1: Multi-role authentication, verification workflows, GDPR consent management
- [ ] Epic 2: Property search & discovery engine with AI-powered matching, map-based search, listing management
- [ ] Epic 3: Role-specific dashboards for all 6 user roles (homebuyer, renter, seller, landlord, agent, provider)
- [ ] Epic 4: Service provider marketplace with RFQ system, booking, reviews, Stripe Connect payments
- [ ] Epic 5: Real-time communication platform — messaging, notifications, presence
- [ ] Epic 6: AI-powered features — recommendations, semantic search, AVM, content generation
- [ ] Epic 7: Landlord portfolio management — tenant management, maintenance, compliance tracking
- [ ] Epic 8: Financial tools — mortgage calculator, stamp duty calculator, investment analysis
- [ ] Epic 9: Mobile-first responsive design, PWA capabilities
- [ ] Epic 10: Admin panel — user management, content moderation, provider verification, support tickets
- [ ] Epic 11: Compliance & monitoring — GDPR, audit logging, error tracking, analytics

### Out of Scope

- Native mobile apps (iOS/Android) — web-first, PWA covers mobile for v1
- International expansion — UK-only for this build
- AR property visualization — future phase
- Voice search — future phase
- Blockchain property records — research only
- Commercial property vertical — future phase
- White-label solution for agents — post-launch

## Context

**Origin:** This is v3.0 — a complete rebuild. v2.0 reached 92% completion but is being rebuilt from scratch on a newer stack. The PRD and epic specifications from v2.0 (in `britv3.0/docs/`) serve as the definitive specification.

**Documentation:** 15 specification files exist in `britv3.0/docs/`:
- `brit estate prd 2026.txt` — Master PRD with full feature specs
- `claude epic 1 review.txt` — Epic 1 (Authentication) spec
- `claude epic 2.txt` — Epic 2 (Property Engine) spec
- `epic3mkd claude.txt` — Epic 3 (Dashboards) spec
- `epic4tech-pt1.txt`, `epic4techpt2.txt`, `epic4techpt3.txt` — Epic 4 (Marketplace) specs
- `epic5.txt` — Epic 5 (Communication) spec
- `epic6.txt` — Epic 6 (AI Features) spec
- `epic7.txt` — Epic 7 (Landlord) spec
- `epic8.txt` — Epic 8 (Financial Tools) spec
- `epic9.txt` — Epic 9 (Mobile/PWA) spec
- `epic10.txt` — Epic 10 (Admin) spec
- `epic11.txt` — Epic 11 (Compliance) spec
- `project memory 2026.txt` — Full project memory with architecture details, 266 database tables

**Scale:** 266 database tables across 7 domains (Users, Properties, Marketplace, Transactions, Communication, Analytics, Admin). 7 user roles with role-specific dashboards. 27+ service categories in marketplace.

**Build approach:** Epic-by-epic sequential build. Each epic must have full E2E test coverage and pass verification before moving to the next.

## Constraints

- **Stack**: Next.js 16, React 19, TypeScript 5, Tailwind v4, Shadcn UI + Radix — use what's in the scaffold
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage) — no custom backend server
- **Payments**: Stripe + Stripe Connect — 2.5% platform commission model
- **AI**: Anthropic Claude for all AI features, pgvector for embeddings
- **Maps**: MapTiler + MapLibre GL JS for vector maps
- **Email**: Resend + React Email for transactional email
- **Caching**: Upstash Redis for rate limiting and caching
- **Monitoring**: Sentry (errors) + PostHog (analytics)
- **Testing**: Full E2E coverage required per epic before advancing
- **Compliance**: GDPR compliant from the start, RLS on all tables

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebuild from scratch (v3.0) | v2.0 had issues; fresh start on latest stack | -- Pending |
| Use latest stack versions | Next.js 16/React 19/Tailwind v4 already scaffolded | -- Pending |
| Epic-by-epic sequential build | Reduces complexity, allows testing between epics | -- Pending |
| Supabase as BaaS | Combines auth, DB, realtime, storage — reduces infrastructure complexity | -- Pending |
| Full E2E testing per epic | Catch regressions early before building on top | -- Pending |

---
*Last updated: 2026-03-06 after initialization*
