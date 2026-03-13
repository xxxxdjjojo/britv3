import { test, expect } from "@playwright/test";

test.describe("Search Page", () => {
  test("loads search page", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveTitle(/Search|Properties|Britestate/i);
  });

  test("shows search results or empty state", async ({ page }) => {
    await page.goto("/search");
    const hasResults = await page.getByText(/properties/i).first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/No properties match/i).isVisible().catch(() => false);
    expect(hasResults || hasEmpty).toBe(true);
  });
});
