// e2e/sellers-ab.spec.ts
//
// MEMO PIVOT v2 — the Sellers tab calls the exposure endpoint exactly once
// per session and records the resolved variant.

import { test, expect } from "@playwright/test";

test.describe("Sellers default-tier A/B exposure", () => {
  test("POSTs to /api/experiments/exposure with sellers_default_tier", async ({
    page,
  }) => {
    const exposurePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/experiments/exposure") &&
        req.method() === "POST",
      { timeout: 10_000 },
    );

    await page.goto("/pricing");
    await page.getByRole("tab", { name: /sellers/i }).click();

    const request = await exposurePromise;
    const body = JSON.parse(request.postData() ?? "{}");
    expect(body.flag).toBe("sellers_default_tier");
    expect(["basic", "plus"]).toContain(body.variant);
  });

  test("only one exposure event fires on repeated tab clicks", async ({ page }) => {
    const exposureCalls: string[] = [];
    await page.route("**/api/experiments/exposure", async (route) => {
      exposureCalls.push(route.request().url());
      await route.fulfill({ status: 200, body: "{}" });
    });

    await page.goto("/pricing");
    await page.getByRole("tab", { name: /sellers/i }).click();
    await page.getByRole("tab", { name: /estate agents/i }).click();
    await page.getByRole("tab", { name: /sellers/i }).click();
    // Give the page a beat to settle
    await page.waitForTimeout(500);

    expect(exposureCalls.length).toBe(1);
  });

  test("variant=plus highlights the Plus tier card", async ({ page }) => {
    await page.route("**/api/experiments/exposure", async (route) => {
      await route.fulfill({ status: 200, body: "{}" });
    });
    // Force the variant via cookie/url override that the component supports
    await page.goto("/pricing?force_variant=plus");
    await page.getByRole("tab", { name: /sellers/i }).click();
    const plusCard = page.locator("[data-plan-id='seller_plus']");
    await expect(plusCard).toHaveAttribute("data-highlighted", "true");
  });
});
