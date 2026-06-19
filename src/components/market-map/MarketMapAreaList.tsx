/**
 * MarketMapAreaList — ranked list of areas cheapest → most expensive.
 *
 * Per spec: sortable by median_price; click selects (drives map highlight).
 * Insufficient-data areas shown greyed at the bottom.
 */

"use client";

import { useMemo } from "react";
import { colourForBucket, INSUFFICIENT_COLOUR } from "@/lib/market-map/colour";
import { cn } from "@/lib/utils";
import type { MarketMapFeatureProperties } from "@/services/market-map/types";

type Props = Readonly<{
  features: MarketMapFeatureProperties[];
  selectedAreaId?: string | null;
  onSelect: (props: MarketMapFeatureProperties) => void;
}>;

function formatPrice(pounds: number): string {
  if (pounds >= 1_000_000) {
    return `£${(pounds / 1_000_000).toFixed(2)}m`;
  }
  return `£${pounds.toLocaleString("en-GB")}`;
}

const CONFIDENCE_DOT: Record<string, string> = {
  High: "bg-[#16A34A]",
  Medium: "bg-[#CA8A04]",
  Low: "bg-[#7A7A88]",
  Insufficient: "bg-[#9E9EAB]",
};

export function MarketMapAreaList({ features, selectedAreaId, onSelect }: Props) {
  const { priced, insufficient } = useMemo(() => {
    const p: MarketMapFeatureProperties[] = [];
    const i: MarketMapFeatureProperties[] = [];
    for (const f of features) {
      if (f.confidence === "Insufficient" || f.colour_bucket === null) {
        i.push(f);
      } else {
        p.push(f);
      }
    }
    p.sort((a, b) => a.median_price - b.median_price);
    return { priced: p, insufficient: i };
  }, [features]);

  if (features.length === 0) {
    return (
      <p className="font-sans text-xs text-[#7A7A88] px-1 py-2">
        No areas loaded yet. Pan or zoom the map.
      </p>
    );
  }

  function Row({ feature, rank }: { feature: MarketMapFeatureProperties; rank?: number }) {
    const isSelected = feature.area_id === selectedAreaId;
    const chipColour =
      feature.colour_bucket !== null
        ? colourForBucket(feature.colour_bucket)
        : INSUFFICIENT_COLOUR;
    const isInsufficient = feature.confidence === "Insufficient";

    return (
      <button
        type="button"
        onClick={() => onSelect(feature)}
        aria-pressed={isSelected}
        className={cn(
          "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left",
          "transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E] focus-visible:ring-offset-1",
          isSelected
            ? "bg-[#E8F5EE] ring-1 ring-[#1B4D3E]"
            : "hover:bg-[#F1F1F5]",
          isInsufficient && "opacity-50",
        )}
      >
        {/* Rank */}
        {rank !== undefined && (
          <span className="w-5 shrink-0 font-sans text-[10px] font-bold text-[#858593]">
            {rank}
          </span>
        )}

        {/* Colour chip */}
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-sm"
          style={{ backgroundColor: chipColour, opacity: isInsufficient ? 0.5 : 1 }}
          aria-hidden="true"
        />

        {/* Area name */}
        <span className="min-w-0 flex-1 truncate font-sans text-sm font-medium text-[#2E2E33]">
          {feature.area_name ?? feature.area_id}
        </span>

        {/* Confidence dot */}
        <span
          className={cn(
            "inline-block h-2 w-2 shrink-0 rounded-full",
            CONFIDENCE_DOT[feature.confidence] ?? "bg-[#9E9EAB]",
          )}
          aria-label={`Confidence: ${feature.confidence}`}
        />

        {/* Median price */}
        <span className="shrink-0 font-sans text-sm font-bold text-[#003629]">
          {isInsufficient ? "—" : formatPrice(feature.median_price)}
        </span>

        {/* Txn count */}
        <span className="shrink-0 font-sans text-[10px] text-[#7A7A88]">
          {feature.transaction_count.toLocaleString("en-GB")}
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {priced.map((f, idx) => (
        <Row key={f.area_id} feature={f} rank={idx + 1} />
      ))}

      {insufficient.length > 0 && (
        <>
          <p className="mt-3 mb-1 font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-[#858593] px-1">
            Insufficient data
          </p>
          {insufficient.map((f) => (
            <Row key={f.area_id} feature={f} />
          ))}
        </>
      )}
    </div>
  );
}
