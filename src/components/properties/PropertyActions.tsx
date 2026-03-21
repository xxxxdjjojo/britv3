
/**
 * Property action sidebar -- save, share, contact agent buttons + location map.
 * Client component for interactive features.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SaveButton } from "./SaveButton";
import { ShareButton } from "./ShareButton";
import { PropertyMap } from "@/components/map/PropertyMap";
import { MessageSquareIcon } from "lucide-react";
import type { PropertyMapPoint } from "@/types/map";

type PropertyActionsProps = Readonly<{
  listingId: string;
  title: string;
  coordinates: { lat: number; lng: number } | null;
}>;

export function PropertyActions({
  listingId,
  title,
  coordinates,
}: PropertyActionsProps) {
  const mapPoints: PropertyMapPoint[] = coordinates
    ? [
        {
          id: listingId,
          lat: coordinates.lat,
          lng: coordinates.lng,
          price: 0,
          property_type: "other",
          bedrooms: 0,
          listing_type: "sale",
        },
      ]
    : [];

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        {/* Save button */}
        <div className="flex items-center gap-2">
          <SaveButton listingId={listingId} />
          <span className="text-sm">Save this property</span>
        </div>

        <ShareButton title={title} />

        <Separator />

        {/* Contact agent placeholder */}
        <Button className="w-full gap-2" disabled>
          <MessageSquareIcon className="size-4" />
          Contact Agent
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Coming in Phase 3
        </p>

        {/* Mini location map */}
        {coordinates && (
          <>
            <Separator />
            <div className="h-48 overflow-hidden rounded-lg">
              <PropertyMap
                properties={mapPoints}
                initialViewState={{
                  longitude: coordinates.lng,
                  latitude: coordinates.lat,
                  zoom: 14,
                  bearing: 0,
                  pitch: 0,
                }}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
