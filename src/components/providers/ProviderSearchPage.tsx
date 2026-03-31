"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchFilters } from "@/components/marketplace/SearchFilters";
import type { SearchFilterParams } from "@/components/marketplace/SearchFilters";
import { ProviderSearchCard } from "@/components/providers/ProviderSearchCard";
import type { ServiceProviderPublicProfile } from "@/types/providers";
import type { ServiceCategory } from "@/types/marketplace";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortOption = "best_match" | "highest_rated" | "most_reviews" | "newest";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "best_match", label: "Best Match" },
  { value: "highest_rated", label: "Highest Rated" },
  { value: "most_reviews", label: "Most Reviews" },
  { value: "newest", label: "Newest" },
];

type ProviderSearchPageProps = Readonly<{
  pageTitle: string;
  pageSubtitle: string;
  defaultCategory?: ServiceCategory | null;
  categoryOptions?: { value: string; label: string }[];
  specialistBadge?: "FCA" | "RICS" | "SRA" | null;
  initialProviders: ServiceProviderPublicProfile[];
  initialCount: number;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSearchUrl(
  filters: SearchFilterParams,
  sort: SortOption,
): string {
  const params = new URLSearchParams();

  if (filters.service_category) {
    params.set("service_category", filters.service_category);
  }
  if (filters.postcode) {
    params.set("postcode", filters.postcode);
  }
  params.set("radius", String(filters.radius));
  if (filters.min_rating !== undefined) {
    params.set("min_rating", String(filters.min_rating));
  }
  if (filters.search_query) {
    params.set("search_query", filters.search_query);
  }
  if (filters.min_hourly_rate !== undefined) {
    params.set("min_hourly_rate", String(filters.min_hourly_rate));
  }
  if (filters.max_hourly_rate !== undefined) {
    params.set("max_hourly_rate", String(filters.max_hourly_rate));
  }
  if (filters.verification_badges && filters.verification_badges.length > 0) {
    params.set("verification_badges", filters.verification_badges.join(","));
  }
  params.set("sort", sort);

  return `/api/providers/search?${params.toString()}`;
}

function buildPageUrl(
  filters: SearchFilterParams,
  sort: SortOption,
): string {
  const params = new URLSearchParams();

  if (filters.service_category) {
    params.set("category", filters.service_category);
  }
  if (filters.postcode) {
    params.set("postcode", filters.postcode);
  }
  if (filters.radius !== 25) {
    params.set("radius", String(filters.radius));
  }
  if (filters.min_rating !== undefined) {
    params.set("min_rating", String(filters.min_rating));
  }
  if (filters.search_query) {
    params.set("q", filters.search_query);
  }
  if (sort !== "best_match") {
    params.set("sort", sort);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function readFiltersFromSearchParams(
  searchParams: ReturnType<typeof useSearchParams>,
  defaultCategory?: ServiceCategory | null,
): SearchFilterParams {
  return {
    service_category:
      (searchParams.get("category") as ServiceCategory | null) ??
      defaultCategory ??
      undefined,
    postcode: searchParams.get("postcode") ?? undefined,
    radius: Number(searchParams.get("radius") ?? 25),
    min_rating: searchParams.get("min_rating")
      ? Number(searchParams.get("min_rating"))
      : undefined,
    search_query: searchParams.get("q") ?? undefined,
    verification_badges: searchParams.get("verification_badges")
      ? (searchParams.get("verification_badges") as string).split(",")
      : undefined,
    min_hourly_rate: searchParams.get("min_hourly_rate")
      ? Number(searchParams.get("min_hourly_rate"))
      : undefined,
    max_hourly_rate: searchParams.get("max_hourly_rate")
      ? Number(searchParams.get("max_hourly_rate"))
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ProviderCardSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-6 bg-surface-container-low rounded-2xl shadow-sm animate-pulse">
      <div className="flex-shrink-0 w-20 h-20 rounded-full bg-surface-container-highest" />
      <div className="flex-1 space-y-3">
        <div className="h-5 w-1/2 rounded-xl bg-surface-container-highest" />
        <div className="h-4 w-1/3 rounded-xl bg-surface-container-highest" />
        <div className="h-4 w-2/3 rounded-xl bg-surface-container-highest" />
        <div className="flex gap-2 pt-2">
          <div className="h-8 w-24 rounded-xl bg-surface-container-highest" />
          <div className="h-8 w-24 rounded-xl bg-surface-container-highest" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero search bar
// ---------------------------------------------------------------------------

type HeroSearchBarProps = Readonly<{
  initialWhat: string;
  initialWhere: string;
  onSearch: (what: string, where: string) => void;
}>;

function HeroSearchBar({ initialWhat, initialWhere, onSearch }: HeroSearchBarProps) {
  const [what, setWhat] = useState(initialWhat);
  const [where, setWhere] = useState(initialWhere);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(what, where);
    },
    [onSearch, what, where],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-2xl shadow-brand-primary/20"
    >
      <div className="flex-1">
        <label htmlFor="hero-what" className="sr-only">
          What service?
        </label>
        <input
          id="hero-what"
          type="text"
          placeholder="What service?"
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          className="h-12 w-full rounded-xl bg-transparent px-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>
      <div className="flex-1">
        <label htmlFor="hero-where" className="sr-only">
          Where? (postcode)
        </label>
        <input
          id="hero-where"
          type="text"
          placeholder="Where? (postcode)"
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          className="h-12 w-full rounded-xl bg-transparent px-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>
      <button
        type="submit"
        className="h-12 min-w-[44px] shrink-0 rounded-xl bg-brand-primary px-6 text-sm font-semibold text-white hover:bg-brand-primary/90 active:scale-95 transition-all"
      >
        Search
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ProviderSearchPage({
  pageTitle,
  pageSubtitle,
  defaultCategory,
  specialistBadge,
  initialProviders,
  initialCount,
}: ProviderSearchPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SearchFilterParams>(() =>
    readFiltersFromSearchParams(searchParams, defaultCategory),
  );
  const [sort, setSort] = useState<SortOption>("best_match");
  const [providers, setProviders] =
    useState<ServiceProviderPublicProfile[]>(initialProviders);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  // Use a ref to skip the initial render (data already provided as props)
  const isFirstRender = useRef(true);

  // Sync URL + fetch results when filters or sort change (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const pageUrl = buildPageUrl(filters, sort);
    router.replace(pageUrl, { scroll: false });

    startTransition(async () => {
      try {
        const apiUrl = buildSearchUrl(filters, sort);
        const res = await fetch(apiUrl);
        if (!res.ok) {
          console.error("Provider search failed:", res.status);
          return;
        }
        const json = (await res.json()) as {
          data: ServiceProviderPublicProfile[];
          count: number;
        };
        setProviders(json.data ?? []);
        setCount(json.count ?? 0);
      } catch (err) {
        console.error("Provider search error:", err);
      }
    });
  }, [filters, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleHeroSearch = useCallback(
    (what: string, where: string) => {
      setFilters((prev) => ({
        ...prev,
        search_query: what || undefined,
        postcode: where || undefined,
      }));
    },
    [],
  );

  const handleFiltersChange = useCallback((next: SearchFilterParams) => {
    setFilters(next);
  }, []);

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSort(e.target.value as SortOption);
    },
    [],
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary via-brand-primary to-[#003629] py-16 px-4">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-brand-secondary/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              {pageTitle}
            </h1>
            {specialistBadge && (
              <span className="rounded-full bg-brand-secondary px-3 py-1 text-xs font-bold text-brand-primary">
                {specialistBadge} Regulated
              </span>
            )}
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-white/70">
            {pageSubtitle}
          </p>
          <HeroSearchBar
            initialWhat={filters.search_query ?? ""}
            initialWhere={filters.postcode ?? ""}
            onSearch={handleHeroSearch}
          />
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-[280px] shrink-0">
            <SearchFilters
              filters={filters}
              onChange={handleFiltersChange}
              hideCategoryFilter={!!defaultCategory}
            />
          </aside>

          {/* Results area */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Count + sort header */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-brand-primary/60">
                <span className="font-semibold text-brand-primary">{count}</span>{" "}
                provider{count !== 1 ? "s" : ""} found
              </p>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort-select"
                  className="text-xs text-brand-primary/60 shrink-0"
                >
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sort}
                  onChange={handleSortChange}
                  className="h-9 rounded-xl bg-surface-container-low px-3 text-sm text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results grid */}
            {isPending ? (
              <div className="space-y-4">
                <ProviderCardSkeleton />
                <ProviderCardSkeleton />
                <ProviderCardSkeleton />
              </div>
            ) : providers.length === 0 ? (
              <div className="rounded-2xl bg-surface-container-low py-20 text-center">
                <p className="font-heading font-semibold text-brand-primary">No providers found</p>
                <p className="text-sm mt-2 text-brand-primary/50">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {providers.map((provider) => (
                  <ProviderSearchCard
                    key={provider.id}
                    provider={provider}
                    category={
                      provider.services[0] ??
                      defaultCategory ??
                      "other"
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
