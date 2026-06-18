"use client";

/**
 * MarketMapExplorer — shared orchestrator for Screen 1 and Screen 2.
 *
 * Owns:
 * - Filter state synced to URL via nuqs (property_type, months, scale_mode, area_id, q)
 * - Area search bar using useMarketSearch + results dropdown
 * - fitTo state — updated on search-result select → fitBoundsFor
 * - Metadata from MarketMap.onMetadata
 * - Selected-area state from MarketMap.onAreaSelect
 * - Desktop: left panel (filters + summary + area list) / map / area detail popover
 * - Mobile: map full-width + vaul bottom sheet for filters/summary
 *
 * Screen 2 difference: focusAreaId prop starts the view zoomed to a specific area.
 * The explorer fetches that area's bounds via /api/market-search?q=<areaId> on mount
 * and sets fitTo accordingly.
 */

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
} from "react";
import dynamic from "next/dynamic";
import { parseAsString, parseAsInteger, useQueryStates } from "nuqs";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { useMarketSearch } from "@/hooks/useMarketSearch";
import { useMarketAreaDetail } from "@/hooks/useMarketAreaDetail";
import { fitBoundsFor } from "@/lib/market-map/fit-bounds";
import { cn } from "@/lib/utils";
import { MarketMapFilters } from "./MarketMapFilters";
import { MarketMapSummaryCards } from "./MarketMapSummaryCards";
import { MarketMapAreaList } from "./MarketMapAreaList";
import { MarketMapAreaDetail } from "./MarketMapAreaDetail";
import { MarketMapLegend } from "./MarketMapLegend";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { MarketMapFeatureProperties, MarketMapMetadata, MarketMapScaleMode } from "@/services/market-map/types";
import type { MarketMapFeatureCollection } from "@/hooks/useMarketMap";
import type { FitBoundsParams } from "@/lib/market-map/fit-bounds";
import type { PropertyTypeFilter, DateWindowMonths } from "./MarketMapFilters";
import type { SummaryCardData } from "./MarketMapSummaryCards";

