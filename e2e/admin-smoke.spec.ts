import { getDashboardRoutes } from "../src/__tests__/routes/route-manifest";
import { test, expect } from "./fixtures/auth";
import {
  captureConsoleErrors,
  expectDashboardDestinationToRender,
} from "./fixtures/smoke-helpers";

/**
 * Admin back-office smoke + non-admin permission gating.
 *
 * Part 1 (render smoke): as `admin`, navigate EVERY static (non-`[param]`)
 * admin route sourced from the route manifest (`surface === "admin"`), asserting
 * each renders: HTTP status < 400, no app-error text, a visible heading, and no
 * unexpected (non-allowlisted) console errors. Mirrors dashboard-smoke.spec.ts.
 *
 * Part 2 (gating): as a NON-admin (`homebuyer`), attempt to load `/admin` and
 * representative deep admin routes and assert the user is BLOCKED — the admin
 * layout (`src/app/(admin)/layout.tsx`) redirects non-admins away from the
 * `/admin` surface, so we assert the user lands OFF `/admin` and sees no admin
 * content.
 *
 * Desktop-only: the nav/mobile surfaces are covered elsewhere.
 *
 * FINDINGS POLICY: this suite establishes coverage; it does NOT fix app bugs.
 * A route that genuinely fails the render smoke is marked `test.fixme` with a
 * `// FINDING:` comment (see FIXME_ROUTES) — never deleted, loosened, or masked
 * by broadening the console allowlist. A non-admin who is NOT blocked from an
 * admin route is a CRITICAL security finding and must fail loudly, never be
 * papered over.
 */

// Hosted Supabase under parallel load occasionally drops a fetch (token-refresh
// race, aborted-on-navigation). Retries let those transient flakes self-heal so
// only genuinely-broken routes stay red. Matches dashboard-smoke.spec.ts.
test.describe.configure({ retries: 2 });

/** Static (non-dynamic) admin routes from the manifest — never hand-listed. */
const ADMIN_ROUTES: readonly string[] = getDashboardRoutes()
  .filter((entry) => entry.surface === "admin" && !entry.dynamic)
  .map((entry) => entry.urlPath)
  .sort();

/**
 * Admin routes confirmed to genuinely fail the smoke assertions (real crash /
 * missing heading / unexpected console error). Each is skipped via `test.fixme`
 * so the suite ends GREEN while every real breakage stays tracked. Fixing these
 * belongs to a later milestone — never masked by loosening an assertion or
 * broadening the console allowlist.
 *
 * FINDINGS (confirmed reproducible after retries — not transient flake):
 *  - /admin/email-campaigns — HTTP 500. The server component queries
 *      `email_campaigns` and the page throws (blank body, status 500); the
 *      table/columns selected do not resolve against the hosted DB.
 *  - /admin/verifications — page shell renders but a server query throws
 *      `column profiles.full_name does not exist`
 *      ([admin:verification-service] getVerificationQueue), logged to console.
 *  - /admin/moderation — page shell renders but a server query throws
 *      `column properties.status does not exist`
 *      ([admin:listing-service] getListingQueue), logged to console.
 *  - /admin/subscriptions — page shell renders but a server query throws
 *      `column subscriptions.plan does not exist`
 *      ([admin:subscription-service] getSubscriptions), logged to console.
 *
 * All four are app/DB-schema bugs (query column drift), not test issues. The
 * three console-error cases are NOT added to the allowlist — that would mask the
 * symptom; they are fixme'd as findings instead.
 */
const FIXME_ROUTES: ReadonlySet<string> = new Set<string>([
  "/admin/email-campaigns",
  "/admin/verifications",
  "/admin/moderation",
  "/admin/subscriptions",
]);

test.describe("admin route smoke", () => {
  test.use({ role: "admin" });

  for (const href of ADMIN_ROUTES) {
    test(`renders ${href}`, async ({ authenticatedPage }) => {
      test.skip(
        test.info().project.name === "mobile",
        "Admin smoke runs on desktop.",
      );

      // FINDING: see FIXME_ROUTES above for the tracked symptom.
      test.fixme(
        FIXME_ROUTES.has(href),
        `${href} is a known failing admin route (tracked finding).`,
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

/**
 * Representative admin routes a non-admin must NOT reach: the surface root plus
 * two deep, sensitive pages (user management, GDPR). The layout gates the whole
 * `/admin` tree identically, so a small representative set proves the gate.
 */
const GATED_ROUTES: readonly string[] = ["/admin", "/admin/users", "/admin/gdpr"];

test.describe("admin permission gating (non-admin)", () => {
  test.use({ role: "homebuyer" });

  for (const href of GATED_ROUTES) {
    test(`blocks homebuyer from ${href}`, async ({ authenticatedPage }) => {
      test.skip(
        test.info().project.name === "mobile",
        "Admin gating runs on desktop.",
      );

      await authenticatedPage.goto(href, { waitUntil: "domcontentloaded" });
      // The admin layout redirects server-side; wait for the post-redirect load.
      await authenticatedPage
        .waitForLoadState("load", { timeout: 10_000 })
        .catch(() => undefined);

      // SECURITY ASSERTION: a non-admin must end up OFF the /admin surface.
      // The admin layout (src/app/(admin)/layout.tsx) redirects non-admins; the
      // observed block target is /forbidden. If a non-admin is left on an
      // /admin/* URL, that is a CRITICAL access-control failure — fail loudly.
      expect(
        new URL(authenticatedPage.url()).pathname.startsWith("/admin"),
        `SECURITY: homebuyer was NOT redirected off ${href} (final URL ${authenticatedPage.url()})`,
      ).toBe(false);

      // And no admin chrome should be visible on whatever page they land on.
      await expect(
        authenticatedPage.getByText("ADMIN CONSOLE", { exact: false }),
        `SECURITY: admin content visible to homebuyer after navigating to ${href}`,
      ).toHaveCount(0);
    });
  }
});
