"use client";

/**
 * Property search page — Stitch "Search — Hemnet Style with Right Filters".
 *
 * Layout (inside the shared Header/Footer from the (main) layout):
 *   LEFT  — always-on live map at the top, then "Properties in {area}" heading
 *           + result count + sort, then a vertical list of horizontal cards.
 *   RIGHT — sticky "Refine your search" filter aside + a Contact Office card.
 *
 * The URL is the source of truth for filter state (see lib/search/url-state).
 * Listings come from the searchProperties server action (mock fallback when
 * the search_live_data feature flag is off).
 */

import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Map as MapIcon, Maximize2, Minimize2, List, Mail } from "lucide-react";
import { EmptyState } from "@/components/search/EmptyState";
import MapPropertyCard from "@/components/search/MapPropertyCard";
import MapProviderPin from "@/components/search/MapProviderPin";
import { PropertySearchCard } from "@/components/search/PropertySearchCard";
import { RefineFilters } from "@/components/search/RefineFilters";
import type {
  MapProperty,
  MapProvider,
  MapBounds,
} from "@/components/search/SearchMap";
import {
  parseSearchState,
  serializeSearchState,
  DEFAULT_SEARCH_STATE,
  type SearchState,
  type SortOption,
} from "@/lib/search/url-state";
import { searchProperties } from "./actions";
import type { SearchProperty, SearchFilters } from "./actions";

// Lazy-load SearchMap — MapLibre cannot SSR.
const SearchMap = dynamic(() => import("@/components/search/SearchMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
      <p className="text-sm">Loading map…</p>
    </div>
  ),
});

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "most_recent", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "most_popular", label: "Most popular" },
];

/** Convert a SearchProperty to the MapProperty shape expected by SearchMap. */
function toMapProperty(p: SearchProperty): MapProperty {
  return {
    id: p.id,
    slug: p.slug,
    lat: p.lat,
    lng: p.lng,
    price: p.price,
    beds: p.beds,
    baths: p.baths,
    sqft: p.sqft,
    address: `${p.address}, ${p.city} ${p.postcode}`,
    thumbnailUrl: p.image,
    listing_type: p.listing_type,
  };
}

