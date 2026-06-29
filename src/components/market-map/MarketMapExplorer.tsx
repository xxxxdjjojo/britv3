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
import { SlidersHorizontal, Search, X, ArrowLeft } from "lucide-react";
import { useMarketSearch } from "@/hooks/useMarketSearch";
import { useMarketAreaDetail } from "@/hooks/useMarketAreaDetail";
import { useMarketAreaCard } from "@/hooks/useMarketAreaCard";
import { geographyLevelForZoom, type GeographyLevel } from "@/lib/market-map/geography";
import { LEVEL_LABEL, humanizeAreaName } from "@/lib/market-map/labels";
import { fitBoundsFor } from "@/lib/market-map/fit-bounds";
import type { SoldParcel } from "@/lib/market-map/sold-colour";
import { cn } from "@/lib/utils";
import { MarketMapFilters } from "./MarketMapFilters";
import { MarketMapSummaryCards } from "./MarketMapSummaryCards";
import { MarketMapAreaList } from "./MarketMapAreaList";
import { MarketMapAreaDetail } from "./MarketMapAreaDetail";
import { MarketMapPriceCard } from "./MarketMapPriceCard";
import { MarketMapLegend } from "./MarketMapLegend";
import { MarketMapRentPanel } from "./MarketMapRentPanel";
import { SoldParcelDetail } from "./SoldParcelDetail";
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

