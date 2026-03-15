"use client";

import { Bed, Bath, Square, Heart, Share2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Listing, Property } from "@/types/property";

// ---------------------------------------------------------------------------
// Price Velocity Indicator
// ---------------------------------------------------------------------------

type VelocityBadgeProps = {
  pct: number | null | undefined;
};

function PriceVelocityBadge({ pct }: VelocityBadgeProps) {
  if (pct === null || pct === undefined || pct === 0) return null;

  if (pct > 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 text-xs font-semibold">
        🔥 Hot
      </span>
    );
  }

  if (pct > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold">
        ↗ Rising
      </span>
    );
  }

  // pct < 0 — price reduced (good news for buyers)
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 border border-green-200 px-2.5 py-0.5 text-xs font-semibold">
      ↘ Reduced
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type StickyInfoBarProps = Readonly<{
  listing: Listing;
  property: Property;
  priceChangePct?: number | null;
  onSave?: () => void;
  onShare?: () => void;
  onBook?: () => void;
}>;

export function StickyInfoBar({
  listing,
  property,
  priceChangePct,
  onSave,
  onShare,
  onBook,
}: StickyInfoBarProps) {
  const priceFormatted = `£${listing.price.toLocaleString("en-GB")}`;

  const addressLine = [
    property.address_line1,
    property.address_line2,
    property.city,
    property.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const sqft = property.square_footage ?? 0;

  const rentSuffix =
    listing.listing_type === "rent"
      ? listing.rent_frequency === "weekly"
        ? " / week"
        : " / month"
      : "";

  return (
    <div
      className={cn(
        "sticky top-16 z-20 -mx-4 px-4 py-3",
        "bg-background/95 backdrop-blur border-b",
        "lg:static lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:px-0 lg:py-0",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: price + address + bed/bath/sqft */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-2xl font-bold text-[#1B4D3E]">
              {priceFormatted}
              {rentSuffix && (
                <span className="text-base font-normal text-muted-foreground ml-1">
                  {rentSuffix}
                </span>
              )}
            </p>
            <PriceVelocityBadge pct={priceChangePct} />
          </div>

          <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-xs">
            {addressLine}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="size-4 shrink-0" />
              {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="size-4 shrink-0" />
              {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
            </span>
            {sqft > 0 && (
              <span className="flex items-center gap-1">
                <Square className="size-4 shrink-0" />
                {sqft.toLocaleString("en-GB")} sq ft
              </span>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onSave}
            aria-label="Save property"
          >
            <Heart className="size-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onShare}
            aria-label="Share property"
          >
            <Share2 className="size-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          {/* Book viewing — hidden on desktop (sidebar has it) */}
          <Button
            size="sm"
            className="gap-1.5 lg:hidden bg-[#1B4D3E] hover:bg-[#1B4D3E]/90"
            onClick={onBook}
            aria-label="Book a viewing"
          >
            <CalendarDays className="size-4" />
            Book
          </Button>
        </div>
      </div>
    </div>
  );
}
