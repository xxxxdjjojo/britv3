/**
 * Tests for POST /api/verification/company.
 *
 * Security: this route is the ONLY writer of the authoritative
 * `company_verifications` record. A successful (or service-errored → pending)
 * lookup must persist that record via the service-role admin client so the
 * onboarding trust fields can be enforced server-side by DB trigger. The
 * browser must never be the source of `companies_house_*` truth.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockLimit, mockLookup, mockUpsert, mockAdminFrom } =
  vi.hoisted(() => ({
    mockGetUser: vi.fn(),
    mockLimit: vi.fn(),
    mockLookup: vi.fn(),
    mockUpsert: vi.fn(),
    mockAdminFrom: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: mockAdminFrom })),
}));

vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: vi.fn(() => ({ limit: mockLimit })),
}));

// Mock only the network lookup; keep the real eligibility logic.
vi.mock("@/services/verification/companies-house-service", async (orig) => ({
  ...(await orig<
    typeof import("@/services/verification/companies-house-service")
  >()),
  lookupCompany: mockLookup,
}));

import { POST } from "./route";

const USER_ID = "11111111-1111-1111-1111-111111111111";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/verification/company", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
  mockLimit.mockResolvedValue({ success: true });
  mockAdminFrom.mockReturnValue({ upsert: mockUpsert });
  mockUpsert.mockResolvedValue({ error: null });
});

describe("POST /api/verification/company — authoritative persistence", () => {
  it("persists a verified company_verifications record via the service-role client", async () => {
    mockLookup.mockResolvedValue({
      found: true,
      companyName: "Old & Co Ltd",
      companyStatus: "active",
      incorporationDate: "2010-05-05",
      ageYears: 16,
    });

    const res = await POST(makeRequest({ companyNumber: "09876543" }) as never);
    const json = await res.json();

    expect(json.eligible).toBe(true);
    expect(mockAdminFrom).toHaveBeenCalledWith("company_verifications");
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const [payload] = mockUpsert.mock.calls[0];
    expect(payload).toMatchObject({
      user_id: USER_ID,
      status: "verified",
      company_number: "09876543",
      incorporation_date: "2010-05-05",
    });
  });

  it("persists a pending_review record when the CH service errors (manual review)", async () => {
    mockLookup.mockResolvedValue({ found: false, serviceError: true });

    const res = await POST(makeRequest({ companyNumber: "09876543" }) as never);
    const json = await res.json();

    expect(json.serviceError).toBe(true);
    expect(mockAdminFrom).toHaveBeenCalledWith("company_verifications");
    const [payload] = mockUpsert.mock.calls[0];
    expect(payload).toMatchObject({ user_id: USER_ID, status: "pending_review" });
  });

  it("does NOT persist a record for a confirmed-ineligible company", async () => {
    mockLookup.mockResolvedValue({
      found: true,
      companyStatus: "active",
      incorporationDate: "2025-01-01",
      ageYears: 1,
    });

    const res = await POST(makeRequest({ companyNumber: "09876543" }) as never);
    const json = await res.json();

    expect(json.eligible).toBe(false);
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
