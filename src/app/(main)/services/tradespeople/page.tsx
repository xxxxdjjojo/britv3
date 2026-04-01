import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchProviders } from "@/services/marketplace/provider-service";
import { ProviderSearchPage } from "@/components/providers/ProviderSearchPage";
import type { ServiceCategory } from "@/types/marketplace";
import type { ServiceProviderPublicProfile } from "@/types/providers";

export const metadata: Metadata = {
  title: "Find a Tradesperson Near You | Britestate",
  description:
    "Search verified plumbers, electricians, builders, cleaners and more across the UK.",
};

const TRADESPERSON_CATEGORIES: { value: string; label: string }[] = [
  { value: "plumber", label: "Plumber" },
  { value: "electrician", label: "Electrician" },
  { value: "builder", label: "Builder" },
  { value: "handyman", label: "Handyman" },
  { value: "plasterer", label: "Plasterer" },
  { value: "painter", label: "Painter & Decorator" },
  { value: "carpenter", label: "Carpenter" },
  { value: "cleaning", label: "Cleaning" },
  { value: "landscaping", label: "Landscaping" },
  { value: "interior_design", label: "Interior Design" },
  { value: "architect", label: "Architect" },
  { value: "property_management", label: "Property Management" },
  { value: "pest_control", label: "Pest Control" },
  { value: "locksmith", label: "Locksmith" },
  { value: "other", label: "Other" },
];

type PageProps = Readonly<{
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}>;

export default async function TradespersonSearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const postcode = sp.postcode ?? undefined;
  const rawCategory = sp.category as ServiceCategory | undefined;
  const searchQuery = sp.q ?? undefined;

  // Only allow tradesperson categories — filter out professional service categories
  const TRADESPERSON_CATEGORY_VALUES = new Set<ServiceCategory>([
    "plumber",
    "electrician",
    "builder",
    "handyman",
    "plasterer",
    "painter",
    "carpenter",
    "cleaning",
    "landscaping",
    "interior_design",
    "architect",
    "property_management",
    "pest_control",
    "locksmith",
    "other",
  ]);

  const serviceCategory: ServiceCategory | undefined =
    rawCategory && TRADESPERSON_CATEGORY_VALUES.has(rawCategory)
      ? rawCategory
      : undefined;

  const supabase = await createClient();

  let initialProviders: ServiceProviderPublicProfile[] = [];
  let initialCount = 0;

  try {
    const result = await searchProviders(supabase, {
      service_category: serviceCategory,
      postcode,
      radius: 25,
      search_query: searchQuery,
    });
    initialProviders = result.data as unknown as ServiceProviderPublicProfile[];
    initialCount = result.count;
  } catch {
    // Graceful fallback — empty state shown to user
    initialProviders = [];
    initialCount = 0;
  }

  return (
    <ProviderSearchPage
      pageTitle="Find Your Master Craftsman"
      pageSubtitle="Compare verified tradespeople near you — read reviews, check badges, get quotes."
      defaultCategory={serviceCategory ?? null}
      categoryOptions={TRADESPERSON_CATEGORIES}
      initialProviders={initialProviders}
      initialCount={initialCount}
    />
  );
}
