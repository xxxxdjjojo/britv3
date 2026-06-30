import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getFeaturedExperts = vi.fn();
vi.mock("@/services/placements/placement-service", () => ({
  getFeaturedExperts: (...args: unknown[]) => getFeaturedExperts(...args),
}));

const recordPlacementEvent = vi.fn();
vi.mock("@/services/placements/placement-events-service", () => ({
  recordPlacementEvent: (...args: unknown[]) => recordPlacementEvent(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } })),
}));

import { GET as featuredGET } from "@/app/api/placements/featured/route";
import { POST as eventsPOST } from "@/app/api/placements/events/route";

describe("GET /api/placements/featured", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps a buy-stage request to the right categories and returns experts", async () => {
    getFeaturedExperts.mockResolvedValue([{ businessName: "Acme Conveyancing" }]);
    const req = new NextRequest("http://localhost/api/placements/featured?postcode=W5%201AB&stage=buy&limit=3");
    const res = await featuredGET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.experts).toHaveLength(1);

    const callArg = getFeaturedExperts.mock.calls[0][1];
    expect(callArg.postcodeDistrict).toBe("W5");
    expect(callArg.categories).toContain("mortgage_broker");
    expect(callArg.categories).toContain("conveyancing");
  });

  it("uses move-in categories for the rent stage, not finance ones", async () => {
    getFeaturedExperts.mockResolvedValue([]);
    const req = new NextRequest("http://localhost/api/placements/featured?town=Ealing&stage=rent");
    await featuredGET(req);
    const callArg = getFeaturedExperts.mock.calls[0][1];
    expect(callArg.categories).toContain("moving_company");
    expect(callArg.categories).not.toContain("mortgage_broker");
  });
});

describe("POST /api/placements/events", () => {
  beforeEach(() => vi.clearAllMocks());

  const PLACEMENT_ID = "22222222-2222-4222-8222-222222222222";

  it("records a valid impression event", async () => {
    recordPlacementEvent.mockResolvedValue(undefined);
    const req = new NextRequest("http://localhost/api/placements/events", {
      method: "POST",
      body: JSON.stringify({ placementId: PLACEMENT_ID, eventType: "impression", zone: "property_sidebar" }),
    });
    const res = await eventsPOST(req);
    expect(res.status).toBe(204);
    expect(recordPlacementEvent).toHaveBeenCalledWith(
      expect.objectContaining({ placementId: PLACEMENT_ID, eventType: "impression", zone: "property_sidebar" }),
    );
  });

  it("rejects an invalid event type without recording anything", async () => {
    const req = new NextRequest("http://localhost/api/placements/events", {
      method: "POST",
      body: JSON.stringify({ placementId: PLACEMENT_ID, eventType: "hack" }),
    });
    const res = await eventsPOST(req);
    expect(res.status).toBe(400);
    expect(recordPlacementEvent).not.toHaveBeenCalled();
  });
});
