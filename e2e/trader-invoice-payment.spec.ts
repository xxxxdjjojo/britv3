// e2e/trader-invoice-payment.spec.ts
//
// Trader quote → invoice → payment happy path.
//
// The public pay page is covered with a runnable assertion (no auth/DB/Stripe
// needed). The full money happy path is documented as a skipped test because it
// requires Stripe test mode + a seeded approved/subscribed/payout-connected
// trader; enable it in an environment that provides those (STRIPE_* test keys,
// a `sent` invoice, and a valid pay-token).

import { test, expect } from "@playwright/test";

test.describe("customer invoice payment page (/pay/[token])", () => {
  test("shows a not-found state for an invalid pay-token", async ({ page }) => {
    await page.goto("/pay/not-a-real-token", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByText(/payment link not found/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  // Full end-to-end money flow. Unskip in an environment with Stripe test mode
  // and a seeded approved trader (see deliverables "How to run locally").
  test.skip("approved trader → quote → invoice → customer pays → dashboard shows paid", async ({
    page,
  }) => {
    // 1. Customer creates an RFQ (/post-a-job).
    // 2. Approved + subscribed + payout-connected trader sends a quote
    //    (POST /api/provider/quotes/[id]/send — gated by checkProviderCanTransact).
    // 3. Customer accepts the quote.
    // 4. Trader issues an invoice (POST /api/provider/invoices) and sends it
    //    (POST /api/provider/invoices/[id]/send) — customer receives the pay link.
    // 5. Customer opens /pay/[token], pays with Stripe test card 4242 4242 4242 4242.
    // 6. Stripe `payment_intent.succeeded` webhook marks the invoice paid (0% fee).
    // 7. Trader dashboard /dashboard/provider/payments shows the paid invoice and earnings.
    expect(true).toBe(true);
  });
});
