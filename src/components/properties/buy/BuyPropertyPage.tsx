import { Suspense } from "react";
import { PropertyTopChrome } from "@/components/properties/blocks/PropertyTopChrome";
import { HeroGalleryBlock } from "@/components/properties/blocks/HeroGalleryBlock";
import { SummaryHeader } from "@/components/properties/blocks/SummaryHeader";
import { StickySummaryBar } from "@/components/properties/blocks/StickySummaryBar";
import { AiOverviewBlock } from "@/components/properties/blocks/AiOverviewBlock";
import { FinancialSnapshot } from "@/components/properties/blocks/FinancialSnapshot";
import { PriceIntelligenceBlock } from "@/components/properties/blocks/PriceIntelligenceBlock";
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
import { assessPermittedDevelopment } from "@/lib/properties/permitted-development-rules";
import type { createClient } from "@/lib/supabase/server";
import type {
  PropertyView,
  PropertyViewerState,
} from "@/lib/properties/build-property-view";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Buy property template — decision-first ordering:
 * hero → summary → price intelligence → local intelligence → property detail →
 * history & potential → contact → similar, with the action centre in the
 * sticky right rail. (AI overview and a unified financial snapshot are added as
 * feature bands above the grid in later phases.)
 */
export function BuyPropertyPage({
  view,
  viewer,
  supabase,
}: {
  view: PropertyView;
  viewer: PropertyViewerState;
  supabase: SupabaseServerClient;
}) {
  const { property, listing } = view.detail;
  // Renovation trades lead only when the property type actually has renovation /
  // permitted-development scope (houses); flats / land lead with the buying
  // journey (surveyor, mortgage, conveyancer).
  const hasRenovationPotential = assessPermittedDevelopment(property.propertyType).applicable;

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
        <FinancialSnapshot view={view} />

        <Suspense fallback={null}>
          <FeaturedExperts
            zone="property_financial"
            heading="Trusted professionals for this move"
            subheading="Verified mortgage, legal and survey experts for this purchase"
            stage="buy"
            postcode={property.postcode}
            town={property.city}
            propertyId={property.id}
            limit={3}
            variant="band"
          />
        </Suspense>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10 min-w-0">
            <PriceIntelligenceBlock view={view} />
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
                listingType="sale"
                hasRenovationPotential={hasRenovationPotential}
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
