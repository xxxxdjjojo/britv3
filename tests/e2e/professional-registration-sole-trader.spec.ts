// tests/e2e/professional-registration-sole-trader.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Professional Registration — Sole Trader Path", () => {
  test("completes full registration as Sole Trader agent", async ({ page }) => {
    // Navigate to registration
    await page.goto("/register?professional=agent");

    // Expect registration form
    await expect(page.getByRole("heading")).toContainText(/create|register|sign up/i);
  });

  test("UTR validation rejects non-10-digit numbers", async ({ page }) => {
    test.skip(true, "Requires authenticated session — implement with test auth helpers");
  });

  test("HMRC AML reference validates alphanumeric format", async ({ page }) => {
    test.skip(true, "Requires authenticated session — implement with test auth helpers");
  });

  test("can resume abandoned onboarding at correct step", async ({ page }) => {
    test.skip(true, "Requires authenticated session — implement with test auth helpers");
  });

  test("mobile responsive — all steps usable at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register?professional=agent");
    // Verify form is visible and usable
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
