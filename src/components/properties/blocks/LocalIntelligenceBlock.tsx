import { Suspense } from "react";
import { MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { MapEmbedClient } from "@/components/maps/MapEmbedClient";
import { LocalAreaSection } from "@/components/properties/detail/LocalAreaSection";
import type { PropertyView } from "@/lib/properties/build-property-view";

/**
 * Block 06 — Local intelligence. Location map plus the self-gating local-area
 * data cards (schools, crime, transport, broadband, flood, mobility). Phase 4
 * swaps the static map for a layered, toggleable map; the data cards are
 * unchanged.
 */
export function LocalIntelligenceBlock({ view }: { view: PropertyView }) {
  const { property } = view.detail;
  const { coordinates } = property;

  if (!coordinates) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Local intelligence</h2>
      <Separator className="mb-4" />

      {view.showMap && (
        <div className="mb-6">
          <MapEmbedClient
            latitude={coordinates.lat}
            longitude={coordinates.lng}
            zoom={15}
            className="h-64 w-full rounded-xl overflow-hidden border"
          />
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {view.address}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Location is approximate. Map data © MapTiler &amp; OpenStreetMap
            contributors.
          </p>
        </div>
      )}

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-48 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        }
      >
        <LocalAreaSection
          lat={coordinates.lat}
          lng={coordinates.lng}
          postcode={property.postcode}
          propertyId={property.id}
        />
      </Suspense>
    </section>
  );
}
