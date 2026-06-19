import { describe, it, expect } from "vitest";
import { indexAt, timeAdjustPrice } from "./hpi";

const SERIES = [
  { month: "2023-01", index: 100 },
  { month: "2023-07", index: 110 },
  { month: "2024-01", index: 120 },
  { month: "2024-07", index: 125 },
];

describe("indexAt", () => {
  it("returns the index for an exact month", () => {
    expect(indexAt(SERIES, "2024-01")).toBe(120);
  });
  it("uses the most recent month at or before the date (step function)", () => {
    expect(indexAt(SERIES, "2024-05")).toBe(120);
  });
  it("clamps to the earliest point for dates before the series", () => {
    expect(indexAt(SERIES, "2020-01")).toBe(100);
  });
  it("clamps to the latest point for dates after the series", () => {
    expect(indexAt(SERIES, "2030-01")).toBe(125);
  });
});

describe("timeAdjustPrice", () => {
  it("leaves price unchanged when the index is flat between dates", () => {
    const flat = [{ month: "2024-01", index: 100 }, { month: "2024-07", index: 100 }];
    expect(timeAdjustPrice(400_000, "2024-02", "2024-06", flat)).toBe(400_000);
  });
  it("adjusts a historic sale upward when the market has risen", () => {
    // sold at index 100 (2023-01), valued at index 125 (2024-07): 400k * 125/100
    expect(timeAdjustPrice(400_000, "2023-01", "2024-07", SERIES)).toBe(500_000);
  });
  it("adjusts downward when the market has fallen since sale", () => {
    expect(timeAdjustPrice(500_000, "2024-07", "2024-01", SERIES)).toBe(480_000);
  });
});
