# Contributing to TrueDeed (britv3)

How to set up, build, test, and land changes. Read [ARCHITECTURE.md](ARCHITECTURE.md)
first for the system map, and [CLAUDE.md](CLAUDE.md) for conventions and agent
guidance.

---

## Prerequisites

- **Node** 20+
- **pnpm** 10 (`packageManager` is pinned; use Corepack: `corepack enable`)
- A Supabase project (dev points at a remote project by default — there is no
  required local Postgres)

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in the values you need (see below)
pnpm dev                     # http://localhost:3000
```

`pnpm dev` runs a `predev` guard (`scripts/dev-guard.mjs`) that prints which clone
and branch is serving and warns if you are not in the canonical `britv3` clone.

### Environment variables

`.env.example` documents ~89 variables; `src/env.ts` validates them with Zod at
startup (`@t3-oss/env-nextjs`). You do **not** need all of them. Minimum to boot:

| Variable | Why |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App can't talk to the DB without these |
| `SUPABASE_SERVICE_ROLE_KEY` | Server routes, jobs, ingest |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | Maps (falls back to OSM if absent) |

Everything else is feature-gated: AI (`ANTHROPIC_API_KEY`), email (`RESEND_API_KEY`),
payments (`STRIPE_*`, `GOCARDLESS_*`), verification (`COMPANIES_HOUSE_API_KEY`),
caching/rate-limit (`UPSTASH_REDIS_*`), monitoring (`SENTRY_*`, `POSTHOG_*`).
Pluggable adapters default to a free/mock provider, so the app runs end to end
with nothing paid configured: `REFERENCING_PROVIDER=mock`, `KYC_PROVIDER=stub`,
`ADDRESS_PROVIDER=postcode`. Set an integration's key to `disabled` to skip its gate.
Set `SKIP_ENV_VALIDATION=true` to bypass validation (CI does this).

---

## Commands

```bash
pnpm dev               # dev server (port 3000)
pnpm build             # production build (webpack)
pnpm start             # serve the production build
pnpm lint              # ESLint 9 (flat config) — must be 0 errors
pnpm typecheck         # tsc --noEmit
pnpm test              # Vitest unit/integration (493 files, ~3,800 cases)
pnpm test:db           # DB-backed tests (RUN_DB_TESTS=1; needs a Postgres)
pnpm test:e2e          # Playwright E2E (68 specs)
pnpm test:e2e:ui       # Playwright interactive
pnpm check:migrations  # guard migration-prefix collisions
pnpm check:brand       # guard public-page brand policy (no off-system colours)
pnpm analyze           # ANALYZE=true build (bundle analyzer)
```

Production is dramatically faster than dev (route compilation happens on first hit
in dev). Use `pnpm build && pnpm start` for any demo or perf check, never `pnpm dev`.

---

## Testing

| Suite | Tool | Location | Notes |
|-------|------|----------|-------|
| Unit / integration | Vitest + happy-dom + Testing Library | `src/**/*.test.{ts,tsx}` | Default `pnpm test`; mocks in `src/__tests__` and `src/lib/mock-data` |
| DB | Vitest (node) + `pg` | `db-tests/**` | `pnpm test:db`, 120s timeout, runs against a real Postgres |
| E2E | Playwright | `e2e/**/*.spec.ts` | Chromium desktop + mobile; `auth.setup.ts` seeds session; 2 retries in CI |

Write tests with the data you'd actually break: behavioural assertions over markup
snapshots. For services, test the pure `build*()` transforms directly; reserve
DB-backed tests for RLS and query behaviour.

---

## Code style

Match the surrounding code. The enforced bits:

- TypeScript strict; `@/*` → `./src/*`; `import type` for type-only imports;
  prefer `type` over `interface`; branded types for domain IDs.
- Server Components by default; add `"use client"` only when a component needs
  interactivity. Primitives in `src/components/ui/`, feature components by domain.
- Tailwind v4 utilities + CSS custom properties (`globals.css`). No CSS modules.
  No Prettier — ESLint handles formatting. Double quotes, semicolons, 2-space indent,
  trailing commas.
- `console.log` is a lint error outside tests/scripts. Use
  `lib/observability/capture-exception.ts` / the logger.
- Validate external input with Zod at the boundary. Never trust API responses, user
  input, or file content.

A `pre-commit` hook (husky + lint-staged) runs `eslint --fix` on staged `*.ts(x)`.

---

## Database changes

```bash
supabase migration new <description>   # always — gives a full 14-digit UTC prefix
```

One logical change per file. Never hand-pick short numeric prefixes (collisions
break `db reset`/`db push`; `pnpm check:migrations` guards this). Add RLS policies in
the same migration that creates a table. Regenerate `src/types/database.types.ts`
after schema changes. Prod migrations are applied manually — see
`supabase/migrations/README.md`.

---

## Branch & landing discipline (mandatory)

`origin/main` is the only long-lived branch. Every change lands or is closed.

1. **Start synced, in your own worktree.**
   ```bash
   git fetch origin
   git worktree add ../wt-<name> -b <type>/<scope> origin/main
   ```
   One task = one worktree. Never branch-switch a shared checkout or edit another
   worktree.
2. **Keep it small** — one PR's worth of work (< ~1 day). If it grows, split it.
3. **Go green locally first:** `pnpm lint` (0 errors), `pnpm build` (exit 0),
   `pnpm test`, `pnpm check:migrations`.
4. **Land it the same day:** open a PR → CI green → **squash-merge** (branch
   auto-deletes) → `git worktree remove ../wt-<name>`.
5. **No exceptions:** no long-lived branches, no unsquashed merges, no PR open > 48h.

Commits follow Conventional Commits: `type(scope): description` with types
`feat, fix, refactor, docs, test, chore, perf, ci`. Branches: `feature/<scope>`,
`fix/<scope>`.

Full policy: `docs/BRANCH_WORKFLOW.md`.

---

## Verification protocol

Before claiming any change is done:

1. `pnpm build` — exit 0
2. `pnpm lint` — 0 errors
3. Run the relevant tests (and `pnpm test:e2e` if you touched a user flow)
4. `pnpm check:migrations` if you added a migration
5. Manually verify the feature works. Never say "this should work" — confirm it does.

---

## Documentation

Docs live at the repo root and in `docs/`. If your PR changes a public surface — a
route, an API group, an integration, an env var, or a major table — update the
relevant section of [ARCHITECTURE.md](ARCHITECTURE.md) in the same PR. Add a
[CHANGELOG.md](CHANGELOG.md) entry for anything user-visible.