// Lazy-load the map — MapLibre cannot SSR
const MarketMap = dynamic(
  () => import("./MarketMap").then((m) => ({ default: m.MarketMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#E2E2E8]">
        <p className="font-sans text-sm text-[#7A7A88]">Loading map…</p>
      </div>
    ),
  },
);

// ---------------------------------------------------------------------------
// nuqs parsers — URL state for filters + search
// ---------------------------------------------------------------------------

const MAP_PARAM_PARSERS = {
  property_type: parseAsString.withDefault("all"),
  months: parseAsInteger.withDefault(24),
  scale_mode: parseAsString.withDefault("national"),
  area_id: parseAsString,
  q: parseAsString,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = Readonly<{
  /** Screen 2: pre-focus on this areaId on mount. */
  focusAreaId?: string | null;
  /** Screen 2: human-readable name for the focused area (for panel header). */
  focusAreaName?: string | null;
  /** Override initial scale mode (Screen 2 defaults to "local"). */
  initialScaleMode?: MarketMapScaleMode;
}>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarketMapExplorer({
  focusAreaId,
  focusAreaName,
  initialScaleMode,
}: Props) {
  // URL state
  const [urlParams, setUrlParams] = useQueryStates(MAP_PARAM_PARSERS, {
    history: "push",
  });

  // Derive typed filter values from URL
  const propertyType = (urlParams.property_type as PropertyTypeFilter) ?? "all";
  const months = ([12, 24, 36, 60].includes(urlParams.months ?? 0)
    ? urlParams.months
    : 24) as DateWindowMonths;
  const scaleMode: MarketMapScaleMode =
    urlParams.scale_mode === "local" || urlParams.scale_mode === "national"
      ? urlParams.scale_mode
      : (initialScaleMode ?? "national");

  // Search query (local state drives the input; URL param drives the debounced hook)
  const [searchQuery, setSearchQuery] = useState(urlParams.q ?? "");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { results: searchResults, isLoading: searchLoading } =
    useMarketSearch(searchQuery);

  // Map interaction state
  const [fitTo, setFitTo] = useState<FitBoundsParams | null>(null);
  const [metadata, setMetadata] = useState<MarketMapMetadata | null>(null);
  const [selectedArea, setSelectedArea] =
    useState<MarketMapFeatureProperties | null>(null);
  const [allFeatures, setAllFeatures] = useState<MarketMapFeatureProperties[]>([]);

  // Flat/house breakdown for the selected area (lazy-loaded on selection).
  const { detail: areaDetail } = useMarketAreaDetail(
    selectedArea?.geography_level ?? null,
    selectedArea?.area_id ?? null,
    months,
  );

  // Price range for legend (derived from features)
  const { loPrice, hiPrice } = (() => {
    const priced = allFeatures
      .filter((f) => f.confidence !== "Insufficient")
      .map((f) => f.median_price);
    if (priced.length === 0) return { loPrice: null, hiPrice: null };
    return {
      loPrice: Math.min(...priced),
      hiPrice: Math.max(...priced),
    };
  })();

  // ---------------------------------------------------------------------------
  // Screen 2: resolve focusAreaId to fitBounds on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!focusAreaId) return;
    const controller = new AbortController();

    fetch(
      `/api/market-search?q=${encodeURIComponent(focusAreaId)}`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((data: { results?: Array<{ bbox: [number, number, number, number]; center: [number, number]; default_zoom: number; id: string; name: string; type: string }> }) => {
        const first = data.results?.[0];
        if (first) {
          setFitTo(fitBoundsFor(first));
        }
      })
      .catch(() => {
        // graceful degradation — map stays at default view
      });

    return () => controller.abort();
  }, [focusAreaId]);

  // ---------------------------------------------------------------------------
  // Map callbacks
  // ---------------------------------------------------------------------------

  const handleMetadata = useCallback((m: MarketMapMetadata) => {
    setMetadata(m);
  }, []);

  const handleAreaSelect = useCallback(
    (props: MarketMapFeatureProperties | null) => {
      setSelectedArea(props);
      if (props) {
        void setUrlParams({ area_id: props.area_id });
      } else {
        void setUrlParams({ area_id: null });
      }
    },
    [setUrlParams],
  );

  // Receive the full FeatureCollection from MarketMap to populate the area list.
  // This avoids a duplicate /api/market-map fetch that the previous design made.
  const handleFeatures = useCallback(
    (fc: MarketMapFeatureCollection) => {
      const feats = fc.features.map((f) => f.properties);
      setAllFeatures(feats);
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Search interactions
  // ---------------------------------------------------------------------------

  function handleSearchInput(v: string) {
    setSearchQuery(v);
    setShowResults(v.length >= 2);
    void setUrlParams({ q: v || null });
  }

  function handleResultSelect(result: (typeof searchResults)[number]) {
    setSearchQuery(result.name);
    setShowResults(false);
    setFitTo(fitBoundsFor(result));
    void setUrlParams({
      q: result.name,
      scale_mode: "local",
      area_id: result.id,
    });
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setShowResults(false);
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // ---------------------------------------------------------------------------
  // Filter callbacks
  // ---------------------------------------------------------------------------

  const handlePropertyTypeChange = useCallback(
    (v: PropertyTypeFilter) => void setUrlParams({ property_type: v }),
    [setUrlParams],
  );

  const handleMonthsChange = useCallback(
    (v: DateWindowMonths) => void setUrlParams({ months: v }),
    [setUrlParams],
  );

  const handleScaleModeChange = useCallback(
    (v: MarketMapScaleMode) => void setUrlParams({ scale_mode: v }),
    [setUrlParams],
  );

  // ---------------------------------------------------------------------------
  // Summary card data from selected area
  // ---------------------------------------------------------------------------

  const summaryData: SummaryCardData | null = selectedArea
    ? {
        areaName: selectedArea.area_name,
        medianPrice: selectedArea.median_price,
        transactionCount: selectedArea.transaction_count,
        confidence: selectedArea.confidence,
        periodFrom: selectedArea.date_from,
        periodTo: selectedArea.date_to,
      }
    : null;

  // ---------------------------------------------------------------------------
  // Shared search bar
  // ---------------------------------------------------------------------------

  const searchBar = (
    <div ref={searchRef} className="relative">
      <div
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-md)] border border-[#E2E2E8] bg-white px-3 py-2.5",
          "shadow-[var(--shadow-sm)] transition-colors",
          "focus-within:border-[#1B4D3E] focus-within:ring-1 focus-within:ring-[#1B4D3E]",
        )}
      >
        <Search
          className="size-4 shrink-0 text-[#7A7A88]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search city, borough, postcode or area"
          className="min-w-0 flex-1 bg-transparent font-sans text-sm text-[#0A0A0B] placeholder-[#7A7A88] focus:outline-none"
          aria-label="Search for an area"
          aria-autocomplete="list"
          aria-expanded={showResults}
          role="combobox"
          aria-controls="market-search-listbox"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => { setSearchQuery(""); setShowResults(false); void setUrlParams({ q: null }); }}
            aria-label="Clear search"
            className="shrink-0 text-[#7A7A88] hover:text-[#2E2E33]"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && (
        <ul
          id="market-search-listbox"
          role="listbox"
          aria-label="Search results"
          className={cn(
            "absolute left-0 right-0 top-full z-50 mt-1",
            "rounded-[var(--radius-md)] border border-[#E2E2E8] bg-white shadow-[var(--shadow-lg)]",
            "max-h-60 overflow-y-auto",
          )}
        >
          {searchLoading && (
            <li className="px-3 py-2 font-sans text-sm text-[#7A7A88]">
              Searching…
            </li>
          )}
          {!searchLoading && searchResults.length === 0 && (
            <li className="px-3 py-2 font-sans text-sm text-[#7A7A88]">
              No areas found
            </li>
          )}
          {searchResults.map((r) => (
            <li key={r.id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => handleResultSelect(r)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left",
                  "font-sans text-sm text-[#2E2E33] hover:bg-[#F1F1F5]",
                  "focus:outline-none focus-visible:bg-[#E8F5EE]",
                )}
              >
                <span className="flex-1 font-medium">{r.name}</span>
                <span className="shrink-0 rounded-full bg-[#F1F1F5] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#7A7A88]">
                  {r.geography_level}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Left panel content (desktop)
  // ---------------------------------------------------------------------------

  const leftPanel = (
    <aside
      className="flex h-full w-80 shrink-0 flex-col border-r border-[#E2E2E8] bg-[#F8F8FA]"
      aria-label="Map filters and area summary"
    >
      {/* Search */}
      <div className="border-b border-[#E2E2E8] p-4">{searchBar}</div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto">
        <MarketMapFilters
          propertyType={propertyType}
          months={months}
          scaleMode={scaleMode}
          onPropertyTypeChange={handlePropertyTypeChange}
          onMonthsChange={handleMonthsChange}
          onScaleModeChange={handleScaleModeChange}
          focusAreaName={focusAreaName}
          onApply={() => {/* filters are applied reactively */}}
        />
      </div>

      {/* Summary cards */}
      <div className="border-t border-[#E2E2E8] p-4">
        <MarketMapSummaryCards data={summaryData} />
      </div>

      {/* Area list */}
      {allFeatures.length > 0 && (
        <div className="border-t border-[#E2E2E8] p-4">
          <p className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#858593]">
            Areas in view
          </p>
          <div className="max-h-64 overflow-y-auto">
            <MarketMapAreaList
              features={allFeatures}
              selectedAreaId={selectedArea?.area_id}
              onSelect={handleAreaSelect}
            />
          </div>
        </div>
      )}

      {/* Scale indicator */}
      <div className="border-t border-[#E2E2E8] px-4 py-2">
        <p className="font-sans text-[10px] text-[#7A7A88]">
          {metadata?.scale_mode === "local"
            ? "Scale: Local comparison"
            : "Scale: National comparison"}
        </p>
      </div>
    </aside>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Desktop left panel */}
      <div className="hidden lg:flex lg:h-full">{leftPanel}</div>

      {/* Map canvas */}
      <div className="relative flex-1">
        <MarketMap
          propertyType={propertyType}
          months={months}
          scaleMode={scaleMode}
          fitTo={fitTo}
          onFeatures={handleFeatures}
          onAreaSelect={handleAreaSelect}
          onMetadata={handleMetadata}
          className="h-full w-full"
        />

        {/* Legend — centred top, z-30 */}
        <div className="pointer-events-none absolute inset-x-0 top-6 z-30 flex justify-center px-4">
          <div className="pointer-events-auto">
            <MarketMapLegend loPrice={loPrice} hiPrice={hiPrice} />
          </div>
        </div>

        {/* Selected area detail card — desktop, anchored bottom-right of map */}
        {selectedArea && (
          <div className="absolute bottom-6 right-6 z-30 hidden lg:block">
            <MarketMapAreaDetail
              properties={selectedArea}
              scaleMode={scaleMode}
              detail={areaDetail}
              onClose={() => handleAreaSelect(null)}
            />
          </div>
        )}

        {/* Mobile: floating filters pill + search bar */}
        <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 lg:hidden">
          {/* Mobile search */}
          <div className="w-72">{searchBar}</div>

          {/* Mobile filters drawer trigger */}
          <Drawer>
            <DrawerTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-2 rounded-[9999px] bg-[#1B4D3E] px-5 py-2.5",
                  "font-sans text-sm font-semibold text-white shadow-[var(--shadow-lg)]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2",
                )}
                aria-label="Open map filters"
              >
                <SlidersHorizontal className="size-4" />
                Filters
              </button>
            </DrawerTrigger>

            <DrawerContent className="bg-[#F8F8FA]">
              <DrawerHeader>
                <DrawerTitle className="font-heading text-base font-bold text-[#0A0A0B]">
                  {focusAreaName ? `Exploring: ${focusAreaName}` : "Filters"}
                </DrawerTitle>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto pb-safe">
                <div className="p-4">
                  <MarketMapSummaryCards data={summaryData} />
                </div>

                <MarketMapFilters
                  propertyType={propertyType}
                  months={months}
                  scaleMode={scaleMode}
                  onPropertyTypeChange={handlePropertyTypeChange}
                  onMonthsChange={handleMonthsChange}
                  onScaleModeChange={handleScaleModeChange}
                  focusAreaName={focusAreaName}
                  onApply={() => {/* reactive */}}
                />

                {/* Selected area detail inside sheet */}
                {selectedArea && (
                  <div className="p-4">
                    <MarketMapAreaDetail
                      properties={selectedArea}
                      scaleMode={scaleMode}
                      detail={areaDetail}
                      onClose={() => handleAreaSelect(null)}
                    />
                  </div>
                )}

                {/* Area list in sheet */}
                {allFeatures.length > 0 && (
                  <div className="p-4">
                    <p className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#858593]">
                      Areas in view
                    </p>
                    <MarketMapAreaList
                      features={allFeatures}
                      selectedAreaId={selectedArea?.area_id}
                      onSelect={handleAreaSelect}
                    />
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  );
}
