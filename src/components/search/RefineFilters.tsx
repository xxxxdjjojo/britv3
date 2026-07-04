"use client";

/**
 * "Refine your search" — the right-hand 420px filter aside for the Stitch
 * search layout. Fully controlled by the page's SearchState; every change is
 * pushed up via onChange so the page can sync URL + results + map.
 */

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BedroomOption,
  Furnishing,
  SearchState,
  SoldWithin,
  TriState,
} from "@/lib/search/url-state";
import { BEDROOM_OPTIONS, COUNCIL_TAX_BANDS } from "@/lib/search/url-state";

export const PROPERTY_TYPE_OPTIONS = [
  "Detached",
  "Semi-detached",
  "Terraced",
  "Flat",
  "Bungalow",
] as const;

/**
 * Amenity slugs must match the values produced by `mockAmenities` in
 * lib/mock-data/listings.ts (and the future search_listings amenity column).
 */
export const AMENITY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "garden", label: "Garden" },
  { value: "parking", label: "Parking" },
  { value: "balcony", label: "Balcony" },
  { value: "lift", label: "Lift" },
  { value: "gym", label: "Gym" },
  { value: "pool", label: "Pool" },
  { value: "in_unit_laundry", label: "In-unit laundry" },
  { value: "dishwasher", label: "Dishwasher" },
  { value: "broadband", label: "High-speed broadband" },
  { value: "ev_charging", label: "EV charging" },
  { value: "step_free", label: "Step-free access" },
  { value: "concierge", label: "Concierge" },
];

const SOLD_WITHIN_OPTIONS: ReadonlyArray<{ value: SoldWithin; label: string }> = [
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
  { value: "all", label: "Show all" },
];

