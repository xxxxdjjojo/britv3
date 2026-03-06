# Technology Stack

**Analysis Date:** 2026-03-06

## Languages

**Primary:**
- TypeScript 5.x - All application code (`src/`, `tests/`, API routes)
- TSX - React components and pages

**Secondary:**
- SQL - Database migrations and RLS policies (`supabase/migrations/`)
- CSS - Tailwind CSS v4 utility classes (`src/app/globals.css`)

## Runtime

**Environment:**
- Node.js (version managed via project config, target ES2017 in `tsconfig.json`)

**Package Manager:**
- pnpm (workspace mode)
- Lockfile: `britv3.0/pnpm-lock.yaml` (present)
- Workspace config: `britv3.0/pnpm-workspace.yaml` (ignores sharp, unrs-resolver build deps)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router (`britv3.0/package.json`)
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**Testing:**
- Vitest - Unit and integration testing (referenced in project docs, not yet in `package.json`)
- Playwright - E2E testing (referenced in project docs, not yet in `package.json`)

**Build/Dev:**
- TypeScript 5.x - Type checking and compilation
- ESLint 9.x - Linting with `eslint-config-next` 16.1.6 (`britv3.0/eslint.config.mjs`)
- Tailwind CSS 4.x - Utility-first CSS (`britv3.0/postcss.config.mjs`)
- PostCSS - CSS processing via `@tailwindcss/postcss`

## Key Dependencies

**Current (installed in `britv3.0/package.json`):**

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.6 | Full-stack framework |
| react | 19.2.3 | UI library |
| react-dom | 19.2.3 | DOM rendering |
| tailwindcss | ^4 | Utility CSS |
| @tailwindcss/postcss | ^4 | PostCSS integration |
| typescript | ^5 | Type system |
| eslint | ^9 | Code linting |
| eslint-config-next | 16.1.6 | Next.js lint rules |

**Planned (from project docs, not yet installed):**

| Package | Purpose |
|---------|---------|
| @supabase/supabase-js | Supabase client (auth, DB, storage, realtime) |
| @supabase/ssr | Server-side Supabase auth |
| stripe | Stripe Connect payments |
| @anthropic-ai/sdk | Claude AI integration |
| @xenova/transformers | Local embedding generation |
| @maptiler/sdk | Map API |
| maplibre-gl | Map rendering |
| @tanstack/react-query | Data fetching/caching |
| resend | Transactional email |
| @upstash/redis | Rate limiting |
| @sentry/nextjs | Error tracking |
| posthog-js | Product analytics |
| zod | Schema validation |

**UI Components (planned):**
- Shadcn UI (copy-paste components based on Radix UI primitives)
- Component location: `src/components/ui/`

## Configuration

**TypeScript (`britv3.0/tsconfig.json`):**
- Target: ES2017
- Module: ESNext with bundler resolution
- Strict mode: enabled
- JSX: react-jsx
- Path alias: `@/*` maps to `./src/*`
- Incremental compilation: enabled
- Next.js plugin configured

**ESLint (`britv3.0/eslint.config.mjs`):**
- Flat config format (ESLint 9)
- Extends: `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

**PostCSS (`britv3.0/postcss.config.mjs`):**
- Plugin: `@tailwindcss/postcss` (Tailwind v4 integration)

**Next.js (`britv3.0/next.config.ts`):**
- Currently empty/default configuration (no custom settings yet)

**Environment:**
- `.env` file present at project root (gitignored)
- Required vars (from docs): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_MAPTILER_KEY`, `RESEND_API_KEY`
- Optional vars: `NEXT_PUBLIC_POSTHOG_KEY`, `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**MCP (`.mcp.json`):**
- Supabase MCP server configured for development tooling

## Platform Requirements

**Development:**
- Node.js with pnpm
- Supabase account (or local Supabase via CLI)
- Environment variables configured in `.env.local`

**Production:**
- Vercel - Next.js hosting and serverless functions
- Supabase - PostgreSQL database, auth, storage, realtime
- Stripe - Payment processing
- Various SaaS integrations (see INTEGRATIONS.md)

## Current State

**IMPORTANT:** This is a greenfield project in early setup. The `britv3.0/` subdirectory contains a fresh Next.js 16 scaffold created with `create-next-app`. Only default boilerplate files exist in `src/`:
- `src/app/layout.tsx` - Root layout with Geist fonts
- `src/app/page.tsx` - Default Next.js landing page
- `src/app/globals.css` - Tailwind v4 import with CSS custom properties
- `src/app/favicon.ico` - Default favicon

The `docs/` directory contains extensive PRD and architecture planning documents (11 epic documents + PRD + project memory) that define the target stack and architecture. All planned dependencies, services, and patterns described above come from these planning documents and need to be implemented.

---

*Stack analysis: 2026-03-06*
