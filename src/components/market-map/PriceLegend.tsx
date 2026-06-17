import { PRICE_RAMP, INSUFFICIENT_COLOUR } from "@/lib/market-map/constants";

interface Props {
  /** e.g. "Local scale · Wandsworth". */
  scaleLabel: string;
}

/**
 * Fixed legend for the price heatmap: light green (lower median sold price) →
 * deep green (higher), plus the insufficient-data swatch and the scale note.
 */
export function PriceLegend({ scaleLabel }: Props) {
  return (
    <div className="pointer-events-none select-none rounded-xl bg-background/85 p-3 shadow-[0_20px_50px_rgba(26,28,28,0.12)] backdrop-blur-md">
      <p className="mb-1.5 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Median sold price
      </p>
      <div className="flex h-2.5 w-44 overflow-hidden rounded-full">
        {PRICE_RAMP.map((colour) => (
          <span
            key={colour}
            className="h-full flex-1"
            style={{ backgroundColor: colour }}
          />
        ))}
      </div>
      <div className="mt-1 flex w-44 justify-between text-[0.65rem] text-muted-foreground">
        <span>Lower</span>
        <span>Higher</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: INSUFFICIENT_COLOUR }}
        />
        <span className="text-[0.65rem] text-muted-foreground">
          Insufficient data (&lt; 5 sales)
        </span>
      </div>
      <p className="mt-2 text-[0.65rem] font-medium text-foreground/70">
        {scaleLabel}
      </p>
    </div>
  );
}
