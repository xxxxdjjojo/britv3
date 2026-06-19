import type { PropertyDetail } from "@/services/properties/property-detail-service";
import { appBaseUrl } from "@/config/brand";

const BASE_URL = appBaseUrl();

/**
 * Build Schema.org RealEstateListing (or Residence) JSON-LD for a property detail page.
 * Follows Google Rich Results guidelines for real estate listings.
 */
export function buildPropertyJsonLd(detail: PropertyDetail) {
  const { listing, property, media } = detail;

  const address = [
    property.addressLine1,
    property.addressLine2,
    property.city,
    property.county,
    property.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const images = media
    .filter((m) => m.mediaType === "image")
    .map((m) => m.url);

  const slug = listing.slug ?? listing.id;
  const url = `${BASE_URL}/properties/${slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title || address,
    description: property.description?.slice(0, 500),
    url,
    image: images,
    datePosted: listing.listedDate,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "GBP",
      availability:
        listing.status === "active" || listing.status === "under_offer"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: [property.addressLine1, property.addressLine2]
        .filter(Boolean)
        .join(", "),
      addressLocality: property.city,
      addressRegion: property.county ?? undefined,
      postalCode: property.postcode,
      addressCountry: "GB",
    },
    ...(property.coordinates
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: property.coordinates.lat,
            longitude: property.coordinates.lng,
          },
        }
      : {}),
    ...(property.squareFootage
      ? {
          floorSize: {
            "@type": "QuantitativeValue",
            value: property.squareFootage,
            unitCode: "FTK",
          },
        }
      : {}),
    numberOfRooms: property.bedrooms + property.bathrooms + (property.receptionRooms ?? 0),
    numberOfBedrooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
  };
}
