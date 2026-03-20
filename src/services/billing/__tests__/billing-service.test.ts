/**
 * Tests for billing-service.ts
 *
 * Functions under contract:
 *  - getSubscription(supabase, userId) — reads from Supabase cache (no Stripe call)
 *  - createSubscriptionCheckout(userId, priceId, returnUrl, role) — creates embedded checkout session
 *  - createOneTimeCheckout(userId, priceId, returnUrl, metadata?) — creates one-time payment session
 *  - createPortalSession(supabase, userId, returnUrl) — creates Stripe billing portal session
 *  - getInvoices(supabase, userId, limit?) — lists Stripe invoices for user's customer
 *  - refreshInvoicePdf(invoiceId) — retrieves fresh PDF URL from Stripe
 *  - getPaymentMethods(supabase, userId) — lists saved cards with default flag
 *  - detachPaymentMethod(pmId) — removes a payment method from Stripe
 *  - setDefaultPaymentMethod(supabase, userId, pmId) — updates customer's default PM
 *  - getUpcomingInvoice(supabase, userId, newPriceId) — proration preview for plan upgrade
 *  - getCheckoutSession(sessionId) — retrieves checkout session for confirmation page
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mock Stripe — must come before importing the service
// ---------------------------------------------------------------------------

import { createMockStripe } from "@/__tests__/mocks/stripe";

const mockStripeInstance = createMockStripe();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => mockStripeInstance,
}));

// ---------------------------------------------------------------------------
// Import service under test (after mocks)
// ---------------------------------------------------------------------------

import {
  getSubscription,
  createSubscriptionCheckout,
  createOneTimeCheckout,
  createPortalSession,
  getInvoices,
  refreshInvoicePdf,
  getPaymentMethods,
  detachPaymentMethod,
  setDefaultPaymentMethod,
  getUpcomingInvoice,
  getCheckoutSession,
} from "@/services/billing/billing-service";

import { createMockSupabaseClient } from "@/__tests__/mocks/supabase";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const USER_ID = "user-uuid-123";
const CUSTOMER_ID = "cus_test_123";
const PRICE_ID = "price_test_abc";
const RETURN_URL = "https://britestate.co.uk/billing/success";

/**
 * Returns a Supabase mock client where `profiles` returns a stripe_customer_id
 * and any other table (e.g. `subscriptions`) returns null by default.
 */
function makeSupabaseWithCustomer(customerId: string | null = CUSTOMER_ID) {
  const client = createMockSupabaseClient();

  // Override `from` to differentiate table calls
  client.from = vi.fn().mockImplementation((table: string) => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: table === "profiles" ? { stripe_customer_id: customerId } : null,
        error: null,
      }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    return builder;
  });

  return client;
}

/**
 * Returns a Supabase mock client with a specific result for `maybeSingle` on the
 * `subscriptions` table, and the standard customer profile.
 */
function makeSupabaseWithSubscription(subscriptionRow: Record<string, unknown> | null) {
  const client = createMockSupabaseClient();

  client.from = vi.fn().mockImplementation((table: string) => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: table === "profiles" ? { stripe_customer_id: CUSTOMER_ID } : null,
        error: null,
      }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: subscriptionRow,
        error: null,
      }),
    };
    return builder;
  });

  return client;
}

// ---------------------------------------------------------------------------
// Reset mocks before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Restore default mock implementations after clearAllMocks
  mockStripeInstance.checkout.sessions.create.mockResolvedValue({
    id: "cs_test_123",
    client_secret: "cs_secret_123",
    url: "https://checkout.stripe.com/test",
  });

  mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
    id: "cs_test_123",
    status: "complete",
    customer_details: { email: "buyer@example.com" },
    amount_total: 2999,
  });

  mockStripeInstance.billingPortal.sessions.create.mockResolvedValue({
    url: "https://billing.stripe.com/test",
  });

  mockStripeInstance.invoices.list.mockResolvedValue({ data: [] });
  mockStripeInstance.invoices.retrieve.mockResolvedValue({ invoice_pdf: null });
  mockStripeInstance.invoices.createPreview.mockResolvedValue({
    amount_due: 0,
    currency: "gbp",
  });

  mockStripeInstance.paymentMethods.list.mockResolvedValue({ data: [] });
  mockStripeInstance.paymentMethods.detach.mockResolvedValue({ id: "pm_detached" });

  mockStripeInstance.customers.retrieve.mockResolvedValue({
    id: CUSTOMER_ID,
    deleted: false,
    invoice_settings: { default_payment_method: null },
  });
  mockStripeInstance.customers.update.mockResolvedValue({ id: CUSTOMER_ID });

  mockStripeInstance.subscriptions.list.mockResolvedValue({ data: [] });
});

