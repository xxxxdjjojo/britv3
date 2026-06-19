import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEARCH_STATE,
  parseSearchState,
  serializeSearchState,
} from "@/lib/search/url-state";

describe("url-state: bedrooms min/max and soldWithin", () => {
  it("defaults are omitted from the serialized URL", () => {
    const qs = serializeSearchState(DEFAULT_SEARCH_STATE);
    const params = new URLSearchParams(qs);
    expect(params.get("bedsMin")).toBeNull();
    expect(params.get("bedsMax")).toBeNull();
    expect(params.get("soldWithin")).toBeNull();
  });

  it("non-default bedrooms round-trip through URL", () => {
    const state = { ...DEFAULT_SEARCH_STATE, bedsMin: "2", bedsMax: "4" };
    const qs = serializeSearchState(state);
    const parsed = parseSearchState(new URLSearchParams(qs));
    expect(parsed.bedsMin).toBe("2");
    expect(parsed.bedsMax).toBe("4");
  });

  it("non-default soldWithin round-trips through URL", () => {
    const state = { ...DEFAULT_SEARCH_STATE, soldWithin: "6m" as const };
    const qs = serializeSearchState(state);
    const parsed = parseSearchState(new URLSearchParams(qs));
    expect(parsed.soldWithin).toBe("6m");
  });

  it("invalid bedsMin falls back to 'Any'", () => {
    const parsed = parseSearchState(new URLSearchParams("bedsMin=banana"));
    expect(parsed.bedsMin).toBe("Any");
  });

  it("invalid soldWithin falls back to 'all'", () => {
    const parsed = parseSearchState(new URLSearchParams("soldWithin=ever"));
    expect(parsed.soldWithin).toBe("all");
  });

  it("legacy ?beds= is not migrated", () => {
    const parsed = parseSearchState(new URLSearchParams("beds=3"));
    expect(parsed.bedsMin).toBe("Any");
    expect(parsed.bedsMax).toBe("Any");
    // @ts-expect-error — `beds` removed from SearchState
    expect(parsed.beds).toBeUndefined();
  });
});
