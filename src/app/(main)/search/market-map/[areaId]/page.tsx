/**
 * Screen 2 — Area Price Explorer
 * Route: /search/market-map/[areaId]
 *
 * Server component reads the areaId param and passes it to the client explorer.
 * The explorer fetches the area's bbox from /api/market-search on mount and
 * flies the map to it. Scale defaults to "local" per DESIGN.md §11.
 *
 * areaId examples: "SW1A", "kensington-and-chelsea", "E01000001"
 */

import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ---------------------------------------------------------------------------
// Metadata — resolved server-side from the areaId segment
// ---------------------------------------------------------------------------

type RouteParams = { params: Promise<{ areaId: string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { areaId } = await params;
  // Decode and humanise: "kensington-and-chelsea" → "Kensington And Chelsea"
  const humanName = decodeURIComponent(areaId)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${humanName} Property Prices — Median Sold Prices | Britestate`,
    description: `Explore median sold prices in ${humanName}. Sub-area breakdown based on registered Land Registry transactions.`,
  };
}

// ---------------------------------------------------------------------------
// Explorer (client component, lazy-loaded)
// ---------------------------------------------------------------------------

const MarketMapExplorer = dynamic(
  () =>
    import("@/components/market-map/MarketMapExplorer").then(
      (m) => ({ default: m.MarketMapExplorer }),
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#E2E2E8]">
        <p className="font-sans text-sm text-[#7A7A88]">Loading area map…</p>
      </div>
    ),
  },
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AreaMapPage({ params }: RouteParams) {
  const { areaId } = await params;

  const humanName = decodeURIComponent(areaId)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <main
      className="flex h-[calc(100vh-var(--header-height,64px))] flex-col overflow-hidden"
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
          className="flex items-center gap-1 font-sans text-xs text-[#7A7A88] hover:text-[#1B4D3E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          <ArrowLeft className="size-3" aria-hidden="true" />
          Search
        </Link>
        <span className="font-sans text-xs text-[#C4C4CE]" aria-hidden="true">
          /
        </span>
        <Link
          href="/search/map"
          className="font-sans text-xs text-[#7A7A88] hover:text-[#1B4D3E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
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
        <MarketMapExplorer
          focusAreaId={areaId}
          focusAreaName={humanName}
          initialScaleMode="local"
        />
      </section>
    </main>
  );
}
