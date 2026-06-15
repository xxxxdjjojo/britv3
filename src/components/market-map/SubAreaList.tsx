import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatPounds } from "@/lib/market-map/format";
import { cn } from "@/lib/utils";
import type { MarketMapFeatureProperties } from "@/types/market-map";

type Props = Readonly<{
  /** Already ranked cheapest → most expensive by the caller. */
  areas: MarketMapFeatureProperties[];
  selectedAreaId: string | null;
  onSelect: (areaId: string | null) => void;
}>;

/** Ranked list of postcode districts for the results panel. */
export function SubAreaList({ areas, selectedAreaId, onSelect }: Props) {
  if (areas.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-muted-foreground">
        No areas with registered sales in this window.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {areas.map((area) => {
        const insufficient = area.confidence === "Insufficient";
        const selected = area.area_id === selectedAreaId;
        return (
          <li key={area.area_id}>
            <button
              type="button"
              onClick={() => onSelect(selected ? null : area.area_id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                selected ? "bg-primary/10" : "hover:bg-muted",
              )}
            >
              <span
                className="h-8 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: area.fill_colour }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-heading text-sm font-semibold">
                    {area.area_name}
                  </span>
                  <span className="font-heading text-sm font-bold">
                    {insufficient ? "—" : formatPounds(area.median_price)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="text-[0.7rem] text-muted-foreground">
                    {area.transaction_count.toLocaleString("en-GB")} sales
                  </span>
                  <ConfidenceBadge confidence={area.confidence} className="scale-90" />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
