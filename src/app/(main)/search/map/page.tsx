/**
 * Screen 1 — National Search Price Map
 * Route: /search/map
 *
 * Server component shell; client explorer is lazy-loaded.
 * URL state: property_type, months, scale_mode, area_id, q (via nuqs in MarketMapExplorer).
 */

import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Property Price Map — UK Median Sold Prices | Britestate",
  description:
    "Explore median sold prices across the UK by area. Colour-coded choropleth map based on registered Land Registry transactions.",
};

// Explorer is a client component — dynamic import prevents SSR of MapLibre
const MarketMapExplorer = dynamic(
  () =>
    import("@/components/market-map/MarketMapExplorer").then(
      (m) => ({ default: m.MarketMapExplorer }),
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#E2E2E8]">
        <p className="font-sans text-sm text-[#7A7A88]">Loading price map…</p>
      </div>
    ),
  },
);

export default function MapPage() {
  return (
    <main
      className="flex h-[calc(100vh-var(--header-height,64px))] flex-col overflow-hidden"
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
          className="flex items-center gap-1 font-sans text-xs text-[#7A7A88] hover:text-[#1B4D3E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
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
        <MarketMapExplorer initialScaleMode="national" />
      </section>
    </main>
  );
}