// ===========================================================================
// getSubscription
// ===========================================================================

describe("getSubscription", () => {
  it("returns null when no subscription record exists", async () => {
    const supabase = makeSupabaseWithSubscription(null);
    const result = await getSubscription(supabase as never, USER_ID);
    expect(result).toBeNull();
  });

  it("returns a SubscriptionSummary when a subscription row is found", async () => {
    const row = {
      id: "sub-row-uuid",
      stripe_subscription_id: "sub_stripe_abc",
      status: "active",
      plan_name: "Agent Pro",
      price_amount: 4900,
      currency: "gbp",
      current_period_end: "2026-04-01T00:00:00Z",
      cancel_at_period_end: false,
      role: "agent",
    };

    const supabase = makeSupabaseWithSubscription(row);
    const result = await getSubscription(supabase as never, USER_ID);

    expect(result).not.toBeNull();
    expect(result!.id).toBe("sub-row-uuid");
    expect(result!.stripeSubscriptionId).toBe("sub_stripe_abc");
    expect(result!.status).toBe("active");
    expect(result!.planName).toBe("Agent Pro");
    expect(result!.priceAmount).toBe(4900);
    expect(result!.currency).toBe("gbp");
    expect(result!.currentPeriodEnd).toBe("2026-04-01T00:00:00Z");
    expect(result!.cancelAtPeriodEnd).toBe(false);
    expect(result!.role).toBe("agent");
  });

  it("applies sensible defaults for missing optional fields", async () => {
    const row = {
      id: "sub-row-min",
      stripe_subscription_id: null,
      status: null,
      plan_name: null,
      price_amount: null,
      currency: null,
      current_period_end: null,
      cancel_at_period_end: null,
      role: null,
    };

    const supabase = makeSupabaseWithSubscription(row);
    const result = await getSubscription(supabase as never, USER_ID);

    expect(result).not.toBeNull();
    expect(result!.status).toBe("inactive");
    expect(result!.currency).toBe("gbp");
    expect(result!.cancelAtPeriodEnd).toBe(false);
  });
});

// ===========================================================================
// createSubscriptionCheckout
// ===========================================================================

describe("createSubscriptionCheckout", () => {
  it("creates a Stripe session with mode=subscription and ui_mode=embedded", async () => {
    const result = await createSubscriptionCheckout(USER_ID, PRICE_ID, RETURN_URL, "agent");

    expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledOnce();

    const callArgs = mockStripeInstance.checkout.sessions.create.mock.calls[0][0];
    expect(callArgs.mode).toBe("subscription");
    expect(callArgs.ui_mode).toBe("embedded");
    expect(callArgs.return_url).toBe(RETURN_URL);
    expect(callArgs.client_reference_id).toBe(USER_ID);
    expect(callArgs.metadata).toMatchObject({ user_id: USER_ID, role: "agent" });
    expect(callArgs.line_items).toEqual([{ price: PRICE_ID, quantity: 1 }]);
  });

  it("returns the client_secret from the session", async () => {
    const result = await createSubscriptionCheckout(USER_ID, PRICE_ID, RETURN_URL, "agent");
    expect(result.clientSecret).toBe("cs_secret_123");
  });

  it("throws when Stripe does not return a client_secret", async () => {
    mockStripeInstance.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_no_secret",
      client_secret: null,
    });

    await expect(
      createSubscriptionCheckout(USER_ID, PRICE_ID, RETURN_URL, "agent"),
    ).rejects.toThrow("Stripe did not return a client secret");
  });

  it("includes billing_address_collection and tax_id_collection", async () => {
    await createSubscriptionCheckout(USER_ID, PRICE_ID, RETURN_URL, "landlord");

    const callArgs = mockStripeInstance.checkout.sessions.create.mock.calls[0][0];
    expect(callArgs.billing_address_collection).toBe("auto");
    expect(callArgs.tax_id_collection).toEqual({ enabled: true });
  });
});

