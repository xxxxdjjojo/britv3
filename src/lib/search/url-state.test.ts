import { describe, it, expect } from "vitest";
import {
  serializeSearchState,
  parseSearchState,
  DEFAULT_SEARCH_STATE,
  type SearchState,
  type Furnishing,
  type TriState,
  type LetAgreed,
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
      bedsMin: "Any",
      bedsMax: "Any",
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
      bedsMin: "3",
      bedsMax: "4",
      sort: "price_asc",
      view: "map",
    });
    const params = new URLSearchParams(qs);
    expect(params.get("minPrice")).toBe("100000");
    expect(params.get("maxPrice")).toBe("500000");
    expect(params.get("minSqft")).toBe("800");
    expect(params.get("maxSqft")).toBe("2000");
    expect(params.get("bedsMin")).toBe("3");
    expect(params.get("bedsMax")).toBe("4");
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
      bedsMin: "2",
      bedsMax: "3",
      soldWithin: "6m",
      sort: "price_desc",
      view: "map",
      page: 2,
      // new lettings fields — non-default so they exercise serialization
      furnishing: "furnished",
      billsIncluded: "yes",
      petsAllowed: "no",
      studentsWelcome: "yes",
      letAgreed: "exclude",
      availableFrom: "2026-03-01",
      minTenancyMonths: "6",
    };
    const restored = parseSearchState(new URLSearchParams(serializeSearchState(original)));
    expect(restored).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// Lettings filter state — serialize + parse round-trips
// ---------------------------------------------------------------------------

describe("lettings filter state — serialize", () => {
  it("omits furnishing when at default 'any'", () => {
    const qs = serializeSearchState({ ...DEFAULT_SEARCH_STATE, furnishing: "any" });
    expect(new URLSearchParams(qs).has("furnishing")).toBe(false);
  });

  it("emits furnishing=furnished when non-default", () => {
    const params = new URLSearchParams(
      serializeSearchState({ ...DEFAULT_SEARCH_STATE, furnishing: "furnished" }),
    );
    expect(params.get("furnishing")).toBe("furnished");
  });

  it("emits furnishing=unfurnished when non-default", () => {
    const params = new URLSearchParams(
      serializeSearchState({ ...DEFAULT_SEARCH_STATE, furnishing: "unfurnished" }),
    );
    expect(params.get("furnishing")).toBe("unfurnished");
  });

  it("emits furnishing=part_furnished when non-default", () => {
    const params = new URLSearchParams(
      serializeSearchState({ ...DEFAULT_SEARCH_STATE, furnishing: "part_furnished" }),
    );
    expect(params.get("furnishing")).toBe("part_furnished");
  });

  it("omits bills when at default 'any'", () => {
    const qs = serializeSearchState({ ...DEFAULT_SEARCH_STATE, billsIncluded: "any" });
    expect(new URLSearchParams(qs).has("bills")).toBe(false);
  });

  it("emits bills=yes when non-default", () => {
    const params = new URLSearchParams(
      serializeSearchState({ ...DEFAULT_SEARCH_STATE, billsIncluded: "yes" }),
    );
    expect(params.get("bills")).toBe("yes");
  });

  it("emits pets=no when non-default", () => {
    const params = new URLSearchParams(
      serializeSearchState({ ...DEFAULT_SEARCH_STATE, petsAllowed: "no" }),
    );
    expect(params.get("pets")).toBe("no");
  });

  it("emits students=yes when non-default", () => {
    const params = new URLSearchParams(
      serializeSearchState({ ...DEFAULT_SEARCH_STATE, studentsWelcome: "yes" }),
    );
    expect(params.get("students")).toBe("yes");
  });

  it("omits letAgreed when at default 'include'", () => {
    const qs = serializeSearchState({ ...DEFAULT_SEARCH_STATE, letAgreed: "include" });
    expect(new URLSearchParams(qs).has("letAgreed")).toBe(false);
  });

  it("emits letAgreed=exclude when non-default", () => {
    const params = new URLSearchParams(
      serializeSearchState({ ...DEFAULT_SEARCH_STATE, letAgreed: "exclude" }),
    );
    expect(params.get("letAgreed")).toBe("exclude");
  });

  it("omits availableFrom when empty", () => {
    const qs = serializeSearchState({ ...DEFAULT_SEARCH_STATE, availableFrom: "" });
    expect(new URLSearchParams(qs).has("availableFrom")).toBe(false);
  });

  it("emits availableFrom when non-empty", () => {
    const params = new URLSearchParams(
      serializeSearchState({ ...DEFAULT_SEARCH_STATE, availableFrom: "2026-03-01" }),
    );
    expect(params.get("availableFrom")).toBe("2026-03-01");
  });

  it("omits minTenancy when empty", () => {
    const qs = serializeSearchState({ ...DEFAULT_SEARCH_STATE, minTenancyMonths: "" });
    expect(new URLSearchParams(qs).has("minTenancy")).toBe(false);
  });

  it("emits minTenancy=6 when non-empty", () => {
    const params = new URLSearchParams(
      serializeSearchState({ ...DEFAULT_SEARCH_STATE, minTenancyMonths: "6" }),
    );
    expect(params.get("minTenancy")).toBe("6");
  });
});

