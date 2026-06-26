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
export type Furnishing = "any" | "furnished" | "unfurnished" | "part_furnished";
export type TriState = "any" | "yes" | "no";
export type LetAgreed = "include" | "exclude";

export const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4", "5+"] as const;
export type BedroomOption = (typeof BEDROOM_OPTIONS)[number];

export const COUNCIL_TAX_BANDS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
export type CouncilTaxBand = (typeof COUNCIL_TAX_BANDS)[number];

export type SearchState = {
  listingType: ListingType;
  q: string;
  propertyType: string[];
  mustHaves: string[];
  minPrice: string;
  maxPrice: string;
  minSqft: string;
  maxSqft: string;
  bedsMin: BedroomOption;
  bedsMax: BedroomOption;
  soldWithin: SoldWithin;
  sort: SortOption;
  view: ViewMode;
  page: number;
  // --- Lettings filters ---
  furnishing: Furnishing;
  billsIncluded: TriState;
  petsAllowed: TriState;
  studentsWelcome: TriState;
  letAgreed: LetAgreed;
  /** ISO date "YYYY-MM-DD"; empty string means no filter. */
  availableFrom: string;
  /** Positive integer string; empty string means no filter. */
  minTenancyMonths: string;
  /** Rent-only: limit to listings accepting a short (<= 6 month) fixed term. */
  shortTermLet: boolean;
  // --- Cross-tenure filters (apply to both sale and rent) ---
  /** Amenity slugs the listing must offer (matched against listing.amenities). */
  // NOTE: amenities reuse the existing `mustHaves` field above.
  /** Council tax bands to include; empty means any. */
  councilTaxBands: string[];
  /** Free-text keyword match across address, type, furnishing and amenities. */
  keywords: string;
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
  bedsMin: "Any",
  bedsMax: "Any",
  soldWithin: "all",
  sort: "most_recent",
  view: "list",
  page: 1,
  furnishing: "any",
  billsIncluded: "any",
  petsAllowed: "any",
  studentsWelcome: "any",
  letAgreed: "include",
  availableFrom: "",
  minTenancyMonths: "",
  shortTermLet: false,
  councilTaxBands: [],
  keywords: "",
};

const VALID_SORTS: ReadonlySet<SortOption> = new Set([
  "most_recent",
  "price_asc",
  "price_desc",
  "most_popular",
]);

const VALID_VIEWS: ReadonlySet<ViewMode> = new Set(["list", "map"]);

const VALID_BEDS: ReadonlySet<BedroomOption> = new Set(BEDROOM_OPTIONS);

const VALID_SOLD_WITHIN: ReadonlySet<SoldWithin> = new Set(["3m", "6m", "12m", "all"]);

const VALID_FURNISHING: ReadonlySet<Furnishing> = new Set([
  "any",
  "furnished",
  "unfurnished",
  "part_furnished",
]);

const VALID_TRISTATE: ReadonlySet<TriState> = new Set(["any", "yes", "no"]);

const VALID_LET_AGREED: ReadonlySet<LetAgreed> = new Set(["include", "exclude"]);

const VALID_COUNCIL_TAX: ReadonlySet<string> = new Set(COUNCIL_TAX_BANDS);

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
  if (state.bedsMin !== DEFAULT_SEARCH_STATE.bedsMin) params.set("bedsMin", state.bedsMin);
  if (state.bedsMax !== DEFAULT_SEARCH_STATE.bedsMax) params.set("bedsMax", state.bedsMax);
  if (state.soldWithin !== DEFAULT_SEARCH_STATE.soldWithin) {
    params.set("soldWithin", state.soldWithin);
  }
  if (state.sort !== DEFAULT_SEARCH_STATE.sort) params.set("sort", state.sort);
  if (state.view !== DEFAULT_SEARCH_STATE.view) params.set("view", state.view);
  if (state.page > 1) params.set("page", String(state.page));
  // Lettings filters — only emit when non-default
  if (state.furnishing !== DEFAULT_SEARCH_STATE.furnishing) params.set("furnishing", state.furnishing);
  if (state.billsIncluded !== DEFAULT_SEARCH_STATE.billsIncluded) params.set("bills", state.billsIncluded);
  if (state.petsAllowed !== DEFAULT_SEARCH_STATE.petsAllowed) params.set("pets", state.petsAllowed);
  if (state.studentsWelcome !== DEFAULT_SEARCH_STATE.studentsWelcome) params.set("students", state.studentsWelcome);
  if (state.letAgreed !== DEFAULT_SEARCH_STATE.letAgreed) params.set("letAgreed", state.letAgreed);
  if (state.availableFrom) params.set("availableFrom", state.availableFrom);
  if (state.minTenancyMonths) params.set("minTenancy", state.minTenancyMonths);
  if (state.shortTermLet) params.set("shortTerm", "1");
  if (state.councilTaxBands.length > 0) {
    params.set("councilTax", state.councilTaxBands.join(","));
  }
  if (state.keywords) params.set("keywords", state.keywords);

  return params.toString();
}

