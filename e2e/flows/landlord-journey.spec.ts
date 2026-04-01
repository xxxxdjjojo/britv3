import { test, expect } from "@playwright/test";

test.describe("Landlord Journey", () => {
  test.use({ storageState: "e2e/.auth/landlord.json" });

  async function skipIfNoAuth(page: import("@playwright/test").Page) {
    if (page.url().includes("/login")) {
      test.skip(true, "Auth not available");
    }
  }

  const LANDLORD_PAGES = [
    { path: "/dashboard/landlord", name: "dashboard overview" },
    { path: "/dashboard/landlord/properties", name: "properties portfolio" },
    { path: "/dashboard/landlord/tenants", name: "tenants" },
    { path: "/dashboard/landlord/rent", name: "rent collection" },
    { path: "/dashboard/landlord/compliance", name: "compliance" },
    { path: "/dashboard/landlord/compliance-guide", name: "compliance guide" },
    { path: "/dashboard/landlord/maintenance", name: "maintenance" },
    { path: "/dashboard/landlord/finance", name: "finance" },
    { path: "/dashboard/landlord/tools", name: "tools" },
    { path: "/dashboard/landlord/analytics", name: "analytics" },
    { path: "/dashboard/landlord/insurance", name: "insurance" },
    { path: "/dashboard/landlord/find-agent", name: "find agent" },
    { path: "/dashboard/landlord/find-tradespeople", name: "find tradespeople" },
  ];

  for (const { path, name } of LANDLORD_PAGES) {
    test(`${name} page loads (${path})`, async ({ page }) => {
      await page.goto(path);
      await skipIfNoAuth(page);
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
    });
  }

  test("navigate from portfolio to property detail", async ({ page }) => {
    await page.goto("/dashboard/landlord/properties");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    // Click first property link if available
    const propertyLink = page.locator("a[href*='/properties/'], a[href*='/landlord/properties/']").first();
    const hasLink = await propertyLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasLink) {
      test.skip(true, "No properties in portfolio to navigate");
      return;
    }
    await propertyLink.click();
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("deposits page loads", async ({ page }) => {
    await page.goto("/dashboard/landlord/deposits");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("inventory page loads", async ({ page }) => {
    await page.goto("/dashboard/landlord/inventory");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("legal page loads", async ({ page }) => {
    await page.goto("/dashboard/landlord/legal");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });
});
