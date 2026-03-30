"use client";

/**
 * Sort bar with result count, sort dropdown, and view mode toggle.
 * Matches the Britestate "Invisible Estate" design system.
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
import {
  LayoutListIcon,
  MapIcon,
  Columns2Icon,
  SlidersHorizontalIcon,
  LayoutGridIcon,
  LayoutPanelTopIcon,
  AlignJustifyIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchSort } from "@/types/search";

type ViewMode = "list" | "map" | "split" | "discovery" | "map-top" | "hemnet";

const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: "date_desc", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "relevance", label: "Most relevant" },
];

const VIEW_MODES: { mode: ViewMode; Icon: React.ElementType; label: string }[] = [
  { mode: "discovery", Icon: LayoutGridIcon, label: "Discovery Hub" },
  { mode: "split", Icon: Columns2Icon, label: "Map + List Split" },
  { mode: "map", Icon: MapIcon, label: "Map Fullscreen" },
  { mode: "map-top", Icon: LayoutPanelTopIcon, label: "Map Top" },
  { mode: "hemnet", Icon: AlignJustifyIcon, label: "Hemnet Style" },
  { mode: "list", Icon: LayoutListIcon, label: "List View" },
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
    <div className="flex items-center justify-between gap-3 bg-white px-4 py-2.5" style={{ borderBottom: "1px solid #f1f1f5" }}>
      <div className="flex items-center gap-3">
        {/* Filter toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onFiltersToggle}
          className="gap-1.5 rounded-xl border-neutral-200 text-neutral-700 hover:border-brand-primary hover:text-brand-primary"
        >
          <SlidersHorizontalIcon className="size-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Result count */}
        <span className="text-sm text-neutral-500">
          <span className="font-semibold text-neutral-900">{totalCount.toLocaleString()}</span>{" "}
          {totalCount === 1 ? "property" : "properties"} found
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Sort dropdown */}
        <Select
          value={currentSort}
          onValueChange={(val) => setParams({ sort: val as SearchSort })}
        >
          <SelectTrigger size="sm" className="rounded-xl border-neutral-200 text-sm">
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
        <div className="hidden items-center gap-0.5 rounded-xl bg-neutral-100 p-1 md:flex">
          {VIEW_MODES.map(({ mode, Icon, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              title={label}
              aria-label={label}
              className={cn(
                "rounded-lg p-1.5 transition-all duration-150",
                viewMode === mode
                  ? "bg-white text-brand-primary shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
