import { test, expect } from "@playwright/test";

const MARKETPLACE_PAGES = [
  { path: "/services", title: /service directory/i },
  { path: "/agents", title: /estate agent/i },
  { path: "/marketplace", title: /marketplace|tradesperson/i },
  { path: "/mortgage-brokers", title: /mortgage broker/i },
  { path: "/conveyancers", title: /conveyancer/i },
  { path: "/surveyors", title: /surveyor/i },
  { path: "/architects", title: /architect/i },
  { path: "/jobs", title: /job/i },
  { path: "/post-a-job", title: /post.*job/i },
  { path: "/compare", title: /compare/i },
];

test.describe("Marketplace Pages", () => {
  for (const { path, title } of MARKETPLACE_PAGES) {
    test(`${path} loads`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText("Application error");
      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible({ timeout: 10_000 });
    });
  }
});
