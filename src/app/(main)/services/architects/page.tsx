import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchProviders } from "@/services/marketplace/provider-service";
import { ProviderSearchPage } from "@/components/providers/ProviderSearchPage";
import type { ServiceCategory } from "@/types/marketplace";
import type { ServiceProviderPublicProfile } from "@/types/providers";

export const metadata: Metadata = {
  title: "Find an Architect Near You",
  description:
    "Compare architects for extensions, renovations, and new builds. Find an architect near you on Britestate.",
};

type PageProps = Readonly<{
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}>;

export default async function ArchitectsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const postcode = sp.postcode ?? undefined;
  const searchQuery = sp.q ?? undefined;
  const defaultCat: ServiceCategory = "architect";

  const supabase = await createClient();
  let initialProviders: ServiceProviderPublicProfile[] = [];
  let initialCount = 0;

  try {
    const result = await searchProviders(supabase, {
      service_category: defaultCat,
      postcode,
      radius: 25,
      search_query: searchQuery,
    });
    initialProviders = result.data as unknown as ServiceProviderPublicProfile[];
    initialCount = result.count;
  } catch {
    initialProviders = [];
    initialCount = 0;
  }

  return (
    <ProviderSearchPage
      pageTitle="Find an Architect"
      pageSubtitle="Compare architects for extensions, renovations, and new builds."
      defaultCategory={defaultCat}
      specialistBadge="RIBA"
      initialProviders={initialProviders}
      initialCount={initialCount}
    />
  );
}
