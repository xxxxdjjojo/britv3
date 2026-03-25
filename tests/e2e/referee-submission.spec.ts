import { test, expect } from "@playwright/test";

test.describe("Public Referee Submission Page", () => {
  // Invalid token shows error
  test("invalid token shows error message", async ({ page }) => {
    await page.goto("/reference/invalid-token-12345");
    // Should show the page (not redirect — it's a public route)
    expect(page.url()).toContain("/reference/invalid-token-12345");
    // Should show error state
    await expect(page.getByText(/expired|invalid/i)).toBeVisible();
  });

  // Empty token path returns 404
  test("reference route without token returns 404", async ({ page }) => {
    const response = await page.goto("/reference/");
    // Should be 404 or redirect
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });

  // Malformed token (random string) shows error
  test("malformed token shows friendly error", async ({ page }) => {
    await page.goto("/reference/abc.def.ghi");
    await expect(page.getByText(/expired|invalid/i)).toBeVisible();
  });

  // Reference page is publicly accessible (no auth redirect)
  test("reference page does not redirect to login", async ({ page }) => {
    await page.goto("/reference/some-token");
    // Should NOT redirect to /login — it's in PUBLIC_ROUTES
    expect(page.url()).not.toContain("/login");
  });
});
