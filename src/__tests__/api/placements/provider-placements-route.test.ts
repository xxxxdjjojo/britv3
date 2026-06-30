import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlacementPurchaseError } from "@/services/placements/purchase-guard";

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

const createPlacementCheckout = vi.fn();
const listProviderPlacements = vi.fn();
vi.mock("@/services/placements/placement-checkout-service", () => ({
  PlacementPurchaseError,
  createPlacementCheckout: (...args: unknown[]) => createPlacementCheckout(...args),
  listProviderPlacements: (...args: unknown[]) => listProviderPlacements(...args),
}));
vi.mock("@/services/placements/placement-events-service", () => ({
  getProviderPerformance: vi.fn(async () => []),
}));
vi.mock("@/services/placements/placement-product-service", () => ({
  listActiveProducts: vi.fn(async () => []),
}));

import { POST } from "@/app/api/provider/placements/route";

function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/provider/placements", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";

describe("POST /api/provider/placements", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an unauthenticated request", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(postReq({ productId: PRODUCT_ID }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when the trader is not eligible to boost", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "t@x.com" } } });
    createPlacementCheckout.mockRejectedValue(
      new PlacementPurchaseError("not_eligible", "You must have an approved profile and an active subscription."),
    );
    const res = await POST(postReq({ productId: PRODUCT_ID }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("not_eligible");
  });

  it("returns 409 when slots are sold out", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "t@x.com" } } });
    createPlacementCheckout.mockRejectedValue(new PlacementPurchaseError("sold_out", "All slots taken."));
    const res = await POST(postReq({ productId: PRODUCT_ID }));
    expect(res.status).toBe(409);
  });

  it("returns a checkout url for an eligible trader", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "t@x.com" } } });
    createPlacementCheckout.mockResolvedValue({ checkout_url: "https://stripe.test/session" });
    const res = await POST(postReq({ productId: PRODUCT_ID }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.checkout_url).toContain("stripe.test");
  });
});
