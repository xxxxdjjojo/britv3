import { test, expect } from "@playwright/test";

test.describe("Broker Journey", () => {
  // No dedicated broker auth — tests will gracefully skip if redirected to login

  async function skipIfNoAuth(page: import("@playwright/test").Page) {
    if (page.url().includes("/login")) {
      test.skip(true, "Auth not available — no broker test user");
    }
  }

  const BROKER_PAGES = [
    { path: "/dashboard/broker", name: "dashboard" },
    { path: "/dashboard/broker/leads", name: "leads" },
    { path: "/dashboard/broker/pipeline", name: "pipeline" },
    { path: "/dashboard/broker/products", name: "products" },
    { path: "/dashboard/broker/calculators", name: "calculators" },
    { path: "/dashboard/broker/fca-verification", name: "FCA verification" },
    { path: "/dashboard/broker/analytics", name: "analytics" },
    { path: "/dashboard/broker/billing", name: "billing" },
    { path: "/dashboard/broker/profile", name: "profile" },
    { path: "/dashboard/broker/reviews", name: "reviews" },
  ];

  for (const { path, name } of BROKER_PAGES) {
    test(`${name} page loads (${path})`, async ({ page }) => {
      await page.goto(path);
      await skipIfNoAuth(page);
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
    });
  }
});
