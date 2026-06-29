// Pure filter logic for the public New Homes listing. Kept side-effect free so
// it can be unit-tested and reused both server-side (initial render) and
// client-side (instant re-filter without a round-trip).

import type { DevelopmentCard, DevelopmentSchemeType, DevelopmentStatus } from "./types";

export interface NewHomesFilters {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  bedsMin?: number;
  schemeType?: DevelopmentSchemeType;
  status?: DevelopmentStatus;
  helpToBuy?: boolean;
  firstHomes?: boolean;
  /** ISO date string — only developments completing on or before this date. */
  completionBy?: string;
}

function matchesQuery(dev: DevelopmentCard, q: string): boolean {
  const haystack = [dev.name, dev.city, dev.region, dev.postcode, dev.developer.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function filterDevelopments(
  developments: ReadonlyArray<DevelopmentCard>,
  filters: NewHomesFilters,
): DevelopmentCard[] {
  return developments.filter((dev) => {
    if (filters.q && filters.q.trim() && !matchesQuery(dev, filters.q.trim())) {
      return false;
    }
    // Price overlap: the development's range must intersect the requested band.
    if (filters.maxPrice != null && dev.priceMin != null && dev.priceMin > filters.maxPrice) {
      return false;
    }
    if (filters.minPrice != null && dev.priceMax != null && dev.priceMax < filters.minPrice) {
      return false;
    }
    if (filters.bedsMin != null && dev.bedsMax != null && dev.bedsMax < filters.bedsMin) {
      return false;
    }
    if (filters.schemeType && dev.schemeType !== filters.schemeType) {
      return false;
    }
    if (filters.status && dev.status !== filters.status) {
      return false;
    }
    if (filters.helpToBuy && !dev.helpToBuy) {
      return false;
    }
    if (filters.firstHomes && !dev.firstHomes) {
      return false;
    }
    if (filters.completionBy && dev.completionDate) {
      if (dev.completionDate > filters.completionBy) return false;
    }
    return true;
  });
}

/** Parse URLSearchParams (or a plain record) into typed filters. */
export function parseNewHomesFilters(
  params: URLSearchParams | Record<string, string | undefined>,
): NewHomesFilters {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    return params[key];
  };
  const num = (key: string): number | undefined => {
    const raw = get(key);
    if (raw == null || raw === "") return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const schemeTypes: DevelopmentSchemeType[] = [
    "houses",
    "apartments",
    "mixed",
    "retirement",
    "shared_ownership",
  ];
  const statuses: DevelopmentStatus[] = ["coming_soon", "available", "reserved", "sold_out"];
  const schemeRaw = get("scheme") as DevelopmentSchemeType | undefined;
  const statusRaw = get("status") as DevelopmentStatus | undefined;

  return {
    q: get("q"),
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    bedsMin: num("beds"),
    schemeType: schemeRaw && schemeTypes.includes(schemeRaw) ? schemeRaw : undefined,
    status: statusRaw && statuses.includes(statusRaw) ? statusRaw : undefined,
    helpToBuy: get("helpToBuy") === "1" || get("helpToBuy") === "true",
    firstHomes: get("firstHomes") === "1" || get("firstHomes") === "true",
    completionBy: get("completionBy"),
  };
}
