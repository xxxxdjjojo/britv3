import { test, expect } from "./fixtures/auth";
import { expectNoAppError } from "./fixtures/smoke-helpers";

/**
 * Negative-path access tests for the dashboard surface.
 *
 * Three groups, each asserting REAL observed behavior (probed against the
 * running app, not guessed):
 *
 *   1. Unknown route → Next.js not-found fallback (HTTP 404 + `not-found.tsx`
 *      copy). Must run AUTHENTICATED: `src/middleware.ts` treats any
 *      non-public path as protected and 307-redirects an unauthenticated user
 *      to `/login?redirectTo=…` BEFORE the route resolves — so an unauth bogus
 *      route never reaches the 404 page. An authed user passes the middleware
 *      gate and the missing route renders the real 404 UI.
 *
 *   2. Unauthenticated protected route → `/login?redirectTo=<encoded path>`.
 *      The redirect + `redirectTo` query param is added by `src/middleware.ts`
 *      (307); `(protected)/layout.tsx` is the server-side defense-in-depth
 *      backstop. Uses a FRESH no-auth context (base `page`), never the
 *      authenticated fixture.
 *
 *   3. Cross-role block → a homebuyer hitting another role's dashboard is
 *      redirected to their OWN dashboard by `(protected)/dashboard/[role]/
 *      layout.tsx` (active_role !== url role → redirect(`/dashboard/${active_role}`)).
 *
 * COMPLEMENTARY TO `role-dashboard-redirect.spec.ts`: that spec only covers the
 * UNAUTHENTICATED `/dashboard/<role>` → login case for all 7 roles. It does NOT
 * exercise the authenticated cross-role block (group 3) nor the 404 fallback
 * (group 1), so none of these groups duplicate it.
 *
 * Desktop-only, mirroring the other dashboard specs (the nav spec covers mobile).
 *
 * FINDINGS POLICY: a genuine missing control (e.g. a bogus route rendering 200,
 * or an unauthenticated user NOT redirected) is a real finding — it is marked
 * `test.fixme` with a `// FINDING:` note and reported, never masked.
 */

// Hosted Supabase under parallel load occasionally drops a fetch on the auth
// path; retries let those transient flakes self-heal (mirrors dashboard-smoke).
test.describe.configure({ retries: 2, timeout: 90_000 });

const skipOnMobile = () =>
  test.skip(
    test.info().project.name === "mobile",
    "Negative-path access runs on desktop; the nav spec covers mobile.",
  );

// ── Group 1: unknown route → not-found fallback ────────────────────────────
test.describe("unknown route → not-found fallback", () => {
  test.use({ role: "landlord" });

  // Bogus paths: one nested under a real dashboard surface, one top-level.
  const BOGUS_ROUTES = [
    "/dashboard/landlord/__no_such_page__",
    "/__totally_bogus__",
  ] as const;

  for (const route of BOGUS_ROUTES) {
    test(`renders the 404 page for ${route}`, async ({ authenticatedPage }) => {
      skipOnMobile();

      const response = await authenticatedPage.goto(route, {
        waitUntil: "domcontentloaded",
      });

      // Next returns a real HTTP 404 for an unmatched route.
      expect(response?.status(), `${route} should return HTTP 404`).toBe(404);

      // not-found.tsx markers (heading + "Error 404" pill copy).
      await expect(
        authenticatedPage.getByRole("heading", { name: /page not found/i }),
      ).toBeVisible();
      await expect(
        authenticatedPage.getByText(/error 404/i),
      ).toBeVisible();
    });
  }
});

// ── Group 2: unauthenticated → /login?redirectTo=… ─────────────────────────
test.describe("unauthenticated protected route → login", () => {
  // Protected routes that should bounce an anonymous visitor to login.
  const PROTECTED_ROUTES = [
    "/dashboard",
    "/dashboard/landlord",
    "/inbox",
  ] as const;

  for (const route of PROTECTED_ROUTES) {
    test(`redirects ${route} to /login with redirectTo param`, async ({
      browser,
    }) => {
      skipOnMobile();

      // FRESH context with NO stored auth state — must not reuse the auth
      // fixture. This is the genuine unauthenticated path.
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await page.goto(route, { waitUntil: "domcontentloaded" });

        // Final URL is the login page, carrying the original path as a
        // `redirectTo` query param (set by src/middleware.ts).
        const finalUrl = new URL(page.url());
        expect(finalUrl.pathname, `${route} should land on /login`).toBe(
          "/login",
        );
        expect(
          finalUrl.searchParams.get("redirectTo"),
          `${route} login URL should carry redirectTo=<original path>`,
        ).toBe(route);

        // The login surface should actually render (a form is present).
        await expect(page.locator("form").first()).toBeVisible();
        await expectNoAppError(page);
      } finally {
        await context.close();
      }
    });
  }
});

// ── Group 3: cross-role block ──────────────────────────────────────────────
// NOT covered by role-dashboard-redirect.spec.ts (that spec only tests the
// UNAUTHENTICATED → login case). A homebuyer reaching another role's dashboard
// is sent back to their own by (protected)/dashboard/[role]/layout.tsx.
test.describe("cross-role dashboard block", () => {
  test.use({ role: "homebuyer" });

  test("homebuyer hitting /dashboard/agent is redirected to own dashboard", async ({
    authenticatedPage,
  }) => {
    skipOnMobile();

    const response = await authenticatedPage.goto("/dashboard/agent", {
      waitUntil: "domcontentloaded",
    });

    // Redirect resolves to 200 on the buyer's own dashboard.
    expect(response?.status()).toBeLessThan(400);

    // Final URL is the buyer's own dashboard, NOT the agent surface.
    const finalPath = new URL(authenticatedPage.url()).pathname;
    expect(finalPath).toBe("/dashboard/homebuyer");
    expect(finalPath).not.toContain("/agent");

    await expectNoAppError(authenticatedPage);
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible();
  });
});
