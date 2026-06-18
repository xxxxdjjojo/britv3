import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingleMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: maybeSingleMock }),
      }),
    }),
  }),
}));

import { getMobilityScores } from "./mobility-service";

describe("getMobilityScores", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
  });

  it("maps a scores row to the widget shape", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        walk_score: 82,
        transit_score: 91,
        bike_score: 60,
        walk_amenity_count: 24,
        transit_stop_count: 5,
        bike_cycleway_count: 7,
      },
      error: null,
    });

    expect(await getMobilityScores("prop-1")).toEqual({
      walk: 82,
      transit: 91,
      bike: 60,
      basis: { walkAmenities: 24, transitStops: 5, bikeCycleways: 7 },
    });
  });

  it("returns null when the property has no row", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    expect(await getMobilityScores("prop-2")).toBeNull();
  });

  it("returns null when all three scores are null", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        walk_score: null,
        transit_score: null,
        bike_score: null,
        walk_amenity_count: null,
        transit_stop_count: null,
        bike_cycleway_count: null,
      },
      error: null,
    });
    expect(await getMobilityScores("prop-3")).toBeNull();
  });

  it("returns null on a lookup error", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: { code: "PGRST" } });
    expect(await getMobilityScores("prop-4")).toBeNull();
  });

  it("returns null for an empty propertyId without querying", async () => {
    expect(await getMobilityScores("")).toBeNull();
    expect(maybeSingleMock).not.toHaveBeenCalled();
  });
});
