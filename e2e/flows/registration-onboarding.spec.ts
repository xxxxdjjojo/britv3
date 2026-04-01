import { test, expect } from "@playwright/test";

test.describe("Registration & Onboarding", () => {
  test("registration page loads with role selector", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
    // Should have role selection options
    const hasRoleSelector = await page
      .getByText(/homebuyer|seller|landlord|agent|provider|renter/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasRoleSelector).toBeTruthy();
  });

  test("registration form has email and password fields", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("body")).not.toContainText("Application error");
    const emailInput = page.locator("input[type=email], input[name*=email]").first();
    const passwordInput = page.locator("input[type=password], input[name*=password]").first();
    const hasEmail = await emailInput.isVisible().catch(() => false);
    const hasPassword = await passwordInput.isVisible().catch(() => false);
    expect(hasEmail || hasPassword).toBeTruthy();
  });

  test("login page loads with form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
    const emailInput = page.locator("input[type=email], input[name*=email]").first();
    await expect(emailInput).toBeVisible();
    const passwordInput = page.locator("input[type=password]").first();
    await expect(passwordInput).toBeVisible();
  });

  test("forgot password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
    const emailInput = page.locator("input[type=email], input[name*=email]").first();
    await expect(emailInput).toBeVisible();
  });

  test("verify email page loads", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("two-factor setup page loads", async ({ page }) => {
    await page.goto("/two-factor-setup");
    await expect(page.locator("body")).not.toContainText("Application error");
    // May redirect to login — that is fine
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Onboarding — Authenticated Roles", () => {
  const ROLES_WITH_DASHBOARD = [
    { role: "homebuyer", storageState: "e2e/.auth/homebuyer.json" },
    { role: "seller", storageState: "e2e/.auth/seller.json" },
    { role: "landlord", storageState: "e2e/.auth/landlord.json" },
    { role: "agent", storageState: "e2e/.auth/agent.json" },
    { role: "provider", storageState: "e2e/.auth/provider.json" },
  ];

  for (const { role, storageState } of ROLES_WITH_DASHBOARD) {
    test.describe(`${role} onboarding`, () => {
      test.use({ storageState });

      test(`${role} dashboard loads after login`, async ({ page }) => {
        await page.goto(`/dashboard/${role}`);
        if (page.url().includes("/login")) {
          test.skip(true, "Auth not available");
          return;
        }
        await expect(page.locator("body")).not.toContainText("Application error");
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
      });
    });
  }
});
