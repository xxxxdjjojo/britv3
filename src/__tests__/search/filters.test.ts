import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import { MOCK_SEARCH_RESULTS } from "../fixtures/search-results";
import { buildSearchQuery } from "@/lib/search/query-builder";
import { searchProperties } from "@/app/(main)/search/actions";
import { getMockSearchProperties } from "@/lib/mock-data/listings";

describe("search filters (basic)", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;
  let mockBuilder: ReturnType<ReturnType<typeof createMockSupabaseClient>["from"]>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    mockBuilder = mockClient.from("search_listings");

    // Make the builder thenable with default results
    (mockBuilder as Record<string, unknown>).then = vi.fn(
      (resolve: (v: unknown) => void) =>
        resolve({ data: MOCK_SEARCH_RESULTS, error: null, count: 5 }),
    );
  });

  it("queries search_listings view when no lat/lng", async () => {
    await buildSearchQuery(mockClient as never, { listing_type: "sale" });
    expect(mockClient.from).toHaveBeenCalledWith("search_listings");
  });

  it("applies listing_type filter with .eq", async () => {
    await buildSearchQuery(mockClient as never, { listing_type: "sale" });
    expect(mockBuilder.eq).toHaveBeenCalledWith("listing_type", "sale");
  });

  it("applies min_price filter with .gte", async () => {
    await buildSearchQuery(mockClient as never, { min_price: 200000 });
    expect(mockBuilder.gte).toHaveBeenCalledWith("price", 200000);
  });

  it("applies max_price filter with .lte", async () => {
    await buildSearchQuery(mockClient as never, { max_price: 500000 });
    expect(mockBuilder.lte).toHaveBeenCalledWith("price", 500000);
  });

  it("applies min_bedrooms filter with .gte", async () => {
    await buildSearchQuery(mockClient as never, { min_bedrooms: 3 });
    expect(mockBuilder.gte).toHaveBeenCalledWith("bedrooms", 3);
  });

  it("applies property_type filter with .in", async () => {
    await buildSearchQuery(mockClient as never, {
      property_type: ["detached", "semi_detached"],
    });
    expect(mockBuilder.in).toHaveBeenCalledWith("property_type", [
      "detached",
      "semi_detached",
    ]);
  });
});

describe("searchProperties (mock path) — bedrooms min/max", () => {
  // Enable the dev/demo search_mock_data flag so searchProperties serves the
  // canonical mock dataset. With both flags off (production default) the action
  // returns [] and never fabricates listings for real users — preserving the
  // data-integrity rule.
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("Any/Any returns all rows", async () => {
    const { data } = await searchProperties({
      bedsMin: "Any",
      bedsMax: "Any",
    });
    expect(data.length).toBe(getMockSearchProperties().length);
  });

  it("bedsMin=3 returns rows with >= 3 beds", async () => {
    const { data } = await searchProperties({
      bedsMin: "3",
      bedsMax: "Any",
    });
    expect(data.every((p) => p.beds >= 3)).toBe(true);
  });

  it("bedsMax=2 returns rows with <= 2 beds", async () => {
    const { data } = await searchProperties({
      bedsMin: "Any",
      bedsMax: "2",
    });
    expect(data.every((p) => p.beds <= 2)).toBe(true);
  });

  it("bedsMin=3 bedsMax=4 returns rows in [3,4]", async () => {
    const { data } = await searchProperties({
      bedsMin: "3",
      bedsMax: "4",
    });
    expect(data.every((p) => p.beds >= 3 && p.beds <= 4)).toBe(true);
  });

  it("bedsMax=5+ applies no upper bound", async () => {
    const { data } = await searchProperties({
      bedsMin: "Any",
      bedsMax: "5+",
    });
    expect(data.length).toBe(getMockSearchProperties().length);
  });
});

describe("searchProperties (mock path) — soldWithin", () => {
  // Enable the dev/demo search_mock_data flag so searchProperties serves the
  // canonical mock dataset. With both flags off (production default) the action
  // returns [] and never fabricates listings for real users — preserving the
  // data-integrity rule.
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("'all' returns all rows (mock has no LR data)", async () => {
    const { data } = await searchProperties({ soldWithin: "all" });
    expect(data.length).toBe(getMockSearchProperties().length);
  });

  it("'3m' returns empty (mock data has no last_sold_date)", async () => {
    const { data } = await searchProperties({ soldWithin: "3m" });
    expect(data.length).toBe(0);
  });
});

