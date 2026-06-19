import { test, expect } from "@playwright/test";

const AGENT_PAGES = [
  { path: "/dashboard/agent", title: /dashboard|agent/i },
  { path: "/dashboard/agent/listings", title: /listing/i },
  { path: "/dashboard/agent/leads", title: /lead/i },
  { path: "/dashboard/agent/viewings", title: /viewing/i },
  { path: "/dashboard/agent/offers", title: /offer/i },
  { path: "/dashboard/agent/sales", title: /sale/i },
  { path: "/dashboard/agent/crm", title: /crm|client/i },
  { path: "/dashboard/agent/team", title: /team/i },
  { path: "/dashboard/agent/reviews", title: /review/i },
  { path: "/dashboard/agent/billing", title: /billing|subscription/i },
  { path: "/dashboard/agent/analytics", title: /analytics/i },
  { path: "/dashboard/agent/profile", title: /profile|agency/i },
  { path: "/dashboard/agent/integrations", title: /integration|api/i },
  { path: "/dashboard/agent/integrations/feeds", title: /feed|integration/i },
];

const PROVIDER_PAGES = [
  { path: "/dashboard/provider", title: /dashboard|provider/i },
  { path: "/dashboard/provider/profile", title: /profile/i },
  { path: "/dashboard/provider/verification", title: /verif/i },
  { path: "/dashboard/provider/jobs", title: /job/i },
  { path: "/dashboard/provider/quotes", title: /quote/i },
  { path: "/dashboard/provider/payments", title: /payment|earning/i },
  { path: "/dashboard/provider/reviews", title: /review/i },
  { path: "/dashboard/provider/analytics", title: /analytics/i },
  { path: "/dashboard/provider/billing", title: /billing|subscription/i },
  { path: "/dashboard/provider/portfolio", title: /portfolio|gallery/i },
  { path: "/dashboard/provider/availability", title: /availability|calendar/i },
];

test.describe("Agent Dashboard", () => {
  for (const { path, title } of AGENT_PAGES) {
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

test.describe("Provider Dashboard", () => {
  for (const { path, title } of PROVIDER_PAGES) {
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
