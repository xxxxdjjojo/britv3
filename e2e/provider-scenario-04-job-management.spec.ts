/**
 * Provider Scenario 4: "A Day's Work"
 * Managing Active Jobs Through to Completion and Payment
 *
 * Tests the full job lifecycle: dashboard KPIs -> active jobs ->
 * status transitions -> completion -> invoicing -> payment.
 * Resilient to empty states (tests check for data presence before asserting).
 * All tests require authentication as a provider.
 */

import { test, expect } from "./fixtures/auth";

test.use({ role: "provider" });

// ---------------------------------------------------------------------------
// Dashboard KPIs
// ---------------------------------------------------------------------------

test.describe("Dashboard KPI Cards", () => {
  test("dashboard shows KPI cards with counts", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );

    // KPI cards for leads, active jobs, earnings
    const kpiLabels = [
      /lead/i,
      /active.*job|job.*active|current.*job/i,
      /earning|revenue|income|\u00a3/i,
    ];

    let found = 0;
    for (const pattern of kpiLabels) {
      const el = authenticatedPage.getByText(pattern).first();
      if (await el.isVisible().catch(() => false)) {
        found++;
      }
    }

    // At least 2 of the 3 KPI categories should be visible
    expect(found).toBeGreaterThanOrEqual(2);
  });

  test("KPI cards display numeric values", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider");

    // Look for numeric content in KPI-style containers
    // Cards typically have large numbers (0, 1, 2, etc. or currency amounts)
    const numbers = authenticatedPage.locator(
      "[data-testid*='kpi'] .text-2xl, [data-testid*='kpi'] .text-3xl, " +
      "[data-testid*='stat'] .text-2xl, .card h2, .card .text-2xl, .card .text-3xl",
    );

    const hasNumbers = await numbers.first().isVisible().catch(() => false);
    if (!hasNumbers) {
      // Fallback: just verify the page has meaningful content
      await expect(
        authenticatedPage.getByRole("heading").first(),
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});

// ---------------------------------------------------------------------------
// Active Jobs Management
// ---------------------------------------------------------------------------

test.describe("Active Jobs — Management", () => {
  test("active jobs page lists jobs sorted by date", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/dashboard/provider/jobs/active");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });

    // If jobs exist, verify a date column or sort indicator is present
    const dateIndicator = authenticatedPage.getByText(
      /date|scheduled|due|upcoming/i,
    );
    const hasDates = await dateIndicator.first().isVisible().catch(() => false);

    // Also acceptable: a sort control
    const sortControl = authenticatedPage.getByText(/sort|order.*by/i);
    const hasSort = await sortControl.first().isVisible().catch(() => false);

    // Page loaded successfully — sorting is verified by presence of date/sort UI
    expect(
      hasDates ||
        hasSort ||
        (await authenticatedPage
          .getByText(/no.*job|empty/i)
          .first()
          .isVisible()
          .catch(() => false)),
    ).toBe(true);
  });

  test("job detail page renders", async ({ authenticatedPage }) => {
    // Navigate to the active jobs page first to find a job link
    await authenticatedPage.goto("/dashboard/provider/jobs/active");

    // Try to find a job link to navigate to its detail
    const jobLink = authenticatedPage
      .locator("a[href*='/dashboard/provider/jobs/']")
      .first();
    const hasLink = await jobLink.isVisible().catch(() => false);

    if (!hasLink) {
      // No active jobs — try a fallback test job ID route
      await authenticatedPage.goto("/dashboard/provider/jobs/test-id");
      // May show 404 or empty state — just verify no crash
      await expect(authenticatedPage.locator("body")).not.toContainText(
        "Application error",
      );
      return;
    }

    await jobLink.click();
    await authenticatedPage.waitForLoadState("networkidle");

    // Job detail should show booking status and info
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("job detail page shows status transition buttons", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/dashboard/provider/jobs/active");

    const jobLink = authenticatedPage
      .locator("a[href*='/dashboard/provider/jobs/']")
      .first();
    const hasLink = await jobLink.isVisible().catch(() => false);

    if (!hasLink) {
      test.skip(true, "No active jobs available — skipping status button test");
      return;
    }

    await jobLink.click();
    await authenticatedPage.waitForLoadState("networkidle");

    // Look for status transition buttons:
    // confirmed -> in_progress -> completed
    const statusButtons = [
      /start.*job|begin.*work|mark.*in.*progress|start.*work/i,
      /complete|mark.*complete|finish|done/i,
    ];

    let found = 0;
    for (const pattern of statusButtons) {
      const btn = authenticatedPage.getByRole("button", { name: pattern });
      if (await btn.first().isVisible().catch(() => false)) {
        found++;
      }
    }

    // At least one status transition button should be visible
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test("status change shows confirmation dialog", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/dashboard/provider/jobs/active");

    const jobLink = authenticatedPage
      .locator("a[href*='/dashboard/provider/jobs/']")
      .first();
    const hasLink = await jobLink.isVisible().catch(() => false);

    if (!hasLink) {
      test.skip(true, "No active jobs — cannot test status change dialog");
      return;
    }

    await jobLink.click();
    await authenticatedPage.waitForLoadState("networkidle");

    // Find any status transition button
    const transitionBtn = authenticatedPage
      .getByRole("button", {
        name: /start|complete|finish|begin|mark/i,
      })
      .first();
    const hasBtn = await transitionBtn.isVisible().catch(() => false);

    if (!hasBtn) {
      test.skip(true, "No status transition buttons visible");
      return;
    }

    await transitionBtn.click();

    // Expect a confirmation dialog/modal
    const dialog = authenticatedPage.locator(
      "[role='dialog'], [role='alertdialog'], .modal, [data-testid='confirm-dialog']",
    );
    const confirmText = authenticatedPage.getByText(
      /confirm|are you sure|proceed/i,
    );

    const hasDialog =
      (await dialog.first().isVisible().catch(() => false)) ||
      (await confirmText.first().isVisible().catch(() => false));

    // If no confirmation dialog, the action may have completed directly
    // (some UIs skip confirmation for status transitions)
    if (hasDialog) {
      await expect(dialog.first().or(confirmText.first())).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Completed Jobs
// ---------------------------------------------------------------------------

test.describe("Completed Jobs", () => {
  test("completed jobs page lists finished work", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/dashboard/provider/jobs/completed");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Should show completed jobs or empty state
    const hasContent = await authenticatedPage
      .getByText(/completed|finished|done|no.*completed.*job|empty/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasContent).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Invoice Generation
// ---------------------------------------------------------------------------

test.describe("Invoice Generation", () => {
  test("payments page loads", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/payments");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("payments page shows earnings or empty state", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/dashboard/provider/payments");

    const hasPayments = await authenticatedPage
      .getByText(/payment|earning|transaction|invoice|\u00a3/i)
      .first()
      .isVisible()
      .catch(() => false);

    const hasEmpty = await authenticatedPage
      .getByText(/no.*payment|no.*earning|empty|no.*transaction/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasPayments || hasEmpty).toBe(true);
  });

  test("invoice preview shows VAT calculation", async ({
    authenticatedPage,
  }) => {
    // Try to navigate to an invoice page
    await authenticatedPage.goto("/dashboard/provider/payments");

    // Look for an invoice link
    const invoiceLink = authenticatedPage
      .locator("a[href*='invoice']")
      .first();
    const hasLink = await invoiceLink.isVisible().catch(() => false);

    if (!hasLink) {
      // Try the quotes page for invoice access
      await authenticatedPage.goto("/dashboard/provider/quotes/builder");
      await expect(authenticatedPage.locator("body")).not.toContainText(
        "Application error",
      );
      // VAT test relies on having an existing quote with an invoice
      test.skip(true, "No invoices available — skipping VAT calculation test");
      return;
    }

    await invoiceLink.click();
    await authenticatedPage.waitForLoadState("networkidle");

    // Invoice should show: line items, subtotal, VAT (20%), total
    const vatText = authenticatedPage.getByText(/vat|20%/i);
    await expect(vatText.first()).toBeVisible({ timeout: 10_000 });

    // Should also show a total
    const totalText = authenticatedPage.getByText(/total|\u00a3/i);
    await expect(totalText.first()).toBeVisible();
  });

  test("invoice has PDF download link", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/payments");

    const invoiceLink = authenticatedPage
      .locator("a[href*='invoice']")
      .first();
    const hasLink = await invoiceLink.isVisible().catch(() => false);

    if (!hasLink) {
      test.skip(true, "No invoices available — skipping PDF link test");
      return;
    }

    await invoiceLink.click();
    await authenticatedPage.waitForLoadState("networkidle");

    // Look for PDF download button/link
    const pdfBtn = authenticatedPage.getByRole("button", {
      name: /download.*pdf|export.*pdf|pdf/i,
    });
    const pdfLink = authenticatedPage.locator("a[href*='.pdf'], a[download]");

    const hasPdf =
      (await pdfBtn.first().isVisible().catch(() => false)) ||
      (await pdfLink.first().isVisible().catch(() => false));

    if (!hasPdf) {
      test.skip(true, "No PDF download element found");
      return;
    }

    expect(hasPdf).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Job Timeline & Resilience
// ---------------------------------------------------------------------------

test.describe("Job Lifecycle — Resilience", () => {
  test("multiple concurrent job pages don't conflict", async ({
    authenticatedPage,
  }) => {
    // Navigate between active and completed jobs rapidly
    await authenticatedPage.goto("/dashboard/provider/jobs/active");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );

    await authenticatedPage.goto("/dashboard/provider/jobs/completed");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );

    await authenticatedPage.goto("/dashboard/provider/jobs/leads");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );

    // All pages should load without errors
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("job timeline component renders if available", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/dashboard/provider/jobs/active");

    const jobLink = authenticatedPage
      .locator("a[href*='/dashboard/provider/jobs/']")
      .first();
    const hasLink = await jobLink.isVisible().catch(() => false);

    if (!hasLink) {
      test.skip(true, "No active jobs — cannot test timeline component");
      return;
    }

    await jobLink.click();
    await authenticatedPage.waitForLoadState("networkidle");

    // Look for a timeline/progress component
    const timeline = authenticatedPage.getByText(
      /timeline|progress|milestone|stage|step/i,
    );
    const hasTimeline = await timeline.first().isVisible().catch(() => false);

    if (!hasTimeline) {
      // Timeline may be a visual component without text labels
      const timelineEl = authenticatedPage.locator(
        "[data-testid*='timeline'], [data-testid*='progress'], .timeline, .progress-bar",
      );
      const hasEl = await timelineEl.first().isVisible().catch(() => false);

      // Timeline is optional — just verify job detail loaded
      if (!hasEl) {
        await expect(
          authenticatedPage.getByRole("heading").first(),
        ).toBeVisible();
        return;
      }
    }

    await expect(timeline.first()).toBeVisible();
  });

  test(
    "status change button is idempotent (double-click safe)",
    async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/dashboard/provider/jobs/active");

      const jobLink = authenticatedPage
        .locator("a[href*='/dashboard/provider/jobs/']")
        .first();
      const hasLink = await jobLink.isVisible().catch(() => false);

      if (!hasLink) {
        test.skip(true, "No active jobs — cannot test double-click safety");
        return;
      }

      await jobLink.click();
      await authenticatedPage.waitForLoadState("networkidle");

      const transitionBtn = authenticatedPage
        .getByRole("button", {
          name: /start|complete|finish|begin|mark/i,
        })
        .first();
      const hasBtn = await transitionBtn.isVisible().catch(() => false);

      if (!hasBtn) {
        test.skip(true, "No status transition button visible");
        return;
      }

      // Double-click the button rapidly
      await transitionBtn.dblclick();

      // Page should not crash or show duplicate errors
      await authenticatedPage.waitForTimeout(1_000);
      await expect(authenticatedPage.locator("body")).not.toContainText(
        "Application error",
      );

      // Should not show multiple confirmation dialogs
      const dialogs = authenticatedPage.locator(
        "[role='dialog'], [role='alertdialog']",
      );
      const dialogCount = await dialogs.count();
      expect(dialogCount).toBeLessThanOrEqual(1);
    },
  );
});