describe("searchProperties (mock path) — rental fields + listing type", () => {
  // Enable the dev/demo search_mock_data flag so searchProperties serves the
  // canonical mock dataset.
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("listingType=rent returns only rent rows, with rental fields populated", async () => {
    const { data } = await searchProperties({ listingType: "rent" });
    const allMock = getMockSearchProperties();
    const expectedRentCount = allMock.filter((p) => p.listing_type === "rent").length;
    expect(data.length).toBe(expectedRentCount);
    expect(data.every((p) => p.listing_type === "rent")).toBe(true);
    expect(data.some((p) => p.furnishing != null)).toBe(true);
    expect(data.some((p) => p.let_agreed === true)).toBe(true);
  });

  it("listingType=sale returns only sale rows", async () => {
    const { data } = await searchProperties({ listingType: "sale" });
    const allMock = getMockSearchProperties();
    const expectedSaleCount = allMock.filter((p) => p.listing_type === "sale").length;
    expect(data.length).toBe(expectedSaleCount);
    expect(data.every((p) => p.listing_type === "sale")).toBe(true);
  });
});

describe("searchProperties (mock path) — lettings filters", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const rentCount = () =>
    getMockSearchProperties().filter((p) => p.listing_type === "rent").length;

  it("furnishing=furnished narrows to furnished rent rows", async () => {
    const { data } = await searchProperties({
      listingType: "rent",
      furnishing: "furnished",
    });
    expect(data.every((p) => p.furnishing === "furnished")).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.length).toBeLessThan(rentCount());
  });

  it("billsIncluded=yes keeps only bills-included rows", async () => {
    const { data } = await searchProperties({
      listingType: "rent",
      billsIncluded: "yes",
    });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.every((p) => p.bills_included === true)).toBe(true);
  });

  it("petsAllowed=no keeps only not-allowed rows", async () => {
    const { data } = await searchProperties({
      listingType: "rent",
      petsAllowed: "no",
    });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.every((p) => p.pets_policy === "not_allowed")).toBe(true);
  });

  it("studentsWelcome=yes keeps accepted/by_arrangement rows", async () => {
    const { data } = await searchProperties({
      listingType: "rent",
      studentsWelcome: "yes",
    });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(
      data.every(
        (p) =>
          p.students_policy === "accepted" ||
          p.students_policy === "by_arrangement",
      ),
    ).toBe(true);
  });

  it("letAgreed=exclude drops let-agreed rows", async () => {
    const { data } = await searchProperties({
      listingType: "rent",
      letAgreed: "exclude",
    });
    expect(data.every((p) => p.let_agreed !== true)).toBe(true);
    expect(data.length).toBeLessThan(rentCount());
  });

  it("minTenancyMonths=6 keeps rows requiring <= 6 months", async () => {
    const { data } = await searchProperties({
      listingType: "rent",
      minTenancyMonths: "6",
    });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(
      data.every(
        (p) =>
          p.minimum_tenancy_months != null && p.minimum_tenancy_months <= 6,
      ),
    ).toBe(true);
  });

  it("availableFrom=2026-03-01 keeps rows available by that date", async () => {
    const { data } = await searchProperties({
      listingType: "rent",
      availableFrom: "2026-03-01",
    });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(
      data.every(
        (p) => p.available_from != null && p.available_from <= "2026-03-01",
      ),
    ).toBe(true);
  });

  it("lettings filters do not affect sale results", async () => {
    const { data: baseline } = await searchProperties({ listingType: "sale" });
    const { data: withFurnishing } = await searchProperties({
      listingType: "sale",
      furnishing: "furnished",
    });
    expect(withFurnishing.length).toBe(baseline.length);
  });

  it("shortTermLet keeps only rent rows accepting a short fixed term", async () => {
    const { data } = await searchProperties({
      listingType: "rent",
      shortTermLet: true,
    });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.every((p) => p.short_term_let === true)).toBe(true);
    expect(data.length).toBeLessThan(rentCount());
  });
});

