"use client";

/**
 * Search filter panel — desktop sidebar or mobile sheet.
 * All filters sync with URL via useSearchParams (nuqs).
 * Matches the Britestate "Invisible Estate" design system.
 */

import { useCallback, useMemo } from "react";
import { useSearchParams } from "@/hooks/useSearch";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EpcRating, PropertyType } from "@/types/property";

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "detached", label: "Detached" },
  { value: "semi_detached", label: "Semi-detached" },
  { value: "terraced", label: "Terraced" },
  { value: "flat", label: "Flat / Apartment" },
  { value: "bungalow", label: "Bungalow" },
  { value: "cottage", label: "Cottage" },
  { value: "penthouse", label: "Penthouse" },
  { value: "studio", label: "Studio" },
  { value: "maisonette", label: "Maisonette" },
  { value: "land", label: "Land" },
];

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];
const BATHROOM_OPTIONS = [1, 2, 3];
const EPC_OPTIONS: EpcRating[] = ["A", "B", "C", "D", "E", "F", "G"];

type SearchFiltersProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
}>;

export function SearchFilters({ open, onOpenChange, isMobile }: SearchFiltersProps) {
  const [params, setParams] = useSearchParams();

  const selectedTypes = useMemo(() => {
    const types = params.property_type;
    if (!types) return new Set<string>();
    return new Set(types.filter((t): t is string => t != null));
  }, [params.property_type]);

  const handleTypeToggle = useCallback(
    (type: string) => {
      const next = new Set(selectedTypes);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      setParams({
        property_type: next.size > 0 ? Array.from(next) : null,
      });
    },
    [selectedTypes, setParams],
  );

  const handleClearAll = useCallback(() => {
    setParams({
      property_type: null,
      min_price: null,
      max_price: null,
      min_bedrooms: null,
      min_bathrooms: null,
      epc_rating: null,
      new_build: null,
    });
  }, [setParams]);

  const filterContent = (
    <div className="flex flex-col gap-5 p-4">
      {/* Property type */}
      <div>
        <Label className="mb-3 block text-sm font-semibold text-neutral-900">Property Type</Label>
        <div className="flex flex-col gap-2">
          {PROPERTY_TYPES.map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-700 hover:text-neutral-900"
            >
              <input
                type="checkbox"
                checked={selectedTypes.has(value)}
                onChange={() => handleTypeToggle(value)}
                className="size-4 rounded accent-brand-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <Label className="mb-3 block text-sm font-semibold text-neutral-900">Price Range</Label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={params.min_price ?? ""}
            onChange={(e) =>
              setParams({
                min_price: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none ring-1 ring-neutral-200 transition focus:ring-2 focus:ring-brand-primary"
          />
          <span className="shrink-0 text-sm text-neutral-400">–</span>
          <input
            type="number"
            placeholder="Max"
            value={params.max_price ?? ""}
            onChange={(e) =>
              setParams({
                max_price: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none ring-1 ring-neutral-200 transition focus:ring-2 focus:ring-brand-primary"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <Label className="mb-3 block text-sm font-semibold text-neutral-900">Min Bedrooms</Label>
        <div className="flex gap-1.5">
          {BEDROOM_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() =>
                setParams({
                  min_bedrooms: params.min_bedrooms === n ? null : n,
                })
              }
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors",
                params.min_bedrooms === n
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-brand-primary-lighter hover:text-brand-primary",
              )}
            >
              {n}
              {n === 5 ? "+" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div>
        <Label className="mb-3 block text-sm font-semibold text-neutral-900">Min Bathrooms</Label>
        <div className="flex gap-1.5">
          {BATHROOM_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() =>
                setParams({
                  min_bathrooms: params.min_bathrooms === n ? null : n,
                })
              }
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors",
                params.min_bathrooms === n
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-brand-primary-lighter hover:text-brand-primary",
              )}
            >
              {n}
              {n === 3 ? "+" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* EPC Rating */}
      <div>
        <Label className="mb-3 block text-sm font-semibold text-neutral-900">
          Max EPC Rating
        </Label>
        <div className="flex gap-1.5">
          {EPC_OPTIONS.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() =>
                setParams({
                  epc_rating: params.epc_rating === rating ? null : rating,
                })
              }
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors",
                params.epc_rating === rating
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-brand-primary-lighter hover:text-brand-primary",
              )}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>

      {/* New build */}
      <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-3">
        <Label className="text-sm font-medium text-neutral-700">New Build Only</Label>
        <Switch
          checked={params.new_build ?? false}
          onCheckedChange={(checked) => setParams({ new_build: checked || null })}
        />
      </div>

      {/* Clear all */}
      <Button
        variant="outline"
        onClick={handleClearAll}
        className="w-full gap-2 rounded-xl border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
      >
        <XIcon className="size-4" />
        Clear All Filters
      </Button>
    </div>
  );

  // Mobile: render in a Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="border-b border-neutral-100 px-4 py-3.5">
            <SheetTitle className="font-heading text-base font-semibold">Filters</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto">{filterContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: collapsible sidebar
  if (!open) return null;

  return (
    <aside className="w-72 shrink-0 overflow-y-auto bg-white" style={{ borderRight: "1px solid #f1f1f5" }}>
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid #f1f1f5" }}>
        <h2 className="font-heading text-sm font-semibold text-neutral-900">Filters</h2>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="flex size-7 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Close filters"
        >
          <XIcon className="size-4" />
        </button>
      </div>
      {filterContent}
    </aside>
  );
}
