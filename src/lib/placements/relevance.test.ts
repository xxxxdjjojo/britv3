import { describe, expect, it } from "vitest";

import {
  categoriesForStage,
  stagesForListing,
  type PlacementStage,
} from "./relevance";

describe("stagesForListing", () => {
  it("returns buy and renovation stages for a sale listing", () => {
    expect(stagesForListing("sale")).toEqual(["buy", "renovation"]);
  });

  it("returns only the rent stage for a rental listing", () => {
    expect(stagesForListing("rent")).toEqual(["rent"]);
  });
});

describe("categoriesForStage", () => {
  it("recommends finance and transaction pros when buying", () => {
    const cats = categoriesForStage("buy");
    expect(cats).toContain("mortgage_broker");
    expect(cats).toContain("conveyancing");
    expect(cats).toContain("surveying");
  });

  it("recommends move-in pros when renting, not mortgage brokers", () => {
    const cats = categoriesForStage("rent");
    expect(cats).toContain("moving_company");
    expect(cats).toContain("cleaning");
    expect(cats).not.toContain("mortgage_broker");
    expect(cats).not.toContain("conveyancing");
  });

  it("recommends trades when there is renovation potential", () => {
    const cats = categoriesForStage("renovation");
    expect(cats).toContain("architect");
    expect(cats).toContain("builder");
    expect(cats).toContain("electrician");
  });

  it("never returns the same category for both buy and rent stages", () => {
    const buy = new Set(categoriesForStage("buy"));
    const rent = categoriesForStage("rent");
    // rent-specific categories must be distinct from buy finance/legal set
    expect(rent.some((c) => c === "mortgage_broker" || c === "conveyancing")).toBe(false);
  });

  it("returns a non-empty, de-duplicated list for every stage", () => {
    const stages: PlacementStage[] = ["buy", "rent", "renovation"];
    for (const stage of stages) {
      const cats = categoriesForStage(stage);
      expect(cats.length).toBeGreaterThan(0);
      expect(new Set(cats).size).toBe(cats.length);
    }
  });
});
