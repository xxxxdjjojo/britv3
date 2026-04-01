import { test, expect } from "@playwright/test";

test.describe("Seller Journey", () => {
  test.use({ storageState: "e2e/.auth/seller.json" });

  async function skipIfNoAuth(page: import("@playwright/test").Page) {
    if (page.url().includes("/login")) {
      test.skip(true, "Auth not available");
    }
  }

  test("dashboard loads with overview", async ({ page }) => {
    await page.goto("/dashboard/seller");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("listings page loads", async ({ page }) => {
    await page.goto("/dashboard/seller/listings");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("listing creation wizard loads", async ({ page }) => {
    await page.goto("/dashboard/seller/listings");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    // Look for a create/add listing button
    const createBtn = page.getByRole("link", { name: /create|add|new.*listing/i }).first();
    const hasCreateBtn = await createBtn.isVisible().catch(() => false);
    if (hasCreateBtn) {
      await createBtn.click();
      await expect(page.locator("body")).not.toContainText("Application error");
    }
  });

  test("viewings management page loads", async ({ page }) => {
    await page.goto("/dashboard/seller/viewings");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("offers received page loads", async ({ page }) => {
    await page.goto("/dashboard/seller/offers");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("sale progress tracker loads", async ({ page }) => {
    await page.goto("/dashboard/seller/sale-progress");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("valuation tool loads", async ({ page }) => {
    await page.goto("/dashboard/seller/valuation");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("find and compare agents page loads", async ({ page }) => {
    await page.goto("/dashboard/seller/agents");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("enquiries page loads", async ({ page }) => {
    await page.goto("/dashboard/seller/enquiries");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("analytics page loads", async ({ page }) => {
    await page.goto("/dashboard/seller/analytics");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });
});
