import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import {
  PriceHistorySection,
  PriceHistorySectionSkeleton,
} from "@/components/properties/PriceHistorySection";
import { PricePosition } from "@/components/properties/blocks/PricePosition";
import type { PropertyView } from "@/lib/properties/build-property-view";

/**
 * Block 05 — Price intelligence. A value-position read (this vs area median +
 * value rating) above the asking-price history and HM Land Registry sale
 * history / nearby comparables.
 */
export function PriceIntelligenceBlock({ view }: { view: PropertyView }) {
  const { listing, property } = view.detail;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Price intelligence</h2>
      <Separator className="mb-4" />
      <Suspense fallback={null}>
        <PricePosition
          price={listing.price}
          postcode={property.postcode}
          propertyType={property.propertyType}
          listingType={listing.listingType}
        />
      </Suspense>
      <Suspense fallback={<PriceHistorySectionSkeleton />}>
        <PriceHistorySection
          history={view.priceHistoryFormatted}
          postcode={property.postcode}
          addressLine1={property.addressLine1}
          addressLine2={property.addressLine2}
        />
      </Suspense>
    </section>
  );
}
