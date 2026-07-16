import { test, expect } from "@playwright/test";

test.describe("Referral Dashboard", () => {
  test("referrals page loads without auth redirect to billing", async ({ page }) => {
    // Referrals page is exempted from subscription gating (Wave 1 middleware change)
    await page.goto("/dashboard/provider/referrals");
    // Should NOT redirect to billing checkout
    expect(page.url()).not.toContain("/billing/checkout");
  });

  // ENG REVIEW 14A: Dashboard smoke test
  test("referral dashboard renders key sections for authenticated user", async ({ page }) => {
    // This test requires an authenticated session — adjust login helper as needed
    await page.goto("/dashboard/provider/referrals");

    // Verify key UI sections render
    await expect(page.getByText("Referral Tier")).toBeVisible();
    await expect(page.getByText("Share Your Link")).toBeVisible();
    await expect(page.getByText("Referral Activity")).toBeVisible();
  });
});

test.describe("Referral Link Capture", () => {
  test("visiting /join?ref=TESTCODE sets britestate_ref cookie", async ({ page }) => {
    await page.goto("/join?ref=TESTCODE1");
    const cookies = await page.context().cookies();
    const refCookie = cookies.find((cookie) => cookie.name === "britestate_ref");
    expect(refCookie).toBeDefined();
    expect(refCookie?.value).toBe("TESTCODE1");
    // Cookie should have ~90 day expiry
    expect(refCookie?.expires).toBeGreaterThan(Date.now() / 1000 + 86400 * 80);
    // ENG REVIEW 6A: Cookie should be httpOnly
    expect(refCookie?.httpOnly).toBe(true);
  });

  test("first-touch attribution: existing cookie is not overwritten", async ({ page }) => {
    // Set cookie manually first
    await page.context().addCookies([
      {
        name: "britestate_ref",
        value: "FIRST123",
        domain: "localhost",
        path: "/",
      },
    ]);
    await page.goto("/join?ref=SECOND99");
    const cookies = await page.context().cookies();
    const refCookie = cookies.find((cookie) => cookie.name === "britestate_ref");
    expect(refCookie?.value).toBe("FIRST123");
  });

  test("invalid ref codes are ignored", async ({ page }) => {
    await page.goto("/join?ref=AB");
    const cookies = await page.context().cookies();
    const refCookie = cookies.find((cookie) => cookie.name === "britestate_ref");
    expect(refCookie).toBeUndefined();
  });

  test("XSS in ref param is sanitized", async ({ page }) => {
    await page.goto("/join?ref=<script>alert(1)</script>");
    const cookies = await page.context().cookies();
    const refCookie = cookies.find((cookie) => cookie.name === "britestate_ref");
    // Either no cookie or sanitized value
    if (refCookie) {
      expect(refCookie.value).not.toContain("<");
      expect(refCookie.value).not.toContain(">");
    }
  });
});
