import { describe, it, expect, vi } from "vitest";
import { POST } from "../sole-trader/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  }),
}));

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/verify/sole-trader", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/verify/sole-trader", () => {
  it("validates UTR format and saves", async () => {
    const res = await POST(makeRequest({
      utr_number: "1234567890",
      trading_name: "John Smith Properties",
      hmrc_aml_reference: "XXML00000123456",
    }));
    expect(res.status).toBe(200);
  });

  it("rejects invalid UTR", async () => {
    const res = await POST(makeRequest({
      utr_number: "12345",
      trading_name: "Test",
    }));
    expect(res.status).toBe(400);
  });

  it("requires trading name", async () => {
    const res = await POST(makeRequest({
      utr_number: "1234567890",
      trading_name: "",
    }));
    expect(res.status).toBe(400);
  });
});