// ===========================================================================
// createOneTimeCheckout
// ===========================================================================

describe("createOneTimeCheckout", () => {
  it("creates a Stripe session with mode=payment", async () => {
    await createOneTimeCheckout(USER_ID, PRICE_ID, RETURN_URL);

    const callArgs = mockStripeInstance.checkout.sessions.create.mock.calls[0][0];
    expect(callArgs.mode).toBe("payment");
    expect(callArgs.ui_mode).toBe("embedded");
  });

  it("returns the client_secret from the session", async () => {
    const result = await createOneTimeCheckout(USER_ID, PRICE_ID, RETURN_URL);
    expect(result.clientSecret).toBe("cs_secret_123");
  });

  it("merges extra metadata with user_id", async () => {
    await createOneTimeCheckout(USER_ID, PRICE_ID, RETURN_URL, {
      boost_type: "featured",
      listing_id: "prop-456",
    });

    const callArgs = mockStripeInstance.checkout.sessions.create.mock.calls[0][0];
    expect(callArgs.metadata).toMatchObject({
      user_id: USER_ID,
      boost_type: "featured",
      listing_id: "prop-456",
    });
  });

  it("throws when Stripe does not return a client_secret", async () => {
    mockStripeInstance.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_no_secret",
      client_secret: null,
    });

    await expect(
      createOneTimeCheckout(USER_ID, PRICE_ID, RETURN_URL),
    ).rejects.toThrow("Stripe did not return a client secret");
  });
});

// ===========================================================================
// createPortalSession
// ===========================================================================

describe("createPortalSession", () => {
  it("returns the portal URL for a user with a customer ID", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);
    const url = await createPortalSession(supabase as never, USER_ID, RETURN_URL);

    expect(url).toBe("https://billing.stripe.com/test");
    expect(mockStripeInstance.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: CUSTOMER_ID,
      return_url: RETURN_URL,
    });
  });

  it("throws when the user has no stripe_customer_id", async () => {
    const supabase = makeSupabaseWithCustomer(null);

    await expect(
      createPortalSession(supabase as never, USER_ID, RETURN_URL),
    ).rejects.toThrow("No Stripe customer ID found");
  });
});

// ===========================================================================
// getInvoices
// ===========================================================================

describe("getInvoices", () => {
  it("returns empty array when user has no customer ID", async () => {
    const supabase = makeSupabaseWithCustomer(null);
    const result = await getInvoices(supabase as never, USER_ID);

    expect(result).toEqual([]);
    expect(mockStripeInstance.invoices.list).not.toHaveBeenCalled();
  });

  it("returns empty array when Stripe has no invoices for the customer", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);
    mockStripeInstance.invoices.list.mockResolvedValue({ data: [] });

    const result = await getInvoices(supabase as never, USER_ID);
    expect(result).toEqual([]);
  });

  it("maps Stripe invoice fields to InvoiceSummary", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);

    mockStripeInstance.invoices.list.mockResolvedValue({
      data: [
        {
          id: "in_test_001",
          created: 1700000000,
          amount_paid: 4900,
          currency: "gbp",
          status: "paid",
          invoice_pdf: "https://stripe.com/invoice.pdf",
          description: "Agent Pro - Monthly",
        },
      ],
    });

    const result = await getInvoices(supabase as never, USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "in_test_001",
      created: 1700000000,
      amountPaid: 4900,
      currency: "gbp",
      status: "paid",
      invoicePdf: "https://stripe.com/invoice.pdf",
      description: "Agent Pro - Monthly",
    });
  });

  it("handles null invoice_pdf and description gracefully", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);

    mockStripeInstance.invoices.list.mockResolvedValue({
      data: [
        {
          id: "in_test_002",
          created: 1700000001,
          amount_paid: 0,
          currency: "gbp",
          status: null,
          invoice_pdf: null,
          description: null,
        },
      ],
    });

    const result = await getInvoices(supabase as never, USER_ID);

    expect(result[0].status).toBe("unknown");
    expect(result[0].invoicePdf).toBeNull();
    expect(result[0].description).toBeNull();
  });

  it("calls Stripe with the correct customer ID and limit", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);
    await getInvoices(supabase as never, USER_ID, 10);

    expect(mockStripeInstance.invoices.list).toHaveBeenCalledWith({
      customer: CUSTOMER_ID,
      limit: 10,
    });
  });
});

