"use client";

/**
 * Search Results page — self-contained client component.
 * Includes sticky top bar, collapsible sidebar filters, property grid/list/map
 * views, and a mobile bottom action bar.
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
  BedDouble,
  Bath,
  Square,
  Bell,
  Filter,
  ArrowDownUp,
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
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
      <p className="text-sm">Loading map...</p>
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = "grid" | "list" | "map";
type SortOption = "most_recent" | "price_asc" | "price_desc" | "most_popular";
type ListingType = "all" | "sale" | "rent" | "new_build" | "commercial" | "land" | "auction";

// SearchProperty type is imported from ./actions

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "most_recent", label: "Most Recent" },
  { value: "price_asc", label: "Price Low\u2013High" },
  { value: "price_desc", label: "Price High\u2013Low" },
  { value: "most_popular", label: "Most Popular" },
];

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: "all", label: "All Properties" },
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

const EPC_COLOURS: Record<string, string> = {
  A: "bg-green-700 text-white",
  B: "bg-green-500 text-white",
  C: "bg-lime-500 text-white",
  D: "bg-yellow-500 text-neutral-900",
  E: "bg-amber-500 text-neutral-900",
  F: "bg-orange-500 text-white",
  G: "bg-red-500 text-white",
};

function EpcBadge({ rating }: Readonly<{ rating: string | null }>) {
  if (!rating || !EPC_COLOURS[rating]) {
    return (
      <span className="text-xs text-neutral-400">EPC: N/A</span>
    );
  }
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold", EPC_COLOURS[rating])}>
      EPC {rating}
    </span>
  );
}

function TenureLabel({ tenure }: Readonly<{ tenure: string | null }>) {
  if (!tenure) return null;
  const label = tenure.charAt(0).toUpperCase() + tenure.slice(1);
  return (
    <span className="text-xs text-neutral-500">{label}</span>
  );
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
    <div className="border-b border-neutral-200 py-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-semibold text-neutral-900"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {title}
        {open ? (
          <ChevronUp className="size-4 text-neutral-500" />
        ) : (
          <ChevronDown className="size-4 text-neutral-500" />
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Property card — grid variant
// ---------------------------------------------------------------------------

function SearchPropertyCardGrid({ property }: Readonly<{ property: SearchProperty }>) {
  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-neutral-200">
        {property.image ? (
          <Image
            src={property.image}
            alt={`${property.address}, ${property.city}`}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-xs">
            No image
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-lg font-semibold text-neutral-900">{formatPrice(property.price, property.listing_type)}</p>
        <p className="mt-0.5 text-sm text-neutral-500">{property.type}</p>
        <p className="mt-1 truncate text-sm text-neutral-700">
          {property.address}, {property.city} {property.postcode}
        </p>
        <div className="mt-3 flex items-center gap-4 text-sm text-neutral-500">
          <span className="flex items-center gap-1">
            <BedDouble className="size-4" />
            {property.beds} bed
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-4" />
            {property.baths} bath
          </span>
          <span className="flex items-center gap-1">
            <Square className="size-4" />
            {property.sqft.toLocaleString()} sq ft
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <EpcBadge rating={property.epc_rating} />
          <TenureLabel tenure={property.tenure} />
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Property card — list variant
// ---------------------------------------------------------------------------

function SearchPropertyCardList({ property }: Readonly<{ property: SearchProperty }>) {
  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative w-48 shrink-0 bg-neutral-200">
        {property.image ? (
          <Image
            src={property.image}
            alt={`${property.address}, ${property.city}`}
            fill
            sizes="192px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-xs">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center p-4">
        <p className="text-lg font-semibold text-neutral-900">{formatPrice(property.price, property.listing_type)}</p>
        <p className="mt-0.5 text-sm text-neutral-500">{property.type}</p>
        <p className="mt-1 truncate text-sm text-neutral-700">
          {property.address}, {property.city} {property.postcode}
        </p>
        <div className="mt-3 flex items-center gap-4 text-sm text-neutral-500">
          <span className="flex items-center gap-1">
            <BedDouble className="size-4" />
            {property.beds} bed
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-4" />
            {property.baths} bath
          </span>
          <span className="flex items-center gap-1">
            <Square className="size-4" />
            {property.sqft.toLocaleString()} sq ft
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <EpcBadge rating={property.epc_rating} />
          <TenureLabel tenure={property.tenure} />
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

  // ---------------------------------------------------------------------------
  // Initialize filter state from URL search params
  // ---------------------------------------------------------------------------

  const initialType = searchParams.get("type");
  const initialListingType: ListingType =
    initialType === "rent" ? "rent" : initialType === "buy" ? "sale" :
    (["all", "sale", "rent", "new_build", "commercial", "land", "auction"].includes(initialType ?? "") ? initialType as ListingType : "all");

  // View / sort state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortOption, setSortOption] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "most_recent",
  );

  // Filter state — initialized from URL params
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

  // Listing type filter
  const [listingType, setListingType] = useState<ListingType>(initialListingType);

  // Mobile filters panel
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Property results from server action
  const [properties, setProperties] = useState<SearchProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Map state
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<MapProvider | null>(null);
  const [mapProperties, setMapProperties] = useState<MapProperty[]>([]);
  const [mapProviders, setMapProviders] = useState<MapProvider[]>([]);

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Sync filters to URL search params
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Fetch properties with 300ms debounce
  // ---------------------------------------------------------------------------

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

  // Trigger fetch + URL sync when filters change
  useEffect(() => {
    fetchProperties();
    syncUrlParams();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchProperties, syncUrlParams]);

  // Derive active filter count for badges
  const activeFilterCount =
    (listingType !== "all" ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    selectedTypes.length +
    (selectedBedrooms !== "Any" ? 1 : 0) +
    Object.values(mustHaves).filter(Boolean).length;

  // Toggle property type checkbox
  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  // Toggle must-have
  function toggleMustHave(label: string) {
    setMustHaves((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  // Reset all filters
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

  // ---------------------------------------------------------------------------
  // Map callbacks
  // ---------------------------------------------------------------------------

  const handleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      // Filter mock properties within bounds
      const visibleProps = filteredProperties
        .filter((p) => isInBounds(p.lat, p.lng, bounds))
        .map(toMapProperty);
      setMapProperties(visibleProps);

      // Fetch nearby providers from API
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
  // Sidebar filters — shared between desktop sidebar, mobile sheet, and map sidebar
  // ---------------------------------------------------------------------------

  const filtersPanel = (
    <div className="flex h-full flex-col">
      {/* Save search */}
      <div className="px-4 pb-2 pt-4">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-brand-primary">
          <Bell className="size-4" />
          Save This Search
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Price range */}
        <FilterSection title="Price Range">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-neutral-500">Min (\u00A3)</label>
              <input
                type="number"
                placeholder="No min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-neutral-500">Max (\u00A3)</label>
              <input
                type="number"
                placeholder="No max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>
        </FilterSection>

        {/* Property type */}
        <FilterSection title="Property Type">
          <div className="flex flex-col gap-2">
            {PROPERTY_TYPES.map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
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
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  selectedBedrooms === opt
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-primary",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Must-haves */}
        <FilterSection title="Must-Haves">
          <div className="flex flex-col gap-2">
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
      <div className="flex gap-2 border-t border-neutral-200 px-4 py-4">
        <Button variant="default" className="flex-1">
          Apply Filters
        </Button>
        <Button variant="ghost" onClick={resetFilters}>
          Reset
        </Button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Map sidebar filters — area input at top, then existing filter sections
  // ---------------------------------------------------------------------------

  const mapFiltersSidebar = (
    <div className="flex h-full flex-col">
      {/* Area search */}
      <div className="border-b border-neutral-200 px-4 py-4">
        <label className="mb-1.5 block text-sm font-semibold text-neutral-900">Area</label>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
          <Search className="size-4 shrink-0 text-neutral-400" />
          <input
            type="text"
            placeholder="Enter postcode or area..."
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Property type as radio-style buttons */}
        <FilterSection title="Housing Type">
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
              <input
                type="radio"
                name="map-property-type"
                checked={selectedTypes.length === 0}
                onChange={() => setSelectedTypes([])}
                className="size-4 accent-brand-primary"
              />
              All
            </label>
            {PROPERTY_TYPES.map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                <input
                  type="radio"
                  name="map-property-type"
                  checked={selectedTypes.length === 1 && selectedTypes[0] === type}
                  onChange={() => setSelectedTypes([type])}
                  className="size-4 accent-brand-primary"
                />
                {type}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Price range */}
        <FilterSection title="Price Range">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-neutral-500">Min (\u00A3)</label>
              <input
                type="number"
                placeholder="No min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-neutral-500">Max (\u00A3)</label>
              <input
                type="number"
                placeholder="No max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
              />
            </div>
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
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  selectedBedrooms === opt
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-primary",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Must-haves */}
        <FilterSection title="Must-Haves">
          <div className="flex flex-col gap-2">
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

      {/* Reset */}
      <div className="border-t border-neutral-200 px-4 py-4">
        <Button variant="ghost" onClick={resetFilters} className="w-full">
          Reset Filters
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* ------------------------------------------------------------------ */}
      {/* Top sticky bar                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="sticky top-0 z-30 border-b border-neutral-200 bg-white shadow-sm">
        {/* Listing type filter tabs */}
        <div className="overflow-x-auto border-b border-neutral-100">
          <div className="flex items-center gap-2 px-4 py-2.5">
            {LISTING_TYPES.map((lt) => (
              <button
                key={lt.value}
                type="button"
                onClick={() => { setListingType(lt.value); setMustHaves(getDefaultMustHaves(lt.value)); }}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  listingType === lt.value
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-primary",
                )}
              >
                {lt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar, filters, sort, view toggle — hidden in map view (filters are in sidebar) */}
        {viewMode !== "map" && (
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Compact search input */}
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
              <Search className="size-4 shrink-0 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none"
                placeholder="Location\u2026"
              />
            </div>

            {/* Filters button */}
            <Button
              variant="outline"
              size="sm"
              className="hidden shrink-0 gap-1.5 sm:flex"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-brand-primary text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Sort dropdown */}
            <div className="hidden shrink-0 sm:block">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-brand-primary focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View toggle */}
            <div className="hidden shrink-0 items-center gap-1 sm:flex">
              {(
                [
                  { mode: "grid" as ViewMode, Icon: LayoutGrid, label: "Grid view" },
                  { mode: "list" as ViewMode, Icon: List, label: "List view" },
                  { mode: "map" as ViewMode, Icon: Map, label: "Map view" },
                ] as const
              ).map(({ mode, Icon, label }) => (
                <button
                  key={mode}
                  type="button"
                  aria-label={label}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "rounded-lg p-2 transition-colors",
                    viewMode === mode
                      ? "bg-brand-primary text-white"
                      : "text-neutral-500 hover:bg-neutral-100",
                  )}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* In map view, show a compact toolbar with just the view toggle */}
        {viewMode === "map" && (
          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-sm text-neutral-500">
              Drag the map to explore properties
            </p>
            <div className="flex shrink-0 items-center gap-1">
              {(
                [
                  { mode: "grid" as ViewMode, Icon: LayoutGrid, label: "Grid view" },
                  { mode: "list" as ViewMode, Icon: List, label: "List view" },
                  { mode: "map" as ViewMode, Icon: Map, label: "Map view" },
                ] as const
              ).map(({ mode, Icon, label }) => (
                <button
                  key={mode}
                  type="button"
                  aria-label={label}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "rounded-lg p-2 transition-colors",
                    viewMode === mode
                      ? "bg-brand-primary text-white"
                      : "text-neutral-500 hover:bg-neutral-100",
                  )}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results count — shown in grid/list views */}
        {viewMode !== "map" && (
          <div className="border-t border-neutral-100 px-4 py-2">
            <p className="text-sm text-neutral-500">
              <span className="font-semibold text-neutral-900">{filteredProperties.length}</span> {filteredProperties.length === 1 ? "property" : "properties"}{listingType === "rent" ? " to rent" : listingType === "sale" ? " for sale" : ""} in{" "}
              <span className="font-semibold text-neutral-900">{searchQuery || "London"}</span>
            </p>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Body                                                                 */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === "map" ? (
        /* Map view: two-column layout (map left ~70%, filters right ~30%) */
        <div className="flex flex-1">
          {/* Map container */}
          <div className="relative flex-[7]" style={{ height: "calc(100vh - 130px)" }}>
            <SearchMap
              properties={mapProperties}
              providers={mapProviders}
              onPropertyClick={handlePropertyClick}
              onProviderClick={handleProviderClick}
              onBoundsChange={handleBoundsChange}
            />

            {/* Popup card overlays — bottom-left of map */}
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
          </div>

          {/* Right sidebar filters (hidden on mobile) */}
          <aside className="hidden w-[30%] min-w-[280px] max-w-[360px] shrink-0 border-l border-neutral-200 bg-white lg:flex lg:flex-col" style={{ height: "calc(100vh - 130px)" }}>
            {mapFiltersSidebar}
          </aside>
        </div>
      ) : (
        /* Grid / List views: sidebar + content */
        <div className="flex flex-1">
          {/* Desktop sidebar (280px, hidden on mobile) */}
          <aside className="hidden w-72 shrink-0 border-r border-neutral-200 bg-white lg:flex lg:flex-col">
            {filtersPanel}
          </aside>

          {/* Main content */}
          <main className="flex-1 p-4 pb-24 lg:pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-primary" />
                <span className="ml-3 text-sm text-neutral-500">Searching properties...</span>
              </div>
            ) : showEmpty ? (
              <EmptyState />
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredProperties.map((property) => (
                  <SearchPropertyCardGrid key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredProperties.map((property) => (
                  <SearchPropertyCardList key={property.id} property={property} />
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* Map view bottom bar — results count */}
      {viewMode === "map" && (
        <div className="border-t border-neutral-200 bg-white px-4 py-2">
          <p className="text-sm text-neutral-500">
            Results:{" "}
            <span className="font-semibold text-neutral-900">{mapProperties.length}</span>{" "}
            {mapProperties.length === 1 ? "property" : "properties"}
            {" \u00B7 "}
            <span className="font-semibold text-neutral-900">{mapProviders.length}</span>{" "}
            {mapProviders.length === 1 ? "provider" : "providers"} nearby
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Mobile filters sheet (overlay)                                      */}
      {/* ------------------------------------------------------------------ */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 top-16 overflow-hidden rounded-t-2xl bg-white">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <p className="font-semibold text-neutral-900">Filters</p>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-sm text-brand-primary"
              >
                Done
              </button>
            </div>
            <div className="h-full overflow-y-auto">{filtersPanel}</div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Mobile bottom action bar (fixed, mobile only)                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-neutral-200 bg-white lg:hidden">
        <button
          type="button"
          onClick={() => setViewMode("map")}
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-neutral-600"
        >
          <Map className="size-5" />
          Map
        </button>

        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="relative flex flex-1 flex-col items-center gap-1 py-3 text-xs text-neutral-600"
        >
          <Filter className="size-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute right-1/4 top-2 flex size-4 items-center justify-center rounded-full bg-brand-primary text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-neutral-600"
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
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-neutral-50"><p className="text-sm text-neutral-400">Loading search...</p></div>}>
      <SearchPageInner />
    </Suspense>
  );
}
