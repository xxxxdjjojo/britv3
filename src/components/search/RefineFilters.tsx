"use client";

/**
 * "Refine your search" — the right-hand 420px filter aside for the Stitch
 * search layout. Fully controlled by the page's SearchState; every change is
 * pushed up via onChange so the page can sync URL + results + map.
 */

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BedroomOption, SearchState, SoldWithin } from "@/lib/search/url-state";
import { BEDROOM_OPTIONS } from "@/lib/search/url-state";

export const PROPERTY_TYPE_OPTIONS = [
  "Detached",
  "Semi-detached",
  "Terraced",
  "Flat",
  "Bungalow",
] as const;

const SOLD_WITHIN_OPTIONS: ReadonlyArray<{ value: SoldWithin; label: string }> = [
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
  { value: "all", label: "Show all" },
];

type RefineFiltersProps = Readonly<{
  state: SearchState;
  onChange: (patch: Partial<SearchState>) => void;
  onSubmit: () => void;
  onClear: () => void;
}>;

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

const BEDS_RANK: Record<string, number> = {
  Any: 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5+": 5,
};

function clampBedrooms(
  min: BedroomOption,
  max: BedroomOption,
): { bedsMin: BedroomOption; bedsMax: BedroomOption } {
  if (min === "Any" || max === "Any") return { bedsMin: min, bedsMax: max };
  return BEDS_RANK[min] > BEDS_RANK[max]
    ? { bedsMin: min, bedsMax: min }
    : { bedsMin: min, bedsMax: max };
}

export function RefineFilters({
  state,
  onChange,
  onSubmit,
  onClear,
}: RefineFiltersProps) {
  return (
    <form
      data-testid="refine-filters"
      onSubmit={(e) => {
        e.preventDefault();
        const clamped = clampBedrooms(state.bedsMin, state.bedsMax);
        if (clamped.bedsMax !== state.bedsMax) {
          onChange({ bedsMax: clamped.bedsMax });
        }
        onSubmit();
      }}
      className="space-y-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm lg:p-8"
    >
      <h2 className="font-heading text-xl font-extrabold tracking-tight text-neutral-900">
        Refine your search
      </h2>

      {/* Location */}
      <div className="space-y-3">
        <label
          htmlFor="refine-location"
          className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500"
        >
          Location
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />
          <input
            id="refine-location"
            type="text"
            value={state.q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Search area, city or street…"
            className="h-12 w-full rounded-lg border-none bg-neutral-50 pl-10 pr-4 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
      </div>

      {/* Property Type chips */}
      <fieldset className="space-y-3">
        <legend className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Property Type
        </legend>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPE_OPTIONS.map((type) => {
            const active = state.propertyType.includes(type);
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange({ propertyType: toggle(state.propertyType, type) })
                }
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-bold transition-all",
                  active
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-primary hover:text-brand-primary",
                )}
              >
                {type}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Sold within the last few — Land Registry */}
      <fieldset className="space-y-3">
        <legend className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Sold within the last few
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {SOLD_WITHIN_OPTIONS.map(({ value, label }) => {
            const active = state.soldWithin === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-colors",
                  active
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
                )}
              >
                <input
                  type="radio"
                  name="refine-sold-within"
                  value={value}
                  checked={active}
                  onChange={() => onChange({ soldWithin: value })}
                  className="size-4 accent-brand-primary"
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Price Range */}
      <fieldset className="space-y-3">
        <legend className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Price Range (£)
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            inputMode="numeric"
            aria-label="Minimum price"
            value={state.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
            placeholder="No min"
            className="h-11 w-full rounded-lg border-none bg-neutral-50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <input
            type="number"
            inputMode="numeric"
            aria-label="Maximum price"
            value={state.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
            placeholder="No max"
            className="h-11 w-full rounded-lg border-none bg-neutral-50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
      </fieldset>

      {/* Living Area (sqft) */}
      <fieldset className="space-y-3">
        <legend className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Living Area (sqft)
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            inputMode="numeric"
            aria-label="Minimum living area"
            value={state.minSqft}
            onChange={(e) => onChange({ minSqft: e.target.value })}
            placeholder="No min"
            className="h-11 w-full rounded-lg border-none bg-neutral-50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <input
            type="number"
            inputMode="numeric"
            aria-label="Maximum living area"
            value={state.maxSqft}
            onChange={(e) => onChange({ maxSqft: e.target.value })}
            placeholder="No max"
            className="h-11 w-full rounded-lg border-none bg-neutral-50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
      </fieldset>

      {/* Bedrooms — Min / Max */}
      <div className="space-y-3">
        <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Bedrooms
        </span>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <select
            id="refine-beds-min"
            aria-label="Min bedrooms"
            value={state.bedsMin}
            onChange={(e) =>
              onChange({ bedsMin: e.target.value as BedroomOption })
            }
            className="h-11 w-full cursor-pointer rounded-lg border-none bg-neutral-50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {BEDROOM_OPTIONS.map((opt) => (
              <option key={`min-${opt}`} value={opt}>
                {opt === "Any" ? "Min" : opt}
              </option>
            ))}
          </select>
          <span className="text-sm font-bold text-neutral-400" aria-hidden="true">
            —
          </span>
          <select
            id="refine-beds-max"
            aria-label="Max bedrooms"
            value={state.bedsMax}
            onChange={(e) =>
              onChange({ bedsMax: e.target.value as BedroomOption })
            }
            className="h-11 w-full cursor-pointer rounded-lg border-none bg-neutral-50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {BEDROOM_OPTIONS.map((opt) => (
              <option key={`max-${opt}`} value={opt}>
                {opt === "Any" ? "Max" : opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NOTE: a "Must-haves" (Garden/Parking/…) control intentionally omitted —
          there is no end-to-end predicate for it yet (no query/mock filter), and
          we do not ship a filter that silently does nothing. Re-add it together
          with its query predicate + test. */}

      {/* Actions */}
      <div className="space-y-4 pt-2">
        <button
          type="submit"
          className="flex h-14 w-full items-center justify-center gap-3 rounded-lg bg-brand-primary text-base font-extrabold text-white shadow-lg transition-colors hover:bg-brand-primary/90"
        >
          Search
          <Search className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onClear}
          className="w-full text-center text-[11px] font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:text-brand-primary"
        >
          Clear All Filters
        </button>
      </div>
    </form>
  );
}
