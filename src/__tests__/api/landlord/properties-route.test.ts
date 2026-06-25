/**
 * Contract tests for POST /api/landlord/properties.
 * The route must validate input, derive the owner from the session, and
 * delegate to the service layer (which creates a `properties` row + a
 * `listings` row with listing_type='rent' so the property shows in the
 * landlord portfolio).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/services/landlord/property-service", () => ({
  createPortfolioProperty: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createPortfolioProperty } from "@/services/landlord/property-service";
import { POST } from "@/app/api/landlord/properties/route";

const mockCreateClient = vi.mocked(createClient);
const mockCreate = vi.mocked(createPortfolioProperty);

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
  return new NextRequest("http://localhost/api/landlord/properties", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const validBody = {
  address_line_1: "24 Maple Gardens",
  city: "London",
  postcode: "SW1A 1AA",
  property_type: "flat",
  bedrooms: 2,
  bathrooms: 1,
  monthly_rent: 2200,
};

describe("POST /api/landlord/properties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue(authedClient("landlord-1"));
    mockCreate.mockResolvedValue({ propertyId: "prop-1", listingId: "listing-1" });
  });

  it("creates the property and returns 200 with the new ids", async () => {
    const res = await POST(postRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.propertyId).toBe("prop-1");
    expect(json.listingId).toBe("listing-1");
  });

  it("passes the session user id (not a client-supplied id) to the service", async () => {
    await POST(postRequest({ ...validBody, user_id: "attacker" }));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.anything(),
      "landlord-1",
      expect.objectContaining({ property_type: "flat", bedrooms: 2 }),
    );
  });

  it("returns 401 and never touches the service when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue(authedClient(null));
    const res = await POST(postRequest(validBody));
    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid property_type not in the live enum", async () => {
    const res = await POST(postRequest({ ...validBody, property_type: "house" }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when required address fields are missing", async () => {
    const res = await POST(postRequest({ property_type: "flat", bedrooms: 2, bathrooms: 1 }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("surfaces a 400 with the message when the service throws", async () => {
    mockCreate.mockRejectedValue(new Error("insert failed"));
    const res = await POST(postRequest(validBody));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/insert failed/i);
  });
});
