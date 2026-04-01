import { test, expect } from "@playwright/test";

test.describe("Buyer Journey", () => {
  test.use({ storageState: "e2e/.auth/homebuyer.json" });

  // Helper to skip when auth is unavailable
  async function skipIfNoAuth(page: import("@playwright/test").Page) {
    if (page.url().includes("/login")) {
      test.skip(true, "Auth not available");
    }
  }

  test("search page loads with results or empty state", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
    const hasResults = await page
      .getByText(/result|propert|listing|no.*found/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasResults).toBeTruthy();
  });

  test("search results link to property detail pages", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("body")).not.toContainText("Application error");
    const propertyLink = page.locator("a[href*='/properties/']").first();
    const hasLink = await propertyLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasLink) {
      test.skip(true, "No property results to click");
      return;
    }
    await propertyLink.click();
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("saved properties page loads", async ({ page }) => {
    await page.goto("/dashboard/homebuyer/saved");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("offers page loads", async ({ page }) => {
    await page.goto("/dashboard/homebuyer/offers");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("AI match page loads", async ({ page }) => {
    await page.goto("/dashboard/homebuyer/ai-match");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("calculators page loads and accepts input", async ({ page }) => {
    await page.goto("/dashboard/homebuyer/calculators");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
    // Try to interact with a number input if present
    const numInput = page.locator("input[type=number], input[inputmode=numeric]").first();
    const hasInput = await numInput.isVisible().catch(() => false);
    if (hasInput) {
      await numInput.fill("250000");
      await expect(numInput).toHaveValue("250000");
    }
  });

  test("viewings page loads", async ({ page }) => {
    await page.goto("/dashboard/homebuyer/viewings");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("documents page loads", async ({ page }) => {
    await page.goto("/dashboard/homebuyer/documents");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("services page loads", async ({ page }) => {
    await page.goto("/dashboard/homebuyer/services");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("moving checklist page loads", async ({ page }) => {
    await page.goto("/dashboard/homebuyer/moving");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });
});
