import { describe, it, expect } from "vitest";
import { buildPropertyFacts, type FactGroup } from "./build-property-facts";
import type { PropertyDetail } from "@/services/properties/property-detail-service";

type Property = PropertyDetail["property"];
type Listing = PropertyDetail["listing"];

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: "p1",
    title: "Test",
    description: "Test",
    addressLine1: "1 Test St",
    addressLine2: null,
    city: "London",
    county: null,
    postcode: "SW1A 1AA",
    propertyType: "terraced",
    bedrooms: 3,
    bathrooms: 2,
    receptionRooms: null,
    squareFootage: null,
    features: {},
    epcRating: null,
    epcScore: null,
    epcPotentialRating: null,
    epcPotentialScore: null,
    tenure: null,
    leaseRemainingYears: null,
    councilTaxBand: null,
    planningPermissionStatus: null,
    yearBuilt: null,
    newBuild: false,
    isHmo: false,
    coordinates: null,
    ...overrides,
  };
}

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "l1",
    slug: "test",
    listingType: "sale",
    status: "active",
    price: 500000,
    rentFrequency: null,
    letAgreed: false,
    priceQualifier: null,
    listedDate: "2026-01-15",
    viewCount: 0,
    serviceChargeAnnual: null,
    groundRentAnnual: null,
    availableFrom: null,
    depositAmount: null,
    holdingDepositAmount: null,
    furnishing: null,
    minimumTenancyMonths: null,
    maximumTenancyMonths: null,
    billsIncluded: null,
    billsIncludedDetails: null,
    petsPolicy: null,
    studentsPolicy: null,
    depositScheme: null,
    ...overrides,
  };
}

function groupTitles(groups: FactGroup[]): string[] {
  return groups.map((g) => g.title);
}

function findFact(groups: FactGroup[], label: string): string | undefined {
  for (const g of groups) {
    const f = g.facts.find((x) => x.label === label);
    if (f) return f.value;
  }
  return undefined;
}

describe("buildPropertyFacts", () => {
  it("with minimal data emits only the Key facts group with type/beds/baths", () => {
    const groups = buildPropertyFacts(makeProperty(), makeListing());
    // listedDate is always set in our fixture, so Availability also appears.
    expect(groupTitles(groups)).toEqual(["Key facts", "Availability"]);
    const key = groups[0];
    expect(key.facts.map((f) => f.label)).toEqual([
      "Type",
      "Bedrooms",
      "Bathrooms",
    ]);
  });

  it("omits empty categories entirely (no blank cards)", () => {
    const groups = buildPropertyFacts(makeProperty(), makeListing());
    expect(groupTitles(groups)).not.toContain("Tenure & running costs");
    expect(groupTitles(groups)).not.toContain("Energy & planning");
  });

  it("renders Studio for zero bedrooms", () => {
    const groups = buildPropertyFacts(
      makeProperty({ bedrooms: 0 }),
      makeListing(),
    );
    expect(findFact(groups, "Bedrooms")).toBe("Studio");
  });

  it("shows lease remaining only for leasehold properties", () => {
    const leasehold = buildPropertyFacts(
      makeProperty({ tenure: "leasehold", leaseRemainingYears: 95 }),
      makeListing(),
    );
    expect(findFact(leasehold, "Lease remaining")).toBe("95 years");

    const freehold = buildPropertyFacts(
      makeProperty({ tenure: "freehold", leaseRemainingYears: 95 }),
      makeListing(),
    );
    expect(findFact(freehold, "Lease remaining")).toBeUndefined();
    expect(findFact(freehold, "Tenure")).toBe("Freehold");
  });

  it("formats running costs as annual money values when present and positive", () => {
    const groups = buildPropertyFacts(
      makeProperty({ tenure: "leasehold" }),
      makeListing({ serviceChargeAnnual: 1800, groundRentAnnual: 250 }),
    );
    expect(findFact(groups, "Service charge")).toBe("£1,800 / year");
    expect(findFact(groups, "Ground rent")).toBe("£250 / year");
  });

  it("hides zero or null running costs", () => {
    const groups = buildPropertyFacts(
      makeProperty({ tenure: "leasehold" }),
      makeListing({ serviceChargeAnnual: 0, groundRentAnnual: null }),
    );
    expect(findFact(groups, "Service charge")).toBeUndefined();
    expect(findFact(groups, "Ground rent")).toBeUndefined();
  });

  it("maps planning status to a human label and omits unknown/null", () => {
    const granted = buildPropertyFacts(
      makeProperty({ planningPermissionStatus: "granted" }),
      makeListing(),
    );
    expect(findFact(granted, "Planning")).toBe("Permission granted");

    const none = buildPropertyFacts(
      makeProperty({ planningPermissionStatus: null }),
      makeListing(),
    );
    expect(findFact(none, "Planning")).toBeUndefined();

    const garbage = buildPropertyFacts(
      makeProperty({ planningPermissionStatus: "weird_value" }),
      makeListing(),
    );
    expect(findFact(garbage, "Planning")).toBeUndefined();
  });

  it("surfaces EPC, size, year built, new build and council tax when present", () => {
    const groups = buildPropertyFacts(
      makeProperty({
        squareFootage: 1240,
        yearBuilt: 1998,
        newBuild: true,
        epcRating: "B",
        epcScore: 85,
        councilTaxBand: "D",
      }),
      makeListing(),
    );
    expect(findFact(groups, "Size")).toBe("1,240 sq ft");
    expect(findFact(groups, "Year built")).toBe("1998");
    expect(findFact(groups, "New build")).toBe("Yes");
    expect(findFact(groups, "EPC rating")).toBe("B");
    expect(findFact(groups, "EPC score")).toBe("85/100");
    expect(findFact(groups, "Council tax")).toBe("Band D");
  });

  it("shows availability + HMO for a lettable property", () => {
    const groups = buildPropertyFacts(
      makeProperty({ isHmo: true }),
      makeListing({ listingType: "rent", availableFrom: "2026-02-01" }),
    );
    expect(findFact(groups, "Available from")).toBe("1 Feb 2026");
    expect(findFact(groups, "HMO")).toBe("Licensed HMO");
  });

  it("ignores zero square footage", () => {
    const groups = buildPropertyFacts(
      makeProperty({ squareFootage: 0 }),
      makeListing(),
    );
    expect(findFact(groups, "Size")).toBeUndefined();
  });
});
