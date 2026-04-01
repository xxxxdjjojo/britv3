import { test, expect } from "@playwright/test";

test.describe("Agent Billing & Checkout", () => {
  test.use({ storageState: "e2e/.auth/agent.json" });

  async function skipIfNoAuth(page: import("@playwright/test").Page) {
    if (page.url().includes("/login")) {
      test.skip(true, "Auth not available");
    }
  }

  test("billing hub loads", async ({ page }) => {
    await page.goto("/dashboard/agent/billing");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("checkout subscription page shows plan options", async ({ page }) => {
    await page.goto("/dashboard/agent/billing/checkout/subscription");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    const hasPlans = await page
      .getByText(/performance|professional|enterprise|plan|subscribe|pricing/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasPlans).toBeTruthy();
  });

  test("payment methods page loads", async ({ page }) => {
    await page.goto("/dashboard/agent/billing/payment-methods");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    const hasContent = await page
      .getByText(/payment.*method|card|no.*payment|add/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test("invoices page loads", async ({ page }) => {
    await page.goto("/dashboard/agent/billing/invoices");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    const hasContent = await page
      .getByText(/invoice|billing.*history|no.*invoice/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test("confirmation page loads", async ({ page }) => {
    await page.goto("/dashboard/agent/billing/confirmation");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("failed payment page shows retry", async ({ page }) => {
    await page.goto("/dashboard/agent/billing/failed?decline_code=card_declined");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    const hasRetry = await page
      .getByText(/try.*again|retry|different.*card/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasRetry).toBeTruthy();
  });
});

test.describe("Buyer Billing", () => {
  test.use({ storageState: "e2e/.auth/homebuyer.json" });

  test("buyer can access services page (billing entry point)", async ({ page }) => {
    await page.goto("/dashboard/homebuyer/services");
    if (page.url().includes("/login")) {
      test.skip(true, "Auth not available");
      return;
    }
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Provider Billing", () => {
  test.use({ storageState: "e2e/.auth/provider.json" });

  test("provider billing hub loads", async ({ page }) => {
    await page.goto("/dashboard/provider/billing");
    if (page.url().includes("/login")) {
      test.skip(true, "Auth not available");
      return;
    }
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("provider boost checkout loads", async ({ page }) => {
    await page.goto("/dashboard/provider/billing/checkout/one-time");
    if (page.url().includes("/login")) {
      test.skip(true, "Auth not available");
      return;
    }
    await expect(page.locator("body")).not.toContainText("Application error");
    const hasContent = await page
      .getByText(/boost|featured|promote|7.*day|14.*day|30.*day/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});