/** Build the server-action filter payload from the URL-driven search state. */
function toSearchFilters(state: SearchState): SearchFilters {
  return {
    listingType: state.listingType,
    minPrice: state.minPrice || undefined,
    maxPrice: state.maxPrice || undefined,
    minSqft: state.minSqft || undefined,
    maxSqft: state.maxSqft || undefined,
    beds: state.bedsMin !== "Any" ? state.bedsMin : undefined,
    propertyType: state.propertyType.length > 0 ? state.propertyType : undefined,
    mustHaves: state.mustHaves,
    sort: state.sort,
    q: state.q || undefined,
  };
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL is the source of truth — derive the committed state from it.
  const committedState = useMemo(
    () => parseSearchState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // Draft state lets the user edit filters before pressing "Search".
  const [draft, setDraft] = useState<SearchState>(committedState);
  useEffect(() => {
    setDraft(committedState);
  }, [committedState]);

  const [properties, setProperties] = useState<SearchProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Map state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<MapProvider | null>(null);
  const [mapProviders, setMapProviders] = useState<MapProvider[]>([]);

  const fetchSeq = useRef(0);
  const providerSeq = useRef(0);
  const providerAbort = useRef<AbortController | null>(null);

  // Fetch listings whenever the committed (URL) state changes.
  useEffect(() => {
    const seq = ++fetchSeq.current;
    setIsLoading(true);
    searchProperties(toSearchFilters(committedState))
      .then((result) => {
        if (seq !== fetchSeq.current) return; // stale response guard
        setProperties(result.data);
        setIsLoading(false);
        // A new result set invalidates any prior marker/card selection.
        setSelectedId(null);
        setSelectedProperty(null);
        setSelectedProvider(null);
      })
      .catch(() => {
        // The action catches its own errors and returns {data,error}, but guard
        // against an unexpected throw so the spinner never hangs forever.
        if (seq !== fetchSeq.current) return;
        setProperties([]);
        setIsLoading(false);
      });
  }, [committedState]);

  // Commit the draft to the URL (the effect above then re-fetches).
  const commit = useCallback(
    (next: SearchState) => {
      const qs = serializeSearchState(next);
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
    },
    [router],
  );

  const handleFilterChange = useCallback((patch: Partial<SearchState>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSubmit = useCallback(() => {
    commit({ ...draft, page: 1 });
  }, [commit, draft]);

  const handleClear = useCallback(() => {
    setDraft(DEFAULT_SEARCH_STATE);
    commit(DEFAULT_SEARCH_STATE);
  }, [commit]);

  const handleSortChange = useCallback(
    (sort: SortOption) => {
      const next = { ...committedState, sort };
      setDraft((prev) => ({ ...prev, sort }));
      commit(next);
    },
    [committedState, commit],
  );

  // Map property markers track the current result set.
  const mapProperties = useMemo(
    () => properties.map(toMapProperty),
    [properties],
  );

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    // Panning fires moveend rapidly; cancel the prior request and drop stale
    // responses so a slow earlier fetch can't overwrite newer providers.
    const seq = ++providerSeq.current;
    providerAbort.current?.abort();
    const ctrl = new AbortController();
    providerAbort.current = ctrl;
    const params = new URLSearchParams({
      sw_lat: String(bounds.sw.lat),
      sw_lng: String(bounds.sw.lng),
      ne_lat: String(bounds.ne.lat),
      ne_lng: String(bounds.ne.lng),
    });
    fetch(`/api/providers/nearby?${params}`, { signal: ctrl.signal })
      .then((res) => res.json())
      .then((data: { providers: MapProvider[] }) => {
        if (seq === providerSeq.current) setMapProviders(data.providers ?? []);
      })
      .catch((err) => {
        if (err?.name !== "AbortError" && seq === providerSeq.current) {
          setMapProviders([]);
        }
      });
  }, []);

  const handlePropertyClick = useCallback((property: MapProperty) => {
    setSelectedId(property.id);
    setSelectedProperty(property);
    setSelectedProvider(null);
  }, []);

  const handleProviderClick = useCallback((provider: MapProvider) => {
    setSelectedProvider(provider);
    setSelectedProperty(null);
  }, []);

  const handleCardSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const resultCount = properties.length;
  const areaLabel = committedState.q || "your area";
  const showEmpty = !isLoading && resultCount === 0;

  // The map view is a real state: when active the map expands to a tall pane.
  // The Expand / Full Map View controls toggle between list and map, preserving
  // all current filters — so they perform a visible action, not just a URL write.
  const isMapView = committedState.view === "map";
  const toggleViewHref = useMemo(() => {
    const qs = serializeSearchState({
      ...committedState,
      view: isMapView ? "list" : "map",
    });
    return qs ? `/search?${qs}` : "/search";
  }, [committedState, isMapView]);

  // -----------------------------------------------------------------------
  // Map block (reused at the top of the left column)
  // -----------------------------------------------------------------------
  const mapBlock = (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200">
      <div className={isMapView ? "h-[72vh] w-full" : "aspect-[21/9] w-full"}>
        <SearchMap
          properties={mapProperties}
          providers={mapProviders}
          selectedId={selectedId}
          onPropertyClick={handlePropertyClick}
          onProviderClick={handleProviderClick}
          onBoundsChange={handleBoundsChange}
        />
      </div>

      {/* Result-count pill — real count, honest label */}
      <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full border border-brand-primary/20 bg-white/90 px-4 py-2 shadow-lg backdrop-blur">
          <span className="size-2.5 animate-pulse rounded-full bg-brand-gold" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            {areaLabel}: {resultCount} {resultCount === 1 ? "result" : "results"}
          </span>
        </div>
      </div>

      {/* Expand / collapse the map — a real layout change, filters preserved */}
      <div className="absolute inset-x-4 bottom-4 z-10 flex justify-center">
        <Link
          href={toggleViewHref}
          scroll={false}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-6 py-2.5 text-sm font-bold text-neutral-800 shadow-xl transition-colors hover:bg-muted"
        >
          {isMapView ? (
            <Minimize2 className="size-4" aria-hidden="true" />
          ) : (
            <Maximize2 className="size-4" aria-hidden="true" />
          )}
          {isMapView ? "Collapse Map" : "Expand Map Area"}
        </Link>
      </div>
    </div>
  );

  // Popup overlays for marker selection.
  const mapPopups = (
    <>
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 z-20">
          <MapPropertyCard
            property={selectedProperty}
            onClose={() => {
              setSelectedProperty(null);
              setSelectedId(null);
            }}
          />
        </div>
      )}
      {selectedProvider && (
        <div className="absolute bottom-4 left-4 z-20">
          <MapProviderPin
            provider={selectedProvider}
            onClose={() => setSelectedProvider(null)}
          />
        </div>
      )}
    </>
  );

  // -----------------------------------------------------------------------
  // Right aside — filters + Contact Office card
  // -----------------------------------------------------------------------
  const rightAside = (
    <div className="space-y-6 lg:sticky lg:top-24">
      <RefineFilters
        state={draft}
        onChange={handleFilterChange}
        onSubmit={handleSubmit}
        onClear={handleClear}
      />

      {/* Contact Office — no fabricated advisor; links to the real agents directory */}
      <div className="rounded-xl border border-neutral-200 bg-white/70 p-6 backdrop-blur-sm">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Need a hand?
        </p>
        <h3 className="mb-4 font-heading text-sm font-bold text-neutral-900">
          Speak to a local estate agent
        </h3>
        <Link
          href="/agents"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-primary/20 py-2.5 text-[11px] font-bold text-brand-primary transition-all hover:bg-brand-primary hover:text-white"
        >
          Contact Office
          <Mail className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        {/* LEFT column — map, results header, cards.
            On mobile, ordering is search(filters) → map → results, achieved by
            ordering the aside before this column at the `sm` breakpoint below. */}
        <div className="order-2 min-w-0 flex-1 lg:order-1">
          {/* Map (always-on top block) */}
          <div className="relative mb-8">{mapBlock}{mapPopups}</div>

          {/* Results header + sort */}
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-extrabold tracking-tight text-neutral-900">
                Properties in {areaLabel}
              </h1>
              <p
                className="mt-1 text-sm text-neutral-500"
                aria-live="polite"
                aria-atomic="true"
              >
                {isLoading
                  ? "Searching…"
                  : `Found ${resultCount} matching ${resultCount === 1 ? "result" : "results"}`}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
              <span className="hidden sm:inline">Sort by:</span>
              <select
                aria-label="Sort results"
                value={committedState.sort}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-brand-primary focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Results list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-primary" />
              <span className="ml-3 text-sm text-neutral-500">
                Searching properties…
              </span>
            </div>
          ) : showEmpty ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-6">
              {properties.map((property) => (
                <PropertySearchCard
                  key={property.id}
                  property={property}
                  isSelected={property.id === selectedId}
                  onSelect={handleCardSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT column — filters aside (rendered first on mobile) */}
        <aside className="order-1 w-full shrink-0 lg:order-2 lg:w-[420px]">
          {rightAside}
        </aside>
      </div>

      {/* Floating toggle — expands the map to a full pane, or back to the list */}
      <Link
        href={toggleViewHref}
        scroll={false}
        className="fixed bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-brand-primary px-8 py-3.5 font-bold text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
      >
        {isMapView ? (
          <List className="size-5" aria-hidden="true" />
        ) : (
          <MapIcon className="size-5" aria-hidden="true" />
        )}
        {isMapView ? "Show List" : "Full Map View"}
      </Link>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-neutral-400">Loading search…</p>
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
