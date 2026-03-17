import { test, expect } from "@playwright/test";

const SETTINGS_PAGES = [
  { path: "/settings", title: /settings/i },
  { path: "/settings/account", title: /account|profile/i },
  { path: "/settings/security", title: /security/i },
  { path: "/settings/notifications", title: /notification/i },
  { path: "/settings/privacy", title: /privacy/i },
  { path: "/settings/preferences", title: /preference/i },
];

const MARKETING_PAGES = [
  { path: "/how-it-works", title: /how it works/i },
  { path: "/pricing", title: /pricing/i },
  { path: "/careers", title: /career/i },
  { path: "/press", title: /press/i },
  { path: "/partners", title: /partner/i },
  { path: "/investors", title: /investor/i },
  { path: "/sitemap-page", title: /sitemap/i },
  { path: "/blog", title: /blog/i },
  { path: "/help", title: /help/i },
  { path: "/help/contact", title: /contact|support/i },
];

test.describe("Settings Pages", () => {
  for (const { path, title } of SETTINGS_PAGES) {
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

test.describe("Marketing Pages", () => {
  for (const { path, title } of MARKETING_PAGES) {
    test(`${path} loads`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText("Application error");
      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible({ timeout: 10_000 });
    });
  }
});
