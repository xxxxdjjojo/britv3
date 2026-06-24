/**
 * MarketMapFilters — controlled filter panel for the price map.
 *
 * Slimmed to a single user-facing control: the property-type chip group
 * (all / detached / semi-detached / terraced / flat). The date window, metric,
 * and scale controls were removed — the map queries a fixed window (24 months)
 * and national scale, set by the Explorer and no longer surfaced here.
 *
 * Excluded by design: square footage, price range, bedrooms, amenities.
 */

"use client";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PropertyTypeFilter =
  | "all"
  | "detached"
  | "semi-detached"
  | "terraced"
  | "flat";

/**
 * Retained for the Explorer's internal (no-longer-user-facing) date-window
 * value that still parameterises the map query.
 */
export type DateWindowMonths = 12 | 24 | 36 | 60;

type Props = Readonly<{
  propertyType: PropertyTypeFilter;
  onPropertyTypeChange: (v: PropertyTypeFilter) => void;
  /** When set, show "Exploring: <areaName>" header instead of generic header. */
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
  onPropertyTypeChange,
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
