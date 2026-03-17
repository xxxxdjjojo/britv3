// Wave 0 stub — implemented in Plan 13-10
// Covers: SELL-09 (Land Registry API response parses to LandRegistryComparable[])
import { describe, it } from "vitest";

describe("Land Registry Parser", () => {
  it.todo("parseLandRegistryResponse converts JSON-LD items to LandRegistryComparable[]");
  it.todo("parseLandRegistryResponse returns empty array when result.items is missing");
  it.todo("price field is stored in pence (price * 100)");
  it.todo("sale_date is formatted as ISO date string YYYY-MM-DD");
});
