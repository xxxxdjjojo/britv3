import { describe, it, expect, vi, beforeEach } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: rpcMock }),
}));

import { toTransportStop, getNearbyTransport } from "./transport-service";

describe("toTransportStop", () => {
  it("converts metres to miles, rounded to one decimal", () => {
    expect(
      toTransportStop({
        name: "Clapham Junction",
        stop_type: "rail",
        distance_meters: 1609.344,
      }),
    ).toEqual({ name: "Clapham Junction", type: "rail", distance_miles: 1 });
  });

  it("maps each station type through unchanged", () => {
    for (const type of ["rail", "tube", "tram", "ferry"] as const) {
      expect(
        toTransportStop({ name: "X", stop_type: type, distance_meters: 0 })?.type,
      ).toBe(type);
    }
  });

  it("returns null for an unknown stop_type or empty name", () => {
    expect(
      toTransportStop({ name: "X", stop_type: "spaceport", distance_meters: 0 }),
    ).toBeNull();
    expect(
      toTransportStop({ name: "", stop_type: "rail", distance_meters: 0 }),
    ).toBeNull();
  });
});

describe("getNearbyTransport", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("returns mapped stops sorted nearest-first from the RPC", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        { name: "Bank", stop_type: "tube", distance_meters: 321.8688 },
        { name: "Cannon Street", stop_type: "rail", distance_meters: 804.672 },
      ],
      error: null,
    });

    const result = await getNearbyTransport(51.513, -0.089);
    expect(result).toEqual([
      { name: "Bank", type: "tube", distance_miles: 0.2 },
      { name: "Cannon Street", type: "rail", distance_miles: 0.5 },
    ]);
  });

  it("returns null when the RPC returns no rows", async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    expect(await getNearbyTransport(51.5, -0.1)).toBeNull();
  });

  it("returns null when the RPC errors", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { code: "PGRST" } });
    expect(await getNearbyTransport(51.5, -0.1)).toBeNull();
  });
});
