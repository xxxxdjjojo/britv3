"use client";

/**
 * Search filter panel -- desktop sidebar or mobile sheet.
 * All filters sync with URL via useSearchParams (nuqs).
 */

import { useCallback, useMemo } from "react";
import { useSearchParams } from "@/hooks/useSearch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { XIcon } from "lucide-react";
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
  resultCount?: number;
}>;

export function SearchFilters({ open, onOpenChange, isMobile, resultCount }: SearchFiltersProps) {
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
    <div className="flex flex-col gap-6 p-4">
      {/* Property type */}
      <div>
        <Label className="mb-2 block text-sm font-medium">Property Type</Label>
        <div className="flex flex-col gap-2">
          {PROPERTY_TYPES.map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selectedTypes.has(value)}
                onCheckedChange={() => handleTypeToggle(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <Label className="mb-2 block text-sm font-medium">Price Range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={params.min_price ?? ""}
            onChange={(e) =>
              setParams({
                min_price: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={params.max_price ?? ""}
            onChange={(e) =>
              setParams({
                max_price: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <Label className="mb-2 block text-sm font-medium">Min Bedrooms</Label>
        <div className="flex gap-1">
          {BEDROOM_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() =>
                setParams({
                  min_bedrooms: params.min_bedrooms === n ? null : n,
                })
              }
              className={`flex size-11 items-center justify-center rounded-md border text-sm transition-colors ${
                params.min_bedrooms === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-muted"
              }`}
            >
              {n}{n === 5 ? "+" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div>
        <Label className="mb-2 block text-sm font-medium">Min Bathrooms</Label>
        <div className="flex gap-1">
          {BATHROOM_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() =>
                setParams({
                  min_bathrooms: params.min_bathrooms === n ? null : n,
                })
              }
              className={`flex size-11 items-center justify-center rounded-md border text-sm transition-colors ${
                params.min_bathrooms === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-muted"
              }`}
            >
              {n}{n === 3 ? "+" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* EPC Rating */}
      <div>
        <Label className="mb-2 block text-sm font-medium">
          Max EPC Rating
        </Label>
        <div className="flex gap-1">
          {EPC_OPTIONS.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() =>
                setParams({
                  epc_rating: params.epc_rating === rating ? null : rating,
                })
              }
              className={`flex size-11 items-center justify-center rounded-md border text-sm transition-colors ${
                params.epc_rating === rating
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-muted"
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>

      {/* New build */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">New Build Only</Label>
        <Switch
          checked={params.new_build ?? false}
          onCheckedChange={(checked) =>
            setParams({ new_build: checked || null })
          }
        />
      </div>

      {/* Clear all */}
      <Button variant="outline" onClick={handleClearAll} className="w-full gap-2">
        <XIcon className="size-4" />
        Clear All Filters
      </Button>
    </div>
  );

  // Mobile: bottom sheet — thumb-reachable, capped at 85dvh
  if (isMobile) {
    const applyLabel =
      resultCount !== undefined
        ? `Apply (${resultCount} result${resultCount === 1 ? "" : "s"})`
        : "Apply filters";

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex max-h-[85dvh] flex-col gap-0 p-0">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">{filterContent}</div>
          {/* Sticky Apply footer */}
          <div className="shrink-0 border-t bg-background px-4 pb-safe pt-4">
            <Button
              size="xl"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              {applyLabel}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: collapsible sidebar
  if (!open) return null;

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-r bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-medium">Filters</h2>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-md p-1 hover:bg-muted"
          aria-label="Close filters"
        >
          <XIcon className="size-4" />
        </button>
      </div>
      {filterContent}
    </aside>
  );
}
