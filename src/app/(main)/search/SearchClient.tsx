"use client";

/**
 * Search Results — client component with interactive filters, map, and results.
 * Receives SSR-fetched initial properties from the server component wrapper.
 *
 * Layout variants (Stitch designs):
 *   discovery  — Discovery Hub: featured grid with search bar (default)
 *   list       — Traditional full-width list, no map
 *   split      — Map + List 50/50 side-by-side
 *   map        — Map fullscreen with floating card overlay
 *   map-top    — Map on top (50%), card grid below
 *   hemnet     — Hemnet-inspired: clean map top + minimal list
 */

import { useState, useCallback, useEffect, useRef } from "react";
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
  Columns2,
  LayoutPanelTop,
  AlignJustify,
  X,
  MapPin,
  Heart,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/search/EmptyState";
import MapPropertyCard from "@/components/search/MapPropertyCard";
import MapProviderPin from "@/components/search/MapProviderPin";
import type { MapProperty, MapProvider, MapBounds } from "@/components/search/SearchMap";
import { cn } from "@/lib/utils";
import { searchProperties } from "./actions";
import type { SearchProperty, SearchFilters } from "./actions";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type SearchClientProps = Readonly<{
  initialProperties: SearchProperty[];
  initialFilters: Partial<SearchFilters>;
}>;

// Lazy-load SearchMap — MapLibre cannot SSR
const SearchMap = dynamic(() => import("@/components/search/SearchMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-neutral-200 border-t-brand-primary" />
        <p className="text-sm font-medium">Loading map...</p>
      </div>
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = "discovery" | "list" | "split" | "map" | "map-top" | "hemnet";
type SortOption = "most_recent" | "price_asc" | "price_desc" | "most_popular";
type ListingType = "all" | "sale" | "rent" | "new_build" | "commercial" | "land" | "auction";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "most_recent", label: "Most Recent" },
  { value: "price_asc", label: "Price Low–High" },
  { value: "price_desc", label: "Price High–Low" },
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

const VIEW_MODES: { mode: ViewMode; Icon: React.ElementType; label: string }[] = [
  { mode: "discovery", Icon: LayoutGrid, label: "Discovery Hub" },
  { mode: "split", Icon: Columns2, label: "Map + List Split" },
  { mode: "map", Icon: Map, label: "Map Fullscreen" },
  { mode: "map-top", Icon: LayoutPanelTop, label: "Map Top" },
  { mode: "hemnet", Icon: AlignJustify, label: "Hemnet Style" },
  { mode: "list", Icon: List, label: "List View" },
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

function formatPrice(price: number, listingType?: ListingType | string): string {
  if (listingType === "rent") {
    return `£${price.toLocaleString("en-GB")}/mo`;
  }
  return `£${price.toLocaleString("en-GB")}`;
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
    return <span className="text-xs text-neutral-400">EPC: N/A</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold",
        EPC_COLOURS[rating],
      )}
    >
      EPC {rating}
    </span>
  );
}

