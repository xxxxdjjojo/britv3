/**
 * MarketMapLegend — fixed horizontal pill floating above the map canvas.
 *
 * Layout per DESIGN.md §5:
 * - Label "MEDIAN SOLD PRICE" (10px Inter bold uppercase)
 * - Green→gold→burgundy gradient bar (48px wide, 8px tall)
 * - Separate grey swatch for insufficient data
 * - Hover expands to show swatch key labels
 * - Below the pill: MarketMapDisclaimer
 */

"use client";

import { useState } from "react";
import { colourForBucket, INSUFFICIENT_COLOUR } from "@/lib/market-map/colour";
import { MarketMapDisclaimer } from "./MarketMapDisclaimer";
import { cn } from "@/lib/utils";

// Build the gradient stops from the 9 canonical bucket colours
const GRADIENT_STOPS = [1, 5, 9].map((b) => colourForBucket(b));
const GRADIENT_CSS = `linear-gradient(to right, ${GRADIENT_STOPS.join(", ")})`;

type Props = Readonly<{
  /** Lowest median price in the current view (pounds). Omit when unknown. */
  loPrice?: number | null;
  /** Highest median price in the current view (pounds). Omit when unknown. */
  hiPrice?: number | null;
  className?: string;
}>;

function formatPrice(pounds: number): string {
  if (pounds >= 1_000_000) {
    return `£${(pounds / 1_000_000).toFixed(1)}m`;
  }
  return `£${pounds.toLocaleString("en-GB")}`;
}

export function MarketMapLegend({ loPrice, hiPrice, className }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      {/* Legend pill */}
      <div
        role="img"
        aria-label="Price map legend: green is lower median sold price, gold is middle range, burgundy is higher median sold price"
        className={cn(
          "relative flex items-center gap-6 rounded-[9999px] border border-white/20 px-6 py-3",
          "bg-white/90 shadow-[var(--shadow-xl)] backdrop-blur-sm",
          "cursor-default transition-all duration-200 ease-out",
        )}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={() => setExpanded(false)}
        tabIndex={0}
      >
        {/* Label */}
        <span
          className="font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-[#46464F]"
          aria-hidden="true"
        >
          Median sold price
        </span>

        {/* Gradient bar + price anchors */}
        <div className="flex items-center gap-2">
          {loPrice != null && (
            <span className="font-sans text-[11px] font-bold text-[#003629]">
              {formatPrice(loPrice)}
            </span>
          )}

          <div
            className="h-2 w-48 rounded-[9999px]"
            style={{ background: GRADIENT_CSS }}
            aria-hidden="true"
          />

          {hiPrice != null && (
            <>
              <span className="font-sans text-[10px] font-normal text-[#C4C4CE]">|</span>
              <span className="font-sans text-[11px] font-bold text-[#003629]">
                {formatPrice(hiPrice)}
              </span>
            </>
          )}
        </div>

        {/* Insufficient data swatch */}
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: INSUFFICIENT_COLOUR, opacity: 0.5 }}
            aria-hidden="true"
          />
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-[#46464F]">
            No data
          </span>
        </div>

        {/* Expanded hover overlay — swatch key labels */}
        {expanded && (
          <div
            className="absolute left-1/2 top-full mt-2 z-10 -translate-x-1/2 rounded-lg border border-[#E2E2E8] bg-white px-4 py-3 shadow-[var(--shadow-lg)]"
            aria-live="polite"
          >
            <ul className="flex flex-col gap-1.5">
              {[
                { bucket: 1, label: "Lower median sold price" },
                { bucket: 5, label: "Middle range" },
                { bucket: 9, label: "Higher median sold price" },
              ].map(({ bucket, label }) => (
                <li key={bucket} className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-5 rounded-sm"
                    style={{ backgroundColor: colourForBucket(bucket) }}
                    aria-hidden="true"
                  />
                  <span className="font-sans text-[11px] font-normal text-[#46464F]">
                    {label}
                  </span>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-5 rounded-sm"
                  style={{ backgroundColor: INSUFFICIENT_COLOUR, opacity: 0.5 }}
                  aria-hidden="true"
                />
                <span className="font-sans text-[11px] font-normal text-[#46464F]">
                  Insufficient data (&lt; 5 transactions)
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Disclaimer below pill */}
      <MarketMapDisclaimer className="max-w-xl text-center" />
    </div>
  );
}
