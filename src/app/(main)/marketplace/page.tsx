import type { Metadata } from "next";
import { MarketplaceSearch } from "./MarketplaceSearch";

export const metadata: Metadata = {
  title: "Find a Service Provider | Britestate Marketplace",
  description:
    "Search trusted service providers for conveyancing, surveying, moving, cleaning, and more. Compare ratings and request quotes.",
};

type SearchParams = Promise<{
  category?: string;
  postcode?: string;
  radius?: string;
  min_rating?: string;
  q?: string;
}>;

export default async function MarketplacePage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Find a Service Provider
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse verified professionals for your property needs
        </p>
      </div>

      <MarketplaceSearch
        initialCategory={searchParams.category}
        initialPostcode={searchParams.postcode}
        initialRadius={searchParams.radius ? Number(searchParams.radius) : undefined}
        initialMinRating={searchParams.min_rating ? Number(searchParams.min_rating) : undefined}
        initialQuery={searchParams.q}
      />
    </div>
  );
}
