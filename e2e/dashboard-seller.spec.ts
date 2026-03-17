import { test, expect } from "@playwright/test";

const SELLER_PAGES = [
  { path: "/dashboard/seller", title: /dashboard|seller/i },
  { path: "/dashboard/seller/listings", title: /listing/i },
  { path: "/dashboard/seller/listings/create", title: /create|new listing/i },
  { path: "/dashboard/seller/viewings", title: /viewing/i },
  { path: "/dashboard/seller/offers", title: /offer/i },
  { path: "/dashboard/seller/analytics", title: /analytics/i },
  { path: "/dashboard/seller/valuation", title: /valuation/i },
  { path: "/dashboard/seller/agents", title: /agent/i },
  { path: "/dashboard/seller/agents/compare", title: /compare/i },
];

const LANDLORD_PAGES = [
  { path: "/dashboard/landlord", title: /dashboard|landlord/i },
  { path: "/dashboard/landlord/properties", title: /propert/i },
  { path: "/dashboard/landlord/tenants", title: /tenant|application/i },
  { path: "/dashboard/landlord/rent", title: /rent/i },
  { path: "/dashboard/landlord/compliance", title: /compliance/i },
  { path: "/dashboard/landlord/maintenance", title: /maintenance/i },
  { path: "/dashboard/landlord/finance/expenses", title: /expense/i },
  { path: "/dashboard/landlord/finance/report", title: /report|income/i },
  { path: "/dashboard/landlord/finance/tax", title: /tax/i },
  { path: "/dashboard/landlord/deposits", title: /deposit/i },
  { path: "/dashboard/landlord/analytics", title: /analytics/i },
];

test.describe("Seller Dashboard", () => {
  for (const { path, title } of SELLER_PAGES) {
    test(`${path} loads`, async ({ page }) => {
      await page.goto(path);
      if (page.url().includes("/login")) {
        test.skip(true, "Auth not available — no test users");
        return;
      }
      await expect(page.locator("body")).not.toContainText("Application error");
      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible({ timeout: 10_000 });
    });
  }
});

test.describe("Landlord Dashboard", () => {
  for (const { path, title } of LANDLORD_PAGES) {
    test(`${path} loads`, async ({ page }) => {
      await page.goto(path);
      if (page.url().includes("/login")) {
        test.skip(true, "Auth not available — no test users");
        return;
      }
      await expect(page.locator("body")).not.toContainText("Application error");
      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible({ timeout: 10_000 });
    });
  }
});
