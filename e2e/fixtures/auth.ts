import { test as base, type Page } from "@playwright/test";
import { isAuthenticated } from "./helpers";

/** User roles matching the application. */
export type UserRole =
  | "homebuyer"
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

  authenticatedPage: async ({ browser, role }, provideAuthenticatedPage) => {
    const authFile = `e2e/.auth/${role}.json`;
    const hasAuth = isAuthenticated(authFile);

    if (!hasAuth) {
      throw new Error(
        `No Supabase auth state for role "${role}". Run the Playwright setup with valid test users before authenticated specs.`,
      );
    }

    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();

    await provideAuthenticatedPage(page);

    await context.close();
  },
});

export { expect } from "@playwright/test";
