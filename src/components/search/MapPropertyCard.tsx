"use client";

import Link from "next/link";
import type { MapProperty } from "./SearchMap";

type MapPropertyCardProps = Readonly<{
  property: MapProperty;
  onClose: () => void;
}>;

function formatPrice(price: number): string {
  return `£${price.toLocaleString("en-GB")}`;
}

export default function MapPropertyCard({
  property,
  onClose,
}: MapPropertyCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg max-w-[280px] overflow-hidden relative">
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
      <div className="relative aspect-[16/10] bg-gray-200">
        {property.thumbnailUrl ? (
          <img
            src={property.thumbnailUrl}
            alt={property.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}

        {/* Heart / save button */}
        <button
          type="button"
          className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 text-gray-500 hover:text-red-500 hover:bg-white transition-colors"
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
          {formatPrice(property.price)}
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
