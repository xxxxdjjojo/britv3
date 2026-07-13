"use client";

import Link from "next/link";
import Image from "next/image";
import { CARD_IMAGE_ASPECT, CARD_RADIUS, CARD_SAVE_BTN_PLACEMENT } from "@/components/cards/card-tokens";
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

export default function MapPropertyCard({
  property,
  onClose,
}: MapPropertyCardProps) {
  return (
    <div className={`bg-card ${CARD_RADIUS} shadow-lg max-w-[280px] overflow-hidden relative border`}>
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-white text-xs hover:bg-black/60 transition-colors"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Photo area — 16:10 aspect ratio */}
      <div className={`relative ${CARD_IMAGE_ASPECT} bg-muted`}>
        {property.thumbnailUrl ? (
          <Image
            src={property.thumbnailUrl}
            alt={property.address}
            fill
            sizes="280px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}

        {/* Heart / save button */}
        <button
          type="button"
          className={`${CARD_SAVE_BTN_PLACEMENT} w-7 h-7 flex items-center justify-center rounded-full bg-white/80 text-gray-500 hover:text-red-500 hover:bg-white transition-colors`}
          aria-label="Save property"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            />
          </svg>
        </button>
      </div>

      {/* Info area */}
      <div className="p-3">
        <p className="text-sm text-gray-600 truncate">{property.address}</p>
        <p className="text-base font-bold text-gray-900 mt-0.5">
          {formatPrice(property.price, property.listing_type)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {property.beds} bed · {property.baths} bath · {property.sqft.toLocaleString("en-GB")} sq ft
        </p>
        <Link
          href={`/properties/${property.slug}`}
          className="inline-block mt-2 text-xs text-emerald-600 font-medium hover:text-emerald-700 hover:underline transition-colors"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
