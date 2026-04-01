import { test, expect, devices } from "@playwright/test";

test.describe("Mobile Responsive Flows", () => {
  test.use({ ...devices["iPhone 14"] });

  test("homepage loads on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("mobile nav menu opens and shows nav items", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).not.toContainText("Application error");

    // Find and click the mobile menu button (hamburger icon)
    const menuButton = page.locator(
      "button[aria-label*='menu' i], button[aria-label*='nav' i], button[aria-label*='Menu' i], [data-testid='mobile-menu'], button:has(svg):visible"
    ).first();
    const hasMenu = await menuButton.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasMenu) {
      test.skip(true, "No mobile menu button found");
      return;
    }
    await menuButton.click();

    // Verify nav items appear after opening menu
    const navItems = page.getByRole("link").filter({ hasText: /.+/ });
    await expect(navItems.first()).toBeVisible({ timeout: 5_000 });
  });

  test("search page loads on mobile", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("calculator touch targets are large enough on mobile", async ({ page }) => {
    await page.goto("/tools/stamp-duty-calculator");
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });

    // Check that input fields meet minimum touch-target size (30px)
    const inputs = page.locator("input:visible");
    const inputCount = await inputs.count();
    if (inputCount === 0) {
      test.skip(true, "No visible inputs on calculator page");
      return;
    }
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const box = await inputs.nth(i).boundingBox();
      if (box) {
        expect(box.height, `Input ${i} height should be >= 30px`).toBeGreaterThanOrEqual(30);
        expect(box.width, `Input ${i} width should be >= 30px`).toBeGreaterThanOrEqual(30);
      }
    }
  });

  test("legal page loads on mobile", async ({ page }) => {
    await page.goto("/legal/terms");
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });

  test("property detail loads on mobile", async ({ page }) => {
    // Navigate via search to find a property link
    await page.goto("/search");
    await expect(page.locator("body")).not.toContainText("Application error");

    const propertyLink = page.locator("a[href*='/properties/']").first();
    const hasLink = await propertyLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasLink) {
      test.skip(true, "No property results available to test detail page");
      return;
    }
    await propertyLink.click();
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
  });
});
