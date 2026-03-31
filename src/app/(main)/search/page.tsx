"use client";

/**
 * Search Results page — Stitch Discovery Hub design.
 * Sticky filter bar, collapsible sidebar, property grid/list/map/split views.
 */

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Map,
  Columns2,
  BedDouble,
  Bath,
  Square,
  Bell,
  Filter,
  ArrowDownUp,
  X,
  Eye,
  Bookmark,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/search/EmptyState";
import MapPropertyCard from "@/components/search/MapPropertyCard";
import MapProviderPin from "@/components/search/MapProviderPin";
import type { MapProperty, MapProvider, MapBounds } from "@/components/search/SearchMap";
import { cn } from "@/lib/utils";
import { searchProperties } from "./actions";
import type { SearchProperty, SearchFilters } from "./actions";

// Lazy-load SearchMap — MapLibre cannot SSR
const SearchMap = dynamic(() => import("@/components/search/SearchMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100">
      <div className="size-5 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-primary" />
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = "grid" | "list" | "map" | "split";
type SortOption = "most_recent" | "price_asc" | "price_desc" | "most_popular";
type ListingType = "all" | "sale" | "rent" | "new_build" | "commercial" | "land" | "auction";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "most_recent", label: "Newest First" },
  { value: "price_asc", label: "Price: Low–High" },
  { value: "price_desc", label: "Price: High–Low" },
  { value: "most_popular", label: "Most Popular" },
];

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "To Rent" },
  { value: "new_build", label: "New Builds" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "auction", label: "Auctions" },
];

const PROPERTY_TYPES = ["Detached", "Semi-detached", "Terraced", "Flat", "Bungalow"];
const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4", "5+"];
const MUST_HAVES_ALL = ["Garden", "Parking", "Garage", "Chain Free"];
const MUST_HAVES_RENT = ["Garden", "Parking", "Garage"];

function getDefaultMustHaves(type: string): Record<string, boolean> {
  const keys = type === "rent" ? MUST_HAVES_RENT : MUST_HAVES_ALL;
  return Object.fromEntries(keys.map((k) => [k, false]));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number, listingType?: ListingType): string {
  if (listingType === "rent") {
    return `\u00A3${price.toLocaleString("en-GB")}/mo`;
  }
  return `\u00A3${price.toLocaleString("en-GB")}`;
}

/** Convert a SearchProperty to the MapProperty shape expected by SearchMap */
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

/** Check if a point falls within a bounding box */
function isInBounds(lat: number, lng: number, bounds: MapBounds): boolean {
  return (
    lat >= bounds.sw.lat &&
    lat <= bounds.ne.lat &&
    lng >= bounds.sw.lng &&
    lng <= bounds.ne.lng
  );
}

// ---------------------------------------------------------------------------
// Collapsible filter section
// ---------------------------------------------------------------------------

