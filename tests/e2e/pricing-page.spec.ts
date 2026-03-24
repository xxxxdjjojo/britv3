// tests/e2e/pricing-page.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Pricing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("displays page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /simple, transparent pricing/i }),
    ).toBeVisible();
  });

  test("shows 4 role tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: /homeowners/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /tradespeople/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /estate agents/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /landlords/i })).toBeVisible();
  });

  test("defaults to tradespeople tab", async ({ page }) => {
    // Should see Member, Professional, Elite pricing
    await expect(page.getByRole("heading", { name: "Member" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Professional" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Elite" })).toBeVisible();
  });

  test("shows correct tradesperson prices", async ({ page }) => {
    await expect(page.getByText("£47")).toBeVisible();
    await expect(page.getByText("£97")).toBeVisible();
    await expect(page.getByText("£197")).toBeVisible();
  });

  test("switching to agents tab shows agent pricing", async ({ page }) => {
    await page.getByRole("button", { name: /estate agents/i }).click();
    await expect(page.getByRole("heading", { name: "Performance" })).toBeVisible();
    await expect(page.getByText("Free")).toBeVisible();
    await expect(page.getByText("£297")).toBeVisible();
    await expect(page.getByText("£497")).toBeVisible();
  });

  test("switching to homeowners tab shows free plan only", async ({ page }) => {
    await page.getByRole("button", { name: /homeowners/i }).click();
    await expect(page.getByText("Free")).toBeVisible();
    // Should NOT show billing toggle (all plans are free)
    await expect(page.getByRole("switch")).not.toBeVisible();
  });

  test("billing toggle switches to annual prices", async ({ page }) => {
    // Default tab is tradespeople
    const toggle = page.getByRole("switch", { name: /toggle annual/i });
    await toggle.click();
    // Should show annual pricing text
    await expect(page.getByText(/billed annually/i).first()).toBeVisible();
    await expect(page.getByText(/save/i).first()).toBeVisible();
  });

  test("landlords tab shows 2 plan cards", async ({ page }) => {
    await page.getByRole("button", { name: /landlords/i }).click();
    await expect(page.getByRole("heading", { name: "Essential" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Professional" })).toBeVisible();
  });

  test("CTA buttons link to registration with role", async ({ page }) => {
    // On tradespeople tab, the Member CTA should point to register
    const memberCta = page.getByRole("link", { name: /request invite/i }).first();
    await expect(memberCta).toHaveAttribute("href", /role=service_provider/);
  });
});

// [ENG REVIEW 10A] — middleware referrals exemption test
test.describe("Middleware referrals exemption", () => {
  test("referrals page is accessible without subscription", async ({ page }) => {
    // Navigate to a referrals page — middleware should NOT redirect to billing
    // even if the user has no active subscription. This verifies the
    // isReferralsPage exemption added in Task 7.
    const response = await page.goto("/dashboard/provider/referrals");
    // Should not be redirected to billing checkout
    expect(page.url()).not.toContain("/billing/checkout");
    // The response should be 200 (page exists) or 401/redirect to login (no auth),
    // but NOT a redirect to billing. If the user is not authenticated at all,
    // they'd be redirected to login, which is fine — the point is no billing redirect.
    if (response) {
      expect(response.status()).not.toBe(307); // 307 is the billing redirect
    }
  });
});
