/**
 * URL <-> search-state serialization for the property search page.
 *
 * The URL is the single source of truth for shareable filter state. This module
 * keeps that mapping in one tested place so the page component can stay thin:
 *   state -> serializeSearchState -> router.replace
 *   useSearchParams -> parseSearchState -> state
 *
 * Defaults are omitted from the query string to keep shared URLs clean.
 */

export type ListingType = "all" | "sale" | "rent" | "new_build";
export type SortOption = "most_recent" | "price_asc" | "price_desc" | "most_popular";
export type ViewMode = "list" | "map";
export type SoldWithin = "3m" | "6m" | "12m" | "all";

export type SearchState = {
  listingType: ListingType;
  q: string;
  propertyType: string[];
  mustHaves: string[];
  minPrice: string;
  maxPrice: string;
  minSqft: string;
  maxSqft: string;
  bedsMin: string;
  bedsMax: string;
  soldWithin: SoldWithin;
  sort: SortOption;
  view: ViewMode;
  page: number;
};

export const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4", "5+"] as const;

export const DEFAULT_SEARCH_STATE: SearchState = {
  listingType: "all",
  q: "",
  propertyType: [],
  mustHaves: [],
  minPrice: "",
  maxPrice: "",
  minSqft: "",
  maxSqft: "",
  bedsMin: "Any",
  bedsMax: "Any",
  soldWithin: "all",
  sort: "most_recent",
  view: "list",
  page: 1,
};

const VALID_SORTS: ReadonlySet<SortOption> = new Set([
  "most_recent",
  "price_asc",
  "price_desc",
  "most_popular",
]);

const VALID_VIEWS: ReadonlySet<ViewMode> = new Set(["list", "map"]);

const VALID_BEDS: ReadonlySet<string> = new Set(BEDROOM_OPTIONS);

const VALID_SOLD_WITHIN: ReadonlySet<SoldWithin> = new Set(["3m", "6m", "12m", "all"]);

export function serializeSearchState(state: SearchState): string {
  const params = new URLSearchParams();

  if (state.listingType !== DEFAULT_SEARCH_STATE.listingType) {
    params.set("type", state.listingType);
  }
  if (state.q) params.set("q", state.q);
  if (state.propertyType.length > 0) {
    params.set("propertyType", state.propertyType.join(","));
  }
  if (state.mustHaves.length > 0) {
    params.set("mustHaves", state.mustHaves.join(","));
  }
  if (state.minPrice) params.set("minPrice", state.minPrice);
  if (state.maxPrice) params.set("maxPrice", state.maxPrice);
  if (state.minSqft) params.set("minSqft", state.minSqft);
  if (state.maxSqft) params.set("maxSqft", state.maxSqft);
  if (state.bedsMin !== DEFAULT_SEARCH_STATE.bedsMin) params.set("bedsMin", state.bedsMin);
  if (state.bedsMax !== DEFAULT_SEARCH_STATE.bedsMax) params.set("bedsMax", state.bedsMax);
  if (state.soldWithin !== DEFAULT_SEARCH_STATE.soldWithin) {
    params.set("soldWithin", state.soldWithin);
  }
  if (state.sort !== DEFAULT_SEARCH_STATE.sort) params.set("sort", state.sort);
  if (state.view !== DEFAULT_SEARCH_STATE.view) params.set("view", state.view);
  if (state.page > 1) params.set("page", String(state.page));

  return params.toString();
}

function parseListingType(raw: string | null): ListingType {
  if (raw === "rent") return "rent";
  if (raw === "buy" || raw === "sale") return "sale";
  if (raw === "new_build" || raw === "new-builds") return "new_build";
  return "all";
}

function parseList(raw: string | null): string[] {
  return raw?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
}

function parseBeds(raw: string | null, fallback: string): string {
  return raw && VALID_BEDS.has(raw) ? raw : fallback;
}

function parseSoldWithin(raw: string | null): SoldWithin {
  return raw && VALID_SOLD_WITHIN.has(raw as SoldWithin)
    ? (raw as SoldWithin)
    : DEFAULT_SEARCH_STATE.soldWithin;
}

export function parseSearchState(params: URLSearchParams): SearchState {
  const sortRaw = params.get("sort") as SortOption | null;
  const viewRaw = params.get("view") as ViewMode | null;

  const pageRaw = Number(params.get("page"));
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return {
    listingType: parseListingType(params.get("type")),
    q: params.get("q") ?? "",
    propertyType: parseList(params.get("propertyType")),
    mustHaves: parseList(params.get("mustHaves")),
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    minSqft: params.get("minSqft") ?? "",
    maxSqft: params.get("maxSqft") ?? "",
    bedsMin: parseBeds(params.get("bedsMin"), DEFAULT_SEARCH_STATE.bedsMin),
    bedsMax: parseBeds(params.get("bedsMax"), DEFAULT_SEARCH_STATE.bedsMax),
    soldWithin: parseSoldWithin(params.get("soldWithin")),
    sort: sortRaw && VALID_SORTS.has(sortRaw) ? sortRaw : DEFAULT_SEARCH_STATE.sort,
    view: viewRaw && VALID_VIEWS.has(viewRaw) ? viewRaw : DEFAULT_SEARCH_STATE.view,
    page,
  };
}
