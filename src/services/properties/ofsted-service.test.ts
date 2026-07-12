import { describe, it, expect, vi, beforeEach } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: rpcMock }),
}));

import { toOfstedSchool, fetchNearbySchools } from "./ofsted-service";

// ---------------------------------------------------------------------------
// toOfstedSchool
// ---------------------------------------------------------------------------

describe("toOfstedSchool", () => {
  it("converts metres to miles, rounded to one decimal", () => {
    const result = toOfstedSchool({
      name: "Elm Primary",
      phase: "Primary",
      establishment_type: null,
      ofsted_rating: "Good",
      street: "1 High St",
      locality: null,
      town: "London",
      postcode: "SW1A 1AA",
      urn: "123456",
      distance_meters: 1609.344,
    });
    expect(result?.distance_miles).toBe(1);
  });

  it("rounds to one decimal correctly", () => {
    const result = toOfstedSchool({
      name: "Oak School",
      phase: "Secondary",
      establishment_type: null,
      ofsted_rating: null,
      street: null,
      locality: null,
      town: null,
      postcode: null,
      urn: "654321",
      distance_meters: 804.672,
    });
    expect(result?.distance_miles).toBe(0.5);
  });

  it("uses phase as type when available", () => {
    const result = toOfstedSchool({
      name: "Oak Secondary",
      phase: "Secondary",
      establishment_type: "Community school",
      ofsted_rating: null,
      street: null,
      locality: null,
      town: null,
      postcode: null,
      urn: "111",
      distance_meters: 0,
    });
    expect(result?.type).toBe("Secondary");
  });

  it("falls back to establishment_type when phase is null", () => {
    const result = toOfstedSchool({
      name: "Special College",
      phase: null,
      establishment_type: "Special school",
      ofsted_rating: null,
      street: null,
      locality: null,
      town: null,
      postcode: null,
      urn: "222",
      distance_meters: 0,
    });
    expect(result?.type).toBe("Special school");
  });

  it("falls back to 'School' when both phase and establishment_type are null", () => {
    const result = toOfstedSchool({
      name: "Unknown Type",
      phase: null,
      establishment_type: null,
      ofsted_rating: null,
      street: null,
      locality: null,
      town: null,
      postcode: null,
      urn: "333",
      distance_meters: 0,
    });
    expect(result?.type).toBe("School");
  });

  it("passes through a valid rating", () => {
    for (const rating of [
      "Outstanding",
      "Good",
      "Requires improvement",
      "Inadequate",
    ] as const) {
      const result = toOfstedSchool({
        name: "A School",
        phase: "Primary",
        establishment_type: null,
        ofsted_rating: rating,
        street: null,
        locality: null,
        town: null,
        postcode: null,
        urn: "444",
        distance_meters: 0,
      });
      expect(result?.rating).toBe(rating);
    }
  });

  it("returns null rating for an unknown/invalid rating string", () => {
    const result = toOfstedSchool({
      name: "A School",
      phase: "Primary",
      establishment_type: null,
      ofsted_rating: "Not yet inspected",
      street: null,
      locality: null,
      town: null,
      postcode: null,
      urn: "555",
      distance_meters: 0,
    });
    expect(result?.rating).toBeNull();
  });

  it("returns null rating when ofsted_rating is null", () => {
    const result = toOfstedSchool({
      name: "A School",
      phase: "Primary",
      establishment_type: null,
      ofsted_rating: null,
      street: null,
      locality: null,
      town: null,
      postcode: null,
      urn: "666",
      distance_meters: 0,
    });
    expect(result?.rating).toBeNull();
  });

  it("returns null when name is empty", () => {
    expect(
      toOfstedSchool({
        name: "",
        phase: "Primary",
        establishment_type: null,
        ofsted_rating: "Good",
        street: null,
        locality: null,
        town: null,
        postcode: null,
        urn: "777",
        distance_meters: 0,
      }),
    ).toBeNull();
  });

  it("returns null when urn is empty", () => {
    expect(
      toOfstedSchool({
        name: "A School",
        phase: "Primary",
        establishment_type: null,
        ofsted_rating: "Good",
        street: null,
        locality: null,
        town: null,
        postcode: null,
        urn: "",
        distance_meters: 0,
      }),
    ).toBeNull();
  });

  it("builds address from street, town, and postcode", () => {
    const result = toOfstedSchool({
      name: "Cedar Academy",
      phase: "Primary",
      establishment_type: null,
      ofsted_rating: null,
      street: "10 School Lane",
      locality: null,
      town: "Manchester",
      postcode: "M1 1AB",
      urn: "888",
      distance_meters: 0,
    });
    expect(result?.address).toBe("10 School Lane, Manchester, M1 1AB");
  });

  it("omits falsy parts from address", () => {
    const result = toOfstedSchool({
      name: "Birch School",
      phase: null,
      establishment_type: null,
      ofsted_rating: null,
      street: null,
      locality: null,
      town: "Bristol",
      postcode: null,
      urn: "999",
      distance_meters: 0,
    });
    expect(result?.address).toBe("Bristol");
  });

  it("returns empty string address when all address fields are absent", () => {
    const result = toOfstedSchool({
      name: "No Address School",
      phase: "Primary",
      establishment_type: null,
      ofsted_rating: null,
      street: null,
      locality: null,
      town: null,
      postcode: null,
      urn: "101010",
      distance_meters: 0,
    });
    expect(result?.address).toBe("");
  });
});

// ---------------------------------------------------------------------------
// fetchNearbySchools
// ---------------------------------------------------------------------------

describe("fetchNearbySchools", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("maps and returns rows from the RPC", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          name: "St Mary's Primary",
          phase: "Primary",
          establishment_type: null,
          ofsted_rating: "Outstanding",
          street: "1 Church Rd",
          locality: null,
          town: "London",
          postcode: "E1 1AA",
          urn: "100001",
          distance_meters: 321.8688,
        },
        {
          name: "Greenfield Secondary",
          phase: "Secondary",
          establishment_type: null,
          ofsted_rating: "Good",
          street: null,
          locality: null,
          town: "London",
          postcode: "E1 2BB",
          urn: "100002",
          distance_meters: 804.672,
        },
      ],
      error: null,
    });

    const result = await fetchNearbySchools(51.513, -0.089);
    expect(result).toEqual([
      {
        name: "St Mary's Primary",
        type: "Primary",
        rating: "Outstanding",
        distance_miles: 0.2,
        address: "1 Church Rd, London, E1 1AA",
        ofsted_id: "100001",
      },
      {
        name: "Greenfield Secondary",
        type: "Secondary",
        rating: "Good",
        distance_miles: 0.5,
        address: "London, E1 2BB",
        ofsted_id: "100002",
      },
    ]);
  });

  it("returns null when the RPC returns no rows", async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    expect(await fetchNearbySchools(51.5, -0.1)).toBeNull();
  });

  it("returns null when the RPC errors", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });
    expect(await fetchNearbySchools(51.5, -0.1)).toBeNull();
  });
});
