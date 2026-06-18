import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const PRODUCTION_URL = process.env.PRODUCTION_URL ?? "https://truedeed.co.uk";
const SCREENSHOT_DIR = "test-results/production-smoke";

test.describe("Production smoke — site is live and renders correctly", () => {
  test.beforeAll(() => {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  test("homepage loads with 200 + links + no critical console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    const response = await page.goto(PRODUCTION_URL, { waitUntil: "load" });
    expect(response?.status(), "homepage should return 2xx").toBeLessThan(400);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/homepage.png`, fullPage: true });

    const linkCount = await page.locator("a").count();
    expect(linkCount, "homepage should render links").toBeGreaterThan(10);

    // Hard fail only on uncaught page errors (not console warnings)
    expect(consoleErrors, `production page errors: ${consoleErrors.join(", ")}`).toHaveLength(0);
  });

  test("login page loads", async ({ page }) => {
    const response = await page.goto(`${PRODUCTION_URL}/login`, { waitUntil: "load" });
    expect(response?.status()).toBeLessThan(400);
    expect(await page.locator("form").count()).toBeGreaterThan(0);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/login.png`, fullPage: true });
  });

  test("protected route redirects to login", async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/dashboard/agent`, { waitUntil: "load" });
    expect(page.url()).toMatch(/login/);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/dashboard-redirect.png`, fullPage: true });
  });

  test("public service page loads", async ({ page }) => {
    const response = await page.goto(`${PRODUCTION_URL}/services`, { waitUntil: "load" });
    expect(response?.status()).toBeLessThan(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/services.png`, fullPage: true });
  });
});
