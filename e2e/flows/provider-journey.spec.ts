import { test, expect } from "@playwright/test";

test.describe("Provider Journey", () => {
  test.use({ storageState: "e2e/.auth/provider.json" });

  async function skipIfNoAuth(page: import("@playwright/test").Page) {
    if (page.url().includes("/login")) {
      test.skip(true, "Auth not available");
    }
  }

  const PROVIDER_PAGES = [
    { path: "/dashboard/provider", name: "dashboard" },
    { path: "/dashboard/provider/profile", name: "profile" },
    { path: "/dashboard/provider/jobs", name: "job leads" },
    { path: "/dashboard/provider/jobs", name: "active jobs" },
    { path: "/dashboard/provider/quotes", name: "quote builder" },
    { path: "/dashboard/provider/payments", name: "payments" },
    { path: "/dashboard/provider/portfolio", name: "portfolio" },
    { path: "/dashboard/provider/verification", name: "verification" },
    { path: "/dashboard/provider/services", name: "services" },
    { path: "/dashboard/provider/availability", name: "availability" },
    { path: "/dashboard/provider/reviews", name: "reviews" },
    { path: "/dashboard/provider/analytics", name: "analytics" },
    { path: "/dashboard/provider/billing", name: "billing" },
  ];

  for (const { path, name } of PROVIDER_PAGES) {
    test(`${name} page loads (${path})`, async ({ page }) => {
      await page.goto(path);
      await skipIfNoAuth(page);
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
    });
  }

  test("profile page has editable fields", async ({ page }) => {
    await page.goto("/dashboard/provider/profile");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    const hasInputOrTextarea = await page
      .locator("input, textarea")
      .first()
      .isVisible()
      .catch(() => false);
    const hasEditBtn = await page
      .getByRole("button", { name: /edit|save|update/i })
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasInputOrTextarea || hasEditBtn).toBeTruthy();
  });

  test("documents page loads", async ({ page }) => {
    await page.goto("/dashboard/provider/documents");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("referrals page loads", async ({ page }) => {
    await page.goto("/dashboard/provider/referrals");
    await skipIfNoAuth(page);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });
});