describe("lettings filter state — parse", () => {
  it("defaults furnishing to 'any' when absent", () => {
    expect(parseSearchState(new URLSearchParams()).furnishing).toBe("any");
  });

  it("parses furnishing=furnished", () => {
    expect(parseSearchState(new URLSearchParams("furnishing=furnished")).furnishing).toBe(
      "furnished",
    );
  });

  it("falls back to 'any' for invalid furnishing value", () => {
    expect(parseSearchState(new URLSearchParams("furnishing=banana")).furnishing).toBe("any");
  });

  it("defaults billsIncluded to 'any' when absent", () => {
    expect(parseSearchState(new URLSearchParams()).billsIncluded).toBe("any");
  });

  it("parses bills=yes", () => {
    expect(parseSearchState(new URLSearchParams("bills=yes")).billsIncluded).toBe("yes");
  });

  it("falls back to 'any' for invalid bills value", () => {
    expect(parseSearchState(new URLSearchParams("bills=maybe")).billsIncluded).toBe("any");
  });

  it("defaults petsAllowed to 'any' when absent", () => {
    expect(parseSearchState(new URLSearchParams()).petsAllowed).toBe("any");
  });

  it("parses pets=no", () => {
    expect(parseSearchState(new URLSearchParams("pets=no")).petsAllowed).toBe("no");
  });

  it("falls back to 'any' for invalid pets value", () => {
    expect(parseSearchState(new URLSearchParams("pets=maybe")).petsAllowed).toBe("any");
  });

  it("defaults studentsWelcome to 'any' when absent", () => {
    expect(parseSearchState(new URLSearchParams()).studentsWelcome).toBe("any");
  });

  it("parses students=yes", () => {
    expect(parseSearchState(new URLSearchParams("students=yes")).studentsWelcome).toBe("yes");
  });

  it("falls back to 'any' for invalid students value", () => {
    expect(parseSearchState(new URLSearchParams("students=nope")).studentsWelcome).toBe("any");
  });

  it("defaults letAgreed to 'include' when absent", () => {
    expect(parseSearchState(new URLSearchParams()).letAgreed).toBe("include");
  });

  it("parses letAgreed=exclude", () => {
    expect(parseSearchState(new URLSearchParams("letAgreed=exclude")).letAgreed).toBe("exclude");
  });

  it("falls back to 'include' for any invalid letAgreed value", () => {
    expect(parseSearchState(new URLSearchParams("letAgreed=whatever")).letAgreed).toBe("include");
  });

  it("defaults availableFrom to '' when absent", () => {
    expect(parseSearchState(new URLSearchParams()).availableFrom).toBe("");
  });

  it("parses a valid availableFrom date", () => {
    expect(
      parseSearchState(new URLSearchParams("availableFrom=2026-03-01")).availableFrom,
    ).toBe("2026-03-01");
  });

  it("falls back to '' for an invalid availableFrom value", () => {
    expect(parseSearchState(new URLSearchParams("availableFrom=garbage")).availableFrom).toBe("");
  });

  it("falls back to '' for an out-of-range availableFrom date", () => {
    // 2026-13-99 is structurally invalid (month 13)
    expect(
      parseSearchState(new URLSearchParams("availableFrom=2026-13-99")).availableFrom,
    ).toBe("");
  });

  it("defaults minTenancyMonths to '' when absent", () => {
    expect(parseSearchState(new URLSearchParams()).minTenancyMonths).toBe("");
  });

  it("parses minTenancy=6", () => {
    expect(
      parseSearchState(new URLSearchParams("minTenancy=6")).minTenancyMonths,
    ).toBe("6");
  });

  it("falls back to '' for non-numeric minTenancy", () => {
    expect(parseSearchState(new URLSearchParams("minTenancy=abc")).minTenancyMonths).toBe("");
  });

  it("falls back to '' for minTenancy=0 (not positive)", () => {
    expect(parseSearchState(new URLSearchParams("minTenancy=0")).minTenancyMonths).toBe("");
  });
});

describe("lettings filter state — round-trips", () => {
  it("round-trips furnishing=furnished", () => {
    const s = { ...DEFAULT_SEARCH_STATE, furnishing: "furnished" as Furnishing };
    expect(parseSearchState(new URLSearchParams(serializeSearchState(s))).furnishing).toBe("furnished");
  });

  it("round-trips billsIncluded=yes", () => {
    const s = { ...DEFAULT_SEARCH_STATE, billsIncluded: "yes" as TriState };
    expect(parseSearchState(new URLSearchParams(serializeSearchState(s))).billsIncluded).toBe("yes");
  });

  it("round-trips petsAllowed=no", () => {
    const s = { ...DEFAULT_SEARCH_STATE, petsAllowed: "no" as TriState };
    expect(parseSearchState(new URLSearchParams(serializeSearchState(s))).petsAllowed).toBe("no");
  });

  it("round-trips studentsWelcome=yes", () => {
    const s = { ...DEFAULT_SEARCH_STATE, studentsWelcome: "yes" as TriState };
    expect(parseSearchState(new URLSearchParams(serializeSearchState(s))).studentsWelcome).toBe("yes");
  });

  it("round-trips letAgreed=exclude", () => {
    const s = { ...DEFAULT_SEARCH_STATE, letAgreed: "exclude" as LetAgreed };
    expect(parseSearchState(new URLSearchParams(serializeSearchState(s))).letAgreed).toBe("exclude");
  });

  it("round-trips availableFrom=2026-03-01", () => {
    const s = { ...DEFAULT_SEARCH_STATE, availableFrom: "2026-03-01" };
    expect(parseSearchState(new URLSearchParams(serializeSearchState(s))).availableFrom).toBe("2026-03-01");
  });

  it("round-trips minTenancyMonths=6", () => {
    const s = { ...DEFAULT_SEARCH_STATE, minTenancyMonths: "6" };
    expect(parseSearchState(new URLSearchParams(serializeSearchState(s))).minTenancyMonths).toBe("6");
  });
});
