"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarketMapControls } from "./MarketMapControls";
import type { PropertyTypeFilter } from "@/lib/market-map/constants";

const GEOGRAPHY_OPTIONS = [
  { value: "postcode_district", label: "Postcode district", enabled: true },
  { value: "postcode_sector", label: "Postcode sector (soon)", enabled: false },
  { value: "lsoa", label: "LSOA (soon)", enabled: false },
  { value: "hex", label: "Hex grid (soon)", enabled: false },
];

type Props = Readonly<{
  propertyType: PropertyTypeFilter;
  months: number;
  geographyLevel: string;
}>;

/** URL-driven controls for the area explorer (server re-renders on change). */
export function AreaExplorerControls({ propertyType, months, geographyLevel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set(key, value);
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MarketMapControls
        propertyType={propertyType}
        months={months}
        onPropertyTypeChange={(v) => setParam("property_type", v)}
        onMonthsChange={(v) => setParam("months", String(v))}
      />
      <Select
        value={geographyLevel}
        onValueChange={(v) => v && setParam("geography_level", v)}
      >
        <SelectTrigger className="w-[180px]" aria-label="Geography level">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GEOGRAPHY_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value} disabled={!o.enabled}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
