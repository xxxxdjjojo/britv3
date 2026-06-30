# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Canonical clone (read first)

**`britv3` is the single canonical working copy.** The dev server and any deploy
must run from `britv3`. Extra working copies must be **git worktrees** of `britv3`
(`git worktree add ../britv3-<task> <branch>`), not separate `git clone`s.

Why: ad-hoc sibling clones (`britv3-secfix`, `britv3-market-map`, `britv3-qp0`, …)
caused features to be built on a branch in one clone while `next dev` served a
different clone that lacked them — "we built it but there's nowhere to see it."
Guards now in place:
- `pnpm dev` runs `scripts/dev-guard.mjs` (a `predev` hook) printing the serving
  clone + branch and warning if it is not `britv3`.
- `pnpm check:stale-branches` lists feature branches diverged from `main` and
  unmerged, so work is not stranded on long-lived branches.
- Merge feature branches into `main` promptly; do not let them accumulate.

## Project Overview

TrueDeed (formerly Britestate) is an all-in-one UK property portal serving 7 user roles (homebuyer, renter, seller, landlord, estate agent, service provider, admin). This is v3.0 — a ground-up rebuild using the v2.0 PRD as specification. The codebase has authentication, property search, property detail pages, area guides, marketplace (reviews & ratings), messaging, notifications, seller/landlord/agent/provider dashboards, admin back-office, and security hardening built. Development follows the epic-by-epic roadmap in `.planning/ROADMAP.md`.

For the system map (routes, API/services, data model, integrations, background
jobs) see [ARCHITECTURE.md](ARCHITECTURE.md). For setup and the dev/landing workflow
see [CONTRIBUTING.md](CONTRIBUTING.md).

## Repository Structure

The Next.js application lives at the **repo root** (not in a subdirectory). The `britv3.0/` directory is a stranded ghost from an earlier layout — do not use it.

```
.                          # Git repo root — the Next.js app lives here
├── src/app/               # App Router pages and API routes
├── src/components/        # React components
├── src/services/          # Business logic by domain
├── src/lib/               # Supabase clients, shared utilities
├── docs/                  # Audit docs, PRD specs, architecture ADRs
├── public/                # Static assets
├── .planning/             # GSD planning docs (roadmap, requirements, research)
├── package.json           # Dependencies (pnpm)
├── .env.example           # Required environment variables
├── skills/                # Claude Code skills
└── CLAUDE.md              # This file
```

**Important:** Run all `pnpm` commands from the **repo root**, not from `britv3.0/`.

## Development Commands

All commands run from the **repo root**:

```bash
pnpm dev          # Start dev server (default port 3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint (flat config, ESLint 9)
```

```bash
pnpm test                  # Unit tests (Vitest — 493 test files, ~3,800 cases)
pnpm test:e2e              # E2E tests (Playwright)
```

## Tech Stack

