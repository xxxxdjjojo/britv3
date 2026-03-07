"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SearchFilters,
  type SearchFilterParams,
} from "@/components/marketplace/SearchFilters";
import { ProviderCard } from "@/components/marketplace/ProviderCard";
import { Loader2, Search } from "lucide-react";
import type { ServiceCategory } from "@/types/marketplace";

type ProviderResult = {
  slug: string;
  business_name: string;
  services: ServiceCategory[];
  average_rating: number;
  review_count: number;
  distance_miles?: number;
  years_in_business: number;
};

type MarketplaceSearchProps = Readonly<{
  initialCategory?: string;
  initialPostcode?: string;
  initialRadius?: number;
  initialMinRating?: number;
  initialQuery?: string;
}>;

export function MarketplaceSearch({
  initialCategory,
  initialPostcode,
  initialRadius,
  initialMinRating,
  initialQuery,
}: MarketplaceSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SearchFilterParams>({
    service_category: initialCategory as ServiceCategory | undefined,
    postcode: initialPostcode,
    radius: initialRadius ?? 25,
    min_rating: initialMinRating,
    search_query: initialQuery,
  });

  const [providers, setProviders] = useState<ProviderResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchProviders = useCallback(async (params: SearchFilterParams) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (params.service_category) qs.set("category", params.service_category);
      if (params.postcode) qs.set("postcode", params.postcode);
      if (params.radius) qs.set("radius", String(params.radius));
      if (params.min_rating) qs.set("min_rating", String(params.min_rating));
      if (params.search_query) qs.set("q", params.search_query);

      const res = await fetch(`/api/providers/search?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers ?? []);
      } else {
        setProviders([]);
      }
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  const handleFilterChange = useCallback(
    (newFilters: SearchFilterParams) => {
      setFilters(newFilters);

      // Update URL search params
      const params = new URLSearchParams();
      if (newFilters.service_category) params.set("category", newFilters.service_category);
      if (newFilters.postcode) params.set("postcode", newFilters.postcode);
      if (newFilters.radius !== 25) params.set("radius", String(newFilters.radius));
      if (newFilters.min_rating) params.set("min_rating", String(newFilters.min_rating));
      if (newFilters.search_query) params.set("q", newFilters.search_query);

      router.replace(`/marketplace?${params.toString()}`, { scroll: false });
      fetchProviders(newFilters);
    },
    [router, fetchProviders],
  );

  // Initial load
  useEffect(() => {
    fetchProviders(filters);
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <SearchFilters filters={filters} onChange={handleFilterChange} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : providers.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {providers.length} provider{providers.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <ProviderCard key={provider.slug} {...provider} />
            ))}
          </div>
        </>
      ) : searched ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <Search className="size-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            No providers found
          </p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your filters or expanding your search radius
          </p>
        </div>
      ) : null}
    </div>
  );
}
