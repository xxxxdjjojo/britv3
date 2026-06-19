/**
 * Screen 1 — National Search Price Map
 * Route: /search/map
 *
 * Server component shell; the explorer is lazy-loaded via a Client Component
 * boundary (MarketMapExplorerLoader) because next/dynamic with ssr:false is
 * not permitted directly inside a Server Component.
 * URL state: property_type, months, scale_mode, area_id, q (via nuqs in MarketMapExplorer).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketMapExplorerLoader } from "@/components/market-map/MarketMapExplorerLoader";
import { brandConfig } from "@/config/brand";

export const metadata: Metadata = {
  title: `Property Price Map — UK Median Sold Prices | ${brandConfig.displayName}`,
  description:
    "Explore median sold prices across the UK by area. Colour-coded choropleth map based on registered Land Registry transactions.",
};

export default function MapPage() {
  return (
    <main
      className="flex min-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden md:min-h-[calc(100dvh-4rem)]"
      aria-labelledby="map-page-heading"
    >
      {/* Visually-hidden page heading for screen readers */}
      <h1 id="map-page-heading" className="sr-only">
        UK Property Price Map
      </h1>

      {/* Slim breadcrumb bar */}
      <nav
        aria-label="Breadcrumb"
        className="flex shrink-0 items-center gap-2 border-b border-[#E2E2E8] bg-white px-4 py-2"
      >
        <Link
          href="/search"
          className="flex items-center gap-1 font-sans text-xs text-[#7A7A88] hover:text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <ArrowLeft className="size-3" aria-hidden="true" />
          Search
        </Link>
        <span className="font-sans text-xs text-[#C4C4CE]" aria-hidden="true">
          /
        </span>
        <span className="font-sans text-xs font-medium text-[#2E2E33]">
          Price Map
        </span>
      </nav>

      {/* Full-height explorer */}
      <section
        aria-label="National price map"
        className="min-h-0 flex-1"
      >
        <MarketMapExplorerLoader initialScaleMode="national" />
      </section>
    </main>
  );
}
