import { Calendar as CalendarIcon } from "lucide-react";
import type {
  PropertyView,
  PropertyViewerState,
} from "@/lib/properties/build-property-view";

/**
 * Mobile-only fixed bottom action bar — price + primary CTA, always reachable
 * on small screens. Hidden on lg+ where the action rail and sticky top bar
 * cover the same need.
 */
export function MobileStickyBottomBar({
  view,
  viewer,
}: {
  view: PropertyView;
  viewer: PropertyViewerState;
}) {
  // Outer: fixed positioning + safe-area bottom clearance (pb-safe).
  // pb-safe sets padding-bottom: env(safe-area-inset-bottom) from an unlayered
  // @supports block — it overrides py-3's padding-bottom if both are on the
  // same element. The inner div carries the visual pb-3 so non-notched devices
  // keep their 12px bottom gap.
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur px-4 pt-3 pb-safe lg:hidden">
      <div className="flex items-center justify-between gap-4 pb-3">
        <div>
          <p className="font-bold text-lg text-primary">{view.priceFormatted}</p>
          <p className="text-xs text-muted-foreground">
            {view.detail.property.bedrooms} bed · {view.propertyTypeLabel}
          </p>
        </div>
        {viewer.canBookViewing && (
          <a
            href="#book-viewing"
            className="shrink-0 gap-1.5 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-11 px-4 transition-colors hover:bg-primary/90"
          >
            <CalendarIcon className="size-4" />
            Book Viewing
          </a>
        )}
      </div>
    </div>
  );
}
