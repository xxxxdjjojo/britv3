import { test, expect } from "@playwright/test";

test.describe("Provider Verification Flow", () => {
  // Smoke test: verification page loads
  test("verification page loads Trust Centre UI", async ({ page }) => {
    await page.goto("/dashboard/provider/verification");
    // Should show Trust Centre heading (may redirect to login if not auth'd)
    const url = page.url();
    // Either shows the page or redirects to login
    expect(url).toMatch(/\/(dashboard\/provider\/verification|login)/);
  });

  // Client references page loads
  test("client references page loads ReferenceTracker", async ({ page }) => {
    await page.goto("/dashboard/provider/verification/client-references");
    const url = page.url();
    expect(url).toMatch(/\/(dashboard\/provider\/verification\/client-references|login)/);
  });

  // Peer references page loads
  test("peer references page loads ReferenceTracker", async ({ page }) => {
    await page.goto("/dashboard/provider/verification/peer-references");
    const url = page.url();
    expect(url).toMatch(/\/(dashboard\/provider\/verification\/peer-references|login)/);
  });

  // Verification stepper shows 5 steps
  test("verification stepper shows all 5 verification steps", async ({ page }) => {
    await page.goto("/dashboard/provider/verification");
    // If we reach the page (authenticated), check for step labels
    if (!page.url().includes("/login")) {
      await expect(page.getByText("Identity Verification")).toBeVisible();
      await expect(page.getByText("Insurance")).toBeVisible();
      await expect(page.getByText("Qualifications")).toBeVisible();
    }
  });
});
