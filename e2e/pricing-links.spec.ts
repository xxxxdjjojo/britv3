// e2e/pricing-links.spec.ts
//
// MEMO PIVOT v2 — every segment surface (header nav, footer, sitemap,
// command palette) must link to the new segment landing pages and to /pricing.

import { test, expect } from "@playwright/test";

const SEGMENT_ROUTES: ReadonlyArray<{ label: RegExp; href: string }> = [
  { label: /sellers/i, href: "/sellers" },
  { label: /developers/i, href: "/developers" },
  { label: /traders/i, href: "/traders" },
];

test.describe("Pricing links — header / footer / sitemap / command palette", () => {
  test("home page header MegaMenu links to every segment landing", async ({
    page,
  }) => {
    await page.goto("/");
    for (const { label, href } of SEGMENT_ROUTES) {
      const link = page.locator(`a[href="${href}"]`).first();
      await expect(link).toBeVisible();
    }
  });

  test("home page header has a Pricing link", async ({ page }) => {
    await page.goto("/");
    const pricingLink = page.locator('a[href="/pricing"]').first();
    await expect(pricingLink).toBeVisible();
  });

  test("footer contains links to every segment", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    for (const { href } of SEGMENT_ROUTES) {
      await expect(footer.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
    await expect(footer.locator('a[href="/pricing"]').first()).toBeVisible();
  });

  test("sitemap page lists every segment route", async ({ page }) => {
    await page.goto("/sitemap-page");
    for (const { href } of SEGMENT_ROUTES) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
    await expect(page.locator('a[href="/pricing"]').first()).toBeVisible();
  });

  test("command palette returns each segment when searched", async ({ page }) => {
    await page.goto("/");
    // Open command palette (typical Cmd+K binding)
    await page.keyboard.press("Meta+K").catch(async () => {
      await page.keyboard.press("Control+K");
    });
    const dialog = page.getByRole("dialog");
    if (!(await dialog.isVisible().catch(() => false))) {
      // Skip if not implemented yet — failing this test is fine in RED phase
      throw new Error("Command palette did not open via Cmd/Ctrl+K");
    }
    for (const { label } of SEGMENT_ROUTES) {
      const search = dialog.getByRole("searchbox").or(
        dialog.locator("input[type='text']"),
      );
      await search.fill("");
      await search.fill(label.source.replace(/[^a-z]/gi, ""));
      await expect(dialog.getByRole("option", { name: label }).first()).toBeVisible();
    }
  });
});

test.describe("Segment landing pages exist and CTA to /pricing", () => {
  for (const { href } of SEGMENT_ROUTES) {
    test(`${href} renders with hero and CTA pointing to /pricing`, async ({
      page,
    }) => {
      const response = await page.goto(href);
      expect(response?.status() ?? 500).toBeLessThan(400);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const cta = page.locator('a[href*="/pricing"]').first();
      await expect(cta).toBeVisible();
    });
  }
});
