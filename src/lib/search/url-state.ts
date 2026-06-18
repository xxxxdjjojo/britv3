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

export type SearchState = {
  listingType: ListingType;
  q: string;
  propertyType: string[];
  mustHaves: string[];
  minPrice: string;
  maxPrice: string;
  minSqft: string;
  maxSqft: string;
  beds: string;
  sort: SortOption;
  view: ViewMode;
  page: number;
};

export const DEFAULT_SEARCH_STATE: SearchState = {
  listingType: "all",
  q: "",
  propertyType: [],
  mustHaves: [],
  minPrice: "",
  maxPrice: "",
  minSqft: "",
  maxSqft: "",
  beds: "Any",
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

/**
 * Serialize search state into a URLSearchParams query string.
 * Default values are omitted so an untouched search produces an empty string.
 */
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
  if (state.beds !== DEFAULT_SEARCH_STATE.beds) params.set("beds", state.beds);
  if (state.sort !== DEFAULT_SEARCH_STATE.sort) params.set("sort", state.sort);
  if (state.view !== DEFAULT_SEARCH_STATE.view) params.set("view", state.view);
  if (state.page > 1) params.set("page", String(state.page));

  return params.toString();
}

/** Resolve the listing type from the raw `type` query param (handles legacy aliases). */
function parseListingType(raw: string | null): ListingType {
  if (raw === "rent") return "rent";
  // The public nav links use ?type=buy as an alias for sale.
  if (raw === "buy" || raw === "sale") return "sale";
  if (raw === "new_build" || raw === "new-builds") return "new_build";
  return "all";
}

function parseList(raw: string | null): string[] {
  return raw?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
}

/**
 * Parse URLSearchParams into a fully-populated SearchState, falling back to
 * defaults for anything missing or invalid.
 */
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
    beds: params.get("beds") ?? DEFAULT_SEARCH_STATE.beds,
    sort: sortRaw && VALID_SORTS.has(sortRaw) ? sortRaw : DEFAULT_SEARCH_STATE.sort,
    view: viewRaw && VALID_VIEWS.has(viewRaw) ? viewRaw : DEFAULT_SEARCH_STATE.view,
    page,
  };
}
