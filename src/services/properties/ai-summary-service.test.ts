import { describe, it, expect } from "vitest";
import {
  buildFactPack,
  buildTemplatedSummary,
  propertySummarySchema,
} from "./ai-summary-service";
import { buildPropertyView } from "@/lib/properties/build-property-view";
import { buildBuyerScore } from "@/lib/properties/property-score";
import type { PropertyDetail } from "./property-detail-service";

function detail(overrides: Partial<PropertyDetail["property"]> = {}): PropertyDetail {
  return {
    listing: {
      id: "l1",
      slug: "s",
      listingType: "sale",
      status: "active",
      price: 625000,
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
    },
    property: {
      id: "p1",
      title: "T",
      description: "D",
      addressLine1: "1 St",
      addressLine2: null,
      city: "Ealing",
      county: null,
      postcode: "W5 2AB",
      propertyType: "semi_detached",
      bedrooms: 4,
      bathrooms: 2,
      receptionRooms: null,
      squareFootage: 1400,
      features: {},
      epcRating: "B",
      epcScore: null,
      epcPotentialRating: null,
      epcPotentialScore: null,
      tenure: "freehold",
      leaseRemainingYears: null,
      councilTaxBand: "E",
      planningPermissionStatus: null,
      yearBuilt: null,
      newBuild: false,
      isHmo: false,
      coordinates: { lat: 51.5, lng: -0.3 },
      ...overrides,
    },
    media: [],
    agent: null,
  };
}

const view = buildPropertyView(detail(), []);
const score = buildBuyerScore({ epcRating: "B", valueDeltaPct: -0.08, floodBand: "Very Low" });

describe("buildFactPack", () => {
  it("contains the real computed facts", () => {
    const pack = buildFactPack(view, score);
    expect(pack).toContain("£625,000");
    expect(pack).toContain("EPC rating: B");
    expect(pack).toContain("Ealing W5 2AB");
    expect(pack).toContain("TrueDeed score:");
    expect(pack).toContain("Score — Energy: 5/5");
  });

  it("omits facts that are absent rather than inventing them", () => {
    const noEpc = buildPropertyView(detail({ epcRating: null }), []);
    const pack = buildFactPack(noEpc, buildBuyerScore({ valueDeltaPct: -0.08 }));
    expect(pack).not.toContain("EPC rating");
  });
});

describe("buildTemplatedSummary", () => {
  it("derives a schema-valid summary from the score", () => {
    const summary = buildTemplatedSummary(view, score);
    expect(propertySummarySchema.safeParse(summary).success).toBe(true);
    expect(summary.highlights[0]).toContain("Ealing");
    expect(summary.idealFor[0]).toMatch(/Families/);
  });

  it("targets young professionals for a one-bed", () => {
    const oneBed = buildPropertyView(detail({ bedrooms: 1 }), []);
    const summary = buildTemplatedSummary(oneBed, buildBuyerScore({ epcRating: "C" }));
    expect(summary.idealFor[0]).toMatch(/professional/i);
  });
});
