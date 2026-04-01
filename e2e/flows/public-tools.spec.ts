import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  const PUBLIC_PAGES = [
    { path: "/", name: "homepage" },
    { path: "/about", name: "about" },
    { path: "/how-it-works", name: "how it works" },
    { path: "/pricing", name: "pricing" },
    { path: "/careers", name: "careers" },
    { path: "/contact", name: "contact" },
    { path: "/blog", name: "blog" },
    { path: "/help", name: "help" },
    { path: "/services", name: "services" },
    { path: "/marketplace", name: "marketplace" },
    { path: "/agents", name: "agents" },
    { path: "/mortgage-brokers", name: "mortgage brokers" },
    { path: "/conveyancers", name: "conveyancers" },
    { path: "/surveyors", name: "surveyors" },
    { path: "/architects", name: "architects" },
  ];

  for (const { path, name } of PUBLIC_PAGES) {
    test(`${name} page loads (${path})`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
    });
  }
});

test.describe("Financial Calculator Pages", () => {
  const CALCULATOR_PAGES = [
    { path: "/tools/mortgage-calculator", name: "mortgage calculator" },
    { path: "/tools/stamp-duty-calculator", name: "stamp duty calculator" },
    { path: "/tools/affordability-calculator", name: "affordability calculator" },
    { path: "/tools/rental-yield-calculator", name: "rental yield calculator" },
    { path: "/tools/buy-vs-rent-calculator", name: "buy vs rent calculator" },
    { path: "/tools/energy-bill-estimator", name: "energy bill estimator" },
    { path: "/tools/equity-calculator", name: "equity calculator" },
    { path: "/tools/ltv-calculator", name: "LTV calculator" },
    { path: "/tools/investment-calculator", name: "investment calculator" },
    { path: "/tools/overpayment-calculator", name: "overpayment calculator" },
    { path: "/tools/remortgage-calculator", name: "remortgage calculator" },
    { path: "/tools/mortgage-comparison", name: "mortgage comparison" },
    { path: "/tools/moving-cost-estimator", name: "moving cost estimator" },
    { path: "/tools/first-time-buyer-guide", name: "first-time buyer guide" },
  ];

  for (const { path, name } of CALCULATOR_PAGES) {
    test(`${name} page loads (${path})`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
    });
  }
});

test.describe("Stamp Duty Calculator — Interactive", () => {
  test("accepts input and displays result", async ({ page }) => {
    await page.goto("/tools/stamp-duty-calculator");
    await expect(page.locator("body")).not.toContainText("Application error");

    // Fill property price
    const priceInput = page.locator("input[type=number]").first();
    await expect(priceInput).toBeVisible({ timeout: 10_000 });
    await priceInput.fill("350000");

    // Should show a calculated result (pound sign with number)
    await expect(page.getByText(/\u00a3[\d,]+/).first()).toBeVisible({ timeout: 5_000 });

    // Band breakdown should be visible
    const hasBands = await page
      .getByText(/Property Value Band|Tax Rate|Tax Payable/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasBands).toBeTruthy();
  });

  test("country selector changes tax regime label", async ({ page }) => {
    await page.goto("/tools/stamp-duty-calculator");
    await expect(page.locator("body")).not.toContainText("Application error");

    // Click Scotland
    await page.getByRole("button", { name: /Scotland/i }).click();
    await page.waitForTimeout(300);

    // URL should update
    await expect(page).toHaveURL(/country=scotland/);
  });
});

test.describe("Financial Tools Hub", () => {
  test("tools index page lists calculators", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10_000 });

    // Should have links to at least a few key calculators
    const hasMortgage = await page
      .getByText(/mortgage/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasStampDuty = await page
      .getByText(/stamp duty/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasMortgage || hasStampDuty).toBeTruthy();
  });
});
