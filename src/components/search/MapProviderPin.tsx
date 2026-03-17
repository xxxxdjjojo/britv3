"use client";

import Link from "next/link";
import type { MapProvider } from "./SearchMap";

type MapProviderPinProps = Readonly<{
  provider: MapProvider;
  onClose: () => void;
}>;

export default function MapProviderPin({
  provider,
  onClose,
}: MapProviderPinProps) {
  return (
    <div className="bg-white rounded-lg shadow-md max-w-[220px] overflow-hidden border-l-4 border-blue-500 relative">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xs"
        aria-label="Close"
      >
        ✕
      </button>

      <div className="p-3 pr-7">
        {/* Provider name */}
        <p className="text-sm font-medium text-gray-900 truncate">
          {provider.name}
        </p>

        {/* Category with colored dot */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="text-xs text-gray-500 truncate">
            {provider.category}
          </span>
        </div>

        {/* Star rating */}
        {provider.rating !== null && (
          <p className="text-xs text-amber-600 font-medium mt-1">
            ★ {provider.rating.toFixed(1)}
          </p>
        )}

        {/* View profile link */}
        <Link
          href={`/marketplace/${provider.slug}`}
          className="inline-block mt-2 text-xs text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors"
        >
          View Profile →
        </Link>
      </div>
    </div>
  );
}
