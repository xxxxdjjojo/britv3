import { test, expect } from "@playwright/test";

const ERROR_PAGES = [
  { path: "/forbidden", text: /access denied/i, home: /go home/i },
  { path: "/maintenance", text: /maintenance/i, home: null },
  { path: "/offline", text: /offline/i, home: null },
  { path: "/session-expired", text: /session.*expired/i, home: /return to home/i },
  { path: "/rate-limited", text: /too many requests/i, home: /go home/i },
];

test.describe("Error State Pages", () => {
  for (const { path, text, home } of ERROR_PAGES) {
    test(`${path} renders with relevant content`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText(text)).toBeVisible();
    });

    if (home) {
      test(`${path} has a home link`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByRole("link", { name: home })).toBeVisible();
      });
    }
  }

  test("error pages do not redirect to login", async ({ page }) => {
    for (const { path } of ERROR_PAGES) {
      await page.goto(path);
      expect(page.url()).toContain(path);
    }
  });
});

test.describe("404 Page", () => {
  test("shows 404 content for non-existent route", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-123");
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
    await expect(page.getByText(/404/i)).toBeVisible();
  });

  test("has a Go Home link", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-123");
    await expect(page.getByRole("link", { name: /go home/i })).toBeVisible();
  });

  test("has a Search Properties link", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-123");
    await expect(page.getByRole("link", { name: /search properties/i })).toBeVisible();
  });
});

test.describe("Maintenance Page Details", () => {
  test("shows estimated return time", async ({ page }) => {
    await page.goto("/maintenance");
    await expect(page.getByText(/estimated return/i)).toBeVisible();
  });

  test("shows subscribe form", async ({ page }) => {
    await page.goto("/maintenance");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /notify me/i })).toBeVisible();
  });
});

test.describe("Session Expired Page Details", () => {
  test("has sign in link", async ({ page }) => {
    await page.goto("/session-expired");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });
});

test.describe("Rate Limited Page Details", () => {
  test("shows countdown timer", async ({ page }) => {
    await page.goto("/rate-limited");
    await expect(page.getByText(/try again in/i)).toBeVisible();
  });
});
