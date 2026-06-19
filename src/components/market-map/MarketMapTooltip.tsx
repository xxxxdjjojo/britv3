"use client";

/**
 * Tooltip shown on hover over a choropleth area.
 * Rendered inside a @vis.gl/react-maplibre <Popup> (portal).
 *
 * Fields per DESIGN.md §9 (Area Detail Tooltip / Card — hover variant):
 *   area name, median sold price, transaction count, date window,
 *   property type mix (top types), confidence badge, scale mode.
 *
 * Never shows £/m² — DESIGN.md §1 (CRITICAL OVERRIDE #3).
 */

import { cn } from "@/lib/utils";
import type { MarketMapFeatureProperties } from "@/services/market-map/types";

// ---------------------------------------------------------------------------
// Confidence badge colour mapping
// ---------------------------------------------------------------------------

const CONFIDENCE_COLOURS: Record<string, string> = {
  High: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-neutral-100 text-neutral-700",
  Insufficient: "bg-neutral-100 text-neutral-500",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(pounds: number): string {
  return `£${pounds.toLocaleString("en-GB")}`;
}

function formatDateWindow(dateFrom: string, dateTo: string): string {
  const fmt = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  };
  return `${fmt(dateFrom)} – ${fmt(dateTo)}`;
}

/** Returns the top property types by count, up to maxTypes entries. */
function topPropertyTypes(
  mix: Record<string, number>,
  maxTypes = 3,
): Array<{ type: string; count: number }> {
  return Object.entries(mix)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxTypes)
    .map(([type, count]) => ({ type, count }));
}

function toDisplayType(key: string): string {
  const map: Record<string, string> = {
    detached: "Detached",
    "semi-detached": "Semi-detached",
    terraced: "Terraced",
    flat: "Flat",
    other: "Other",
  };
  return map[key] ?? key;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type MarketMapTooltipProps = Readonly<{
  properties: MarketMapFeatureProperties;
}>;

/**
 * Tooltip card for a hovered choropleth area.
 * Rendered inside a MapLibre Popup via portal — no need for z-index.
 */
export function MarketMapTooltip({ properties }: MarketMapTooltipProps) {
  const {
    area_name,
    median_price,
    transaction_count,
    date_from,
    date_to,
    property_type_mix,
    confidence,
    scale_mode,
  } = properties;

  const topTypes = topPropertyTypes(property_type_mix);
  const totalTransactions = Object.values(property_type_mix).reduce(
    (sum, n) => sum + n,
    0,
  );
  const confidenceClass = CONFIDENCE_COLOURS[confidence] ?? CONFIDENCE_COLOURS["Low"];

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px] font-sans text-xs">
      {/* Area name */}
      {area_name && (
        <p
          className="font-bold text-sm mb-2 leading-tight"
          style={{ fontFamily: "var(--font-plus-jakarta-sans, sans-serif)", color: "var(--color-brand-primary-dark, #003629)" }}
        >
          {area_name}
        </p>
      )}

      {/* Median sold price — label per DESIGN.md §9.1 */}
      <p className="uppercase tracking-wider font-bold mb-0.5" style={{ fontSize: "10px", color: "var(--color-neutral-500, #7A7A88)" }}>
        Median sold price
      </p>
      <p className="font-bold text-sm mb-2" style={{ color: "var(--color-brand-primary-dark, #003629)" }}>
        {formatPrice(median_price)}
      </p>

      {/* Divider */}
      <hr className="mb-2" style={{ borderColor: "var(--color-neutral-200, #E2E2E8)" }} />

      {/* Transaction count + date window */}
      <div className="flex justify-between mb-1">
        <span style={{ color: "var(--color-neutral-500, #7A7A88)" }}>Transactions</span>
        <span className="font-medium" style={{ color: "var(--color-neutral-800, #2E2E33)" }}>
          {transaction_count.toLocaleString("en-GB")}
        </span>
      </div>
      <div className="flex justify-between mb-2">
        <span style={{ color: "var(--color-neutral-500, #7A7A88)" }}>Period</span>
        <span className="font-medium" style={{ color: "var(--color-neutral-800, #2E2E33)" }}>
          {formatDateWindow(date_from, date_to)}
        </span>
      </div>

      {/* Property type mix */}
      {topTypes.length > 0 && (
        <>
          <hr className="mb-2" style={{ borderColor: "var(--color-neutral-200, #E2E2E8)" }} />
          <p className="uppercase tracking-wider font-bold mb-1" style={{ fontSize: "10px", color: "var(--color-neutral-500, #7A7A88)" }}>
            Type breakdown
          </p>
          <div className="space-y-0.5 mb-2">
            {topTypes.map(({ type, count }) => {
              const pct =
                totalTransactions > 0
                  ? Math.round((count / totalTransactions) * 100)
                  : 0;
              return (
                <div key={type} className="flex justify-between">
                  <span style={{ color: "var(--color-neutral-700, #46464F)" }}>
                    {toDisplayType(type)}
                  </span>
                  <span className="font-medium" style={{ color: "var(--color-neutral-800, #2E2E33)" }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Confidence + Scale */}
      <hr className="mb-2" style={{ borderColor: "var(--color-neutral-200, #E2E2E8)" }} />
      <div className="flex items-center justify-between">
        <span
          className={cn("rounded-full px-2 py-0.5 font-medium", confidenceClass)}
          style={{ fontSize: "10px" }}
        >
          {confidence} confidence
        </span>
        <span className="capitalize" style={{ fontSize: "10px", color: "var(--color-neutral-500, #7A7A88)" }}>
          {scale_mode === "national" ? "National" : "Local"} scale
        </span>
      </div>
    </div>
  );
}
