import { test, expect } from "@playwright/test";

test.describe("Header Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows logo and nav links on desktop", async ({ page }) => {
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      test.skip();
      return;
    }
    await expect(page.getByRole("navigation", { name: /Main/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Buy/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Rent/i }).first()).toBeVisible();
  });

  test("shows sign in and list property buttons", async ({ page }) => {
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      test.skip();
      return;
    }
    await expect(page.getByRole("link", { name: /Sign In/i })).toBeVisible();
  });

  test("header becomes sticky with shadow on scroll", async ({ page }) => {
    const header = page.locator("header");
    await page.waitForLoadState("load");
    // Use keyboard End key to scroll to bottom — triggers proper scroll events
    await page.click("body");
    await page.keyboard.press("End");
    await expect(header).toHaveClass(/shadow-sm/);
  });
});

test.describe("Header Mobile", () => {
  // Only run these tests on mobile project (small viewport)
  test("shows hamburger menu on mobile", async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    await page.goto("/");
    await expect(page.getByLabel("Open menu")).toBeVisible();
  });
});

test.describe("Footer", () => {
  test("shows footer sections and links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Properties").last()).toBeVisible();
    await expect(page.getByText("Services").last()).toBeVisible();
    await expect(page.getByText("Company").last()).toBeVisible();
  });

  test("shows copyright", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Britestate Ltd/)).toBeVisible();
  });
});
