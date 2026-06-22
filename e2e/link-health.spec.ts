/**
 * E2E link health verification.
 *
 * This spec ensures that all public links on the TrueDeed homepage resolve to
 * real pages (status !== 404) and that the Rent mega-menu exposes the new
 * rental routes correctly.
 *
 * Run against the local dev server by default:
 *   pnpm test:e2e
 *
 * Run against production (the TDD target):
 *   E2E_BASE_URL=https://www.truedeed.co.uk pnpm test:e2e e2e/link-health.spec.ts
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const isProduction = BASE_URL.includes("truedeed.co.uk");

const PUBLIC_RENTAL_ROUTES = [
  "/search?type=rent",
  "/renter-tools",
  "/tools/rent-affordability-calculator",
];

const ALL_ROUTES_TO_VERIFY = [
  "/",
  "/search",
  "/search?type=buy",
  "/search?type=rent",
  "/sold-prices",
  "/market-trends",
  "/areas",
  "/agents",
  "/marketplace",
  "/tools/mortgage-calculator",
  "/tools/stamp-duty-calculator",
  "/tools/affordability-calculator",
  "/renter-tools",
  "/tools/rent-affordability-calculator",
];

test.describe("link health", () => {
  test("homepage links do not return 404", async ({ page, request }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const links = await page.locator("a[href^='/']").all();
    const hrefs = await Promise.all(
      links.map((link) => link.getAttribute("href")),
    );

    // Deduplicate while preserving order and cap the number of links checked
    // on slow/production targets to keep the test fast and deterministic.
    const uniqueHrefs = [...new Set(hrefs)].filter(
      (href): href is string => typeof href === "string" && href.length > 0,
    );

    expect(uniqueHrefs.length).toBeGreaterThan(0);

    const failures: string[] = [];
    const batchSize = isProduction ? 10 : uniqueHrefs.length;
    const linksToCheck = uniqueHrefs.slice(0, batchSize);

    await Promise.all(
      linksToCheck.map(async (href) => {
        try {
          const response = await request.get(href, { timeout: 10_000 });
          if (response.status() === 404) {
            failures.push(`${href} returned 404`);
          }
        } catch (error) {
          failures.push(`${href} request failed: ${(error as Error).message}`);
        }
      }),
    );

    expect(failures, failures.join("; ")).toEqual([]);
  });

  test("rent mega-menu opens and exposes new rental routes", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Open the Rent mega-menu by name.
    const rentButton = page.locator("button", { hasText: "Rent" }).first();
    await expect(rentButton).toBeVisible();
    await rentButton.click();

    // The menu should expose the new routes.
    await expect(page.locator("a[href='/renter-tools']")).toBeVisible();
    await expect(
      page.locator("a[href='/tools/rent-affordability-calculator']"),
    ).toBeVisible();
    await expect(page.locator("a[href='/search?type=rent']")).toBeVisible();
  });

  test("critical public routes are reachable", async ({ request }) => {
    for (const route of ALL_ROUTES_TO_VERIFY) {
      const response = await request.get(route);
      expect(
        response.status(),
        `${BASE_URL}${route} should be reachable but got ${response.status()}`,
      ).not.toBe(404);
    }
  });

  test("/renter-tools renders the tools hub", async ({ page }) => {
    const response = await page.goto("/renter-tools", {
      waitUntil: "domcontentloaded",
    });

    if (isProduction) {
      // Pre-deploy assertion: the route must not 404.
      expect(response?.status()).not.toBe(404);
    }

    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("/tools/rent-affordability-calculator renders the calculator", async ({
    page,
  }) => {
    const response = await page.goto("/tools/rent-affordability-calculator", {
      waitUntil: "domcontentloaded",
    });

    if (isProduction) {
      expect(response?.status()).not.toBe(404);
    }

    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("/search?type=rent renders a search results page", async ({ page }) => {
    const response = await page.goto("/search?type=rent", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).not.toBe(404);

    // Page should contain either results or an honest empty state.
    const body = page.locator("body");
    await expect(body).toContainText(/rent|No properties|results/i);
  });
});
