/**
 * Contract tests for POST /api/landlord/applications.
 * The route must require a property_id, derive landlord_id from the session,
 * and delegate to the service (which verifies the property belongs to the
 * landlord before inserting with status 'received').
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/services/landlord/tenant-application-service", () => ({
  addApplicationAsLandlord: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { addApplicationAsLandlord } from "@/services/landlord/tenant-application-service";
import { POST } from "@/app/api/landlord/applications/route";

const mockCreateClient = vi.mocked(createClient);
const mockAdd = vi.mocked(addApplicationAsLandlord);

function authedClient(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: userId ? null : new Error("no session"),
      }),
    },
  } as unknown as Awaited<ReturnType<typeof createClient>>;
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/landlord/applications", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const validBody = {
  property_id: "11111111-1111-4111-8111-111111111111",
  applicant_name: "Jane Smith",
  applicant_email: "jane@example.com",
  monthly_income: 3000,
  employment_status: "Employed (full-time)",
};

describe("POST /api/landlord/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue(authedClient("landlord-1"));
    mockAdd.mockResolvedValue({ id: "app-1" } as never);
  });

  it("creates the application and returns 200", async () => {
    const res = await POST(postRequest(validBody));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.id).toBe("app-1");
  });

  it("passes session landlord id + property_id to the service", async () => {
    await POST(postRequest(validBody));
    expect(mockAdd).toHaveBeenCalledWith(
      expect.anything(),
      "landlord-1",
      expect.objectContaining({
        property_id: "11111111-1111-4111-8111-111111111111",
        applicant_name: "Jane Smith",
      }),
    );
  });

  it("returns 400 when property_id is missing (the original silent-failure bug)", async () => {
    const { property_id: _omit, ...noProperty } = validBody;
    const res = await POST(postRequest(noProperty));
    expect(res.status).toBe(400);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid applicant email", async () => {
    const res = await POST(postRequest({ ...validBody, applicant_email: "nope" }));
    expect(res.status).toBe(400);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue(authedClient(null));
    const res = await POST(postRequest(validBody));
    expect(res.status).toBe(401);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("surfaces a 400 with the message when the service rejects (e.g. not the landlord's property)", async () => {
    mockAdd.mockRejectedValue(new Error("Property not found or not owned by you"));
    const res = await POST(postRequest(validBody));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/not found|not owned/i);
  });
});
