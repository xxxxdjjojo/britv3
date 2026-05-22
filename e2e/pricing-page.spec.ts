// e2e/pricing-page.spec.ts
//
// MEMO PIVOT v2 — /pricing renders 7 segments with the memo's exact prices.

import { test, expect } from "@playwright/test";

test.describe("Pricing page v2", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("page has a hero heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: /transparent pricing/i }),
    ).toBeVisible();
  });

  test("renders 7 segment tabs", async ({ page }) => {
    const segments = [
      /sellers/i,
      /estate agents/i,
      /landlords/i,
      /providers/i,
      /professionals/i, // niche
      /developers/i,
      /traders/i,
    ];
    for (const segment of segments) {
      await expect(page.getByRole("tab", { name: segment })).toBeVisible();
    }
  });

  test("defaults to the Sellers tab", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /sellers/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("heading", { name: /^Basic$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Plus$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Premium$/ })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /no.?sale.?no.?fee/i }),
    ).toBeVisible();
  });

  test("Sellers tab shows £99 / £249 / £449 / £0 prices", async ({ page }) => {
    await expect(page.getByText("£99", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("£249", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("£449", { exact: false }).first()).toBeVisible();
    // NSNF: £0 upfront + 1% on completion
    await expect(page.getByText(/1%/i).first()).toBeVisible();
  });

  test("Sellers tab does NOT show monthly/annual toggle (one-off pricing)", async ({
    page,
  }) => {
    await expect(page.getByRole("switch", { name: /annual|monthly/i })).toHaveCount(
      0,
    );
  });

  test("Agents tab shows Listed/Pro/Elite at £0/£99/£349", async ({ page }) => {
    await page.getByRole("tab", { name: /estate agents/i }).click();
    await expect(page.getByRole("heading", { name: /^Listed$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Pro$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Elite$/ })).toBeVisible();
    await expect(page.getByText(/£99/).first()).toBeVisible();
    await expect(page.getByText(/£349/).first()).toBeVisible();
  });

  test("Landlords tab shows 4 tiers at £0/£15/£39/£99", async ({ page }) => {
    await page.getByRole("tab", { name: /landlords/i }).click();
    await expect(page.getByRole("heading", { name: /^Free$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Essential$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Pro$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Portfolio$/ })).toBeVisible();
    await expect(page.getByText(/£15/).first()).toBeVisible();
    await expect(page.getByText(/£39/).first()).toBeVisible();
  });

  test("Providers tab shows Listed/Pro/Elite at £0/£39/£149 with banded commission", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: /^Providers$/i }).click();
    await expect(page.getByText(/£39/).first()).toBeVisible();
    await expect(page.getByText(/£149/).first()).toBeVisible();
    await expect(page.getByText(/12%/).first()).toBeVisible();
    await expect(page.getByText(/10%/).first()).toBeVisible();
    await expect(page.getByText(/6%/).first()).toBeVisible();
  });

  test("Niche professionals tab shows Conveyancer/Surveyor/Mortgage broker", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: /professionals/i }).click();
    await expect(page.getByRole("heading", { name: /conveyancer/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /surveyor/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /mortgage broker/i })).toBeVisible();
    await expect(page.getByText(/£79/).first()).toBeVisible();
    await expect(page.getByText(/£49/).first()).toBeVisible();
  });

  test("Developers tab shows Single/Multi/Enterprise at £299/£799/£1,999", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: /developers/i }).click();
    await expect(page.getByRole("heading", { name: /^Single$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Multi$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Enterprise$/ })).toBeVisible();
    await expect(page.getByText(/£299/).first()).toBeVisible();
    await expect(page.getByText(/£799/).first()).toBeVisible();
    await expect(page.getByText(/£1,?999/).first()).toBeVisible();
  });

  test("Traders tab shows Pro/Elite at £99/£299", async ({ page }) => {
    await page.getByRole("tab", { name: /traders/i }).click();
    await expect(page.getByRole("heading", { name: /^Pro$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Elite$/ })).toBeVisible();
    await expect(page.getByText(/£99/).first()).toBeVisible();
    await expect(page.getByText(/£299/).first()).toBeVisible();
  });

  test("Monthly/annual toggle appears on subscription tabs and switches prices", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: /providers/i }).first().click();
    const toggle = page.getByRole("switch", { name: /annual/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByText(/billed annually|\/year/i).first()).toBeVisible();
  });

  test("OLD prices (£297, £497, £197, £47) are NOT shown anywhere", async ({
    page,
  }) => {
    // Walk every tab — none should mention the old price points
    const tabs = [
      "sellers",
      "estate agents",
      "landlords",
      "providers",
      "professionals",
      "developers",
      "traders",
    ];
    for (const t of tabs) {
      await page.getByRole("tab", { name: new RegExp(t, "i") }).click();
      await expect(page.getByText("£297").first()).toHaveCount(0);
      await expect(page.getByText("£497").first()).toHaveCount(0);
      await expect(page.getByText("£197").first()).toHaveCount(0);
      await expect(page.getByText("£47/").first()).toHaveCount(0);
    }
  });
});
