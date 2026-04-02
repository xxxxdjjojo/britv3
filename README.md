# Britestate

All-in-one UK property portal serving 7 user roles: homebuyer, renter, seller, landlord, estate agent, service provider, and admin.

This is v3.0, a ground-up rebuild. Authentication, property search, property detail pages, area guides, marketplace (reviews and ratings), messaging, notifications, seller/landlord/agent/provider dashboards, admin back-office, and security hardening are built.

## Tech Stack

- **Framework:** Next.js 16, React 19, TypeScript 5
- **Styling:** Tailwind CSS v4, Shadcn UI + Radix
- **Backend:** Supabase (Auth, PostgreSQL, Realtime, Storage)
- **AI:** Anthropic Claude SDK + pgvector for embeddings
- **Maps:** MapTiler + MapLibre GL JS
- **Payments:** Stripe Connect (2.5% platform commission)
- **Email:** Resend + React Email
- **Monitoring:** Sentry (errors), PostHog (analytics), Upstash Redis (rate limiting)
- **Package Manager:** pnpm

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Supabase, Stripe, and other API keys

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required Environment Variables

| Variable | Context | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes |
| `STRIPE_SECRET_KEY` | Server only | For payments |
| `ANTHROPIC_API_KEY` | Server only | For AI features |
| `RESEND_API_KEY` | Server only | For emails |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | Client | For maps |

See `.env.example` for the full list.

## Commands

```bash
pnpm dev          # Start dev server (port 3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
pnpm test         # Unit tests (Vitest, 1400+ tests)
pnpm test:e2e     # E2E tests (Playwright)
```

### Demo Data

Seed demo data for all 7 roles:

```bash
bash supabase/seed/seed.sh
```

Reset demo data:

```bash
npx tsx scripts/seed-reset.ts
```

## Architecture

Next.js App Router monolith with Supabase BaaS.

```
src/
  app/            # Pages, layouts, API route handlers
    (auth)/       # Login, signup, password reset
    (main)/       # Public pages (search, listings, area guides)
    (protected)/  # Authenticated routes
    dashboard/    # Role-specific dashboards
  components/     # UI components (ui/ for Shadcn, feature dirs for domain)
  hooks/          # Client-side stateful logic
  contexts/       # Global React state (auth, theme)
  services/       # Business logic by domain
  lib/            # Supabase client factories, shared utilities
  types/          # Shared TypeScript type definitions
```

**Data flow:** Server Components fetch via Supabase server client. Client Components use hooks, services, and Supabase client. Real-time features use Supabase Realtime subscriptions.

## Database

Supabase PostgreSQL with 266 tables across 7 domains: Users, Properties, Marketplace, Transactions, Communication, Analytics, Admin. Migrations in `supabase/migrations/`. RLS policies on every table.

## Documentation

- [CLAUDE.md](CLAUDE.md) — Development conventions and project instructions
- [CHANGELOG.md](CHANGELOG.md) — Release history
- [TODOS.md](TODOS.md) — Deferred work items
- [docs/](docs/) — PRD and epic specifications from v2.0

## License

Private. All rights reserved.
