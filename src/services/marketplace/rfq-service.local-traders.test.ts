import { describe, it, expect, vi, beforeEach } from "vitest";

import { createRfq } from "./rfq-service";
import { rfqCreateSchema } from "@/lib/validators/marketplace-schemas";

vi.mock("@/services/geocoding/postcodes-io", () => ({
  geocodePostcode: vi.fn().mockResolvedValue({
    postcode: "W5 2AB",
    latitude: 51.51,
    longitude: -0.3,
    region: "London",
  }),
}));

vi.mock("@/inngest/client", () => ({
  inngest: { send: vi.fn().mockResolvedValue({ ids: ["e1"] }) },
}));

const PROVIDER_ID = "11111111-1111-4111-8111-111111111111";
const LISTING_ID = "22222222-2222-4222-8222-222222222222";

const baseInput = {
  service_category: "builder" as const,
  title: "Builder help for this property",
  description:
    "I'm interested in this property and may need renovation or inspection work. Please share availability and a quote.",
  property_postcode: "W5 2AB",
  property_address: "1 High Street",
  urgency_level: "normal" as const,
  source: "property_detail_local_traders",
  target_provider_id: PROVIDER_ID,
  listing_id: LISTING_ID,
};

describe("rfqCreateSchema — local traders attribution", () => {
  it("accepts the source / provider / listing attribution fields", () => {
    const result = rfqCreateSchema.safeParse(baseInput);
    expect(result.success).toBe(true);
  });

  it("rejects a malformed provider id", () => {
    const result = rfqCreateSchema.safeParse({ ...baseInput, target_provider_id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("remains valid without any attribution fields (broadcast RFQ unchanged)", () => {
    const { source, target_provider_id, listing_id, ...rest } = baseInput;
    expect(rfqCreateSchema.safeParse(rest).success).toBe(true);
  });
});

describe("createRfq — persists attribution", () => {
  beforeEach(() => vi.clearAllMocks());

  it("writes source, target_provider_id and listing_id to service_requests", async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: () => ({ single: () => Promise.resolve({ data: { id: "rfq-1" }, error: null }) }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ insert: insertMock }) } as never;

    await createRfq(supabase, "user-1", baseInput);

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "property_detail_local_traders",
        target_provider_id: PROVIDER_ID,
        listing_id: LISTING_ID,
      }),
    );
  });
});
