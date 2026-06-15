"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin, BarChart3, Layers } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MarketMapControls } from "@/components/market-map/MarketMapControls";
import { SubAreaList } from "@/components/market-map/SubAreaList";
import { PriceLegend } from "@/components/market-map/PriceLegend";
import { AreaCard } from "@/components/market-map/AreaCard";
import { useMarketMap } from "@/lib/market-map/use-market-map";
import { resolveArea } from "@/lib/market-map/areas";
import type { PropertyTypeFilter } from "@/lib/market-map/constants";
import type {
  MarketMapFeatureCollection,
  MarketMapFeatureProperties,
} from "@/types/market-map";

const MarketMap = dynamic(() => import("@/components/market-map/MarketMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
});

const EMPTY_FC: MarketMapFeatureCollection = {
  type: "FeatureCollection",
  features: [],
  metadata: {
    metric: "median_sold_price",
    currency: "GBP",
    scale: "local",
    source: "",
    sqm_available: false,
    area: "wandsworth",
    area_label: "Wandsworth",
    geography_level: "postcode_district",
    property_type: "all",
    date_from: "",
    date_to: "",
  },
};

const AREA_SLUG = "wandsworth";

export default function SearchMapPage() {
  const borough = resolveArea(AREA_SLUG);
  const [months, setMonths] = useState(36);
  const [propertyType, setPropertyType] = useState<PropertyTypeFilter>("all");
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);

  const { data, isLoading, isError } = useMarketMap({
    area: AREA_SLUG,
    months,
    propertyType,
  });

  const fc = data ?? EMPTY_FC;

  const rankedAreas = useMemo(() => {
    const props = fc.features.map((f) => f.properties);
    const sufficient = props
      .filter((p) => p.confidence !== "Insufficient")
      .sort((a, b) => a.median_price - b.median_price);
    const insufficient = props.filter((p) => p.confidence === "Insufficient");
    return [...sufficient, ...insufficient];
  }, [fc]);

  const activeAreaId = selectedAreaId ?? hoveredAreaId;
  const activeArea: MarketMapFeatureProperties | null = useMemo(
    () => fc.features.find((f) => f.properties.area_id === activeAreaId)?.properties ?? null,
    [fc, activeAreaId],
  );

  const sufficientCount = rankedAreas.filter(
    (a) => a.confidence !== "Insufficient",
  ).length;

  const panel = (
    <div className="flex h-full flex-col">
      <div className="mb-3">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Loading areas…"
            : `${sufficientCount} priced ${sufficientCount === 1 ? "area" : "areas"} · cheapest first`}
        </p>
      </div>
      <div className="-mr-2 flex-1 overflow-y-auto pr-2">
        <SubAreaList
          areas={rankedAreas}
          selectedAreaId={selectedAreaId}
          onSelect={setSelectedAreaId}
        />
      </div>
      <p className="mt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
        Median registered sold price by postcode district. This is not a price
        per square metre — floor-area data is not available.
      </p>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Top bar */}
      <div className="z-20 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h1 className="font-heading text-base font-bold">
              {borough.label} — Sold price map
            </h1>
          </div>
          <MarketMapControls
            propertyType={propertyType}
            months={months}
            onPropertyTypeChange={setPropertyType}
            onMonthsChange={setMonths}
          />
          <Button asChild variant="outline" size="sm">
            <Link href={`/search/market-map/${AREA_SLUG}`}>
              <BarChart3 className="mr-1.5 h-4 w-4" />
              Area explorer
            </Link>
          </Button>
          {/* Mobile areas sheet */}
          <Sheet>
            <SheetTrigger
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "lg:hidden")}
            >
              <Layers className="mr-1.5 h-4 w-4" />
              Areas
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>{borough.label} areas</SheetTitle>
              </SheetHeader>
              <div className="mt-2 h-[calc(70vh-5rem)]">{panel}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1">
        {/* Desktop results panel */}
        <aside className="hidden w-80 shrink-0 border-r border-border/40 p-4 lg:block">
          {panel}
        </aside>

        {/* Map */}
        <div className="relative min-w-0 flex-1">
          {isError ? (
            <div className="flex h-full items-center justify-center bg-muted">
              <p className="text-sm text-muted-foreground">
                Couldn’t load the market map. Please try again.
              </p>
            </div>
          ) : (
            <MarketMap
              data={fc}
              selectedAreaId={selectedAreaId}
              onSelectArea={setSelectedAreaId}
              onHoverArea={setHoveredAreaId}
            />
          )}

          {/* Legend */}
          <div className="pointer-events-none absolute bottom-4 left-4 z-10">
            <PriceLegend scaleLabel={`Local scale · ${borough.label}`} />
          </div>

          {/* Selected/hovered area card */}
          {activeArea ? (
            <div className="absolute right-4 top-4 z-10 w-72 max-w-[calc(100%-2rem)]">
              <AreaCard
                properties={activeArea}
                onClose={selectedAreaId ? () => setSelectedAreaId(null) : undefined}
              />
            </div>
          ) : null}

          {isLoading ? (
            <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow">
              Loading sold prices…
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
