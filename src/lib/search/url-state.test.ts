import { describe, it, expect } from "vitest";
import {
  serializeSearchState,
  parseSearchState,
  DEFAULT_SEARCH_STATE,
  type SearchState,
} from "./url-state";

// ---------------------------------------------------------------------------
// serializeSearchState — state → URLSearchParams string
// ---------------------------------------------------------------------------

describe("serializeSearchState", () => {
  it("returns an empty string for the default state", () => {
    expect(serializeSearchState(DEFAULT_SEARCH_STATE)).toBe("");
  });

  it("omits default values (no noise in the URL)", () => {
    const qs = serializeSearchState({
      ...DEFAULT_SEARCH_STATE,
      q: "",
      beds: "Any",
      sort: "most_recent",
      view: "list",
      page: 1,
    });
    expect(qs).toBe("");
  });

  it("serializes the location query under q", () => {
    const qs = serializeSearchState({ ...DEFAULT_SEARCH_STATE, q: "Oxford" });
    expect(qs).toBe("q=Oxford");
  });

  it("serializes property types as a comma-joined list", () => {
    const qs = serializeSearchState({
      ...DEFAULT_SEARCH_STATE,
      propertyType: ["Detached", "Flat"],
    });
    const params = new URLSearchParams(qs);
    expect(params.get("propertyType")).toBe("Detached,Flat");
  });

  it("serializes must-haves as a comma-joined list", () => {
    const qs = serializeSearchState({
      ...DEFAULT_SEARCH_STATE,
      mustHaves: ["Garden", "Parking"],
    });
    const params = new URLSearchParams(qs);
    expect(params.get("mustHaves")).toBe("Garden,Parking");
  });

  it("serializes price, sqft, beds, sort and view", () => {
    const qs = serializeSearchState({
      ...DEFAULT_SEARCH_STATE,
      minPrice: "100000",
      maxPrice: "500000",
      minSqft: "800",
      maxSqft: "2000",
      beds: "3",
      sort: "price_asc",
      view: "map",
    });
    const params = new URLSearchParams(qs);
    expect(params.get("minPrice")).toBe("100000");
    expect(params.get("maxPrice")).toBe("500000");
    expect(params.get("minSqft")).toBe("800");
    expect(params.get("maxSqft")).toBe("2000");
    expect(params.get("beds")).toBe("3");
    expect(params.get("sort")).toBe("price_asc");
    expect(params.get("view")).toBe("map");
  });

  it("serializes page only when greater than 1", () => {
    expect(serializeSearchState({ ...DEFAULT_SEARCH_STATE, page: 1 })).toBe("");
    const params = new URLSearchParams(
      serializeSearchState({ ...DEFAULT_SEARCH_STATE, page: 3 }),
    );
    expect(params.get("page")).toBe("3");
  });
});

// ---------------------------------------------------------------------------
// parseSearchState — URLSearchParams → state
// ---------------------------------------------------------------------------

describe("parseSearchState", () => {
  it("returns the default state for empty params", () => {
    expect(parseSearchState(new URLSearchParams())).toEqual(DEFAULT_SEARCH_STATE);
  });

  it("parses the location query from q", () => {
    const state = parseSearchState(new URLSearchParams("q=Oxford"));
    expect(state.q).toBe("Oxford");
  });

  it("maps the legacy type=buy alias to a sale-friendly state", () => {
    // type=buy is the public nav alias; it must not crash parsing.
    const state = parseSearchState(new URLSearchParams("type=buy"));
    expect(state.listingType).toBe("sale");
  });

  it("maps type=rent to the rent listing type", () => {
    const state = parseSearchState(new URLSearchParams("type=rent"));
    expect(state.listingType).toBe("rent");
  });

  it("parses property types back into an array", () => {
    const state = parseSearchState(
      new URLSearchParams("propertyType=Detached,Flat"),
    );
    expect(state.propertyType).toEqual(["Detached", "Flat"]);
  });

  it("parses must-haves back into an array", () => {
    const state = parseSearchState(
      new URLSearchParams("mustHaves=Garden,Parking"),
    );
    expect(state.mustHaves).toEqual(["Garden", "Parking"]);
  });

  it("parses page as a number, defaulting to 1", () => {
    expect(parseSearchState(new URLSearchParams("page=4")).page).toBe(4);
    expect(parseSearchState(new URLSearchParams()).page).toBe(1);
    // Non-numeric page falls back to 1
    expect(parseSearchState(new URLSearchParams("page=abc")).page).toBe(1);
  });

  it("clamps an invalid view to the default", () => {
    const state = parseSearchState(new URLSearchParams("view=banana"));
    expect(state.view).toBe(DEFAULT_SEARCH_STATE.view);
  });
});

// ---------------------------------------------------------------------------
// Round-trip — restore filter state to/from URLSearchParams
// ---------------------------------------------------------------------------

describe("round-trip", () => {
  it("restores a populated state through serialize → parse", () => {
    const original: SearchState = {
      listingType: "rent",
      q: "Cambridge",
      propertyType: ["Flat", "Terraced"],
      mustHaves: ["Garden"],
      minPrice: "1000",
      maxPrice: "3000",
      minSqft: "500",
      maxSqft: "1500",
      beds: "2",
      sort: "price_desc",
      view: "map",
      page: 2,
    };
    const restored = parseSearchState(new URLSearchParams(serializeSearchState(original)));
    expect(restored).toEqual(original);
  });
});