- **Framework**: Next.js 16.2.9, React 19.2.3, TypeScript 5
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`), Shadcn UI + Radix (planned)
- **Backend**: Supabase (Auth, PostgreSQL, Realtime, Storage) — no custom backend server
- **Package Manager**: pnpm (workspace mode)
- **AI**: Anthropic Claude SDK + pgvector for embeddings
- **Maps**: MapTiler + MapLibre GL JS
- **Payments**: Stripe Connect — 0% platform commission on trader jobs (traders monetised via monthly subscription only). The single fee lever is `src/lib/payments/platform-fee.ts` (`PLATFORM_FEE_RATE`, env-overridable, default 0).
- **Email**: Resend + React Email
- **Monitoring**: Sentry (errors), PostHog (analytics), Upstash Redis (rate limiting)

## Architecture

**Pattern:** Next.js App Router monolith with Supabase BaaS

**Layers** (in `src/`):

| Layer | Location | Purpose |
|-------|----------|---------|
| Routes | `app/` | Pages, layouts, API route handlers |
| Components | `components/` | UI components (`ui/` for Shadcn, feature dirs for domain) |
| Hooks | `hooks/` | Client-side stateful logic (`useAuth`, `usePropertySearch`) |
| Contexts | `contexts/` | Global React state (auth, theme) |
| Services | `services/` | Business logic by domain (`auth/`, `properties/`, `marketplace/`, `payments/`, `ai/`, `areas/`) |
| Lib | `lib/` | Supabase client factories, shared utilities |
| Types | `types/` | Shared TypeScript type definitions |

**Key data flows:**
- Server Components fetch data directly via Supabase server client (`lib/supabase/server.ts`)
- Client Components use hooks → services → Supabase client (`lib/supabase/client.ts`)
- Real-time features use Supabase Realtime subscriptions
- Async client state managed with `@tanstack/react-query`

**Route groups:**
- `(auth)/` — login, signup, password reset
- `(main)/` — public pages (search, listings, area guides, sold prices, market trends)
- `(protected)/` — authenticated routes, guarded by middleware
- `dashboard/[role]/` — role-specific dashboards (homebuyer, renter, seller, landlord, agent, provider)

**Memo Pivot v2 surfaces (added 2026-05-22):**
- `/pricing` renders 7 segment tabs (Sellers, Estate Agents, Landlords, Providers, Niche Professionals, Developers, Traders). Source of truth: `src/lib/billing-config.ts` (`PLANS_BY_SEGMENT`).
- Segment landings: `/sellers`, `/developers`, `/traders`.
- `/fee-transparency` lists every segment's commission band.
- Programmatic SEO: `/services-near/[service]/[postcode]` (≥500 SSG routes; cap 10K).
- Admin: `/admin/sdr` (outbound campaign queue), `/admin/pricing-review` (week-13 checkpoint dashboard).
- Tier-banded marketplace commission: `calculatePlatformFee` in `src/services/provider/provider-payment-service.ts`, rates in `src/lib/commission-rates.ts`.
- Sellers default-tier A/B: PostHog flag `sellers_default_tier` (basic | plus) — harness in `src/lib/experiments.ts`, exposure at `/api/experiments/exposure`.
- Stripe provisioning: `scripts/stripe-setup/create-pricing-v2.ts` (idempotent) + `verify-pricing-v2.ts`.
- See `docs/architecture/ADR-007-pricing-v2-pivot.md`, `docs/pricing-v2/README.md`, `docs/api/billing-v2.md`.

**Property-detail Local Area data layers (added 2026-06):**
The property page's "Local area" section (`src/components/properties/detail/LocalAreaSection.tsx`, rendered from `app/(main)/properties/[slug]/page.tsx`) composes independent, source-attributed data layers. Each layer self-gates: its widget renders only when real data exists, so the section degrades gracefully. Two layers call live APIs at render (Redis-cached); three are DB-backed (read from tables populated by ingest scripts).
- **Schools + Crime** — live APIs: GIAS/Ofsted (`src/services/properties/ofsted-service.ts`) and data.police.uk (`crime-service.ts`). OGL v3.0.
- **Transport** — `transport_stops` (PostGIS, stations only: rail/tube/tram/ferry) + `get_nearby_transport_stops` RPC; `transport-service.ts` → `TransportWidget`. Ingest: `scripts/ingest-naptan.mjs` (NaPTAN, OGL).
- **Broadband** — `broadband_coverage` keyed by postcode (availability % per tier); `broadband-service.ts` → `BroadbandWidget`. Ingest: `scripts/ingest-ofcom-broadband.mjs` (Ofcom Connected Nations, OGL).
- **Flood risk** — live WMS GetFeatureInfo on EA NaFRA2 `rofrs_4band`; `flood-service.ts` → `FloodRiskWidget` (bands Very Low/Low/Medium/High). OGL.
- **Mobility (walk/transit/bike)** — `mobility_scores` keyed by `property_id`, precomputed (Overpass is unreliable live); scoring in `src/lib/properties/mobility-scoring.ts`, served via `mobility-service.ts` → `MobilityScoresWidget`. Ingest: `scripts/ingest-mobility-scores.ts` (OSM/Overpass ODbL + transport_stops). Independent estimate, not Walk Score®.
- All three DB tables are public-read RLS; ingest scripts connect via `SUPABASE_DB_URL` and verify TLS against the pinned `scripts/certs/supabase-prod-ca-2021.crt`. The mobility backfill runs daily via `.github/workflows/mobility-backfill.yml` (idempotent; needs the `SUPABASE_DB_URL` Actions secret).

## Coding Conventions

### TypeScript
- Strict mode enabled; path alias `@/*` → `./src/*`
- Use `import type` for type-only imports
- Prefer `type` over `interface` unless merging is needed
- Use branded types for domain IDs: `type UserId = Brand<string, 'UserId'>`
- Inline component props with `Readonly<{}>` wrapper

### Components
- Server Components by default; add `"use client"` only when needed
- Shadcn UI components go in `src/components/ui/`
- Feature components organized by domain: `properties/`, `auth/`, `dashboard/`, `marketplace/`

### Files
- Components: `PascalCase.tsx`
- Hooks: `useFeatureName.ts`
- Services: `kebab-case-service.ts`
- API routes: `api/[resource]/route.ts`

### Styling
- Tailwind v4 utility classes in JSX `className`
- Theme via CSS custom properties in `globals.css`
- Dark mode via `prefers-color-scheme` + `dark:` prefix
- No CSS modules

### Formatting
- Double quotes, semicolons required, 2-space indent, trailing commas
- No Prettier — ESLint handles enforcement

### Git
- Conventional Commits: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Branch naming: `feature/epic-N-description`, `fix/short-description`

## Environment Variables

Copy `.env.example` to `.env.local`. `.env.example` documents ~89 variables,
validated by `src/env.ts` (`@t3-oss/env-nextjs`). Key variables:

| Variable | Context | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes |
| `STRIPE_SECRET_KEY` | Server only | For payments |
| `ANTHROPIC_API_KEY` | Server only | For AI features |
| `RESEND_API_KEY` | Server only | For emails |
| `REAUTH_HMAC_SECRET` | Server only | For reauth tokens |
| `PUSH_SECRET` | Server only | For push notifications |
| `QUOTE_SIGNING_SECRET` | Server only | For quote HMAC |
| `INNGEST_SIGNING_KEY` | Server only | For Inngest webhook verification |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | Client | For maps |

Client-side vars must be prefixed with `NEXT_PUBLIC_`.

## Specification Documents

The v2.0 PRD and epic specs in `docs/` are the definitive feature specifications:
- `brit estate prd 2026.txt` — Master PRD
- `claude epic [N].txt` / `epic[N].txt` — Individual epic specs (1-11)
- `project memory 2026.txt` — Full architecture details, 266 database tables

Planning docs in `.planning/`:
- `ROADMAP.md` — 7-phase build plan with success criteria
- `REQUIREMENTS.md` — 161 requirements mapped to phases
- `PROJECT.md` — Project context and constraints

## Build Approach

- Epic-by-epic sequential build (Phase 1 → 7)
- Each phase must have full E2E test coverage before advancing
- RLS (Row-Level Security) on all Supabase tables from the start
- GDPR compliance built in from Phase 1

## Database

- Supabase PostgreSQL across 7 domains (Users, Properties, Marketplace, Transactions, Communication, Analytics, Admin). The 131 migrations create ~181 tables; the generated `src/types/database.types.ts` types only ~57 (partial — regenerate after schema changes). The "266 tables" figure is the v2 PRD spec count, not the live schema.
- Migrations in `supabase/migrations/`
- Local-area reference tables (public-read RLS, populated by ingest scripts): `transport_stops` (PostGIS), `broadband_coverage` (by postcode), `mobility_scores` (by property). See the Local Area data layers note above.
- **Always create migrations with `supabase migration new <description>`** (full 14-digit UTC `YYYYMMDDHHMMSS_*` prefix); never hand-pick short numeric prefixes, and keep one logical change per file. Colliding version prefixes break `db reset`/`db push` — see `supabase/migrations/README.md`. CI guards this via `pnpm check:migrations`.
- RLS policies on every table
- pgvector extension for AI embeddings

## Verification Protocol

Before claiming any change is complete:
1. Run the build: `pnpm build`
2. Run linting: `pnpm lint`
3. Run relevant tests
4. Manually verify the feature works as expected
5. Never say "this should work" — confirm it does work

## gstack

Use the `/browse` skill from gstack for **all web browsing**. Never use `mcp__claude-in-chrome__*` tools.

### Available Skills

- `/plan-ceo-review` — CEO-level plan review
- `/plan-eng-review` — Engineering plan review
- `/review` — Code review
- `/ship` — Ship/deploy workflow
- `/browse` — Web browsing (use this instead of MCP chrome tools)
- `/qa` — Quality assurance testing
- `/setup-browser-cookies` — Set up browser cookies
- `/retro` — Retrospective

## Branch & Landing Discipline (MANDATORY)

`origin/main` is the ONLY source of truth and the ONLY long-lived branch. Every change lands or is closed — nothing lingers. Full policy: `docs/BRANCH_WORKFLOW.md`.

1. **Start synced, in your own worktree.** `git fetch origin` then
   `git worktree add ../wt-<name> -b <type>/<scope> origin/main`.
   One agent = one worktree. NEVER branch-switch a shared checkout or edit another agent's worktree.
2. **Keep it small** — one PR's worth of work (< ~1 day). If it grows, split it.
3. **Land it the same day.** Green locally first (`pnpm lint` 0 errors, `pnpm build` exit 0, `pnpm test`, and `pnpm check:migrations` once that script exists) → open a PR → CI green → **squash-merge** → branch auto-deletes → remove the worktree.
4. **No exceptions:** no long-lived branches, no "merge later", no unsquashed merges, no PR open > 48h. A branch with no PR within 48h, or a PR red > 24h, gets closed.

Use the gstack `/ship` then `/land-and-deploy` skills for the mechanics.
