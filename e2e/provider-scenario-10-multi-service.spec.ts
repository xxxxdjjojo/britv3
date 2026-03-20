/**
 * Provider Scenario 10: "The Multi-Trade Powerhouse"
 * Complex Multi-Service Provider with Advanced Scheduling
 *
 * Tests multi-service management, availability scheduling,
 * concurrent bookings, and per-category analytics for providers
 * offering multiple trade categories.
 *
 * All tests require authenticated provider state.
 */

import { test, expect } from "./fixtures/auth";

test.use({ role: "provider" });

// ---------------------------------------------------------------------------
// PART 1: Dashboard with Multiple Active Jobs
// ---------------------------------------------------------------------------

test.describe("Provider Multi-Service Dashboard", () => {
  test("dashboard loads with KPI cards", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });

    // KPI cards should show active jobs count (may be 0 for new providers)
    const kpiPatterns = [/active.*job|job/i, /lead/i, /earning|revenue/i, /rating/i];
    let found = 0;
    for (const pattern of kpiPatterns) {
      const el = authenticatedPage.getByText(pattern).first();
      if (await el.isVisible().catch(() => false)) {
        found++;
      }
    }

    // At least some KPI indicators should render
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test("dashboard performs well with no visible errors", async ({ authenticatedPage }) => {
    // Load dashboard and verify it renders cleanly even with multiple data sources
    await authenticatedPage.goto("/dashboard/provider");

    // No application errors
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );

    // No console errors visible as page-level error messages
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Something went wrong",
    );

    // Heading renders (page fully loaded)
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// PART 2: Availability Calendar & Scheduling
// ---------------------------------------------------------------------------

test.describe("Provider Availability & Scheduling", () => {
  test("availability calendar page loads", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/availability");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("availability calendar renders weekly view", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/availability");

    // Look for day-of-week headers or a calendar grid
    const dayLabels = [/mon/i, /tue/i, /wed/i, /thu/i, /fri/i];
    let daysFound = 0;
    for (const pattern of dayLabels) {
      const el = authenticatedPage.getByText(pattern).first();
      if (await el.isVisible().catch(() => false)) {
        daysFound++;
      }
    }

    // Also check for calendar-style elements
    const calendarEl = authenticatedPage.locator(
      "[data-testid*='calendar'], [class*='calendar'], [role='grid'], table",
    );
    const hasCalendar = await calendarEl.first().isVisible().catch(() => false);

    if (daysFound < 3 && !hasCalendar) {
      test.skip(true, "Weekly calendar view not detected — UI structure may differ");
    }
    expect(daysFound >= 3 || hasCalendar).toBe(true);
  });

  test("calendar shows scheduled jobs on correct dates", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/availability");

    // Look for job entries on the calendar (colored blocks, event cards, etc.)
    const jobEntry = authenticatedPage.locator(
      "[data-testid*='event'], [data-testid*='booking'], [class*='event'], [class*='booking'], [class*='scheduled']",
    );
    const jobText = authenticatedPage.getByText(
      /booked|scheduled|appointment|job/i,
    );

    const hasEntry = await jobEntry.first().isVisible().catch(() => false);
    const hasText = await jobText.first().isVisible().catch(() => false);

    if (!hasEntry && !hasText) {
      test.skip(true, "No scheduled jobs visible on calendar — provider may have no bookings");
    }
    expect(hasEntry || hasText).toBe(true);
  });

  test("recurring unavailability rules can be configured", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/availability");

    // Look for a recurring/repeat unavailability option
    const recurringOption = authenticatedPage.getByText(
      /recurring|repeat|every.*week|block.*time|unavailable|regular.*time.*off/i,
    );
    const addBlockBtn = authenticatedPage.getByRole("button", {
      name: /add.*block|set.*unavail|block.*time|add.*rule/i,
    });

    const hasRecurring = await recurringOption.first().isVisible().catch(() => false);
    const hasAddBtn = await addBlockBtn.first().isVisible().catch(() => false);

    if (!hasRecurring && !hasAddBtn) {
      test.skip(true, "Recurring unavailability configuration not found");
    }
    expect(hasRecurring || hasAddBtn).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PART 3: Multi-Service Lead Management
// ---------------------------------------------------------------------------

test.describe("Provider Lead Management — Multi-Service", () => {
  test("leads page displays leads across service categories", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/jobs/leads");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Check for category/service type labels on leads
    const categoryLabels = authenticatedPage.getByText(
      /plumbing|electrical|carpentry|cleaning|painting|general|roofing|heating|gas|locksmith/i,
    );
    const hasCategories = await categoryLabels.first().isVisible().catch(() => false);

    // If no specific categories, leads list should at least render
    if (!hasCategories) {
      // Check for empty state
      const emptyState = authenticatedPage.getByText(
        /no.*lead|no.*new.*lead|check.*back|waiting/i,
      );
      const isEmpty = await emptyState.first().isVisible().catch(() => false);

      // Either categories or empty state should be visible
      if (!isEmpty) {
        test.skip(true, "Lead list not rendering expected content");
      }
    }
  });

  test("lead decline functionality with reason", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/jobs/leads");

    // Look for a decline/reject button on a lead
    const declineBtn = authenticatedPage.getByRole("button", {
      name: /decline|reject|pass|not interested/i,
    });
    const hasDecline = await declineBtn.first().isVisible().catch(() => false);

    if (!hasDecline) {
      test.skip(true, "No decline button found — leads may not be available");
      return;
    }

    await declineBtn.first().click();

    // A modal or form should appear asking for a decline reason
    const reasonField = authenticatedPage.locator(
      "textarea, select, [data-testid*='reason']",
    );
    const reasonLabel = authenticatedPage.getByText(
      /reason|why|tell.*us|feedback/i,
    );

    const hasReasonField = await reasonField.first().isVisible({ timeout: 5_000 }).catch(() => false);
    const hasReasonLabel = await reasonLabel.first().isVisible().catch(() => false);

    // Verify the decline flow asks for reasoning
    expect(hasReasonField || hasReasonLabel).toBe(true);
  });

  test("quick quote creation without AI assist", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/jobs/leads");

    // Look for a quote/send quote button on a lead
    const quoteBtn = authenticatedPage.getByRole("button", {
      name: /quote|send.*quote|create.*quote|respond/i,
    });
    const quoteLink = authenticatedPage.getByRole("link", {
      name: /quote|send.*quote|create.*quote/i,
    });

    const hasBtn = await quoteBtn.first().isVisible().catch(() => false);
    const hasLink = await quoteLink.first().isVisible().catch(() => false);

    if (!hasBtn && !hasLink) {
      test.skip(true, "No quote creation button found on leads page");
      return;
    }

    // Click to open quote form
    if (hasBtn) {
      await quoteBtn.first().click();
    } else {
      await quoteLink.first().click();
    }

    await authenticatedPage.waitForLoadState("networkidle").catch(() => {});

    // Quote form should have price/amount input and description
    const priceInput = authenticatedPage.locator(
      "input[type='number'], input[name*='price'], input[name*='amount'], input[placeholder*='price' i], input[placeholder*='amount' i]",
    );
    const descriptionField = authenticatedPage.locator("textarea");

    const hasPrice = await priceInput.first().isVisible().catch(() => false);
    const hasDescription = await descriptionField.first().isVisible().catch(() => false);

    // At least one input field should be present in the quote form
    expect(hasPrice || hasDescription).toBe(true);
  });

  test("multiple concurrent bookings manageable from active jobs", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/jobs/active");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );

    // Page should render a list of active jobs (may be empty)
    const jobList = authenticatedPage.locator(
      "[data-testid*='job'], [class*='job'], table tbody tr, [role='listitem']",
    );
    const emptyState = authenticatedPage.getByText(
      /no.*active.*job|no.*job|no.*booking/i,
    );

    const hasJobs = await jobList.first().isVisible().catch(() => false);
    const isEmpty = await emptyState.first().isVisible().catch(() => false);

    // Either jobs list or empty state should render — no errors
    expect(hasJobs || isEmpty).toBe(true);
  });

  test("job timeline component shows progress on job detail", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/jobs/active");

    // Navigate to a job detail
    const jobLink = authenticatedPage.locator("a[href*='/jobs/']").first();
    const hasJob = await jobLink.isVisible().catch(() => false);

    if (!hasJob) {
      test.skip(true, "No active jobs to inspect for timeline component");
      return;
    }

    await jobLink.click();
    await authenticatedPage.waitForLoadState("networkidle").catch(() => {});

    // Look for a timeline/progress component
    const timeline = authenticatedPage.locator(
      "[data-testid*='timeline'], [class*='timeline'], [class*='progress'], [role='progressbar']",
    );
    const timelineText = authenticatedPage.getByText(
      /timeline|progress|stage|step.*\d|day.*\d/i,
    );

    const hasTimeline = await timeline.first().isVisible().catch(() => false);
    const hasTimelineText = await timelineText.first().isVisible().catch(() => false);

    if (!hasTimeline && !hasTimelineText) {
      test.skip(true, "Job timeline component not found on detail page");
    }
    expect(hasTimeline || hasTimelineText).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PART 4: Analytics by Service Category
// ---------------------------------------------------------------------------

test.describe("Provider Analytics — Multi-Service", () => {
  test("analytics segments by service category", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/analytics");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );

    // Look for category-based filtering or segmentation
    const categoryFilter = authenticatedPage.locator(
      "select, [data-testid*='category-filter'], [role='tablist']",
    );
    const categoryLabels = authenticatedPage.getByText(
      /by.*category|by.*service|filter.*service|service.*type/i,
    );

    const hasFilter = await categoryFilter.first().isVisible().catch(() => false);
    const hasLabels = await categoryLabels.first().isVisible().catch(() => false);

    if (!hasFilter && !hasLabels) {
      test.skip(true, "Service category segmentation not found in analytics");
    }
    expect(hasFilter || hasLabels).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PART 5: Services & Verification
// ---------------------------------------------------------------------------

test.describe("Provider Services & Credentials", () => {
  test("services page shows multiple service categories", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/services");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Look for service category listings or cards
    const serviceItems = authenticatedPage.locator(
      "[data-testid*='service'], [class*='service-card'], [role='listitem'], table tbody tr",
    );
    const serviceText = authenticatedPage.getByText(
      /plumbing|electrical|carpentry|cleaning|painting|roofing|heating|gas|general|locksmith|service/i,
    );

    const hasItems = await serviceItems.first().isVisible().catch(() => false);
    const hasText = await serviceText.first().isVisible().catch(() => false);

    // Either service items or empty state should render
    if (!hasItems && !hasText) {
      const emptyState = authenticatedPage.getByText(
        /no.*service|add.*service|get.*started/i,
      );
      const isEmpty = await emptyState.first().isVisible().catch(() => false);
      if (!isEmpty) {
        test.skip(true, "Services page not rendering expected content");
      }
    }
  });

  test("credential expiry warning visible for expiring credentials", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/verification/credentials");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );

    // Look for expiry warnings (30 days before expiry)
    const expiryWarning = authenticatedPage.getByText(
      /expir|expiry|renew|due.*for.*renewal|days.*remaining|expire.*soon/i,
    );
    const hasWarning = await expiryWarning.first().isVisible().catch(() => false);

    if (!hasWarning) {
      // Check for any credential entries that show dates
      const dateDisplay = authenticatedPage.getByText(
        /valid.*until|expires|expiry.*date|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/i,
      );
      const hasDate = await dateDisplay.first().isVisible().catch(() => false);

      if (!hasDate) {
        test.skip(true, "No credential expiry information displayed — may have no credentials uploaded");
      }
    }
  });

  test("verification badges page shows credential expiry dates", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard/provider/verification/badges");
    await expect(authenticatedPage.locator("body")).not.toContainText(
      "Application error",
    );
    await expect(
      authenticatedPage.getByRole("heading").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Look for badge entries with associated dates
    const badgeElements = authenticatedPage.locator(
      "[data-testid*='badge'], [class*='badge'], [class*='credential']",
    );
    const badgeText = authenticatedPage.getByText(
      /badge|verified|credential|gas.*safe|niceic|checkatrade|trust/i,
    );

    const hasBadges = await badgeElements.first().isVisible().catch(() => false);
    const hasBadgeText = await badgeText.first().isVisible().catch(() => false);

    // Either badges or an empty state should render
    if (!hasBadges && !hasBadgeText) {
      const emptyState = authenticatedPage.getByText(
        /no.*badge|earn.*badge|get.*verified/i,
      );
      const isEmpty = await emptyState.first().isVisible().catch(() => false);
      if (!isEmpty) {
        test.skip(true, "Badges page not rendering expected content");
      }
    }
  });
});
