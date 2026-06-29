import { Suspense } from "react";
import { SimilarProperties } from "@/components/properties/detail/SimilarProperties";
import type { ListingType } from "@/types/property";
import type { PropertyView } from "@/lib/properties/build-property-view";

/**
 * Block 09 — Similar homes. Comparable active listings in the same postcode
 * district, price band, and type.
 */
export function SimilarHomesBlock({ view }: { view: PropertyView }) {
  const { detail, district } = view;
  const { listing, property } = detail;

  return (
    <Suspense
      fallback={
        <div className="space-y-2">
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      }
    >
      <SimilarProperties
        propertyId={property.id}
        postcodeDistrict={district}
        listingType={listing.listingType as ListingType}
        price={listing.price}
        propertyType={property.propertyType}
      />
    </Suspense>
  );
}
