"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Heart, BedDouble, Bath, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapProperty } from "./SearchMap";

type MapPropertyCardProps = Readonly<{
  property: MapProperty;
  onClose: () => void;
}>;

function formatPrice(price: number, listingType?: string): string {
  if (listingType === "rent") {
    return `£${price.toLocaleString("en-GB")}/mo`;
  }
  return `£${price.toLocaleString("en-GB")}`;
}

export default function MapPropertyCard({ property, onClose }: MapPropertyCardProps) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="w-72 overflow-hidden rounded-2xl bg-white/95 shadow-xl backdrop-blur-md">
      {/* Photo area */}
      <div className="relative aspect-[16/10] bg-neutral-100">
        {property.thumbnailUrl ? (
          <img
            src={property.thumbnailUrl}
            alt={property.address}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300 text-xs font-medium">
            No image available
          </div>
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-neutral-950/50 text-white backdrop-blur-sm transition-colors hover:bg-neutral-950/70"
          aria-label="Close property card"
        >
          <X className="size-3.5" />
        </button>

        {/* Save button */}
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          className="absolute left-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-neutral-400 transition-colors hover:bg-white hover:text-red-500"
          aria-label="Save property"
        >
          <Heart
            className={cn(
              "size-3.5 transition-colors",
              saved ? "fill-red-500 text-red-500" : "",
            )}
          />
        </button>

        {/* Price badge */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="rounded-xl bg-brand-primary px-2.5 py-1 text-xs font-bold text-white">
            {formatPrice(property.price, property.listing_type)}
          </span>
        </div>
      </div>

      {/* Info area */}
      <div className="p-4">
        <p className="truncate text-sm font-medium text-neutral-700">{property.address}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <BedDouble className="size-3" />
            {property.beds} bed
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-3" />
            {property.baths} bath
          </span>
          <span className="flex items-center gap-1">
            <Ruler className="size-3" />
            {property.sqft.toLocaleString("en-GB")} sq ft
          </span>
        </div>
        <Link
          href={`/properties/${property.slug}`}
          className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-brand-primary text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
