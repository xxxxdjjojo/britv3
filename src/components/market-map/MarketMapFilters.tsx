/**
 * MarketMapFilters — controlled filter panel for the price map.
 *
 * Controls per DESIGN.md §3:
 * - Property type chip group (all / detached / semi-detached / terraced / flat)
 * - Date window chip group (12 / 24 / 36 / 60 months)
 * - Metric dropdown (static, disabled — "Median sold price" only)
 * - Scale toggle (Local / National) with active-scale indicator
 *
 * Excluded per DESIGN.md §3.3: square footage, price range, bedrooms, amenities.
 */

"use client";

import { cn } from "@/lib/utils";
import type { MarketMapScaleMode } from "@/services/market-map/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PropertyTypeFilter =
  | "all"
  | "detached"
  | "semi-detached"
  | "terraced"
  | "flat";

export type DateWindowMonths = 12 | 24 | 36 | 60;

type Props = Readonly<{
  propertyType: PropertyTypeFilter;
  months: DateWindowMonths;
  scaleMode: MarketMapScaleMode;
  onPropertyTypeChange: (v: PropertyTypeFilter) => void;
  onMonthsChange: (v: DateWindowMonths) => void;
  onScaleModeChange: (v: MarketMapScaleMode) => void;
  /** When true, show "Exploring: <areaName>" header instead of generic header. */
  focusAreaName?: string | null;
  /** Callback for Apply Filters button. */
  onApply?: () => void;
}>;

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

const PROPERTY_TYPE_OPTIONS: { value: PropertyTypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "detached", label: "Detached" },
  { value: "semi-detached", label: "Semi-detached" },
  { value: "terraced", label: "Terraced" },
  { value: "flat", label: "Flat / apartment" },
];

const DATE_WINDOW_OPTIONS: { value: DateWindowMonths; label: string }[] = [
  { value: 12, label: "Last 12 months" },
  { value: 24, label: "Last 24 months" },
  { value: 36, label: "Last 3 years" },
  { value: 60, label: "Last 5 years" },
];

// ---------------------------------------------------------------------------
// ChipButton — single selectable chip
// ---------------------------------------------------------------------------

function ChipButton({
  active,
  onClick,
  children,
}: Readonly<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-md)] border px-3 py-1.5 text-sm font-medium",
        "transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E] focus-visible:ring-offset-1",
        active
          ? "border-[#1B4D3E] bg-white text-[#1B4D3E] shadow-[var(--shadow-sm)]"
          : "border-transparent bg-transparent text-[#46464F] hover:bg-[#E8F5EE] hover:text-[#003629]",
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// FilterSection heading
// ---------------------------------------------------------------------------

function FilterHeading({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="font-sans text-sm font-medium text-[#46464F]">{children}</p>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarketMapFilters({
  propertyType,
  months,
  scaleMode,
  onPropertyTypeChange,
  onMonthsChange,
  onScaleModeChange,
  focusAreaName,
  onApply,
}: Props) {
  return (
    <div className="flex h-full flex-col bg-[#F8F8FA]">
      {/* Panel header */}
      <div className="border-b border-[#E2E2E8] p-6 pb-4">
        <p className="font-heading text-base font-bold text-[#0A0A0B]">
          {focusAreaName ? `Exploring: ${focusAreaName}` : "Filters"}
        </p>
        <p className="mt-0.5 font-sans text-sm text-[#7A7A88]">
          {focusAreaName
            ? "Adjust the view for this area"
            : "Refine the price map"}
        </p>
      </div>

      {/* Scrollable filter body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-y-8">
          {/* Property Type */}
          <fieldset>
            <legend className="mb-3">
              <FilterHeading>Property Type</FilterHeading>
            </legend>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Property type"
            >
              {PROPERTY_TYPE_OPTIONS.map((opt) => (
                <ChipButton
                  key={opt.value}
                  active={propertyType === opt.value}
                  onClick={() => onPropertyTypeChange(opt.value)}
                >
                  {opt.label}
                </ChipButton>
              ))}
            </div>
          </fieldset>

          {/* Date Window */}
          <fieldset>
            <legend className="mb-3">
              <FilterHeading>Date Window</FilterHeading>
            </legend>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Date window"
            >
              {DATE_WINDOW_OPTIONS.map((opt) => (
                <ChipButton
                  key={opt.value}
                  active={months === opt.value}
                  onClick={() => onMonthsChange(opt.value)}
                >
                  {opt.label}
                </ChipButton>
              ))}
            </div>
          </fieldset>

          {/* Metric — static, disabled */}
          <div>
            <FilterHeading>Metric</FilterHeading>
            <div className="mt-3">
              <div
                className={cn(
                  "flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[#E2E2E8]",
                  "cursor-not-allowed bg-white px-4 py-2.5 text-sm text-[#46464F] opacity-70",
                )}
                aria-disabled="true"
                title="Only median sold price is available. Floor-area metrics are not yet available."
              >
                <span className="font-medium">Median sold price</span>
                <span className="text-xs text-[#7A7A88]">Only option</span>
              </div>
            </div>
          </div>

          {/* Scale */}
          <div>
            <FilterHeading>Scale</FilterHeading>
            <p className="mt-0.5 font-sans text-xs text-[#7A7A88]">
              How colour buckets are computed
            </p>
            <div
              className="mt-3 flex rounded-[var(--radius-md)] border border-[#E2E2E8] bg-white p-1"
              role="group"
              aria-label="Scale mode"
            >
              {(["local", "national"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onScaleModeChange(mode)}
                  aria-pressed={scaleMode === mode}
                  className={cn(
                    "flex-1 rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-sm font-medium capitalize",
                    "transition-all duration-300",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E] focus-visible:ring-offset-1",
                    scaleMode === mode
                      ? "bg-[#1B4D3E] text-white shadow-[var(--shadow-sm)]"
                      : "text-[#46464F] hover:text-[#003629]",
                  )}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            {/* Active scale indicator */}
            <p className="mt-2 font-sans text-xs font-medium text-[#1B4D3E]">
              Scale:{" "}
              {scaleMode === "national" ? "National" : "Local"} comparison
            </p>
          </div>
        </div>
      </div>

      {/* Apply button */}
      <div className="border-t border-[#E2E2E8] p-6 pt-4">
        <button
          type="button"
          onClick={onApply}
          className={cn(
            "w-full rounded-[var(--radius-md)] bg-[#1B4D3E] px-4 py-3",
            "font-sans text-sm font-semibold text-white",
            "transition-colors duration-150 hover:bg-[#003629]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E] focus-visible:ring-offset-2",
          )}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
