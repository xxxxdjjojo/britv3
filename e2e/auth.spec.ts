import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test("verify email page renders", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(page.getByText("Check your email")).toBeVisible();
  });

  test("reset password page renders", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: /new password/i })).toBeVisible();
  });

  test("welcome page renders", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome to Britestate");
    await expect(page.getByRole("link", { name: /Start Searching/i })).toHaveAttribute("href", "/search");
  });
});
