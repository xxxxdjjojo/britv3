import { X } from "lucide-react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatPounds, formatMonthRange } from "@/lib/market-map/format";
import type { MarketMapFeatureProperties } from "@/types/market-map";

type Props = Readonly<{
  properties: MarketMapFeatureProperties;
  onClose?: () => void;
  className?: string;
}>;

/**
 * Detail card for a selected/hovered postcode district: area name, median sold
 * price, transaction count, date window, property-type mix and confidence.
 */
export function AreaCard({ properties, onClose, className }: Props) {
  const insufficient = properties.confidence === "Insufficient";
  const mix = Object.entries(properties.type_mix).sort((a, b) => b[1] - a[1]);

  return (
    <div
      className={`rounded-xl bg-background/95 p-4 shadow-[0_20px_50px_rgba(26,28,28,0.14)] backdrop-blur-md ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Postcode district
          </p>
          <h3 className="font-heading text-lg font-bold leading-tight">
            {properties.area_name}
          </h3>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {insufficient ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Insufficient data — fewer than 5 registered sales in this window.
        </p>
      ) : (
        <>
          <p className="mt-3 font-heading text-2xl font-bold">
            {formatPounds(properties.median_price)}
          </p>
          <p className="text-xs text-muted-foreground">
            Median sold price · {properties.transaction_count.toLocaleString("en-GB")} sales
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Typical range {formatPounds(properties.p10_price)} – {formatPounds(properties.p90_price)}
          </p>
          {mix.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mix.map(([label, count]) => (
                <span
                  key={label}
                  className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] text-foreground/80"
                >
                  {label} {count.toLocaleString("en-GB")}
                </span>
              ))}
            </div>
          ) : null}
        </>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <ConfidenceBadge confidence={properties.confidence} />
        <span className="text-[0.7rem] text-muted-foreground">
          {formatMonthRange(properties.date_from, properties.date_to)}
        </span>
      </div>
    </div>
  );
}
