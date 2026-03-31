import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchProviders } from "@/services/marketplace/provider-service";
import { ProviderSearchPage } from "@/components/providers/ProviderSearchPage";
import type { ServiceCategory } from "@/types/marketplace";
import type { ServiceProviderPublicProfile } from "@/types/providers";

export const metadata: Metadata = {
  title: "Find a Letting Agent Near You | Britestate",
  description:
    "Compare letting agents and property managers. Tenant vetting, rent collection, and full management — find a letting agent near you.",
};

type PageProps = Readonly<{
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}>;

export default async function LettingAgentsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const postcode = sp.postcode ?? undefined;
  const searchQuery = sp.q ?? undefined;
  const defaultCat: ServiceCategory = "property_management";

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
      pageTitle="Find a Letting Agent"
      pageSubtitle="Compare letting agents and property managers — tenant vetting, rent collection, full management."
      defaultCategory={defaultCat}
      specialistBadge={null}
      initialProviders={initialProviders}
      initialCount={initialCount}
    />
  );
}
