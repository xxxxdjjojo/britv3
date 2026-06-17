import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  aggregateCrimeByCategory,
  humaniseCategory,
  getAreaCrime,
} from "./crime-service";

describe("humaniseCategory", () => {
  it("turns a police.uk slug into a readable label", () => {
    expect(humaniseCategory("anti-social-behaviour")).toBe(
      "Anti social behaviour",
    );
    expect(humaniseCategory("burglary")).toBe("Burglary");
  });
});

describe("aggregateCrimeByCategory", () => {
  it("returns an empty array for non-array / empty input", () => {
    expect(aggregateCrimeByCategory(null)).toEqual([]);
    expect(aggregateCrimeByCategory([])).toEqual([]);
    expect(aggregateCrimeByCategory("nope")).toEqual([]);
  });

  it("counts per category and sorts by descending count", () => {
    const raw = [
      { category: "burglary" },
      { category: "violent-crime" },
      { category: "violent-crime" },
      { category: "violent-crime" },
      { category: "burglary" },
    ];
    expect(aggregateCrimeByCategory(raw)).toEqual([
      { category: "Violent crime", count: 3 },
      { category: "Burglary", count: 2 },
    ]);
  });

  it("ignores records with missing or non-string categories", () => {
    const raw = [{ category: "burglary" }, { category: 5 }, {}, { foo: "bar" }];
    expect(aggregateCrimeByCategory(raw)).toEqual([
      { category: "Burglary", count: 1 },
    ]);
  });
});

describe("getAreaCrime", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetchSequence(responses: Array<{ ok: boolean; json: unknown }>) {
    const fetchMock = vi.fn();
    for (const r of responses) {
      fetchMock.mockResolvedValueOnce({
        ok: r.ok,
        json: async () => r.json,
      });
    }
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("returns aggregated stats for the latest month", async () => {
    stubFetchSequence([
      { ok: true, json: { date: "2024-06-01" } },
      {
        ok: true,
        json: [
          { category: "burglary" },
          { category: "burglary" },
          { category: "drugs" },
        ],
      },
    ]);

    const result = await getAreaCrime(51.5074, -0.1278);
    expect(result).not.toBeNull();
    expect(result?.month).toBe("2024-06");
    expect(result?.stats[0]).toEqual({ category: "Burglary", count: 2 });
    expect(result?.boroughAvg).toBeNull();
  });

  it("returns null when the area has no recorded crime", async () => {
    stubFetchSequence([
      { ok: true, json: { date: "2024-06-01" } },
      { ok: true, json: [] },
    ]);
    expect(await getAreaCrime(51.5074, -0.1278)).toBeNull();
  });

  it("returns null when the last-updated lookup fails", async () => {
    stubFetchSequence([{ ok: false, json: null }]);
    expect(await getAreaCrime(51.5074, -0.1278)).toBeNull();
  });
});
