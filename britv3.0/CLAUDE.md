# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Britestate is an all-in-one UK property portal serving 7 user roles (homebuyer, renter, seller, landlord, estate agent, service provider, admin). This is v3.0 — a ground-up rebuild using the v2.0 PRD as specification. The codebase is currently a fresh Next.js 16 scaffold; all feature code is yet to be built following the epic-by-epic roadmap in `.planning/ROADMAP.md`.

## Repository Structure

The actual Next.js application lives in `britv3.0/` (a subdirectory within the repo root):

```
.                          # Git repo root
├── .planning/             # GSD planning docs (roadmap, requirements, research)
├── britv3.0/              # <-- The Next.js application
│   ├── src/app/           # App Router pages and API routes
│   ├── docs/              # PRD and epic specs from v2.0 (15 files)
│   ├── public/            # Static assets
│   ├── package.json       # Dependencies (pnpm)
│   └── .env.example       # Required environment variables
├── skills/                # Claude Code skills
├── britestatestyle.txt    # Design/style reference
└── CLAUDE.md              # This file
```

**Important:** Run all `pnpm` commands from `britv3.0/`, not the repo root.

## Development Commands

All commands run from `britv3.0/`:

```bash
pnpm dev          # Start dev server (default port 3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint (flat config, ESLint 9)
```

Testing frameworks (Vitest, Playwright) are planned but not yet installed. When added:
```bash
pnpm test                  # Unit tests (Vitest)
pnpm test:e2e              # E2E tests (Playwright)
```

## Tech Stack

- **Framework**: Next.js 16.1.6, React 19.2.3, TypeScript 5
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`), Shadcn UI + Radix (planned)
- **Backend**: Supabase (Auth, PostgreSQL, Realtime, Storage) — no custom backend server
- **Package Manager**: pnpm (workspace mode)
- **AI**: Anthropic Claude SDK + pgvector for embeddings
- **Maps**: MapTiler + MapLibre GL JS
- **Payments**: Stripe Connect (2.5% platform commission)
- **Email**: Resend + React Email
- **Monitoring**: Sentry (errors), PostHog (analytics), Upstash Redis (rate limiting)

## Architecture

**Pattern:** Next.js App Router monolith with Supabase BaaS

**Layers** (target structure in `britv3.0/src/`):

| Layer | Location | Purpose |
|-------|----------|---------|
| Routes | `app/` | Pages, layouts, API route handlers |
| Components | `components/` | UI components (`ui/` for Shadcn, feature dirs for domain) |
| Hooks | `hooks/` | Client-side stateful logic (`useAuth`, `usePropertySearch`) |
| Contexts | `contexts/` | Global React state (auth, theme) |
| Services | `services/` | Business logic by domain (`auth/`, `properties/`, `marketplace/`, `payments/`, `ai/`) |
| Lib | `lib/` | Supabase client factories, shared utilities |
| Types | `types/` | Shared TypeScript type definitions |

**Key data flows:**
- Server Components fetch data directly via Supabase server client (`lib/supabase/server.ts`)
- Client Components use hooks → services → Supabase client (`lib/supabase/client.ts`)
- Real-time features use Supabase Realtime subscriptions
- Async client state managed with `@tanstack/react-query`

**Route groups:**
- `(auth)/` — login, signup, password reset
- `(main)/` — public pages (search, listings)
- `(protected)/` — authenticated routes, guarded by middleware
- `dashboard/[role]/` — role-specific dashboards (homebuyer, renter, seller, landlord, agent, provider)

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

Copy `britv3.0/.env.example` to `.env.local`. Key variables:

| Variable | Context | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes |
| `STRIPE_SECRET_KEY` | Server only | For payments |
| `ANTHROPIC_API_KEY` | Server only | For AI features |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | Client | For maps |

Client-side vars must be prefixed with `NEXT_PUBLIC_`.

## Specification Documents

The v2.0 PRD and epic specs in `britv3.0/docs/` are the definitive feature specifications:
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

- Supabase PostgreSQL with 266 tables across 7 domains (Users, Properties, Marketplace, Transactions, Communication, Analytics, Admin)
- Migrations in `supabase/migrations/`
- RLS policies on every table
- pgvector extension for AI embeddings

## Verification Protocol

Before claiming any change is complete:
1. Run the build: `pnpm build` (from `britv3.0/`)
2. Run linting: `pnpm lint`
3. Run relevant tests
4. Manually verify the feature works as expected
5. Never say "this should work" — confirm it does work
Workflow Orchestration

# 1. Plan Mode Default
Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
If something goes sideways, STOP and re-plan immediately — don't keep pushing
Use plan mode for verification steps, not just building
Write detailed specs upfront to reduce ambiguity

# 2. Subagent Strategy
Use subagents liberally to keep main context window clean
Offload research, exploration, and parallel analysis to subagents
For complex problems, throw more compute at it via subagents
One task per subagent for focused execution

# 3. Self-Improvement Loop
After ANY correction from the user: update `tasks/lessons.md` with the pattern
Write rules for yourself that prevent the same mistake
Ruthlessly iterate on these lessons until mistake rate drops
Review lessons at session start for relevant project

# 4. Verification Before Done
Never mark a task complete without proving it works
Diff behavior between main and your changes when relevant
Ask yourself: "Would a staff engineer approve this?"
Run tests, check logs, demonstrate correctness

# 5. Demand Elegance (Balanced)
For non-trivial changes: pause and ask "is there a more elegant way?"
If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
Skip this for simple, obvious fixes — don't over-engineer
Challenge your own work before presenting it

# 6. Autonomous Bug Fixing
When given a bug report: just fix it. Don't ask for hand-holding
Point at logs, errors, failing tests — then resolve them
Zero context switching required from the user
Go fix failing CI tests without being told how