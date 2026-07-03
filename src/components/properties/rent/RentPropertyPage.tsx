import { Suspense } from "react";
import { PropertyTopChrome } from "@/components/properties/blocks/PropertyTopChrome";
import { HeroGalleryBlock } from "@/components/properties/blocks/HeroGalleryBlock";
import { SummaryHeader } from "@/components/properties/blocks/SummaryHeader";
import { StickySummaryBar } from "@/components/properties/blocks/StickySummaryBar";
import { AiOverviewBlock } from "@/components/properties/blocks/AiOverviewBlock";
import { TenancyCostBlock } from "@/components/properties/blocks/TenancyCostBlock";
import { LocalIntelligenceBlock } from "@/components/properties/blocks/LocalIntelligenceBlock";
import { PropertyDetailBlock } from "@/components/properties/blocks/PropertyDetailBlock";
import { HistoryPotentialBlock } from "@/components/properties/blocks/HistoryPotentialBlock";
import { ContactAgentBlock } from "@/components/properties/blocks/ContactAgentBlock";
import { DocumentsHub } from "@/components/properties/blocks/DocumentsHub";
import { SimilarHomesBlock } from "@/components/properties/blocks/SimilarHomesBlock";
import { ActionRail } from "@/components/properties/blocks/ActionRail";
import { MobileStickyBottomBar } from "@/components/properties/blocks/MobileStickyBottomBar";
import { FeaturedExperts } from "@/components/placements/FeaturedExperts";
import { LocalExpertsSection } from "@/components/properties/local-experts/LocalExpertsSection";
import type { createClient } from "@/lib/supabase/server";
import type {
  PropertyView,
  PropertyViewerState,
} from "@/lib/properties/build-property-view";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Rent property template — decision-first ordering tuned for renters:
 * hero → summary → tenancy & cost → local intelligence → property detail →
 * history (planning only) → contact → similar, with the action centre (agent,
 * book viewing, apply to rent) in the sticky right rail.
 */
export function RentPropertyPage({
  view,
  viewer,
  supabase,
}: {
  view: PropertyView;
  viewer: PropertyViewerState;
  supabase: SupabaseServerClient;
}) {
  const { property, listing } = view.detail;

  return (
    <div className="min-h-dvh bg-background">
      <PropertyTopChrome view={view} />

      <StickySummaryBar
        priceFormatted={view.priceFormatted}
        bedrooms={property.bedrooms}
        bathrooms={property.bathrooms}
        sqft={view.sqft}
        epc={view.epc}
        canBookViewing={viewer.canBookViewing}
      />

      <div className="mx-auto max-w-7xl px-4 pb-24 lg:pb-8">
        <HeroGalleryBlock view={view} />
        <SummaryHeader view={view} viewer={viewer} />
        <Suspense fallback={null}>
          <AiOverviewBlock view={view} />
        </Suspense>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10 min-w-0">
            <TenancyCostBlock view={view} />
            <Suspense fallback={null}>
              <FeaturedExperts
                zone="property_financial"
                heading="Trusted professionals for your move"
                subheading="Verified removals, cleaning and handyman experts near here"
                stage="rent"
                postcode={property.postcode}
                town={property.city}
                propertyId={property.id}
                limit={3}
                variant="band"
              />
            </Suspense>
            <LocalIntelligenceBlock view={view} />
            <PropertyDetailBlock view={view} />
            <HistoryPotentialBlock view={view} supabase={supabase} />
            <Suspense fallback={null}>
              <LocalExpertsSection
                listingId={listing.id}
                propertyId={property.id}
                postcode={property.postcode}
                town={property.city}
                region={property.county}
                address={property.addressLine1}
                coordinates={property.coordinates}
                listingType="rent"
                hasRenovationPotential={false}
              />
            </Suspense>
            <DocumentsHub view={view} />
            <ContactAgentBlock view={view} />
            <SimilarHomesBlock view={view} />
          </div>

          <ActionRail view={view} viewer={viewer} />
        </div>
      </div>

      <MobileStickyBottomBar view={view} viewer={viewer} />
    </div>
  );
}
