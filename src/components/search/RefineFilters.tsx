"use client";

/**
 * "Refine your search" — the right-hand 420px filter aside for the Stitch
 * search layout. Fully controlled by the page's SearchState; every change is
 * pushed up via onChange so the page can sync URL + results + map.
 */

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchState } from "@/lib/search/url-state";

export const PROPERTY_TYPE_OPTIONS = [
  "Detached",
  "Semi-detached",
  "Terraced",
  "Flat",
  "Bungalow",
] as const;

export const MUST_HAVE_OPTIONS = ["Garden", "Parking", "Garage", "Chain Free"] as const;

const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4", "5+"] as const;

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

      {/* Min Bedrooms */}
      <div className="space-y-3">
        <label
          htmlFor="refine-beds"
          className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500"
        >
          Min Bedrooms
        </label>
        <select
          id="refine-beds"
          value={state.beds}
          onChange={(e) => onChange({ beds: e.target.value })}
          className="h-11 w-full cursor-pointer rounded-lg border-none bg-neutral-50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          {BEDROOM_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "Any" ? "Any" : `${opt}+`}
            </option>
          ))}
        </select>
      </div>

      {/* Amenities / must-haves */}
      <fieldset className="space-y-3">
        <legend className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Must-haves
        </legend>
        <div className="flex flex-wrap gap-2">
          {MUST_HAVE_OPTIONS.map((amenity) => {
            const active = state.mustHaves.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange({ mustHaves: toggle(state.mustHaves, amenity) })
                }
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-bold transition-all",
                  active
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-primary hover:text-brand-primary",
                )}
              >
                {amenity}
              </button>
            );
          })}
        </div>
      </fieldset>

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
