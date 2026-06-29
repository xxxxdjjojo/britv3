import { describe, it, expect } from "vitest";
import { buildPropertyTimeline } from "./property-timeline";

describe("buildPropertyTimeline", () => {
  it("orders built → price events chronologically", () => {
    const events = buildPropertyTimeline({
      yearBuilt: 1998,
      listedDate: "2026-01-15",
      priceHistory: [
        { date: "2018-06-01", price: 480000, event: undefined },
        { date: "2026-01-15", price: 625000, event: "Listed" },
      ],
    });
    expect(events.map((e) => e.label)).toEqual(["Built", "Price change", "Listed"]);
    expect(events[0].year).toBe(1998);
    expect(events[2].detail).toBe("£625,000");
  });

  it("labels a reduction", () => {
    const events = buildPropertyTimeline({
      yearBuilt: null,
      listedDate: null,
      priceHistory: [{ date: "2026-02-01", price: 600000, event: "Reduced" }],
    });
    expect(events[0].label).toBe("Price reduced");
  });

  it("falls back to a Listed event when there is no price history", () => {
    const events = buildPropertyTimeline({
      yearBuilt: 2005,
      listedDate: "2026-03-01",
      priceHistory: [],
    });
    expect(events.map((e) => e.label)).toEqual(["Built", "Listed"]);
  });

  it("emits nothing when there is no data at all", () => {
    expect(
      buildPropertyTimeline({ yearBuilt: null, listedDate: null, priceHistory: [] }),
    ).toEqual([]);
  });
});
