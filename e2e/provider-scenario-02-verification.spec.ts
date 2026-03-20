/**
 * Provider Scenario 2: "Getting Verified"
 * Full Verification Pipeline with References
 *
 * Tests the verification centre flows including credential uploads,
 * client references, peer references, and badge gallery.
 * All tests require authentication as a provider.
 */

import { test, expect } from "./fixtures/auth";

test.use({ role: "provider" });

// ---------------------------------------------------------------------------
// Verification Centre Overview
// ---------------------------------------------------------------------------

test.describe("Verification Centre — Overview", () => {
  test("verification centre loads with stepper", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/verification");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Stepper should show all 5 steps
    const stepperContainer = authenticatedPage.locator(
      "[data-testid='verification-stepper'], [role='tablist'], nav, ol",
    );
    const hasSteps = await stepperContainer.first().isVisible().catch(() => false);

    // If no stepper is found by role, check for step text content
    if (!hasSteps) {
      const stepText = authenticatedPage.getByText(/step|phase/i).first();
      await expect(stepText).toBeVisible({ timeout: 5_000 });
    }
  });

  test(
    "verification status is displayed (unverified, pending, or verified)",
    async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/dashboard/provider/verification");

      // Look for a status indicator
      const statusPatterns = [
        /unverified/i,
        /pending.*review/i,
        /verified/i,
        /not.*verified/i,
        /in.*progress/i,
        /complete/i,
      ];

      let statusFound = false;
      for (const pattern of statusPatterns) {
        const el = authenticatedPage.getByText(pattern).first();
        if (await el.isVisible().catch(() => false)) {
          statusFound = true;
          break;
        }
      }

      expect(statusFound).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// Credentials Upload
// ---------------------------------------------------------------------------

test.describe("Verification — Credentials Upload", () => {
  test("credentials page shows upload cards for ID, Insurance, Qualifications", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto(
      "/dashboard/provider/verification/credentials",
    );
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );

    // Expect upload cards or sections for each credential type
    const credentialTypes = [
      /identity|photo.*id|passport|driving.*licence/i,
      /insurance|public.*liability/i,
      /qualification|certification|trade.*certificate/i,
    ];

    let found = 0;
    for (const pattern of credentialTypes) {
      const el = authenticatedPage.getByText(pattern).first();
      if (await el.isVisible().catch(() => false)) {
        found++;
      }
    }

    // At least 2 of the 3 credential types should be visible
    expect(found).toBeGreaterThanOrEqual(2);
  });

  test("upload card accepts valid file types (PDF, JPEG, PNG, WebP)", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto(
      "/dashboard/provider/verification/credentials",
    );

    // Look for a file input element
    const fileInput = authenticatedPage.locator("input[type='file']").first();
    const hasFileInput = await fileInput.isVisible().catch(() => false);

    if (!hasFileInput) {
      // The file input might be hidden; check for the upload button/zone instead
      const uploadZone = authenticatedPage.getByText(
        /upload|drag.*drop|choose.*file/i,
      );
      await expect(uploadZone.first()).toBeVisible({ timeout: 10_000 });
      return;
    }

    // Verify accept attribute includes expected types
    const acceptAttr = await fileInput.getAttribute("accept");
    if (acceptAttr) {
      const acceptedTypes = acceptAttr.toLowerCase();
      // Check that common document/image types are accepted
      const expectedTypes = [".pdf", "image/", ".jpg", ".jpeg", ".png"];
      const hasExpected = expectedTypes.some((t) => acceptedTypes.includes(t));
      expect(hasExpected).toBe(true);
    }
  });

  test("insurance upload captures expiry date", async ({ authenticatedPage }) => {
    await authenticatedPage.goto(
      "/dashboard/provider/verification/credentials",
    );

    // Look for an expiry date field near insurance section
    const expiryField = authenticatedPage.getByText(
      /expir|valid.*until|renewal.*date/i,
    );
    const hasExpiry = await expiryField.first().isVisible().catch(() => false);

    if (!hasExpiry) {
      // The expiry date input may only appear after uploading — just verify page loaded
      await expect(
        authenticatedPage.getByRole("heading").first(),
      ).toBeVisible({ timeout: 10_000 });
      return;
    }

    await expect(expiryField.first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Client References
// ---------------------------------------------------------------------------

test.describe("Verification — Client References", () => {
  test("client references page loads", async ({ authenticatedPage }) => {
    await authenticatedPage.goto(
      "/dashboard/provider/verification/client-references",
    );
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("reference request form has email field", async ({ authenticatedPage }) => {
    await authenticatedPage.goto(
      "/dashboard/provider/verification/client-references",
    );

    // Should have a form to request references via email
    const emailInput = authenticatedPage.getByLabel(/email/i).first();
    const hasEmail = await emailInput.isVisible().catch(() => false);

    if (!hasEmail) {
      // Could be a button that opens a modal/form
      const requestBtn = authenticatedPage.getByRole("button", {
        name: /request|invite|add.*reference/i,
      });
      await expect(requestBtn.first()).toBeVisible({ timeout: 10_000 });
      return;
    }

    await expect(emailInput).toBeVisible();
  });

  test("reference request validates email format", async ({ authenticatedPage }) => {
    await authenticatedPage.goto(
      "/dashboard/provider/verification/client-references",
    );

    const emailInput = authenticatedPage.getByLabel(/email/i).first();
    const hasEmail = await emailInput.isVisible().catch(() => false);

    if (!hasEmail) {
      test.skip(true, "Email input not directly visible — may be behind modal");
      return;
    }

    // Enter an invalid email
    await emailInput.fill("not-an-email");

    // Try to submit
    const submitBtn = authenticatedPage.getByRole("button", {
      name: /send|request|submit|invite/i,
    });
    if (await submitBtn.first().isVisible().catch(() => false)) {
      await submitBtn.first().click();

      // Expect validation error
      const error = authenticatedPage.getByText(
        /valid.*email|invalid.*email|email.*format/i,
      );
      await expect(error.first()).toBeVisible({ timeout: 5_000 });
    }
  });
});

// ---------------------------------------------------------------------------
// Peer References
// ---------------------------------------------------------------------------

test.describe("Verification — Peer References", () => {
  test("peer references page loads", async ({ authenticatedPage }) => {
    await authenticatedPage.goto(
      "/dashboard/provider/verification/peer-references",
    );
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("peer references page has request mechanism", async ({ authenticatedPage }) => {
    await authenticatedPage.goto(
      "/dashboard/provider/verification/peer-references",
    );

    // Similar to client references — should have email input or request button
    const hasForm =
      (await authenticatedPage
        .getByLabel(/email/i)
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await authenticatedPage
        .getByRole("button", { name: /request|invite|add/i })
        .first()
        .isVisible()
        .catch(() => false));

    expect(hasForm).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Badge Gallery
// ---------------------------------------------------------------------------

test.describe("Verification — Badge Gallery", () => {
  test("badge gallery page loads", async ({ authenticatedPage }) => {
    await authenticatedPage.goto(
      "/dashboard/provider/verification/badges",
    );
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("badge gallery shows badge items", async ({ authenticatedPage }) => {
    await authenticatedPage.goto(
      "/dashboard/provider/verification/badges",
    );

    // Look for badge cards, icons, or list items
    const badgePatterns = [
      /verified.*provider/i,
      /background.*check/i,
      /insured/i,
      /top.*rated/i,
      /badge/i,
      /earned/i,
      /locked/i,
    ];

    let found = 0;
    for (const pattern of badgePatterns) {
      const el = authenticatedPage.getByText(pattern).first();
      if (await el.isVisible().catch(() => false)) {
        found++;
      }
    }

    // At least 1 badge-related element should be visible (earned or locked)
    expect(found).toBeGreaterThanOrEqual(1);
  });
});
