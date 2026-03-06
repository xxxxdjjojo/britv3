# Codebase Structure

**Analysis Date:** 2026-03-06

## Current State

The codebase is a fresh Next.js 16 scaffold created with `create-next-app`. Only the default files exist in `src/`. The target structure documented below comes from the project planning documents in `docs/project memory 2026.txt` and represents the architecture to be built out. The inner project directory `britv3.0/` contains the actual Next.js project.

## Directory Layout

```
britv3.0/                        # Inner project root (Next.js project)
├── docs/                        # Planning & PRD documents
│   ├── brit estate prd 2026.txt # Full product requirements
│   ├── project memory 2026.txt  # Architecture decisions & dev guide
│   ├── claude epic *.txt        # Epic-level requirements
│   └── epic*.txt                # Additional epic specs
├── public/                      # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/                         # Source code (currently scaffold only)
│   └── app/                     # Next.js App Router
│       ├── layout.tsx           # Root layout
│       ├── page.tsx             # Homepage
│       ├── globals.css          # Global styles (Tailwind v4)
│       └── favicon.ico
├── eslint.config.mjs            # ESLint flat config (Next.js + TS)
├── next.config.ts               # Next.js config (empty)
├── package.json                 # Dependencies & scripts
├── pnpm-lock.yaml               # pnpm lockfile
├── pnpm-workspace.yaml          # pnpm workspace config
├── postcss.config.mjs           # PostCSS with Tailwind plugin
├── tsconfig.json                # TypeScript config (strict mode)
└── README.md                    # Default Next.js README
```

## Target Directory Layout (Per Planning Docs)

```
src/
├── app/                         # Next.js App Router pages & API
│   ├── (auth)/                  # Auth routes (login, signup, etc.)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (main)/                  # Public routes
│   │   ├── page.tsx             # Homepage
│   │   ├── about/
│   │   ├── contact/
│   │   └── search/
│   ├── (protected)/             # Auth-required routes
│   ├── admin/                   # Admin panel
│   │   ├── users/
│   │   ├── moderation/
│   │   └── verification/
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   ├── properties/
│   │   ├── messages/
│   │   ├── search/
│   │   ├── ai/
│   │   ├── v1/                  # Versioned marketplace API
│   │   │   └── marketplace/
│   │   └── webhooks/
│   ├── dashboard/               # Role-specific dashboards
│   │   ├── homebuyer/
│   │   ├── renter/
│   │   ├── seller/
│   │   ├── landlord/
│   │   ├── agent/
│   │   └── provider/
│   ├── legal/                   # Legal/compliance pages
│   ├── services/                # Service provider pages
│   └── layout.tsx               # Root layout
├── components/                  # React components
│   ├── ui/                      # Shadcn UI base components
│   ├── auth/                    # Auth forms & flows
│   ├── dashboard/               # Dashboard widgets
│   ├── navigation/              # Nav, footer, breadcrumbs
│   ├── properties/              # Property cards, grid, map, filters
│   ├── marketplace/             # Provider cards, quote forms, reviews
│   └── [feature]/               # Feature-specific components
├── contexts/                    # React context providers
├── hooks/                       # Custom React hooks
├── lib/                         # SDK clients & shared utilities
│   └── supabase/                # Supabase client factories
│       ├── server.ts            # Server-side client
│       └── client.ts            # Client-side client
├── services/                    # Business logic layer
│   ├── analytics/               # Analytics services
│   ├── ai/                      # AI/ML services
│   ├── auth/                    # Auth services
│   ├── marketplace/             # RFQ, quotes, bookings
│   ├── messaging/               # Messages, notifications
│   ├── payments/                # Stripe integration
│   └── properties/              # Property CRUD, search, listings
├── types/                       # TypeScript type definitions
└── utils/                       # Helper/utility functions
```

Additional top-level directories planned:
```
supabase/                        # Supabase config
│   └── migrations/              # SQL migration files
tests/                           # Test files
│   ├── unit/
│   ├── integration/
│   │   ├── api/
│   │   └── services/
│   ├── e2e/                     # Playwright E2E tests
│   │   ├── auth/
│   │   ├── search/
│   │   ├── dashboard/
│   │   └── marketplace/
│   ├── performance/
│   ├── visual-regression/
│   └── fixtures/                # Test data factories
workers/                         # Background job processors
scripts/                         # Build & utility scripts
.github/                         # GitHub Actions CI/CD
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router -- all pages, layouts, and API routes
- Contains: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts` files
- Key files: `src/app/layout.tsx` (root layout), `src/app/page.tsx` (homepage)
- Route groups: `(auth)`, `(main)`, `(protected)` for layout/middleware scoping

**`src/components/`:**
- Purpose: All React components, organized by feature domain
- Contains: TSX component files
- Key subdirectory: `ui/` for Shadcn base components (Button, Card, Dialog, etc.)

**`src/services/`:**
- Purpose: Business logic separated from UI; all Supabase queries and external API calls
- Contains: TypeScript service files organized by domain
- Key pattern: Each subdirectory maps to a domain (auth, properties, marketplace, etc.)

**`src/lib/`:**
- Purpose: Shared libraries and SDK client factories
- Contains: Supabase client setup, utility wrappers
- Key files: `supabase/server.ts` (server component client), `supabase/client.ts` (browser client)

**`src/hooks/`:**
- Purpose: Custom React hooks for shared stateful logic
- Contains: Hook files prefixed with `use` (e.g., `useAuth.ts`, `usePropertySearch.ts`)