/** Resolve the listing type from the raw `type` query param (handles legacy aliases). */
function parseListingType(raw: string | null): ListingType {
  if (raw === "rent") return "rent";
  if (raw === "buy" || raw === "sale") return "sale";
  if (raw === "new_build" || raw === "new-builds") return "new_build";
  return "all";
}

function parseList(raw: string | null): string[] {
  return raw?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
}

function parseBeds(raw: string | null, fallback: BedroomOption): BedroomOption {
  return raw && VALID_BEDS.has(raw as BedroomOption) ? (raw as BedroomOption) : fallback;
}

function parseSoldWithin(raw: string | null): SoldWithin {
  return raw && VALID_SOLD_WITHIN.has(raw as SoldWithin)
    ? (raw as SoldWithin)
    : DEFAULT_SEARCH_STATE.soldWithin;
}

function parseFurnishing(raw: string | null): Furnishing {
  return raw && VALID_FURNISHING.has(raw as Furnishing) ? (raw as Furnishing) : "any";
}

function parseTriState(raw: string | null): TriState {
  return raw && VALID_TRISTATE.has(raw as TriState) ? (raw as TriState) : "any";
}

function parseLetAgreed(raw: string | null): LetAgreed {
  return raw && VALID_LET_AGREED.has(raw as LetAgreed) ? (raw as LetAgreed) : "include";
}

/** Accept only YYYY-MM-DD; reject structurally invalid dates (e.g. month 13). */
function parseAvailableFrom(raw: string | null): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const [, mm, dd] = raw.split("-").map(Number);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  return raw;
}

/** Accept only positive integer strings. */
function parseMinTenancy(raw: string | null): string {
  if (!raw || !/^\d+$/.test(raw)) return "";
  return Number(raw) > 0 ? raw : "";
}

/** Keep only recognised council tax bands (A–H), preserving order, de-duplicated. */
function parseCouncilTaxBands(raw: string | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const band of parseList(raw)) {
    const upper = band.toUpperCase();
    if (VALID_COUNCIL_TAX.has(upper) && !seen.has(upper)) {
      seen.add(upper);
      out.push(upper);
    }
  }
  return out;
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
    bedsMin: parseBeds(params.get("bedsMin"), DEFAULT_SEARCH_STATE.bedsMin),
    bedsMax: parseBeds(params.get("bedsMax"), DEFAULT_SEARCH_STATE.bedsMax),
    soldWithin: parseSoldWithin(params.get("soldWithin")),
    sort: sortRaw && VALID_SORTS.has(sortRaw) ? sortRaw : DEFAULT_SEARCH_STATE.sort,
    view: viewRaw && VALID_VIEWS.has(viewRaw) ? viewRaw : DEFAULT_SEARCH_STATE.view,
    page,
    furnishing: parseFurnishing(params.get("furnishing")),
    billsIncluded: parseTriState(params.get("bills")),
    petsAllowed: parseTriState(params.get("pets")),
    studentsWelcome: parseTriState(params.get("students")),
    letAgreed: parseLetAgreed(params.get("letAgreed")),
    availableFrom: parseAvailableFrom(params.get("availableFrom")),
    minTenancyMonths: parseMinTenancy(params.get("minTenancy")),
    shortTermLet: params.get("shortTerm") === "1",
    councilTaxBands: parseCouncilTaxBands(params.get("councilTax")),
    keywords: params.get("keywords") ?? "",
  };
}
