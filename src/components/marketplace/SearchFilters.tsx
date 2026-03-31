"use client";

import { useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ServiceCategory } from "@/types/marketplace";
import { CATEGORY_LABELS } from "@/lib/marketplace/category-labels";

const DISTANCE_OPTIONS = [
  { label: "Under 5 miles", value: 5 },
  { label: "Under 10 miles", value: 10 },
  { label: "Under 25 miles", value: 25 },
  { label: "Anywhere", value: 100 },
] as const;

const RATING_OPTIONS = [
  { label: "4.5+", value: 4.5 },
  { label: "4.0+", value: 4.0 },
  { label: "3.5+", value: 3.5 },
] as const;

const VERIFICATION_BADGE_OPTIONS = [
  { label: "Britestate Verified", value: "britestate_verified" },
  { label: "Background Checked", value: "background_checked" },
  { label: "Insured", value: "insured" },
] as const;

export type SearchFilterParams = {
  service_category?: ServiceCategory;
  postcode?: string;
  radius: number;
  min_rating?: number;
  search_query?: string;
  verification_badges?: string[];
  min_hourly_rate?: number;
  max_hourly_rate?: number;
};

type SearchFiltersProps = Readonly<{
  filters: SearchFilterParams;
  onChange: (filters: SearchFilterParams) => void;
  className?: string;
  hideCategoryFilter?: boolean;
}>;

export function SearchFilters({
  filters,
  onChange,
  className,
  hideCategoryFilter = false,
}: SearchFiltersProps) {
  const updateFilter = useCallback(
    <K extends keyof SearchFilterParams>(
      key: K,
      value: SearchFilterParams[K],
    ) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  const toggleRating = useCallback(
    (value: number) => {
      if (filters.min_rating === value) {
        updateFilter("min_rating", undefined);
      } else {
        updateFilter("min_rating", value);
      }
    },
    [filters.min_rating, updateFilter],
  );

  const toggleBadge = useCallback(
    (badge: string) => {
      const current = filters.verification_badges ?? [];
      const next = current.includes(badge)
        ? current.filter((b) => b !== badge)
        : [...current, badge];
      updateFilter("verification_badges", next.length > 0 ? next : undefined);
    },
    [filters.verification_badges, updateFilter],
  );

  const minRate = filters.min_hourly_rate ?? 20;
  const maxRate = filters.max_hourly_rate ?? 150;

  return (
    <div
      className={cn(
        "rounded-2xl bg-surface-container-low p-5 shadow-sm",
        className,
      )}
    >
      <div className="space-y-5">
        {/* Service Category */}
        {!hideCategoryFilter && (
          <div className="space-y-2">
            <label
              htmlFor="filter-category"
              className="text-xs font-medium text-muted-foreground"
            >
              Service
            </label>
            <select
              id="filter-category"
              value={filters.service_category ?? ""}
              onChange={(e) =>
                updateFilter(
                  "service_category",
                  (e.target.value || undefined) as ServiceCategory | undefined,
                )
              }
              className="h-9 w-full rounded-xl bg-surface text-sm text-brand-primary outline-none px-2.5 focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="">All services</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Postcode */}
        <div className="space-y-2">
          <label
            htmlFor="filter-postcode"
            className="text-xs font-medium text-muted-foreground"
          >
            Postcode
          </label>
          <Input
            id="filter-postcode"
            placeholder="e.g. SW1A 1AA"
            value={filters.postcode ?? ""}
            onChange={(e) =>
              updateFilter("postcode", e.target.value || undefined)
            }
          />
        </div>

        {/* Distance radio buttons */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Distance</p>
          <div className="flex flex-col gap-1.5">
            {DISTANCE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="filter-radius"
                  value={opt.value}
                  checked={filters.radius === opt.value}
                  onChange={() => updateFilter("radius", opt.value)}
                  className="accent-brand-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Rating pill buttons */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Minimum rating
          </p>
          <div className="flex flex-wrap gap-2">
            {RATING_OPTIONS.map((opt) => {
              const isActive = filters.min_rating === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleRating(opt.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-border bg-transparent text-foreground hover:border-brand-primary hover:text-brand-primary",
                  )}
                  aria-pressed={isActive}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Verification badge checkboxes */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Verification
          </p>
          <div className="flex flex-col gap-1.5">
            {VERIFICATION_BADGE_OPTIONS.map((opt) => {
              const checked = (filters.verification_badges ?? []).includes(
                opt.value,
              );
              return (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBadge(opt.value)}
                    className="accent-brand-primary"
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* Hourly rate range */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Hourly rate:{" "}
            <span className="font-semibold text-foreground">
              £{minRate}–£{maxRate}/hr
            </span>
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-min-rate"
                className="text-xs text-muted-foreground"
              >
                Min: £{minRate}
              </label>
              <input
                id="filter-min-rate"
                type="range"
                min={0}
                max={200}
                step={10}
                value={minRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateFilter("min_hourly_rate", val);
                  if (val > maxRate) {
                    updateFilter("max_hourly_rate", val);
                  }
                }}
                className="w-full accent-brand-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-max-rate"
                className="text-xs text-muted-foreground"
              >
                Max: £{maxRate}
              </label>
              <input
                id="filter-max-rate"
                type="range"
                min={0}
                max={200}
                step={10}
                value={maxRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateFilter("max_hourly_rate", val);
                  if (val < minRate) {
                    updateFilter("min_hourly_rate", val);
                  }
                }}
                className="w-full accent-brand-primary"
              />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <label
            htmlFor="filter-search"
            className="text-xs font-medium text-muted-foreground"
          >
            Keyword search
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="filter-search"
              placeholder="Search providers..."
              value={filters.search_query ?? ""}
              onChange={(e) =>
                updateFilter("search_query", e.target.value || undefined)
              }
              className="pl-7"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
