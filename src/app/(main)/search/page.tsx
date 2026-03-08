import type { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { SearchPage } from "@/components/search/SearchPage";

type SearchPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const listing_type = params.listing_type as string | undefined;
  const postcode = params.postcode as string | undefined;

  const parts = ["Search Properties"];
  if (listing_type === "rent") parts[0] = "Properties to Rent";
  if (listing_type === "sale") parts[0] = "Properties for Sale";
  if (postcode) parts.push(`near ${postcode}`);

  return {
    title: `${parts.join(" ")} | Britestate`,
    description: `Find your perfect property. Browse listings ${postcode ? `near ${postcode}` : "across the UK"} with Britestate.`,
  };
}

export default async function SearchPageRoute({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;
  const queryClient = new QueryClient();

  // Build URL string for prefetch
  const url = new URL("/api/search", "http://localhost");
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    if (Array.isArray(value)) {
      url.searchParams.set(key, value.join(","));
    } else {
      url.searchParams.set(key, value);
    }
  }

  // Build a stable query key matching the client hook
  const cleanParams: Record<string, string | number | boolean | string[]> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    if (Array.isArray(value)) {
      cleanParams[key] = value;
    } else {
      cleanParams[key] = value;
    }
  }
  const queryKey = [
    "search",
    JSON.stringify(
      Object.entries(cleanParams).sort(([a], [b]) => a.localeCompare(b)),
    ),
  ];

  // Prefetch search results (server-side)
  await queryClient.prefetchInfiniteQuery({
    queryKey,
    queryFn: async () => {
      // Server-side fetch using internal API
      try {
        const response = await fetch(url.toString(), {
          cache: "no-store",
        });
        if (!response.ok) return { data: [], count: 0, cursor: null };
        return response.json();
      } catch {
        return { data: [], count: 0, cursor: null };
      }
    },
    initialPageParam: undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchPage />
    </HydrationBoundary>
  );
}
