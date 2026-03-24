import { vi } from "vitest";

export function createMockStripe() {
  return {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: "cs_test_123",
          client_secret: "cs_secret_123",
          url: "https://checkout.stripe.com/test",
        }),
        retrieve: vi.fn().mockResolvedValue({
          id: "cs_test_123",
          status: "complete",
          customer_email: "test@example.com",
          amount_total: 2999,
        }),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: "https://billing.stripe.com/test" }),
      },
    },
    invoices: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      retrieve: vi.fn(),
      createPreview: vi.fn(),
    },
    paymentMethods: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      detach: vi.fn().mockResolvedValue({ id: "pm_detached" }),
    },
    customers: {
      retrieve: vi.fn().mockResolvedValue({
        id: "cus_test",
        invoice_settings: { default_payment_method: null },
      }),
      update: vi.fn().mockResolvedValue({ id: "cus_test" }),
    },
    subscriptions: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      update: vi.fn(),
      cancel: vi.fn(),
    },
    charges: {
      retrieve: vi.fn(),
    },
    refunds: {
      create: vi.fn().mockResolvedValue({ id: "re_test_123", status: "succeeded" }),
    },
  };
}
