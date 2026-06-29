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
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-4 lg:hidden">
      <div>
        <p className="font-bold text-lg text-primary">{view.priceFormatted}</p>
        <p className="text-xs text-muted-foreground">
          {view.detail.property.bedrooms} bed · {view.propertyTypeLabel}
        </p>
      </div>
      {viewer.canBookViewing && (
        <a
          href="#book-viewing"
          className="shrink-0 gap-1.5 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-3 transition-colors hover:bg-primary/90"
        >
          <CalendarIcon className="size-4" />
          Book Viewing
        </a>
      )}
    </div>
  );
}
