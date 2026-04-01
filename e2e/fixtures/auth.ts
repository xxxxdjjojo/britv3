import { test as base, type Page } from "@playwright/test";
import { isAuthenticated } from "./helpers";

/** User roles matching the application. */
export type UserRole =
  | "homebuyer"
  | "renter"
  | "seller"
  | "landlord"
  | "agent"
  | "provider"
  | "admin";

type AuthFixtures = {
  /** A Page instance pre-loaded with authentication state for the current role. */
  authenticatedPage: Page;
  /** The role to authenticate as. Override per-test via `test.use({ role: "seller" })`. */
  role: UserRole;
};

/**
 * Extended Playwright test with auth fixtures.
 *
 * Usage:
 * ```ts
 * import { test, expect } from "../fixtures/auth";
 *
 * test.use({ role: "homebuyer" });
 *
 * test("can view saved properties", async ({ authenticatedPage }) => {
 *   await authenticatedPage.goto("/dashboard/homebuyer");
 *   // ...
 * });
 * ```
 */
export const test = base.extend<AuthFixtures>({
  role: ["homebuyer", { option: true }],

  authenticatedPage: async ({ browser, role }, use, testInfo) => {
    const authFile = `e2e/.auth/${role}.json`;
    const hasAuth = isAuthenticated(authFile);

    if (!hasAuth) {
      testInfo.skip(
        true,
        `No auth state for role "${role}". Skipping authenticated test.`,
      );
      // Return value is unused when skipped, but TS needs the callback to resolve.
      return;
    }

    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();

    await use(page);

    await context.close();
  },
});

export { expect } from "@playwright/test";
