import { test, expect } from "@playwright/test";

// Search page smoke tests — updated for the Stitch "Hemnet right-filters"
// layout. The full structural contract lives in property-search-page.spec.ts;
// these keep the original intent (page loads, results/empty, filters, sort).

test.describe("Search Page", () => {
  test("loads search page", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveTitle(/Search|Properties|Britestate/i);
  });

  test("shows search results or empty state", async ({ page }) => {
    await page.goto("/search");
    const hasResults = await page
      .getByTestId("property-search-card")
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText(/No properties match/i)
      .isVisible()
      .catch(() => false);
    expect(hasResults || hasEmpty).toBe(true);
  });

  test("refine filter aside has location, price, property type and bedrooms", async ({
    page,
  }) => {
    await page.goto("/search");
    const aside = page.getByTestId("refine-filters");
    await expect(aside).toBeVisible();
    // Location search input
    await expect(page.getByPlaceholder(/Search area, city or street/i)).toBeVisible();
    // Price range inputs
    await expect(page.getByLabel("Minimum price")).toBeVisible();
    await expect(page.getByLabel("Maximum price")).toBeVisible();
    // Property type chips
    await expect(aside.getByRole("button", { name: "Detached" })).toBeVisible();
    await expect(aside.getByRole("button", { name: "Flat" })).toBeVisible();
    // Min bedrooms select
    await expect(page.getByLabel("Min Bedrooms")).toBeVisible();
  });

  test("selecting a property type chip toggles its pressed state", async ({
    page,
  }) => {
    await page.goto("/search");
    const detached = page
      .getByTestId("refine-filters")
      .getByRole("button", { name: "Detached" });
    await detached.click();
    await expect(detached).toHaveAttribute("aria-pressed", "true");
  });

  test("sort dropdown works", async ({ page }) => {
    await page.goto("/search");
    const sortSelect = page.getByLabel("Sort results");
    await expect(sortSelect).toBeVisible();
    await expect(
      sortSelect.locator("option", { hasText: "Newest" }),
    ).toBeAttached();
    await expect(
      sortSelect.locator("option", { hasText: /Price: low/i }),
    ).toBeAttached();
    await sortSelect.selectOption("price_asc");
    await expect(sortSelect).toHaveValue("price_asc");
  });

  test("Search button commits filters to the URL", async ({ page }) => {
    await page.goto("/search");
    await page.getByPlaceholder(/Search area, city or street/i).fill("Oxford");
    await page.getByRole("button", { name: /^Search$/ }).click();
    await expect(page).toHaveURL(/q=Oxford/);
  });
});
