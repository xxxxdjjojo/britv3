/**
 * Screen 2 — Area Price Explorer
 * Route: /search/market-map/[areaId]
 *
 * Server component reads the areaId param and passes it to the client explorer.
 * The explorer fetches the area's bbox from /api/market-search on mount and
 * flies the map to it. Scale defaults to "local" per DESIGN.md §11.
 *
 * The dynamic import (ssr:false) lives in MarketMapExplorerLoader (a Client
 * Component) because next/dynamic with ssr:false is not permitted directly
 * inside a Server Component.
 *
 * areaId examples: "SW1A", "kensington-and-chelsea", "E01000001"
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketMapExplorerLoader } from "@/components/market-map/MarketMapExplorerLoader";
import { resolveAreaName } from "@/services/market-map/area-name-service";
import { brandConfig } from "@/config/brand";

// ---------------------------------------------------------------------------
// Metadata — resolved server-side from the areaId segment
// ---------------------------------------------------------------------------

type RouteParams = { params: Promise<{ areaId: string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { areaId } = await params;
  // Resolve the area_id to its human name ("UB6 · Ealing", "Ealing", "SW1A"),
  // falling back to a humanised slug when no boundary row matches.
  const humanName = await resolveAreaName(areaId);

  return {
    title: `${humanName} Property Prices — Median Sold Prices | ${brandConfig.displayName}`,
    description: `Explore median sold prices in ${humanName}. Sub-area breakdown based on registered Land Registry transactions.`,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AreaMapPage({ params }: RouteParams) {
  const { areaId } = await params;

  const humanName = await resolveAreaName(areaId);

  return (
    <main
      className="flex min-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden md:min-h-[calc(100dvh-4rem)]"
      aria-labelledby="area-map-heading"
    >
      {/* Visually-hidden page heading */}
      <h1 id="area-map-heading" className="sr-only">
        {humanName} Property Price Explorer
      </h1>

      {/* Breadcrumb + area title bar */}
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
        <Link
          href="/search/map"
          className="font-sans text-xs text-[#7A7A88] hover:text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          Price Map
        </Link>
        <span className="font-sans text-xs text-[#C4C4CE]" aria-hidden="true">
          /
        </span>
        <span className="font-sans text-xs font-medium text-[#2E2E33]">
          {humanName}
        </span>
      </nav>

      {/* Explorer focused on this area — local scale by default */}
      <section
        aria-label={`${humanName} price explorer`}
        className="min-h-0 flex-1"
      >
        <MarketMapExplorerLoader
          focusAreaId={areaId}
          focusAreaName={humanName}
          initialScaleMode="local"
        />
      </section>
    </main>
  );
}