**`src/contexts/`:**
- Purpose: React Context providers for global state
- Contains: Context definition + provider component files

**`src/types/`:**
- Purpose: Shared TypeScript type/interface definitions
- Contains: Domain-organized type files (e.g., `property.ts`, `user.ts`)

**`src/utils/`:**
- Purpose: Pure utility/helper functions (formatting, validation, etc.)
- Contains: Small focused utility modules

**`docs/`:**
- Purpose: Project planning, PRD, epic specifications
- Contains: Text files with requirements and architecture decisions
- Key files: `brit estate prd 2026.txt` (full PRD), `project memory 2026.txt` (dev reference)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout -- HTML structure, fonts, global providers
- `src/app/page.tsx`: Homepage component
- `src/app/api/*/route.ts`: API route handlers

**Configuration:**
- `package.json`: Dependencies, scripts (`dev`, `build`, `start`, `lint`)
- `tsconfig.json`: TypeScript config (strict mode, `@/*` path alias mapping to `./src/*`)
- `next.config.ts`: Next.js configuration (currently empty)
- `eslint.config.mjs`: ESLint flat config with Next.js core-web-vitals + TypeScript rules
- `postcss.config.mjs`: PostCSS with Tailwind CSS v4 plugin
- `pnpm-workspace.yaml`: pnpm workspace configuration

**Styling:**
- `src/app/globals.css`: Global CSS with Tailwind v4 import, CSS custom properties for theming, dark mode support

## Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `PropertyCard.tsx`, `LoginForm.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`, `usePropertySearch.ts`)
- Services: `kebab-case.ts` (e.g., `property-service.ts`, `rfq-service.ts`)
- Types: `PascalCase.ts` or `kebab-case.ts` (e.g., `PropertyListing.ts`)
- Utilities: `camelCase.ts` (e.g., `formatCurrency.ts`)
- API routes: Always `route.ts` inside descriptive directory (e.g., `api/properties/route.ts`)
- Pages: Always `page.tsx` inside route directory
- Layouts: Always `layout.tsx` inside route directory

**Directories:**
- Route groups: Parenthesized lowercase `(auth)`, `(main)`, `(protected)`
- Feature dirs: `kebab-case` (e.g., `forgot-password/`, `saved-searches/`)
- Component dirs: `kebab-case` by domain (e.g., `properties/`, `marketplace/`)
- Service dirs: `kebab-case` by domain (e.g., `ai/`, `payments/`)

**Constants:** `SCREAMING_SNAKE_CASE` (e.g., `MAX_UPLOAD_SIZE`)

## Where to Add New Code

**New Page/Route:**
- Place in `src/app/` under appropriate route group
- Public pages: `src/app/(main)/[route-name]/page.tsx`
- Auth pages: `src/app/(auth)/[route-name]/page.tsx`
- Protected pages: `src/app/(protected)/[route-name]/page.tsx`
- Dashboard pages: `src/app/dashboard/[role]/[feature]/page.tsx`
- Admin pages: `src/app/admin/[feature]/page.tsx`

**New API Endpoint:**
- Place in `src/app/api/[domain]/route.ts`
- Versioned marketplace endpoints: `src/app/api/v1/marketplace/[resource]/route.ts`
- Webhook handlers: `src/app/api/webhooks/[service]/route.ts`

**New Component:**
- UI primitives (Shadcn): `src/components/ui/[component].tsx`
- Feature components: `src/components/[domain]/[ComponentName].tsx`
- Use PascalCase for component file names

**New Service:**
- Place in `src/services/[domain]/[service-name].ts`
- Follow existing domain grouping (auth, properties, marketplace, messaging, payments, ai, analytics)

**New Hook:**
- Place in `src/hooks/use[HookName].ts`
- Prefix with `use` per React convention

**New Type Definition:**
- Place in `src/types/[domain].ts`

**New Utility Function:**
- Place in `src/utils/[utilName].ts`
- Keep utilities pure and focused

**New Test:**
- Unit tests: `tests/unit/` or co-located as `*.spec.ts` next to source
- Integration tests: `tests/integration/[api|services]/`
- E2E tests: `tests/e2e/[domain]/[feature].spec.ts`
- Test fixtures: `tests/fixtures/`

**New Database Migration:**
- Place in `supabase/migrations/`
- Use Supabase CLI to generate: `npm run supabase:diff`

## Special Directories

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (by `next build` and `next dev`)
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: Installed npm packages
- Generated: Yes (by `pnpm install`)
- Committed: No (in `.gitignore`)

**`docs/`:**
- Purpose: Project planning documents, PRD, epic specifications
- Generated: No (manually authored)
- Committed: Yes

**`public/`:**
- Purpose: Static assets served at root URL path
- Generated: No
- Committed: Yes

**`supabase/migrations/` (planned):**
- Purpose: Database schema migration SQL files
- Generated: Partially (via Supabase CLI diff)
- Committed: Yes

**`workers/` (planned):**
- Purpose: Background job processors (embedding generation, batch analytics)
- Generated: No
- Committed: Yes

## Path Alias

The `@/*` alias maps to `./src/*` (configured in `tsconfig.json`). Use absolute imports:

```typescript
// Use this:
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { Property } from "@/types/property";

// Not this:
import { Button } from "../../../components/ui/button";
```

---

*Structure analysis: 2026-03-06*
