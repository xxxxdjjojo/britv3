import { test, expect } from "@playwright/test";

test.describe("Areas Page", () => {
  test("loads with area listings", async ({ page }) => {
    await page.goto("/areas");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Explore UK Property Areas");
    await expect(page.getByRole("heading", { name: /Browse by City/i })).toBeVisible();
    // Verify city cards render
    await expect(page.getByText("London")).toBeVisible();
    await expect(page.getByText("Manchester")).toBeVisible();
    await expect(page.getByText("Birmingham")).toBeVisible();
  });

  test("shows trending neighbourhoods", async ({ page }) => {
    await page.goto("/areas");
    await expect(page.getByRole("heading", { name: /Trending Neighbourhoods/i })).toBeVisible();
    await expect(page.getByText("Islington")).toBeVisible();
    await expect(page.getByText("Ancoats")).toBeVisible();
  });
});

test.describe("Market Trends Page", () => {
  test("loads with heading", async ({ page }) => {
    await page.goto("/market-trends");
    await expect(
      page.getByRole("heading", { name: /UK Property Market Trends/i }),
    ).toBeVisible();
  });

  test("shows KPI cards", async ({ page }) => {
    await page.goto("/market-trends");
    await expect(page.getByText("Avg. House Price")).toBeVisible();
    await expect(page.getByText("Monthly Transactions")).toBeVisible();
    await expect(page.getByText("Avg. Days to Sell")).toBeVisible();
  });

  test("shows regional prices table", async ({ page }) => {
    await page.goto("/market-trends");
    await expect(page.getByRole("heading", { name: /Average Prices by Region/i })).toBeVisible();
  });
});

test.describe("Tools Index Page", () => {
  test("loads with tool cards", async ({ page }) => {
    await page.goto("/tools");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /All Calculators/i })).toBeVisible();
    // Verify at least a few tool cards are present
    await expect(page.getByText("Mortgage Repayment Calculator")).toBeVisible();
    await expect(page.getByText("Stamp Duty (SDLT) Calculator")).toBeVisible();
    await expect(page.getByText("Rental Yield & ROI Calculator")).toBeVisible();
  });
});

const TOOL_PAGES = [
  { path: "/tools/mortgage-calculator", heading: /mortgage calculator/i },
  { path: "/tools/stamp-duty-calculator", heading: /stamp duty/i },
  { path: "/tools/affordability-calculator", heading: /affordability/i },
  { path: "/tools/rental-yield-calculator", heading: /rental yield/i },
  { path: "/tools/buy-vs-rent-calculator", heading: /buy vs\.? rent/i },
  { path: "/tools/energy-bill-estimator", heading: /energy/i },
  { path: "/tools/mortgage-comparison", heading: /mortgage comparison/i },
  { path: "/tools/remortgage-calculator", heading: /remortgage/i },
  { path: "/tools/moving-cost-estimator", heading: /moving cost/i },
  { path: "/tools/first-time-buyer-guide", heading: /first.time buyer/i },
];

test.describe("Tool Pages", () => {
  for (const { path, heading } of TOOL_PAGES) {
    test(`${path} loads with correct heading`, async ({ page }) => {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: heading }).first(),
      ).toBeVisible();
    });
  }
});
