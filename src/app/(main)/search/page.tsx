import { Suspense } from "react";
import { searchProperties } from "./actions";
import type { SearchFilters } from "./actions";
import { SearchClient } from "./SearchClient";
import SearchLoading from "./loading";

type SearchPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  const filters: Partial<SearchFilters> = {
    listingType: typeof params.listingType === "string" ? params.listingType : undefined,
    minPrice: typeof params.minPrice === "string" ? params.minPrice : undefined,
    maxPrice: typeof params.maxPrice === "string" ? params.maxPrice : undefined,
    beds: typeof params.beds === "string" ? params.beds : undefined,
    q: typeof params.q === "string" ? params.q : undefined,
  };

  // Also map "type" param (used by listing type tabs: ?type=rent, ?type=buy)
  if (!filters.listingType && typeof params.type === "string") {
    const t = params.type;
    filters.listingType = t === "buy" ? "sale" : t;
  }

  const { data: initialProperties } = await searchProperties(filters as SearchFilters);

  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchClient initialProperties={initialProperties} initialFilters={filters} />
    </Suspense>
  );
}