/** Human-readable label for each geography level, shown in the granularity pill. */
const GRANULARITY_LABELS: Record<GeographyLevel, string> = {
  local_authority: "Local authorities",
  postcode_district: "Postcode districts",
  msoa: "Neighbourhoods (MSOA)",
  lsoa: "Local areas (LSOA)",
  street: "Streets / micro-areas",
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
  // Sold parcel selected at street zoom — routed into the Sales tab body.
  const [selectedParcel, setSelectedParcel] = useState<SoldParcel | null>(null);
  const [allFeatures, setAllFeatures] = useState<MarketMapFeatureProperties[]>([]);

  // Side-panel tab: sales (the choropleth/parcel detail) or rent (coming soon).
  const [activeTab, setActiveTab] = useState<"sales" | "rent">("sales");

  // Flat/house breakdown for the selected area (lazy-loaded on selection).
  // The street layer uses H3 micro-area cells whose ids are not aggregatable by
  // property type (market_map_area_detail groups streets by street_key, not H3),
  // so the breakdown is only fetched for the polygon levels.
  const detailLevel =
    selectedArea && selectedArea.geography_level !== "street"
      ? selectedArea.geography_level
      : null;
  const { detail: areaDetail } = useMarketAreaDetail(
    detailLevel,
    detailLevel ? selectedArea?.area_id ?? null : null,
    months,
  );

  // Instant headline card (flat/house bands) for the selected area. Driven
  // entirely by the query keyed on level + areaId — independent of the flyTo
  // side-effect in handleResultSelect, so the card and the camera move in
  // parallel (neither awaits the other). Disabled until an area is selected.
  const { card: areaCard, isLoading: areaCardLoading } = useMarketAreaCard(
    selectedArea?.geography_level ?? "",
    selectedArea?.area_id ?? "",
    12,
  );

  // Current map zoom (drives the active-granularity diagnostic). Initialised to
  // a national-view default so the first paint reads "local_authority".
  const [currentZoom, setCurrentZoom] = useState<number>(5);

  // Active geography level: prefer the level the API actually served, falling
  // back to the zoom-derived level before the first response arrives.
  const activeGranularity: GeographyLevel =
    metadata?.geography_level ?? geographyLevelForZoom(currentZoom);

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
      // Area and parcel selections are mutually exclusive in the panel.
      setSelectedParcel(null);
      // A real area selection always surfaces in the Sales tab.
      if (props) setActiveTab("sales");
      void setUrlParams({ area_id: props ? props.area_id : null });
    },
    [setUrlParams],
  );

  // Sold-parcel selection (street zoom). A parcel takes precedence over the
  // area selection: selecting one clears the area (and its URL param) and pulls
  // the Sales tab to the front. A null parcel just clears the prior parcel —
  // MarketMap fires onParcelSelect(null) before onAreaSelect on a non-parcel
  // click, so area/tab state is left to handleAreaSelect.
  const handleParcelSelect = useCallback(
    (parcel: SoldParcel | null) => {
      setSelectedParcel(parcel);
      if (parcel) {
        setSelectedArea(null);
        void setUrlParams({ area_id: null });
        setActiveTab("sales");
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

  // Close dropdown on outside click.
  // NOTE: the search bar is rendered for BOTH desktop and mobile layouts, so a
  // single ref can only track one instance. Closing on "outside searchRef"
  // therefore mis-fires when interacting with the other instance, dismissing
  // the dropdown before the result's onClick lands. Match any search-bar root
  // via a marker attribute instead so selection works in every layout.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Element | null;
      if (!target?.closest("[data-market-search]")) {
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

  // ---------------------------------------------------------------------------
  // Summary card data from selected area
  // ---------------------------------------------------------------------------

  const summaryData: SummaryCardData | null = selectedArea
    ? {
        areaName: humanizeAreaName(selectedArea.area_name, selectedArea.geography_level),
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
    <div ref={searchRef} className="relative" data-market-search>
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
                  {LEVEL_LABEL[r.geography_level]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Sales / Rent tab strip — shared between desktop and mobile layouts.
  // ---------------------------------------------------------------------------

  const tabStrip = (
    <div
      role="tablist"
      aria-label="Map data"
      className="flex shrink-0 gap-1 border-b border-[#E2E2E8] bg-white px-4"
    >
      {(["sales", "rent"] as const).map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 font-sans text-sm font-semibold capitalize transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]",
              isActive
                ? "border-[#1B4D3E] text-[#1B4D3E]"
                : "border-transparent text-[#7A7A88] hover:text-[#2E2E33]",
            )}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Sales tab body — precedence: parcel > area > list.
  // ---------------------------------------------------------------------------

  const salesBody = selectedParcel ? (
    <div className="flex flex-col gap-3 p-4">
      <button
        type="button"
        onClick={() => handleParcelSelect(null)}
        className="flex items-center gap-1.5 self-start font-sans text-xs font-medium text-[#1B4D3E] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to map
      </button>
      <SoldParcelDetail parcel={selectedParcel} />
    </div>
  ) : selectedArea ? (
    <>
      {/* Detail mode — the clicked area's prices, shown first */}
      <div className="flex flex-col gap-3 p-4">
        <button
          type="button"
          onClick={() => handleAreaSelect(null)}
          className="flex items-center gap-1.5 self-start font-sans text-xs font-medium text-[#1B4D3E] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to all areas
        </button>
        <MarketMapPriceCard
          card={areaCard ?? undefined}
          areaName={humanizeAreaName(selectedArea.area_name, selectedArea.geography_level)}
          isLoading={areaCardLoading}
        />
        <MarketMapAreaDetail
          properties={selectedArea}
          detail={areaDetail}
          onClose={() => handleAreaSelect(null)}
        />
      </div>

      {/* Filters remain available below the detail */}
      <div className="border-t border-[#E2E2E8]">
        <MarketMapFilters
          propertyType={propertyType}
          onPropertyTypeChange={handlePropertyTypeChange}
          focusAreaName={focusAreaName}
          onApply={() => {/* filters are applied reactively */}}
        />
      </div>
    </>
  ) : (
    <>
      {/* List mode — filters then ranked areas in view */}
      <MarketMapFilters
        propertyType={propertyType}
        onPropertyTypeChange={handlePropertyTypeChange}
        focusAreaName={focusAreaName}
        onApply={() => {/* filters are applied reactively */}}
      />
      <div className="border-t border-[#E2E2E8] p-4">
        <p className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#858593]">
          {allFeatures.length > 0
            ? "Areas in view — tap one for details"
            : "Areas in view"}
        </p>
        {allFeatures.length > 0 ? (
          <MarketMapAreaList
            features={allFeatures}
            selectedAreaId={null}
            onSelect={handleAreaSelect}
          />
        ) : (
          <p className="font-sans text-xs text-[#7A7A88]">
            Pan or zoom the map, or search above, to see sold prices by area.
          </p>
        )}
      </div>
    </>
  );

  // Right panel content (desktop). Sticky search header + Sales/Rent tab strip;
  // the body swaps on the active tab. The Sales body is master/detail with a
  // parcel > area > list precedence.
  const rightPanel = (
    <aside
      className="hidden h-full min-h-0 w-1/2 max-w-[720px] shrink-0 flex-col border-l border-[#E2E2E8] bg-[#F8F8FA] lg:flex"
      aria-label="Search, filters and area prices"
    >
      {/* Sticky search header */}
      <div className="shrink-0 border-b border-[#E2E2E8] bg-white p-4">
        {searchBar}
      </div>

      {/* Sticky Sales / Rent tab strip */}
      {tabStrip}

      {/* Scrollable body — driven by the active tab. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === "sales" ? salesBody : <MarketMapRentPanel />}
      </div>

      {/* Scale indicator footer */}
      <div className="shrink-0 border-t border-[#E2E2E8] px-4 py-2">
        <p className="font-sans text-[10px] text-[#7A7A88]">
          {metadata?.scale_mode === "local"
            ? "Colours compared within this area"
            : "Colours compared across the country"}
        </p>
      </div>
    </aside>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden">
      {/* Map canvas — left half on desktop, full width on mobile.
          No `h-full` here: the flex parent stretches this column to full height
          (align-items: stretch). Setting height:100% would resolve against the
          parent's indefinite height and collapse the map to 0. */}
      <div className="relative min-h-0 flex-1">
        <MarketMap
          propertyType={propertyType}
          months={months}
          scaleMode={scaleMode}
          fitTo={fitTo}
          onViewportChange={(v) => setCurrentZoom(v.zoom)}
          onFeatures={handleFeatures}
          onAreaSelect={handleAreaSelect}
          onParcelSelect={handleParcelSelect}
          onMetadata={handleMetadata}
          className="h-full w-full"
        />

        {/* Active geography-level diagnostic — reflects the layer actually shown,
            not just the camera. Also a reliable hook for E2E zoom assertions. */}
        <div
          data-testid="active-map-granularity"
          data-granularity={activeGranularity}
          className="pointer-events-none absolute left-4 top-4 z-30 rounded-full bg-white/90 px-3 py-1.5 font-sans text-[11px] font-medium text-[#1B4D3E] shadow-[var(--shadow-sm)] backdrop-blur"
        >
          {GRANULARITY_LABELS[activeGranularity]}
        </div>

        {/* Legend — centred top, z-30. Hidden at street zoom (>=14), where the
            sold-parcel £/m² layer takes over and renders its own legend. */}
        {currentZoom < 14 && (
          <div className="pointer-events-none absolute inset-x-0 top-6 z-30 flex justify-center px-4">
            <div className="pointer-events-auto">
              <MarketMapLegend loPrice={loPrice} hiPrice={hiPrice} />
            </div>
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

              {/* Sales / Rent tab strip */}
              {tabStrip}

              <div className="flex-1 overflow-y-auto pb-safe">
                {activeTab === "rent" ? (
                  <MarketMapRentPanel />
                ) : selectedParcel ? (
                  /* Parcel detail (street zoom) takes precedence */
                  <div className="flex flex-col gap-3 p-4">
                    <button
                      type="button"
                      onClick={() => handleParcelSelect(null)}
                      className="flex items-center gap-1.5 self-start font-sans text-xs font-medium text-[#1B4D3E] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]"
                    >
                      <ArrowLeft className="size-3.5" aria-hidden="true" />
                      Back to map
                    </button>
                    <SoldParcelDetail parcel={selectedParcel} />
                  </div>
                ) : (
                  <>
                    <div className="p-4">
                      <MarketMapSummaryCards data={summaryData} />
                    </div>

                    <MarketMapFilters
                      propertyType={propertyType}
                      onPropertyTypeChange={handlePropertyTypeChange}
                      focusAreaName={focusAreaName}
                      onApply={() => {/* reactive */}}
                    />

                    {/* Selected area inside sheet — instant price card + drill-down */}
                    {selectedArea && (
                      <div className="flex flex-col gap-3 p-4">
                        <MarketMapPriceCard
                          card={areaCard ?? undefined}
                          areaName={humanizeAreaName(selectedArea.area_name, selectedArea.geography_level)}
                          isLoading={areaCardLoading}
                        />
                        <MarketMapAreaDetail
                          properties={selectedArea}
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
                  </>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Desktop right panel — search + filters + area prices (50/50 split) */}
      {rightPanel}
    </div>
  );
}
