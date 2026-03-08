"use client";

import { useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RatingStars } from "@/components/reviews/RatingStars";
import { cn } from "@/lib/utils";
import type { ServiceCategory } from "@/types/marketplace";

const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  conveyancing: "Conveyancing",
  surveying: "Surveying",
  mortgage_broker: "Mortgage Broker",
  moving_company: "Moving Company",
  home_inspector: "Home Inspector",
  cleaning: "Cleaning",
  handyman: "Handyman",
  plumber: "Plumber",
  electrician: "Electrician",
  landscaping: "Landscaping",
  interior_design: "Interior Design",
  architect: "Architect",
  property_management: "Property Management",
  pest_control: "Pest Control",
  locksmith: "Locksmith",
  other: "Other",
};

export type SearchFilterParams = {
  service_category?: ServiceCategory;
  postcode?: string;
  radius: number;
  min_rating?: number;
  search_query?: string;
};

type SearchFiltersProps = Readonly<{
  filters: SearchFilterParams;
  onChange: (filters: SearchFilterParams) => void;
  className?: string;
}>;

export function SearchFilters({
  filters,
  onChange,
  className,
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

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Service Category */}
        <div className="space-y-1.5">
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
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          >
            <option value="">All services</option>
            {Object.entries(SERVICE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Postcode */}
        <div className="space-y-1.5">
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
            onChange={(e) => updateFilter("postcode", e.target.value || undefined)}
          />
        </div>

        {/* Radius */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-radius"
            className="text-xs font-medium text-muted-foreground"
          >
            Radius: {filters.radius} miles
          </label>
          <input
            id="filter-radius"
            type="range"
            min={1}
            max={100}
            value={filters.radius}
            onChange={(e) => updateFilter("radius", Number(e.target.value))}
            className="h-8 w-full accent-brand-primary"
          />
        </div>

        {/* Min Rating */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-rating"
            className="text-xs font-medium text-muted-foreground"
          >
            Minimum rating
          </label>
          <div className="flex items-center gap-2">
            <select
              id="filter-rating"
              value={filters.min_rating ?? ""}
              onChange={(e) =>
                updateFilter(
                  "min_rating",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r}+
                </option>
              ))}
            </select>
            {filters.min_rating && (
              <RatingStars rating={filters.min_rating} size="sm" />
            )}
          </div>
        </div>

        {/* Search */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-search"
            className="text-xs font-medium text-muted-foreground"
          >
            Search
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
