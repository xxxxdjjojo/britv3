"use client";

/**
 * MarketMapExplorerLoader — thin client wrapper that lazy-loads MarketMapExplorer.
 *
 * next/dynamic with `ssr: false` is only permitted in Client Components. The two
 * map pages (/search/map and /search/market-map/[areaId]) are Server Components
 * so they delegate the dynamic import to this client boundary instead.
 */

import dynamic from "next/dynamic";
import type { MarketMapScaleMode } from "@/services/market-map/types";

const MarketMapExplorer = dynamic(
  () =>
    import("./MarketMapExplorer").then((m) => ({ default: m.MarketMapExplorer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#E2E2E8]">
        <p className="font-sans text-sm text-[#7A7A88]">Loading price map…</p>
      </div>
    ),
  },
);

type Props = Readonly<{
  focusAreaId?: string | null;
  focusAreaName?: string | null;
  initialScaleMode?: MarketMapScaleMode;
}>;

export function MarketMapExplorerLoader(props: Props) {
  return <MarketMapExplorer {...props} />;
}
