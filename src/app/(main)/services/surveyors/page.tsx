import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchProviders } from "@/services/marketplace/provider-service";
import { ProviderSearchPage } from "@/components/providers/ProviderSearchPage";
import type { ServiceCategory } from "@/types/marketplace";
import type { ServiceProviderPublicProfile } from "@/types/providers";

export const metadata: Metadata = {
  title: "Find a Surveyor Near You",
  description:
    "Compare RICS-accredited surveyors. Building surveys, valuations, and homebuyer reports across the UK.",
};

type PageProps = Readonly<{
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}>;

export default async function SurveyorsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const postcode = sp.postcode ?? undefined;
  const searchQuery = sp.q ?? undefined;
  const defaultCat: ServiceCategory = "surveying";

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
      pageTitle="Find a Surveyor"
      pageSubtitle="Compare RICS-accredited surveyors — building surveys, valuations, homebuyer reports."
      defaultCategory={defaultCat}
      specialistBadge="RICS"
      initialProviders={initialProviders}
      initialCount={initialCount}
    />
  );
}
