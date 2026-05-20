import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const SCREENSHOT_DIR = "test-results/role-nav";

const ROLES = ["homebuyer", "renter", "seller", "landlord", "agent", "provider", "admin"];

test.describe("Role dashboards — middleware redirect + login surface", () => {
  test.beforeAll(() => {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  for (const role of ROLES) {
    test(`unauthenticated /dashboard/${role} → redirects to login`, async ({ page }) => {
      const dashboardPath = `/dashboard/${role}`;
      const response = await page.goto(dashboardPath, { waitUntil: "load" });

      // Should land on login page (status 200 after the redirect)
      expect(response?.status()).toBeLessThan(400);
      expect(page.url()).toMatch(/login/);

      // Screenshot the login page (proves auth surface renders correctly)
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${role}-redirect-to-login.png`,
        fullPage: true,
      });

      // Verify login page has the expected links (sign-up, forgot-password)
      // These selectors are tolerant — if the actual text differs, adjust.
      const hasSignUpLink = await page.getByRole("link", { name: /sign.?up|create.?account|register/i }).count();
      const hasForgotPasswordLink = await page.getByRole("link", { name: /forgot|reset.?password/i }).count();
      expect(hasSignUpLink, "login page should have a sign-up link").toBeGreaterThan(0);
      // Forgot-password is nice-to-have, log but don't fail
      if (hasForgotPasswordLink === 0) {
        console.warn(`[${role}] Login page missing forgot-password link`);
      }
    });
  }

  test("login page screenshot (standalone)", async ({ page }) => {
    await page.goto("/login", { waitUntil: "load" });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/login-page.png`,
      fullPage: true,
    });
    // Page should render
    expect(await page.locator("form").count()).toBeGreaterThan(0);
  });
});
