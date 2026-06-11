/**
 * Test fixtures for listings, properties, and media.
 * Provides factory functions and pre-built datasets for listing tests.
 */

import type {
  Listing,
  Property,
  PropertyMedia,
  ListingWithProperty,
} from "@/types/property";

/** Factory to create a mock Property with sensible defaults */
export function createMockProperty(overrides?: Partial<Property>): Property {
  return {
    id: "property-001",
    address_line1: "123 High Street",
    address_line2: null,
    city: "London",
    county: "Greater London",
    postcode: "SW1A 1AA",
    coordinates: { lat: 51.5014, lng: -0.1419 },
    property_type: "semi_detached",
    bedrooms: 3,
    bathrooms: 2,
    reception_rooms: 2,
    square_footage: 1200,
    title: "Charming 3-bed semi-detached in Westminster",
    description: "A beautiful three-bedroom semi-detached house in the heart of Westminster. Features include a large garden, off-street parking, and a modern kitchen.",
    description_tsv: null,
    features: { garden: true, parking: true, central_heating: true },
    epc_rating: "C",
    epc_score: 72,
    tenure: "freehold",
    lease_remaining_years: null,
    council_tax_band: "D",
    planning_permission_status: null,
    year_built: 1935,
    new_build: false,
    created_at: new Date("2026-02-15T10:00:00Z"),
    updated_at: new Date("2026-02-15T10:00:00Z"),
    deleted_at: null,
    ...overrides,
  };
}

/** Factory to create a mock Listing with sensible defaults */
export function createMockListing(overrides?: Partial<Listing>): Listing {
  return {
    id: "listing-001",
    property_id: "property-001",
    user_id: "user-001",
    listing_type: "sale",
    status: "active",
    price: 350000,
    rent_frequency: null,
    price_qualifier: "guide_price",
    service_charge_annual: null,
    ground_rent_annual: null,
    listed_date: "2026-03-01",
    available_from: null,
    slug: "123-high-street-london-sale",
    view_count: 42,
    enquiry_count: 3,
    favorite_count: 5,
    created_at: new Date("2026-03-01T09:00:00Z"),
    updated_at: new Date("2026-03-01T09:00:00Z"),
    deleted_at: null,
    ...overrides,
  };
}

/** Factory to create a mock PropertyMedia with sensible defaults */
export function createMockMedia(
  overrides?: Partial<PropertyMedia>,
): PropertyMedia {
  return {
    id: "media-001",
    listing_id: "listing-001",
    media_type: "image",
    url: "https://storage.supabase.co/property-images/listing-001/image-1.webp",
    thumbnail_url: "https://storage.supabase.co/property-images/listing-001/thumb-1.webp",
    caption: "Front of house",
    alt_text: "Front view of 123 High Street",
    sort_order: 0,
    file_size: 204800,
    original_filename: "front-house.jpg",
    uploaded_by: "user-001",
    created_at: new Date("2026-03-01T09:30:00Z"),
    ...overrides,
  };
}

/** 3 diverse listings for testing */
export const MOCK_LISTINGS: Listing[] = [
  // Sale - detached
  createMockListing(),
  // Sale - flat
  createMockListing({
    id: "listing-002",
    property_id: "property-002",
    user_id: "user-002",
    listing_type: "sale",
    price: 225000,
    price_qualifier: "fixed_price",
    slug: "45-tower-lane-london-sale",
    view_count: 23,
    enquiry_count: 1,
    favorite_count: 2,
  }),
  // Rent - terraced
  createMockListing({
    id: "listing-003",
    property_id: "property-003",
    user_id: "user-001",
    listing_type: "rent",
    price: 1800,
    rent_frequency: "monthly",
    price_qualifier: null,
    slug: "78-victoria-road-manchester-rent",
    view_count: 67,
    enquiry_count: 4,
    favorite_count: 8,
  }),
];

/** Complete property with listing and 5 media items */
export const MOCK_PROPERTY_WITH_MEDIA: ListingWithProperty = {
  property: createMockProperty(),
  listing: createMockListing(),
  media: [
    createMockMedia({ sort_order: 0, caption: "Front of house" }),
    createMockMedia({
      id: "media-002",
      sort_order: 1,
      url: "https://storage.supabase.co/property-images/listing-001/image-2.webp",
      thumbnail_url: "https://storage.supabase.co/property-images/listing-001/thumb-2.webp",
      caption: "Living room",
      alt_text: "Living room at 123 High Street",
      original_filename: "living-room.jpg",
    }),
    createMockMedia({
      id: "media-003",
      sort_order: 2,
      url: "https://storage.supabase.co/property-images/listing-001/image-3.webp",
      thumbnail_url: "https://storage.supabase.co/property-images/listing-001/thumb-3.webp",
      caption: "Kitchen",
      alt_text: "Kitchen at 123 High Street",
      original_filename: "kitchen.jpg",
    }),
    createMockMedia({
      id: "media-004",
      sort_order: 3,
      url: "https://storage.supabase.co/property-images/listing-001/image-4.webp",
      thumbnail_url: "https://storage.supabase.co/property-images/listing-001/thumb-4.webp",
      caption: "Garden",
      alt_text: "Rear garden at 123 High Street",
      original_filename: "garden.jpg",
    }),
    createMockMedia({
      id: "media-005",
      media_type: "floor_plan",
      sort_order: 4,
      url: "https://storage.supabase.co/property-images/listing-001/floorplan.webp",
      thumbnail_url: "https://storage.supabase.co/property-images/listing-001/thumb-floorplan.webp",
      caption: "Ground floor plan",
      alt_text: "Ground floor plan of 123 High Street",
      original_filename: "floorplan.pdf",
    }),
  ],
};