function TenureLabel({ tenure }: Readonly<{ tenure: string | null }>) {
  if (!tenure) return null;
  const label = tenure.charAt(0).toUpperCase() + tenure.slice(1);
  return <span className="text-xs text-neutral-500">{label}</span>;
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
    <div className="border-b border-neutral-100 py-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-semibold text-neutral-900"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {title}
        {open ? (
          <ChevronUp className="size-4 text-neutral-400" />
        ) : (
          <ChevronDown className="size-4 text-neutral-400" />
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Property card — Discovery Hub / Grid variant
// ---------------------------------------------------------------------------

function SearchPropertyCardGrid({ property }: Readonly<{ property: SearchProperty }>) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Image */}
      <Link href={`/properties/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          {property.image ? (
            <Image
              src={property.image}
              alt={`${property.address}, ${property.city}`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-300">
              <MapPin className="size-8 mb-2" />
              <span className="text-xs">No image</span>
            </div>
          )}

          {/* Listing type pill */}
          <div className="absolute left-3 top-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                property.listing_type === "rent"
                  ? "bg-brand-primary-lighter text-brand-primary"
                  : "bg-brand-secondary-light text-brand-secondary",
              )}
            >
              {property.listing_type === "rent" ? "To Rent" : "For Sale"}
            </span>
          </div>

          {/* Save button */}
          <button
            type="button"
            aria-label={saved ? "Unsave property" : "Save property"}
            onClick={(e) => {
              e.preventDefault();
              setSaved((s) => !s);
            }}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500"
          >
            <Heart
              className={cn("size-4 transition-colors", saved ? "fill-red-500 text-red-500" : "")}
            />
          </button>
        </div>
      </Link>

      <Link href={`/properties/${property.slug}`} className="block">
        <div className="p-4">
          <p className="text-xl font-bold tracking-tight text-neutral-950">
            {formatPrice(property.price, property.listing_type)}
          </p>
          <p className="mt-0.5 text-sm font-medium text-neutral-500">{property.type}</p>
          <p className="mt-1.5 truncate text-sm text-neutral-700">
            {property.address}, {property.city} {property.postcode}
          </p>
          <div className="mt-3 flex items-center gap-3 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" />
              <span>{property.beds} bed</span>
            </span>
            <span className="flex items-center gap-1">
              <Bath className="size-3.5" />
              <span>{property.baths} bath</span>
            </span>
            <span className="flex items-center gap-1">
              <Square className="size-3.5" />
              <span>{property.sqft.toLocaleString()} sq ft</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <EpcBadge rating={property.epc_rating} />
            <TenureLabel tenure={property.tenure} />
          </div>
        </div>
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Property card — Hemnet / compact list variant
// ---------------------------------------------------------------------------

function SearchPropertyCardHemnet({ property }: Readonly<{ property: SearchProperty }>) {
  const [saved, setSaved] = useState(false);

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex gap-4 rounded-xl bg-white p-3 shadow-xs transition-all duration-200 hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:size-28">
        {property.image ? (
          <Image
            src={property.image}
            alt={`${property.address}, ${property.city}`}
            fill
            sizes="112px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <MapPin className="size-5 text-neutral-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight text-neutral-950">
              {formatPrice(property.price, property.listing_type)}
            </p>
            <p className="mt-0.5 truncate text-sm text-neutral-700">
              {property.address}, {property.city}
            </p>
            <p className="mt-1 text-xs text-neutral-500">{property.postcode}</p>
          </div>
          <button
            type="button"
            aria-label={saved ? "Unsave" : "Save"}
            onClick={(e) => {
              e.preventDefault();
              setSaved((s) => !s);
            }}
            className="mt-0.5 shrink-0 text-neutral-400 hover:text-red-500 transition-colors"
          >
            <Heart
              className={cn("size-4", saved ? "fill-red-500 text-red-500" : "")}
            />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <BedDouble className="size-3" />
            {property.beds}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-3" />
            {property.baths}
          </span>
          <span className="flex items-center gap-1">
            <Square className="size-3" />
            {property.sqft.toLocaleString()}
          </span>
          <EpcBadge rating={property.epc_rating} />
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Property card — List variant (horizontal)
// ---------------------------------------------------------------------------

function SearchPropertyCardList({ property }: Readonly<{ property: SearchProperty }>) {
  const [saved, setSaved] = useState(false);

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex overflow-hidden rounded-2xl bg-white shadow-xs transition-all duration-300 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative w-52 shrink-0 bg-neutral-100 sm:w-64">
        {property.image ? (
          <Image
            src={property.image}
            alt={`${property.address}, ${property.city}`}
            fill
            sizes="256px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="size-8 text-neutral-300" />
          </div>
        )}
        {/* Listing type pill */}
        <div className="absolute left-2 top-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
              property.listing_type === "rent"
                ? "bg-brand-primary-lighter text-brand-primary"
                : "bg-brand-secondary-light text-brand-secondary",
            )}
          >
            {property.listing_type === "rent" ? "To Rent" : "For Sale"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <p className="text-2xl font-bold tracking-tight text-neutral-950">
              {formatPrice(property.price, property.listing_type)}
            </p>
            <button
              type="button"
              aria-label={saved ? "Unsave" : "Save"}
              onClick={(e) => {
                e.preventDefault();
                setSaved((s) => !s);
              }}
              className="mt-1 shrink-0 text-neutral-400 hover:text-red-500 transition-colors"
            >
              <Heart
                className={cn("size-5", saved ? "fill-red-500 text-red-500" : "")}
              />
            </button>
          </div>
          <p className="mt-0.5 text-sm font-medium text-neutral-500">{property.type}</p>
          <p className="mt-1.5 text-sm text-neutral-700">
            {property.address}, {property.city} {property.postcode}
          </p>
        </div>
        <div>
          <div className="mt-4 flex items-center gap-4 text-sm text-neutral-500">
            <span className="flex items-center gap-1.5">
              <BedDouble className="size-4" />
              {property.beds} bed
            </span>
            <span className="flex items-center gap-1.5">
              <Bath className="size-4" />
              {property.baths} bath
            </span>
            <span className="flex items-center gap-1.5">
              <Square className="size-4" />
              {property.sqft.toLocaleString()} sq ft
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <EpcBadge rating={property.epc_rating} />
            <TenureLabel tenure={property.tenure} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function PropertyCardSkeleton({ variant = "grid" }: Readonly<{ variant?: "grid" | "list" | "hemnet" }>) {
  if (variant === "list") {
    return (
      <div className="flex overflow-hidden rounded-2xl bg-white shadow-xs animate-pulse">
        <div className="w-52 shrink-0 bg-neutral-100 sm:w-64" style={{ aspectRatio: "4/3" }} />
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <div className="h-7 w-36 rounded-lg bg-neutral-100" />
            <div className="mt-2 h-4 w-24 rounded-lg bg-neutral-100" />
            <div className="mt-2 h-4 w-48 rounded-lg bg-neutral-100" />
          </div>
          <div className="h-4 w-56 rounded-lg bg-neutral-100" />
        </div>
      </div>
    );
  }
  if (variant === "hemnet") {
    return (
      <div className="flex gap-4 rounded-xl bg-white p-3 shadow-xs animate-pulse">
        <div className="size-24 shrink-0 rounded-lg bg-neutral-100 sm:size-28" />
        <div className="flex flex-1 flex-col gap-2 py-1">
          <div className="h-5 w-28 rounded-lg bg-neutral-100" />
          <div className="h-4 w-40 rounded-lg bg-neutral-100" />
          <div className="h-3 w-20 rounded-lg bg-neutral-100" />
          <div className="h-3 w-32 rounded-lg bg-neutral-100" />
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-xs animate-pulse">
      <div className="aspect-[4/3] bg-neutral-100" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-6 w-32 rounded-lg bg-neutral-100" />
        <div className="h-4 w-20 rounded-lg bg-neutral-100" />
        <div className="h-4 w-48 rounded-lg bg-neutral-100" />
        <div className="h-4 w-40 rounded-lg bg-neutral-100" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function SearchClient({ initialProperties, initialFilters }: SearchClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Initialize filter state from URL search params
  // ---------------------------------------------------------------------------

  const initialType = searchParams.get("type");
  const initialListingType: ListingType =
    initialType === "rent"
      ? "rent"
      : initialType === "buy"
        ? "sale"
        : (["all", "sale", "rent", "new_build", "commercial", "land", "auction"].includes(
              initialType ?? "",
            )
            ? (initialType as ListingType)
            : "all");

  // View / sort state
  const [viewMode, setViewMode] = useState<ViewMode>("discovery");
  const [sortOption, setSortOption] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "most_recent",
  );

  // Filter state — initialized from server-provided filters or URL params
  const [minPrice, setMinPrice] = useState(
    initialFilters.minPrice ?? searchParams.get("minPrice") ?? "",
  );
  const [maxPrice, setMaxPrice] = useState(
    initialFilters.maxPrice ?? searchParams.get("maxPrice") ?? "",
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchParams.get("propertyType")?.split(",").filter(Boolean) ?? [],
  );
  const [selectedBedrooms, setSelectedBedrooms] = useState(
    initialFilters.beds ?? searchParams.get("beds") ?? "Any",
  );
  const [mustHaves, setMustHaves] = useState<Record<string, boolean>>(() => {
    const defaults = getDefaultMustHaves(initialListingType);
    const urlMustHaves = searchParams.get("mustHaves")?.split(",").filter(Boolean) ?? [];
    for (const key of urlMustHaves) {
      if (key in defaults) defaults[key] = true;
    }
    return defaults;
  });
  const [searchQuery, setSearchQuery] = useState(
    initialFilters.q ?? searchParams.get("q") ?? "",
  );

  // Listing type filter
  const [listingType, setListingType] = useState<ListingType>(initialListingType);

  // Mobile filters panel
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Property results from server action — seeded with SSR data
  const [properties, setProperties] = useState<SearchProperty[]>(initialProperties);
  const [isLoading, setIsLoading] = useState(initialProperties.length === 0);

  // Map state
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<MapProvider | null>(null);
  const [mapProperties, setMapProperties] = useState<MapProperty[]>([]);
  const [mapProviders, setMapProviders] = useState<MapProvider[]>([]);

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track whether this is the first render (skip fetch if SSR provided data)
  const isInitialMount = useRef(initialProperties.length > 0);

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
      const activeMustHaves = Object.entries(mh)
        .filter(([, v]) => v)
        .map(([k]) => k);
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
        mustHaves: Object.entries(mustHaves)
          .filter(([, v]) => v)
          .map(([k]) => k),
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
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
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

  // ---------------------------------------------------------------------------
  // Map callbacks
  // ---------------------------------------------------------------------------

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
  // Shared filters panel
  // ---------------------------------------------------------------------------

  const filtersPanel = (
    <div className="flex h-full flex-col">
      {/* Save search */}
      <div className="px-4 pb-2 pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-brand-primary hover:bg-brand-primary-lighter hover:text-brand-primary"
        >
          <Bell className="size-4" />
          Save This Search
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Price range */}
        <FilterSection title="Price Range">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-neutral-500">Min (£)</label>
              <input
                type="number"
                placeholder="No min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none ring-1 ring-neutral-200 transition focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-neutral-500">Max (£)</label>
              <input
                type="number"
                placeholder="No max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none ring-1 ring-neutral-200 transition focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>
        </FilterSection>

        {/* Property type */}
        <FilterSection title="Property Type">
          <div className="flex flex-col gap-2">
            {PROPERTY_TYPES.map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-700"
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleType(type)}
                  className="size-4 rounded accent-brand-primary"
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
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  selectedBedrooms === opt
                    ? "bg-brand-primary text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-brand-primary-lighter hover:text-brand-primary",
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
              <label
                key={label}
                className="flex cursor-pointer items-center justify-between text-sm text-neutral-700"
              >
                {label}
                <button
                  type="button"
                  role="switch"
                  aria-checked={mustHaves[label]}
                  onClick={() => toggleMustHave(label)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                    mustHaves[label] ? "bg-brand-primary" : "bg-neutral-200",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
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
      <div className="flex gap-2 border-t border-neutral-100 px-4 py-4">
        <Button
          variant="default"
          className="flex-1 bg-brand-primary font-semibold text-white hover:bg-brand-primary/90"
        >
          Apply Filters
        </Button>
        <Button
          variant="ghost"
          onClick={resetFilters}
          className="text-neutral-600 hover:text-neutral-900"
        >
          Reset
        </Button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Map sidebar filters (for map view — area input at top)
  // ---------------------------------------------------------------------------

  const mapFiltersSidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-100 px-4 py-4">
        <label className="mb-1.5 block text-sm font-semibold text-neutral-900">Area</label>
        <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 ring-1 ring-neutral-200 transition focus-within:ring-2 focus-within:ring-brand-primary">
          <Search className="size-4 shrink-0 text-neutral-400" />
          <input
            type="text"
            placeholder="Enter postcode or area..."
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">{filtersPanel}</div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // View toggle — 6 layout modes
  // ---------------------------------------------------------------------------

  const viewToggle = (
    <div className="hidden items-center gap-0.5 rounded-xl bg-neutral-100 p-1 sm:flex">
      {VIEW_MODES.map(({ mode, Icon, label }) => (
        <button
          key={mode}
          type="button"
          aria-label={label}
          title={label}
          onClick={() => setViewMode(mode)}
          className={cn(
            "min-h-[36px] min-w-[36px] rounded-lg p-2 transition-all duration-150",
            viewMode === mode
              ? "bg-white text-brand-primary shadow-xs"
              : "text-neutral-500 hover:text-neutral-800",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Top sticky bar
  // ---------------------------------------------------------------------------

  const topBar = (
    <div className="sticky top-0 z-30 bg-white shadow-xs">
      {/* Listing type tabs */}
      <div className="overflow-x-auto border-b border-neutral-100">
        <div className="flex items-center gap-1.5 px-4 py-2.5">
          {LISTING_TYPES.map((lt) => (
            <button
              key={lt.value}
              type="button"
              onClick={() => {
                setListingType(lt.value);
                setMustHaves(getDefaultMustHaves(lt.value));
              }}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                listingType === lt.value
                  ? "bg-brand-primary text-white"
                  : "bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              )}
            >
              {lt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + toolbar */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Search input */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-neutral-50 px-3.5 py-2.5 ring-1 ring-neutral-200 transition focus-within:ring-2 focus-within:ring-brand-primary">
          <Search className="size-4 shrink-0 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none"
            placeholder="Location, postcode or area…"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="shrink-0 text-neutral-400 hover:text-neutral-700 transition-colors"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filters button */}
        <Button
          variant="outline"
          size="sm"
          className="hidden shrink-0 gap-1.5 rounded-xl border-neutral-200 sm:flex"
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
            className="rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700 ring-1 ring-neutral-200 transition focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* View toggle */}
        {viewToggle}
      </div>

      {/* Results count */}
      <div className="border-t border-neutral-100 px-4 py-2">
        <p className="text-sm text-neutral-500">
          <span className="font-semibold text-neutral-900">
            {filteredProperties.length.toLocaleString()}
          </span>{" "}
          {filteredProperties.length === 1 ? "property" : "properties"}
          {listingType === "rent"
            ? " to rent"
            : listingType === "sale"
              ? " for sale"
              : ""}{" "}
          in{" "}
          <span className="font-semibold text-neutral-900">{searchQuery || "London"}</span>
        </p>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render body based on viewMode
  // ---------------------------------------------------------------------------

  // Shared map component
  const mapComponent = (
    <SearchMap
      properties={mapProperties}
      providers={mapProviders}
      onPropertyClick={handlePropertyClick}
      onProviderClick={handleProviderClick}
      onBoundsChange={handleBoundsChange}
    />
  );

  // Shared map overlays
  const mapOverlay = (
    <>
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
    </>
  );

  // Grid / discovery cards
  const gridCards = isLoading ? (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <PropertyCardSkeleton key={i} variant="grid" />
      ))}
    </div>
  ) : showEmpty ? (
    <EmptyState />
  ) : (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filteredProperties.map((p) => (
        <SearchPropertyCardGrid key={p.id} property={p} />
      ))}
    </div>
  );

  // List cards
  const listCards = isLoading ? (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <PropertyCardSkeleton key={i} variant="list" />
      ))}
    </div>
  ) : showEmpty ? (
    <EmptyState />
  ) : (
    <div className="flex flex-col gap-4">
      {filteredProperties.map((p) => (
        <SearchPropertyCardList key={p.id} property={p} />
      ))}
    </div>
  );

  // Hemnet cards
  const hemnetCards = isLoading ? (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <PropertyCardSkeleton key={i} variant="hemnet" />
      ))}
    </div>
  ) : showEmpty ? (
    <EmptyState />
  ) : (
    <div className="flex flex-col gap-2">
      {filteredProperties.map((p) => (
        <SearchPropertyCardHemnet key={p.id} property={p} />
      ))}
    </div>
  );

  // ---------------------------------------------------------------------------
  // discovery — Featured grid
  // ---------------------------------------------------------------------------
  const discoveryBody = (
    <div className="flex flex-1">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 bg-white lg:flex lg:flex-col" style={{ borderRight: "1px solid #f1f1f5" }}>
        {filtersPanel}
      </aside>

      {/* Main grid */}
      <main className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-6">
        {/* Discovery header */}
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="size-4 text-brand-secondary" />
          <h2 className="font-heading text-sm font-semibold tracking-wide text-neutral-500 uppercase">
            Discovery Hub
          </h2>
        </div>
        {gridCards}
      </main>
    </div>
  );

  // ---------------------------------------------------------------------------
  // list — Full-width list, no map
  // ---------------------------------------------------------------------------
  const listBody = (
    <div className="flex flex-1">
      <aside className="hidden w-72 shrink-0 bg-white lg:flex lg:flex-col" style={{ borderRight: "1px solid #f1f1f5" }}>
        {filtersPanel}
      </aside>
      <main className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-6">
        {listCards}
      </main>
    </div>
  );

  // ---------------------------------------------------------------------------
  // split — Map left 50%, list right 50%
  // ---------------------------------------------------------------------------
  const splitBody = (
    <div className="flex flex-1" style={{ height: "calc(100vh - 170px)" }}>
      {/* List panel */}
      <div className="w-1/2 shrink-0 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <PropertyCardSkeleton key={i} variant="hemnet" />
            ))}
          </div>
        ) : showEmpty ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredProperties.map((p) => (
              <SearchPropertyCardHemnet key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>

      {/* Map panel */}
      <div className="relative flex-1">
        {mapComponent}
        {mapOverlay}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // map — Fullscreen map with filters sidebar on right
  // ---------------------------------------------------------------------------
  const mapBody = (
    <div className="flex flex-1" style={{ height: "calc(100vh - 170px)" }}>
      {/* Map fills available space */}
      <div className="relative flex-1">
        {mapComponent}
        {mapOverlay}

        {/* Floating result pill */}
        <div className="absolute bottom-4 right-4 z-10">
          <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-neutral-700 shadow-md backdrop-blur-sm">
            {mapProperties.length} {mapProperties.length === 1 ? "property" : "properties"} in view
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <aside
        className="hidden w-[30%] min-w-[280px] max-w-[360px] shrink-0 bg-white lg:flex lg:flex-col"
        style={{ borderLeft: "1px solid #f1f1f5" }}
      >
        {mapFiltersSidebar}
      </aside>
    </div>
  );

  // ---------------------------------------------------------------------------
  // map-top — Map top half, card grid bottom half
  // ---------------------------------------------------------------------------
  const mapTopBody = (
    <div className="flex flex-1 flex-col">
      {/* Map top */}
      <div className="relative w-full" style={{ height: "50vh" }}>
        {mapComponent}
        {mapOverlay}
      </div>

      {/* Cards bottom */}
      <div className="flex flex-1">
        <aside className="hidden w-72 shrink-0 bg-white lg:flex lg:flex-col" style={{ borderRight: "1px solid #f1f1f5" }}>
          {filtersPanel}
        </aside>
        <div className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-6">
          {gridCards}
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // hemnet — Map top, compact list below (Hemnet-inspired)
  // ---------------------------------------------------------------------------
  const hemnetBody = (
    <div className="flex flex-1 flex-col">
      {/* Map top — slightly smaller */}
      <div className="relative w-full" style={{ height: "42vh" }}>
        {mapComponent}
        {mapOverlay}

        {/* Floating search pill on map */}
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-md backdrop-blur-sm">
            <MapPin className="size-4 text-brand-primary" />
            <span className="text-sm font-medium text-neutral-700">
              {searchQuery || "London"}
            </span>
          </div>
        </div>
      </div>

      {/* Compact list below */}
      <div className="flex flex-1">
        {/* Minimal sidebar */}
        <aside className="hidden w-64 shrink-0 overflow-y-auto bg-white p-4 lg:block" style={{ borderRight: "1px solid #f1f1f5" }}>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Filters
          </div>
          {filtersPanel}
        </aside>

        {/* Hemnet-style list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 lg:px-6 lg:pb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-600">
              {filteredProperties.length.toLocaleString()} results
            </p>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700 ring-1 ring-neutral-200 focus:outline-none focus:ring-brand-primary"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {hemnetCards}
        </div>
      </div>
    </div>
  );

  // Select body based on view mode
  const bodyContent = {
    discovery: discoveryBody,
    list: listBody,
    split: splitBody,
    map: mapBody,
    "map-top": mapTopBody,
    hemnet: hemnetBody,
  }[viewMode];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-neutral-50">
      {topBar}

      {bodyContent}

      {/* Mobile filters sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 overflow-hidden bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3.5">
              <p className="font-heading text-base font-semibold text-neutral-900">Filters</p>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
                aria-label="Close filters"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="h-full overflow-y-auto">{filtersPanel}</div>
          </div>
        </div>
      )}

      {/* Mobile bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-neutral-100 bg-white/95 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={() => setViewMode("map")}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
            viewMode === "map" ? "text-brand-primary" : "text-neutral-500",
          )}
        >
          <Map className="size-5" />
          Map
        </button>

        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="relative flex flex-1 flex-col items-center gap-1 py-3 text-xs text-neutral-500"
        >
          <Filter className="size-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute right-1/4 top-2 flex size-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-neutral-500"
        >
          <ArrowDownUp className="size-5" />
          Sort
        </button>
      </div>
    </div>
  );
}
