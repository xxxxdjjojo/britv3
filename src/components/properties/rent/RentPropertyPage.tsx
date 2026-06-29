import { PropertyTopChrome } from "@/components/properties/blocks/PropertyTopChrome";
import { HeroGalleryBlock } from "@/components/properties/blocks/HeroGalleryBlock";
import { SummaryHeader } from "@/components/properties/blocks/SummaryHeader";
import { StickySummaryBar } from "@/components/properties/blocks/StickySummaryBar";
import { TenancyCostBlock } from "@/components/properties/blocks/TenancyCostBlock";
import { LocalIntelligenceBlock } from "@/components/properties/blocks/LocalIntelligenceBlock";
import { PropertyDetailBlock } from "@/components/properties/blocks/PropertyDetailBlock";
import { HistoryPotentialBlock } from "@/components/properties/blocks/HistoryPotentialBlock";
import { ContactAgentBlock } from "@/components/properties/blocks/ContactAgentBlock";
import { SimilarHomesBlock } from "@/components/properties/blocks/SimilarHomesBlock";
import { ActionRail } from "@/components/properties/blocks/ActionRail";
import { MobileStickyBottomBar } from "@/components/properties/blocks/MobileStickyBottomBar";
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
  const { property } = view.detail;

  return (
    <div className="min-h-screen bg-background">
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

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10 min-w-0">
            <TenancyCostBlock view={view} />
            <LocalIntelligenceBlock view={view} />
            <PropertyDetailBlock view={view} />
            <HistoryPotentialBlock view={view} supabase={supabase} />
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