describe("searchProperties (mock path) — deeper cross-tenure filters", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const total = () => getMockSearchProperties().length;

  it("mustHaves=[garden] keeps only listings that offer a garden", async () => {
    const { data } = await searchProperties({ mustHaves: ["garden"] });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.length).toBeLessThan(total());
    expect(data.every((p) => p.amenities?.includes("garden"))).toBe(true);
  });

  it("mustHaves requires ALL selected amenities (AND semantics)", async () => {
    const { data } = await searchProperties({ mustHaves: ["garden", "parking"] });
    expect(
      data.every(
        (p) => p.amenities?.includes("garden") && p.amenities?.includes("parking"),
      ),
    ).toBe(true);
  });

  it("empty mustHaves narrows nothing", async () => {
    const { data } = await searchProperties({ mustHaves: [] });
    expect(data.length).toBe(total());
  });

  it("amenities filter applies to rentals too", async () => {
    const { data } = await searchProperties({
      listingType: "rent",
      mustHaves: ["broadband"],
    });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.every((p) => p.listing_type === "rent")).toBe(true);
    expect(data.every((p) => p.amenities?.includes("broadband"))).toBe(true);
  });

  it("councilTaxBands keeps only listings in the chosen bands", async () => {
    const { data } = await searchProperties({ councilTaxBands: ["A"] });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.every((p) => p.council_tax_band === "A")).toBe(true);
  });

  it("keywords match across address/city (case-insensitive, all terms)", async () => {
    const { data } = await searchProperties({ keywords: "london" });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(
      data.every((p) =>
        `${p.address} ${p.city} ${p.postcode}`.toLowerCase().includes("london"),
      ),
    ).toBe(true);
  });

  it("keywords with no match returns empty", async () => {
    const { data } = await searchProperties({ keywords: "zzznowheresville" });
    expect(data.length).toBe(0);
  });
});

describe("searchProperties (mock path) — location query (q)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const total = () => getMockSearchProperties().length;
  const inLocation = (
    p: { address: string; city: string; postcode: string },
    term: string,
  ) =>
    `${p.address} ${p.city} ${p.postcode}`.toLowerCase().includes(term.toLowerCase());

  it("q='London' returns only London listings", async () => {
    const { data } = await searchProperties({ q: "London" });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.length).toBeLessThan(total());
    expect(data.every((p) => inLocation(p, "london"))).toBe(true);
  });

  it("q='Manchester' with type=rent returns only Manchester rentals", async () => {
    const { data } = await searchProperties({ listingType: "rent", q: "Manchester" });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.every((p) => p.listing_type === "rent")).toBe(true);
    expect(data.every((p) => inLocation(p, "manchester"))).toBe(true);
  });

  it("q='M14' (partial postcode) matches the M14 listing", async () => {
    const { data } = await searchProperties({ q: "M14" });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.every((p) => inLocation(p, "m14"))).toBe(true);
    expect(data.some((p) => p.postcode.toUpperCase().startsWith("M14"))).toBe(true);
  });

  it("q='ec1v' is case-insensitive and finds the Shoreditch studio", async () => {
    const { data } = await searchProperties({ q: "ec1v" });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.every((p) => inLocation(p, "ec1v"))).toBe(true);
  });

  it("multi-term q (full postcode with space) matches", async () => {
    const { data } = await searchProperties({ q: "EC1V 9HL" });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.every((p) => p.postcode.toUpperCase().includes("EC1V"))).toBe(true);
  });

  it("q with no location match returns empty", async () => {
    const { data } = await searchProperties({ q: "zzznowheresville" });
    expect(data.length).toBe(0);
  });

  it("empty / whitespace q narrows nothing", async () => {
    const { data: blank } = await searchProperties({ q: "" });
    expect(blank.length).toBe(total());
    const { data: spaces } = await searchProperties({ q: "   " });
    expect(spaces.length).toBe(total());
  });

  it("q composes with other filters (London + rent)", async () => {
    const { data } = await searchProperties({ listingType: "rent", q: "London" });
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(
      data.every((p) => p.listing_type === "rent" && inLocation(p, "london")),
    ).toBe(true);
  });
});
