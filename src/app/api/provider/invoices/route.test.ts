/**
 * Wiring tests for POST /api/provider/invoices.
 * Verifies the action-level transaction gate is enforced before an invoice is
 * issued, and that auth is required.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

const { createClientMock, generateInvoiceMock, checkProviderCanTransactMock } =
  vi.hoisted(() => ({
    createClientMock: vi.fn(),
    generateInvoiceMock: vi.fn(),
    checkProviderCanTransactMock: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/services/provider/provider-invoice-service", () => ({
  generateInvoice: generateInvoiceMock,
}));
vi.mock("@/services/provider/provider-transaction-gate", () => ({
  checkProviderCanTransact: checkProviderCanTransactMock,
}));

import { POST } from "./route";

type GetUserResult = {
  data: { user: { id: string; email_confirmed_at: string | null } | null };
};

function makeSupabase(user: GetUserResult["data"]["user"]) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  };
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/provider/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  client_id: "client-uuid-1",
  line_items: [
    { name: "Labour", quantity: 1, unit_price_pence: 10000, total_pence: 10000, vat_rate: 0 },
  ],
};

describe("POST /api/provider/invoices — transaction gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockResolvedValue(
      makeSupabase({ id: "user-1", email_confirmed_at: "2026-01-01T00:00:00Z" }),
    );
  });

  it("returns 401 when unauthenticated", async () => {
    createClientMock.mockResolvedValue(makeSupabase(null));
    const res = await POST(makeRequest(validBody) as never);
    expect(res.status).toBe(401);
    expect(generateInvoiceMock).not.toHaveBeenCalled();
  });

  it("returns 403 with the gate reason when the trader cannot transact", async () => {
    checkProviderCanTransactMock.mockResolvedValue({
      allowed: false,
      reason: "subscription_inactive",
      message: "An active subscription is required.",
    });

    const res = await POST(makeRequest(validBody) as never);
    expect(res.status).toBe(403);
    const json = (await res.json()) as { reason: string };
    expect(json.reason).toBe("subscription_inactive");
    expect(generateInvoiceMock).not.toHaveBeenCalled();
  });

  it("issues the invoice when the gate allows", async () => {
    checkProviderCanTransactMock.mockResolvedValue({ allowed: true });
    generateInvoiceMock.mockResolvedValue({ id: "inv-1", invoice_number: "INV-2026-0001" });

    const res = await POST(makeRequest(validBody) as never);
    expect(res.status).toBe(201);
    expect(checkProviderCanTransactMock).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      { emailConfirmed: true },
    );
    expect(generateInvoiceMock).toHaveBeenCalled();
  });
});
