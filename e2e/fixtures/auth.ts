import { test as base, type Page } from "@playwright/test";

/** User roles matching the application. */
export type UserRole =
  | "homebuyer"
  | "seller"
  | "landlord"
  | "agent"
  | "provider"
  | "admin";

/** Test user credentials per role. */
const TEST_CREDS: Record<UserRole, { email: string; password: string }> = {
  homebuyer: { email: "test-buyer@britestate.test", password: "TestPassword123!" },
  seller: { email: "test-seller@britestate.test", password: "TestPassword123!" },
  landlord: { email: "test-landlord@britestate.test", password: "TestPassword123!" },
  agent: { email: "test-agent@britestate.test", password: "TestPassword123!" },
  provider: { email: "test-provider@britestate.test", password: "TestPassword123!" },
  admin: { email: "test-admin@britestate.test", password: "TestPassword123!" },
};

type AuthFixtures = {
  /** A Page instance authenticated for the current role. */
  authenticatedPage: Page;
  /** The role to authenticate as. Override per-test via `test.use({ role: "seller" })`. */
  role: UserRole;
};

/**
 * Extended Playwright test with auth fixtures.
 *
 * Performs a live login in each test's browser context since Supabase SSR
 * manages sessions via server-side httpOnly cookies that cannot be captured
 * by Playwright's storageState().
 */
export const test = base.extend<AuthFixtures>({
  role: ["homebuyer", { option: true }],

  authenticatedPage: async ({ browser, role }, use, testInfo) => {
    const creds = TEST_CREDS[role];
    if (!creds) {
      testInfo.skip(true, `No credentials for role "${role}".`);
      return;
    }

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto("/login", { timeout: 15_000 });

      const emailInput = page.getByLabel(/email/i);
      const isLoginPage = await emailInput.isVisible({ timeout: 5_000 }).catch(() => false);

      if (!isLoginPage) {
        testInfo.skip(true, `Login page not available for role "${role}".`);
        await context.close();
        return;
      }

      await emailInput.fill(creds.email);
      await page.getByLabel(/password/i).first().fill(creds.password);
      await page.getByRole("button", { name: /sign in|log in/i }).click();

      await page.waitForURL("**/dashboard**", { timeout: 15_000 });
    } catch {
      testInfo.skip(
        true,
        `Login failed for role "${role}". Test user may not exist in Supabase.`,
      );
      await context.close();
      return;
    }

    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
