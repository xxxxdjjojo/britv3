"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { PriceLegend } from "./PriceLegend";
import { AreaCard } from "./AreaCard";
import type {
  MarketMapFeatureCollection,
  MarketMapFeatureProperties,
} from "@/types/market-map";

const MarketMap = dynamic(() => import("./MarketMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
});

type Props = Readonly<{
  data: MarketMapFeatureCollection;
  scaleLabel: string;
}>;

/** Borough-focused interactive choropleth for the area explorer screen. */
export function AreaExplorerMap({ data, scaleLabel }: Props) {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);

  const activeId = selectedAreaId ?? hoveredAreaId;
  const activeArea: MarketMapFeatureProperties | null = useMemo(
    () => data.features.find((f) => f.properties.area_id === activeId)?.properties ?? null,
    [data, activeId],
  );

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl">
      <MarketMap
        data={data}
        selectedAreaId={selectedAreaId}
        onSelectArea={setSelectedAreaId}
        onHoverArea={setHoveredAreaId}
      />
      <div className="pointer-events-none absolute bottom-3 left-3 z-10">
        <PriceLegend scaleLabel={scaleLabel} />
      </div>
      {activeArea ? (
        <div className="absolute right-3 top-3 z-10 w-64 max-w-[calc(100%-1.5rem)]">
          <AreaCard
            properties={activeArea}
            onClose={selectedAreaId ? () => setSelectedAreaId(null) : undefined}
          />
        </div>
      ) : null}
    </div>
  );
}
