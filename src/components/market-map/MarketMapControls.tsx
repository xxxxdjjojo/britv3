"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropertyTypeFilter } from "@/lib/market-map/constants";

export const PROPERTY_TYPE_OPTIONS: { value: PropertyTypeFilter; label: string }[] = [
  { value: "all", label: "All property types" },
  { value: "detached", label: "Detached" },
  { value: "semi-detached", label: "Semi-detached" },
  { value: "terraced", label: "Terraced" },
  { value: "flat", label: "Flat" },
];

export const TIME_WINDOW_OPTIONS: { value: number; label: string }[] = [
  { value: 12, label: "12 months" },
  { value: 24, label: "2 years" },
  { value: 36, label: "3 years" },
  { value: 60, label: "5 years" },
];

type Props = Readonly<{
  propertyType: PropertyTypeFilter;
  months: number;
  onPropertyTypeChange: (value: PropertyTypeFilter) => void;
  onMonthsChange: (value: number) => void;
}>;

/** Shared property-type + time-window controls for the market-map screens. */
export function MarketMapControls({
  propertyType,
  months,
  onPropertyTypeChange,
  onMonthsChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={propertyType}
        onValueChange={(v) => onPropertyTypeChange(v as PropertyTypeFilter)}
      >
        <SelectTrigger className="w-[170px]" aria-label="Property type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROPERTY_TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(months)}
        onValueChange={(v) => onMonthsChange(Number(v))}
      >
        <SelectTrigger className="w-[140px]" aria-label="Time window">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIME_WINDOW_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={String(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