const FURNISHING_OPTIONS: ReadonlyArray<{ value: Furnishing; label: string }> = [
  { value: "any", label: "Any" },
  { value: "furnished", label: "Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "part_furnished", label: "Part furnished" },
];

const TRI_STATE_OPTIONS: ReadonlyArray<{ value: TriState; label: string }> = [
  { value: "any", label: "Any" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

type RefineFiltersProps = Readonly<{
  state: SearchState;
  onChange: (patch: Partial<SearchState>) => void;
  onSubmit: () => void;
  onClear: () => void;
  /** When true, hides the Search submit and Clear All buttons at the bottom.
   *  Used when RefineFilters is rendered inside a sheet with its own Apply footer. */
  hideActions?: boolean;
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

type TriStateGroupProps = Readonly<{
  legend: string;
  name: string;
  value: TriState;
  onSelect: (value: TriState) => void;
}>;

/** Any / Yes / No radio group, styled like the Sold-within group. */
function TriStateGroup({ legend, name, value, onSelect }: TriStateGroupProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
        {legend}
      </legend>
      <div className="grid grid-cols-3 gap-2">
        {TRI_STATE_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-colors",
                active
                  ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={active}
                onChange={() => onSelect(opt.value)}
                className="size-4 accent-brand-primary"
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function RefineFilters({
  state,
  onChange,
  onSubmit,
  onClear,
  hideActions = false,
}: RefineFiltersProps) {
  const isRent = state.listingType === "rent";
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
            className="h-12 w-full rounded-lg border-none bg-neutral-50 pl-10 pr-4 text-base md:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
      </div>

      {/* Keywords — free-text match across address, type, furnishing & amenities */}
      <div className="space-y-3">
        <label
          htmlFor="refine-keywords"
          className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500"
        >
          Keywords
        </label>
        <input
          id="refine-keywords"
          type="text"
          value={state.keywords}
          onChange={(e) => onChange({ keywords: e.target.value })}
          placeholder="e.g. balcony, furnished, garden…"
          className="h-11 w-full rounded-lg border-none bg-neutral-50 px-3 text-base md:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
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
                  "min-h-11 rounded-full border px-4 py-2 text-xs font-bold transition-all",
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

      {/* Sold within the last few — Land Registry (sale-oriented; hidden for rent) */}
      {!isRent && (
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
      )}

      {/* Lettings — rent-only, in the same slot the Sold-within group occupies for sale */}
      {isRent && (
        <fieldset className="space-y-6">
          <legend className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            Lettings
          </legend>

          {/* Furnishing */}
          <div className="space-y-3">
            <label
              htmlFor="refine-furnishing"
              className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500"
            >
              Furnishing
            </label>
            <select
              id="refine-furnishing"
              value={state.furnishing}
              onChange={(e) =>
                onChange({ furnishing: e.target.value as Furnishing })
              }
              className="h-11 w-full cursor-pointer rounded-lg border-none bg-neutral-50 px-3 text-base md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {FURNISHING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bills included */}
          <TriStateGroup
            legend="Bills included"
            name="refine-bills-included"
            value={state.billsIncluded}
            onSelect={(value) => onChange({ billsIncluded: value })}
          />

          {/* Pets */}
          <TriStateGroup
            legend="Pets"
            name="refine-pets-allowed"
            value={state.petsAllowed}
            onSelect={(value) => onChange({ petsAllowed: value })}
          />

          {/* Students */}
          <TriStateGroup
            legend="Students"
            name="refine-students-welcome"
            value={state.studentsWelcome}
            onSelect={(value) => onChange({ studentsWelcome: value })}
          />

          {/* Available from */}
          <div className="space-y-3">
            <label
              htmlFor="refine-available-from"
              className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500"
            >
              Available from
            </label>
            <input
              id="refine-available-from"
              type="date"
              value={state.availableFrom}
              onChange={(e) => onChange({ availableFrom: e.target.value })}
              className="h-11 w-full rounded-lg border-none bg-neutral-50 px-3 text-base md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Max. minimum tenancy */}
          <div className="space-y-2">
            <label
              htmlFor="refine-min-tenancy"
              className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500"
            >
              Max. minimum tenancy (months)
            </label>
            <input
              id="refine-min-tenancy"
              type="number"
              inputMode="numeric"
              min="1"
              value={state.minTenancyMonths}
              onChange={(e) => onChange({ minTenancyMonths: e.target.value })}
              placeholder="No max"
              className="h-11 w-full rounded-lg border-none bg-neutral-50 px-3 text-base md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <p className="text-xs font-medium text-neutral-500">
              Show lets requiring no more than this many months.
            </p>
          </div>

          {/* Short-term let */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm font-bold text-neutral-600 transition-colors hover:border-neutral-300">
            <input
              type="checkbox"
              checked={state.shortTermLet}
              onChange={(e) => onChange({ shortTermLet: e.target.checked })}
              className="size-4 accent-brand-primary"
            />
            <span>Short-term let available</span>
          </label>

          {/* Let agreed */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm font-bold text-neutral-600 transition-colors hover:border-neutral-300">
            <input
              type="checkbox"
              checked={state.letAgreed === "exclude"}
              onChange={(e) =>
                onChange({ letAgreed: e.target.checked ? "exclude" : "include" })
              }
              className="size-4 accent-brand-primary"
            />
            <span>Hide let-agreed listings</span>
          </label>
        </fieldset>
      )}

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
            className="h-11 w-full rounded-lg border-none bg-neutral-50 px-3 text-base md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <input
            type="number"
            inputMode="numeric"
            aria-label="Maximum price"
            value={state.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
            placeholder="No max"
            className="h-11 w-full rounded-lg border-none bg-neutral-50 px-3 text-base md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
            className="h-11 w-full rounded-lg border-none bg-neutral-50 px-3 text-base md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <input
            type="number"
            inputMode="numeric"
            aria-label="Maximum living area"
            value={state.maxSqft}
            onChange={(e) => onChange({ maxSqft: e.target.value })}
            placeholder="No max"
            className="h-11 w-full rounded-lg border-none bg-neutral-50 px-3 text-base md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
            className="h-11 w-full cursor-pointer rounded-lg border-none bg-neutral-50 px-3 text-base md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
            className="h-11 w-full cursor-pointer rounded-lg border-none bg-neutral-50 px-3 text-base md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {BEDROOM_OPTIONS.map((opt) => (
              <option key={`max-${opt}`} value={opt}>
                {opt === "Any" ? "Max" : opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Amenities & features — multi-select, backed by listing.amenities */}
      <fieldset className="space-y-3">
        <legend className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Amenities &amp; features
        </legend>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map(({ value, label }) => {
            const active = state.mustHaves.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ mustHaves: toggle(state.mustHaves, value) })}
                className={cn(
                  "min-h-11 rounded-full border px-4 py-2 text-xs font-bold transition-all",
                  active
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-primary hover:text-brand-primary",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Council tax band — multi-select A–H */}
      <fieldset className="space-y-3">
        <legend className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Council tax band
        </legend>
        <div className="flex flex-wrap gap-2">
          {COUNCIL_TAX_BANDS.map((band) => {
            const active = state.councilTaxBands.includes(band);
            return (
              <button
                key={band}
                type="button"
                aria-pressed={active}
                aria-label={`Council tax band ${band}`}
                onClick={() =>
                  onChange({ councilTaxBands: toggle(state.councilTaxBands, band) })
                }
                className={cn(
                  "size-11 rounded-lg border text-sm font-bold transition-all",
                  active
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-primary hover:text-brand-primary",
                )}
              >
                {band}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Actions — hidden when rendered inside a sheet with its own Apply footer */}
      {!hideActions && (
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
      )}
    </form>
  );
}
