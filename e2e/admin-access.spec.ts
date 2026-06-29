import { mkdirSync } from "node:fs";
import { test, expect } from "./fixtures/auth";

const SCREENSHOT_DIR = "test-results/admin-access";

test.describe.configure({ retries: 1, timeout: 90_000 });

test.beforeAll(() => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.describe("admin dashboard access", () => {
  test.use({ role: "admin" });

  test("generic /dashboard lands configured admins on /admin", async ({
    authenticatedPage: page,
  }) => {
    test.skip(
      test.info().project.name === "mobile",
      "Admin access screenshots run on desktop.",
    );

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("heading", { name: /admin dashboard/i }),
    ).toBeVisible({ timeout: 15_000 });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/admin-dashboard-landing.png`,
      fullPage: true,
    });
  });

  test("direct /admin renders the admin console", async ({
    authenticatedPage: page,
  }) => {
    test.skip(
      test.info().project.name === "mobile",
      "Admin access screenshots run on desktop.",
    );

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText(/admin console/i)).toBeVisible({
      timeout: 15_000,
    });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/admin-console.png`,
      fullPage: true,
    });
  });
});

test.describe("non-admin admin block", () => {
  test.use({ role: "homebuyer" });

  test("homebuyer cannot reach /admin", async ({ authenticatedPage: page }) => {
    test.skip(
      test.info().project.name === "mobile",
      "Admin access screenshots run on desktop.",
    );

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => undefined);

    expect(new URL(page.url()).pathname.startsWith("/admin")).toBe(false);
    await expect(page.getByText(/admin console/i)).toHaveCount(0);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/homebuyer-admin-blocked.png`,
      fullPage: true,
    });
  });
});
