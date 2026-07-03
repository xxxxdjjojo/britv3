import type {
  TopListCandidate,
  TopListItem,
} from "@/lib/top-properties/types";

let seq = 0;

/** A fully populated, realistic sale candidate. Override what the test needs. */
export function makeCandidate(
  overrides: Partial<TopListCandidate> = {},
): TopListCandidate {
  seq += 1;
  return {
    listingId: `listing-${seq}`,
    listingSlug: `test-home-${seq}-london-sale`,
    title: `Test Home ${seq}`,
    price: 500_000,
    listingType: "sale",
    city: "London",
    postcode: "SE1 2AB",
    propertyType: "terraced",
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1_100,
    imageUrl: "https://example.com/photo.jpg",
    imageAlt: "Front elevation of a terraced house",
    listedDate: "2026-06-20T00:00:00Z",
    viewCount: 40,
    favoriteCount: 6,
    enquiryCount: 2,
    priceDrop: null,
    benchmark: null,
    ...overrides,
  };
}

export function makeItem(overrides: Partial<TopListItem> = {}): TopListItem {
  return {
    ...makeCandidate(),
    rank: 1,
    score: 1,
    reason: "Test reason",
    ...overrides,
  };
}
