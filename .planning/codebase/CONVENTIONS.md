# Coding Conventions

**Analysis Date:** 2026-03-06

## Project State

This is a fresh Next.js 16 scaffold (Britestate v3.0) with extensive documentation from the previous v2.0 codebase in `britv3.0/docs/`. The actual source code is minimal (scaffold only), so conventions are derived from the existing scaffold code patterns plus the documented v2.0 conventions in `britv3.0/docs/project memory 2026.txt` which serve as the target standard for new development.

**Root project directory:** `britv3.0/` (contains `src/`, `package.json`, etc.)

## Naming Patterns

**Files:**
- Components: PascalCase - `PropertyCard.tsx`, `LoginForm.tsx`, `RoleSelector.tsx`
- Hooks: camelCase with `use` prefix - `usePropertySearch.ts`, `useAuth.ts`
- Services: kebab-case - `property-search-service.ts`, `auth-service.ts`
- Type definitions: PascalCase - `PropertyListing.ts`
- API routes: always `route.ts` inside named folders - `api/properties/route.ts`
- Utilities: camelCase - `formatCurrency.ts`
- Config files: kebab-case with `.mjs` or `.ts` extension - `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`
- CSS: `globals.css` for global styles (single file, no CSS modules)

**Functions:**
- Use camelCase: `calculateMortgage`, `formatCurrency`
- React components use PascalCase: `RootLayout`, `Home`, `PropertyCard`
- Export functions directly (named or default), not as class methods

**Variables:**
- camelCase for local variables and parameters
- Constants: SCREAMING_SNAKE_CASE - `MAX_UPLOAD_SIZE`
- CSS custom properties: kebab-case with `--` prefix - `--font-geist-sans`, `--color-background`

**Types:**
- PascalCase for type/interface names: `Metadata`, `NextConfig`
- Use `type` keyword for type-only imports: `import type { Metadata } from "next"`
- Inline object types for component props using `Readonly<{}>` wrapper:
  ```typescript
  function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {}
  ```

## Code Style

**Formatting:**
- No Prettier config detected - use ESLint for formatting enforcement
- Indentation: 2 spaces
- Semicolons: required (observed in all scaffold files)
- Quotes: double quotes for strings (observed in imports and JSX)
- Trailing commas: used in multi-line objects/arrays
- Line length: no explicit limit configured

**Linting:**
- ESLint 9 with flat config format: `britv3.0/eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- Run with: `pnpm lint` (which runs bare `eslint` command)

**TypeScript:**
- Strict mode enabled in `britv3.0/tsconfig.json`
- Target: ES2017
- Module resolution: bundler
- JSX: react-jsx
- Path alias: `@/*` maps to `./src/*`

## Import Organization

**Order:**
1. External framework imports (`react`, `next/*`)
2. External library imports (`@tanstack/react-query`, etc.)
3. Internal absolute imports using `@/` alias (`@/components/`, `@/hooks/`, `@/services/`)
4. Relative imports (co-located files like `./globals.css`)

**Path Aliases:**
- `@/*` resolves to `./src/*` (configured in `britv3.0/tsconfig.json`)
- Always use `@/` for cross-directory imports; use relative paths only for sibling files

**Type-only imports:**
- Use `import type { X }` syntax for types that are not used as values:
  ```typescript
  import type { Metadata } from "next";
  import type { User, Session } from "@supabase/supabase-js";
  ```

## Component Patterns

**Server vs Client Components:**
- Server Components are the default (no directive needed)
- Client Components must be marked with `"use client"` directive at top of file
- Prefer Server Components for data fetching and static rendering
- Use Client Components only when needing interactivity, browser APIs, or React hooks

**Component Structure:**
```typescript
// 1. Imports (type imports separate)
import type { Metadata } from "next";
import Image from "next/image";

// 2. Constants/configuration (if any)
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// 3. Metadata export (for pages)
export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description",
};

// 4. Component export (default for pages/layouts)
export default function ComponentName() {
  return (/* JSX */);
}
```

**Props:**
- Inline prop types for simple components (no separate interface):
  ```typescript
  export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {}
  ```
- Use `Readonly<{}>` wrapper for component props

**Deprecated Patterns (DO NOT USE):**
- Class components
- `getServerSideProps` / `getStaticProps` (Pages Router patterns)
- CSS Modules (`Component.module.css`)
- Old Supabase client creation (`import { createClient } from "@supabase/supabase-js"`)

## Styling

**Framework:** Tailwind CSS v4 with PostCSS plugin
- Config: `britv3.0/postcss.config.mjs` (uses `@tailwindcss/postcss`)
- Global styles: `britv3.0/src/app/globals.css`
- Import Tailwind via `@import "tailwindcss"` in globals.css

**Patterns:**
- Utility-first: apply Tailwind classes directly in JSX `className`
- Use CSS custom properties for theme values: `--background`, `--foreground`
- Dark mode via `prefers-color-scheme` media query and `dark:` Tailwind prefix
- Custom theme values inline via `@theme inline {}` block in globals.css
- Font variables set via Next.js `next/font/google` and applied as CSS variables

**UI Components:**
- Use Shadcn UI components (copy-paste model) placed in `src/components/ui/`
- Shadcn components are built on Radix UI primitives for accessibility

## Error Handling

**Patterns (from v2.0 documented conventions):**
- API routes should return appropriate HTTP status codes with JSON error bodies
- Use try/catch in async operations
- Circuit breaker pattern for external service calls (AI, payment APIs)

## Logging

**Framework:** console (no structured logging library detected)

**Patterns:**
- Use `console.error` for errors
- Use `console.warn` for warnings
- Production monitoring intended via Sentry integration

## Comments

**When to Comment:**
- Config files include inline comments for sections: `/* config options here */`
- Use comments for non-obvious behavior or workarounds

**JSDoc/TSDoc:**
- Not widely used in scaffold code
- Follow convention of adding JSDoc for exported service functions and complex utilities

## Git Conventions

**Commit Messages:** Conventional Commits format
```
type(scope): description

# Types: feat, fix, docs, style, refactor, test, chore
# Examples:
feat(auth): add Google OAuth integration
fix(search): resolve map clustering issue
test(dashboard): add homebuyer journey tests
```

**Branch Naming:**
```
feature/epic-N-description
fix/short-description
hotfix/urgent-description
chore/maintenance-description
docs/documentation-description
```

## Module Design

**Exports:**
- Pages and layouts use `export default function`
- Metadata uses named export: `export const metadata`
- Services and utilities use named exports
- No barrel files detected in current scaffold

**Service Layer Pattern:**
- Services organized by domain in `src/services/[domain]/`
- Each service file is kebab-case: `property-service.ts`
- Services handle business logic; components handle presentation

---

*Convention analysis: 2026-03-06*
