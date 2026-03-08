"use client";

/**
 * Sort bar with result count, sort dropdown, and view mode toggle.
 */

import { useSearchParams } from "@/hooks/useSearch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  LayoutListIcon,
  MapIcon,
  ColumnsIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import type { SearchSort } from "@/types/search";

type ViewMode = "list" | "map" | "split";

const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: "date_desc", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "relevance", label: "Most relevant" },
];

type SearchSortBarProps = Readonly<{
  totalCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  activeFilterCount: number;
  onFiltersToggle: () => void;
}>;

export function SearchSortBar({
  totalCount,
  viewMode,
  onViewModeChange,
  activeFilterCount,
  onFiltersToggle,
}: SearchSortBarProps) {
  const [params, setParams] = useSearchParams();

  const currentSort = (params.sort as SearchSort) ?? "date_desc";

  return (
    <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-2">
      <div className="flex items-center gap-3">
        {/* Filter toggle -- both mobile & desktop */}
        <Button
          variant="outline"
          size="sm"
          onClick={onFiltersToggle}
          className="gap-1.5"
        >
          <SlidersHorizontalIcon className="size-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Result count */}
        <span className="text-sm text-muted-foreground">
          {totalCount.toLocaleString()} {totalCount === 1 ? "property" : "properties"} found
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Sort dropdown */}
        <Select
          value={currentSort}
          onValueChange={(val) => setParams({ sort: val as SearchSort })}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="hidden items-center gap-0.5 rounded-lg border p-0.5 md:flex">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="List view"
          >
            <LayoutListIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("map")}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === "map"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Map view"
          >
            <MapIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("split")}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === "split"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Split view"
          >
            <ColumnsIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