function FilterSection({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  const [open, setOpen] = useState(true);

  return (
    <div className="py-5 border-b border-neutral-100 last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-widest text-brand-primary"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {title}
        {open ? (
          <ChevronUp className="size-3.5 text-neutral-400" />
        ) : (
          <ChevronDown className="size-3.5 text-neutral-400" />
        )}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Property card — grid variant (Stitch editorial style)
// ---------------------------------------------------------------------------

function SearchPropertyCardGrid({ property }: Readonly<{ property: SearchProperty }>) {
  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group block overflow-hidden bg-white transition-all duration-500"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        {property.image ? (
          <Image
            src={property.image}
            alt={`${property.address}, ${property.city}`}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Eye className="size-8 text-neutral-300" />
          </div>
        )}

        {/* Listing type badge */}
        <div className="absolute left-4 top-4">
          <span className="rounded-full bg-white/90 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-widest text-brand-primary backdrop-blur-sm">
            {property.listing_type === "rent" ? "To Rent" : "For Sale"}
          </span>
        </div>

        {/* Save button */}
        <button
          type="button"
          aria-label="Save property"
          onClick={(e) => e.preventDefault()}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
        >
          <Bookmark className="size-4" />
        </button>
      </div>

      {/* Info */}
      <div className="pb-4 pt-6">
        <div className="mb-1">
          <p className="font-heading text-xl font-extrabold tracking-tight text-brand-primary">
            {formatPrice(property.price, property.listing_type)}
          </p>
          <p className="mt-0.5 text-sm italic text-neutral-500">
            {property.address}, {property.city} {property.postcode}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-6 text-[0.6875rem] font-bold uppercase tracking-widest text-neutral-400">
          <span className="flex items-center gap-1.5">
            <BedDouble className="size-3.5" />
            {property.beds} {property.beds === 1 ? "Bed" : "Beds"}
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="size-3.5" />
            {property.baths} {property.baths === 1 ? "Bath" : "Baths"}
          </span>
          {property.sqft > 0 && (
            <span className="flex items-center gap-1.5">
              <Square className="size-3.5" />
              {property.sqft.toLocaleString()} sqft
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Property card — list variant (horizontal)
// ---------------------------------------------------------------------------

function SearchPropertyCardList({ property }: Readonly<{ property: SearchProperty }>) {
  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex overflow-hidden bg-white transition-all duration-500"
    >
      {/* Image */}
      <div className="relative w-48 shrink-0 overflow-hidden bg-neutral-100">
        {property.image ? (
          <Image
            src={property.image}
            alt={`${property.address}, ${property.city}`}
            fill
            sizes="192px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Eye className="size-6 text-neutral-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-center px-6 py-5">
        <p className="font-heading text-xl font-extrabold tracking-tight text-brand-primary">
          {formatPrice(property.price, property.listing_type)}
        </p>
        <p className="mt-0.5 text-sm italic text-neutral-500">
          {property.address}, {property.city} {property.postcode}
        </p>
        <div className="mt-3 flex items-center gap-6 text-[0.6875rem] font-bold uppercase tracking-widest text-neutral-400">
          <span className="flex items-center gap-1.5">
            <BedDouble className="size-3.5" />
            {property.beds} {property.beds === 1 ? "Bed" : "Beds"}
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="size-3.5" />
            {property.baths} {property.baths === 1 ? "Bath" : "Baths"}
          </span>
          {property.sqft > 0 && (
            <span className="flex items-center gap-1.5">
              <Square className="size-3.5" />
              {property.sqft.toLocaleString()} sqft
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-neutral-400">
            {property.type}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialType = searchParams.get("type");
  const initialListingType: ListingType =
    initialType === "rent" ? "rent" : initialType === "buy" ? "sale" :
    (["all", "sale", "rent", "new_build", "commercial", "land", "auction"].includes(initialType ?? "") ? initialType as ListingType : "all");

  // View / sort state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortOption, setSortOption] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "most_recent",
  );

  // Filter state
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchParams.get("propertyType")?.split(",").filter(Boolean) ?? [],
  );
  const [selectedBedrooms, setSelectedBedrooms] = useState(
    searchParams.get("beds") ?? "Any",
  );
  const [mustHaves, setMustHaves] = useState<Record<string, boolean>>(() => {
    const defaults = getDefaultMustHaves(initialListingType);
    const urlMustHaves = searchParams.get("mustHaves")?.split(",").filter(Boolean) ?? [];
    for (const key of urlMustHaves) {
      if (key in defaults) defaults[key] = true;
    }
    return defaults;
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [listingType, setListingType] = useState<ListingType>(initialListingType);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Property results
  const [properties, setProperties] = useState<SearchProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Map state
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<MapProvider | null>(null);
  const [mapProperties, setMapProperties] = useState<MapProperty[]>([]);
  const [mapProviders, setMapProviders] = useState<MapProvider[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync filters to URL
  const syncUrlParams = useCallback(
    (overrides?: Partial<{
      listingType: string;
      minPrice: string;
      maxPrice: string;
      beds: string;
      propertyType: string[];
      mustHaves: Record<string, boolean>;
      sort: string;
      q: string;
    }>) => {
      const params = new URLSearchParams();
      const lt = overrides?.listingType ?? listingType;
      const min = overrides?.minPrice ?? minPrice;
      const max = overrides?.maxPrice ?? maxPrice;
      const beds = overrides?.beds ?? selectedBedrooms;
      const pt = overrides?.propertyType ?? selectedTypes;
      const mh = overrides?.mustHaves ?? mustHaves;
      const sort = overrides?.sort ?? sortOption;
      const q = overrides?.q ?? searchQuery;

      if (lt !== "all") params.set("type", lt);
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
      if (beds !== "Any") params.set("beds", beds);
      if (pt.length > 0) params.set("propertyType", pt.join(","));
      const activeMustHaves = Object.entries(mh).filter(([, v]) => v).map(([k]) => k);
      if (activeMustHaves.length > 0) params.set("mustHaves", activeMustHaves.join(","));
      if (sort !== "most_recent") params.set("sort", sort);
      if (q) params.set("q", q);

      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "/search", { scroll: false });
    },
    [listingType, minPrice, maxPrice, selectedBedrooms, selectedTypes, mustHaves, sortOption, searchQuery, router],
  );

  const fetchProperties = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      const filters: SearchFilters = {
        listingType,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        beds: selectedBedrooms !== "Any" ? selectedBedrooms : undefined,
        propertyType: selectedTypes.length > 0 ? selectedTypes : undefined,
        mustHaves: Object.entries(mustHaves).filter(([, v]) => v).map(([k]) => k),
        sort: sortOption,
        q: searchQuery || undefined,
      };

      const result = await searchProperties(filters);
      setProperties(result.data);
      setIsLoading(false);
    }, 300);
  }, [listingType, minPrice, maxPrice, selectedBedrooms, selectedTypes, mustHaves, sortOption, searchQuery]);

  useEffect(() => {
    fetchProperties();
    syncUrlParams();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchProperties, syncUrlParams]);

  const activeFilterCount =
    (listingType !== "all" ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    selectedTypes.length +
    (selectedBedrooms !== "Any" ? 1 : 0) +
    Object.values(mustHaves).filter(Boolean).length;

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function toggleMustHave(label: string) {
    setMustHaves((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function resetFilters() {
    setListingType("all");
    setMinPrice("");
    setMaxPrice("");
    setSelectedTypes([]);
    setSelectedBedrooms("Any");
    setMustHaves(getDefaultMustHaves("all"));
    setSearchQuery("");
  }

  const filteredProperties = properties;
  const showEmpty = !isLoading && filteredProperties.length === 0;

  // Map callbacks
  const handleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      const visibleProps = filteredProperties
        .filter((p) => isInBounds(p.lat, p.lng, bounds))
        .map(toMapProperty);
      setMapProperties(visibleProps);

      const params = new URLSearchParams({
        sw_lat: String(bounds.sw.lat),
        sw_lng: String(bounds.sw.lng),
        ne_lat: String(bounds.ne.lat),
        ne_lng: String(bounds.ne.lng),
      });
      fetch(`/api/providers/nearby?${params}`)
        .then((res) => res.json())
        .then((data: { providers: MapProvider[] }) => {
          setMapProviders(data.providers ?? []);
        })
        .catch(() => {
          setMapProviders([]);
        });
    },
    [filteredProperties],
  );

  const handlePropertyClick = useCallback((property: MapProperty) => {
    setSelectedProperty(property);
    setSelectedProvider(null);
  }, []);

  const handleProviderClick = useCallback((provider: MapProvider) => {
    setSelectedProvider(provider);
    setSelectedProperty(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Filters sidebar content (shared between desktop, mobile, and map views)
  // ---------------------------------------------------------------------------

  const filtersContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-6 pb-2 pt-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-brand-primary">Filters</h2>
        <p className="mt-0.5 text-xs text-neutral-400">Refine your search</p>
      </div>

      {/* Save search */}
      <div className="px-6 pb-2">
        <button
          type="button"
          className="flex items-center gap-2 text-xs font-semibold text-brand-primary hover:opacity-70"
        >
          <Bell className="size-3.5" />
          Save This Search
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        {/* Price range */}
        <FilterSection title="Price Range">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1.5 block text-[0.625rem] font-bold uppercase tracking-widest text-neutral-400">
                Min (£)
              </label>
              <input
                type="number"
                placeholder="No min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-[0.625rem] font-bold uppercase tracking-widest text-neutral-400">
                Max (£)
              </label>
              <input
                type="number"
                placeholder="No max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </div>
        </FilterSection>

        {/* Property type */}
        <FilterSection title="Property Type">
          <div className="flex flex-col gap-2.5">
            {PROPERTY_TYPES.map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-3 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleType(type)}
                  className="size-4 rounded border-neutral-300 accent-brand-primary"
                />
                {type}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Bedrooms */}
        <FilterSection title="Bedrooms">
          <div className="flex flex-wrap gap-2">
            {BEDROOM_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectedBedrooms(opt)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                  selectedBedrooms === opt
                    ? "bg-brand-primary text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Must-haves */}
        <FilterSection title="Must-Haves">
          <div className="flex flex-col gap-3">
            {(listingType === "rent" ? MUST_HAVES_RENT : MUST_HAVES_ALL).map((label) => (
              <label key={label} className="flex cursor-pointer items-center justify-between text-sm text-neutral-700">
                {label}
                <button
                  type="button"
                  role="switch"
                  aria-checked={mustHaves[label]}
                  onClick={() => toggleMustHave(label)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                    mustHaves[label] ? "bg-brand-primary" : "bg-neutral-200",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform",
                      mustHaves[label] ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>
              </label>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4">
        <button
          type="button"
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-widest text-neutral-400 hover:text-red-500"
        >
          <Trash2 className="size-3" />
          Clear All
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-widest text-brand-primary hover:opacity-70"
        >
          <Bookmark className="size-3" />
          Save Search
        </button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // View mode icons config
  // ---------------------------------------------------------------------------

  const viewModes: { mode: ViewMode; Icon: typeof LayoutGrid; label: string }[] = [
    { mode: "grid", Icon: LayoutGrid, label: "Grid view" },
    { mode: "list", Icon: List, label: "List view" },
    { mode: "split", Icon: Columns2, label: "Split view" },
    { mode: "map", Icon: Map, label: "Map view" },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className={cn(
        "flex flex-col bg-white",
        viewMode === "map" || viewMode === "split"
          ? "h-[calc(100vh-4rem)] overflow-hidden"
          : "min-h-screen",
      )}
    >
      {/* ====================================================================
          Sticky top bar
          ==================================================================== */}
      <div className="sticky top-0 z-30 bg-white/80 shadow-[0_20px_50px_rgba(26,28,28,0.04)] backdrop-blur-md">
        {/* Listing type tabs */}
        <div className="overflow-x-auto border-b border-neutral-100">
          <div className="flex items-center gap-1 px-6 py-2.5">
            {LISTING_TYPES.map((lt) => (
              <button
                key={lt.value}
                type="button"
                onClick={() => { setListingType(lt.value); setMustHaves(getDefaultMustHaves(lt.value)); }}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                  listingType === lt.value
                    ? "bg-brand-primary text-white"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
                )}
              >
                {lt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar + controls */}
        <div className="flex items-center gap-3 px-6 py-3">
          {/* Location search */}
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-neutral-50 px-4 py-2.5">
            <Search className="size-4 shrink-0 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none"
              placeholder="Enter postcode or area…"
            />
          </div>

          {/* Filters button */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className={cn(
              "hidden shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors sm:flex",
              activeFilterCount > 0
                ? "bg-brand-primary text-white"
                : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100",
            )}
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-white text-[0.625rem] font-bold text-brand-primary">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="hidden shrink-0 rounded-full bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-neutral-700 focus:outline-none focus:ring-1 focus:ring-brand-primary sm:block"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="hidden shrink-0 items-center gap-0.5 rounded-lg bg-neutral-50 p-1 sm:flex">
            {viewModes.map(({ mode, Icon, label }) => (
              <button
                key={mode}
                type="button"
                aria-label={label}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  viewMode === mode
                    ? "bg-white text-brand-primary shadow-sm"
                    : "text-neutral-400 hover:text-neutral-600",
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Results count bar */}
        {viewMode !== "map" && (
          <div className="flex items-center justify-between border-t border-neutral-50 px-6 py-2">
            <p className="text-xs text-neutral-500">
              <span className="font-semibold text-neutral-900">{filteredProperties.length}</span>{" "}
              {filteredProperties.length === 1 ? "property" : "properties"}
              {listingType === "rent" ? " to rent" : listingType === "sale" ? " for sale" : ""} in{" "}
              <span className="font-semibold text-neutral-900">{searchQuery || "London"}</span>
            </p>
          </div>
        )}
      </div>

      {/* ====================================================================
          Body — view mode routing
          ==================================================================== */}

      {/* GRID VIEW */}
      {viewMode === "grid" && (
        <div className="flex flex-1">
          {/* Desktop sidebar */}
          <aside className="hidden w-72 shrink-0 overflow-y-auto bg-neutral-50 lg:flex lg:flex-col">
            {filtersContent}
          </aside>

          {/* Grid */}
          <main className="flex-1 px-6 pb-24 pt-8 lg:pb-8">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-neutral-100" />
                ))}
              </div>
            ) : showEmpty ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProperties.map((property) => (
                  <SearchPropertyCardGrid key={property.id} property={property} />
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div className="flex flex-1">
          {/* Desktop sidebar */}
          <aside className="hidden w-72 shrink-0 overflow-y-auto bg-neutral-50 lg:flex lg:flex-col">
            {filtersContent}
          </aside>

          {/* List */}
          <main className="flex-1 px-6 pb-24 pt-8 lg:pb-8">
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex h-40 animate-pulse gap-4 overflow-hidden">
                    <div className="w-48 shrink-0 rounded-xl bg-neutral-100" />
                    <div className="flex-1 space-y-3 py-2">
                      <div className="h-5 w-32 rounded bg-neutral-100" />
                      <div className="h-4 w-48 rounded bg-neutral-100" />
                      <div className="h-4 w-40 rounded bg-neutral-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : showEmpty ? (
              <EmptyState />
            ) : (
              <div className="flex flex-col divide-y divide-neutral-50">
                {filteredProperties.map((property) => (
                  <SearchPropertyCardList key={property.id} property={property} />
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* SPLIT VIEW — list left + map right */}
      {viewMode === "split" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: list */}
          <section className="w-full overflow-y-auto bg-white px-6 pt-6 pb-8 lg:w-[42%]">
            {isLoading ? (
              <div className="flex flex-col gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] w-full animate-pulse rounded-xl bg-neutral-100" />
                ))}
              </div>
            ) : showEmpty ? (
              <EmptyState />
            ) : (
              <div className="flex flex-col gap-10">
                {filteredProperties.map((property) => (
                  <SearchPropertyCardGrid key={property.id} property={property} />
                ))}
              </div>
            )}
          </section>

          {/* Right: map */}
          <section className="hidden flex-1 lg:block">
            <SearchMap
              properties={filteredProperties.filter((p) => p.lat && p.lng).map(toMapProperty)}
              providers={mapProviders}
              onPropertyClick={handlePropertyClick}
              onProviderClick={handleProviderClick}
              onBoundsChange={handleBoundsChange}
            />

            {selectedProperty && (
              <div className="absolute bottom-4 left-[42%] z-20">
                <MapPropertyCard
                  property={selectedProperty}
                  onClose={() => setSelectedProperty(null)}
                />
              </div>
            )}
          </section>
        </div>
      )}

      {/* MAP VIEW — fullscreen map + right filter sidebar */}
      {viewMode === "map" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Map */}
          <div className="relative flex-[7]">
            <SearchMap
              properties={mapProperties}
              providers={mapProviders}
              onPropertyClick={handlePropertyClick}
              onProviderClick={handleProviderClick}
              onBoundsChange={handleBoundsChange}
            />

            {selectedProperty && (
              <div className="absolute bottom-4 left-4 z-20">
                <MapPropertyCard
                  property={selectedProperty}
                  onClose={() => setSelectedProperty(null)}
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

            {/* Results count overlay */}
            <div className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 shadow-md backdrop-blur-sm">
              <p className="text-xs font-semibold text-brand-primary">
                {mapProperties.length} {mapProperties.length === 1 ? "property" : "properties"} in view
              </p>
            </div>
          </div>

          {/* Right sidebar filters */}
          <aside
            className="hidden w-[28%] min-w-[260px] max-w-[340px] shrink-0 overflow-y-auto bg-neutral-50 lg:flex lg:flex-col"
          >
            {filtersContent}
          </aside>
        </div>
      )}

      {/* ====================================================================
          Mobile: filters sheet overlay
          ==================================================================== */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 top-16 overflow-hidden rounded-t-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <p className="font-heading text-base font-bold tracking-tight text-brand-primary">
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-brand-primary text-[0.6875rem] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full p-1 hover:bg-neutral-100"
                aria-label="Close filters"
              >
                <X className="size-4 text-neutral-600" />
              </button>
            </div>
            <div className="h-full overflow-y-auto">{filtersContent}</div>
          </div>
        </div>
      )}

      {/* ====================================================================
          Mobile bottom action bar
          ==================================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex items-center border-t border-neutral-100 bg-white/90 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setViewMode("map")}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-3 text-[0.625rem] font-bold uppercase tracking-widest transition-colors",
            viewMode === "map" ? "text-brand-primary" : "text-neutral-400",
          )}
        >
          <Map className="size-5" />
          Map
        </button>

        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="relative flex flex-1 flex-col items-center gap-1 py-3 text-[0.625rem] font-bold uppercase tracking-widest text-neutral-400"
        >
          <Filter className="size-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute right-1/4 top-2 flex size-4 items-center justify-center rounded-full bg-brand-primary text-[0.625rem] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-[0.625rem] font-bold uppercase tracking-widest text-neutral-400"
        >
          <ArrowDownUp className="size-5" />
          Sort
        </button>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-neutral-200 border-t-brand-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Loading search…
          </p>
        </div>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}
