import { test, expect } from "@playwright/test";

const BUYER_PAGES = [
  { path: "/dashboard/homebuyer", title: /dashboard/i },
  { path: "/dashboard/homebuyer/saved", title: /saved/i },
  { path: "/dashboard/homebuyer/searches", title: /search/i },
  { path: "/dashboard/homebuyer/viewings", title: /viewing/i },
  { path: "/dashboard/homebuyer/offers", title: /offer/i },
  { path: "/dashboard/homebuyer/documents", title: /document/i },
  { path: "/dashboard/homebuyer/moving", title: /moving|checklist/i },
  { path: "/dashboard/homebuyer/ai-match", title: /ai|match/i },
  { path: "/dashboard/homebuyer/calculators", title: /calculator|affordability/i },
  { path: "/dashboard/homebuyer/services", title: /service|provider/i },
  { path: "/dashboard/homebuyer/referrals", title: /referral/i },
];

test.describe("Buyer Dashboard", () => {
  for (const { path, title } of BUYER_PAGES) {
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
