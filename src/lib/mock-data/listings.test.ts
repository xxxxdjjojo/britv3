import { describe, expect, it } from "vitest";
import {
  MOCK_LISTINGS,
  getMockListingBySlug,
  getMockSearchProperties,
  toPropertyDetail,
} from "./listings";

describe("MOCK_LISTINGS dataset", () => {
  it("has unique slugs and unique ids", () => {
    const slugs = MOCK_LISTINGS.map((r) => r.slug);
    const ids = MOCK_LISTINGS.map((r) => r.id);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes all 12 ported ids and slugs (guards against rename)", () => {
    const expected: ReadonlyArray<{ id: string; slug: string }> = [
      { id: "9", slug: "modern-2-bed-flat-clifton-bristol-sale" },
      { id: "10", slug: "4-bed-period-terrace-hackney-london-sale" },
      { id: "11", slug: "cotswold-stone-cottage-burford-oxfordshire-sale" },
      { id: "12", slug: "5-bed-family-home-hampstead-london-sale" },
      { id: "1", slug: "12-kensington-gardens-london-sale" },
      { id: "2", slug: "8-primrose-hill-road-london-sale" },
      { id: "3", slug: "45-bermondsey-street-london-rent" },
      { id: "4", slug: "3-highbury-park-london-sale" },
      { id: "5", slug: "22-canary-wharf-way-london-rent" },
      { id: "6", slug: "7-peckham-rye-lane-london-sale" },
      { id: "7", slug: "15-notting-hill-gate-london-commercial" },
      { id: "8", slug: "31-borough-market-close-london-sale" },
    ];
    for (const { id, slug } of expected) {
      const row = MOCK_LISTINGS.find((r) => r.id === id);
      expect(row, `row id ${id}`).toBeDefined();
      expect(row?.slug).toBe(slug);
    }
  });

  it("has lastSoldDate null on every row", () => {
    for (const row of MOCK_LISTINGS) {
      expect(row.lastSoldDate).toBeNull();
    }
  });
});

describe("getMockSearchProperties", () => {
  it("maps every row (1:1 with MOCK_LISTINGS)", () => {
    expect(getMockSearchProperties().length).toBe(MOCK_LISTINGS.length);
  });

  it("every SearchProperty slug round-trips via getMockListingBySlug", () => {
    for (const sp of getMockSearchProperties()) {
      const row = getMockListingBySlug(sp.slug);
      expect(row, `slug ${sp.slug}`).not.toBeNull();
      expect(row?.id).toBe(sp.id);
    }
  });

  it("maps enum type to UI label where known", () => {
    const flat = getMockSearchProperties().find((p) => p.id === "9");
    expect(flat?.type).toBe("Flat");
    const semi = getMockSearchProperties().find((p) => p.id === "2");
    expect(semi?.type).toBe("Semi-detached");
  });
});

describe("rental vs sale field integrity", () => {
  it("every rent row has rental fields populated; every sale row has them null/false", () => {
    for (const row of MOCK_LISTINGS) {
      if (row.listing_type === "rent") {
        expect(row.rentFrequency, `rent ${row.id} rentFrequency`).not.toBeNull();
        expect(row.depositAmount ?? 0, `rent ${row.id} deposit`).toBeGreaterThan(0);
        expect(row.furnishing, `rent ${row.id} furnishing`).not.toBeNull();
        expect(row.depositScheme, `rent ${row.id} depositScheme`).not.toBeNull();
      } else {
        expect(row.rentFrequency, `sale ${row.id} rentFrequency`).toBeNull();
        expect(row.letAgreed, `sale ${row.id} letAgreed`).toBe(false);
      }
    }
  });

  it("has at least one rent row with EPC D or E (MEES trigger)", () => {
    const meesRows = MOCK_LISTINGS.filter(
      (r) => r.listing_type === "rent" && (r.epcRating === "D" || r.epcRating === "E"),
    );
    expect(meesRows.length).toBeGreaterThanOrEqual(1);
  });

  it("has at least one let-agreed rent row", () => {
    const letAgreed = MOCK_LISTINGS.filter((r) => r.letAgreed === true);
    expect(letAgreed.length).toBeGreaterThanOrEqual(1);
  });

  it("has at least one weekly-rent row", () => {
    const weekly = MOCK_LISTINGS.filter((r) => r.rentFrequency === "weekly");
    expect(weekly.length).toBeGreaterThanOrEqual(1);
  });
});

describe("toPropertyDetail", () => {
  it("produces a deterministic viewCount across repeated calls", () => {
    const row = getMockListingBySlug("45-bermondsey-street-london-rent")!;
    const a = toPropertyDetail(row).listing.viewCount;
    const b = toPropertyDetail(row).listing.viewCount;
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(50);
    expect(a).toBeLessThanOrEqual(550);
  });

  it("preserves listingType from the row", () => {
    for (const row of MOCK_LISTINGS) {
      expect(toPropertyDetail(row).listing.listingType).toBe(row.listing_type);
    }
  });

  it("populates furnishing and depositScheme for a known rent row", () => {
    const row = getMockListingBySlug("45-bermondsey-street-london-rent")!;
    const detail = toPropertyDetail(row);
    expect(detail.listing.furnishing).toBe("furnished");
    expect(detail.listing.depositScheme).toBe("DPS");
  });

  it("titles a studio (beds 0) as 'Studio flat in {city}'", () => {
    const studio = MOCK_LISTINGS.find((r) => r.beds === 0)!;
    expect(toPropertyDetail(studio).property.title).toBe(
      `Studio flat in ${studio.city}`,
    );
  });
});
