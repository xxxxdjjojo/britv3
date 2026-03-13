# Deferred Items — Phase 17

## Pre-existing TypeScript Errors (Out of Scope for Plan 17-03)

**Discovered during:** Task 1 and Task 2 build verification

**Description:** Multiple untracked/uncommitted Phase 14 landlord dashboard files contain TypeScript errors that prevent `pnpm build` from completing. These files are NOT related to Plan 17-03 changes.

**Affected files (pre-existing, out of scope):**
- `src/app/(protected)/dashboard/landlord/compliance/alerts/page.tsx` — `asChild` prop error (7 occurrences)
- `src/app/(protected)/dashboard/landlord/compliance/page.tsx` — `asChild` prop error
- `src/app/(protected)/dashboard/landlord/deposits/page.tsx` — TenancyRow array cast error
- `src/app/(protected)/dashboard/landlord/finance/expenses/ExpenseTrackerClient.tsx` — asChild + Select null type errors
- `src/app/(protected)/dashboard/landlord/properties/*.tsx` — asChild errors
- `src/app/(protected)/dashboard/landlord/rent/[propertyId]/page.tsx` — asChild error
- `src/app/(protected)/dashboard/landlord/tenants/**/*.tsx` — asChild errors
- `.next/types/validator.ts` — route type mismatch (stale generated types)

**Root cause:** Phase 14 landlord dashboard added untracked TSX files that use `asChild` prop from Shadcn Button, but the Button component in this codebase does not support `asChild`. These were likely written against a Shadcn v1 API but this project uses a custom Button without asChild support.

**Verification:** All Phase 17 plan 03 provider files (`src/components/providers/*.tsx`, `src/services/providers/public-profile-service.ts`) compile with zero TypeScript errors (confirmed via `npx tsc --noEmit --skipLibCheck 2>&1 | grep providers/`).

**Action required:** A future plan should fix the landlord dashboard `asChild` pattern — either add asChild to Button, or replace `<Button asChild>` with `<Link>` wrapper + manual className.

**Logged:** 2026-03-13
