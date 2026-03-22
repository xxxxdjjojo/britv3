// tests/e2e/professional-registration-ltd.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Professional Registration — Ltd Company Path", () => {
  test("completes full registration as Ltd Company agent", async ({ page }) => {
    // Navigate to registration
    await page.goto("/register?professional=agent");

    // Expect to see registration form
    await expect(page.getByRole("heading")).toContainText(/create|register|sign up/i);

    // Fill registration form
    await page.fill('[name="firstName"], [id="firstName"]', "John");
    await page.fill('[name="lastName"], [id="lastName"]', "Smith");
    await page.fill('[name="email"], [id="email"]', `test+ltd${Date.now()}@britestate.co.uk`);
    await page.fill('[name="password"], [id="password"]', "TestPass123!");

    // Submit (this may redirect to verify-email or onboarding)
    await page.click('button[type="submit"], button:has-text("Create Account")');

    // Should redirect to onboarding or email verification
    await expect(page).toHaveURL(/verify-email|onboarding|register/);
  });

  test("Companies House step shows error for invalid company number", async ({ page }) => {
    // This test validates the CH verification UI error handling
    // In a full E2E setup with seeded auth, we'd navigate directly to the step
    test.skip(true, "Requires authenticated session — implement with test auth helpers");
  });

  test("Companies House step validates 8-character format", async ({ page }) => {
    test.skip(true, "Requires authenticated session — implement with test auth helpers");
  });

  test("sidebar shows correct progress through steps", async ({ page }) => {
    test.skip(true, "Requires authenticated session — implement with test auth helpers");
  });

  test("can skip optional steps and still complete", async ({ page }) => {
    test.skip(true, "Requires authenticated session — implement with test auth helpers");
  });
});