// ===========================================================================
// refreshInvoicePdf
// ===========================================================================

describe("refreshInvoicePdf", () => {
  it("returns the invoice_pdf URL from Stripe", async () => {
    mockStripeInstance.invoices.retrieve.mockResolvedValue({
      invoice_pdf: "https://stripe.com/fresh-invoice.pdf",
    });

    const result = await refreshInvoicePdf("in_test_001");
    expect(result).toBe("https://stripe.com/fresh-invoice.pdf");
    expect(mockStripeInstance.invoices.retrieve).toHaveBeenCalledWith("in_test_001");
  });

  it("returns null when invoice_pdf is absent", async () => {
    mockStripeInstance.invoices.retrieve.mockResolvedValue({ invoice_pdf: null });

    const result = await refreshInvoicePdf("in_test_002");
    expect(result).toBeNull();
  });
});

// ===========================================================================
// getPaymentMethods
// ===========================================================================

describe("getPaymentMethods", () => {
  it("returns empty array when user has no customer ID", async () => {
    const supabase = makeSupabaseWithCustomer(null);
    const result = await getPaymentMethods(supabase as never, USER_ID);

    expect(result).toEqual([]);
    expect(mockStripeInstance.paymentMethods.list).not.toHaveBeenCalled();
  });

  it("returns empty array when Stripe has no saved payment methods", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);
    mockStripeInstance.paymentMethods.list.mockResolvedValue({ data: [] });

    const result = await getPaymentMethods(supabase as never, USER_ID);
    expect(result).toEqual([]);
  });

  it("maps Stripe payment method fields to PaymentMethodSummary", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);

    mockStripeInstance.paymentMethods.list.mockResolvedValue({
      data: [
        {
          id: "pm_test_visa",
          card: {
            brand: "visa",
            last4: "4242",
            exp_month: 12,
            exp_year: 2027,
          },
        },
      ],
    });

    const result = await getPaymentMethods(supabase as never, USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "pm_test_visa",
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2027,
    });
  });

  it("marks the default payment method correctly", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);

    mockStripeInstance.paymentMethods.list.mockResolvedValue({
      data: [
        { id: "pm_default", card: { brand: "visa", last4: "4242", exp_month: 1, exp_year: 2028 } },
        { id: "pm_other", card: { brand: "mastercard", last4: "1234", exp_month: 6, exp_year: 2027 } },
      ],
    });

    mockStripeInstance.customers.retrieve.mockResolvedValue({
      id: CUSTOMER_ID,
      deleted: false,
      invoice_settings: { default_payment_method: "pm_default" },
    });

    const result = await getPaymentMethods(supabase as never, USER_ID);

    const defaultPm = result.find((pm) => pm.id === "pm_default");
    const otherPm = result.find((pm) => pm.id === "pm_other");

    expect(defaultPm?.isDefault).toBe(true);
    expect(otherPm?.isDefault).toBe(false);
  });

  it("sets isDefault=false for all when customer is deleted", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);

    mockStripeInstance.paymentMethods.list.mockResolvedValue({
      data: [
        { id: "pm_test_1", card: { brand: "visa", last4: "4242", exp_month: 1, exp_year: 2028 } },
      ],
    });

    mockStripeInstance.customers.retrieve.mockResolvedValue({
      id: CUSTOMER_ID,
      deleted: true,
    });

    const result = await getPaymentMethods(supabase as never, USER_ID);
    expect(result[0].isDefault).toBe(false);
  });

  it("handles missing card details gracefully", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);

    mockStripeInstance.paymentMethods.list.mockResolvedValue({
      data: [{ id: "pm_no_card", card: null }],
    });

    const result = await getPaymentMethods(supabase as never, USER_ID);

    expect(result[0].brand).toBe("unknown");
    expect(result[0].last4).toBe("****");
    expect(result[0].expMonth).toBe(0);
    expect(result[0].expYear).toBe(0);
  });
});

// ===========================================================================
// detachPaymentMethod
// ===========================================================================

