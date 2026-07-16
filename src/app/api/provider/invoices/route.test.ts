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
  data: {
    user: {
      id: string;
      email_confirmed_at: string | null;
      app_metadata?: { role?: string };
    } | null;
  };
};

function makeSupabase(user: GetUserResult["data"]["user"]) {
  const row = (data: unknown) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  });
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return row({
          active_role: "service_provider",
          provider_verification_status: "verified",
        });
      }
      if (table === "subscriptions") return row({ status: "active" });
      if (table === "stripe_connect_accounts") {
        return row({ charges_enabled: true, payouts_enabled: true });
      }
      return row(null);
    }),
    rpc: vi.fn().mockResolvedValue({
      data: [{
        peer_count: 3,
        client_count: 3,
        grandfathered: false,
        gate_complete: true,
      }],
      error: null,
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
      makeSupabase({
        id: "user-1",
        email_confirmed_at: "2026-01-01T00:00:00Z",
        app_metadata: { role: "service_provider" },
      }),
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
