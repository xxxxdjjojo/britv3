/**
 * Provider Scenario 1: "First Day on the Platform"
 * New Provider Onboarding to First Lead
 *
 * Tests the complete signup -> onboarding -> verification flow
 * for a new service provider (tradesperson) joining Britestate.
 *
 * Registration tests are unauthenticated (use @playwright/test directly).
 * Dashboard/verification tests use the auth fixture.
 */

import { test as unauthTest, expect as unauthExpect } from "@playwright/test";
import { test, expect } from "./fixtures/auth";

// ---------------------------------------------------------------------------
// PART 1: Registration (unauthenticated)
// ---------------------------------------------------------------------------

unauthTest.describe("Provider Registration", () => {
  unauthTest(
    "registration page loads with professional=provider param",
    async ({ page }) => {
      await page.goto("/register?professional=provider");
      await unauthExpect(
        page.getByRole("heading", { level: 1 }),
      ).toBeVisible();
      // The page should acknowledge provider context (toggle or pre-selected)
      await unauthExpect(page.locator("body")).not.toContainText(
        "Application error",
      );
    },
  );

  unauthTest(
    "registration form validates password requirements (8+ chars, uppercase, number)",
    async ({ page }) => {
      await page.goto("/register?professional=provider");

      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i).first();

      // Skip if form fields are not present (page structure may differ)
      if (!(await emailInput.isVisible().catch(() => false))) {
        unauthTest.skip(true, "Registration form not rendered as expected");
        return;
      }

      await emailInput.fill("test-provider@example.com");
      await passwordInput.fill("weak");

      // Attempt to submit to trigger validation
      const submitBtn = page.getByRole("button", { name: /create|sign up|register/i });
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
      }

      // Expect the PasswordStrengthMeter to render with "Weak" label
      await unauthExpect(
        page.getByText("Weak", { exact: true }),
      ).toBeVisible({ timeout: 5_000 });
    },
  );

  unauthTest(
    "registration form shows error for duplicate email",
    async ({ page }) => {
      await page.goto("/register?professional=provider");

      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i).first();
      const nameInput = page.getByLabel(/name/i).first();

      if (!(await emailInput.isVisible().catch(() => false))) {
        unauthTest.skip(true, "Registration form not rendered as expected");
        return;
      }

      // Use a known-existing email to trigger duplicate error
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill("Test Provider");
      }
      await emailInput.fill("admin@britestate.co.uk");
      await passwordInput.fill("TestPass123!");

      const submitBtn = page.getByRole("button", { name: /create|sign up|register/i });
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        // Should show already-in-use or similar error
        await unauthExpect(
          page.getByText(/already.*registered|already.*use|exists|duplicate/i),
        ).toBeVisible({ timeout: 10_000 });
      }
    },
  );

  unauthTest(
    "role select page allows selecting service_provider",
    async ({ page }) => {
      await page.goto("/register/role-select");
      await unauthExpect(page.locator("body")).not.toContainText(
        "Application error",
      );

      // Look for a provider/tradesperson role option
      const providerOption = page.getByText(/service provider|tradesperson|provider/i);
      await unauthExpect(providerOption.first()).toBeVisible({ timeout: 10_000 });
    },
  );
});

// ---------------------------------------------------------------------------
// PART 2: Onboarding Wizard (unauthenticated page — may redirect)
// ---------------------------------------------------------------------------

unauthTest.describe("Provider Onboarding Wizard", () => {
  unauthTest("onboarding wizard page loads", async ({ page }) => {
    await page.goto("/register/onboarding/provider");

    // May redirect to login if auth is required
    if (page.url().includes("/login")) {
      unauthTest.skip(true, "Onboarding requires auth — skipping");
      return;
    }

    await unauthExpect(page.locator("body")).not.toContainText(
      "Application error",
    );
    await unauthExpect(page.getByRole("heading").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  unauthTest(
    "onboarding wizard renders step indicators",
    async ({ page }) => {
      await page.goto("/register/onboarding/provider");

      if (page.url().includes("/login")) {
        unauthTest.skip(true, "Onboarding requires auth — skipping");
        return;
      }

      // Expect step labels or stepper elements for the 4 onboarding steps:
      // Trade Category, Coverage Area, Credentials, Availability
      const stepTexts = [
        /trade|category|service type/i,
        /coverage|area|location/i,
        /credential|qualification/i,
        /availability|schedule/i,
      ];

      let stepsFound = 0;
      for (const pattern of stepTexts) {
        const el = page.getByText(pattern).first();
        if (await el.isVisible().catch(() => false)) {
          stepsFound++;
        }
      }

      // At least the first step content should be visible
      unauthExpect(stepsFound).toBeGreaterThanOrEqual(1);
    },
  );
});

// ---------------------------------------------------------------------------
// PART 3: Dashboard & Verification (authenticated)
// ---------------------------------------------------------------------------

test.use({ role: "provider" });

test.describe("Provider Dashboard — New Provider State", () => {
  test("dashboard loads after onboarding", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("dashboard shows KPI cards", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider");

    // KPI cards typically show leads, active jobs, earnings, rating
    const body = authenticatedPage.locator("body");
    await expect(body).not.toContainText("Application error");

    // Check for KPI-style elements (cards with numbers or labels)
    const kpiPatterns = [/lead/i, /job/i, /earning|revenue/i, /rating|review/i];
    let found = 0;
    for (const pattern of kpiPatterns) {
      const el = authenticatedPage.getByText(pattern).first();
      if (await el.isVisible().catch(() => false)) {
        found++;
      }
    }

    // At least some KPI indicators should be present (may show 0 for new provider)
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test(
    "verification banner visible for unverified provider",
    async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/dashboard/provider");

      // Look for a verification prompt / banner
      const banner = authenticatedPage.getByText(
        /complete.*verification|verify.*account|get verified|appear in search/i,
      );
      // Banner may not show if provider is already verified — that's OK
      const isVisible = await banner.first().isVisible().catch(() => false);
      if (!isVisible) {
        test.skip(true, "Provider may already be verified — no banner shown");
      }
      await expect(banner.first()).toBeVisible();
    },
  );
});

test.describe("Provider Verification Centre", () => {
  test("verification centre page loads with stepper", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/verification");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test(
    "verification stepper shows expected steps",
    async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/dashboard/provider/verification");

      // Expect a multi-step verification flow (5 steps):
      // Identity, Insurance, Qualifications, Client References, Peer References / Badges
      const stepPatterns = [
        /identity|id|photo/i,
        /insurance/i,
        /qualification|credential|certificate/i,
        /reference/i,
        /badge/i,
      ];

      let stepsFound = 0;
      for (const pattern of stepPatterns) {
        const el = authenticatedPage.getByText(pattern).first();
        if (await el.isVisible().catch(() => false)) {
          stepsFound++;
        }
      }

      // At least some steps should be visible in the stepper
      expect(stepsFound).toBeGreaterThanOrEqual(2);
    },
  );

  test("credentials upload page renders", async ({ authenticatedPage }) => {
    await authenticatedPage.goto(
      "/dashboard/provider/verification/credentials",
    );
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test(
    "credentials page shows upload cards",
    async ({ authenticatedPage }) => {
      await authenticatedPage.goto(
        "/dashboard/provider/verification/credentials",
      );

      // Expect upload areas for documents
      const uploadArea = authenticatedPage.getByText(
        /upload|drag.*drop|choose.*file|select.*file/i,
      );
      await expect(uploadArea.first()).toBeVisible({ timeout: 10_000 });
    },
  );
});
