import { Suspense } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { AgentCardSidebar } from "@/components/properties/detail/AgentCardSidebar";
import { BookViewingModal } from "@/components/properties/detail/BookViewingModal";
import { RecommendedTradespeople } from "@/components/properties/detail/RecommendedTradespeople";
import { FeaturedExperts } from "@/components/placements/FeaturedExperts";
import type {
  PropertyView,
  PropertyViewerState,
} from "@/lib/properties/build-property-view";

/**
 * Block 10 — Action centre (desktop right rail, sticky). Agent card, the
 * primary book-viewing / apply CTA, and recommended tradespeople. Variant-
 * aware: rent gets the apply-to-rent card. Buy-side mortgage + SDLT calculators
 * live in the Financial snapshot band (single source), not here.
 */
export function ActionRail({
  view,
  viewer,
}: {
  view: PropertyView;
  viewer: PropertyViewerState;
}) {
  const { listing, property } = view.detail;
  const isRent = listing.listingType === "rent";

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
      <Suspense
        fallback={
          <div className="rounded-xl border bg-card p-5 animate-pulse space-y-3">
            <div className="flex gap-3">
              <div className="size-12 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
            <div className="h-10 bg-muted rounded-lg" />
          </div>
        }
      >
        <AgentCardSidebar agentId={view.detail.agent?.id ?? ""} propertyId={property.id} />
      </Suspense>

      {isRent && listing.status === "active" && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">Interested in renting?</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Submit a rental application to the landlord directly.
          </p>
          <Link
            href={
              viewer.currentUserId
                ? `/dashboard/renter/applications/apply/${property.id}`
                : `/login?redirectTo=${encodeURIComponent(`/dashboard/renter/applications/apply/${property.id}`)}`
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium h-10 px-4 transition-colors hover:bg-primary/90"
          >
            <FileText className="size-4" />
            Apply to Rent
          </Link>
        </div>
      )}

      {viewer.canBookViewing && (
        <div id="book-viewing">
          <BookViewingModal
            propertyId={property.id}
            propertyStatus={listing.status}
            existingViewingId={viewer.existingViewingId}
          />
        </div>
      )}

      <Suspense fallback={null}>
        <FeaturedExperts
          zone="property_sidebar"
          heading="Featured local experts"
          stage={isRent ? "rent" : "buy"}
          postcode={property.postcode}
          town={property.city}
          propertyId={property.id}
          limit={2}
          variant="rail"
        />
      </Suspense>

      <Suspense fallback={null}>
        <RecommendedTradespeople postcode={property.postcode} />
      </Suspense>
    </aside>
  );
}
