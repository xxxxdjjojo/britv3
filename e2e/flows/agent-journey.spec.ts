import { test, expect } from "@playwright/test";

test.describe("Agent Dashboard Journey", () => {
  test.use({ storageState: "e2e/.auth/agent.json" });

  async function skipIfNoAuth(page: import("@playwright/test").Page) {
    if (page.url().includes("/login")) {
      test.skip(true, "Auth not available");
    }
  }

  const AGENT_PAGES = [
    { path: "/dashboard/agent", name: "dashboard home" },
    { path: "/dashboard/agent/profile", name: "agency profile" },
    { path: "/dashboard/agent/profile/branding", name: "branding settings" },
    { path: "/dashboard/agent/listings", name: "active listings" },
    { path: "/dashboard/agent/listings/sold", name: "sold/let" },
    { path: "/dashboard/agent/listings/archived", name: "archived listings" },
    { path: "/dashboard/agent/leads", name: "lead management" },
    { path: "/dashboard/agent/viewings", name: "viewing calendar" },
    { path: "/dashboard/agent/viewings/feedback", name: "viewing feedback" },
    { path: "/dashboard/agent/offers", name: "offers dashboard" },
    { path: "/dashboard/agent/sales", name: "sale progression board" },
    { path: "/dashboard/agent/sales/reports", name: "vendor reports" },
    { path: "/dashboard/agent/sales/appraisal", name: "market appraisal" },
    { path: "/dashboard/agent/crm", name: "CRM client list" },
    { path: "/dashboard/agent/team", name: "team management" },
    { path: "/dashboard/agent/team/roles", name: "roles & permissions" },
    { path: "/dashboard/agent/team/branches", name: "branch management" },
    { path: "/dashboard/agent/reviews", name: "reviews dashboard" },
    { path: "/dashboard/agent/billing", name: "subscription & billing" },
    { path: "/dashboard/agent/billing/boost", name: "boost purchase" },
    { path: "/dashboard/agent/analytics", name: "performance analytics" },
    { path: "/dashboard/agent/analytics/branch", name: "branch analytics" },
    { path: "/dashboard/agent/analytics/competitors", name: "competitor analysis" },
    { path: "/dashboard/agent/integrations", name: "API key management" },
    { path: "/dashboard/agent/integrations/feeds", name: "property feed" },
  ];

  for (const { path, name } of AGENT_PAGES) {
    test(`${name} page loads (${path})`, async ({ page }) => {
      await page.goto(path);
      await skipIfNoAuth(page);
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
    });
  }
});
