import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../companies-house/route";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.stubEnv("COMPANIES_HOUSE_API_KEY", "test-api-key-123");

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/verify/companies-house", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/verify/companies-house", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns company data for active company", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        company_number: "01234567",
        company_name: "BRITESTATE LTD",
        company_status: "active",
        sic_codes: ["68100"],
        registered_office_address: {
          address_line_1: "10 King Street",
          locality: "London",
          postal_code: "SW1A 1AA",
        },
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        items: [
          { name: "SMITH, John", officer_role: "director", resigned_on: null },
          { name: "JONES, Sarah", officer_role: "director", resigned_on: null },
        ],
      }),
    });

    const res = await POST(makeRequest({ company_number: "01234567" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.company_name).toBe("BRITESTATE LTD");
    expect(data.company_status).toBe("active");
    expect(data.directors).toHaveLength(2);
  });

  it("returns 400 for invalid company number format", async () => {
    const res = await POST(makeRequest({ company_number: "123" }));
    expect(res.status).toBe(400);
  });

  it("returns 422 for dissolved company", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        company_number: "99999999",
        company_name: "OLD COMPANY LTD",
        company_status: "dissolved",
        sic_codes: [],
        registered_office_address: {},
      }),
    });

    const res = await POST(makeRequest({ company_number: "99999999" }));
    expect(res.status).toBe(422);
  });

  it("returns 404 for unknown company", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const res = await POST(makeRequest({ company_number: "00000000" }));
    expect(res.status).toBe(404);
  });
});
