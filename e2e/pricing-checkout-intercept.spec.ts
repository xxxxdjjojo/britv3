// e2e/pricing-checkout-intercept.spec.ts
//
// MEMO PIVOT v2 — when a pricing-page CTA is clicked, the resulting POST to
// /api/billing/checkout must carry the correct planId / priceId for that tier.
// We intercept the network request without authenticating; the test focuses
// on the link wiring, not on completing a Stripe purchase.

import { test, expect, type Request } from "@playwright/test";

interface CheckoutPayload {
  readonly planId?: string;
  readonly priceId?: string;
  readonly interval?: "monthly" | "annual";
  readonly segment?: string;
}

async function readPostJson(request: Request): Promise<CheckoutPayload | null> {
  const body = request.postData();
  if (!body) return null;
  try {
    return JSON.parse(body) as CheckoutPayload;
  } catch {
    return null;
  }
}

test.describe("Pricing CTA → /api/billing/checkout payload", () => {
  test("Sellers Basic CTA posts planId=seller_basic", async ({ page }) => {
    const checkoutPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/billing/checkout") && req.method() === "POST",
    );
    await page.goto("/pricing");
    await page.getByRole("tab", { name: /sellers/i }).click();
    await page
      .getByRole("article", { name: /basic/i })
      .getByRole("link", { name: /get started|buy|subscribe/i })
      .first()
      .click()
      .catch(async () => {
        // Fallback: any link inside the Basic card
        await page
          .locator("[data-plan-id='seller_basic'] a, [data-plan-id='seller_basic'] button")
          .first()
          .click();
      });
    const request = await checkoutPromise;
    const payload = await readPostJson(request);
    expect(payload?.planId).toBe("seller_basic");
    expect(payload?.segment).toBe("seller");
  });

  test("Providers Pro monthly CTA posts planId=provider_pro, interval=monthly", async ({
    page,
  }) => {
    const checkoutPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/billing/checkout") && req.method() === "POST",
    );
    await page.goto("/pricing");
    await page.getByRole("tab", { name: /^providers$/i }).click();
    await page
      .locator("[data-plan-id='provider_pro'] a, [data-plan-id='provider_pro'] button")
      .first()
      .click();
    const request = await checkoutPromise;
    const payload = await readPostJson(request);
    expect(payload?.planId).toBe("provider_pro");
    expect(payload?.interval).toBe("monthly");
  });

  test("Developers Multi annual CTA posts planId=developer_multi, interval=annual", async ({
    page,
  }) => {
    await page.goto("/pricing");
    await page.getByRole("tab", { name: /developers/i }).click();
    await page.getByRole("switch", { name: /annual/i }).click();
    const checkoutPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/billing/checkout") && req.method() === "POST",
    );
    await page
      .locator("[data-plan-id='developer_multi'] a, [data-plan-id='developer_multi'] button")
      .first()
      .click();
    const request = await checkoutPromise;
    const payload = await readPostJson(request);
    expect(payload?.planId).toBe("developer_multi");
    expect(payload?.interval).toBe("annual");
  });
});