describe("detachPaymentMethod", () => {
  it("calls stripe.paymentMethods.detach with the given pmId", async () => {
    await detachPaymentMethod("pm_test_to_remove");

    expect(mockStripeInstance.paymentMethods.detach).toHaveBeenCalledOnce();
    expect(mockStripeInstance.paymentMethods.detach).toHaveBeenCalledWith("pm_test_to_remove");
  });

  it("resolves without returning a value", async () => {
    const result = await detachPaymentMethod("pm_test_to_remove");
    expect(result).toBeUndefined();
  });
});

// ===========================================================================
// setDefaultPaymentMethod
// ===========================================================================

describe("setDefaultPaymentMethod", () => {
  it("calls stripe.customers.update with correct invoice_settings", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);
    await setDefaultPaymentMethod(supabase as never, USER_ID, "pm_new_default");

    expect(mockStripeInstance.customers.update).toHaveBeenCalledWith(CUSTOMER_ID, {
      invoice_settings: { default_payment_method: "pm_new_default" },
    });
  });

  it("throws when user has no customer ID", async () => {
    const supabase = makeSupabaseWithCustomer(null);

    await expect(
      setDefaultPaymentMethod(supabase as never, USER_ID, "pm_new_default"),
    ).rejects.toThrow("No customer ID found");
  });
});

// ===========================================================================
// getUpcomingInvoice
// ===========================================================================

describe("getUpcomingInvoice", () => {
  it("returns null when user has no customer ID", async () => {
    const supabase = makeSupabaseWithCustomer(null);
    const result = await getUpcomingInvoice(supabase as never, USER_ID, PRICE_ID);

    expect(result).toBeNull();
    expect(mockStripeInstance.subscriptions.list).not.toHaveBeenCalled();
  });

  it("returns null when user has no active subscription", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);
    mockStripeInstance.subscriptions.list.mockResolvedValue({ data: [] });

    const result = await getUpcomingInvoice(supabase as never, USER_ID, PRICE_ID);
    expect(result).toBeNull();
  });

  it("returns amountDue and currency from the proration preview", async () => {
    const supabase = makeSupabaseWithCustomer(CUSTOMER_ID);

    mockStripeInstance.subscriptions.list.mockResolvedValue({
      data: [
        {
          id: "sub_active_001",
          items: { data: [{ id: "si_item_001" }] },
        },
      ],
    });

    mockStripeInstance.invoices.createPreview.mockResolvedValue({
      amount_due: 2450,
      currency: "gbp",
    });

    const result = await getUpcomingInvoice(supabase as never, USER_ID, "price_upgrade_xyz");

    expect(result).toEqual({ amountDue: 2450, currency: "gbp" });
    expect(mockStripeInstance.invoices.createPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: CUSTOMER_ID,
        subscription: "sub_active_001",
        subscription_details: {
          items: [{ id: "si_item_001", price: "price_upgrade_xyz" }],
        },
      }),
    );
  });
});

// ===========================================================================
// getCheckoutSession
// ===========================================================================

describe("getCheckoutSession", () => {
  it("returns session details for a valid session ID", async () => {
    mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
      id: "cs_test_123",
      status: "complete",
      customer_details: { email: "buyer@example.com" },
      amount_total: 2999,
    });

    const result = await getCheckoutSession("cs_test_123");

    expect(result).toEqual({
      status: "complete",
      customerEmail: "buyer@example.com",
      amountTotal: 2999,
    });

    expect(mockStripeInstance.checkout.sessions.retrieve).toHaveBeenCalledWith("cs_test_123", {
      expand: ["line_items"],
    });
  });

  it("returns null on Stripe error", async () => {
    mockStripeInstance.checkout.sessions.retrieve.mockRejectedValue(
      new Error("No such checkout session"),
    );

    const result = await getCheckoutSession("cs_invalid");
    expect(result).toBeNull();
  });

  it("returns status=unknown when session.status is null", async () => {
    mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
      id: "cs_test_123",
      status: null,
      customer_details: null,
      amount_total: null,
    });

    const result = await getCheckoutSession("cs_test_123");

    expect(result!.status).toBe("unknown");
    expect(result!.customerEmail).toBeNull();
    expect(result!.amountTotal).toBeNull();
  });
});
