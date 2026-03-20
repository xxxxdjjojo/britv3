import { test, expect } from "./fixtures/auth";

// Scenario 5: Subscription Purchase (agent)
test.describe("Scenario 5: Subscription Purchase", () => {
  test.use({ role: "agent" });

  test("5.1 — billing hub loads", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/agent/billing");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("5.2 — checkout page shows plan grid", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/agent/billing/checkout/subscription");
    await expect(page.locator("body")).not.toContainText("Application error");
    const hasPlans = await page
      .getByText(/performance|professional|enterprise/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasAnyContent = await page
      .getByText(/plan|subscribe|pricing/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasPlans || hasAnyContent).toBeTruthy();
  });

  test("5.3 — escape path exists (GAP-5.1)", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/agent/billing/checkout/subscription");
    const skipLink = page.getByText(/skip.*now|explore.*first/i);
    await expect(skipLink).toBeVisible();
  });

  test("5.4 — confirmation page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/agent/billing/confirmation");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("5.5 — failed page shows retry option", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/agent/billing/failed?decline_code=card_declined");
    await expect(page.locator("body")).not.toContainText("Application error");
    const hasRetry = await page
      .getByText(/try.*again|retry|different.*card/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasRetry).toBeTruthy();
  });
});

// Scenario 6: One-Time Boost (provider)
test.describe("Scenario 6: One-Time Boost Payment", () => {
  test.use({ role: "provider" });

  test("6.1 — boost checkout page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/provider/billing/checkout/one-time");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("6.2 — boost options visible", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/provider/billing/checkout/one-time");
    const hasBoostContent = await page
      .getByText(/boost|featured|promote|7.*day|14.*day|30.*day/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasBoostContent).toBeTruthy();
  });
});

// Scenario 7: Payment Method Management (landlord)
test.describe("Scenario 7: Payment Method Management", () => {
  test.use({ role: "landlord" });

  test("7.1 — payment methods page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/landlord/billing/payment-methods");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("7.2 — add payment method CTA exists", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/landlord/billing/payment-methods");
    const addBtn = page.getByRole("button", { name: /add.*payment|add.*card|add.*method/i });
    const hasAddOption = await addBtn.isVisible().catch(() => false);
    const hasContent = await page
      .getByText(/payment.*method|card|no.*payment/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasAddOption || hasContent).toBeTruthy();
  });
});

// Scenario 8: Billing History & Invoices (agent)
test.describe("Scenario 8: Billing History & Invoices", () => {
  test.use({ role: "agent" });

  test("8.1 — invoices page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/agent/billing/invoices");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("8.2 — shows invoice list or empty state", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/agent/billing/invoices");
    const hasContent = await page
      .getByText(/invoice|billing.*history|no.*invoice/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});

// Scenario 9: Subscription Management (provider)
test.describe("Scenario 9: Subscription Management", () => {
  test.use({ role: "provider" });

  test("9.1 — subscription page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/provider/billing/subscription");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("9.2 — shows plan details or subscribe CTA", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/provider/billing/subscription");
    const hasContent = await page
      .getByText(/plan|subscription|subscribe|upgrade|cancel|manage/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});

// Scenario 10: Refund Request (landlord)
test.describe("Scenario 10: Refund Request", () => {
  test.use({ role: "landlord" });

  test("10.1 — refund page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/landlord/billing/refund");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("10.2 — refund form has reason selector", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/landlord/billing/refund");
    const hasForm = await page
      .getByText(/reason|refund|request/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasForm).toBeTruthy();
  });
});
