import { test, expect } from "@playwright/test";

const ADMIN_PAGES = [
  { path: "/admin", title: /admin|dashboard/i },
  { path: "/admin/users", title: /user/i },
  { path: "/admin/moderation", title: /moderat|listing/i },
  { path: "/admin/verifications", title: /verif/i },
  { path: "/admin/reviews", title: /review/i },
  { path: "/admin/feature-flags", title: /feature flag/i },
  { path: "/admin/system-health", title: /system|health/i },
  { path: "/admin/audit-log", title: /audit/i },
];

const BROKER_PAGES = [
  { path: "/dashboard/broker", title: /dashboard|broker/i },
  { path: "/dashboard/broker/fca-verification", title: /fca|verification/i },
  { path: "/dashboard/broker/pipeline", title: /pipeline|client/i },
  { path: "/dashboard/broker/products", title: /product|mortgage/i },
  { path: "/dashboard/broker/calculators", title: /calculator/i },
  { path: "/dashboard/broker/leads", title: /lead/i },
  { path: "/dashboard/broker/reviews", title: /review/i },
  { path: "/dashboard/broker/analytics", title: /analytics/i },
  { path: "/dashboard/broker/billing", title: /billing/i },
  { path: "/dashboard/broker/profile", title: /profile/i },
];

const MESSAGING_PAGES = [
  { path: "/inbox", title: /inbox|message/i },
  { path: "/notifications", title: /notification/i },
];

test.describe("Admin Pages", () => {
  for (const { path, title } of ADMIN_PAGES) {
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

test.describe("Broker Dashboard", () => {
  for (const { path, title } of BROKER_PAGES) {
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

test.describe("Messaging Pages", () => {
  for (const { path, title } of MESSAGING_PAGES) {
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
