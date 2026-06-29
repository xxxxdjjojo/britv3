import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import {
  PlanningApplicationsSection,
  PlanningApplicationsSectionSkeleton,
} from "@/components/properties/detail/PlanningApplicationsSection";
import { RenovationROIPanel } from "@/components/properties/roi/RenovationROIPanel";
import { WhatIfFloorPlan } from "@/components/properties/roi/WhatIfFloorPlan";
import { PermittedDevelopmentSummary } from "@/components/properties/detail/PermittedDevelopmentSummary";
import type { Property } from "@/types/property";
import type { createClient } from "@/lib/supabase/server";
import type { PropertyView } from "@/lib/properties/build-property-view";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Block 08 — History & potential. Nearby planning applications for every
 * listing; for sale listings it also surfaces renovation ROI, permitted-
 * development potential, and the what-if floor plan. Rent listings get the
 * lighter planning-only treatment (no capital-growth / ROI framing). Phase 1
 * adds a property timeline above the planning section.
 */
export function HistoryPotentialBlock({
  view,
  supabase,
}: {
  view: PropertyView;
  supabase: SupabaseServerClient;
}) {
  const { detail, floorPlanUrl } = view;
  const { listing, property } = detail;
  const { coordinates } = property;

  const isSale = listing.listingType === "sale";

  return (
    <div className="space-y-10">
      {coordinates && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Planning applications</h2>
          <Separator className="mb-4" />
          <Suspense fallback={<PlanningApplicationsSectionSkeleton />}>
            <PlanningApplicationsSection
              lat={coordinates.lat}
              lng={coordinates.lng}
            />
          </Suspense>
        </section>
      )}

      {isSale && (
        <section id="roi-section">
          <h2 className="text-xl font-semibold mb-3">Renovation ROI</h2>
          <Separator className="mb-4" />
          <div className="space-y-6">
            <Suspense
              fallback={
                <div className="rounded-xl border bg-card p-6 animate-pulse">
                  <div className="h-5 w-48 bg-muted rounded mb-4" />
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-28 bg-muted rounded-xl" />
                    ))}
                  </div>
                </div>
              }
            >
              <RenovationROIPanel
                property={property as unknown as Property}
                supabase={supabase}
              />
            </Suspense>

            <PermittedDevelopmentSummary propertyType={property.propertyType} />

            {floorPlanUrl && (
              <WhatIfFloorPlan
                floorPlanUrl={floorPlanUrl}
                selectedRenovationType={null}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
