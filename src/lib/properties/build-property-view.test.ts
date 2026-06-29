import { describe, it, expect } from "vitest";
import { buildPropertyView, formatPropertyType } from "./build-property-view";
import type {
  PropertyDetail,
  PriceHistoryEntry,
} from "@/services/properties/property-detail-service";

type Property = PropertyDetail["property"];
type Listing = PropertyDetail["listing"];
type Media = PropertyDetail["media"][number];

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: "p1",
    title: "Test",
    description: "Lovely home",
    addressLine1: "1 Test St",
    addressLine2: null,
    city: "London",
    county: null,
    postcode: "TW7 9AB",
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
    tenure: null,
    leaseRemainingYears: null,
    councilTaxBand: null,
    planningPermissionStatus: null,
    yearBuilt: null,
    newBuild: false,
    isHmo: false,
    coordinates: { lat: 51.5, lng: -0.3 },
    ...overrides,
  };
}

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "l1",
    slug: "1-test-st",
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
    ...overrides,
  };
}

function makeMedia(partial: Partial<Media> & { mediaType: Media["mediaType"]; url: string }): Media {
  return {
    id: `m-${partial.url}`,
    thumbnailUrl: null,
    caption: null,
    altText: null,
    sortOrder: 0,
    ...partial,
  };
}

function makeDetail(overrides: Partial<PropertyDetail> = {}): PropertyDetail {
  return {
    listing: makeListing(),
    property: makeProperty(),
    media: [],
    agent: null,
    ...overrides,
  };
}

describe("formatPropertyType", () => {
  it("title-cases underscore enums", () => {
    expect(formatPropertyType("semi_detached")).toBe("Semi Detached");
    expect(formatPropertyType("flat")).toBe("Flat");
  });
});

describe("buildPropertyView", () => {
  it("formats a sale price without a rent suffix", () => {
    const view = buildPropertyView(makeDetail(), []);
    expect(view.priceFormatted).toBe("£625,000");
    expect(view.propertyTypeLabel).toBe("Semi Detached");
    expect(view.propertyTitle).toBe("4-bed Semi Detached in London");
  });

  it("formats a monthly rent with a pcm suffix and derives the same monthly rent", () => {
    const view = buildPropertyView(
      makeDetail({
        listing: makeListing({
          listingType: "rent",
          rentFrequency: "monthly",
          price: 2400,
        }),
      }),
      [],
    );
    expect(view.priceFormatted).toBe("£2,400 pcm");
    expect(view.monthlyRent).toBe(2400);
    expect(view.rentSubline).toContain("pw");
    expect(view.rentSubline).toContain("/ room");
  });

  it("converts a weekly rent into a monthly figure and uses a pw suffix", () => {
    const view = buildPropertyView(
      makeDetail({
        listing: makeListing({
          listingType: "rent",
          rentFrequency: "weekly",
          price: 500,
        }),
      }),
      [],
    );
    expect(view.priceFormatted).toBe("£500 pw");
    // 500 * 52 / 12 = 2166.67 → rounded
    expect(view.monthlyRent).toBe(2167);
  });

  it("flags inactive statuses", () => {
    expect(buildPropertyView(makeDetail({ listing: makeListing({ status: "sold" }) }), []).isInactiveStatus).toBe(true);
    expect(buildPropertyView(makeDetail({ listing: makeListing({ status: "let" }) }), []).isInactiveStatus).toBe(true);
    expect(buildPropertyView(makeDetail(), []).isInactiveStatus).toBe(false);
  });

  it("extracts the postcode district", () => {
    expect(buildPropertyView(makeDetail(), []).district).toBe("TW7");
  });

  it("splits media into gallery images, floor plans, and tour URLs", () => {
    const media: Media[] = [
      makeMedia({ mediaType: "image", url: "https://x/a.jpg", altText: "A" }),
      makeMedia({ mediaType: "image", url: "https://x/b.jpg", altText: "B" }),
      makeMedia({ mediaType: "floor_plan", url: "https://x/plan.jpg", caption: "Ground" }),
      makeMedia({ mediaType: "virtual_tour" as Media["mediaType"], url: "https://x/tour" }),
      makeMedia({ mediaType: "video" as Media["mediaType"], url: "https://x/video" }),
    ];
    const view = buildPropertyView(makeDetail({ media }), []);
    expect(view.galleryImages).toEqual([
      { src: "https://x/a.jpg", alt: "A" },
      { src: "https://x/b.jpg", alt: "B" },
    ]);
    expect(view.floors).toEqual([{ label: "Ground", imageUrl: "https://x/plan.jpg" }]);
    expect(view.floorPlanUrl).toBe("https://x/plan.jpg");
    expect(view.virtualTourUrl).toBe("https://x/tour");
    expect(view.videoTourUrl).toBe("https://x/video");
  });

  it("detects a price reduction from history", () => {
    // getPriceHistory returns newest-first; the builder reverses to oldest-first.
    const history: PriceHistoryEntry[] = [
      { oldPrice: 650000, newPrice: 625000, changedAt: "2026-02-01" },
      { oldPrice: 650000, newPrice: 650000, changedAt: "2026-01-01" },
    ];
    const view = buildPropertyView(makeDetail(), history);
    expect(view.priceReduced).toBe(true);
    expect(view.originalPrice).toBe(650000);
  });

  it("builds a canonical property URL from the slug", () => {
    const view = buildPropertyView(makeDetail(), []);
    expect(view.propertyUrl).toMatch(/\/properties\/1-test-st$/);
  });
});
