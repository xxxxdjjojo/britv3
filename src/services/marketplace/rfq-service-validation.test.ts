/**
 * RFQ create — validation-failure paths.
 *
 * Complements rfq-service.test.ts (which covers the insert happy path) by
 * asserting that createRfq rejects invalid input at the Zod boundary *before*
 * touching the database or dispatching the Inngest event. These are the inputs
 * the /api/rfq/create route returns 400 for.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRfq } from "./rfq-service";

vi.mock("@/services/geocoding/postcodes-io", () => ({
  geocodePostcode: vi.fn().mockResolvedValue({
    postcode: "SW1A 1AA",
    latitude: 51.5014,
    longitude: -0.1419,
  }),
}));

const inngestSend = vi.fn().mockResolvedValue({ ids: ["evt"] });
vi.mock("@/inngest/client", () => ({
  inngest: { send: (...args: unknown[]) => inngestSend(...args) },
}));

/** Supabase mock whose insert resolves successfully — proves we never reach it. */
function createMockSupabase() {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: "rfq-1" }, error: null }),
    }),
  });
  return {
    supabase: { from: vi.fn().mockReturnValue({ insert }) } as unknown,
    insert,
  };
}

const validBase = {
  service_category: "plumber" as const,
  title: "Fix leaking pipe in bathroom urgently",
  description:
    "There is a leaking pipe under the bathroom sink that needs fixing as soon as possible. Water is dripping constantly.",
  property_postcode: "SW1A 1AA",
  urgency_level: "normal" as const,
};

describe("createRfq validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a title that is too short without inserting or notifying", async () => {
    const { supabase, insert } = createMockSupabase();

    await expect(
      createRfq(supabase as never, "user-1", {
        ...validBase,
        title: "too short",
      } as never),
    ).rejects.toThrow();

    expect(insert).not.toHaveBeenCalled();
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("rejects an invalid UK postcode", async () => {
    const { supabase, insert } = createMockSupabase();

    await expect(
      createRfq(supabase as never, "user-1", {
        ...validBase,
        property_postcode: "NOT A POSTCODE",
      } as never),
    ).rejects.toThrow();

    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects when budget_max is below budget_min", async () => {
    const { supabase, insert } = createMockSupabase();

    await expect(
      createRfq(supabase as never, "user-1", {
        ...validBase,
        budget_min: 500,
        budget_max: 100,
      } as never),
    ).rejects.toThrow();

    expect(insert).not.toHaveBeenCalled();
  });

  it("accepts valid input and dispatches the matching event", async () => {
    const { supabase, insert } = createMockSupabase();

    const result = await createRfq(
      supabase as never,
      "user-1",
      validBase as never,
    );

    expect(insert).toHaveBeenCalledTimes(1);
    expect(inngestSend).toHaveBeenCalledWith({
      name: "marketplace/rfq.created",
      data: { rfqId: "rfq-1" },
    });
    expect(result).toMatchObject({ id: "rfq-1" });
  });
});
