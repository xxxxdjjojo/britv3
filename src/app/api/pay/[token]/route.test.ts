/**
 * Tests for POST /api/pay/[token] — account-free invoice payment endpoint.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

const { createPaymentIntentForTokenMock } = vi.hoisted(() => ({
  createPaymentIntentForTokenMock: vi.fn(),
}));

vi.mock("@/services/provider/invoice-pay-service", () => ({
  createPaymentIntentForToken: createPaymentIntentForTokenMock,
}));

import { POST } from "./route";

function call(token: string) {
  return POST(new Request("http://localhost/api/pay/x", { method: "POST" }) as never, {
    params: Promise.resolve({ token }),
  });
}

describe("POST /api/pay/[token]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the client secret for a valid token", async () => {
    createPaymentIntentForTokenMock.mockResolvedValue({
      clientSecret: "pi_secret_123",
      amountPence: 10000,
      invoiceId: "inv-1",
    });

    const res = await call("good-token");
    expect(res.status).toBe(200);
    const json = (await res.json()) as { clientSecret: string; amountPence: number };
    expect(json.clientSecret).toBe("pi_secret_123");
    expect(json.amountPence).toBe(10000);
  });

  it("returns 404 for an invalid/expired token", async () => {
    createPaymentIntentForTokenMock.mockRejectedValue(
      new Error("Invalid or expired payment link"),
    );
    const res = await call("bad-token");
    expect(res.status).toBe(404);
  });

  it("returns 409 when the invoice is already paid", async () => {
    createPaymentIntentForTokenMock.mockRejectedValue(
      new Error("This invoice has already been paid."),
    );
    const res = await call("paid-token");
    expect(res.status).toBe(409);
  });
});
