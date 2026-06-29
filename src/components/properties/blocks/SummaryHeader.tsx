import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, Calendar as CalendarIcon } from "lucide-react";
import { SocialProofBadge } from "@/components/properties/detail/SocialProofBadge";
import { SavePropertyButton } from "@/components/properties/detail/SavePropertyButton";
import { PropertyDetailActions } from "@/components/properties/detail/PropertyDetailActions";
import type {
  PropertyView,
  PropertyViewerState,
} from "@/lib/properties/build-property-view";

/**
 * Block 02 (resting state) — the essentials header: price, key facts, social
 * proof, and the save / share / report actions. Its root carries
 * `id="property-summary-header"`, which the StickySummaryBar observes to decide
 * when to reveal the condensed bar on scroll.
 */
export function SummaryHeader({
  view,
  viewer,
}: {
  view: PropertyView;
  viewer: PropertyViewerState;
}) {
  const {
    detail,
    priceFormatted,
    rentSubline,
    priceReduced,
    originalPrice,
    address,
    sqft,
  } = view;
  const { listing, property } = detail;

  return (
    <div id="property-summary-header" className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-2xl font-bold text-primary">{priceFormatted}</p>
            {listing.listingType === "rent" && listing.letAgreed && (
              <Badge className="bg-brand-primary text-white">Let agreed</Badge>
            )}
          </div>
          {listing.listingType === "rent" && rentSubline && (
            <p className="text-xs text-muted-foreground mt-0.5">{rentSubline}</p>
          )}
          {priceReduced && originalPrice != null && (
            <Badge
              variant="secondary"
              className="text-xs bg-success/10 text-success dark:bg-success/20 dark:text-success"
            >
              Reduced from £{originalPrice.toLocaleString("en-GB")}
            </Badge>
          )}
          <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-xs">
            {address}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="size-4" />
              {property.bedrooms} beds
            </span>
            <span className="flex items-center gap-1">
              <Bath className="size-4" />
              {property.bathrooms} baths
            </span>
            {sqft > 0 && (
              <span className="flex items-center gap-1">
                <Square className="size-4" />
                {sqft.toLocaleString("en-GB")} sq ft
              </span>
            )}
          </div>

          <div className="mt-2">
            <SocialProofBadge
              propertyId={property.id}
              initialViewerCount={viewer.viewerCount}
              initialSaveCount={viewer.saveCount}
            />
          </div>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <SavePropertyButton
            propertyId={property.id}
            initialSaved={viewer.saveState.saved}
            initialNotes={viewer.saveState.notes}
          />
          <PropertyDetailActions
            propertyId={property.id}
            propertyUrl={view.propertyUrl}
            propertyTitle={view.propertyTitle}
          />
          {viewer.canBookViewing && (
            <a
              href="#book-viewing"
              className="shrink-0 gap-1.5 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-3 lg:hidden"
            >
              <CalendarIcon className="size-4" />
              Book
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
