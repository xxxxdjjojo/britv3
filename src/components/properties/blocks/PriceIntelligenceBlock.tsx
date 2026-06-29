import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import {
  PriceHistorySection,
  PriceHistorySectionSkeleton,
} from "@/components/properties/PriceHistorySection";
import type { PropertyView } from "@/lib/properties/build-property-view";

/**
 * Block 05 — Price intelligence. Asking-price history plus HM Land Registry
 * sale history and nearby comparables. Phase 1 adds a PricePosition
 * (this/street/area + value rating) above the history here.
 */
export function PriceIntelligenceBlock({ view }: { view: PropertyView }) {
  const { property } = view.detail;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Price intelligence</h2>
      <Separator className="mb-4" />
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
