import { describe, it, expect } from "vitest";
import { buildPostcodeCard } from "./postcode-card-service";

/**
 * Contract for the postcode-keyed area card (CHANGE 2). `buildPostcodeCard` is the
 * pure transform over the `market_map_postcode_card` RPC jsonb (prices in pence →
 * pounds), reusing `confidenceFor`. Each band carries the level the fallback ladder
 * actually used, so the UI can label truthfully and never shows £0.
 */
describe("buildPostcodeCard", () => {
  it("returns found:false (all-insufficient) when the postcode has no match", () => {
    const card = buildPostcodeCard({ found: false });
    expect(card.found).toBe(false);
    expect(card.location).toBeNull();
    expect(card.flat.insufficient).toBe(true);
    expect(card.flat.median).toBeNull();
    expect(card.house.insufficient).toBe(true);
  });

  it("maps flat/house pence bands → pounds + confidence + the level used", () => {
    const card = buildPostcodeCard({
      found: true,
      location: {
        postcode_display: "M1 1AE",
        lad_name: "Manchester",
        region: "North West",
        lat: 53.47,
        lng: -2.23,
      },
      flat: {
        median_price_pence: 21000000,
        p10_price_pence: 12500000,
        p90_price_pence: 33275000,
        transaction_count: 42,
        level_used: "postcode_district",
        area_name: "M1",
        latest_transaction_date: "2026-02-27",
      },
      house: {
        median_price_pence: 28680000,
        p10_price_pence: 18000000,
        p90_price_pence: 55000000,
        transaction_count: 8,
        level_used: "local_authority",
        area_name: "Manchester",
        latest_transaction_date: "2026-02-27",
      },
    });

    expect(card.found).toBe(true);
    expect(card.location?.postcodeDisplay).toBe("M1 1AE");
    expect(card.location?.ladName).toBe("Manchester");
    expect(card.location?.region).toBe("North West");
    expect(card.location?.lat).toBeCloseTo(53.47);
    expect(card.location?.lng).toBeCloseTo(-2.23);

    expect(card.flat.median).toBe(210000);
    expect(card.flat.p10).toBe(125000);
    expect(card.flat.p90).toBe(332750);
    expect(card.flat.count).toBe(42);
    expect(card.flat.confidence).toBe("High");
    expect(card.flat.insufficient).toBe(false);
    expect(card.flat.levelUsed).toBe("postcode_district");
    expect(card.flat.areaName).toBe("M1");

    expect(card.house.median).toBe(286800);
    expect(card.house.confidence).toBe("Low"); // count 8 → ≥5 Low
    expect(card.house.levelUsed).toBe("local_authority");
    expect(card.house.areaName).toBe("Manchester");
  });

  it("treats a null band (no level met the min count) as insufficient, never £0", () => {
    const card = buildPostcodeCard({
      found: true,
      location: {
        postcode_display: "ZZ1 1ZZ",
        lad_name: null,
        region: null,
        lat: 0,
        lng: 0,
      },
      flat: null,
      house: null,
    });
    expect(card.flat.insufficient).toBe(true);
    expect(card.flat.median).toBeNull();
    expect(card.flat.levelUsed).toBeNull();
    expect(card.house.insufficient).toBe(true);
    expect(card.house.median).toBeNull();
  });
});
