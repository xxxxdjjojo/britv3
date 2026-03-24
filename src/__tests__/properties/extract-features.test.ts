import { describe, it, expect } from "vitest";
import { extractFeatureItems } from "@/lib/properties/extract-features";

describe("extractFeatureItems", () => {
  it("extracts items array", () => {
    expect(extractFeatureItems({ items: ["Garden", "Parking"] })).toEqual(["Garden", "Parking"]);
  });

  it("strips angle brackets", () => {
    const result = extractFeatureItems({ items: ["<script>alert(1)</script>"] });
    expect(result[0]).not.toContain("<");
    expect(result[0]).not.toContain(">");
  });

  it("truncates at 100 chars", () => {
    const long = "a".repeat(150);
    expect(extractFeatureItems({ items: [long] })[0]).toHaveLength(100);
  });

  it("returns empty array for empty features", () => {
    expect(extractFeatureItems({})).toEqual([]);
  });

  it("caps at 20 items for items array", () => {
    const items = Array.from({ length: 30 }, (_, i) => `Feature ${i}`);
    expect(extractFeatureItems({ items })).toHaveLength(20);
  });

  it("extracts from object keys when no items array", () => {
    expect(extractFeatureItems({ central_heating: true, double_glazing: "yes" }))
      .toEqual(["Central Heating", "Double Glazing"]);
  });

  it("filters out empty strings", () => {
    expect(extractFeatureItems({ items: ["Garden", "", "  ", "Parking"] }))
      .toEqual(["Garden", "Parking"]);
  });
});
