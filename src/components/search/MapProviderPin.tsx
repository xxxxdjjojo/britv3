"use client";

import Link from "next/link";
import { X, Star, ArrowRight } from "lucide-react";
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
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl max-w-[220px] overflow-hidden relative">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 transition-colors"
        aria-label="Close provider card"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="p-4 pr-10">
        {/* Category indicator strip */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
          <span className="text-xs text-neutral-400 font-medium truncate uppercase tracking-wide">
            {provider.category}
          </span>
        </div>

        {/* Provider name */}
        <p className="text-sm font-semibold text-neutral-900 truncate font-heading" style={{ letterSpacing: "-0.01em" }}>
          {provider.name}
        </p>

        {/* Star rating */}
        {provider.rating !== null && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3.5 h-3.5 fill-brand-secondary text-brand-secondary" />
            <span className="text-xs font-semibold text-neutral-700">{provider.rating.toFixed(1)}</span>
          </div>
        )}

        {/* View profile link */}
        <Link
          href={`/marketplace/${provider.slug}`}
          className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-brand-primary hover:text-brand-primary-light transition-colors"
        >
          View Profile <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
