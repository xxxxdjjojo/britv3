# External Integrations

**Analysis Date:** 2026-03-06

**NOTE:** This project is in early scaffold phase. No integrations are implemented yet. All entries below describe the planned integration architecture documented in `britv3.0/docs/project memory 2026.txt` and `britv3.0/docs/brit estate prd 2026.txt`.

## APIs & External Services

**AI / Machine Learning:**
- Anthropic Claude - Primary AI for property recommendations, description generation, semantic search, valuation
  - SDK/Client: `@anthropic-ai/sdk`
  - Auth: `ANTHROPIC_API_KEY`
  - Fallback: DeepSeek AI
- Local Embeddings - Vector embeddings for property similarity search
  - SDK/Client: `@xenova/transformers` (Sentence Transformers)
  - Storage: PostgreSQL with pgvector extension

**Maps & Geospatial:**
- MapTiler - Vector map tiles, geocoding, UK map data
  - SDK/Client: `@maptiler/sdk`
  - Auth: `NEXT_PUBLIC_MAPTILER_KEY`
- MapLibre GL - Client-side map rendering (open-source)
  - SDK/Client: `maplibre-gl`
- PostGIS - Server-side geospatial queries (via Supabase PostgreSQL)

**Payments:**
- Stripe Connect - Marketplace payments, provider payouts, platform fees
  - SDK/Client: `stripe`
  - Auth: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Webhooks: `STRIPE_WEBHOOK_SECRET`
  - Model: Standard Connect accounts, direct charges, 2.5% platform fee

**Email:**
- Resend - Transactional email (verification, notifications, digests)
  - SDK/Client: `resend`
  - Auth: `RESEND_API_KEY`

**Analytics:**
- PostHog - Product analytics, behavioral tracking, feature flags
  - SDK/Client: `posthog-js`
  - Auth: `NEXT_PUBLIC_POSTHOG_KEY`

**Error Tracking:**
- Sentry - Error monitoring, performance tracing
  - SDK/Client: `@sentry/nextjs`
  - Auth: `SENTRY_DSN`

## Data Storage

**Database:**
- Supabase PostgreSQL - Primary database (266 planned tables)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Service role: `SUPABASE_SERVICE_ROLE_KEY`
  - Client: `@supabase/supabase-js`, `@supabase/ssr`
  - Extensions: PostGIS (geospatial), pgvector (embeddings)
  - Security: Row-Level Security (RLS) policies on every table
  - Migrations: `supabase/migrations/` directory (204 planned)

**File Storage:**
- Supabase Storage - Property photos, documents, floor plans, video tours
  - Config: `SUPABASE_STORAGE_BUCKET`
  - Limits: Up to 30 photos per listing, 5-min video tours
  - Buckets: Property media, user documents, provider certificates

**Caching:**
- Upstash Redis - Rate limiting, session caching
  - Auth: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - REST-based (serverless-compatible)

**Real-time:**
- Supabase Realtime - WebSocket subscriptions for messaging, notifications
  - Used for: Chat messages, notification delivery, status updates

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Primary authentication service
  - Methods: Email/password, Google OAuth, Magic Links
  - MFA: TOTP and SMS-based two-factor authentication
  - Sessions: JWT-based with refresh tokens
  - Implementation: `@supabase/ssr` for server-side auth in Next.js App Router

**Role System:**
- 6+ user roles: Homebuyer, Renter, Seller, Landlord, Agent, Service Provider, Admin
- Multi-role support (users can hold multiple roles simultaneously)
- Role-specific dashboards at `/dashboard/{role}/`

**Verification:**
- 4-level verification: Basic (email) > Standard (phone) > Enhanced (ID) > Professional (business)
- Provider verification pipeline: email, phone, ID docs, insurance, qualifications, Companies House check

## Monitoring & Observability

**Error Tracking:**
- Sentry (`@sentry/nextjs`) - Runtime error capture, performance monitoring

**Logs:**
- Console-based logging (development)
- Structured logging planned for production

**Analytics:**
- PostHog - User journey tracking, funnel analysis, behavioral insights
- Custom analytics services: `src/services/analytics/`

## CI/CD & Deployment

**Hosting:**
- Vercel - Next.js hosting with automatic preview deployments

**CI Pipeline:**
- GitHub Actions (`.github/workflows/`)
- Pre-deployment checks: lint, type-check, unit tests, E2E tests, build

**Environment Promotion:**
```
Development (local) → Preview (PR branches) → Staging → Production (main branch)
```

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `NEXT_PUBLIC_SITE_URL` - Application URL
- `STRIPE_SECRET_KEY` - Stripe API secret
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `ANTHROPIC_API_KEY` - Claude AI API key
- `NEXT_PUBLIC_MAPTILER_KEY` - MapTiler API key
- `RESEND_API_KEY` - Resend email API key

**Optional env vars:**
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog analytics key
- `SENTRY_DSN` - Sentry error tracking DSN
- `UPSTASH_REDIS_REST_URL` - Redis URL for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis auth token
- `SUPABASE_STORAGE_BUCKET` - Storage bucket name

**Secrets location:**
- `.env.local` for development (gitignored)
- Vercel environment variables for production
- `.env` present at project root (gitignored)

## Webhooks & Callbacks

**Incoming (planned):**
- `POST /api/webhooks/stripe` - Stripe payment events (checkout, refunds, disputes)
- Supabase Auth webhooks - User registration, email verification events

**Outgoing (planned):**
- Email notifications via Resend (property alerts, booking confirmations)
- SMS notifications (high-priority alerts, MFA codes)

## MCP Development Tooling

**Supabase MCP Server:**
- Configured in `.mcp.json` at project root
- Provides Claude Code with direct Supabase database access during development
- Endpoint: `https://mcp.supabase.com/mcp`
- Project ref: `drrxjbchrrdzcibfillx`

## Integration Architecture Patterns (from docs)

**Circuit Breaker:** AI services use circuit breaker pattern for resilience (fallback from Claude to DeepSeek)

**Service Layer:** All external integrations wrapped in service files under `src/services/`:
- `src/services/ai/` - AI and embedding services
- `src/services/payments/stripe-service.ts` - Stripe integration
- `src/services/auth/auth-service.ts` - Supabase auth wrapper
- `src/services/messaging/` - Realtime messaging
- `src/services/analytics/` - Analytics services

---

*Integration audit: 2026-03-06*
