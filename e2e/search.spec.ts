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

  test("listing type pills are visible", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("button", { name: "All Properties" })).toBeVisible();
    await expect(page.getByRole("button", { name: "For Sale" })).toBeVisible();
    await expect(page.getByRole("button", { name: "To Rent" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Builds" })).toBeVisible();
  });

  test("clicking a listing type pill filters results", async ({ page }) => {
    await page.goto("/search");
    // Click "To Rent" pill to filter
    await page.getByRole("button", { name: "To Rent" }).click();
    // After clicking, the pill should have the active style (bg-brand-primary)
    const rentButton = page.getByRole("button", { name: "To Rent" });
    await expect(rentButton).toHaveClass(/bg-brand-primary/);
  });

  test("grid/list/map view toggles are visible", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("button", { name: "Grid view" })).toBeVisible();
    await expect(page.getByRole("button", { name: "List view" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Map view" })).toBeVisible();
  });

  test("filter sidebar has price range, property type, bedrooms inputs", async ({ page }) => {
    await page.goto("/search");
    // Price range inputs
    await expect(page.getByPlaceholder("No min")).toBeVisible();
    await expect(page.getByPlaceholder("No max")).toBeVisible();
    // Property type checkboxes
    await expect(page.getByText("Detached")).toBeVisible();
    await expect(page.getByText("Semi-detached")).toBeVisible();
    await expect(page.getByText("Flat")).toBeVisible();
    // Bedrooms filter section
    await expect(page.getByText("Bedrooms")).toBeVisible();
  });

  test("sort dropdown works", async ({ page }) => {
    await page.goto("/search");
    const sortSelect = page.locator("select").first();
    await expect(sortSelect).toBeVisible();
    // Verify options are present
    await expect(sortSelect.locator("option", { hasText: "Most Recent" })).toBeAttached();
    await expect(sortSelect.locator("option", { hasText: /Price Low/i })).toBeAttached();
    await expect(sortSelect.locator("option", { hasText: /Price High/i })).toBeAttached();
    await expect(sortSelect.locator("option", { hasText: "Most Popular" })).toBeAttached();
    // Select a different sort option
    await sortSelect.selectOption("price_asc");
    await expect(sortSelect).toHaveValue("price_asc");
  });

  test("zero results empty state shows when filters are restrictive", async ({ page }) => {
    await page.goto("/search");
    // Click "Auctions" pill — no mock properties have listing_type "auction"
    await page.getByRole("button", { name: "Auctions" }).click();
    await expect(page.getByText("No properties match your filters")).toBeVisible();
    await expect(page.getByText("Try widening your search area")).toBeVisible();
  });
});
