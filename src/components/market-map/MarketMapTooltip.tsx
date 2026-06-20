"use client";

/**
 * Tooltip shown on hover over a choropleth area.
 * Rendered inside a @vis.gl/react-maplibre <Popup> (portal).
 *
 * Deliberately minimal for a normal user browsing for a home or an area:
 *   heading (postcode / town / neighbourhood — never a raw ONS code) +
 *   median sold price + a single "n recent sales" line.
 *
 * The old card showed the raw area code, confidence, national/local "scale" and
 * a property-type breakdown — jargon that meant nothing to end users. That rich
 * detail now lives in the right-hand panel on click. Never shows £/m².
 */

import { humanizeAreaName } from "@/lib/market-map/labels";
import type { MarketMapFeatureProperties } from "@/services/market-map/types";

function formatPrice(pounds: number): string {
  return `£${pounds.toLocaleString("en-GB")}`;
}

export type MarketMapTooltipProps = Readonly<{
  properties: MarketMapFeatureProperties;
}>;

export function MarketMapTooltip({ properties }: MarketMapTooltipProps) {
  const {
    area_name,
    geography_level,
    median_price,
    transaction_count,
    confidence,
  } = properties;

  const heading = humanizeAreaName(area_name, geography_level);
  const insufficient = confidence === "Insufficient" || median_price <= 0;

  return (
    <div className="min-w-[160px] max-w-[240px] rounded-lg bg-white p-3 font-sans shadow-lg">
      <p
        className="mb-1.5 text-sm font-bold leading-tight"
        style={{ color: "var(--color-brand-primary-dark, #003629)" }}
      >
        {heading}
      </p>

      <p
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: "var(--color-neutral-500, #7A7A88)" }}
      >
        Median sold price
      </p>

      {insufficient ? (
        <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--color-neutral-500, #7A7A88)" }}>
          Not enough recent sales
        </p>
      ) : (
        <>
          <p
            className="text-lg font-bold leading-tight"
            style={{ color: "var(--color-brand-primary-dark, #003629)" }}
          >
            {formatPrice(median_price)}
          </p>
          <p className="mt-1 text-[11px]" style={{ color: "var(--color-neutral-500, #7A7A88)" }}>
            {transaction_count.toLocaleString("en-GB")} recent{" "}
            {transaction_count === 1 ? "sale" : "sales"}
          </p>
        </>
      )}
    </div>
  );
}
