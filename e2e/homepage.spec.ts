import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero section with search", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find your perfect");
    await expect(page.getByRole("main").getByRole("link", { name: "Buy", exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Rent", exact: true })).toBeVisible();
  });

  test("renders featured properties section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Featured Properties/i })).toBeVisible();
    await expect(page.getByText("For Sale")).toBeVisible();
  });

  test("renders how it works section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /How It Works/i })).toBeVisible();
    await expect(page.getByText("Search & Discover")).toBeVisible();
    await expect(page.getByText("Connect with Verified Pros")).toBeVisible();
    await expect(page.getByText("Move In with Confidence")).toBeVisible();
  });

  test("renders services section", async ({ page }) => {
    await expect(page.getByText("Trusted professionals")).toBeVisible();
    await expect(page.getByText("Plumbers")).toBeVisible();
    await expect(page.getByText("Electricians")).toBeVisible();
  });

  test("renders trust section with stats", async ({ page }) => {
    await expect(page.getByText("50k+")).toBeVisible();
    await expect(page.getByText("4.9/5")).toBeVisible();
  });

  test("renders testimonials", async ({ page }) => {
    await expect(page.getByText("Community Stories")).toBeVisible();
  });

  test("renders blog preview", async ({ page }) => {
    await expect(page.getByText("Latest from the Blog")).toBeVisible();
  });

  test("renders CTA banner with links", async ({ page }) => {
    await expect(page.getByText("Ready to get started?")).toBeVisible();
    const listLink = page.getByRole("link", { name: /List Your Property/i });
    await expect(listLink).toBeVisible();
    await expect(listLink).toHaveAttribute("href", "/register?role=seller");
  });

  test("search bar links to /search", async ({ page }) => {
    const searchLink = page.getByLabel("Search properties");
    await expect(searchLink).toHaveAttribute("href", "/search");
  });
});

test.describe("Homepage Mobile", () => {
  test("renders hero on mobile", async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
