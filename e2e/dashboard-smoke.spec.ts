import { staticRoutesForRole } from "../src/__tests__/routes/route-manifest";
import type { UserRole as AppRole } from "../src/types/auth";
import { test, expect, type UserRole as AuthRole } from "./fixtures/auth";
import {
  captureConsoleErrors,
  expectDashboardDestinationToRender,
} from "./fixtures/smoke-helpers";

/**
 * Per-role static-route smoke test.
 *
 * For each of the 7 dashboard roles, authenticate and navigate EVERY static
 * (non-`[param]`) route from `staticRoutesForRole(<appRole>)`, asserting each
 * renders: HTTP status < 400, no app-error text, a visible heading, and no
 * unexpected (non-allowlisted) console errors.
 *
 * Desktop-only: the nav spec already covers the mobile bottom-tab surface.
 *
 * FINDINGS POLICY: this suite establishes coverage; it does NOT fix app bugs.
 * A route that genuinely fails is marked `test.fixme` with a `// FINDING:`
 * comment (see FIXME_ROUTES below) — never deleted, loosened, or masked by
 * broadening the console allowlist.
 */

// Hosted Supabase under parallel load occasionally drops a fetch (token-refresh
// race, aborted-on-navigation). Retries let those transient flakes self-heal so
// only genuinely-broken routes stay red. Local default is 0 retries; this opts
// the smoke suite in without touching the shared playwright.config.ts.
test.describe.configure({ retries: 2 });

type SmokeCase = Readonly<{
  appRole: AppRole;
  authRole: AuthRole;
  slug: string;
}>;

// Mirrors the role-case table in dashboard-navigation.spec.ts.
const SMOKE_CASES: readonly SmokeCase[] = [
  { appRole: "homebuyer", authRole: "homebuyer", slug: "homebuyer" },
  { appRole: "renter", authRole: "renter", slug: "renter" },
  { appRole: "seller", authRole: "seller", slug: "seller" },
  { appRole: "landlord", authRole: "landlord", slug: "landlord" },
  { appRole: "agent", authRole: "agent", slug: "agent" },
  { appRole: "service_provider", authRole: "provider", slug: "provider" },
  { appRole: "mortgage_broker", authRole: "mortgage_broker", slug: "mortgage-broker" },
];

/**
 * Whole roles whose dashboard is unreachable for the seeded test user. Every
 * route is fixme'd via a single tracked finding rather than fixme-ing each path.
 *
 * FINDING — service_provider (auth role "provider"):
 *   `src/app/(protected)/dashboard/provider/layout.tsx` calls
 *   `resolveProviderId()`, which throws for the seeded provider user (no
 *   provider record), and the catch redirects to `/onboarding/provider`. That
 *   path does NOT exist (the real onboarding page is `/register/onboarding/
 *   [role]`), so it renders the 404 "Page not found" page. Result: ALL 46
 *   provider dashboard routes 404. Two underlying bugs — a dead redirect target
 *   and a missing provider seed record. Confirmed reproducible across 3 runs.
 */
const FIXME_ROLES: ReadonlySet<AppRole> = new Set<AppRole>([
  "service_provider",
]);

/**
 * Individual routes confirmed to genuinely fail the smoke assertions (real
 * crash / missing heading / unexpected console error). Each is skipped via
 * `test.fixme` so the suite ends GREEN while every real breakage stays tracked.
 * Fixing these belongs to a later milestone — they are never masked by
 * loosening an assertion or broadening the console allowlist.
 *
 * FINDINGS (confirmed reproducible after retries — not transient flake):
 *  - /dashboard/landlord/finance/expenses — console server error
 *      `column properties_1.address_line_1 does not exist` (DB query / schema
 *      mismatch); the page shell renders but the data query throws.
 *  - /dashboard/landlord/finance/report   — same address_line_1 DB error.
 *  - /dashboard/landlord/tenants — React hydration error: a <button> is nested
 *      inside another <button> (invalid DOM nesting).
 *  - /dashboard/agent/crm        — same nested-<button> hydration error.
 */
const FIXME_ROUTES: ReadonlySet<string> = new Set<string>([
  "/dashboard/landlord/finance/expenses",
  "/dashboard/landlord/finance/report",
  "/dashboard/landlord/tenants",
  "/dashboard/agent/crm",
]);

for (const roleCase of SMOKE_CASES) {
  test.describe(`${roleCase.slug} dashboard route smoke`, () => {
    test.use({ role: roleCase.authRole });

    const routes = staticRoutesForRole(roleCase.appRole);
    const roleIsFixme = FIXME_ROLES.has(roleCase.appRole);

    for (const href of routes) {
      test(`renders ${href}`, async ({ authenticatedPage }) => {
        test.skip(
          test.info().project.name === "mobile",
          "Route smoke runs on desktop; the nav spec covers mobile tabs.",
        );

        // FINDING: see FIXME_ROLES / FIXME_ROUTES above for the tracked symptom.
        test.fixme(
          roleIsFixme || FIXME_ROUTES.has(href),
          `${href} is a known failing route (tracked finding).`,
        );

        const consoleErrors = captureConsoleErrors(authenticatedPage);
        consoleErrors.reset();

        await expectDashboardDestinationToRender(authenticatedPage, href);

        expect(
          consoleErrors.errors,
          `${href} logged unexpected console errors:\n${consoleErrors.errors.join("\n")}`,
        ).toEqual([]);
      });
    }
  });
}
